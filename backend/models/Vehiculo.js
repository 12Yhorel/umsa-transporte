/**
 * MODELO DE VEHÍCULO - SISTEMA DE LA UNIDAD DE TRANSPORTE - UMSA
 * Gestión completa de la flota vehicular universitaria
 * Universidad Mayor de San Andrés
 */

const { obtenerConexion, ejecutarConsulta } = require('../config/database');

class ModeloVehiculo {
    
    /**
     * Mapear nombres de campos entre frontend (anio) y BD (año)
     */
    static mapearCamposEntrada(data) {
        const mapped = { ...data };
        if ('anio' in mapped) {
            mapped.año = mapped.anio;
            delete mapped.anio;
        }
        return mapped;
    }

    static mapearCamposSalida(vehiculo) {
        if (!vehiculo) return null;
        const mapped = { ...vehiculo };
        if ('año' in mapped) {
            mapped.anio = mapped.año;
            delete mapped.año;
        }
        return mapped;
    }

    /**
     * Crear un nuevo vehículo
     */
    static async crear(vehiculoData) {
        try {
            // Mapear anio -> año
            const dataMapeada = this.mapearCamposEntrada(vehiculoData);
            
            const {
                placa,
                marca,
                modelo,
                año = null,
                color = null,
                capacidad,
                tipo_combustible = 'GASOLINA',
                estado = 'DISPONIBLE',
                kilometraje_actual = 0
            } = dataMapeada;

            // Validaciones básicas
            if (!placa || !marca || !modelo || !capacidad) {
                throw new Error('Faltan campos requeridos: placa, marca, modelo, capacidad');
            }

            // Verificar que la placa no exista
            const vehiculoExistente = await this.obtenerPorPlaca(placa);
            if (vehiculoExistente) {
                throw new Error('La placa ya está registrada en el sistema');
            }

            // Validar capacidad
            if (capacidad < 1 || capacidad > 100) {
                throw new Error('La capacidad debe estar entre 1 y 100 pasajeros');
            }

            const conexion = await obtenerConexion();
            
            const [resultado] = await conexion.execute(
                `INSERT INTO vehiculos 
                 (placa, marca, modelo, año, color, capacidad, tipo_combustible, estado, kilometraje_actual) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [placa, marca, modelo, año, color, capacidad, tipo_combustible, estado, kilometraje_actual]
            );

            // Obtener el vehículo recién creado
            const vehiculoCreado = await this.obtenerPorId(resultado.insertId);
            
            // Registrar en auditoría
            await this.registrarAuditoria(
                'CREACION_VEHICULO',
                'vehiculos',
                resultado.insertId,
                null,
                { placa, marca, modelo, capacidad }
            );

            return vehiculoCreado;

        } catch (error) {
            console.error('Error en ModeloVehiculo.crear:', error.message);
            throw error;
        }
    }

    /**
     * Obtener vehículo por ID
     */
    static async obtenerPorId(id) {
        try {
            const [vehiculos] = await ejecutarConsulta(
                `SELECT * FROM vehiculos WHERE id = ?`,
                [id]
            );

            if (vehiculos.length === 0) {
                return null;
            }

            return this.mapearCamposSalida(vehiculos[0]);

        } catch (error) {
            console.error('Error en ModeloVehiculo.obtenerPorId:', error.message);
            throw error;
        }
    }

    /**
     * Obtener vehículo por placa
     */
    static async obtenerPorPlaca(placa) {
        try {
            const [vehiculos] = await ejecutarConsulta(
                'SELECT * FROM vehiculos WHERE placa = ?',
                [placa]
            );

            return vehiculos[0] || null;

        } catch (error) {
            console.error('Error en ModeloVehiculo.obtenerPorPlaca:', error.message);
            throw error;
        }
    }

    /**
     * Obtener todos los vehículos con paginación y filtros
     */
    static async obtenerTodos(pagina = 1, limite = 10, filtros = {}) {
        try {
            // Convertir a enteros para evitar problemas con MySQL prepared statements
            console.log('[DEBUG] ANTES - pagina:', typeof pagina, pagina, 'limite:', typeof limite, limite);
            pagina = parseInt(pagina);
            limite = parseInt(limite);
            const offset = (pagina - 1) * limite;
            console.log('[DEBUG] DESPUES - pagina:', typeof pagina, pagina, 'limite:', typeof limite, limite, 'offset:', offset);
            let consulta = `SELECT * FROM vehiculos WHERE 1=1`;
            
            const parametros = [];
            const condiciones = [];

            // Aplicar filtros
            if (filtros.estado) {
                condiciones.push('estado = ?');
                parametros.push(filtros.estado);
            }

            if (filtros.marca) {
                condiciones.push('marca LIKE ?');
                parametros.push(`%${filtros.marca}%`);
            }

            if (filtros.tipo_combustible) {
                condiciones.push('tipo_combustible = ?');
                parametros.push(filtros.tipo_combustible);
            }

            if (filtros.capacidad_min) {
                condiciones.push('capacidad >= ?');
                parametros.push(filtros.capacidad_min);
            }

            if (filtros.capacidad_max) {
                condiciones.push('capacidad <= ?');
                parametros.push(filtros.capacidad_max);
            }

            if (filtros.busqueda) {
                condiciones.push('(placa LIKE ? OR marca LIKE ? OR modelo LIKE ?)');
                parametros.push(`%${filtros.busqueda}%`, `%${filtros.busqueda}%`, `%${filtros.busqueda}%`);
            }

            if (condiciones.length > 0) {
                consulta += ' AND ' + condiciones.join(' AND ');
            }

            // Ordenar y paginar - interpolar LIMIT y OFFSET directamente (no como parámetros)
            // porque MySQL2 execute() tiene problemas con números en prepared statements
            consulta += ` ORDER BY marca, modelo, placa LIMIT ${limite} OFFSET ${offset}`;
            
            console.log('[DEBUG] SQL:', consulta);
            console.log('[DEBUG] Parametros:', parametros.map((p, i) => `[${i}] ${typeof p} = ${p}`));

            const [vehiculos] = await ejecutarConsulta(consulta, parametros);

            // Obtener total para paginación
            const total = await this.obtenerTotalVehiculos(filtros);

            return {
                vehiculos: vehiculos.map(v => this.mapearCamposSalida(v)),
                paginacion: {
                    pagina: parseInt(pagina),
                    limite: parseInt(limite),
                    total,
                    totalPaginas: Math.ceil(total / limite)
                }
            };

        } catch (error) {
            console.error('Error en ModeloVehiculo.obtenerTodos:', error.message);
            throw error;
        }
    }

    /**
     * Obtener total de vehículos con filtros
     */
    static async obtenerTotalVehiculos(filtros = {}) {
        try {
            let consulta = `SELECT COUNT(*) as total FROM vehiculos WHERE 1=1`;
            
            const parametros = [];
            const condiciones = [];

            // Aplicar filtros
            if (filtros.estado) {
                condiciones.push('estado = ?');
                parametros.push(filtros.estado);
            }

            if (filtros.marca) {
                condiciones.push('marca LIKE ?');
                parametros.push(`%${filtros.marca}%`);
            }

            if (filtros.tipo_combustible) {
                condiciones.push('tipo_combustible = ?');
                parametros.push(filtros.tipo_combustible);
            }

            if (filtros.capacidad_min) {
                condiciones.push('capacidad >= ?');
                parametros.push(filtros.capacidad_min);
            }

            if (filtros.capacidad_max) {
                condiciones.push('capacidad <= ?');
                parametros.push(filtros.capacidad_max);
            }

            if (filtros.busqueda) {
                condiciones.push('(placa LIKE ? OR marca LIKE ? OR modelo LIKE ?)');
                parametros.push(`%${filtros.busqueda}%`, `%${filtros.busqueda}%`, `%${filtros.busqueda}%`);
            }

            if (condiciones.length > 0) {
                consulta += ' AND ' + condiciones.join(' AND ');
            }

            const [resultado] = await ejecutarConsulta(consulta, parametros);
            return resultado[0].total;

        } catch (error) {
            console.error('Error en ModeloVehiculo.obtenerTotalVehiculos:', error.message);
            throw error;
        }
    }

    /**
     * Actualizar vehículo
     */
    static async actualizar(id, datosActualizacion) {
        try {
            // Mapear campos de entrada (anio -> año)
            const datosMapeados = this.mapearCamposEntrada(datosActualizacion);

            // Verificar que el vehículo existe
            const vehiculoExistente = await this.obtenerPorId(id);
            if (!vehiculoExistente) {
                throw new Error('Vehículo no encontrado');
            }

            // Campos permitidos para actualización
            const camposPermitidos = [
                'placa', 'marca', 'modelo', 'año', 'color', 'capacidad', 
                'tipo_combustible', 'estado', 'kilometraje_actual'
            ];
            
            const camposActualizar = {};
            
            for (const campo of camposPermitidos) {
                if (datosMapeados[campo] !== undefined) {
                    camposActualizar[campo] = datosMapeados[campo];
                }
            }

            // Si no hay campos para actualizar
            if (Object.keys(camposActualizar).length === 0) {
                throw new Error('No se proporcionaron campos válidos para actualizar');
            }

            // Si se actualiza la placa, verificar que no exista
            if (datosMapeados.placa && datosMapeados.placa !== vehiculoExistente.placa) {
                const placaExistente = await this.obtenerPorPlaca(datosMapeados.placa);
                if (placaExistente) {
                    throw new Error('La placa ya está registrada en otro vehículo');
                }
            }

            // Validar capacidad si se actualiza
            if (datosMapeados.capacidad && (datosMapeados.capacidad < 1 || datosMapeados.capacidad > 100)) {
                throw new Error('La capacidad debe estar entre 1 y 100 pasajeros');
            }

            const conexion = await obtenerConexion();
            const campos = Object.keys(camposActualizar);
            const valores = Object.values(camposActualizar);

            const setClause = campos.map(campo => `${campo} = ?`).join(', ');
            const consulta = `UPDATE vehiculos SET ${setClause} WHERE id = ?`;

            const [resultado] = await conexion.execute(consulta, [...valores, id]);

            if (resultado.affectedRows === 0) {
                throw new Error('No se pudo actualizar el vehículo');
            }

            // Registrar en auditoría
            await this.registrarAuditoria(
                'ACTUALIZACION_VEHICULO',
                'vehiculos',
                id,
                vehiculoExistente,
                camposActualizar
            );

            // Obtener vehículo actualizado
            const vehiculoActualizado = await this.obtenerPorId(id);
            return vehiculoActualizado;

        } catch (error) {
            console.error('Error en ModeloVehiculo.actualizar:', error.message);
            throw error;
        }
    }

    /**
     * Actualizar kilometraje del vehículo
     */
    static async actualizarKilometraje(id, nuevoKilometraje) {
        try {
            // Verificar que el vehículo existe
            const vehiculoExistente = await this.obtenerPorId(id);
            if (!vehiculoExistente) {
                throw new Error('Vehículo no encontrado');
            }

            // Validar que el nuevo kilometraje sea mayor al actual
            if (nuevoKilometraje < vehiculoExistente.kilometraje_actual) {
                throw new Error('El nuevo kilometraje no puede ser menor al actual');
            }

            const [resultado] = await ejecutarConsulta(
                'UPDATE vehiculos SET kilometraje_actual = ? WHERE id = ?',
                [nuevoKilometraje, id]
            );

            if (resultado.affectedRows === 0) {
                throw new Error('No se pudo actualizar el kilometraje');
            }

            // Registrar en auditoría
            await this.registrarAuditoria(
                'ACTUALIZACION_KILOMETRAJE',
                'vehiculos',
                id,
                { kilometraje_actual: vehiculoExistente.kilometraje_actual },
                { kilometraje_actual: nuevoKilometraje }
            );

            return true;

        } catch (error) {
            console.error('Error en ModeloVehiculo.actualizarKilometraje:', error.message);
            throw error;
        }
    }

    /**
     * Cambiar estado del vehículo
     */
    static async cambiarEstado(id, nuevoEstado) {
        try {
            // Validar estado
            const estadosValidos = ['DISPONIBLE', 'EN_REPARACION', 'EN_USO', 'INACTIVO'];
            if (!estadosValidos.includes(nuevoEstado)) {
                throw new Error('Estado no válido');
            }

            // Verificar que el vehículo existe
            const vehiculoExistente = await this.obtenerPorId(id);
            if (!vehiculoExistente) {
                throw new Error('Vehículo no encontrado');
            }

            const [resultado] = await ejecutarConsulta(
                'UPDATE vehiculos SET estado = ? WHERE id = ?',
                [nuevoEstado, id]
            );

            if (resultado.affectedRows === 0) {
                throw new Error('No se pudo cambiar el estado del vehículo');
            }

            // Registrar en auditoría
            await this.registrarAuditoria(
                'CAMBIO_ESTADO_VEHICULO',
                'vehiculos',
                id,
                { estado: vehiculoExistente.estado },
                { estado: nuevoEstado }
            );

            return true;

        } catch (error) {
            console.error('Error en ModeloVehiculo.cambiarEstado:', error.message);
            throw error;
        }
    }

    /**
     * Obtener vehículos disponibles para una fecha y horario específicos
     */
    static async obtenerDisponibles(fecha, horaInicio, horaFin) {
        try {
            if (!fecha || !horaInicio || !horaFin) {
                throw new Error('Fecha, hora_inicio y hora_fin son requeridos');
            }

            const [vehiculosDisponibles] = await ejecutarConsulta(
                `SELECT v.* FROM vehiculos v 
                 WHERE v.estado = 'DISPONIBLE' 
                 AND v.id NOT IN (
                     SELECT r.vehiculo_id FROM reservas r 
                     WHERE r.fecha_reserva = ? 
                     AND r.estado IN ('PENDIENTE', 'APROBADA')
                     AND (
                         (r.hora_inicio BETWEEN ? AND ?) OR 
                         (r.hora_fin BETWEEN ? AND ?) OR 
                         (? BETWEEN r.hora_inicio AND r.hora_fin) OR 
                         (? BETWEEN r.hora_inicio AND r.hora_fin)
                     )
                 )
                 ORDER BY v.marca, v.modelo`,
                [fecha, horaInicio, horaFin, horaInicio, horaFin, horaInicio, horaFin]
            );

            return vehiculosDisponibles;

        } catch (error) {
            console.error('Error en ModeloVehiculo.obtenerDisponibles:', error.message);
            throw error;
        }
    }

    /**
     * Obtener vehículos que requieren mantenimiento
     */
    static async obtenerParaMantenimiento() {
        try {
            const umbralKilometraje = process.env.VEHICULO_ALERTA_MANTENIMIENTO_KM || 5000;
            
            const [vehiculos] = await ejecutarConsulta(
                `SELECT v.*, 
                 (v.kilometraje_actual - COALESCE(MAX(r.kilometraje_mantenimiento), 0)) as kilometros_desde_mantenimiento
                 FROM vehiculos v 
                 LEFT JOIN reparaciones r ON v.id = r.vehiculo_id AND r.tipo = 'MANTENIMIENTO'
                 WHERE v.estado != 'INACTIVO'
                 GROUP BY v.id
                 HAVING kilometros_desde_mantenimiento >= ? OR kilometros_desde_mantenimiento IS NULL
                 ORDER BY kilometros_desde_mantenimiento DESC`,
                [umbralKilometraje]
            );

            return vehiculos;

        } catch (error) {
            console.error('Error en ModeloVehiculo.obtenerParaMantenimiento:', error.message);
            throw error;
        }
    }

    /**
     * Obtener estadísticas de la flota vehicular
     */
    static async obtenerEstadisticas() {
        try {
            const [estadisticas] = await ejecutarConsulta(`
                SELECT 
                    COUNT(*) as total_vehiculos,
                    SUM(CASE WHEN estado = 'DISPONIBLE' THEN 1 ELSE 0 END) as disponibles,
                    SUM(CASE WHEN estado = 'EN_REPARACION' THEN 1 ELSE 0 END) as en_reparacion,
                    SUM(CASE WHEN estado = 'EN_USO' THEN 1 ELSE 0 END) as en_uso,
                    SUM(CASE WHEN estado = 'INACTIVO' THEN 1 ELSE 0 END) as inactivos,
                    AVG(kilometraje_actual) as kilometraje_promedio,
                    SUM(capacidad) as capacidad_total,
                    COUNT(DISTINCT marca) as marcas_diferentes
                FROM vehiculos
            `);

            const [distribucionCombustible] = await ejecutarConsulta(`
                SELECT tipo_combustible, COUNT(*) as cantidad
                FROM vehiculos 
                GROUP BY tipo_combustible
                ORDER BY cantidad DESC
            `);

            const [vehiculosRecientes] = await ejecutarConsulta(`
                SELECT marca, modelo, placa, creado_en
                FROM vehiculos 
                ORDER BY creado_en DESC 
                LIMIT 5
            `);

            return {
                general: estadisticas[0],
                por_combustible: distribucionCombustible,
                recientes: vehiculosRecientes
            };

        } catch (error) {
            console.error('Error en ModeloVehiculo.obtenerEstadisticas:', error.message);
            throw error;
        }
    }

    /**
     * Obtener historial de uso de un vehículo
     */
    static async obtenerHistorialUso(vehiculoId, limite = 10) {
        try {
            const [historial] = await ejecutarConsulta(
                `SELECT r.*, u.nombres, u.apellidos, u.departamento
                 FROM reservas r 
                 INNER JOIN usuarios u ON r.solicitante_id = u.id 
                 WHERE r.vehiculo_id = ? 
                 AND r.estado = 'COMPLETADA'
                 ORDER BY r.fecha_reserva DESC, r.hora_inicio DESC
                 LIMIT ?`,
                [vehiculoId, limite]
            );

            return historial;

        } catch (error) {
            console.error('Error en ModeloVehiculo.obtenerHistorialUso:', error.message);
            throw error;
        }
    }

    /**
     * Obtener historial de reparaciones de un vehículo
     */
    static async obtenerHistorialReparaciones(vehiculoId, limite = 10) {
        try {
            const [reparaciones] = await ejecutarConsulta(
                `SELECT r.*, u.nombres as tecnico_nombres, u.apellidos as tecnico_apellidos
                 FROM reparaciones r 
                 INNER JOIN usuarios u ON r.tecnico_id = u.id 
                 WHERE r.vehiculo_id = ? 
                 ORDER BY r.fecha_recepcion DESC
                 LIMIT ?`,
                [vehiculoId, limite]
            );

            return reparaciones;

        } catch (error) {
            console.error('Error en ModeloVehiculo.obtenerHistorialReparaciones:', error.message);
            throw error;
        }
    }

    /**
     * Buscar vehículos por término
     */
    static async buscar(termino, limite = 10) {
        try {
            const [vehiculos] = await ejecutarConsulta(
                `SELECT id, placa, marca, modelo, capacidad, estado, tipo_combustible
                 FROM vehiculos 
                 WHERE (placa LIKE ? OR marca LIKE ? OR modelo LIKE ?)
                 ORDER BY marca, modelo, placa
                 LIMIT ?`,
                [`%${termino}%`, `%${termino}%`, `%${termino}%`, limite]
            );

            return vehiculos;

        } catch (error) {
            console.error('Error en ModeloVehiculo.buscar:', error.message);
            throw error;
        }
    }

    /**
     * Obtener vehículos por marca
     */
    static async obtenerPorMarca(marca) {
        try {
            const [vehiculos] = await ejecutarConsulta(
                `SELECT * FROM vehiculos 
                 WHERE marca = ? 
                 ORDER BY modelo, año DESC`,
                [marca]
            );

            return vehiculos;

        } catch (error) {
            console.error('Error en ModeloVehiculo.obtenerPorMarca:', error.message);
            throw error;
        }
    }

    /**
     * Obtener marcas disponibles en la flota
     */
    static async obtenerMarcas() {
        try {
            const [marcas] = await ejecutarConsulta(
                `SELECT DISTINCT marca, COUNT(*) as cantidad
                 FROM vehiculos 
                 GROUP BY marca 
                 ORDER BY cantidad DESC, marca`
            );

            return marcas;

        } catch (error) {
            console.error('Error en ModeloVehiculo.obtenerMarcas:', error.message);
            throw error;
        }
    }

    /**
     * Verificar disponibilidad de vehículo en fecha y horario
     */
    static async verificarDisponibilidad(vehiculoId, fecha, horaInicio, horaFin) {
        try {
            const [reservas] = await ejecutarConsulta(
                `SELECT id FROM reservas 
                 WHERE vehiculo_id = ? 
                 AND fecha_reserva = ? 
                 AND estado IN ('PENDIENTE', 'APROBADA')
                 AND (
                     (hora_inicio BETWEEN ? AND ?) OR 
                     (hora_fin BETWEEN ? AND ?) OR 
                     (? BETWEEN hora_inicio AND hora_fin) OR 
                     (? BETWEEN hora_inicio AND hora_fin)
                 )`,
                [vehiculoId, fecha, horaInicio, horaFin, horaInicio, horaFin, horaInicio, horaFin]
            );

            return reservas.length === 0;

        } catch (error) {
            console.error('Error en ModeloVehiculo.verificarDisponibilidad:', error.message);
            throw error;
        }
    }

    /**
     * Obtener total de vehículos (para estadísticas del sistema)
     */
    static async obtenerTotal() {
        try {
            const [resultado] = await ejecutarConsulta(
                'SELECT COUNT(*) as total FROM vehiculos'
            );

            return resultado[0].total;

        } catch (error) {
            console.error('Error en ModeloVehiculo.obtenerTotal:', error.message);
            throw error;
        }
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
            console.error('Error registrando auditoría de vehículo:', error.message);
            // No lanzar error para no afectar la operación principal
        }
    }

    /**
     * Obtener vehículos con mayor uso (para dashboard)
     */
    static async obtenerMasUtilizados(limite = 5) {
        try {
            const [vehiculos] = await ejecutarConsulta(
                `SELECT v.*, COUNT(r.id) as total_reservas
                 FROM vehiculos v 
                 LEFT JOIN reservas r ON v.id = r.vehiculo_id AND r.estado = 'COMPLETADA'
                 GROUP BY v.id
                 ORDER BY total_reservas DESC
                 LIMIT ?`,
                [limite]
            );

            return vehiculos;

        } catch (error) {
            console.error('Error en ModeloVehiculo.obtenerMasUtilizados:', error.message);
            throw error;
        }
    }

    /**
     * Obtener consumo de combustible estimado
     */
    static async obtenerConsumoCombustible() {
        try {
            const [consumo] = await ejecutarConsulta(`
                SELECT 
                    tipo_combustible,
                    COUNT(*) as cantidad_vehiculos,
                    AVG(capacidad) as capacidad_promedio,
                    AVG(kilometraje_actual) as kilometraje_promedio
                FROM vehiculos 
                WHERE estado != 'INACTIVO'
                GROUP BY tipo_combustible
                ORDER BY cantidad_vehiculos DESC
            `);

            return consumo;

        } catch (error) {
            console.error('Error en ModeloVehiculo.obtenerConsumoCombustible:', error.message);
            throw error;
        }
    }

    // Alias para compatibilidad con controllers
    static async obtenerTodosVehiculos(pagina, limite, filtros) {
        return this.obtenerTodos(pagina, limite, filtros);
    }

    static async obtenerVehiculoPorId(id) {
        return this.obtenerPorId(id);
    }

    static async actualizarVehiculo(id, datosActualizacion) {
        return this.actualizar(id, datosActualizacion);
    }

    static async obtenerVehiculosDisponibles(fecha, horaInicio, horaFin) {
        return this.obtenerDisponibles(fecha, horaInicio, horaFin);
    }

    /**
     * Eliminar vehículo (borrado físico)
     */
    static async eliminar(id) {
        try {
            const vehiculoExistente = await this.obtenerPorId(id);
            if (!vehiculoExistente) {
                throw new Error('Vehículo no encontrado');
            }

            // Eliminar registros relacionados primero para evitar violación de FK
            // Eliminar auditoría relacionada
            await ejecutarConsulta(
                'DELETE FROM auditoria_sistema WHERE tabla_afectada = ? AND registro_id = ?',
                ['vehiculos', id]
            );

            // Intentar eliminar el vehículo
            const [resultado] = await ejecutarConsulta(
                'DELETE FROM vehiculos WHERE id = ?',
                [id]
            );

            if (resultado.affectedRows === 0) {
                throw new Error('No se pudo eliminar el vehículo');
            }

            return true;

        } catch (error) {
            // Detectar error de integridad referencial
            if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                throw new Error('El vehículo tiene registros asociados (reservas, reparaciones, asignaciones) y no puede eliminarse. Márquelo como INACTIVO en su lugar.');
            }
            console.error('Error en ModeloVehiculo.eliminar:', error.message);
            throw error;
        }
    }
}

module.exports = ModeloVehiculo;