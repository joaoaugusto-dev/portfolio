const express = require("express");
const SiteText = require("../models/SiteText");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.get("/", async (req, res) => {
  const items = await SiteText.findAll({ order: [["group", "ASC"], ["order", "ASC"], ["id", "ASC"]] });
  res.json(items);
});

router.post("/", requireAuth, async (req, res) => {
  const item = await SiteText.create(req.body);
  res.status(201).json(item);
});

router.put("/:id", requireAuth, async (req, res) => {
  const item = await SiteText.findByPk(req.params.id);
  if (!item) return res.status(404).json({ error: "Not found" });
  await item.update(req.body);
  res.json(item);
});

router.delete("/:id", requireAuth, async (req, res) => {
  const item = await SiteText.findByPk(req.params.id);
  if (!item) return res.status(404).json({ error: "Not found" });
  await item.destroy();
  res.status(204).end();
});

module.exports = router;
