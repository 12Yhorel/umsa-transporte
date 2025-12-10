const express = require('express');
const router = express.Router();
const ReparacionController = require('../controllers/reparacionController');
const { autenticarToken, esAdministrador, esTecnico } = require('../middleware/auth');

/**
 * @route GET /api/reparaciones
 * @description Obtener todas las reparaciones
 * @access Private
 */
router.get('/', autenticarToken, ReparacionController.obtenerTodas);

/**
 * @route GET /api/reparaciones/activas
 * @description Obtener reparaciones activas
 * @access Private (Admin, Técnico)
 */
router.get('/activas', autenticarToken, esTecnico, ReparacionController.obtenerReparacionesActivas);

/**
 * @route GET /api/reparaciones/proximas-entregas
 * @description Obtener próximas entregas
 * @access Private (Admin, Técnico)
 */
router.get('/proximas-entregas', autenticarToken, esTecnico, ReparacionController.obtenerProximasEntregas);

/**
 * @route GET /api/reparaciones/estadisticas
 * @description Obtener estadísticas de reparaciones
 * @access Private (Admin, Técnico)
 */
router.get('/estadisticas', autenticarToken, esTecnico, ReparacionController.obtenerEstadisticas);

/**
 * @route GET /api/reparaciones/reporte-pdf
 * @description Generar reporte PDF de reparaciones
 * @access Private (Admin, Técnico)
 */
router.get('/reporte-pdf', autenticarToken, esTecnico, ReparacionController.generarReportePDF);

/**
 * @route GET /api/reparaciones/vehiculo/:vehiculo_id
 * @description Obtener historial de reparaciones por vehículo
 * @access Private
 */
router.get('/vehiculo/:vehiculo_id', autenticarToken, ReparacionController.obtenerHistorialPorVehiculo);

/**
 * @route GET /api/reparaciones/:id
 * @description Obtener reparación por ID
 * @access Private
 */
router.get('/:id', autenticarToken, ReparacionController.obtenerPorId);

/**
 * @route GET /api/reparaciones/:id/repuestos
 * @description Obtener repuestos utilizados en una reparación
 * @access Private
 */
router.get('/:id/repuestos', autenticarToken, ReparacionController.obtenerRepuestosUtilizados);

/**
 * @route POST /api/reparaciones
 * @description Crear nueva reparación
 * @access Private (Admin, Técnico)
 */
router.post('/', autenticarToken, esTecnico, ReparacionController.crear);

/**
 * @route PUT /api/reparaciones/:id
 * @description Actualizar reparación
 * @access Private (Admin, Técnico)
 */
router.put('/:id', autenticarToken, esTecnico, ReparacionController.actualizar);

/**
 * @route DELETE /api/reparaciones/:id
 * @description Eliminar reparación
 * @access Private (Admin)
 */
router.delete('/:id', autenticarToken, esAdministrador, ReparacionController.eliminar);

/**
 * @route POST /api/reparaciones/:id/repuestos
 * @description Agregar repuesto a reparación
 * @access Private (Admin, Técnico)
 */
router.post('/:id/repuestos', autenticarToken, esTecnico, ReparacionController.agregarRepuesto);

/**
 * @route PUT /api/reparaciones/:id/estado
 * @description Actualizar estado de reparación
 * @access Private (Admin, Técnico)
 */
router.put('/:id/estado', autenticarToken, esTecnico, ReparacionController.actualizarEstado);

/**
 * @route PATCH /api/reparaciones/:id/estado
 * @description Actualizar estado de reparación (alternativo)
 * @access Private (Admin, Técnico)
 */
router.patch('/:id/estado', autenticarToken, esTecnico, ReparacionController.actualizarEstado);

/**
 * @route PUT /api/reparaciones/:id/diagnostico
 * @description Actualizar diagnóstico
 * @access Private (Admin, Técnico)
 */
router.put('/:id/diagnostico', autenticarToken, esTecnico, ReparacionController.actualizarDiagnostico);

/**
 * @route DELETE /api/reparaciones/:id/repuestos/:consumo_id
 * @description Remover repuesto de reparación
 * @access Private (Admin, Técnico)
 */
router.delete('/:id/repuestos/:consumo_id', autenticarToken, esTecnico, ReparacionController.removerRepuesto);

module.exports = router;