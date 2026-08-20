const express = require('express');
const router = express.Router();
const { medicoController } = require('../controllers/entityControllers');
const { estadisticasMedicos } = require('../controllers/reportesController');

// IMPORTANTE: la ruta específica '/estadisticas' debe declararse
// antes que '/:id' para que Express no la interprete como un id.
router.get('/estadisticas', estadisticasMedicos);

router.get('/', medicoController.getAll);
router.get('/:id', medicoController.getById);
router.post('/', medicoController.create);
router.put('/:id', medicoController.update);
router.delete('/:id', medicoController.remove);

module.exports = router;
