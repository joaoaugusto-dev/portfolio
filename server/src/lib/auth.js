const jwt = require("jsonwebtoken");

const secret = process.env.JWT_SECRET;
// Segredo curto ou ausente = qualquer um forja um token de admin. Falha no boot.
if (!secret || secret.length < 32) throw new Error("JWT_SECRET ausente ou curto demais (mínimo 32 caracteres)");

// 7 dias: sem refresh token de propósito — quando vence, o painel volta pro login.
const sign = (admin) => jwt.sign({ sub: String(admin.id), email: admin.email }, secret, { algorithm: "HS256", expiresIn: "7d" });
const verify = (token) => jwt.verify(token, secret, { algorithms: ["HS256"] });

module.exports = { sign, verify };
