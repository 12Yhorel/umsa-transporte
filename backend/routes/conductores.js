const express = require('express');
const router = express.Router();
const ConductorController = require('../controllers/conductorController');
const { autenticarToken, esAdministrador } = require('../middleware/auth');

/**
 * @route GET /api/conductores
 * @description Obtener todos los conductores
 * @access Private
 */
router.get('/', autenticarToken, ConductorController.obtenerTodos);

/**
 * @route GET /api/conductores/disponibles
 * @description Obtener conductores disponibles
 * @access Private
 */
router.get('/disponibles', autenticarToken, ConductorController.obtenerDisponibles);

/**
 * @route GET /api/conductores/alertas-vencimiento
 * @description Obtener alertas de vencimiento
 * @access Private (Admin)
 */
router.get('/alertas-vencimiento', autenticarToken, esAdministrador, ConductorController.obtenerAlertasVencimiento);

/**
 * @route GET /api/conductores/estadisticas
 * @description Obtener estadísticas de conductores
 * @access Private (Admin)
 */
router.get('/estadisticas', autenticarToken, esAdministrador, ConductorController.obtenerEstadisticas);

/**
 * @route GET /api/conductores/reporte-pdf
 * @description Generar reporte PDF de conductores
 * @access Private (Admin)
 */
router.get('/reporte-pdf', autenticarToken, esAdministrador, ConductorController.generarReportePDF);

/**
 * @route GET /api/conductores/:id
 * @description Obtener conductor por ID
 * @access Private
 */
router.get('/:id', autenticarToken, ConductorController.obtenerPorId);

/**
 * @route POST /api/conductores
 * @description Crear nuevo conductor
 * @access Private (Admin)
 */
router.post('/', autenticarToken, esAdministrador, ConductorController.crear);

/**
 * @route PUT /api/conductores/:id
 * @description Actualizar conductor
 * @access Private (Admin)
 */
router.put('/:id', autenticarToken, esAdministrador, ConductorController.actualizar);

/**
 * @route PUT /api/conductores/:id/habilitar
 * @description Habilitar conductor
 * @access Private (Admin)
 */
router.put('/:id/habilitar', autenticarToken, esAdministrador, ConductorController.habilitar);

/**
 * @route PUT /api/conductores/:id/deshabilitar
 * @description Deshabilitar conductor
 * @access Private (Admin)
 */
router.put('/:id/deshabilitar', autenticarToken, esAdministrador, ConductorController.deshabilitar);

/**
 * @route PATCH /api/conductores/:id/habilitacion
 * @description Cambiar habilitación del conductor
 * @access Private (Admin)
 */
router.patch('/:id/habilitacion', autenticarToken, esAdministrador, ConductorController.cambiarHabilitacion);

/**
 * @route DELETE /api/conductores/:id
 * @description Eliminar conductor
 * @access Private (Admin)
 */
router.delete('/:id', autenticarToken, esAdministrador, ConductorController.eliminar);

module.exports = router;