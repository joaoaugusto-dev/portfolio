const express = require("express");
const sequelize = require("../db");
const Project = require("../models/Project");
const requireAuth = require("../middleware/requireAuth");
const sanitizeHtml = require("../lib/sanitizeHtml");

const router = express.Router();

// `description` é HTML (o RichTextEditor do admin escreve <strong>/<em>/<br>).
// Sanitizado aqui, na entrada — não no client/ProjectsGrid.js na hora de
// mostrar — porque cobre POST/PUT direto na API também, e porque limpar uma
// vez na gravação é mais barato que limpar em toda visita.
function withCleanDescription(body) {
  return "description" in body ? { ...body, description: sanitizeHtml(body.description) } : body;
}

router.get("/", async (req, res) => {
  const projects = await Project.findAll({ order: [["order", "ASC"]] });
  res.json(projects);
});

router.post("/", requireAuth, async (req, res) => {
  const project = await Project.create(withCleanDescription(req.body));
  res.status(201).json(project);
});

// Antes de "/:id", senão o Express casa "reorder" como um id.
router.put("/reorder", requireAuth, async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ error: "ids deve ser um array" });
  await sequelize.transaction((t) =>
    Promise.all(ids.map((id, order) => Project.update({ order }, { where: { id }, transaction: t }))),
  );
  res.json(await Project.findAll({ order: [["order", "ASC"]] }));
});

router.put("/:id", requireAuth, async (req, res) => {
  const project = await Project.findByPk(req.params.id);
  if (!project) return res.status(404).json({ error: "Not found" });
  await project.update(withCleanDescription(req.body));
  res.json(project);
});

router.delete("/:id", requireAuth, async (req, res) => {
  const project = await Project.findByPk(req.params.id);
  if (!project) return res.status(404).json({ error: "Not found" });
  await project.destroy();
  res.status(204).end();
});

module.exports = router;
