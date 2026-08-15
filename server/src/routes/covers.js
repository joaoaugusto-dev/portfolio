const crypto = require("crypto");
const express = require("express");
const multer = require("multer");
const rateLimit = require("express-rate-limit");
const sharp = require("sharp");
const requireAuth = require("../middleware/requireAuth");
const { uploadObject, downloadObject } = require("../lib/r2");
const { ensureRoom, addUsage } = require("../lib/storageCap");
const asyncRoute = require("../middleware/asyncRoute");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
const publicReadLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 600, standardHeaders: true, legacyHeaders: false });

// Prefixo dentro do mesmo bucket do R2 usado pra Arquivos — separa capa de mídia
// sem precisar criar (e configurar CORS de) um segundo bucket no Cloudflare.
const prefix = "covers/";

router.post("/", requireAuth, upload.single("file"), asyncRoute(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Nenhuma imagem enviada" });
  if (!req.file.mimetype.startsWith("image/"))
    return res.status(400).json({ error: "Envie uma imagem" });

  // 1600px cobre até o card mais largo do site; acima disso só pesa. quality 82 no
  // webp fica visualmente idêntico ao original e corta a maior parte do peso.
  const webp = await sharp(req.file.buffer)
    .rotate()
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  try {
    await ensureRoom(webp.length);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }

  const key = `${crypto.randomUUID()}.webp`;
  await uploadObject(prefix + key, webp, "image/webp");
  await addUsage(webp.length);

  // Sempre proxiado pelo nosso domínio (nunca a URL crua do R2) — mesmo padrão
  // de /midia: o front nem precisa saber que existe um R2 por trás.
  res.status(201).json({ url: `/api/covers/${key}` });
}));

// Público de propósito (capa de projeto/curso na home, sem auth) — mesma
// proteção de taxa das rotas de mídia, já que também não exige login.
router.get("/:key", publicReadLimit, asyncRoute(async (req, res) => {
  const obj = await downloadObject(prefix + req.params.key);
  if (!obj) return res.status(404).json({ error: "Imagem não encontrada" });
  res.set("Content-Type", obj.contentType || "image/webp");
  res.set("Cache-Control", "public, max-age=31536000, immutable");
  res.send(obj.buffer);
}));

module.exports = router;
