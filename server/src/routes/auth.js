const express = require("express");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const Admin = require("../models/Admin");
const { sign } = require("../lib/auth");
const asyncRoute = require("../middleware/asyncRoute");

const router = express.Router();

// Força bruta: 10 tentativas por IP a cada 15 min. Login certo não conta.
const loginLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas. Espere alguns minutos." },
});

// Compara contra um hash qualquer quando o e-mail não existe: assim a resposta
// leva o mesmo tempo nos dois casos e não entrega quais e-mails são admin.
const DUMMY = bcrypt.hashSync("x", 10);

router.post("/login", loginLimit, asyncRoute(async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  const admin = email && (await Admin.findOne({ where: { email } }));
  const ok = await bcrypt.compare(password, admin ? admin.passwordHash : DUMMY);
  if (!admin || !ok) return res.status(401).json({ error: "E-mail ou senha incorretos" });
  res.json({ access_token: sign(admin) });
}));

module.exports = router;
