require("dotenv").config();
const express = require("express");
const cors = require("cors");
const sequelize = require("./db");
const projectsRouter = require("./routes/projects");
const filesRouter = require("./routes/files");
const coversRouter = require("./routes/covers");
const coursesRouter = require("./routes/courses");
const journeyRouter = require("./routes/journey");

const app = express();
const origins = (process.env.CORS_ORIGIN || "").split(",").map((s) => s.trim()).filter(Boolean);

// ponytail: qualquer porta de localhost passa. A porta do `next dev` muda sozinha
// quando a 3000 está ocupada (3001, 3010...) e fixar a porta no .env quebra o admin.
const isLocal = (o) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o);

// Sem CORS_ORIGIN configurado, "!origins.length" deixava passar QUALQUER origem —
// um .env esquecido em produção virava uma API aberta pro mundo todo.
app.use(
  cors({
    origin: (origin, cb) => cb(null, !origin || isLocal(origin) || origins.includes(origin)),
  }),
);
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));
app.use("/api/projects", projectsRouter);
app.use("/api/files", filesRouter);
app.use("/api/covers", coversRouter);
app.use("/api/courses", coursesRouter);
app.use("/api/journey", journeyRouter);

const port = process.env.PORT || 4000;

sequelize.sync().then(() => {
  app.listen(port, () => console.log(`API listening on :${port}`));
});
