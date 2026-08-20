const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Paciente = sequelize.define('pacientes', {
  id_paciente: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(60), allowNull: false },
  apellido: { type: DataTypes.STRING(60), allowNull: false },
  fecha_nacimiento: { type: DataTypes.DATEONLY, allowNull: false },
  genero: { type: DataTypes.ENUM('M', 'F', 'Otro'), allowNull: false },
  telefono: { type: DataTypes.STRING(20) },
  email: { type: DataTypes.STRING(100), unique: true },
  direccion: { type: DataTypes.STRING(150) },
  fecha_registro: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

module.exports = Paciente;
