const express = require("express");
const sequelize = require("../db");
const Skill = require("../models/Skill");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.get("/", async (req, res) => {
  const items = await Skill.findAll({ order: [["order", "ASC"]] });
  res.json(items);
});

router.post("/", requireAuth, async (req, res) => {
  const item = await Skill.create(req.body);
  res.status(201).json(item);
});

// Antes de "/:id", senão o Express casa "reorder" como um id. O front manda
// só os ids de um `type` por vez (tech ou soft reordenam sem se misturar).
router.put("/reorder", requireAuth, async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ error: "ids deve ser um array" });
  await sequelize.transaction((t) =>
    Promise.all(ids.map((id, order) => Skill.update({ order }, { where: { id }, transaction: t }))),
  );
  res.json(await Skill.findAll({ order: [["order", "ASC"]] }));
});

router.put("/:id", requireAuth, async (req, res) => {
  const item = await Skill.findByPk(req.params.id);
  if (!item) return res.status(404).json({ error: "Not found" });
  await item.update(req.body);
  res.json(item);
});

router.delete("/:id", requireAuth, async (req, res) => {
  const item = await Skill.findByPk(req.params.id);
  if (!item) return res.status(404).json({ error: "Not found" });
  await item.destroy();
  res.status(204).end();
});

module.exports = router;
