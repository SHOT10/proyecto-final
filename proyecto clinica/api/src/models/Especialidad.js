const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Especialidad = sequelize.define('especialidades', {
  id_especialidad: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(80), allowNull: false, unique: true },
  descripcion: { type: DataTypes.STRING(255) }
});

module.exports = Especialidad;
