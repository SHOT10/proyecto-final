const { QueryTypes } = require('sequelize');
const { sequelize, Cita } = require('../models');
const crudFactory = require('./crudFactory');

// CRUD estándar (ORM) para la tabla citas
const baseCrud = crudFactory(Cita);

module.exports = {
  ...baseCrud,

  // GET /api/citas/completas
  // Consulta cruda sobre la VISTA vista_citas_completas (join de paciente/medico/especialidad/consultorio)
  async getCompletas(req, res, next) {
    try {
      const { fecha, estado } = req.query;
      let query = 'SELECT * FROM vista_citas_completas WHERE 1=1';
      const replacements = {};

      if (fecha) {
        query += ' AND fecha = :fecha';
        replacements.fecha = fecha;
      }
      if (estado) {
        query += ' AND estado = :estado';
        replacements.estado = estado;
      }
      query += ' ORDER BY fecha DESC, hora DESC';

      const citas = await sequelize.query(query, {
        replacements,
        type: QueryTypes.SELECT
      });

      res.status(200).json({ status: 'success', total: citas.length, data: citas });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/citas/agendar
  // Usa el procedimiento almacenado sp_agendar_cita, que valida choque de horario del médico
  // antes de insertar (regla de negocio resuelta en la base de datos, no en la app).
  async agendar(req, res, next) {
    try {
      const { id_paciente, id_medico, id_consultorio, fecha, hora, motivo } = req.body;

      if (!id_paciente || !id_medico || !id_consultorio || !fecha || !hora) {
        return res.status(400).json({
          status: 'error',
          message: 'id_paciente, id_medico, id_consultorio, fecha y hora son obligatorios'
        });
      }

      await sequelize.query(
        'CALL sp_agendar_cita(:id_paciente, :id_medico, :id_consultorio, :fecha, :hora, :motivo, @resultado)',
        {
          replacements: {
            id_paciente,
            id_medico,
            id_consultorio,
            fecha,
            hora,
            motivo: motivo || null
          }
        }
      );

      const [[{ resultado }]] = await sequelize.query('SELECT @resultado AS resultado');

      if (resultado.startsWith('ERROR')) {
        return res.status(409).json({ status: 'error', message: resultado });
      }

      res.status(201).json({ status: 'success', message: resultado });
    } catch (err) {
      next(err);
    }
  }
};
