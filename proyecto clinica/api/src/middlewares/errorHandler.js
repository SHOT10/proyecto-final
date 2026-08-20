// Middleware centralizado de manejo de errores.
// Cualquier controlador que llame a next(error) termina aquí,
// devolviendo una respuesta consistente en formato JSON.
function errorHandler(err, req, res, next) {
  console.error(err);

  // Errores de validación de Sequelize
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      status: 'error',
      message: 'Error de validación',
      detalles: err.errors.map(e => e.message)
    });
  }

  // Violación de llave foránea (ej: id_medico que no existe)
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(409).json({
      status: 'error',
      message: 'Referencia inválida: el recurso relacionado no existe'
    });
  }

  const status = err.status || 500;
  return res.status(status).json({
    status: 'error',
    message: err.message || 'Error interno del servidor'
  });
}

// Middleware para rutas no encontradas
function notFound(req, res, next) {
  res.status(404).json({ status: 'error', message: `Ruta no encontrada: ${req.originalUrl}` });
}

module.exports = { errorHandler, notFound };
