const express = require("express");
const multer = require("multer");
const supabase = require("../supabase");
const Media = require("../models/Media");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 200 * 1024 * 1024 } });
const bucket = process.env.SUPABASE_BUCKET || "uploads";

function kindOf(mimetype) {
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/")) return "video";
  if (mimetype === "application/pdf") return "pdf";
  return "other";
}

// O link do Supabase nunca sai daqui. O front recebe dois caminhos no domínio do site:
// a página (/midia/<nome>) e o arquivo cru (/midia/<nome>/arquivo, reescrito pro Next).
const pagePath = (name) => `/midia/${encodeURIComponent(name)}`;
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
});

router.get("/", requireAuth, async (req, res) => {
  const files = await Media.findAll({ order: [["createdAt", "DESC"]] });
  res.json(files.map(present));
});

// Público: alimenta a página /midia/<nome> do site.
router.get("/meta/:name", async (req, res) => {
  const media = await Media.findOne({ where: { name: req.params.name } });
  if (!media) return res.status(404).json({ error: "Arquivo não encontrado" });
  res.json(present(media));
});

// SVG e HTML rodam script quando abertos direto no navegador — "Arquivos" aceita
// qualquer tipo de propósito (kind "outros"), então em vez de bloquear o upload,
// esses tipos saem forçados a baixar em vez de renderizar no domínio do site.
const executableInBrowser = /^(text\/html|application\/xhtml\+xml|image\/svg\+xml|(text|application)\/javascript)/i;

// Público de propósito: é o que as <img>/<video> do site usam. Sem auth porque
// header não vai em src="", e o conteúdo é material público do portfólio.
router.get("/raw/:name", async (req, res) => {
  const { data, error } = await supabase.storage.from(bucket).download(req.params.name);
  if (error) return res.status(404).json({ error: "Arquivo não encontrado" });

  const type = data.type || "application/octet-stream";
  res.set("Content-Type", type);
  res.set("X-Content-Type-Options", "nosniff");
  if (executableInBrowser.test(type)) res.set("Content-Disposition", "attachment");
  res.set("Cache-Control", "public, max-age=31536000, immutable");
  res.send(Buffer.from(await data.arrayBuffer()));
});

router.post("/", requireAuth, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Nenhum arquivo enviado" });

  // Nome escolhido no upload; sem ele, o nome original. Sempre com a extensão do arquivo.
  const ext = req.file.originalname.split(".").pop();
  const name = slugify(req.body.name ? `${req.body.name}.${ext}` : req.file.originalname);

  if (await Media.findOne({ where: { name } }))
    return res.status(409).json({ error: `Já existe um arquivo chamado "${name}"` });

  const { error } = await supabase.storage.from(bucket).upload(name, req.file.buffer, {
    contentType: req.file.mimetype,
    upsert: false,
  });
  if (error) {
    const taken = /exists|duplicate/i.test(error.message);
    return res
      .status(taken ? 409 : 500)
      .json({ error: taken ? `Já existe um arquivo chamado "${name}"` : error.message });
  }

  const media = await Media.create({
    name,
    title: req.body.title || req.file.originalname,
    description: req.body.description || "",
    kind: kindOf(req.file.mimetype),
    mimetype: req.file.mimetype,
    size: req.file.size,
  });
  res.status(201).json(present(media));
});

// Edita só título/descrição — trocar o arquivo é excluir e subir de novo.
router.put("/:name", requireAuth, async (req, res) => {
  const media = await Media.findOne({ where: { name: req.params.name } });
  if (!media) return res.status(404).json({ error: "Arquivo não encontrado" });
  await media.update({ title: req.body.title, description: req.body.description });
  res.json(present(media));
});

router.delete("/:name", requireAuth, async (req, res) => {
  const { error } = await supabase.storage.from(bucket).remove([req.params.name]);
  if (error) return res.status(500).json({ error: error.message });
  await Media.destroy({ where: { name: req.params.name } });
  res.status(204).end();
});

module.exports = router;
