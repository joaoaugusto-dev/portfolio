const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const GalleryItem = sequelize.define("GalleryItem", {
  image: { type: DataTypes.STRING, allowNull: false },
  captionPt: { type: DataTypes.STRING },
  captionEn: { type: DataTypes.STRING },
  // Nome do evento/projeto e data — fotos com o mesmo par viram uma seção com
  // título na home (ver Gallery.js); vazio (fotos antigas) continua sem título.
  // O agrupamento usa sempre eventName (PT); eventNameEn é só o texto exibido
  // quando o site está em inglês, e cai pro PT se ficar vazio.
  eventName: { type: DataTypes.STRING },
  eventNameEn: { type: DataTypes.STRING },
  eventDate: { type: DataTypes.DATEONLY },
  // Dimensões da imagem já enviada — a colagem do site usa isso pra reservar a
  // altura certa de cada foto (proporção original, sem forçar corte) e encaixar
  // tudo tipo mosaico, sem esperar a imagem carregar pra saber o formato.
  width: { type: DataTypes.INTEGER },
  height: { type: DataTypes.INTEGER },
  order: { type: DataTypes.INTEGER, defaultValue: 0 },
});

module.exports = GalleryItem;
