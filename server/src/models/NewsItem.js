const { DataTypes } = require("sequelize");
const sequelize = require("../db");

// Notícia/matéria que saiu na imprensa. A home ordena por data (mais recente
// primeiro), então não tem campo `order` nem rota de reorder.
const NewsItem = sequelize.define("NewsItem", {
  titlePt: { type: DataTypes.STRING, allowNull: false },
  titleEn: { type: DataTypes.STRING },
  outlet: { type: DataTypes.STRING, allowNull: false }, // veículo: jornal, site, TV...
  url: { type: DataTypes.STRING, allowNull: false },
  image: { type: DataTypes.STRING },
  date: { type: DataTypes.DATEONLY },
});

module.exports = NewsItem;
