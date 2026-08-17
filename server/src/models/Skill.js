const { DataTypes } = require("sequelize");
const sequelize = require("../db");

// `name`/`cat` só fazem sentido pra type "tech" (soft skill não tem nome
// próprio nem categoria hoje) — ficam nullable em vez de virar dois modelos.
const Skill = sequelize.define("Skill", {
  type: { type: DataTypes.STRING, allowNull: false, defaultValue: "tech" },
  name: { type: DataTypes.STRING },
  icon: { type: DataTypes.STRING, allowNull: false, defaultValue: "fa-solid fa-code" },
  cat: { type: DataTypes.STRING },
  pt: { type: DataTypes.STRING, allowNull: false },
  en: { type: DataTypes.STRING, allowNull: false },
  order: { type: DataTypes.INTEGER, defaultValue: 0 },
});

module.exports = Skill;
