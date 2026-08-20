const { Sequelize } = require('sequelize');
require('dotenv').config();

// Conexión a MariaDB usando el dialecto mysql (compatible con MariaDB)
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql', // MariaDB usa el mismo protocolo/dialecto que MySQL
    dialectOptions: {
      charset: 'utf8mb4' // evita que los acentos se guarden/lean corruptos (ej. "mÃ©dico")
    },
    logging: false,
    define: {
      timestamps: false, // controlamos las fechas manualmente según el esquema SQL
      freezeTableName: true
    }
  }
);

module.exports = sequelize;
