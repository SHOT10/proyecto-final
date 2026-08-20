// Genera un controlador CRUD estándar para un modelo Sequelize dado.
// Sigue las convenciones RESTful: GET (listar/ver), POST (crear),
// PUT (actualizar completo), DELETE (eliminar), con códigos HTTP correctos.
function crudFactory(Model, pk) {
  return {
    async getAll(req, res, next) {
      try {
        const items = await Model.findAll();
        res.status(200).json({ status: 'success', total: items.length, data: items });
      } catch (err) {
        next(err);
      }
    },

    async getById(req, res, next) {
      try {
        const item = await Model.findByPk(req.params.id);
        if (!item) {
          return res.status(404).json({ status: 'error', message: 'Recurso no encontrado' });
        }
        res.status(200).json({ status: 'success', data: item });
      } catch (err) {
        next(err);
      }
    },

    async create(req, res, next) {
      try {
        const item = await Model.create(req.body);
        res.status(201).json({ status: 'success', data: item });
      } catch (err) {
        next(err);
      }
    },

    async update(req, res, next) {
      try {
        const item = await Model.findByPk(req.params.id);
        if (!item) {
          return res.status(404).json({ status: 'error', message: 'Recurso no encontrado' });
        }
        await item.update(req.body);
        res.status(200).json({ status: 'success', data: item });
      } catch (err) {
        next(err);
      }
    },

    async remove(req, res, next) {
      try {
        const item = await Model.findByPk(req.params.id);
        if (!item) {
          return res.status(404).json({ status: 'error', message: 'Recurso no encontrado' });
        }
        await item.destroy();
        res.status(204).send();
      } catch (err) {
        next(err);
      }
    }
  };
}

module.exports = crudFactory;
