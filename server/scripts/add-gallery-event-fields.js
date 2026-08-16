// Migração única: adiciona as colunas eventName/eventNameEn/eventDate em GalleryItem.
// Precisa disso porque sequelize.sync() (usado no boot normal, src/index.js)
// só cria tabelas que não existem — não adiciona coluna em tabela já criada.
//
// Roda uma vez, à mão: `npm run migrate:gallery-events` (precisa de
// DATABASE_URL no .env). Idempotente — pode rodar de novo sem erro.
require("dotenv").config();
const { DataTypes } = require("sequelize");
const sequelize = require("../src/db");

const COLUNAS = {
  eventName: DataTypes.STRING,
  eventNameEn: DataTypes.STRING,
  eventDate: DataTypes.DATEONLY,
};

async function main() {
  const qi = sequelize.getQueryInterface();
  const table = await qi.describeTable("GalleryItems");

  for (const [nome, type] of Object.entries(COLUNAS)) {
    if (table[nome]) {
      console.log(`Coluna ${nome} já existe, pulei.`);
      continue;
    }
    await qi.addColumn("GalleryItems", nome, { type });
    console.log(`Coluna ${nome} adicionada.`);
  }

  await sequelize.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
