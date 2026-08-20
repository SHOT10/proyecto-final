const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Diagnostico = sequelize.define('diagnosticos', {
  id_diagnostico: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_cita: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  descripcion: { type: DataTypes.TEXT, allowNull: false },
  tratamiento: { type: DataTypes.TEXT },
  observaciones: { type: DataTypes.TEXT },
  fecha_registro: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

module.exports = Diagnostico;
