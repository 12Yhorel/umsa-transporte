const express = require('express');
const router = express.Router();
const VehiculoController = require('../controllers/vehiculoController');
const { autenticarToken, esAdministrador, esTecnico } = require('../middleware/auth');

/**
 * @route GET /api/vehiculos
 * @description Obtener todos los vehículos
 * @access Private
 */
router.get('/', autenticarToken, VehiculoController.obtenerTodos);

/**
 * @route GET /api/vehiculos/disponibles
 * @description Obtener vehículos disponibles
 * @access Private
 */
router.get('/disponibles', autenticarToken, VehiculoController.obtenerDisponibles);

/**
 * @route GET /api/vehiculos/estadisticas
 * @description Obtener estadísticas de vehículos
 * @access Private (Admin, Técnico)
 */
router.get('/estadisticas', autenticarToken, VehiculoController.obtenerEstadisticas);

/**
 * @route GET /api/vehiculos/reporte-pdf
 * @description Generar reporte PDF de vehículos
 * @access Private (Admin, Técnico)
 */
router.get('/reporte-pdf', autenticarToken, VehiculoController.generarReportePDF);

/**
 * @route GET /api/vehiculos/:id
 * @description Obtener vehículo por ID
 * @access Private
 */
router.get('/:id', autenticarToken, VehiculoController.obtenerPorId);

/**
 * @route POST /api/vehiculos
 * @description Crear nuevo vehículo
 * @access Private (Admin, Técnico)
 */
router.post('/', autenticarToken, esAdministrador, esTecnico, VehiculoController.crear);

/**
 * @route PUT /api/vehiculos/:id
 * @description Actualizar vehículo
 * @access Private (Admin, Técnico)
 */
router.put('/:id', autenticarToken, esAdministrador, esTecnico, VehiculoController.actualizar);

/**
 * @route PUT /api/vehiculos/:id/kilometraje
 * @description Actualizar kilometraje del vehículo
 * @access Private (Admin, Técnico)
 */
router.put('/:id/kilometraje', autenticarToken, esAdministrador, esTecnico, VehiculoController.actualizarKilometraje);

/**
 * @route DELETE /api/vehiculos/:id
 * @description Eliminar vehículo
 * @access Private (Admin)
 */
router.delete('/:id', autenticarToken, esAdministrador, VehiculoController.eliminar);

module.exports = router;