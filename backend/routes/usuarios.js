const express = require('express');
const router = express.Router();
const UsuarioController = require('../controllers/usuarioController');
const { autenticarToken, esAdministrador } = require('../middleware/auth');

/**
 * @route GET /api/usuarios
 * @description Obtener todos los usuarios
 * @access Private (Admin)
 */
router.get('/', autenticarToken, esAdministrador, UsuarioController.obtenerTodos);

/**
 * @route GET /api/usuarios/estadisticas
 * @description Obtener estadísticas de usuarios
 * @access Private (Admin)
 */
router.get('/estadisticas', autenticarToken, esAdministrador, UsuarioController.obtenerEstadisticas);

/**
 * @route GET /api/usuarios/reporte-pdf
 * @description Generar reporte PDF de usuarios
 * @access Private (Admin)
 */
router.get('/reporte-pdf', autenticarToken, esAdministrador, UsuarioController.generarReportePDF);

/**
 * @route GET /api/usuarios/roles
 * @description Obtener lista de roles
 * @access Private (cualquier usuario autenticado)
 */
router.get('/roles', autenticarToken, UsuarioController.obtenerRoles);

/**
 * @route GET /api/usuarios/:id
 * @description Obtener usuario por ID
 * @access Private (Admin o propio usuario)
 */
router.get('/:id', autenticarToken, UsuarioController.obtenerPorId);

/**
 * @route POST /api/usuarios
 * @description Crear nuevo usuario
 * @access Private (Admin)
 */
router.post('/', autenticarToken, esAdministrador, UsuarioController.crear);

/**
 * @route PUT /api/usuarios/:id
 * @description Actualizar usuario
 * @access Private (Admin o propio usuario)
 */
router.put('/:id', autenticarToken, UsuarioController.actualizar);

/**
 * @route PUT /api/usuarios/:id/desactivar
 * @description Desactivar usuario
 * @access Private (Admin)
 */
router.put('/:id/desactivar', autenticarToken, esAdministrador, UsuarioController.desactivar);

/**
 * @route PUT /api/usuarios/:id/activar
 * @description Activar usuario
 * @access Private (Admin)
 */
router.put('/:id/activar', autenticarToken, esAdministrador, UsuarioController.activar);

/**
 * @route DELETE /api/usuarios/:id
 * @description Eliminar usuario (borrado físico)
 * @access Private (Admin)
 */
router.delete('/:id', autenticarToken, esAdministrador, UsuarioController.eliminar);

module.exports = router;