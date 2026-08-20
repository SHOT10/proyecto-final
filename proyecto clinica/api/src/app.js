const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

const especialidadesRoutes = require('./routes/especialidades');
const consultoriosRoutes = require('./routes/consultorios');
const medicosRoutes = require('./routes/medicos');
const pacientesRoutes = require('./routes/pacientes');
const citasRoutes = require('./routes/citas');
const diagnosticosRoutes = require('./routes/diagnosticos');

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta de salud del servicio
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'API de Clínica de Citas funcionando' });
});

// Montaje de recursos RESTful bajo /api
app.use('/api/especialidades', especialidadesRoutes);
app.use('/api/consultorios', consultoriosRoutes);
app.use('/api/medicos', medicosRoutes);
app.use('/api/pacientes', pacientesRoutes);
app.use('/api/citas', citasRoutes);
app.use('/api/diagnosticos', diagnosticosRoutes);

// 404 y manejo de errores (siempre al final)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
