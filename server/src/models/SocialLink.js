const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const SocialLink = sequelize.define("SocialLink", {
  label: { type: DataTypes.STRING, allowNull: false },
  href: { type: DataTypes.STRING, allowNull: false },
  icon: { type: DataTypes.STRING, allowNull: false, defaultValue: "fa-solid fa-link" },
  order: { type: DataTypes.INTEGER, defaultValue: 0 },
});

module.exports = SocialLink;
