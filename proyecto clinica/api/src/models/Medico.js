const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Medico = sequelize.define('medicos', {
  id_medico: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(60), allowNull: false },
  apellido: { type: DataTypes.STRING(60), allowNull: false },
  id_especialidad: { type: DataTypes.INTEGER, allowNull: false },
  telefono: { type: DataTypes.STRING(20) },
  email: { type: DataTypes.STRING(100), unique: true },
  fecha_ingreso: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true }
});

module.exports = Medico;
