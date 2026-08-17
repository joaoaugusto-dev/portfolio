const { DataTypes } = require("sequelize");
const sequelize = require("../db");

// A lista de `key`s é fixa (uma por componente real da home) — sem
// create/delete na rota, só ordem e visibilidade.
const HomeSection = sequelize.define("HomeSection", {
  key: { type: DataTypes.STRING, allowNull: false, unique: true },
  order: { type: DataTypes.INTEGER, defaultValue: 0 },
  visible: { type: DataTypes.BOOLEAN, defaultValue: true },
});

module.exports = HomeSection;
