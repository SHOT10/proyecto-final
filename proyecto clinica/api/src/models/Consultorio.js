const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Consultorio = sequelize.define('consultorios', {
  id_consultorio: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  numero: { type: DataTypes.STRING(10), allowNull: false, unique: true },
  piso: { type: DataTypes.INTEGER, allowNull: false },
  tipo: { type: DataTypes.STRING(50), defaultValue: 'General' }
});

module.exports = Consultorio;
