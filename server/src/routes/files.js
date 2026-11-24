const express = require("express");
const multer = require("multer");
const rateLimit = require("express-rate-limit");
const { Op } = require("sequelize");
const Media = require("../models/Media");
const requireAuth = require("../middleware/requireAuth");
const { extractPoster, extractFrameAt, compressPoster } = require("../lib/poster");
const { uploadObject, streamObject, deleteObjects, headObject } = require("../lib/storage");
const { ensureRoom, addUsage, removeUsage, currentUsage, CAP_BYTES } = require("../lib/storageCap");
const asyncRoute = require("../middleware/asyncRoute");

const router = express.Router();
// Só a miniatura passa pelo multer (imagem pequena, em memória). O vídeo/arquivo
// em si vai em streaming pro bucket (ver PUT /upload/:name), sem bufferizar.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

// GETs (raw/:name, raw/:name/poster, meta/:name) são públicos de propósito — o
// site inteiro depende deles pra mostrar imagem/vídeo. Sem auth, então sem esse
// limite qualquer script podia martelar o servidor.
// skip: pedido sem X-Forwarded-For não veio pelo túnel da Cloudflare (que sempre
// põe esse header) — é o Next chamando pela rede interna (API_INTERNAL_URL).
// Sem isso, toda imagem do site, proxiada pelo Next, contava no limite de UM IP.
const publicReadLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !req.headers["x-forwarded-for"],
});

function kindOf(mimetype) {
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/")) return "video";
  if (mimetype === "application/pdf") return "pdf";
  return "other";
}

// O nome guardado no banco é "slug.ext" (a chave real no bucket). O link
// compartilhado, porém, não mostra a extensão — só o slug.
function stripExt(name) {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(0, dot) : name;
}

const posterKey = (name) => `${name}.poster.jpg`;

// O link do bucket nunca sai daqui. O front recebe dois caminhos no domínio do site:
// a página (/midia/<slug>) e o arquivo cru (/midia/<slug>/arquivo, reescrito pro Next).
const pagePath = (name) => `/midia/${encodeURIComponent(stripExt(name))}`;
const rawPath = (name) => `${pagePath(name)}/arquivo`;

// "Sidera Predict.WEBP" -> "sidera-predict.webp"
function slugify(name) {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : "";
  const slug =
    base
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "arquivo";
  return ext ? `${slug}.${ext}` : slug;
}

// URLs públicas só carregam o slug (sem extensão); o nome real ("slug.ext",
// a chave no bucket) mora só no banco. Resolve um a partir do outro aqui.
function findBySlug(slug) {
  return Media.findOne({ where: { [Op.or]: [{ name: slug }, { name: { [Op.like]: `${slug}.%` } }] } });
}

const present = (m) => {
  const v = new Date(m.updatedAt).getTime();
  return {
    name: m.name,
    title: m.title,
    description: m.description,
    kind: m.kind,
    mimetype: m.mimetype,
    size: m.size,
    createdAt: m.createdAt,
    // ?v= é o que muda a URL — cache de CDN é sempre por URL exata. Sem isso,
    // um vídeo enviado antes do fix de Cache-Control em Range (raw/:name)
    // ficava com uma resposta errada presa no CDN pra sempre (immutable,
    // 1 ano): a query nova troca a chave de cache e destrava sem precisar
    // invalidar nada manualmente.
    url: `${rawPath(m.name)}?v=${v}`,
    pageUrl: pagePath(m.name),
    posterUrl: m.kind === "video" ? `${rawPath(m.name)}/poster?v=${v}` : undefined,
  };
};

router.get("/", requireAuth, asyncRoute(async (req, res) => {
  const files = await Media.findAll({ order: [["createdAt", "DESC"]] });
  res.json(files.map(present));
}));

// Uso atual do bucket vs o teto que o app se impõe — pro admin ver de longe antes de
// chegar perto do limite, não só descobrir quando um upload já foi recusado.
router.get("/usage", requireAuth, asyncRoute(async (req, res) => {
  res.json({ bytesUsed: await currentUsage(), capBytes: CAP_BYTES });
}));

// Público: alimenta a página /midia/<slug> do site.
router.get("/meta/:name", publicReadLimit, asyncRoute(async (req, res) => {
  const media = await findBySlug(req.params.name);
  if (!media) return res.status(404).json({ error: "Arquivo não encontrado" });
  res.json(present(media));
}));

// SVG e HTML rodam script quando abertos direto no navegador — "Arquivos" aceita
// qualquer tipo de propósito (kind "outros"), então em vez de bloquear o upload,
// esses tipos saem forçados a baixar em vez de renderizar no domínio do site.
const executableInBrowser = /^(text\/html|application\/xhtml\+xml|image\/svg\+xml|(text|application)\/javascript)/i;

// Público de propósito: é o que as <img>/<video> do site usam. Sem auth porque
// header não vai em src="", e o conteúdo é material público do portfólio.
// Repassa o Range do navegador pro bucket e dá pipe direto na resposta (sem
// bufferizar) — essencial pra <video>: sem isso, tocar, arrastar a barra ou
// escolher frame baixava o arquivo inteiro do zero a cada vez.
router.get("/raw/:name", publicReadLimit, asyncRoute(async (req, res) => {
  const media = await findBySlug(req.params.name);
  if (!media) return res.status(404).json({ error: "Arquivo não encontrado" });

  const range = req.headers.range;
  const obj = await streamObject(media.name, range);
  if (!obj) return res.status(404).json({ error: "Arquivo não encontrado" });

  // mimetype do banco primeiro: o bucket deduz o tipo só pela extensão.
  const type = media.mimetype || obj.contentType || "application/octet-stream";
  res.set("Content-Type", type);
  res.set("X-Content-Type-Options", "nosniff");
  res.set("Accept-Ranges", "bytes");
  if (obj.contentLength != null) res.set("Content-Length", obj.contentLength);
  if (executableInBrowser.test(type)) res.set("Content-Disposition", "attachment");
  // Com Range, NUNCA deixa um CDN (na frente de /midia/.../arquivo)
  // guardar a resposta: ele cacheia por URL, sem levar o Range em conta, então um
  // pedido pelo início do vídeo podia receber de volta bytes cacheados de um
  // pedido anterior por outro trecho — o vídeo simplesmente não tocava. Sem
  // Range (arquivo inteiro, raro num <video>) não tem ambiguidade nenhuma, cache
  // longo é seguro.
  res.set("Cache-Control", range ? "private, no-store" : "public, max-age=31536000, immutable");
  if (range && obj.contentRange) {
    res.status(206);
    res.set("Content-Range", obj.contentRange);
  }
  // Cliente cancelou (seek novo, fechou a aba)? Corta o download do bucket junto —
  // é exatamente esse corte que faltava com o buffer inteiro em memória.
  req.on("close", () => obj.stream.destroy());
  obj.stream.pipe(res);
}));

// Frame extraído do vídeo no upload (ver lib/poster). Usado como og:image do
// link compartilhado e como poster do <video> enquanto ele carrega.
router.get("/raw/:name/poster", publicReadLimit, asyncRoute(async (req, res) => {
  const media = await findBySlug(req.params.name);
  if (!media || media.kind !== "video") return res.status(404).json({ error: "Sem miniatura" });

  const obj = await streamObject(posterKey(media.name));
  if (!obj) return res.status(404).json({ error: "Sem miniatura" });

  res.set("Content-Type", "image/jpeg");
  res.set("Cache-Control", "public, max-age=31536000, immutable");
  if (obj.contentLength != null) res.set("Content-Length", obj.contentLength);
  obj.stream.pipe(res);
}));

// 1) Reserva o nome e confere o teto. Devolve o caminho do PUT (2) — ainda não
// cria o registro em Media.
router.post("/presign", requireAuth, asyncRoute(async (req, res) => {
  const { filename, mimetype, size, name: customName } = req.body;
  if (!filename || !mimetype || !size) {
    return res.status(400).json({ error: "filename, mimetype e size são obrigatórios" });
  }

  const ext = filename.split(".").pop();
  const name = slugify(customName ? `${customName}.${ext}` : filename);

  if (await Media.findOne({ where: { name } }))
    return res.status(409).json({ error: `Já existe um arquivo chamado "${name}"` });

  try {
    await ensureRoom(Number(size));
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }

  res.json({ name, uploadUrl: `/api/files/upload/${encodeURIComponent(name)}` });
}));

// 2) Os bytes, em streaming: o corpo do PUT vai direto pro bucket, sem passar
// pela memória do processo. Teto real de tamanho: o túnel da Cloudflare corta
// corpo acima de 100MB (plano free) — arquivo maior precisaria de envio em partes.
router.put("/upload/:name", requireAuth, asyncRoute(async (req, res) => {
  const { name } = req.params;
  // Só nomes que /presign poderia ter gerado: barra "covers/..." e "x.poster.jpg".
  if (name !== slugify(name)) return res.status(400).json({ error: "Nome inválido" });
  if (await Media.findOne({ where: { name } }))
    return res.status(409).json({ error: `Já existe um arquivo chamado "${name}"` });

  const size = Number(req.headers["content-length"]);
  if (!size) return res.status(411).json({ error: "Content-Length obrigatório" });
  try {
    await ensureRoom(size);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }

  await uploadObject(name, req, req.headers["content-type"] || "application/octet-stream", size);
  res.status(204).end();
}));

// 3) O navegador chama isso depois que o PUT (2) terminou: confirma
// que o objeto existe de fato (nunca confia só no que o cliente diz) e cria o
// registro. A extração do poster de vídeo roda depois, em segundo plano (ver
// generatePosterInBackground) — não segura a resposta do upload esperando o
// ffmpeg, e uma falha nele não desfaz um upload que já deu certo.
router.post("/complete", requireAuth, asyncRoute(async (req, res) => {
  const { name, title, description } = req.body;
  if (!name) return res.status(400).json({ error: "name é obrigatório" });

  const head = await headObject(name);
  if (!head) return res.status(404).json({ error: "Upload não encontrado — tente enviar de novo" });

  if (await Media.findOne({ where: { name } }))
    return res.status(409).json({ error: `Já existe um arquivo chamado "${name}"` });

  const mimetype = head.contentType || "application/octet-stream";
  const kind = kindOf(mimetype);
  const size = head.contentLength || 0;

  const media = await Media.create({
    name,
    title: title || name,
    description: description || "",
    kind,
    mimetype,
    size,
  });
  await addUsage(size);

  res.status(201).json(present(media));

  if (kind === "video") generatePosterInBackground(name);
}));

// Melhor-esforço, disparado depois de já ter respondido: se a extração do
// frame falhar (codec exótico, vídeo enorme, etc.), o upload já foi
// concluído do ponto de vista do usuário e não deve quebrar por isso.
async function generatePosterInBackground(name) {
  try {
    const poster = await extractPoster(name);
    await uploadObject(posterKey(name), poster, "image/jpeg");
    await addUsage(poster.length);
    // updatedAt muda a versão da URL (?v=) — sem isso o front não sabe que uma
    // miniatura nova apareceu depois da resposta inicial (que foi sem ela).
    await Media.update({ updatedAt: new Date() }, { where: { name } });
  } catch (err) {
    console.error(`Falha ao gerar poster para "${name}":`, err.message);
  }
}

// Miniatura escolhida à mão: ou uma imagem enviada direto, ou um instante do
// próprio vídeo já armazenado (o admin manda o frame recortado no browser via
// canvas — ver FilesAdmin — então aqui é sempre "file", nunca atSeconds; o
// atSeconds fica como caminho alternativo caso o recorte no browser falhe).
router.post("/:name/poster", requireAuth, upload.single("file"), asyncRoute(async (req, res) => {
  const media = await Media.findOne({ where: { name: req.params.name } });
  if (!media) return res.status(404).json({ error: "Arquivo não encontrado" });
  if (media.kind !== "video") return res.status(400).json({ error: "Só vídeos têm miniatura" });

  try {
    let poster;
    if (req.file) {
      poster = await compressPoster(req.file.buffer);
    } else if (req.body.atSeconds) {
      poster = await extractFrameAt(media.name, Number(req.body.atSeconds));
    } else {
      return res.status(400).json({ error: "Envie uma imagem ou um instante do vídeo" });
    }

    await ensureRoom(poster.length);
    // Antes de gravar por cima, desconta o que a miniatura anterior ocupava —
    // senão cada troca de miniatura só soma, nunca substitui, no contador.
    const previous = await headObject(posterKey(media.name));
    if (previous) await removeUsage(previous.contentLength || 0);

    await uploadObject(posterKey(media.name), poster, "image/jpeg");
    await addUsage(poster.length);

    // Carimba updatedAt à força: é o que muda a versão da URL (?v=) — um update
    // sem mudança de verdade o Sequelize pode simplesmente pular.
    await media.update({ updatedAt: new Date() });
    res.json(present(media));
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "Falha ao gerar a miniatura" });
  }
}));

// Edita só título/descrição — trocar o arquivo é excluir e subir de novo.
router.put("/:name", requireAuth, asyncRoute(async (req, res) => {
  const media = await Media.findOne({ where: { name: req.params.name } });
  if (!media) return res.status(404).json({ error: "Arquivo não encontrado" });
  await media.update({ title: req.body.title, description: req.body.description });
  res.json(present(media));
}));

router.delete("/:name", requireAuth, asyncRoute(async (req, res) => {
  const media = await Media.findOne({ where: { name: req.params.name } });
  if (!media) return res.status(404).json({ error: "Arquivo não encontrado" });

  const posterObj = media.kind === "video" ? await headObject(posterKey(media.name)) : null;
  await deleteObjects([media.name, posterKey(media.name)]);
  await removeUsage(media.size || 0);
  if (posterObj) await removeUsage(posterObj.contentLength || 0);

  await media.destroy();
  res.status(204).end();
}));

module.exports = router;
