const express = require('express');
const router = express.Router();
const InventarioController = require('../controllers/inventarioController');
const { autenticarToken, esAdministrador, esTecnico } = require('../middleware/auth');

/**
 * @route GET /api/inventario
 * @description Obtener todos los ítems de inventario
 * @access Private
 */
router.get('/', autenticarToken, InventarioController.obtenerTodosItems);

/**
 * @route GET /api/inventario/buscar
 * @description Buscar ítems
 * @access Private
 */
router.get('/buscar', autenticarToken, InventarioController.buscarItems);

/**
 * @route GET /api/inventario/stock-bajo
 * @description Obtener ítems con stock bajo
 * @access Private (Admin, Técnico)
 */
router.get('/stock-bajo', autenticarToken, esAdministrador, esTecnico, InventarioController.obtenerItemsStockBajo);

/**
 * @route GET /api/inventario/estadisticas
 * @description Obtener estadísticas de inventario
 * @access Private (Admin, Técnico)
 */
router.get('/estadisticas', autenticarToken, esAdministrador, esTecnico, InventarioController.obtenerEstadisticas);

/**
 * @route GET /api/inventario/reporte-pdf
 * @description Generar reporte PDF de inventario
 * @access Private (Admin, Técnico)
 */
router.get('/reporte-pdf', autenticarToken, esAdministrador, esTecnico, InventarioController.generarReportePDF);

/**
 * @route GET /api/inventario/categorias
 * @description Obtener todas las categorías
 * @access Private
 */
router.get('/categorias', autenticarToken, InventarioController.obtenerCategorias);

/**
 * @route GET /api/inventario/proveedores
 * @description Obtener todos los proveedores
 * @access Private
 */
router.get('/proveedores', autenticarToken, InventarioController.obtenerProveedores);

/**
 * @route GET /api/inventario/qr/:codigo_qr
 * @description Obtener ítem por código QR
 * @access Private
 */
router.get('/qr/:codigo_qr', autenticarToken, InventarioController.obtenerItemPorQR);

/**
 * @route GET /api/inventario/:id
 * @description Obtener ítem por ID
 * @access Private
 */
router.get('/:id', autenticarToken, InventarioController.obtenerItemPorId);

/**
 * @route GET /api/inventario/:id/movimientos
 * @description Obtener historial de movimientos de un ítem
 * @access Private (Admin, Técnico)
 */
router.get('/:id/movimientos', autenticarToken, esAdministrador, esTecnico, InventarioController.obtenerHistorialMovimientos);

/**
 * @route POST /api/inventario
 * @description Crear nuevo ítem
 * @access Private (Admin, Técnico)
 */
router.post('/', autenticarToken, esAdministrador, esTecnico, InventarioController.crearItem);

/**
 * @route POST /api/inventario/categorias
 * @description Crear nueva categoría
 * @access Private (Admin)
 */
router.post('/categorias', autenticarToken, esAdministrador, InventarioController.crearCategoria);

/**
 * @route PUT /api/inventario/:id
 * @description Actualizar ítem
 * @access Private (Admin, Técnico)
 */
router.put('/:id', autenticarToken, esAdministrador, esTecnico, InventarioController.actualizarItem);

/**
 * @route DELETE /api/inventario/:id
 * @description Desactivar ítem
 * @access Private (Admin)
 */
router.delete('/:id', autenticarToken, esAdministrador, InventarioController.desactivarItem);

/**
 * @route PUT /api/inventario/:id/entrada
 * @description Registrar entrada de stock
 * @access Private (Admin, Técnico)
 */
router.put('/:id/entrada', autenticarToken, esAdministrador, esTecnico, InventarioController.registrarEntrada);

/**
 * @route PUT /api/inventario/:id/salida
 * @description Registrar salida de stock
 * @access Private (Admin, Técnico)
 */
router.put('/:id/salida', autenticarToken, esAdministrador, esTecnico, InventarioController.registrarSalida);

/**
 * @route PUT /api/inventario/:id/ajustar
 * @description Ajustar stock
 * @access Private (Admin)
 */
router.put('/:id/ajustar', autenticarToken, esAdministrador, InventarioController.ajustarStock);

/**
 * @route POST /api/inventario/:id/generar-qr
 * @description Generar código QR para un ítem
 * @access Private
 */
router.post('/:id/generar-qr', autenticarToken, InventarioController.generarQRItem);

/**
 * @route GET /api/inventario/:id/descargar-qr
 * @description Descargar imagen del código QR de un ítem
 * @access Private
 */
router.get('/:id/descargar-qr', autenticarToken, InventarioController.descargarQRItem);

/**
 * @route POST /api/inventario/generar-qr-masivo
 * @description Generar códigos QR para todos los ítems
 * @access Private (Admin)
 */
router.post('/generar-qr-masivo', autenticarToken, esAdministrador, InventarioController.generarQRMasivo);

module.exports = router;