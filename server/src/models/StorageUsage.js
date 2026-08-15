const { DataTypes } = require("sequelize");
const sequelize = require("../db");

// Linha única (id fixo em 1): contador vivo de bytes usados no bucket R2 (mídia +
// posters + capas). Existe pra travar upload ANTES de estourar os 10GB grátis —
// sem isso, a única forma de saber o total seria listar o bucket inteiro a cada
// checagem, o que também consome cota (Class A) e não é atômico contra corrida.
const StorageUsage = sequelize.define("StorageUsage", {
  id: { type: DataTypes.INTEGER, primaryKey: true, defaultValue: 1 },
  bytesUsed: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
});

module.exports = StorageUsage;
