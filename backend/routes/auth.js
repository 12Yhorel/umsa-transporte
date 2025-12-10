const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { autenticarToken } = require('../middleware/auth');

/**
 * @route POST /api/auth/login
 * @description Iniciar sesión
 * @access Public
 */
router.post('/login', AuthController.login);

/**
 * @route POST /api/auth/registro
 * @description Registro público de solicitantes
 * @access Public
 */
router.post('/registro', AuthController.registroPublico);

/**
 * @route POST /api/auth/registrar
 * @description Registrar nuevo usuario (solo administradores)
 * @access Private (Admin)
 */
router.post('/registrar', autenticarToken, AuthController.registrar);

/**
 * @route GET /api/auth/perfil
 * @description Obtener perfil del usuario autenticado
 * @access Private
 */
router.get('/perfil', autenticarToken, AuthController.obtenerPerfil);

/**
 * @route PUT /api/auth/perfil
 * @description Actualizar perfil del usuario
 * @access Private
 */
router.put('/perfil', autenticarToken, AuthController.actualizarPerfil);

/**
 * @route PUT /api/auth/cambiar-password
 * @description Cambiar contraseña
 * @access Private
 */
router.put('/cambiar-password', autenticarToken, AuthController.cambiarPassword);

/**
 * @route GET /api/auth/verificar
 * @description Verificar token
 * @access Private
 */
router.get('/verificar', autenticarToken, AuthController.verificarToken);

/**
 * @route POST /api/auth/recuperar-password
 * @description Solicitar recuperación de contraseña
 * @access Public
 */
router.post('/recuperar-password', AuthController.solicitarRecuperacion);

/**
 * @route GET /api/auth/validar-token/:token
 * @description Validar token de recuperación
 * @access Public
 */
router.get('/validar-token/:token', AuthController.validarTokenRecuperacion);

/**
 * @route POST /api/auth/restablecer-password
 * @description Restablecer contraseña con token
 * @access Public
 */
router.post('/restablecer-password', AuthController.restablecerPasswordConToken);

module.exports = router;