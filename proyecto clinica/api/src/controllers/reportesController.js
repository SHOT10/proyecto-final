const { QueryTypes } = require('sequelize');
const { sequelize } = require('../models');

module.exports = {
  // GET /api/pacientes/:id/historial
  // Usa el procedimiento almacenado sp_historial_paciente
  async historialPaciente(req, res, next) {
    try {
      const { id } = req.params;

      // Con múltiples filas, mysql2 puede añadir un segundo "result set" de
      // metadata (OkPacket) al final del array; se filtra por seguridad.
      const rawResult = await sequelize.query('CALL sp_historial_paciente(:id)', {
        replacements: { id }
      });
      const historial = rawResult.filter(
        row => row && typeof row === 'object' && 'id_cita' in row
      );

      res.status(200).json({ status: 'success', total: historial.length, data: historial });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/medicos/estadisticas
  // Consulta cruda sobre la vista vista_estadisticas_medico
  async estadisticasMedicos(req, res, next) {
    try {
      const estadisticas = await sequelize.query('SELECT * FROM vista_estadisticas_medico', {
        type: QueryTypes.SELECT
      });

      res.status(200).json({ status: 'success', total: estadisticas.length, data: estadisticas });
    } catch (err) {
      next(err);
    }
  }
};
