const express = require('express');
const router = express.Router();
const { diagnosticoController } = require('../controllers/entityControllers');

router.get('/', diagnosticoController.getAll);
router.get('/:id', diagnosticoController.getById);
router.post('/', diagnosticoController.create);
router.put('/:id', diagnosticoController.update);
router.delete('/:id', diagnosticoController.remove);

module.exports = router;
