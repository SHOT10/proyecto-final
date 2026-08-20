const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HorarioMedico = sequelize.define('horarios_medicos', {
  id_horario: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_medico: { type: DataTypes.INTEGER, allowNull: false },
  dia_semana: { type: DataTypes.TINYINT, allowNull: false }, // 1=Lunes ... 7=Domingo
  hora_inicio: { type: DataTypes.TIME, allowNull: false },
  hora_fin: { type: DataTypes.TIME, allowNull: false }
});

module.exports = HorarioMedico;
