const { DataTypes } = require("sequelize");
const sequelize = require("../db");

// Chave->valor genérico em vez de um modelo com dezenas de colunas: cobre
// qualquer texto solto do site (Hero, Sobre, Contato, Rodapé, Menu) sem
// precisar de migration cada vez que um texto novo vira editável.
const SiteText = sequelize.define("SiteText", {
  key: { type: DataTypes.STRING, allowNull: false, unique: true },
  group: { type: DataTypes.STRING, allowNull: false, defaultValue: "geral" },
  label: { type: DataTypes.STRING, allowNull: false },
  pt: { type: DataTypes.TEXT, allowNull: false },
  en: { type: DataTypes.TEXT, allowNull: false },
  order: { type: DataTypes.INTEGER, defaultValue: 0 },
});

module.exports = SiteText;
