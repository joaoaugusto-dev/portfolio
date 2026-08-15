const supabase = require("../supabase");

// Só o(s) e-mail(s) aqui passam, mesmo com um JWT Supabase válido — sem isso, qualquer
// pessoa que se cadastrasse no projeto Supabase (signup público vem habilitado por
// padrão, e isso não dá pra conferir a partir do código) viraria admin do site.
const adminEmails = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// Verifies the Supabase session JWT sent by the Next.js admin panel.
async function requireAuth(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Missing token" });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return res.status(401).json({ error: "Invalid session" });

  if (!adminEmails.includes((data.user.email || "").toLowerCase()))
    return res.status(403).json({ error: "Não autorizado" });

  req.user = data.user;
  next();
}

module.exports = requireAuth;
