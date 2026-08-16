const express = require("express");
const multer = require("multer");
const rateLimit = require("express-rate-limit");
const { Op } = require("sequelize");
const Media = require("../models/Media");
const requireAuth = require("../middleware/requireAuth");
const { extractPoster, extractFrameAt, compressPoster } = require("../lib/poster");
const { uploadObject, downloadObject, streamObject, deleteObjects, headObject, presignPutUrl } = require("../lib/r2");
const { ensureRoom, addUsage, removeUsage, currentUsage, CAP_BYTES } = require("../lib/storageCap");
const asyncRoute = require("../middleware/asyncRoute");

const router = express.Router();
// Só a miniatura passa pelo servidor agora (imagem pequena) — o vídeo/arquivo em
// si vai direto do navegador pro R2 via URL assinada (ver /presign), sem passar
// pela memória do processo. É o que permite arquivo grande sem derrubar o Render.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

// GETs (raw/:name, raw/:name/poster, meta/:name) são públicos de propósito — o
// site inteiro depende deles pra mostrar imagem/vídeo. Sem auth, então sem esse
// limite qualquer script podia martelar e comer a cota de leitura (Class B) do R2.
const publicReadLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 600, standardHeaders: true, legacyHeaders: false });

function kindOf(mimetype) {
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/")) return "video";
  if (mimetype === "application/pdf") return "pdf";
  return "other";
}

// O nome guardado no banco é "slug.ext" (a chave real no R2). O link
// compartilhado, porém, não mostra a extensão — só o slug.
function stripExt(name) {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(0, dot) : name;
}

const posterKey = (name) => `${name}.poster.jpg`;

// O link do R2 nunca sai daqui. O front recebe dois caminhos no domínio do site:
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
// a chave no R2) mora só no banco. Resolve um a partir do outro aqui.
function findBySlug(slug) {
  return Media.findOne({ where: { [Op.or]: [{ name: slug }, { name: { [Op.like]: `${slug}.%` } }] } });
}

const present = (m) => ({
  name: m.name,
  title: m.title,
  description: m.description,
  kind: m.kind,
  mimetype: m.mimetype,
  size: m.size,
  createdAt: m.createdAt,
  url: rawPath(m.name),
  pageUrl: pagePath(m.name),
  // ?v= muda sempre que a miniatura é trocada — sem isso o cache "immutable"
  // da rota de poster (1 ano) segurava a imagem antiga depois de escolher outra.
  posterUrl: m.kind === "video" ? `${rawPath(m.name)}/poster?v=${new Date(m.updatedAt).getTime()}` : undefined,
});

router.get("/", requireAuth, asyncRoute(async (req, res) => {
  const files = await Media.findAll({ order: [["createdAt", "DESC"]] });
  res.json(files.map(present));
}));

// Uso atual do R2 vs o teto que o app se impõe — pro admin ver de longe antes de
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
// Repassa o Range do navegador pro R2 e dá pipe direto na resposta (sem
// bufferizar) — essencial pra <video>: sem isso, tocar, arrastar a barra ou
// escolher frame baixava o arquivo inteiro do zero a cada vez.
router.get("/raw/:name", publicReadLimit, asyncRoute(async (req, res) => {
  const media = await findBySlug(req.params.name);
  if (!media) return res.status(404).json({ error: "Arquivo não encontrado" });

  const range = req.headers.range;
  const obj = await streamObject(media.name, range);
  if (!obj) return res.status(404).json({ error: "Arquivo não encontrado" });

  const type = obj.contentType || media.mimetype || "application/octet-stream";
  res.set("Content-Type", type);
  res.set("X-Content-Type-Options", "nosniff");
  res.set("Accept-Ranges", "bytes");
  if (obj.contentLength != null) res.set("Content-Length", obj.contentLength);
  if (executableInBrowser.test(type)) res.set("Content-Disposition", "attachment");
  // Com Range, NUNCA deixa o CDN (Vercel, na frente do rewrite /midia/.../arquivo)
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
  // Cliente cancelou (seek novo, fechou a aba)? Corta o download do R2 junto —
  // é exatamente esse corte que faltava com o buffer inteiro em memória.
  req.on("close", () => obj.stream.destroy());
  obj.stream.pipe(res);
}));

// Frame extraído do vídeo no upload (ver lib/poster). Usado como og:image do
// link compartilhado e como poster do <video> enquanto ele carrega.
router.get("/raw/:name/poster", publicReadLimit, asyncRoute(async (req, res) => {
  const media = await findBySlug(req.params.name);
  if (!media || media.kind !== "video") return res.status(404).json({ error: "Sem miniatura" });

  const obj = await downloadObject(posterKey(media.name));
  if (!obj) return res.status(404).json({ error: "Sem miniatura" });

  res.set("Content-Type", "image/jpeg");
  res.set("Cache-Control", "public, max-age=31536000, immutable");
  res.send(obj.buffer);
}));

// 1) Pede uma URL assinada de PUT — o navegador sobe os bytes direto pro R2 a
// partir daqui, sem passar pelo servidor. Ainda não cria o registro em Media.
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

  const uploadUrl = await presignPutUrl(name, mimetype);
  res.json({ name, uploadUrl });
}));

// 2) O navegador chama isso depois que o PUT direto pro R2 terminou: confirma
// que o objeto existe de fato (nunca confia só no que o cliente diz) e cria o
// registro. A extração do poster de vídeo roda depois, em segundo plano (ver
// generatePosterInBackground) — baixar o vídeo de volta + rodar ffmpeg dentro
// da própria requisição estourava o timeout do proxy da Cloudflare/Render em
// vídeo grande, derrubando a conexão com 502 antes do registro nem existir.
router.post("/complete", requireAuth, asyncRoute(async (req, res) => {
  const { name, title, description } = req.body;
  if (!name) return res.status(400).json({ error: "name é obrigatório" });

  const head = await headObject(name);
  if (!head) return res.status(404).json({ error: "Upload não encontrado — tente enviar de novo" });

  if (await Media.findOne({ where: { name } }))
    return res.status(409).json({ error: `Já existe um arquivo chamado "${name}"` });

  const mimetype = head.ContentType || "application/octet-stream";
  const kind = kindOf(mimetype);
  const size = head.ContentLength || 0;

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
    const obj = await downloadObject(name);
    if (!obj) return;
    const poster = await extractPoster(obj.buffer);
    if (!poster) return;
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
      const obj = await downloadObject(media.name);
      if (!obj) return res.status(404).json({ error: "Arquivo não encontrado" });
      poster = await extractFrameAt(obj.buffer, Number(req.body.atSeconds));
    } else {
      return res.status(400).json({ error: "Envie uma imagem ou um instante do vídeo" });
    }

    await ensureRoom(poster.length);
    // Antes de gravar por cima, desconta o que a miniatura anterior ocupava —
    // senão cada troca de miniatura só soma, nunca substitui, no contador.
    const previous = await downloadObject(posterKey(media.name));
    if (previous) await removeUsage(previous.buffer.length);

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

  const posterObj = media.kind === "video" ? await downloadObject(posterKey(media.name)) : null;
  await deleteObjects([media.name, posterKey(media.name)]);
  await removeUsage(media.size || 0);
  if (posterObj) await removeUsage(posterObj.buffer.length);

  await media.destroy();
  res.status(204).end();
}));

module.exports = router;
