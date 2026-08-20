const sequelize = require('../config/database');
const Especialidad = require('./Especialidad');
const Consultorio = require('./Consultorio');
const Medico = require('./Medico');
const Paciente = require('./Paciente');
const HorarioMedico = require('./HorarioMedico');
const Cita = require('./Cita');
const Diagnostico = require('./Diagnostico');

// Especialidad 1---N Medico
Especialidad.hasMany(Medico, { foreignKey: 'id_especialidad' });
Medico.belongsTo(Especialidad, { foreignKey: 'id_especialidad' });

// Medico 1---N Horario
Medico.hasMany(HorarioMedico, { foreignKey: 'id_medico' });
HorarioMedico.belongsTo(Medico, { foreignKey: 'id_medico' });

// Paciente 1---N Cita
Paciente.hasMany(Cita, { foreignKey: 'id_paciente' });
Cita.belongsTo(Paciente, { foreignKey: 'id_paciente' });

// Medico 1---N Cita
Medico.hasMany(Cita, { foreignKey: 'id_medico' });
Cita.belongsTo(Medico, { foreignKey: 'id_medico' });

// Consultorio 1---N Cita
Consultorio.hasMany(Cita, { foreignKey: 'id_consultorio' });
Cita.belongsTo(Consultorio, { foreignKey: 'id_consultorio' });

// Cita 1---1 Diagnostico
Cita.hasOne(Diagnostico, { foreignKey: 'id_cita' });
Diagnostico.belongsTo(Cita, { foreignKey: 'id_cita' });

module.exports = {
  sequelize,
  Especialidad,
  Consultorio,
  Medico,
  Paciente,
  HorarioMedico,
  Cita,
  Diagnostico
};
