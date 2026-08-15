const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Project = sequelize.define("Project", {
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  imageUrl: { type: DataTypes.STRING },
  link: { type: DataTypes.STRING },
  featured: { type: DataTypes.BOOLEAN, defaultValue: false },
  projectDate: { type: DataTypes.DATEONLY, allowNull: false },
  order: { type: DataTypes.INTEGER, defaultValue: 0 },
});

module.exports = Project;
