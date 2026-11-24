const { DataTypes } = require("sequelize");
const sequelize = require("../db");

// Login do painel. Sem cadastro público: quem cria/troca senha é
// scripts/set-admin.js, rodado à mão no servidor.
const Admin = sequelize.define("Admin", {
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
});

module.exports = Admin;
