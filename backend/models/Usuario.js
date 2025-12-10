/**
 * MODELO DE USUARIO - SISTEMA DE LA UNIDAD DE TRANSPORTE - UMSA
 * Gestión completa de usuarios, roles y autenticación
 * Universidad Mayor de San Andrés
 */

const { obtenerConexion, ejecutarConsulta } = require('../config/database');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { generarToken } = require('../middleware/auth');

class ModeloUsuario {
    
    /**
     * Crear un nuevo usuario
     */
    static async crear(usuarioData) {
        try {
            const {
                email,
                password,
                nombres,
                apellidos,
                telefono = null,
                departamento = null,
                rol_id
            } = usuarioData;

            // Validaciones básicas
            if (!email || !password || !nombres || !apellidos || !rol_id) {
                throw new Error('Faltan campos requeridos para crear el usuario');
            }

            // Verificar que el email no exista
            const usuarioExistente = await this.obtenerPorEmail(email);
            if (usuarioExistente) {
                throw new Error('El email ya está registrado en el sistema');
            }

            // Encriptar contraseña
            const saltRounds = 10;
            const passwordEncriptada = await bcrypt.hash(password, saltRounds);

            const conexion = await obtenerConexion();
            
            const [resultado] = await conexion.execute(
                `INSERT INTO usuarios 
                 (email, password, nombres, apellidos, telefono, departamento, rol_id) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [email, passwordEncriptada, nombres, apellidos, telefono, departamento, rol_id]
            );

            // Obtener el usuario recién creado
            const usuarioCreado = await this.obtenerPorId(resultado.insertId);
            
            // Registrar en auditoría
            await this.registrarAuditoria(
                resultado.insertId,
                'CREACION_USUARIO',
                'usuarios',
                null,
                { email, nombres, apellidos, rol_id }
            );

            return usuarioCreado;

        } catch (error) {
            console.error('Error en ModeloUsuario.crear:', error.message);
            throw error;
        }
    }

    /**
     * Obtener usuario por ID
     */
    static async obtenerPorId(id) {
        try {
            const [usuarios] = await ejecutarConsulta(
                `SELECT u.*, r.nombre as rol_nombre, r.nivel_acceso, r.descripcion as rol_descripcion
                 FROM usuarios u 
                 INNER JOIN roles r ON u.rol_id = r.id 
                 WHERE u.id = ?`,
                [id]
            );

            if (usuarios.length === 0) {
                return null;
            }

            const usuario = usuarios[0];
            
            // Eliminar información sensible
            delete usuario.password;
            
            return usuario;

        } catch (error) {
            console.error('Error en ModeloUsuario.obtenerPorId:', error.message);
            throw error;
        }
    }

    /**
     * Obtener usuario por email
     */
    static async obtenerPorEmail(email) {
        try {
            const [usuarios] = await ejecutarConsulta(
                `SELECT u.*, r.nombre as rol_nombre, r.nivel_acceso 
                 FROM usuarios u 
                 INNER JOIN roles r ON u.rol_id = r.id 
                 WHERE u.email = ? AND u.activo = TRUE`,
                [email]
            );

            return usuarios[0] || null;

        } catch (error) {
            console.error('Error en ModeloUsuario.obtenerPorEmail:', error.message);
            throw error;
        }
    }

    /**
     * Obtener todos los usuarios con paginación
     */
    static async obtenerTodos(pagina = 1, limite = 10, filtros = {}) {
        try {
            const offset = (pagina - 1) * limite;
            let consulta = `
                SELECT u.*, r.nombre as rol_nombre, r.descripcion as rol_descripcion
                FROM usuarios u 
                INNER JOIN roles r ON u.rol_id = r.id 
                WHERE 1=1
            `;
            
            const parametros = [];
            const condiciones = [];

            // Filtro de estado activo (si no se especifica, mostrar todos)
            if (filtros.activo !== undefined) {
                condiciones.push('u.activo = ?');
                parametros.push(filtros.activo);
            }

            // Aplicar filtros
            if (filtros.rol_id) {
                condiciones.push('u.rol_id = ?');
                parametros.push(filtros.rol_id);
            }

            if (filtros.departamento) {
                condiciones.push('u.departamento LIKE ?');
                parametros.push(`%${filtros.departamento}%`);
            }

            if (filtros.busqueda) {
                condiciones.push('(u.nombres LIKE ? OR u.apellidos LIKE ? OR u.email LIKE ?)');
                parametros.push(`%${filtros.busqueda}%`, `%${filtros.busqueda}%`, `%${filtros.busqueda}%`);
            }

            if (condiciones.length > 0) {
                consulta += ' AND ' + condiciones.join(' AND ');
            }

            // Ordenar
            consulta += ' ORDER BY u.nombres, u.apellidos';

            // Validar y preparar LIMIT/OFFSET como enteros seguros (evitar problemas con prepared statements en algunos drivers)
            const limiteInt = parseInt(limite, 10) || 10;
            const offsetInt = parseInt(offset, 10) || 0;

            // Debug: mostrar consulta y parámetros para diagnosticar

            // Concatenar LIMIT/OFFSET directamente después de validar los enteros
            const consultaFinal = `${consulta} LIMIT ${limiteInt} OFFSET ${offsetInt}`;

            const [usuarios] = await ejecutarConsulta(consultaFinal, parametros);

            // Obtener total para paginación
            const total = await this.obtenerTotalUsuarios(filtros);

            // Eliminar contraseñas de los resultados
            usuarios.forEach(usuario => delete usuario.password);

            return {
                usuarios,
                paginacion: {
                    pagina: parseInt(pagina),
                    limite: parseInt(limite),
                    total,
                    totalPaginas: Math.ceil(total / limite)
                }
            };

        } catch (error) {
            console.error('Error en ModeloUsuario.obtenerTodos:', error.message);
            throw error;
        }
    }

    /**
     * Obtener total de usuarios con filtros
     */
    static async obtenerTotalUsuarios(filtros = {}) {
        try {
            let consulta = `
                SELECT COUNT(*) as total 
                FROM usuarios u 
                WHERE 1=1
            `;
            
            const parametros = [];
            const condiciones = [];

            // Filtro de estado activo
            if (filtros.activo !== undefined) {
                condiciones.push('u.activo = ?');
                parametros.push(filtros.activo);
            }

            // Aplicar filtros
            if (filtros.rol_id) {
                condiciones.push('u.rol_id = ?');
                parametros.push(filtros.rol_id);
            }

            if (filtros.departamento) {
                condiciones.push('u.departamento LIKE ?');
                parametros.push(`%${filtros.departamento}%`);
            }

            if (filtros.busqueda) {
                condiciones.push('(u.nombres LIKE ? OR u.apellidos LIKE ? OR u.email LIKE ?)');
                parametros.push(`%${filtros.busqueda}%`, `%${filtros.busqueda}%`, `%${filtros.busqueda}%`);
            }

            if (condiciones.length > 0) {
                consulta += ' AND ' + condiciones.join(' AND ');
            }

            const [resultado] = await ejecutarConsulta(consulta, parametros);
            return resultado[0].total;

        } catch (error) {
            console.error('Error en ModeloUsuario.obtenerTotalUsuarios:', error.message);
            throw error;
        }
    }

    /**
     * Actualizar usuario
     */
    static async actualizar(id, datosActualizacion) {
        try {
            // Verificar que el usuario existe
            const usuarioExistente = await this.obtenerPorId(id);
            if (!usuarioExistente) {
                throw new Error('Usuario no encontrado');
            }

            // Campos permitidos para actualización
            const camposPermitidos = ['nombres', 'apellidos', 'telefono', 'departamento', 'rol_id', 'activo'];
            const camposActualizar = {};
            
            for (const campo of camposPermitidos) {
                if (datosActualizacion[campo] !== undefined) {
                    camposActualizar[campo] = datosActualizacion[campo];
                }
            }

            // Si no hay campos para actualizar
            if (Object.keys(camposActualizar).length === 0) {
                throw new Error('No se proporcionaron campos válidos para actualizar');
            }

            // Si se actualiza el email, verificar que no exista
            if (datosActualizacion.email && datosActualizacion.email !== usuarioExistente.email) {
                const emailExistente = await this.obtenerPorEmail(datosActualizacion.email);
                if (emailExistente) {
                    throw new Error('El email ya está registrado');
                }
                camposActualizar.email = datosActualizacion.email;
            }

            // Si se actualiza la contraseña, encriptarla
            if (datosActualizacion.password) {
                const saltRounds = 10;
                camposActualizar.password = await bcrypt.hash(datosActualizacion.password, saltRounds);
            }

            const conexion = await obtenerConexion();
            const campos = Object.keys(camposActualizar);
            const valores = Object.values(camposActualizar);

            const setClause = campos.map(campo => `${campo} = ?`).join(', ');
            const consulta = `UPDATE usuarios SET ${setClause} WHERE id = ?`;

            const [resultado] = await conexion.execute(consulta, [...valores, id]);

            if (resultado.affectedRows === 0) {
                throw new Error('No se pudo actualizar el usuario');
            }

            // Registrar en auditoría
            await this.registrarAuditoria(
                id,
                'ACTUALIZACION_USUARIO',
                'usuarios',
                usuarioExistente,
                camposActualizar
            );

            // Obtener usuario actualizado
            const usuarioActualizado = await this.obtenerPorId(id);
            return usuarioActualizado;

        } catch (error) {
            console.error('Error en ModeloUsuario.actualizar:', error.message);
            throw error;
        }
    }

    /**
     * Desactivar usuario (eliminación lógica)
     */
    static async desactivar(id) {
        try {
            // Verificar que el usuario existe
            const usuarioExistente = await this.obtenerPorId(id);
            if (!usuarioExistente) {
                throw new Error('Usuario no encontrado');
            }

            const [resultado] = await ejecutarConsulta(
                'UPDATE usuarios SET activo = FALSE WHERE id = ?',
                [id]
            );

            if (resultado.affectedRows === 0) {
                throw new Error('No se pudo desactivar el usuario');
            }

            // Registrar en auditoría
            await this.registrarAuditoria(
                id,
                'DESACTIVACION_USUARIO',
                'usuarios',
                usuarioExistente,
                { activo: false }
            );

            return true;

        } catch (error) {
            console.error('Error en ModeloUsuario.desactivar:', error.message);
            throw error;
        }
    }

    /**
     * Eliminar usuario (borrado físico) - sólo si no rompe integridad
     */
    static async eliminar(id) {
        try {
            const usuarioExistente = await this.obtenerPorId(id);
            if (!usuarioExistente) {
                throw new Error('Usuario no encontrado');
            }

            // Registrar auditoría ANTES de eliminar (antes de que se pierdan las referencias)
            await this.registrarAuditoria(
                id,
                'ELIMINACION_USUARIO',
                'usuarios',
                usuarioExistente,
                null
            );

            // Eliminar registros de auditoría asociados a este usuario
            // (para evitar violación de clave foránea)
            await ejecutarConsulta(
                'DELETE FROM auditoria_sistema WHERE usuario_id = ?',
                [id]
            );

            // Ahora sí, eliminar el usuario
            const [resultado] = await ejecutarConsulta(
                'DELETE FROM usuarios WHERE id = ?',
                [id]
            );

            if (resultado.affectedRows === 0) {
                throw new Error('No se pudo eliminar el usuario');
            }

            return true;

        } catch (error) {
            // Detectar error de integridad referencial
            if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                throw new Error('El usuario tiene registros asociados (reservas, reparaciones, etc.) y no puede eliminarse. Desactive en su lugar.');
            }
            console.error('Error en ModeloUsuario.eliminar:', error.message);
            throw error;
        }
    }

    /**
     * Verificar credenciales de login
     */
    static async verificarCredenciales(email, password) {
        try {
            const usuario = await this.obtenerPorEmail(email);
            
            if (!usuario) {
                return { valido: false, mensaje: 'Credenciales inválidas' };
            }

            const passwordValida = await bcrypt.compare(password, usuario.password);
            
            if (!passwordValida) {
                return { valido: false, mensaje: 'Credenciales inválidas' };
            }

            // Eliminar contraseña del objeto usuario
            delete usuario.password;

            return {
                valido: true,
                usuario,
                token: generarToken({
                    id: usuario.id,
                    email: usuario.email,
                    rol: usuario.rol_nombre,
                    nivel_acceso: usuario.nivel_acceso
                })
            };

        } catch (error) {
            console.error('Error en ModeloUsuario.verificarCredenciales:', error.message);
            throw error;
        }
    }

    /**
     * Cambiar contraseña
     */
    static async cambiarPassword(id, passwordActual, nuevaPassword) {
        try {
            // Obtener usuario con contraseña
            const [usuarios] = await ejecutarConsulta(
                'SELECT * FROM usuarios WHERE id = ? AND activo = TRUE',
                [id]
            );

            if (usuarios.length === 0) {
                throw new Error('Usuario no encontrado');
            }

            const usuario = usuarios[0];

            // Verificar contraseña actual
            const passwordActualValida = await bcrypt.compare(passwordActual, usuario.password);
            if (!passwordActualValida) {
                throw new Error('La contraseña actual es incorrecta');
            }

            // Encriptar nueva contraseña
            const saltRounds = 10;
            const nuevaPasswordEncriptada = await bcrypt.hash(nuevaPassword, saltRounds);

            // Actualizar contraseña
            const [resultado] = await ejecutarConsulta(
                'UPDATE usuarios SET password = ? WHERE id = ?',
                [nuevaPasswordEncriptada, id]
            );

            if (resultado.affectedRows === 0) {
                throw new Error('No se pudo cambiar la contraseña');
            }

            // Registrar en auditoría
            await this.registrarAuditoria(
                id,
                'CAMBIO_PASSWORD',
                'usuarios',
                null,
                { cambio_password: true }
            );

            return true;

        } catch (error) {
            console.error('Error en ModeloUsuario.cambiarPassword:', error.message);
            throw error;
        }
    }

    /**
     * Restablecer contraseña (para administradores)
     */
    static async restablecerPassword(id, nuevaPassword) {
        try {
            // Verificar que el usuario existe
            const usuarioExistente = await this.obtenerPorId(id);
            if (!usuarioExistente) {
                throw new Error('Usuario no encontrado');
            }

            // Encriptar nueva contraseña
            const saltRounds = 10;
            const nuevaPasswordEncriptada = await bcrypt.hash(nuevaPassword, saltRounds);

            // Actualizar contraseña
            const [resultado] = await ejecutarConsulta(
                'UPDATE usuarios SET password = ? WHERE id = ?',
                [nuevaPasswordEncriptada, id]
            );

            if (resultado.affectedRows === 0) {
                throw new Error('No se pudo restablecer la contraseña');
            }

            // Registrar en auditoría
            await this.registrarAuditoria(
                id,
                'RESTABLECIMIENTO_PASSWORD',
                'usuarios',
                null,
                { restablecimiento_password: true }
            );

            return true;

        } catch (error) {
            console.error('Error en ModeloUsuario.restablecerPassword:', error.message);
            throw error;
        }
    }

    /**
     * Generar token de recuperación de contraseña
     */
    static async generarTokenRecuperacion(email) {
        try {
            // Verificar que el usuario existe
            const usuario = await this.obtenerPorEmail(email);
            if (!usuario) {
                throw new Error('No existe una cuenta con ese email');
            }

            // Generar token aleatorio
            const token = crypto.randomBytes(32).toString('hex');
            const expiracion = new Date();
            expiracion.setHours(expiracion.getHours() + 1); // Token válido por 1 hora

            // Guardar token en la base de datos
            await ejecutarConsulta(
                `UPDATE usuarios 
                 SET token_recuperacion = ?, 
                     token_recuperacion_expira = ? 
                 WHERE id = ?`,
                [token, expiracion, usuario.id]
            );

            return { token, usuario };

        } catch (error) {
            console.error('Error en ModeloUsuario.generarTokenRecuperacion:', error.message);
            throw error;
        }
    }

    /**
     * Validar token de recuperación
     */
    static async validarTokenRecuperacion(token) {
        try {
            const [usuarios] = await ejecutarConsulta(
                `SELECT id, email, nombres, apellidos, token_recuperacion_expira 
                 FROM usuarios 
                 WHERE token_recuperacion = ? AND activo = TRUE`,
                [token]
            );

            if (usuarios.length === 0) {
                throw new Error('Token inválido');
            }

            const usuario = usuarios[0];
            const ahora = new Date();
            const expiracion = new Date(usuario.token_recuperacion_expira);

            if (ahora > expiracion) {
                throw new Error('El token ha expirado');
            }

            return usuario;

        } catch (error) {
            console.error('Error en ModeloUsuario.validarTokenRecuperacion:', error.message);
            throw error;
        }
    }

    /**
     * Restablecer contraseña con token
     */
    static async restablecerPasswordConToken(token, nuevaPassword) {
        try {
            // Validar token
            const usuario = await this.validarTokenRecuperacion(token);

            // Encriptar nueva contraseña
            const saltRounds = 10;
            const nuevaPasswordEncriptada = await bcrypt.hash(nuevaPassword, saltRounds);

            // Actualizar contraseña y limpiar token
            const [resultado] = await ejecutarConsulta(
                `UPDATE usuarios 
                 SET password = ?, 
                     token_recuperacion = NULL, 
                     token_recuperacion_expira = NULL 
                 WHERE id = ?`,
                [nuevaPasswordEncriptada, usuario.id]
            );

            if (resultado.affectedRows === 0) {
                throw new Error('No se pudo restablecer la contraseña');
            }

            // Registrar en auditoría
            await this.registrarAuditoria(
                usuario.id,
                'RECUPERACION_PASSWORD',
                'usuarios',
                null,
                { recuperacion_password: true }
            );

            return true;

        } catch (error) {
            console.error('Error en ModeloUsuario.restablecerPasswordConToken:', error.message);
            throw error;
        }
    }

    /**
     * Obtener todos los roles
     */
    static async obtenerTodosRoles() {
        try {
            const [roles] = await ejecutarConsulta(
                'SELECT * FROM roles ORDER BY nivel_acceso DESC'
            );

            return roles;

        } catch (error) {
            console.error('Error en ModeloUsuario.obtenerTodosRoles:', error.message);
            throw error;
        }
    }

    /**
     * Obtener usuarios por rol
     */
    static async obtenerPorRol(nombreRol) {
        try {
            const [usuarios] = await ejecutarConsulta(
                `SELECT u.*, r.nombre as rol_nombre 
                 FROM usuarios u 
                 INNER JOIN roles r ON u.rol_id = r.id 
                 WHERE r.nombre = ? AND u.activo = TRUE 
                 ORDER BY u.nombres, u.apellidos`,
                [nombreRol]
            );

            // Eliminar contraseñas
            usuarios.forEach(usuario => delete usuario.password);

            return usuarios;

        } catch (error) {
            console.error('Error en ModeloUsuario.obtenerPorRol:', error.message);
            throw error;
        }
    }

    /**
     * Crear rol si no existe (para inicialización)
     */
    static async crearRolSiNoExiste(rolData) {
        try {
            const { nombre, descripcion, nivel_acceso } = rolData;

            // Verificar si el rol ya existe
            const [rolesExistentes] = await ejecutarConsulta(
                'SELECT id FROM roles WHERE nombre = ?',
                [nombre]
            );

            if (rolesExistentes.length > 0) {
                return rolesExistentes[0].id;
            }

            // Crear nuevo rol
            const [resultado] = await ejecutarConsulta(
                'INSERT INTO roles (nombre, descripcion, nivel_acceso) VALUES (?, ?, ?)',
                [nombre, descripcion, nivel_acceso]
            );

            return resultado.insertId;

        } catch (error) {
            console.error('Error en ModeloUsuario.crearRolSiNoExiste:', error.message);
            throw error;
        }
    }

    /**
     * Obtener estadísticas de usuarios
     */
    static async obtenerEstadisticas() {
        try {
            const [estadisticas] = await ejecutarConsulta(`
                SELECT 
                    COUNT(*) as total_usuarios,
                    SUM(CASE WHEN activo = TRUE THEN 1 ELSE 0 END) as usuarios_activos,
                    SUM(CASE WHEN activo = FALSE THEN 1 ELSE 0 END) as usuarios_inactivos,
                    COUNT(DISTINCT departamento) as total_departamentos,
                    (SELECT COUNT(*) FROM usuarios WHERE DATE(creado_en) = CURDATE()) as nuevos_hoy
                FROM usuarios
            `);

            const [distribucionRoles] = await ejecutarConsulta(`
                SELECT r.nombre, COUNT(u.id) as cantidad
                FROM roles r 
                LEFT JOIN usuarios u ON r.id = u.rol_id AND u.activo = TRUE
                GROUP BY r.id, r.nombre
                ORDER BY r.nivel_acceso DESC
            `);

            return {
                general: estadisticas[0],
                por_rol: distribucionRoles
            };

        } catch (error) {
            console.error('Error en ModeloUsuario.obtenerEstadisticas:', error.message);
            throw error;
        }
    }

    /**
     * Buscar usuarios por término
     */
    static async buscar(termino, limite = 10) {
        try {
            const [usuarios] = await ejecutarConsulta(
                `SELECT u.id, u.email, u.nombres, u.apellidos, u.departamento, 
                        r.nombre as rol_nombre
                 FROM usuarios u 
                 INNER JOIN roles r ON u.rol_id = r.id 
                 WHERE u.activo = TRUE 
                 AND (u.nombres LIKE ? OR u.apellidos LIKE ? OR u.email LIKE ? OR u.departamento LIKE ?)
                 ORDER BY u.nombres, u.apellidos
                 LIMIT ?`,
                [`%${termino}%`, `%${termino}%`, `%${termino}%`, `%${termino}%`, limite]
            );

            return usuarios;

        } catch (error) {
            console.error('Error en ModeloUsuario.buscar:', error.message);
            throw error;
        }
    }

    /**
     * Registrar acción en auditoría
     */
    static async registrarAuditoria(usuarioId, accion, tabla, datosAnteriores, datosNuevos) {
        try {
            await ejecutarConsulta(
                `INSERT INTO auditoria_sistema 
                 (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores, datos_nuevos) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    usuarioId,
                    accion,
                    tabla,
                    usuarioId,
                    datosAnteriores ? JSON.stringify(datosAnteriores) : null,
                    datosNuevos ? JSON.stringify(datosNuevos) : null
                ]
            );

        } catch (error) {
            console.error('Error registrando auditoría:', error.message);
            // No lanzar error para no afectar la operación principal
        }
    }

    /**
     * Limpiar registros antiguos de auditoría
     */
    static async limpiarAuditoriaAntigua(fechaLimite) {
        try {
            const [resultado] = await ejecutarConsulta(
                'DELETE FROM auditoria_sistema WHERE creado_en < ?',
                [fechaLimite]
            );

            return resultado.affectedRows;

        } catch (error) {
            console.error('Error en ModeloUsuario.limpiarAuditoriaAntigua:', error.message);
            return 0;
        }
    }

    /**
     * Obtener total de usuarios (para estadísticas del sistema)
     */
    static async obtenerTotal() {
        try {
            const [resultado] = await ejecutarConsulta(
                'SELECT COUNT(*) as total FROM usuarios WHERE activo = TRUE'
            );

            return resultado[0].total;

        } catch (error) {
            console.error('Error en ModeloUsuario.obtenerTotal:', error.message);
            throw error;
        }
    }
}

module.exports = ModeloUsuario;