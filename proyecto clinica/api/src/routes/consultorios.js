const express = require('express');
const router = express.Router();
const { consultorioController } = require('../controllers/entityControllers');

router.get('/', consultorioController.getAll);
router.get('/:id', consultorioController.getById);
router.post('/', consultorioController.create);
router.put('/:id', consultorioController.update);
router.delete('/:id', consultorioController.remove);

module.exports = router;
