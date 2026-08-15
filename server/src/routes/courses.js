const express = require("express");
const sequelize = require("../db");
const Course = require("../models/Course");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.get("/", async (req, res) => {
  const courses = await Course.findAll({ order: [["order", "ASC"]] });
  res.json(courses);
});

router.post("/", requireAuth, async (req, res) => {
  const course = await Course.create(req.body);
  res.status(201).json(course);
});

// Antes de "/:id", senão o Express casa "reorder" como um id.
router.put("/reorder", requireAuth, async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ error: "ids deve ser um array" });
  await sequelize.transaction((t) =>
    Promise.all(ids.map((id, order) => Course.update({ order }, { where: { id }, transaction: t }))),
  );
  res.json(await Course.findAll({ order: [["order", "ASC"]] }));
});

router.put("/:id", requireAuth, async (req, res) => {
  const course = await Course.findByPk(req.params.id);
  if (!course) return res.status(404).json({ error: "Not found" });
  await course.update(req.body);
  res.json(course);
});

router.delete("/:id", requireAuth, async (req, res) => {
  const course = await Course.findByPk(req.params.id);
  if (!course) return res.status(404).json({ error: "Not found" });
  await course.destroy();
  res.status(204).end();
});

module.exports = router;
