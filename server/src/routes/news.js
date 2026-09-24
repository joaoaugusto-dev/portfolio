const express = require("express");
const NewsItem = require("../models/NewsItem");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

const list = () => NewsItem.findAll({ order: [["date", "DESC NULLS LAST"], ["id", "DESC"]] });
router.list = list;

router.get("/", async (req, res) => res.json(await list()));

router.post("/", requireAuth, async (req, res) => {
  res.status(201).json(await NewsItem.create(req.body));
});

router.put("/:id", requireAuth, async (req, res) => {
  const item = await NewsItem.findByPk(req.params.id);
  if (!item) return res.status(404).json({ error: "Not found" });
  await item.update(req.body);
  res.json(item);
});

router.delete("/:id", requireAuth, async (req, res) => {
  const item = await NewsItem.findByPk(req.params.id);
  if (!item) return res.status(404).json({ error: "Not found" });
  await item.destroy();
  res.status(204).end();
});

module.exports = router;
