const { Sequelize } = require("sequelize");

// O Postgres do hosting roda no mesmo servidor, sem SSL. DB_SSL=true liga de
// volta pra um banco remoto que exija (ex.: gerenciado na nuvem).
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  dialectOptions: process.env.DB_SSL === "true" ? { ssl: { require: true, rejectUnauthorized: false } } : {},
  logging: false,
});

module.exports = sequelize;
