const express = require("express");
const sequelize = require("../db");
const HomeSection = require("../models/HomeSection");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.get("/", async (req, res) => {
  const items = await HomeSection.findAll({ order: [["order", "ASC"]] });
  res.json(items);
});

// Sem create/delete: as chaves são fixas (uma por componente real da home).
// Reordena por "key" em vez de id — mais estável pro seed/admin.
router.put("/reorder", requireAuth, async (req, res) => {
  const { keys } = req.body;
  if (!Array.isArray(keys)) return res.status(400).json({ error: "keys deve ser um array" });
  await sequelize.transaction((t) =>
    Promise.all(keys.map((key, order) => HomeSection.update({ order }, { where: { key }, transaction: t }))),
  );
  res.json(await HomeSection.findAll({ order: [["order", "ASC"]] }));
});

router.put("/:key/visible", requireAuth, async (req, res) => {
  const item = await HomeSection.findOne({ where: { key: req.params.key } });
  if (!item) return res.status(404).json({ error: "Not found" });
  await item.update({ visible: !!req.body.visible });
  res.json(item);
});

module.exports = router;
