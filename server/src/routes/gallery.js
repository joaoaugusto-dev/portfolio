const express = require("express");
const GalleryItem = require("../models/GalleryItem");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.get("/", async (req, res) => {
  // Ordem final (por data de evento, mais recente primeiro) é decidida no
  // front (client/lib/gallerySort.js) — aqui só uma base estável.
  const items = await GalleryItem.findAll({ order: [["createdAt", "ASC"]] });
  res.json(items);
});

router.post("/", requireAuth, async (req, res) => {
  const item = await GalleryItem.create(req.body);
  res.status(201).json(item);
});

router.put("/:id", requireAuth, async (req, res) => {
  const item = await GalleryItem.findByPk(req.params.id);
  if (!item) return res.status(404).json({ error: "Not found" });
  await item.update(req.body);
  res.json(item);
});

router.delete("/:id", requireAuth, async (req, res) => {
  const item = await GalleryItem.findByPk(req.params.id);
  if (!item) return res.status(404).json({ error: "Not found" });
  await item.destroy();
  res.status(204).end();
});

module.exports = router;
