const { verify } = require("../lib/auth");

// Confere o JWT que POST /api/auth/login devolveu ao painel.
function requireAuth(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    req.user = verify(token);
  } catch {
    return res.status(401).json({ error: "Invalid session" });
  }
  next();
}

module.exports = requireAuth;
