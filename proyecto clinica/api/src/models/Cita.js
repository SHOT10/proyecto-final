const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cita = sequelize.define('citas', {
  id_cita: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_paciente: { type: DataTypes.INTEGER, allowNull: false },
  id_medico: { type: DataTypes.INTEGER, allowNull: false },
  id_consultorio: { type: DataTypes.INTEGER, allowNull: false },
  fecha: { type: DataTypes.DATEONLY, allowNull: false },
  hora: { type: DataTypes.TIME, allowNull: false },
  motivo: { type: DataTypes.STRING(255) },
  estado: {
    type: DataTypes.ENUM('Programada', 'Confirmada', 'Atendida', 'Cancelada', 'No asistió'),
    defaultValue: 'Programada'
  },
  fecha_creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

module.exports = Cita;
