const sequelize = require("../db");
const { headObject, deleteObjects } = require("./storage");
const { removeUsage } = require("./storageCap");

// Tabelas cujas linhas podem citar uma capa (/api/covers/<uuid>.webp).
const TABLES = ["GalleryItems", "Projects", "Courses", "NewsItems"];
const keyOf = (url) => /^\/api\/covers\/([0-9a-f-]{36}\.webp)$/.exec(url || "")?.[1];

// Apaga a capa do bucket se nenhuma linha usa mais. Procura no texto da linha
// inteira, não só na coluna de imagem: a mesma URL pode ter sido colada em outro
// item ou dentro de uma descrição. Chame DEPOIS de salvar a troca — assim o item
// nunca fica apontando pra um arquivo que já sumiu.
// ponytail: uma varredura por troca; com milhares de linhas, um índice de referências.
async function releaseCover(url) {
  const key = keyOf(url);
  if (!key) return false;
  const sql = TABLES.map((t) => `SELECT 1 FROM "${t}" x WHERE x::text LIKE :pat`).join(" UNION ALL ") + " LIMIT 1";
  const [rows] = await sequelize.query(sql, { replacements: { pat: `%${key}%` } });
  if (rows.length) return false;
  const head = await headObject(`covers/${key}`);
  if (!head) return false;
  await deleteObjects([`covers/${key}`]);
  await removeUsage(head.contentLength || 0);
  return true;
}

// Melhor esforço: falhar a limpeza não pode desfazer um salvamento que deu certo.
function releaseCoverLater(url) {
  releaseCover(url).catch((err) => console.error(`Falha ao apagar a capa antiga ${url}:`, err.message));
}

module.exports = { releaseCover, releaseCoverLater };
