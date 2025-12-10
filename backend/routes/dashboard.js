const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboardController');
const { autenticarToken } = require('../middleware/auth');

// Obtener estadísticas del dashboard
router.get('/estadisticas', autenticarToken, DashboardController.obtenerEstadisticas);

module.exports = router;
