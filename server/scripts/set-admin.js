// Troca o e-mail e a senha do admin do painel (ou cria o primeiro, se não houver).
// Pergunta tudo em vez de receber por argumento: senha não fica no histórico do shell.
//   podman exec -it hs-portfolio-api node scripts/set-admin.js
require("dotenv").config();
const readline = require("readline");
const bcrypt = require("bcryptjs");
const Admin = require("../src/models/Admin");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: Boolean(process.stdin.isTTY) });
let muted = false;
rl._writeToOutput = (s) => !muted && process.stdout.write(s); // esconde a senha enquanto digita
const lines = rl[Symbol.asyncIterator]();

async function ask(question, hidden = false) {
  process.stdout.write(question);
  muted = hidden;
  const { value = "" } = await lines.next();
  muted = false;
  if (hidden) process.stdout.write("\n");
  return value;
}

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

async function main() {
  await Admin.sync();
  const admins = await Admin.findAll({ order: [["id", "ASC"]] });
  let admin = admins[0];

  if (admins.length > 1) {
    console.log(`Admins: ${admins.map((a) => a.email).join(", ")}`);
    const current = (await ask("E-mail atual do admin a trocar: ")).trim().toLowerCase();
    admin = admins.find((a) => a.email === current) || fail("Nenhum admin com esse e-mail.");
  }
  console.log(admin ? `Trocando o admin ${admin.email}.` : "Nenhum admin ainda: criando o primeiro.");

  const email = (await ask("Novo e-mail: ")).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("E-mail inválido.");
  const taken = await Admin.findOne({ where: { email } });
  if (taken && taken.id !== admin?.id) fail("Já existe outro admin com esse e-mail.");

  const password = await ask("Nova senha (10+ caracteres): ", true);
  if (password.length < 10) fail("Senha curta demais: mínimo 10 caracteres.");
  if ((await ask("Repita a senha: ", true)) !== password) fail("As senhas não batem.");

  const passwordHash = await bcrypt.hash(password, 12);
  if (admin) await admin.update({ email, passwordHash });
  else await Admin.create({ email, passwordHash });
  console.log(`Pronto: entre no painel com ${email}.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
