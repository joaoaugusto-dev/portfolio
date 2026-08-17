require("dotenv").config();
const express = require("express");
const cors = require("cors");
const sequelize = require("./db");
const projectsRouter = require("./routes/projects");
const filesRouter = require("./routes/files");
const coversRouter = require("./routes/covers");
const coursesRouter = require("./routes/courses");
const journeyRouter = require("./routes/journey");
const galleryRouter = require("./routes/gallery");
const socialLinksRouter = require("./routes/socialLinks");
const skillsRouter = require("./routes/skills");
const siteTextsRouter = require("./routes/siteTexts");
const homeSectionsRouter = require("./routes/homeSections");
const seed = require("./seed");

const app = express();

// Render (e qualquer PaaS) fica atrás de um único proxy reverso na borda, que
// seta X-Forwarded-For. Sem isso, o Express não confia nesse header — e o
// express-rate-limit (nas rotas públicas de mídia/capa) não consegue saber o
// IP real de quem pediu, base do limite por IP. "1" = confia só nesse primeiro
// salto, não numa cadeia arbitrária (evitar isso é o motivo de não usar `true`).
app.set("trust proxy", 1);

// Segunda rede, pra qualquer rejeição que escape até daqui (fora do ciclo de uma
// requisição HTTP) — loga em vez de deixar o Node derrubar o processo sozinho.
process.on("unhandledRejection", (err) => console.error("unhandledRejection:", err));

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
app.use("/api/gallery", galleryRouter);
app.use("/api/social-links", socialLinksRouter);
app.use("/api/skills", skillsRouter);
app.use("/api/site-texts", siteTextsRouter);
app.use("/api/home-sections", homeSectionsRouter);

// Rede de segurança: erro que escapou de um handler (asyncRoute captura a maioria,
// mas isso cobre o resto) vira 500 pro cliente em vez de derrubar o processo.
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({ error: err.message || "Erro interno" });
});

const port = process.env.PORT || 4000;

sequelize
  .sync()
  .then(seed)
  .then(() => {
    app.listen(port, () => console.log(`API listening on :${port}`));
  });
