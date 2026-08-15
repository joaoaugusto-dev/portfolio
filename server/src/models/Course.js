const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Course = sequelize.define("Course", {
  titlePt: { type: DataTypes.STRING, allowNull: false },
  titleEn: { type: DataTypes.STRING, allowNull: false },
  image: { type: DataTypes.STRING },
  platform: { type: DataTypes.STRING },
  durationPt: { type: DataTypes.STRING },
  durationEn: { type: DataTypes.STRING },
  descPt: { type: DataTypes.TEXT },
  descEn: { type: DataTypes.TEXT },
  order: { type: DataTypes.INTEGER, defaultValue: 0 },
});

module.exports = Course;
