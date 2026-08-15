const crypto = require("crypto");
const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const supabase = require("../supabase");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
// Bucket separado do de Arquivos: capas de curso/projeto são só imagem, geradas pelo
// servidor (sempre .webp), e não aparecem na aba Arquivos nem têm registro em Media.
const bucket = process.env.SUPABASE_COVERS_BUCKET || "covers";

router.post("/", requireAuth, upload.single("file"), async (req, res) => {
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

  const name = `${crypto.randomUUID()}.webp`;
  const { error } = await supabase.storage.from(bucket).upload(name, webp, {
    contentType: "image/webp",
    upsert: false,
  });
  if (error) return res.status(500).json({ error: error.message });

  const { data } = supabase.storage.from(bucket).getPublicUrl(name);
  res.status(201).json({ url: data.publicUrl });
});

module.exports = router;
