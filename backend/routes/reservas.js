const express = require('express');
const router = express.Router();
const ReservaController = require('../controllers/reservaController');
const { autenticarToken, esAdministrador, esConductor } = require('../middleware/auth');

/**
 * @route GET /api/reservas
 * @description Obtener todas las reservas
 * @access Private
 */
router.get('/', autenticarToken, ReservaController.obtenerTodas);

/**
 * @route GET /api/reservas/calendario
 * @description Obtener calendario de disponibilidad
 * @access Private
 */
router.get('/calendario', autenticarToken, ReservaController.obtenerCalendario);

/**
 * @route GET /api/reservas/disponibilidad
 * @description Verificar disponibilidad
 * @access Private
 */
router.get('/disponibilidad', autenticarToken, ReservaController.verificarDisponibilidad);

/**
 * @route GET /api/reservas/proximas
 * @description Obtener reservas próximas
 * @access Private
 */
router.get('/proximas', autenticarToken, ReservaController.obtenerProximas);

/**
 * @route GET /api/reservas/estadisticas
 * @description Obtener estadísticas de reservas
 * @access Private (Admin)
 */
router.get('/estadisticas', autenticarToken, esAdministrador, ReservaController.obtenerEstadisticas);

/**
 * @route GET /api/reservas/reporte-pdf
 * @description Generar reporte PDF de reservas
 * @access Private (Admin)
 */
router.get('/reporte-pdf', autenticarToken, esAdministrador, ReservaController.generarReportePDF);

/**
 * @route GET /api/reservas/:id
 * @description Obtener reserva por ID
 * @access Private
 */
router.get('/:id', autenticarToken, ReservaController.obtenerPorId);

/**
 * @route POST /api/reservas
 * @description Crear nueva reserva
 * @access Private
 */
router.post('/', autenticarToken, ReservaController.crear);

/**
 * @route PUT /api/reservas/:id
 * @description Actualizar reserva
 * @access Private (Admin)
 */
router.put('/:id', autenticarToken, esAdministrador, ReservaController.actualizar);

/**
 * @route DELETE /api/reservas/:id
 * @description Eliminar reserva
 * @access Private (Admin)
 */
router.delete('/:id', autenticarToken, esAdministrador, ReservaController.eliminar);

/**
 * @route PATCH /api/reservas/:id/estado
 * @description Cambiar estado de la reserva
 * @access Private (Admin)
 */
router.patch('/:id/estado', autenticarToken, esAdministrador, ReservaController.cambiarEstado);

/**
 * @route PUT /api/reservas/:id/aprobar
 * @description Aprobar reserva
 * @access Private (Admin)
 */
router.put('/:id/aprobar', autenticarToken, esAdministrador, ReservaController.aprobar);

/**
 * @route PUT /api/reservas/:id/rechazar
 * @description Rechazar reserva
 * @access Private (Admin)
 */
router.put('/:id/rechazar', autenticarToken, esAdministrador, ReservaController.rechazar);

/**
 * @route PUT /api/reservas/:id/cancelar
 * @description Cancelar reserva
 * @access Private
 */
router.put('/:id/cancelar', autenticarToken, ReservaController.cancelar);

/**
 * @route PUT /api/reservas/:id/completar
 * @description Completar reserva
 * @access Private (Admin, Conductor)
 */
router.put('/:id/completar', autenticarToken, esAdministrador, esConductor, ReservaController.completar);

module.exports = router;