// Migração única: adiciona as colunas eventName/eventDate em GalleryItem.
// Precisa disso porque sequelize.sync() (usado no boot normal, src/index.js)
// só cria tabelas que não existem — não adiciona coluna em tabela já criada.
//
// Roda uma vez, à mão: `npm run migrate:gallery-events` (precisa de
// DATABASE_URL no .env). Idempotente — pode rodar de novo sem erro.
require("dotenv").config();
const { DataTypes } = require("sequelize");
const sequelize = require("../src/db");

async function main() {
  const qi = sequelize.getQueryInterface();
  const table = await qi.describeTable("GalleryItems");

  if (!table.eventName) {
    await qi.addColumn("GalleryItems", "eventName", { type: DataTypes.STRING });
    console.log("Coluna eventName adicionada.");
  } else {
    console.log("Coluna eventName já existe, pulei.");
  }

  if (!table.eventDate) {
    await qi.addColumn("GalleryItems", "eventDate", { type: DataTypes.DATEONLY });
    console.log("Coluna eventDate adicionada.");
  } else {
    console.log("Coluna eventDate já existe, pulei.");
  }

  await sequelize.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
