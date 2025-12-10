/**
 * MIDDLEWARE DE AUTENTICACIÓN - SISTEMA DE LA UNIDAD DE TRANSPORTE - UMSA
 * Autenticación JWT y autorización por roles
 * Universidad Mayor de San Andrés
 */

const jwt = require('jsonwebtoken');
const { obtenerConexion } = require('../config/database');

class MiddlewareAutenticacion {
    /**
     * Verificar token JWT
     */
    verificarToken = async (req, res, next) => {
        try {
            // Obtener token del header
            const token = this.extraerToken(req);
            
            if (!token) {
                return res.status(401).json({
                    error: true,
                    mensaje: 'Token de acceso requerido',
                    codigo: 'TOKEN_NO_PROVISTO'
                });
            }

            // Verificar y decodificar token
            const decodificado = jwt.verify(token, process.env.JWT_SECRET);
            
            // Verificar que el usuario existe y está activo
            const usuario = await this.verificarUsuarioBD(decodificado.id);
            
            if (!usuario) {
                return res.status(401).json({
                    error: true,
                    mensaje: 'Usuario no encontrado o inactivo',
                    codigo: 'USUARIO_NO_VALIDO'
                });
            }

            // Adjuntar información del usuario al request
            req.usuario = {
                id: usuario.id,
                email: usuario.email,
                nombres: usuario.nombres,
                apellidos: usuario.apellidos,
                rol_id: usuario.rol_id,
                rol: usuario.rol_nombre,
                nivel_acceso: usuario.nivel_acceso,
                departamento: usuario.departamento,
                telefono: usuario.telefono
            };

            // Registrar acceso (opcional, para auditoría)
            // Pasamos `req` para que la función pueda obtener la IP correctamente
            await this.registrarAcceso(req.usuario.id, req.method, req.originalUrl, req);

            next();

        } catch (error) {
            console.error('❌ Error en verificación de token:', error.message);
            
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    error: true,
                    mensaje: 'Token inválido',
                    codigo: 'TOKEN_INVALIDO'
                });
            }

            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    error: true,
                    mensaje: 'Token expirado',
                    codigo: 'TOKEN_EXPIRADO'
                });
            }

            return res.status(500).json({
                error: true,
                mensaje: 'Error en autenticación',
                codigo: 'ERROR_AUTENTICACION'
            });
        }
    }

    /**
     * Verificar roles específicos
     */
    verificarRol = (rolesPermitidos) => {
        return (req, res, next) => {
            try {
                if (!req.usuario) {
                    return res.status(401).json({
                        error: true,
                        mensaje: 'Usuario no autenticado',
                        codigo: 'USUARIO_NO_AUTENTICADO'
                    });
                }

                if (!rolesPermitidos.includes(req.usuario.rol)) {
                    return res.status(403).json({
                        error: true,
                        mensaje: `No tiene permisos para realizar esta acción. Rol requerido: ${rolesPermitidos.join(', ')}`,
                        codigo: 'ACCESO_DENEGADO',
                        rol_actual: req.usuario.rol,
                        roles_permitidos: rolesPermitidos
                    });
                }

                next();

            } catch (error) {
                console.error('❌ Error en verificación de rol:', error.message);
                return res.status(500).json({
                    error: true,
                    mensaje: 'Error en verificación de permisos',
                    codigo: 'ERROR_VERIFICACION_ROL'
                });
            }
        }
    }

    /**
     * Verificar nivel de acceso mínimo
     */
    verificarNivelAcceso = (nivelMinimo) => {
        return (req, res, next) => {
            try {
                if (!req.usuario) {
                    return res.status(401).json({
                        error: true,
                        mensaje: 'Usuario no autenticado',
                        codigo: 'USUARIO_NO_AUTENTICADO'
                    });
                }

                if (req.usuario.nivel_acceso < nivelMinimo) {
                    return res.status(403).json({
                        error: true,
                        mensaje: `Nivel de acceso insuficiente. Nivel requerido: ${nivelMinimo}`,
                        codigo: 'NIVEL_ACCESO_INSUFICIENTE',
                        nivel_actual: req.usuario.nivel_acceso,
                        nivel_requerido: nivelMinimo
                    });
                }

                next();

            } catch (error) {
                console.error('❌ Error en verificación de nivel de acceso:', error.message);
                return res.status(500).json({
                    error: true,
                    mensaje: 'Error en verificación de nivel de acceso',
                    codigo: 'ERROR_VERIFICACION_NIVEL'
                });
            }
        }
    }

    /**
     * Middleware para verificar si el usuario es propietario del recurso o tiene rol adecuado
     */
    verificarPropietarioOAdmin = (campoId = 'id') => {
        return (req, res, next) => {
            try {
                if (!req.usuario) {
                    return res.status(401).json({
                        error: true,
                        mensaje: 'Usuario no autenticado',
                        codigo: 'USUARIO_NO_AUTENTICADO'
                    });
                }

                // Si es administrador, permitir acceso
                if (req.usuario.rol === 'ADMINISTRADOR') {
                    return next();
                }

                // Obtener ID del recurso de los parámetros
                const idRecurso = req.params[campoId];
                
                if (!idRecurso) {
                    return res.status(400).json({
                        error: true,
                        mensaje: `ID de recurso no especificado en parámetro: ${campoId}`,
                        codigo: 'ID_RECURSO_NO_ESPECIFICADO'
                    });
                }

                // Si el usuario intenta acceder a su propio recurso, permitir
                if (parseInt(idRecurso) === req.usuario.id) {
                    return next();
                }

                // Denegar acceso para otros casos
                return res.status(403).json({
                    error: true,
                    mensaje: 'Solo puede acceder a sus propios recursos',
                    codigo: 'ACCESO_RECURSO_DENEGADO'
                });

            } catch (error) {
                console.error('❌ Error en verificación de propiedad:', error.message);
                return res.status(500).json({
                    error: true,
                    mensaje: 'Error en verificación de propiedad del recurso',
                    codigo: 'ERROR_VERIFICACION_PROPIEDAD'
                });
            }
        }
    }

    /**
     * Middleware para verificar si el usuario puede gestionar reservas
     */
    verificarPermisosReservas = () => {
        return async (req, res, next) => {
            try {
                if (!req.usuario) {
                    return res.status(401).json({
                        error: true,
                        mensaje: 'Usuario no autenticado',
                        codigo: 'USUARIO_NO_AUTENTICADO'
                    });
                }

                const rolesPermitidos = ['ADMINISTRADOR', 'TECNICO', 'SOLICITANTE'];
                
                if (!rolesPermitidos.includes(req.usuario.rol)) {
                    return res.status(403).json({
                        error: true,
                        mensaje: 'No tiene permisos para gestionar reservas',
                        codigo: 'PERMISOS_RESERVAS_INSUFICIENTES',
                        rol_actual: req.usuario.rol,
                        roles_permitidos: rolesPermitidos
                    });
                }

                // Verificaciones adicionales para SOLICITANTE
                if (req.usuario.rol === 'SOLICITANTE') {
                    // Un solicitante solo puede ver/editar sus propias reservas
                    if (req.method !== 'POST' && req.params.id) {
                        const puedeAcceder = await this.verificarReservaPropia(req.usuario.id, req.params.id);
                        if (!puedeAcceder) {
                            return res.status(403).json({
                                error: true,
                                mensaje: 'Solo puede acceder a sus propias reservas',
                                codigo: 'RESERVA_NO_PROPIA'
                            });
                        }
                    }
                }

                next();

            } catch (error) {
                console.error('❌ Error en verificación de permisos de reservas:', error.message);
                return res.status(500).json({
                    error: true,
                    mensaje: 'Error en verificación de permisos de reservas',
                    codigo: 'ERROR_VERIFICACION_RESERVAS'
                });
            }
        }
    }

    /**
     * Middleware para verificar permisos de inventario
     */
    verificarPermisosInventario = () => {
        return (req, res, next) => {
            try {
                if (!req.usuario) {
                    return res.status(401).json({
                        error: true,
                        mensaje: 'Usuario no autenticado',
                        codigo: 'USUARIO_NO_AUTENTICADO'
                    });
                }

                const rolesPermitidos = ['ADMINISTRADOR', 'TECNICO'];
                
                if (!rolesPermitidos.includes(req.usuario.rol)) {
                    return res.status(403).json({
                        error: true,
                        mensaje: 'No tiene permisos para gestionar inventario',
                        codigo: 'PERMISOS_INVENTARIO_INSUFICIENTES',
                        rol_actual: req.usuario.rol,
                        roles_permitidos: rolesPermitidos
                    });
                }

                next();

            } catch (error) {
                console.error('❌ Error en verificación de permisos de inventario:', error.message);
                return res.status(500).json({
                    error: true,
                    mensaje: 'Error en verificación de permisos de inventario',
                    codigo: 'ERROR_VERIFICACION_INVENTARIO'
                });
            }
        }
    }

    /**
     * Middleware para verificar permisos de reparaciones
     */
    verificarPermisosReparaciones = () => {
        return (req, res, next) => {
            try {
                if (!req.usuario) {
                    return res.status(401).json({
                        error: true,
                        mensaje: 'Usuario no autenticado',
                        codigo: 'USUARIO_NO_AUTENTICADO'
                    });
                }

                const rolesPermitidos = ['ADMINISTRADOR', 'TECNICO'];
                
                if (!rolesPermitidos.includes(req.usuario.rol)) {
                    return res.status(403).json({
                        error: true,
                        mensaje: 'No tiene permisos para gestionar reparaciones',
                        codigo: 'PERMISOS_REPARACIONES_INSUFICIENTES',
                        rol_actual: req.usuario.rol,
                        roles_permitidos: rolesPermitidos
                    });
                }

                next();

            } catch (error) {
                console.error('❌ Error en verificación de permisos de reparaciones:', error.message);
                return res.status(500).json({
                    error: true,
                    mensaje: 'Error en verificación de permisos de reparaciones',
                    codigo: 'ERROR_VERIFICACION_REPARACIONES'
                });
            }
        }
    }

    /**
     * Middleware para verificar permisos de conductores
     */
    verificarPermisosConductores = () => {
        return (req, res, next) => {
            try {
                if (!req.usuario) {
                    return res.status(401).json({
                        error: true,
                        mensaje: 'Usuario no autenticado',
                        codigo: 'USUARIO_NO_AUTENTICADO'
                    });
                }

                const rolesPermitidos = ['ADMINISTRADOR', 'TECNICO', 'CONDUCTOR'];
                
                if (!rolesPermitidos.includes(req.usuario.rol)) {
                    return res.status(403).json({
                        error: true,
                        mensaje: 'No tiene permisos para gestionar conductores',
                        codigo: 'PERMISOS_CONDUCTORES_INSUFICIENTES',
                        rol_actual: req.usuario.rol,
                        roles_permitidos: rolesPermitidos
                    });
                }

                // Conductores solo pueden ver su propia información
                if (req.usuario.rol === 'CONDUCTOR' && req.method !== 'GET') {
                    return res.status(403).json({
                        error: true,
                        mensaje: 'Los conductores solo pueden consultar su información',
                        codigo: 'PERMISOS_CONDUCTOR_LIMITADOS'
                    });
                }

                next();

            } catch (error) {
                console.error('❌ Error en verificación de permisos de conductores:', error.message);
                return res.status(500).json({
                    error: true,
                    mensaje: 'Error en verificación de permisos de conductores',
                    codigo: 'ERROR_VERIFICACION_CONDUCTORES'
                });
            }
        }
    }

    /**
     * Métodos auxiliares privados
     */

    /**
     * Extraer token del header de autorización
     */
    extraerToken(req) {
        const authHeader = req.header('Authorization');
        
        if (!authHeader) {
            return null;
        }

        // Formato: "Bearer <token>"
        const partes = authHeader.split(' ');
        
        if (partes.length !== 2 || partes[0] !== 'Bearer') {
            return null;
        }

        return partes[1];
    }

    /**
     * Verificar usuario en base de datos
     */
    async verificarUsuarioBD(usuarioId) {
        try {
            const conexion = await obtenerConexion();
            
            const [usuarios] = await conexion.execute(
                `SELECT u.*, r.nombre as rol_nombre, r.nivel_acceso 
                 FROM usuarios u 
                 INNER JOIN roles r ON u.rol_id = r.id 
                 WHERE u.id = ? AND u.activo = TRUE`,
                [usuarioId]
            );

            return usuarios[0] || null;

        } catch (error) {
            console.error('❌ Error verificando usuario en BD:', error.message);
            throw error;
        }
    }

    /**
     * Verificar si una reserva pertenece al usuario
     */
    async verificarReservaPropia(usuarioId, reservaId) {
        try {
            const conexion = await obtenerConexion();
            
            const [reservas] = await conexion.execute(
                'SELECT id FROM reservas WHERE id = ? AND solicitante_id = ?',
                [reservaId, usuarioId]
            );

            return reservas.length > 0;

        } catch (error) {
            console.error('❌ Error verificando propiedad de reserva:', error.message);
            return false;
        }
    }

    /**
     * Registrar acceso para auditoría
     */
    async registrarAcceso(usuarioId, metodo, endpoint, req = null) {
        try {
            // No registrar en desarrollo para evitar spam y ralentización
            // Cambiar DEBUG_AUDIT=true en .env para habilitar en desarrollo
            if (process.env.NODE_ENV === 'development' && process.env.DEBUG_AUDIT !== 'true') {
                return;
            }

            const conexion = await obtenerConexion();
            
            // No esperar la inserción (fire-and-forget en producción)
            conexion.execute(
                `INSERT INTO auditoria_sistema 
                 (usuario_id, accion, tabla_afectada, ip_address) 
                 VALUES (?, ?, ?, ?)`,
                [
                    usuarioId, 
                    `${metodo} ${endpoint}`, 
                    'acceso_sistema',
                    req ? this.obtenerIP(req) : '127.0.0.1'
                ]
            ).catch(err => {
                // No fallar la request principal por error de auditoría
                console.error('❌ Error registrando acceso:', err.message);
            });

        } catch (error) {
            // Silencioso: no afectar request
        }
    }

    /**
     * Obtener IP del cliente
     */
    obtenerIP(req) {
        return req.ip || 
               req.connection.remoteAddress || 
               req.socket.remoteAddress ||
               (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
               '127.0.0.1';
    }

    /**
     * Generar token JWT
     */
    generarToken(payload) {
        return jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN
        });
    }

    /**
     * Verificar token sin middleware (para uso directo)
     */
    async verificarTokenDirecto(token) {
        try {
            const decodificado = jwt.verify(token, process.env.JWT_SECRET);
            const usuario = await this.verificarUsuarioBD(decodificado.id);
            return usuario ? { ...decodificado, usuario } : null;
        } catch (error) {
            return null;
        }
    }
}

// Crear instancia y exportar
const middlewareAuth = new MiddlewareAutenticacion();

/**
 * Middleware específico para verificar si es administrador
 */
const esAdministrador = (req, res, next) => {
    if (!req.usuario) {
        return res.status(401).json({
            error: true,
            mensaje: 'Usuario no autenticado',
            codigo: 'USUARIO_NO_AUTENTICADO'
        });
    }

    if (req.usuario.rol !== 'ADMINISTRADOR' && req.usuario.rol_id !== 1) {
        return res.status(403).json({
            error: true,
            mensaje: 'Se requieren permisos de administrador',
            codigo: 'ACCESO_DENEGADO'
        });
    }

    next();
};

/**
 * Middleware específico para verificar si es técnico
 */
const esTecnico = (req, res, next) => {
    if (!req.usuario) {
        return res.status(401).json({
            error: true,
            mensaje: 'Usuario no autenticado',
            codigo: 'USUARIO_NO_AUTENTICADO'
        });
    }

    // Permitir si es admin o técnico (rol_id 1 o 2)
    if (req.usuario.rol !== 'ADMINISTRADOR' && req.usuario.rol !== 'TECNICO' && 
        req.usuario.rol_id !== 1 && req.usuario.rol_id !== 2) {
        return res.status(403).json({
            error: true,
            mensaje: 'Se requieren permisos de técnico',
            codigo: 'ACCESO_DENEGADO'
        });
    }

    next();
};

/**
 * Middleware específico para verificar si es conductor
 */
const esConductor = (req, res, next) => {
    if (!req.usuario) {
        return res.status(401).json({
            error: true,
            mensaje: 'Usuario no autenticado',
            codigo: 'USUARIO_NO_AUTENTICADO'
        });
    }

    // Permitir si es admin o conductor (rol_id 1 o 3)
    if (req.usuario.rol !== 'ADMINISTRADOR' && req.usuario.rol !== 'CONDUCTOR' && 
        req.usuario.rol_id !== 1 && req.usuario.rol_id !== 3) {
        return res.status(403).json({
            error: true,
            mensaje: 'Se requieren permisos de conductor',
            codigo: 'ACCESO_DENEGADO'
        });
    }

    next();
};

/**
 * Middleware específico para verificar si es solicitante
 */
const esSolicitante = (req, res, next) => {
    if (!req.usuario) {
        return res.status(401).json({
            error: true,
            mensaje: 'Usuario no autenticado',
            codigo: 'USUARIO_NO_AUTENTICADO'
        });
    }

    // Permitir si es admin o solicitante (rol_id 1 o 4)
    if (req.usuario.rol !== 'ADMINISTRADOR' && req.usuario.rol !== 'SOLICITANTE' && 
        req.usuario.rol_id !== 1 && req.usuario.rol_id !== 4) {
        return res.status(403).json({
            error: true,
            mensaje: 'Se requieren permisos de solicitante',
            codigo: 'ACCESO_DENEGADO'
        });
    }

    next();
};

// Exportar métodos individualmente para mayor flexibilidad
module.exports = {
    // Middlewares principales
    verificarToken: middlewareAuth.verificarToken,
    autenticarToken: middlewareAuth.verificarToken,  // Alias para compatibilidad
    esAdministrador: esAdministrador,
    esTecnico: esTecnico,
    esConductor: esConductor,
    esSolicitante: esSolicitante,
    verificarRol: middlewareAuth.verificarRol,
    verificarNivelAcceso: middlewareAuth.verificarNivelAcceso,
    verificarPropietarioOAdmin: middlewareAuth.verificarPropietarioOAdmin,
    
    // Middlewares específicos de módulos
    verificarPermisosReservas: middlewareAuth.verificarPermisosReservas,
    verificarPermisosInventario: middlewareAuth.verificarPermisosInventario,
    verificarPermisosReparaciones: middlewareAuth.verificarPermisosReparaciones,
    verificarPermisosConductores: middlewareAuth.verificarPermisosConductores,
    
    // Utilidades
    generarToken: middlewareAuth.generarToken,
    verificarTokenDirecto: middlewareAuth.verificarTokenDirecto,
    
    // Instancia completa (para casos especiales)
    middlewareAuth
};