const express = require("express");
const sequelize = require("../db");
const GalleryItem = require("../models/GalleryItem");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.get("/", async (req, res) => {
  const items = await GalleryItem.findAll({ order: [["order", "ASC"]] });
  res.json(items);
});

router.post("/", requireAuth, async (req, res) => {
  const item = await GalleryItem.create(req.body);
  res.status(201).json(item);
});

// Antes de "/:id", senão o Express casa "reorder" como um id.
router.put("/reorder", requireAuth, async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ error: "ids deve ser um array" });
  await sequelize.transaction((t) =>
    Promise.all(ids.map((id, order) => GalleryItem.update({ order }, { where: { id }, transaction: t }))),
  );
  res.json(await GalleryItem.findAll({ order: [["order", "ASC"]] }));
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
