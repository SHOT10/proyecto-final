const express = require('express');
const router = express.Router();
const { especialidadController } = require('../controllers/entityControllers');

router.get('/', especialidadController.getAll);
router.get('/:id', especialidadController.getById);
router.post('/', especialidadController.create);
router.put('/:id', especialidadController.update);
router.delete('/:id', especialidadController.remove);

module.exports = router;
