const express = require('express');
const router = express.Router();
const citaController = require('../controllers/citaController');

// Rutas específicas primero (evitan colisión con '/:id')
router.get('/completas', citaController.getCompletas);
router.post('/agendar', citaController.agendar);

router.get('/', citaController.getAll);
router.get('/:id', citaController.getById);
router.post('/', citaController.create);
router.put('/:id', citaController.update);
router.delete('/:id', citaController.remove);

module.exports = router;
