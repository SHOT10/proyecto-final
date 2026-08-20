const crudFactory = require('./crudFactory');
const { Especialidad, Consultorio, Medico, Paciente, Diagnostico } = require('../models');

module.exports = {
  especialidadController: crudFactory(Especialidad),
  consultorioController: crudFactory(Consultorio),
  medicoController: crudFactory(Medico),
  pacienteController: crudFactory(Paciente),
  diagnosticoController: crudFactory(Diagnostico)
};
