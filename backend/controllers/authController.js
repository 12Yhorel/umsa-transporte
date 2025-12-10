const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const ModeloUsuario = require('../models/Usuario');
const emailService = require('../utils/emailService');

class AuthController {
    
    /**
     * Login de usuario
     */
    static async login(req, res) {
        try {
            const { email, password } = req.body;

            // Validaciones
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email y contraseña son requeridos'
                });
            }

            // Buscar usuario por email
            const usuario = await ModeloUsuario.obtenerPorEmail(email);
            if (!usuario) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas'
                });
            }

            // Verificar si el usuario está activo
            if (!usuario.activo) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario desactivado. Contacte al administrador.'
                });
            }

            // Verificar contraseña
            const passwordValida = await bcrypt.compare(password, usuario.password);
            if (!passwordValida) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas'
                });
            }

            // Generar token JWT
            const token = jwt.sign(
                { 
                    id: usuario.id, 
                    email: usuario.email,
                    rol_id: usuario.rol_id,
                    nombres: usuario.nombres,
                    apellidos: usuario.apellidos
                },
                process.env.JWT_SECRET || 'umsa_transporte_secret',
                { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
            );

            // Registrar login en auditoría
            await ModeloUsuario.registrarAuditoria(
                usuario.id,
                'LOGIN_EXITOSO',
                'usuarios',
                null,
                { ultimo_login: new Date() }
            );

            res.json({
                success: true,
                message: 'Login exitoso',
                data: {
                    token,
                    usuario: {
                        id: usuario.id,
                        email: usuario.email,
                        nombres: usuario.nombres,
                        apellidos: usuario.apellidos,
                        rol_id: usuario.rol_id,
                        departamento: usuario.departamento,
                        telefono: usuario.telefono
                    }
                }
            });

        } catch (error) {
            console.error('Error en AuthController.login:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Registro público - Crear cuenta de solicitante
     */
    static async registroPublico(req, res) {
        try {
            const { email, password, nombres, apellidos, telefono, departamento } = req.body;

            // Validaciones
            if (!email || !password || !nombres || !apellidos) {
                return res.status(400).json({
                    success: false,
                    message: 'Email, contraseña, nombres y apellidos son requeridos'
                });
            }

            // Validar formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Formato de email inválido'
                });
            }

            // Validar longitud de contraseña
            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'La contraseña debe tener al menos 6 caracteres'
                });
            }

            // Crear usuario con rol de solicitante (rol_id = 4)
            const usuarioData = {
                email,
                password,
                nombres,
                apellidos,
                telefono: telefono || null,
                departamento: departamento || null,
                rol_id: 4  // Solicitante
            };

            const nuevoUsuario = await ModeloUsuario.crear(usuarioData);

            // Enviar email de bienvenida (opcional, no bloquea el registro)
            try {
                await emailService.enviarEmailBienvenida(
                    nuevoUsuario.email,
                    nuevoUsuario.nombres + ' ' + nuevoUsuario.apellidos
                );
                console.log('✓ Email de bienvenida enviado a:', nuevoUsuario.email);
            } catch (emailError) {
                console.error('✗ Error al enviar email de bienvenida:', emailError.message);
            }

            // Generar token para login automático
            const token = jwt.sign(
                { 
                    id: nuevoUsuario.id, 
                    email: nuevoUsuario.email,
                    rol_id: nuevoUsuario.rol_id,
                    nombres: nuevoUsuario.nombres,
                    apellidos: nuevoUsuario.apellidos
                },
                process.env.JWT_SECRET || 'umsa_transporte_secret',
                { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
            );

            res.status(201).json({
                success: true,
                message: 'Usuario registrado exitosamente',
                data: {
                    token,
                    usuario: nuevoUsuario
                }
            });

        } catch (error) {
            console.error('Error en AuthController.registroPublico:', error.message);
            
            // Manejo de errores específicos
            if (error.message.includes('email ya está registrado')) {
                return res.status(409).json({
                    success: false,
                    message: 'El email ya está registrado'
                });
            }
            
            res.status(400).json({
                success: false,
                message: 'Error al registrar usuario: ' + error.message
            });
        }
    }

    /**
     * Registro de nuevo usuario (solo administradores)
     */
    static async registrar(req, res) {
        try {
            const usuarioData = req.body;

            // Verificar permisos (solo administradores pueden registrar usuarios)
            if (req.usuario.rol_id !== 1) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para registrar usuarios'
                });
            }

            const nuevoUsuario = await ModeloUsuario.crear(usuarioData);

            res.status(201).json({
                success: true,
                message: 'Usuario registrado exitosamente',
                data: nuevoUsuario
            });

        } catch (error) {
            console.error('Error en AuthController.registrar:', error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Obtener perfil del usuario autenticado
     */
    static async obtenerPerfil(req, res) {
        try {
            const usuario = await ModeloUsuario.obtenerPorId(req.usuario.id);

            if (!usuario) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            res.json({
                success: true,
                data: usuario
            });

        } catch (error) {
            console.error('Error en AuthController.obtenerPerfil:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Actualizar perfil del usuario
     */
    static async actualizarPerfil(req, res) {
        try {
            const { id } = req.usuario;
            const datosActualizacion = req.body;

            // Remover campos que no pueden ser actualizados por el usuario
            delete datosActualizacion.rol_id;
            delete datosActualizacion.activo;
            delete datosActualizacion.password;

            const usuarioActualizado = await ModeloUsuario.actualizar(id, datosActualizacion);

            res.json({
                success: true,
                message: 'Perfil actualizado exitosamente',
                data: usuarioActualizado
            });

        } catch (error) {
            console.error('Error en AuthController.actualizarPerfil:', error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Cambiar contraseña
     */
    static async cambiarPassword(req, res) {
        try {
            const { id } = req.usuario;
            const { password_actual, nueva_password } = req.body;

            if (!password_actual || !nueva_password) {
                return res.status(400).json({
                    success: false,
                    message: 'Contraseña actual y nueva contraseña son requeridas'
                });
            }

            // Verificar contraseña actual
            const usuario = await ModeloUsuario.obtenerPorId(id);
            const passwordValida = await bcrypt.compare(password_actual, usuario.password);

            if (!passwordValida) {
                return res.status(401).json({
                    success: false,
                    message: 'Contraseña actual incorrecta'
                });
            }

            // Actualizar contraseña
            await ModeloUsuario.cambiarPassword(id, password_actual, nueva_password);

            res.json({
                success: true,
                message: 'Contraseña actualizada exitosamente'
            });

        } catch (error) {
            console.error('Error en AuthController.cambiarPassword:', error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Verificar token
     */
    static async verificarToken(req, res) {
        try {
            const usuario = await ModeloUsuario.obtenerPorId(req.usuario.id);

            res.json({
                success: true,
                data: {
                    usuario: {
                        id: usuario.id,
                        email: usuario.email,
                        nombres: usuario.nombres,
                        apellidos: usuario.apellidos,
                        rol_id: usuario.rol_id,
                        departamento: usuario.departamento
                    },
                    valido: true
                }
            });

        } catch (error) {
            console.error('Error en AuthController.verificarToken:', error.message);
            res.status(401).json({
                success: false,
                message: 'Token inválido'
            });
        }
    }

    /**
     * Solicitar recuperación de contraseña
     */
    static async solicitarRecuperacion(req, res) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'El email es requerido'
                });
            }

            // Generar token de recuperación
            const { token, usuario } = await ModeloUsuario.generarTokenRecuperacion(email);

            // Enviar email con el enlace de recuperación
            try {
                await emailService.enviarEmailRecuperacion(
                    usuario.email,
                    usuario.nombres + ' ' + usuario.apellidos,
                    token
                );
                
                console.log('✓ Email de recuperación enviado a:', usuario.email);
                console.log('Token generado:', token);
                console.log('URL de recuperación: http://localhost:4200/restablecer-password?token=' + token);
            } catch (emailError) {
                console.error('✗ Error al enviar email:', emailError.message);
                // Aún así devolvemos éxito para no revelar si el email existe
                // En producción, se debería reintentar o encolar el envío
            }

            res.json({
                success: true,
                message: 'Si el email existe, recibirás un enlace de recuperación',
                // Solo en desarrollo - REMOVER EN PRODUCCIÓN
                ...(process.env.NODE_ENV === 'development' && {
                    data: {
                        token,
                        url: `${process.env.FRONTEND_URL}/restablecer-password?token=${token}`
                    }
                })
            });

        } catch (error) {
            console.error('Error en AuthController.solicitarRecuperacion:', error.message);
            
            // Por seguridad, siempre devolvemos el mismo mensaje
            // para no revelar si el email existe o no
            res.json({
                success: true,
                message: 'Si el email existe, recibirás un enlace de recuperación'
            });
        }
    }

    /**
     * Validar token de recuperación
     */
    static async validarTokenRecuperacion(req, res) {
        try {
            const { token } = req.params;

            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: 'Token no proporcionado'
                });
            }

            const usuario = await ModeloUsuario.validarTokenRecuperacion(token);

            res.json({
                success: true,
                message: 'Token válido',
                data: {
                    email: usuario.email
                }
            });

        } catch (error) {
            console.error('Error en AuthController.validarTokenRecuperacion:', error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Restablecer contraseña con token
     */
    static async restablecerPasswordConToken(req, res) {
        try {
            const { token, nueva_password } = req.body;

            if (!token || !nueva_password) {
                return res.status(400).json({
                    success: false,
                    message: 'Token y nueva contraseña son requeridos'
                });
            }

            if (nueva_password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'La contraseña debe tener al menos 6 caracteres'
                });
            }

            // Validar token primero para obtener datos del usuario
            const usuario = await ModeloUsuario.validarTokenRecuperacion(token);
            
            // Restablecer contraseña
            await ModeloUsuario.restablecerPasswordConToken(token, nueva_password);

            // Enviar email de confirmación
            try {
                await emailService.enviarEmailConfirmacionCambio(
                    usuario.email,
                    usuario.nombres + ' ' + usuario.apellidos
                );
                console.log('✓ Email de confirmación enviado a:', usuario.email);
            } catch (emailError) {
                console.error('✗ Error al enviar email de confirmación:', emailError.message);
                // No bloqueamos el cambio de contraseña por error de email
            }

            res.json({
                success: true,
                message: 'Contraseña restablecida exitosamente'
            });

        } catch (error) {
            console.error('Error en AuthController.restablecerPasswordConToken:', error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = AuthController;