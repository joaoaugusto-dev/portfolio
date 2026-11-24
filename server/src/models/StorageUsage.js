const { DataTypes } = require("sequelize");
const sequelize = require("../db");

// Linha única (id fixo em 1): contador vivo de bytes usados no bucket (mídia +
// posters + capas). Existe pra travar upload ANTES de estourar o teto
// (lib/storageCap) — sem isso, a única forma de saber o total seria listar o
// bucket inteiro a cada checagem.
const StorageUsage = sequelize.define("StorageUsage", {
  id: { type: DataTypes.INTEGER, primaryKey: true, defaultValue: 1 },
  bytesUsed: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
});

module.exports = StorageUsage;
