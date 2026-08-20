const express = require('express');
const router = express.Router();
const { pacienteController } = require('../controllers/entityControllers');
const { historialPaciente } = require('../controllers/reportesController');

router.get('/', pacienteController.getAll);
router.get('/:id', pacienteController.getById);
router.get('/:id/historial', historialPaciente);
router.post('/', pacienteController.create);
router.put('/:id', pacienteController.update);
router.delete('/:id', pacienteController.remove);

module.exports = router;
