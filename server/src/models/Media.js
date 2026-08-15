const { DataTypes } = require("sequelize");
const sequelize = require("../db");

// Metadados dos uploads. Os bytes ficam no Storage; título/descrição/data ficam aqui,
// que é o que a página /midia/<nome> mostra.
const Media = sequelize.define("Media", {
  name: { type: DataTypes.STRING, allowNull: false, unique: true }, // slug + extensão
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  kind: { type: DataTypes.STRING, allowNull: false },
  mimetype: { type: DataTypes.STRING },
  size: { type: DataTypes.INTEGER },
});

module.exports = Media;
