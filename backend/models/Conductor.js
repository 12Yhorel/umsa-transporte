/**
 * MODELO DE CONDUCTOR - SISTEMA DE LA UNIDAD DE TRANSPORTE - UMSA
 * Gestión completa de conductores y sus habilitaciones
 * Universidad Mayor de San Andrés
 */

const { obtenerConexion, ejecutarConsulta } = require('../config/database');

class ModeloConductor {
    
    /**
     * Crear un nuevo conductor
     */
    static async crear(conductorData) {
        try {
            const {
                usuario_id,
                licencia_numero,
                licencia_categoria,
                licencia_vencimiento,
                telefono = null,
                habilitado = true
            } = conductorData;

            // Validaciones básicas
            if (!usuario_id || !licencia_numero || !licencia_categoria || !licencia_vencimiento) {
                throw new Error('Faltan campos requeridos: usuario_id, licencia_numero, licencia_categoria, licencia_vencimiento');
            }

            // Verificar que el usuario existe y es válido
            const usuarioExistente = await this.verificarUsuarioExistente(usuario_id);
            if (!usuarioExistente) {
                throw new Error('El usuario especificado no existe o no es válido');
            }

            // Verificar que el usuario no sea ya conductor
            const conductorExistente = await this.obtenerPorUsuarioId(usuario_id);
            if (conductorExistente) {
                throw new Error('El usuario ya está registrado como conductor');
            }

            // Verificar que la licencia no esté registrada
            const licenciaExistente = await this.obtenerPorLicencia(licencia_numero);
            if (licenciaExistente) {
                throw new Error('El número de licencia ya está registrado');
            }

            // Validar categoría de licencia
            const categoriasValidas = ['A', 'B', 'C', 'D', 'E'];
            if (!categoriasValidas.includes(licencia_categoria)) {
                throw new Error('Categoría de licencia no válida. Debe ser: A, B, C, D o E');
            }

            // Validar fecha de vencimiento
            const fechaVencimiento = new Date(licencia_vencimiento);
            const hoy = new Date();
            if (fechaVencimiento <= hoy) {
                throw new Error('La licencia debe tener una fecha de vencimiento futura');
            }

            const conexion = await obtenerConexion();
            
            const [resultado] = await conexion.execute(
                `INSERT INTO conductores 
                 (usuario_id, licencia_numero, licencia_categoria, licencia_vencimiento, telefono, habilitado) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [usuario_id, licencia_numero, licencia_categoria, licencia_vencimiento, telefono, habilitado]
            );

            // Obtener el conductor recién creado
            const conductorCreado = await this.obtenerPorId(resultado.insertId);
            
            // Registrar en auditoría
            await this.registrarAuditoria(
                'CREACION_CONDUCTOR',
                'conductores',
                resultado.insertId,
                null,
                { usuario_id, licencia_numero, licencia_categoria }
            );

            return conductorCreado;

        } catch (error) {
            console.error('Error en ModeloConductor.crear:', error.message);
            throw error;
        }
    }

    /**
     * Obtener conductor por ID
     */
    static async obtenerPorId(id) {
        try {
            const [conductores] = await ejecutarConsulta(
                `SELECT c.*, u.nombres, u.apellidos, u.email, u.departamento,
                        u.telefono as telefono_usuario
                 FROM conductores c 
                 INNER JOIN usuarios u ON c.usuario_id = u.id 
                 WHERE c.id = ? AND u.activo = TRUE`,
                [id]
            );

            if (conductores.length === 0) {
                return null;
            }

            const conductor = conductores[0];
            
            // Calcular días hasta vencimiento de licencia
            conductor.dias_vencimiento_licencia = this.calcularDiasVencimiento(conductor.licencia_vencimiento);
            conductor.licencia_proxima_vencer = conductor.dias_vencimiento_licencia <= 30;

            return conductor;

        } catch (error) {
            console.error('Error en ModeloConductor.obtenerPorId:', error.message);
            throw error;
        }
    }

    /**
     * Obtener conductor por ID de usuario
     */
    static async obtenerPorUsuarioId(usuarioId) {
        try {
            const [conductores] = await ejecutarConsulta(
                `SELECT c.*, u.nombres, u.apellidos, u.email, u.departamento
                 FROM conductores c 
                 INNER JOIN usuarios u ON c.usuario_id = u.id 
                 WHERE c.usuario_id = ? AND u.activo = TRUE`,
                [usuarioId]
            );

            if (conductores.length === 0) {
                return null;
            }

            const conductor = conductores[0];
            conductor.dias_vencimiento_licencia = this.calcularDiasVencimiento(conductor.licencia_vencimiento);
            conductor.licencia_proxima_vencer = conductor.dias_vencimiento_licencia <= 30;

            return conductor;

        } catch (error) {
            console.error('Error en ModeloConductor.obtenerPorUsuarioId:', error.message);
            throw error;
        }
    }

    /**
     * Obtener conductor por número de licencia
     */
    static async obtenerPorLicencia(licenciaNumero) {
        try {
            const [conductores] = await ejecutarConsulta(
                `SELECT c.*, u.nombres, u.apellidos, u.email, u.departamento
                 FROM conductores c 
                 INNER JOIN usuarios u ON c.usuario_id = u.id 
                 WHERE c.licencia_numero = ? AND u.activo = TRUE`,
                [licenciaNumero]
            );

            return conductores[0] || null;

        } catch (error) {
            console.error('Error en ModeloConductor.obtenerPorLicencia:', error.message);
            throw error;
        }
    }

    /**
     * Obtener todos los conductores con paginación y filtros
     */
    static async obtenerTodos(pagina = 1, limite = 10, filtros = {}) {
        try {
            // Convertir a enteros para evitar problemas con MySQL prepared statements
            pagina = parseInt(pagina);
            limite = parseInt(limite);
            const offset = (pagina - 1) * limite;
            let consulta = `
                SELECT c.*, u.nombres, u.apellidos, u.email, u.departamento,
                       u.telefono as telefono_usuario
                FROM conductores c 
                INNER JOIN usuarios u ON c.usuario_id = u.id 
                WHERE u.activo = TRUE
            `;
            
            const parametros = [];
            const condiciones = [];

            // Aplicar filtros
            if (filtros.habilitado !== undefined) {
                condiciones.push('c.habilitado = ?');
                parametros.push(filtros.habilitado);
            }

            if (filtros.licencia_categoria) {
                condiciones.push('c.licencia_categoria = ?');
                parametros.push(filtros.licencia_categoria);
            }

            if (filtros.departamento) {
                condiciones.push('u.departamento LIKE ?');
                parametros.push(`%${filtros.departamento}%`);
            }

            if (filtros.busqueda) {
                condiciones.push('(u.nombres LIKE ? OR u.apellidos LIKE ? OR u.email LIKE ? OR c.licencia_numero LIKE ?)');
                parametros.push(
                    `%${filtros.busqueda}%`, 
                    `%${filtros.busqueda}%`, 
                    `%${filtros.busqueda}%`,
                    `%${filtros.busqueda}%`
                );
            }

            // Filtro para licencias próximas a vencer
            if (filtros.licencia_proxima_vencer) {
                condiciones.push('c.licencia_vencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)');
            }

            // Filtro para licencias vencidas
            if (filtros.licencia_vencida) {
                condiciones.push('c.licencia_vencimiento < CURDATE()');
            }

            if (condiciones.length > 0) {
                consulta += ' AND ' + condiciones.join(' AND ');
            }

            // Ordenar y paginar - interpolar directamente LIMIT/OFFSET
            consulta += ` ORDER BY u.nombres, u.apellidos LIMIT ${limite} OFFSET ${offset}`;

            const [conductores] = await ejecutarConsulta(consulta, parametros);

            // Calcular días de vencimiento para cada conductor
            conductores.forEach(conductor => {
                conductor.dias_vencimiento_licencia = this.calcularDiasVencimiento(conductor.licencia_vencimiento);
                conductor.licencia_proxima_vencer = conductor.dias_vencimiento_licencia <= 30;
                conductor.licencia_vencida = conductor.dias_vencimiento_licencia < 0;
            });

            // Obtener total para paginación
            const total = await this.obtenerTotalConductores(filtros);

            return {
                conductores,
                paginacion: {
                    pagina: parseInt(pagina),
                    limite: parseInt(limite),
                    total,
                    totalPaginas: Math.ceil(total / limite)
                }
            };

        } catch (error) {
            console.error('Error en ModeloConductor.obtenerTodos:', error.message);
            throw error;
        }
    }

    /**
     * Obtener total de conductores con filtros
     */
    static async obtenerTotalConductores(filtros = {}) {
        try {
            let consulta = `
                SELECT COUNT(*) as total 
                FROM conductores c 
                INNER JOIN usuarios u ON c.usuario_id = u.id 
                WHERE u.activo = TRUE
            `;
            
            const parametros = [];
            const condiciones = [];

            // Aplicar filtros (misma lógica que obtenerTodos)
            if (filtros.habilitado !== undefined) {
                condiciones.push('c.habilitado = ?');
                parametros.push(filtros.habilitado);
            }

            if (filtros.licencia_categoria) {
                condiciones.push('c.licencia_categoria = ?');
                parametros.push(filtros.licencia_categoria);
            }

            if (filtros.departamento) {
                condiciones.push('u.departamento LIKE ?');
                parametros.push(`%${filtros.departamento}%`);
            }

            if (filtros.busqueda) {
                condiciones.push('(u.nombres LIKE ? OR u.apellidos LIKE ? OR u.email LIKE ? OR c.licencia_numero LIKE ?)');
                parametros.push(
                    `%${filtros.busqueda}%`, 
                    `%${filtros.busqueda}%`, 
                    `%${filtros.busqueda}%`,
                    `%${filtros.busqueda}%`
                );
            }

            if (filtros.licencia_proxima_vencer) {
                condiciones.push('c.licencia_vencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)');
            }

            if (filtros.licencia_vencida) {
                condiciones.push('c.licencia_vencimiento < CURDATE()');
            }

            if (condiciones.length > 0) {
                consulta += ' AND ' + condiciones.join(' AND ');
            }

            const [resultado] = await ejecutarConsulta(consulta, parametros);
            return resultado[0].total;

        } catch (error) {
            console.error('Error en ModeloConductor.obtenerTotalConductores:', error.message);
            throw error;
        }
    }

    /**
     * Actualizar conductor
     */
    static async actualizar(id, datosActualizacion) {
        try {
            // Verificar que el conductor existe
            const conductorExistente = await this.obtenerPorId(id);
            if (!conductorExistente) {
                throw new Error('Conductor no encontrado');
            }

            // Campos permitidos para actualización
            const camposPermitidos = [
                'licencia_numero', 'licencia_categoria', 'licencia_vencimiento', 
                'telefono', 'habilitado'
            ];
            
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

            // Si se actualiza la licencia, verificar que no exista
            if (datosActualizacion.licencia_numero && datosActualizacion.licencia_numero !== conductorExistente.licencia_numero) {
                const licenciaExistente = await this.obtenerPorLicencia(datosActualizacion.licencia_numero);
                if (licenciaExistente) {
                    throw new Error('El número de licencia ya está registrado');
                }
            }

            // Validar categoría de licencia si se actualiza
            if (datosActualizacion.licencia_categoria) {
                const categoriasValidas = ['A', 'B', 'C', 'D', 'E'];
                if (!categoriasValidas.includes(datosActualizacion.licencia_categoria)) {
                    throw new Error('Categoría de licencia no válida');
                }
            }

            // Validar fecha de vencimiento si se actualiza
            if (datosActualizacion.licencia_vencimiento) {
                const fechaVencimiento = new Date(datosActualizacion.licencia_vencimiento);
                const hoy = new Date();
                if (fechaVencimiento <= hoy) {
                    throw new Error('La licencia debe tener una fecha de vencimiento futura');
                }
            }

            const conexion = await obtenerConexion();
            const campos = Object.keys(camposActualizar);
            const valores = Object.values(camposActualizar);

            const setClause = campos.map(campo => `${campo} = ?`).join(', ');
            const consulta = `UPDATE conductores SET ${setClause} WHERE id = ?`;

            const [resultado] = await conexion.execute(consulta, [...valores, id]);

            if (resultado.affectedRows === 0) {
                throw new Error('No se pudo actualizar el conductor');
            }

            // Registrar en auditoría
            await this.registrarAuditoria(
                'ACTUALIZACION_CONDUCTOR',
                'conductores',
                id,
                conductorExistente,
                camposActualizar
            );

            // Obtener conductor actualizado
            const conductorActualizado = await this.obtenerPorId(id);
            return conductorActualizado;

        } catch (error) {
            console.error('Error en ModeloConductor.actualizar:', error.message);
            throw error;
        }
    }

    /**
     * Habilitar/Deshabilitar conductor
     */
    static async cambiarHabilitacion(id, habilitado) {
        try {
            // Verificar que el conductor existe
            const conductorExistente = await this.obtenerPorId(id);
            if (!conductorExistente) {
                throw new Error('Conductor no encontrado');
            }

            const [resultado] = await ejecutarConsulta(
                'UPDATE conductores SET habilitado = ? WHERE id = ?',
                [habilitado, id]
            );

            if (resultado.affectedRows === 0) {
                throw new Error('No se pudo cambiar el estado del conductor');
            }

            // Registrar en auditoría
            await this.registrarAuditoria(
                habilitado ? 'HABILITACION_CONDUCTOR' : 'DESHABILITACION_CONDUCTOR',
                'conductores',
                id,
                { habilitado: conductorExistente.habilitado },
                { habilitado }
            );

            return true;

        } catch (error) {
            console.error('Error en ModeloConductor.cambiarHabilitacion:', error.message);
            throw error;
        }
    }

    /**
     * Renovar licencia de conductor
     */
    static async renovarLicencia(id, nuevaFechaVencimiento) {
        try {
            // Verificar que el conductor existe
            const conductorExistente = await this.obtenerPorId(id);
            if (!conductorExistente) {
                throw new Error('Conductor no encontrado');
            }

            // Validar nueva fecha de vencimiento
            const fechaVencimiento = new Date(nuevaFechaVencimiento);
            const hoy = new Date();
            if (fechaVencimiento <= hoy) {
                throw new Error('La nueva fecha de vencimiento debe ser futura');
            }

            const [resultado] = await ejecutarConsulta(
                'UPDATE conductores SET licencia_vencimiento = ? WHERE id = ?',
                [nuevaFechaVencimiento, id]
            );

            if (resultado.affectedRows === 0) {
                throw new Error('No se pudo renovar la licencia');
            }

            // Registrar en auditoría
            await this.registrarAuditoria(
                'RENOVACION_LICENCIA',
                'conductores',
                id,
                { licencia_vencimiento: conductorExistente.licencia_vencimiento },
                { licencia_vencimiento: nuevaFechaVencimiento }
            );

            return true;

        } catch (error) {
            console.error('Error en ModeloConductor.renovarLicencia:', error.message);
            throw error;
        }
    }

    /**
     * Obtener conductores habilitados para un vehículo específico
     */
    static async obtenerHabilitadosParaVehiculo(vehiculoId) {
        try {
            // Primero obtener información del vehículo
            const [vehiculos] = await ejecutarConsulta(
                'SELECT * FROM vehiculos WHERE id = ?',
                [vehiculoId]
            );

            if (vehiculos.length === 0) {
                throw new Error('Vehículo no encontrado');
            }

            const vehiculo = vehiculos[0];

            // Determinar categoría requerida según tipo de vehículo
            let categoriaRequerida = 'B'; // Categoría por defecto para vehículos pequeños
            
            if (vehiculo.capacidad > 20) {
                categoriaRequerida = 'D'; // Para buses
            } else if (vehiculo.capacidad > 9) {
                categoriaRequerida = 'C'; // Para minibuses
            }

            const [conductores] = await ejecutarConsulta(
                `SELECT c.*, u.nombres, u.apellidos, u.email
                 FROM conductores c 
                 INNER JOIN usuarios u ON c.usuario_id = u.id 
                 WHERE c.habilitado = TRUE 
                 AND u.activo = TRUE
                 AND c.licencia_vencimiento > CURDATE()
                 AND c.licencia_categoria = ?
                 ORDER BY u.nombres, u.apellidos`,
                [categoriaRequerida]
            );

            // Calcular días de vencimiento
            conductores.forEach(conductor => {
                conductor.dias_vencimiento_licencia = this.calcularDiasVencimiento(conductor.licencia_vencimiento);
                conductor.licencia_proxima_vencer = conductor.dias_vencimiento_licencia <= 30;
            });

            return {
                conductores,
                vehiculo,
                categoria_requerida: categoriaRequerida
            };

        } catch (error) {
            console.error('Error en ModeloConductor.obtenerHabilitadosParaVehiculo:', error.message);
            throw error;
        }
    }

    /**
     * Obtener conductores con licencias próximas a vencer
     */
    static async obtenerConLicenciasProximasVencer(diasAnticipacion = 30) {
        try {
            const [conductores] = await ejecutarConsulta(
                `SELECT c.*, u.nombres, u.apellidos, u.email, u.departamento,
                        DATEDIFF(c.licencia_vencimiento, CURDATE()) as dias_para_vencer
                 FROM conductores c 
                 INNER JOIN usuarios u ON c.usuario_id = u.id 
                 WHERE c.habilitado = TRUE 
                 AND u.activo = TRUE
                 AND c.licencia_vencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
                 ORDER BY c.licencia_vencimiento ASC`,
                [diasAnticipacion]
            );

            return conductores;

        } catch (error) {
            console.error('Error en ModeloConductor.obtenerConLicenciasProximasVencer:', error.message);
            throw error;
        }
    }

    /**
     * Obtener conductores con licencias vencidas
     */
    static async obtenerConLicenciasVencidas() {
        try {
            const [conductores] = await ejecutarConsulta(
                `SELECT c.*, u.nombres, u.apellidos, u.email, u.departamento,
                        DATEDIFF(CURDATE(), c.licencia_vencimiento) as dias_vencido
                 FROM conductores c 
                 INNER JOIN usuarios u ON c.usuario_id = u.id 
                 WHERE c.habilitado = TRUE 
                 AND u.activo = TRUE
                 AND c.licencia_vencimiento < CURDATE()
                 ORDER BY c.licencia_vencimiento ASC`
            );

            return conductores;

        } catch (error) {
            console.error('Error en ModeloConductor.obtenerConLicenciasVencidas:', error.message);
            throw error;
        }
    }

    /**
     * Obtener estadísticas de conductores
     */
    static async obtenerEstadisticas() {
        try {
            const [estadisticas] = await ejecutarConsulta(`
                SELECT 
                    COUNT(*) as total_conductores,
                    SUM(CASE WHEN c.habilitado = TRUE THEN 1 ELSE 0 END) as habilitados,
                    SUM(CASE WHEN c.habilitado = FALSE THEN 1 ELSE 0 END) as no_habilitados,
                    COUNT(DISTINCT u.departamento) as departamentos_con_conductores,
                    SUM(CASE WHEN c.licencia_vencimiento < CURDATE() THEN 1 ELSE 0 END) as licencias_vencidas,
                    SUM(CASE WHEN c.licencia_vencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as licencias_proximas_vencer
                FROM conductores c 
                INNER JOIN usuarios u ON c.usuario_id = u.id 
                WHERE u.activo = TRUE
            `);

            const [distribucionCategorias] = await ejecutarConsulta(`
                SELECT licencia_categoria, COUNT(*) as cantidad
                FROM conductores c 
                INNER JOIN usuarios u ON c.usuario_id = u.id 
                WHERE u.activo = TRUE AND c.habilitado = TRUE
                GROUP BY licencia_categoria
                ORDER BY cantidad DESC
            `);

            const [distribucionDepartamentos] = await ejecutarConsulta(`
                SELECT u.departamento, COUNT(*) as cantidad
                FROM conductores c 
                INNER JOIN usuarios u ON c.usuario_id = u.id 
                WHERE u.activo = TRUE AND c.habilitado = TRUE
                GROUP BY u.departamento
                ORDER BY cantidad DESC
            `);

            return {
                general: estadisticas[0],
                por_categoria: distribucionCategorias,
                por_departamento: distribucionDepartamentos
            };

        } catch (error) {
            console.error('Error en ModeloConductor.obtenerEstadisticas:', error.message);
            throw error;
        }
    }

    /**
     * Obtener historial de asignaciones de un conductor
     */
    static async obtenerHistorialAsignaciones(conductorId, limite = 10) {
        try {
            const [asignaciones] = await ejecutarConsulta(
                `SELECT a.*, v.placa, v.marca, v.modelo, u.nombres as asignador_nombres, u.apellidos as asignador_apellidos
                 FROM asignaciones a 
                 INNER JOIN vehiculos v ON a.vehiculo_id = v.id 
                 INNER JOIN usuarios u ON a.asignado_por = u.id 
                 WHERE a.conductor_id = ? 
                 ORDER BY a.fecha_asignacion DESC
                 LIMIT ?`,
                [conductorId, limite]
            );

            return asignaciones;

        } catch (error) {
            console.error('Error en ModeloConductor.obtenerHistorialAsignaciones:', error.message);
            throw error;
        }
    }

    /**
     * Obtener asignación activa de un conductor
     */
    static async obtenerAsignacionActiva(conductorId) {
        try {
            const [asignaciones] = await ejecutarConsulta(
                `SELECT a.*, v.placa, v.marca, v.modelo, v.capacidad, v.tipo_combustible,
                        u.nombres as asignador_nombres, u.apellidos as asignador_apellidos
                 FROM asignaciones a 
                 INNER JOIN vehiculos v ON a.vehiculo_id = v.id 
                 INNER JOIN usuarios u ON a.asignado_por = u.id 
                 WHERE a.conductor_id = ? AND a.activa = TRUE
                 ORDER BY a.fecha_asignacion DESC
                 LIMIT 1`,
                [conductorId]
            );

            return asignaciones[0] || null;

        } catch (error) {
            console.error('Error en ModeloConductor.obtenerAsignacionActiva:', error.message);
            throw error;
        }
    }

    /**
     * Buscar conductores por término
     */
    static async buscar(termino, limite = 10) {
        try {
            const [conductores] = await ejecutarConsulta(
                `SELECT c.id, u.nombres, u.apellidos, u.email, u.departamento,
                        c.licencia_numero, c.licencia_categoria, c.habilitado
                 FROM conductores c 
                 INNER JOIN usuarios u ON c.usuario_id = u.id 
                 WHERE u.activo = TRUE 
                 AND (u.nombres LIKE ? OR u.apellidos LIKE ? OR u.email LIKE ? OR c.licencia_numero LIKE ?)
                 ORDER BY u.nombres, u.apellidos
                 LIMIT ?`,
                [`%${termino}%`, `%${termino}%`, `%${termino}%`, `%${termino}%`, limite]
            );

            return conductores;

        } catch (error) {
            console.error('Error en ModeloConductor.buscar:', error.message);
            throw error;
        }
    }

    /**
     * Métodos auxiliares privados
     */

    /**
     * Verificar que el usuario existe y es válido
     */
    static async verificarUsuarioExistente(usuarioId) {
        try {
            const [usuarios] = await ejecutarConsulta(
                'SELECT id FROM usuarios WHERE id = ? AND activo = TRUE',
                [usuarioId]
            );

            return usuarios.length > 0;

        } catch (error) {
            console.error('Error verificando usuario:', error.message);
            return false;
        }
    }

    /**
     * Calcular días hasta vencimiento de licencia
     */
    static calcularDiasVencimiento(fechaVencimiento) {
        const vencimiento = new Date(fechaVencimiento);
        const hoy = new Date();
        const diferenciaTiempo = vencimiento.getTime() - hoy.getTime();
        const diferenciaDias = Math.ceil(diferenciaTiempo / (1000 * 3600 * 24));
        return diferenciaDias;
    }

    /**
     * Registrar acción en auditoría
     */
    static async registrarAuditoria(accion, tabla, registroId, datosAnteriores, datosNuevos) {
        try {
            await ejecutarConsulta(
                `INSERT INTO auditoria_sistema 
                 (accion, tabla_afectada, registro_id, datos_anteriores, datos_nuevos) 
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    accion,
                    tabla,
                    registroId,
                    datosAnteriores ? JSON.stringify(datosAnteriores) : null,
                    datosNuevos ? JSON.stringify(datosNuevos) : null
                ]
            );

        } catch (error) {
            console.error('Error registrando auditoría de conductor:', error.message);
        }
    }

    /**
     * Obtener total de conductores (para estadísticas del sistema)
     */
    static async obtenerTotal() {
        try {
            const [resultado] = await ejecutarConsulta(
                `SELECT COUNT(*) as total 
                 FROM conductores c 
                 INNER JOIN usuarios u ON c.usuario_id = u.id 
                 WHERE u.activo = TRUE`
            );

            return resultado[0].total;

        } catch (error) {
            console.error('Error en ModeloConductor.obtenerTotal:', error.message);
            throw error;
        }
    }

    /**
     * Obtener conductores más activos (para dashboard)
     */
    static async obtenerMasActivos(limite = 5) {
        try {
            const [conductores] = await ejecutarConsulta(
                `SELECT c.*, u.nombres, u.apellidos, u.departamento,
                        COUNT(r.id) as total_reservas
                 FROM conductores c 
                 INNER JOIN usuarios u ON c.usuario_id = u.id 
                 LEFT JOIN reservas r ON c.id = r.conductor_id AND r.estado = 'COMPLETADA'
                 WHERE c.habilitado = TRUE AND u.activo = TRUE
                 GROUP BY c.id
                 ORDER BY total_reservas DESC
                 LIMIT ?`,
                [limite]
            );

            return conductores;

        } catch (error) {
            console.error('Error en ModeloConductor.obtenerMasActivos:', error.message);
            throw error;
        }
    }

    // Alias para compatibilidad con controllers
    static async obtenerTodosConductores(pagina, limite, filtros) {
        return this.obtenerTodos(pagina, limite, filtros);
    }

    static async obtenerConductorPorId(id) {
        return this.obtenerPorId(id);
    }

    static async actualizarConductor(id, datosActualizacion) {
        return this.actualizar(id, datosActualizacion);
    }

    static async habilitarConductor(id) {
        return this.habilitar(id);
    }

    static async deshabilitarConductor(id) {
        return this.deshabilitar(id);
    }

    static async obtenerConductoresDisponibles(fecha, horaInicio, horaFin) {
        return this.obtenerDisponibles(fecha, horaInicio, horaFin);
    }

    static async obtenerAlertasVencimiento(dias) {
        return this.obtenerAlertasVencimiento(dias);
    }

    static async habilitar(id) {
        return this.cambiarHabilitacion(id, true);
    }

    static async deshabilitar(id) {
        return this.cambiarHabilitacion(id, false);
    }

    static async obtenerDisponibles(fecha, horaInicio, horaFin) {
        // Obtener conductores habilitados sin conflictos en el horario
        try {
            const [conductores] = await ejecutarConsulta(
                `SELECT DISTINCT c.id, u.nombres, u.apellidos, u.email, c.licencia_numero, c.licencia_categoria
                 FROM conductores c
                 INNER JOIN usuarios u ON c.usuario_id = u.id
                 WHERE c.habilitado = TRUE
                 AND u.activo = TRUE
                 AND c.licencia_vencimiento > CURDATE()
                 AND c.id NOT IN (
                    SELECT DISTINCT r.conductor_id
                    FROM reservas r
                    WHERE r.conductor_id IS NOT NULL
                    AND r.fecha_reserva = ?
                    AND (
                        (r.hora_inicio < ? AND r.hora_fin > ?)
                        OR (r.hora_inicio < ? AND r.hora_fin > ?)
                    )
                    AND r.estado NOT IN ('CANCELADA', 'RECHAZADA')
                 )
                 ORDER BY u.nombres, u.apellidos`,
                [fecha, horaFin, horaInicio, horaFin, horaInicio]
            );
            return conductores;
        } catch (error) {
            console.error('Error en ModeloConductor.obtenerDisponibles:', error.message);
            throw error;
        }
    }

    static async obtenerAlertasVencimiento(dias = 30) {
        return this.obtenerConLicenciasProximasVencer(dias);
    }

    /**
     * Eliminar conductor
     */
    static async eliminar(id, usuarioId = null) {
        const conexion = await obtenerConexion();
        try {
            // Obtener conductor antes de eliminar
            const conductor = await this.obtenerPorId(id);
            if (!conductor) {
                throw new Error('Conductor no encontrado');
            }

            // Registrar en auditoría ANTES de eliminar
            await this.registrarAuditoria(
                'ELIMINACION_CONDUCTOR',
                'conductores',
                id,
                {
                    conductor_id: id,
                    licencia_numero: conductor.licencia_numero,
                    usuario_id: conductor.usuario_id,
                    nombres: conductor.nombres,
                    apellidos: conductor.apellidos
                },
                null
            );

            // Eliminar registros de auditoría del conductor
            await conexion.execute(
                'DELETE FROM auditoria_sistema WHERE tabla_afectada = ? AND registro_id = ?',
                ['conductores', id]
            );

            // Intentar eliminar el conductor
            const [resultado] = await conexion.execute(
                'DELETE FROM conductores WHERE id = ?',
                [id]
            );

            if (resultado.affectedRows === 0) {
                throw new Error('No se pudo eliminar el conductor');
            }

            return { success: true, message: 'Conductor eliminado correctamente' };

        } catch (error) {
            console.error('Error en ModeloConductor.eliminar:', error.message);
            
            // Si es un error de clave foránea, dar un mensaje más claro
            if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                throw new Error('No se puede eliminar el conductor porque tiene reservas asociadas. Considere deshabilitarlo en su lugar.');
            }
            
            throw error;
        }
    }
}

module.exports = ModeloConductor;