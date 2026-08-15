const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const JourneyItem = sequelize.define("JourneyItem", {
  icon: { type: DataTypes.STRING, defaultValue: "fa-solid fa-code" },
  periodPt: { type: DataTypes.STRING, allowNull: false },
  periodEn: { type: DataTypes.STRING, allowNull: false },
  titlePt: { type: DataTypes.STRING, allowNull: false },
  titleEn: { type: DataTypes.STRING, allowNull: false },
  schoolPt: { type: DataTypes.STRING, allowNull: false },
  schoolEn: { type: DataTypes.STRING, allowNull: false },
  notePt: { type: DataTypes.STRING },
  noteEn: { type: DataTypes.STRING },
  tags: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
  live: { type: DataTypes.BOOLEAN, defaultValue: false },
  order: { type: DataTypes.INTEGER, defaultValue: 0 },
});

module.exports = JourneyItem;
