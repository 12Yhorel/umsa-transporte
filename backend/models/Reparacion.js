/**
 * MODELO DE REPARACIONES - SISTEMA DE LA UNIDAD DE TRANSPORTE - UMSA
 * Gestión completa de reparaciones vehiculares con integración de inventario
 * Universidad Mayor de San Andrés
 */

const { obtenerConexion, ejecutarConsulta } = require('../config/database');
const ModeloInventario = require('./Inventario');

class ModeloReparacion {
    
    /**
     * Mapear campos de entrada aceptando camelCase y snake_case.
     * Convierte keys como vehiculoId -> vehiculo_id, tecnicoId -> tecnico_id, etc.
     */
    static mapearCamposEntrada(data = {}) {
        const mapped = { ...data };

        // Mapeos comunes camelCase -> snake_case
        if (mapped.vehiculoId !== undefined && mapped.vehiculo_id === undefined) {
            mapped.vehiculo_id = mapped.vehiculoId;
            delete mapped.vehiculoId;
        }
        if (mapped.tecnicoId !== undefined && mapped.tecnico_id === undefined) {
            mapped.tecnico_id = mapped.tecnicoId;
            delete mapped.tecnicoId;
        }
        if (mapped.fechaRecepcion !== undefined && mapped.fecha_recepcion === undefined) {
            mapped.fecha_recepcion = mapped.fechaRecepcion;
            delete mapped.fechaRecepcion;
        }
        if (mapped.fechaEstimadaEntrega !== undefined && mapped.fecha_estimada_entrega === undefined) {
            mapped.fecha_estimada_entrega = mapped.fechaEstimadaEntrega;
            delete mapped.fechaEstimadaEntrega;
        }
        if (mapped.fechaRealEntrega !== undefined && mapped.fecha_real_entrega === undefined) {
            mapped.fecha_real_entrega = mapped.fechaRealEntrega;
            delete mapped.fechaRealEntrega;
        }
        if (mapped.descripcionProblema !== undefined && mapped.descripcion_problema === undefined) {
            mapped.descripcion_problema = mapped.descripcionProblema;
            delete mapped.descripcionProblema;
        }
        if (mapped.costoTotal !== undefined && mapped.costo_total === undefined) {
            mapped.costo_total = mapped.costoTotal;
            delete mapped.costoTotal;
        }

        // Mapeo de campos del formulario frontend que usan nombres diferentes
        // fecha_inicio -> fecha_recepcion
        if (mapped.fecha_inicio !== undefined && mapped.fecha_recepcion === undefined) {
            mapped.fecha_recepcion = mapped.fecha_inicio;
        }
        // fecha_fin -> fecha_estimada_entrega
        if (mapped.fecha_fin !== undefined && mapped.fecha_estimada_entrega === undefined) {
            mapped.fecha_estimada_entrega = mapped.fecha_fin;
        }
        // descripcion -> descripcion_problema
        if (mapped.descripcion !== undefined && mapped.descripcion_problema === undefined) {
            mapped.descripcion_problema = mapped.descripcion;
        }
        // costo -> costo_total (convertir a número)
        if (mapped.costo !== undefined && mapped.costo_total === undefined) {
            mapped.costo_total = parseFloat(mapped.costo) || 0;
        }
        // Asegurar que costo_total sea número
        if (mapped.costo_total !== undefined) {
            mapped.costo_total = parseFloat(mapped.costo_total) || 0;
        }

        return mapped;
    }

    /**
     * Mapear campos de salida para que coincidan con lo que espera el frontend.
     * Convierte campos DB a nombres esperados por el frontend.
     */
    static mapearCamposSalida(reparacion = {}) {
        if (!reparacion) return reparacion;
        
        // fecha_recepcion -> fecha_inicio
        if (reparacion.fecha_recepcion !== undefined && reparacion.fecha_inicio === undefined) {
            reparacion.fecha_inicio = reparacion.fecha_recepcion;
        }
        // fecha_estimada_entrega -> fecha_fin
        if (reparacion.fecha_estimada_entrega !== undefined && reparacion.fecha_fin === undefined) {
            reparacion.fecha_fin = reparacion.fecha_estimada_entrega;
        }
        // descripcion_problema -> descripcion
        if (reparacion.descripcion_problema !== undefined && reparacion.descripcion === undefined) {
            reparacion.descripcion = reparacion.descripcion_problema;
        }
        // costo_total -> costo (si existe)
        if (reparacion.costo_total !== undefined && reparacion.costo === undefined) {
            reparacion.costo = reparacion.costo_total;
        }
        // tecnico_nombre -> mecanico (para compatibilidad)
        if (reparacion.tecnico_nombre !== undefined && reparacion.mecanico === undefined) {
            reparacion.mecanico = reparacion.tecnico_nombre;
        }
        
        return reparacion;
    }
    
    /**
     * Crear una nueva reparación
     */
    static async crear(reparacionData) {
        try {
            const datos = this.mapearCamposEntrada(reparacionData);
            console.log('[DEBUG] ModeloReparacion.crear - datos originales:', reparacionData);
            console.log('[DEBUG] ModeloReparacion.crear - datos mapeados:', datos);
            
            const {
                vehiculo_id,
                tecnico_id,
                fecha_recepcion,
                fecha_estimada_entrega = null,
                descripcion_problema,
                diagnostico = null
            } = datos;
            
            // Extraer costo_total asegurando que no se pierda el valor
            const costo_total = parseFloat(datos.costo_total) || 0;

            console.log('[DEBUG] ModeloReparacion.crear - costo_total extraído:', costo_total, 'tipo:', typeof costo_total, 'de datos.costo_total:', datos.costo_total);

            // Validaciones básicas
            if (!vehiculo_id || !tecnico_id || !fecha_recepcion || !descripcion_problema) {
                throw new Error('Faltan campos requeridos: vehiculo_id, tecnico_id, fecha_recepcion, descripcion_problema');
            }

            // Verificar que el vehículo existe
            const vehiculo = await this.obtenerVehiculoPorId(vehiculo_id);
            if (!vehiculo) {
                throw new Error('El vehículo especificado no existe');
            }

            // Verificar que el técnico existe y tiene rol adecuado
            const tecnico = await this.obtenerUsuarioPorId(tecnico_id);
            if (!tecnico || (tecnico.rol_id !== 2 && tecnico.rol_id !== 1)) { // Técnico o Admin
                throw new Error('El técnico especificado no existe o no tiene permisos adecuados');
            }

            // Cambiar estado del vehículo a EN_REPARACION
            await this.actualizarEstadoVehiculo(vehiculo_id, 'EN_REPARACION');

            const conexion = await obtenerConexion();
            
            const [resultado] = await conexion.execute(
                `INSERT INTO reparaciones 
                 (vehiculo_id, tecnico_id, fecha_recepcion, fecha_estimada_entrega, 
                  descripcion_problema, diagnostico, costo_total) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [vehiculo_id, tecnico_id, fecha_recepcion, fecha_estimada_entrega, 
                 descripcion_problema, diagnostico, costo_total]
            );

            // Obtener la reparación recién creada
            const reparacionCreada = await this.obtenerReparacionPorId(resultado.insertId);
            
            // Registrar en auditoría
            await this.registrarAuditoria(
                'CREACION_REPARACION',
                'reparaciones',
                resultado.insertId,
                null,
                { vehiculo_id, tecnico_id, estado: 'RECIBIDO' }
            );

            return reparacionCreada;

        } catch (error) {
            console.error('Error en ModeloReparacion.crear:', error.message);
            throw error;
        }
    }

    /**
     * Actualizar una reparación existente
     */
    static async actualizar(id, reparacionData) {
        try {
            const datos = this.mapearCamposEntrada(reparacionData);
            console.log('[DEBUG] ModeloReparacion.actualizar - ID:', id);
            console.log('[DEBUG] ModeloReparacion.actualizar - datos mapeados:', datos);

            // Verificar que la reparación existe
            const reparacionExistente = await this.obtenerReparacionPorId(id);
            if (!reparacionExistente) {
                throw new Error('Reparación no encontrada');
            }

            // Campos permitidos para actualizar
            const camposPermitidos = [
                'vehiculo_id', 'tecnico_id', 'fecha_recepcion', 
                'fecha_estimada_entrega', 'fecha_real_entrega',
                'descripcion_problema', 'diagnostico', 'estado', 'costo_total'
            ];

            const camposActualizar = [];
            const valores = [];

            camposPermitidos.forEach(campo => {
                if (datos[campo] !== undefined) {
                    camposActualizar.push(`${campo} = ?`);
                    valores.push(datos[campo]);
                }
            });

            if (camposActualizar.length === 0) {
                throw new Error('No hay campos para actualizar');
            }

            valores.push(id);

            const conexion = await obtenerConexion();
            const [resultado] = await conexion.execute(
                `UPDATE reparaciones SET ${camposActualizar.join(', ')} WHERE id = ?`,
                valores
            );

            if (resultado.affectedRows === 0) {
                throw new Error('No se pudo actualizar la reparación');
            }

            // Registrar en auditoría
            await this.registrarAuditoria(
                'ACTUALIZACION_REPARACION',
                'reparaciones',
                id,
                reparacionExistente,
                datos
            );

            return await this.obtenerReparacionPorId(id);

        } catch (error) {
            console.error('Error en ModeloReparacion.actualizar:', error.message);
            throw error;
        }
    }

    /**
     * Eliminar una reparación
     */
    static async eliminar(id) {
        try {
            // Verificar que la reparación existe
            const reparacionExistente = await this.obtenerReparacionPorId(id);
            if (!reparacionExistente) {
                throw new Error('Reparación no encontrada');
            }

            // Primero eliminar los consumos de repuestos asociados
            await ejecutarConsulta(
                'DELETE FROM consumo_repuestos WHERE reparacion_id = ?',
                [id]
            );

            // Eliminar la reparación
            const [resultado] = await ejecutarConsulta(
                'DELETE FROM reparaciones WHERE id = ?',
                [id]
            );

            if (resultado.affectedRows === 0) {
                throw new Error('No se pudo eliminar la reparación');
            }

            // Si el vehículo estaba en reparación, cambiar su estado a DISPONIBLE
            if (reparacionExistente.estado !== 'ENTREGADO') {
                await this.actualizarEstadoVehiculo(reparacionExistente.vehiculo_id, 'DISPONIBLE');
            }

            // Registrar en auditoría
            await this.registrarAuditoria(
                'ELIMINACION_REPARACION',
                'reparaciones',
                id,
                reparacionExistente,
                null
            );

            return { success: true, message: 'Reparación eliminada exitosamente' };

        } catch (error) {
            console.error('Error en ModeloReparacion.eliminar:', error.message);
            throw error;
        }
    }

    /**
     * Obtener reparación por ID con información completa
     */
    static async obtenerReparacionPorId(id) {
        try {
            const [reparaciones] = await ejecutarConsulta(
                `SELECT 
                    r.*,
                    v.placa, v.marca, v.modelo, v.color, v.kilometraje_actual,
                    CONCAT(u.nombres, ' ', u.apellidos) as tecnico_nombre,
                    u.email as tecnico_email,
                    COUNT(cr.id) as total_repuestos,
                    SUM(cr.cantidad * COALESCE(cr.costo_unitario, 0)) as costo_repuestos
                 FROM reparaciones r
                 INNER JOIN vehiculos v ON r.vehiculo_id = v.id
                 INNER JOIN usuarios u ON r.tecnico_id = u.id
                 LEFT JOIN consumo_repuestos cr ON r.id = cr.reparacion_id
                 WHERE r.id = ?
                 GROUP BY r.id`,
                [id]
            );

            if (reparaciones.length === 0) {
                return null;
            }

            const reparacion = reparaciones[0];
            
            // Mapear campos para el frontend
            this.mapearCamposSalida(reparacion);
            
            // Obtener repuestos utilizados
            reparacion.repuestos_utilizados = await this.obtenerRepuestosUtilizados(id);
            
            // Calcular costo total
            reparacion.costo_total = Number(reparacion.costo_repuestos || 0) + Number(reparacion.costo_total || 0);
            
            // Calcular progreso basado en el estado
            reparacion.progreso = this.calcularProgreso(reparacion.estado);
            
            // Calcular días en reparación
            reparacion.dias_en_reparacion = this.calcularDiasReparacion(
                reparacion.fecha_recepcion, 
                reparacion.fecha_real_entrega
            );

            return reparacion;

        } catch (error) {
            console.error('Error en ModeloReparacion.obtenerReparacionPorId:', error.message);
            throw error;
        }
    }

    /**
     * Obtener todas las reparaciones con paginación y filtros
     */
    static async obtenerTodasReparaciones(pagina = 1, limite = 10, filtros = {}) {
        try {
            // Convertir a enteros para evitar problemas con MySQL prepared statements
            pagina = parseInt(pagina);
            limite = parseInt(limite);
            const offset = (pagina - 1) * limite;
            let consulta = `
                SELECT 
                    r.*,
                    v.placa, v.marca, v.modelo,
                    CONCAT(u.nombres, ' ', u.apellidos) as tecnico_nombre,
                    COUNT(cr.id) as total_repuestos,
                    SUM(cr.cantidad * COALESCE(cr.costo_unitario, 0)) as costo_repuestos
                FROM reparaciones r
                INNER JOIN vehiculos v ON r.vehiculo_id = v.id
                INNER JOIN usuarios u ON r.tecnico_id = u.id
                LEFT JOIN consumo_repuestos cr ON r.id = cr.reparacion_id
            `;
            
            const parametros = [];
            const condiciones = [];

            // Aplicar filtros
            if (filtros.estado) {
                condiciones.push('r.estado = ?');
                parametros.push(filtros.estado);
            }

            if (filtros.vehiculo_id) {
                condiciones.push('r.vehiculo_id = ?');
                parametros.push(filtros.vehiculo_id);
            }

            if (filtros.tecnico_id) {
                condiciones.push('r.tecnico_id = ?');
                parametros.push(filtros.tecnico_id);
            }

            if (filtros.fecha_desde) {
                condiciones.push('r.fecha_recepcion >= ?');
                parametros.push(filtros.fecha_desde);
            }

            if (filtros.fecha_hasta) {
                condiciones.push('r.fecha_recepcion <= ?');
                parametros.push(filtros.fecha_hasta);
            }

            if (filtros.con_repuestos) {
                condiciones.push('cr.id IS NOT NULL');
            }

            if (condiciones.length > 0) {
                consulta += ' WHERE ' + condiciones.join(' AND ');
            }

            // Agrupar y ordenar - interpolar directamente LIMIT/OFFSET
            consulta += ` GROUP BY r.id ORDER BY r.fecha_recepcion DESC LIMIT ${limite} OFFSET ${offset}`;

            const [reparaciones] = await ejecutarConsulta(consulta, parametros);

            // Enriquecer datos para cada reparación
            for (let reparacion of reparaciones) {
                reparacion.progreso = this.calcularProgreso(reparacion.estado);
                reparacion.dias_en_reparacion = this.calcularDiasReparacion(
                    reparacion.fecha_recepcion, 
                    reparacion.fecha_real_entrega
                );
                // Calcular costo total = costo_total base + costo de repuestos
                const costoBase = Number(reparacion.costo_total || 0);
                const costoRepuestos = Number(reparacion.costo_repuestos || 0);
                reparacion.costo_total = costoBase + costoRepuestos;
                
                // Mapear campos para el frontend (DESPUÉS de calcular costo_total)
                this.mapearCamposSalida(reparacion);
            }

            // Obtener total para paginación
            const total = await this.obtenerTotalReparaciones(filtros);

            return {
                reparaciones,
                paginacion: {
                    pagina: parseInt(pagina),
                    limite: parseInt(limite),
                    total,
                    totalPaginas: Math.ceil(total / limite)
                }
            };

        } catch (error) {
            console.error('Error en ModeloReparacion.obtenerTodasReparaciones:', error.message);
            throw error;
        }
    }

    /**
     * Obtener total de reparaciones con filtros
     */
    static async obtenerTotalReparaciones(filtros = {}) {
        try {
            let consulta = `
                SELECT COUNT(DISTINCT r.id) as total 
                FROM reparaciones r
                INNER JOIN vehiculos v ON r.vehiculo_id = v.id
                INNER JOIN usuarios u ON r.tecnico_id = u.id
                LEFT JOIN consumo_repuestos cr ON r.id = cr.reparacion_id
            `;
            
            const parametros = [];
            const condiciones = [];

            // Aplicar filtros (misma lógica que obtenerTodasReparaciones)
            if (filtros.estado) {
                condiciones.push('r.estado = ?');
                parametros.push(filtros.estado);
            }

            if (filtros.vehiculo_id) {
                condiciones.push('r.vehiculo_id = ?');
                parametros.push(filtros.vehiculo_id);
            }

            if (filtros.tecnico_id) {
                condiciones.push('r.tecnico_id = ?');
                parametros.push(filtros.tecnico_id);
            }

            if (filtros.fecha_desde) {
                condiciones.push('r.fecha_recepcion >= ?');
                parametros.push(filtros.fecha_desde);
            }

            if (filtros.fecha_hasta) {
                condiciones.push('r.fecha_recepcion <= ?');
                parametros.push(filtros.fecha_hasta);
            }

            if (filtros.con_repuestos) {
                condiciones.push('cr.id IS NOT NULL');
            }

            if (condiciones.length > 0) {
                consulta += ' WHERE ' + condiciones.join(' AND ');
            }

            const [resultado] = await ejecutarConsulta(consulta, parametros);
            return resultado[0].total;

        } catch (error) {
            console.error('Error en ModeloReparacion.obtenerTotalReparaciones:', error.message);
            throw error;
        }
    }

    /**
     * Actualizar estado de una reparación
     */
    static async actualizarEstado(id, nuevoEstado, usuarioId = 1, observaciones = null, fechaRealEntrega = null) {
        try {
            const estadosValidos = ['RECIBIDO', 'DIAGNOSTICO', 'EN_REPARACION', 'TERMINADO', 'ENTREGADO'];
            
            if (!estadosValidos.includes(nuevoEstado)) {
                throw new Error('Estado no válido');
            }

            // Obtener reparación actual
            const reparacionActual = await this.obtenerReparacionPorId(id);
            if (!reparacionActual) {
                throw new Error('Reparación no encontrada');
            }

            const datosActualizacion = { estado: nuevoEstado };

            // Si se proporciona fecha_real_entrega, usarla; si no, calcularla si es TERMINADO/ENTREGADO
            if (fechaRealEntrega) {
                datosActualizacion.fecha_real_entrega = fechaRealEntrega;
            } else if (nuevoEstado === 'TERMINADO' || nuevoEstado === 'ENTREGADO') {
                datosActualizacion.fecha_real_entrega = new Date().toISOString().split('T')[0];
            } else {
                datosActualizacion.fecha_real_entrega = null;
            }

            // Si se marca como ENTREGADO, cambiar estado del vehículo a DISPONIBLE
            if (nuevoEstado === 'ENTREGADO') {
                await this.actualizarEstadoVehiculo(reparacionActual.vehiculo_id, 'DISPONIBLE');
            }

            const conexion = await obtenerConexion();
            const [resultado] = await conexion.execute(
                'UPDATE reparaciones SET estado = ?, fecha_real_entrega = ? WHERE id = ?',
                [nuevoEstado, datosActualizacion.fecha_real_entrega, id]
            );

            if (resultado.affectedRows === 0) {
                throw new Error('No se pudo actualizar el estado de la reparación');
            }

            // Registrar en auditoría con observaciones
            await this.registrarAuditoria(
                'ACTUALIZACION_ESTADO_REPARACION',
                'reparaciones',
                id,
                { estado_anterior: reparacionActual.estado },
                { 
                    estado_nuevo: nuevoEstado, 
                    observaciones: observaciones || 'Sin observaciones',
                    fecha_real_entrega: datosActualizacion.fecha_real_entrega
                },
                usuarioId
            );

            return await this.obtenerReparacionPorId(id);

        } catch (error) {
            console.error('Error en ModeloReparacion.actualizarEstado:', error.message);
            throw error;
        }
    }

    /**
     * Actualizar diagnóstico de una reparación
     */
    static async actualizarDiagnostico(id, diagnostico, usuarioId = 1) {
        try {
            // Verificar que la reparación existe
            const reparacionExistente = await this.obtenerReparacionPorId(id);
            if (!reparacionExistente) {
                throw new Error('Reparación no encontrada');
            }

            const [resultado] = await ejecutarConsulta(
                'UPDATE reparaciones SET diagnostico = ? WHERE id = ?',
                [diagnostico, id]
            );

            if (resultado.affectedRows === 0) {
                throw new Error('No se pudo actualizar el diagnóstico');
            }

            // Registrar en auditoría
            await this.registrarAuditoria(
                'ACTUALIZACION_DIAGNOSTICO',
                'reparaciones',
                id,
                { diagnostico_anterior: reparacionExistente.diagnostico },
                { diagnostico_nuevo: diagnostico },
                usuarioId
            );

            return await this.obtenerReparacionPorId(id);

        } catch (error) {
            console.error('Error en ModeloReparacion.actualizarDiagnostico:', error.message);
            throw error;
        }
    }

    /**
     * Agregar repuesto a una reparación
     */
    static async agregarRepuesto(reparacionId, repuestoData, usuarioId = 1) {
        try {
            const { item_id, cantidad, costo_unitario = null } = repuestoData;

            // Validaciones
            if (!reparacionId || !item_id || !cantidad) {
                throw new Error('Faltan campos requeridos: reparacion_id, item_id, cantidad');
            }

            if (cantidad <= 0) {
                throw new Error('La cantidad debe ser mayor a 0');
            }

            // Verificar que la reparación existe y está en estado válido
            const reparacion = await this.obtenerReparacionPorId(reparacionId);
            if (!reparacion) {
                throw new Error('Reparación no encontrada');
            }

            if (reparacion.estado === 'ENTREGADO') {
                throw new Error('No se pueden agregar repuestos a una reparación ya entregada');
            }

            // Verificar que el ítem existe y tiene stock suficiente
            const item = await ModeloInventario.obtenerItemPorId(item_id);
            if (!item) {
                throw new Error('Ítem de inventario no encontrado');
            }

            if (item.stock_actual < cantidad) {
                throw new Error(`Stock insuficiente. Disponible: ${item.stock_actual}, Solicitado: ${cantidad}`);
            }

            // Calcular costo unitario si no se proporciona
            const costoFinal = costo_unitario || item.precio_unitario || 0;

            const conexion = await obtenerConexion();
            
            // Registrar consumo de repuesto
            const [resultado] = await conexion.execute(
                `INSERT INTO consumo_repuestos 
                 (reparacion_id, item_id, cantidad, costo_unitario) 
                 VALUES (?, ?, ?, ?)`,
                [reparacionId, item_id, cantidad, costoFinal]
            );

            // Actualizar stock en inventario
            await ModeloInventario.registrarSalida(
                item_id, 
                cantidad, 
                `Consumo en reparación #${reparacionId}`,
                resultado.insertId,
                usuarioId
            );

            // Actualizar costo total de la reparación
            await this.actualizarCostoTotalReparacion(reparacionId);

            // Registrar en auditoría
            await this.registrarAuditoria(
                'AGREGADO_REPUESTO_REPARACION',
                'consumo_repuestos',
                resultado.insertId,
                null,
                { reparacion_id: reparacionId, item_id, cantidad, costo_unitario: costoFinal },
                usuarioId
            );

            return await this.obtenerRepuestoUtilizado(resultado.insertId);

        } catch (error) {
            console.error('Error en ModeloReparacion.agregarRepuesto:', error.message);
            throw error;
        }
    }

    /**
     * Remover repuesto de una reparación
     */
    static async removerRepuesto(consumoId, usuarioId = 1) {
        try {
            // Obtener datos del consumo
            const consumo = await this.obtenerRepuestoUtilizado(consumoId);
            if (!consumo) {
                throw new Error('Consumo de repuesto no encontrado');
            }

            // Verificar que la reparación no esté entregada
            const reparacion = await this.obtenerReparacionPorId(consumo.reparacion_id);
            if (reparacion.estado === 'ENTREGADO') {
                throw new Error('No se pueden remover repuestos de una reparación ya entregada');
            }

            const conexion = await obtenerConexion();
            
            // Eliminar registro de consumo
            const [resultado] = await conexion.execute(
                'DELETE FROM consumo_repuestos WHERE id = ?',
                [consumoId]
            );

            if (resultado.affectedRows === 0) {
                throw new Error('No se pudo remover el repuesto');
            }

            // Devolver stock al inventario
            await ModeloInventario.registrarEntrada(
                consumo.item_id,
                consumo.cantidad,
                `Devolución por eliminación de reparación #${consumo.reparacion_id}`,
                consumoId,
                usuarioId
            );

            // Actualizar costo total de la reparación
            await this.actualizarCostoTotalReparacion(consumo.reparacion_id);

            // Registrar en auditoría
            await this.registrarAuditoria(
                'ELIMINACION_REPUESTO_REPARACION',
                'consumo_repuestos',
                consumoId,
                consumo,
                null,
                usuarioId
            );

            return { mensaje: 'Repuesto removido exitosamente', consumo_eliminado: consumo };

        } catch (error) {
            console.error('Error en ModeloReparacion.removerRepuesto:', error.message);
            throw error;
        }
    }

    /**
     * Obtener repuestos utilizados en una reparación
     */
    static async obtenerRepuestosUtilizados(reparacionId) {
        try {
            const [repuestos] = await ejecutarConsulta(
                `SELECT 
                    cr.*,
                    i.nombre as item_nombre,
                    i.codigo_qr,
                    i.unidad_medida,
                    c.nombre as categoria_nombre,
                    (cr.cantidad * cr.costo_unitario) as costo_total
                 FROM consumo_repuestos cr
                 INNER JOIN items_inventario i ON cr.item_id = i.id
                 INNER JOIN categorias_inventario c ON i.categoria_id = c.id
                 WHERE cr.reparacion_id = ?
                 ORDER BY c.nombre, i.nombre`,
                [reparacionId]
            );

            return repuestos;

        } catch (error) {
            console.error('Error en ModeloReparacion.obtenerRepuestosUtilizados:', error.message);
            throw error;
        }
    }

    /**
     * Obtener un repuesto utilizado específico
     */
    static async obtenerRepuestoUtilizado(consumoId) {
        try {
            const [repuestos] = await ejecutarConsulta(
                `SELECT cr.*, i.nombre as item_nombre
                 FROM consumo_repuestos cr
                 INNER JOIN items_inventario i ON cr.item_id = i.id
                 WHERE cr.id = ?`,
                [consumoId]
            );

            return repuestos[0] || null;

        } catch (error) {
            console.error('Error en ModeloReparacion.obtenerRepuestoUtilizado:', error.message);
            throw error;
        }
    }

    /**
     * Obtener historial de reparaciones por vehículo
     */
    static async obtenerHistorialPorVehiculo(vehiculoId, limite = 20) {
        try {
            const [reparaciones] = await ejecutarConsulta(
                `SELECT 
                    r.*,
                    CONCAT(u.nombres, ' ', u.apellidos) as tecnico_nombre,
                    COUNT(cr.id) as total_repuestos,
                    SUM(cr.cantidad * COALESCE(cr.costo_unitario, 0)) as costo_repuestos
                 FROM reparaciones r
                 INNER JOIN usuarios u ON r.tecnico_id = u.id
                 LEFT JOIN consumo_repuestos cr ON r.id = cr.reparacion_id
                 WHERE r.vehiculo_id = ?
                 GROUP BY r.id
                 ORDER BY r.fecha_recepcion DESC
                 LIMIT ?`,
                [vehiculoId, limite]
            );

            // Enriquecer datos
            for (let reparacion of reparaciones) {
                reparacion.costo_total = Number(reparacion.costo_repuestos || 0) + Number(reparacion.costo_total || 0);
                reparacion.dias_en_reparacion = this.calcularDiasReparacion(
                    reparacion.fecha_recepcion, 
                    reparacion.fecha_real_entrega
                );
            }

            return reparaciones;

        } catch (error) {
            console.error('Error en ModeloReparacion.obtenerHistorialPorVehiculo:', error.message);
            throw error;
        }
    }

    /**
     * Obtener estadísticas de reparaciones
     */
    static async obtenerEstadisticas(periodo = 'mes') {
        try {
            let filtroFecha = '';
            switch (periodo) {
                case 'semana':
                    filtroFecha = 'AND r.fecha_recepcion >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
                    break;
                case 'mes':
                    filtroFecha = 'AND r.fecha_recepcion >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)';
                    break;
                case 'trimestre':
                    filtroFecha = 'AND r.fecha_recepcion >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)';
                    break;
                case 'año':
                    filtroFecha = 'AND r.fecha_recepcion >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)';
                    break;
                default:
                    filtroFecha = 'AND r.fecha_recepcion >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)';
            }

            const [estadisticas] = await ejecutarConsulta(`
                SELECT 
                    COUNT(*) as total_reparaciones,
                    SUM(CASE WHEN r.estado = 'ENTREGADO' THEN 1 ELSE 0 END) as reparaciones_completadas,
                    SUM(CASE WHEN r.estado IN ('RECIBIDO', 'DIAGNOSTICO', 'EN_REPARACION') THEN 1 ELSE 0 END) as reparaciones_pendientes,
                    AVG(r.costo_total) as costo_promedio,
                    AVG(DATEDIFF(COALESCE(r.fecha_real_entrega, CURDATE()), r.fecha_recepcion)) as tiempo_promedio_dias,
                    SUM(r.costo_total) as costo_total_periodo,
                    COUNT(DISTINCT r.vehiculo_id) as vehiculos_atendidos,
                    COUNT(DISTINCT r.tecnico_id) as tecnicos_involucrados
                FROM reparaciones r
                WHERE 1=1 ${filtroFecha}
            `);

            const [reparacionesPorEstado] = await ejecutarConsulta(`
                SELECT estado, COUNT(*) as cantidad
                FROM reparaciones r
                WHERE 1=1 ${filtroFecha}
                GROUP BY estado
                ORDER BY cantidad DESC
            `);

            const [reparacionesPorVehiculo] = await ejecutarConsulta(`
                SELECT v.placa, v.marca, v.modelo, COUNT(r.id) as cantidad_reparaciones
                FROM reparaciones r
                INNER JOIN vehiculos v ON r.vehiculo_id = v.id
                WHERE 1=1 ${filtroFecha}
                GROUP BY v.id, v.placa, v.marca, v.modelo
                ORDER BY cantidad_reparaciones DESC
                LIMIT 10
            `);

            const [repuestosMasUtilizados] = await ejecutarConsulta(`
                SELECT i.nombre, i.codigo_qr, SUM(cr.cantidad) as cantidad_total,
                       SUM(cr.cantidad * cr.costo_unitario) as costo_total
                FROM consumo_repuestos cr
                INNER JOIN items_inventario i ON cr.item_id = i.id
                INNER JOIN reparaciones r ON cr.reparacion_id = r.id
                WHERE 1=1 ${filtroFecha}
                GROUP BY i.id, i.nombre, i.codigo_qr
                ORDER BY cantidad_total DESC
                LIMIT 10
            `);

            return {
                general: estadisticas[0],
                por_estado: reparacionesPorEstado,
                por_vehiculo: reparacionesPorVehiculo,
                repuestos_mas_utilizados: repuestosMasUtilizados
            };

        } catch (error) {
            console.error('Error en ModeloReparacion.obtenerEstadisticas:', error.message);
            throw error;
        }
    }

    /**
     * Métodos auxiliares privados
     */

    /**
     * Obtener vehículo por ID
     */
    static async obtenerVehiculoPorId(id) {
        try {
            const [vehiculos] = await ejecutarConsulta(
                'SELECT * FROM vehiculos WHERE id = ?',
                [id]
            );

            return vehiculos[0] || null;

        } catch (error) {
            console.error('Error en ModeloReparacion.obtenerVehiculoPorId:', error.message);
            throw error;
        }
    }

    /**
     * Obtener usuario por ID
     */
    static async obtenerUsuarioPorId(id) {
        try {
            const [usuarios] = await ejecutarConsulta(
                'SELECT * FROM usuarios WHERE id = ?',
                [id]
            );

            return usuarios[0] || null;

        } catch (error) {
            console.error('Error en ModeloReparacion.obtenerUsuarioPorId:', error.message);
            throw error;
        }
    }

    /**
     * Actualizar estado de un vehículo
     */
    static async actualizarEstadoVehiculo(vehiculoId, estado) {
        try {
            await ejecutarConsulta(
                'UPDATE vehiculos SET estado = ? WHERE id = ?',
                [estado, vehiculoId]
            );
        } catch (error) {
            console.error('Error actualizando estado del vehículo:', error.message);
            throw error;
        }
    }

    /**
     * Actualizar costo total de una reparación
     */
    static async actualizarCostoTotalReparacion(reparacionId) {
        try {
            await ejecutarConsulta(`
                UPDATE reparaciones r
                SET r.costo_total = (
                    SELECT COALESCE(SUM(cr.cantidad * cr.costo_unitario), 0)
                    FROM consumo_repuestos cr
                    WHERE cr.reparacion_id = r.id
                )
                WHERE r.id = ?
            `, [reparacionId]);
        } catch (error) {
            console.error('Error actualizando costo total de reparación:', error.message);
        }
    }

    /**
     * Calcular progreso de la reparación basado en el estado
     */
    static calcularProgreso(estado) {
        const progresos = {
            'RECIBIDO': 10,
            'DIAGNOSTICO': 30,
            'EN_REPARACION': 70,
            'TERMINADO': 90,
            'ENTREGADO': 100
        };

        return progresos[estado] || 0;
    }

    /**
     * Calcular días en reparación
     */
    static calcularDiasReparacion(fechaInicio, fechaFin = null) {
        const inicio = new Date(fechaInicio);
        const fin = fechaFin ? new Date(fechaFin) : new Date();
        
        const diferencia = fin.getTime() - inicio.getTime();
        return Math.ceil(diferencia / (1000 * 3600 * 24));
    }

    /**
     * Registrar acción en auditoría
     */
    static async registrarAuditoria(accion, tabla, registroId, datosAnteriores, datosNuevos, usuarioId = 1) {
        try {
            await ejecutarConsulta(
                `INSERT INTO auditoria_sistema 
                 (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores, datos_nuevos) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    usuarioId,
                    accion,
                    tabla,
                    registroId,
                    datosAnteriores ? JSON.stringify(datosAnteriores) : null,
                    datosNuevos ? JSON.stringify(datosNuevos) : null
                ]
            );

        } catch (error) {
            console.error('Error registrando auditoría de reparación:', error.message);
        }
    }

    /**
     * Obtener reparaciones activas (no entregadas)
     */
    static async obtenerReparacionesActivas() {
        try {
            const [reparaciones] = await ejecutarConsulta(
                `SELECT 
                    r.*,
                    v.placa, v.marca, v.modelo,
                    CONCAT(u.nombres, ' ', u.apellidos) as tecnico_nombre
                 FROM reparaciones r
                 INNER JOIN vehiculos v ON r.vehiculo_id = v.id
                 INNER JOIN usuarios u ON r.tecnico_id = u.id
                 WHERE r.estado != 'ENTREGADO'
                 ORDER BY 
                    CASE r.estado
                        WHEN 'EN_REPARACION' THEN 1
                        WHEN 'DIAGNOSTICO' THEN 2
                        WHEN 'RECIBIDO' THEN 3
                        WHEN 'TERMINADO' THEN 4
                        ELSE 5
                    END,
                 r.fecha_recepcion ASC`
            );

            // Calcular progreso y días para cada reparación
            reparaciones.forEach(reparacion => {
                reparacion.progreso = this.calcularProgreso(reparacion.estado);
                reparacion.dias_en_reparacion = this.calcularDiasReparacion(
                    reparacion.fecha_recepcion, 
                    reparacion.fecha_real_entrega
                );
            });

            return reparaciones;

        } catch (error) {
            console.error('Error en ModeloReparacion.obtenerReparacionesActivas:', error.message);
            throw error;
        }
    }

    /**
     * Obtener próximas entregas estimadas
     */
    static async obtenerProximasEntregas(dias = 7) {
        try {
            const [reparaciones] = await ejecutarConsulta(
                `SELECT 
                    r.*,
                    v.placa, v.marca, v.modelo,
                    CONCAT(u.nombres, ' ', u.apellidos) as tecnico_nombre,
                    DATEDIFF(r.fecha_estimada_entrega, CURDATE()) as dias_restantes
                 FROM reparaciones r
                 INNER JOIN vehiculos v ON r.vehiculo_id = v.id
                 INNER JOIN usuarios u ON r.tecnico_id = u.id
                 WHERE r.estado IN ('EN_REPARACION', 'DIAGNOSTICO', 'TERMINADO')
                 AND r.fecha_estimada_entrega IS NOT NULL
                 AND r.fecha_estimada_entrega <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
                 ORDER BY r.fecha_estimada_entrega ASC`,
                [dias]
            );

            return reparaciones;

        } catch (error) {
            console.error('Error en ModeloReparacion.obtenerProximasEntregas:', error.message);
            throw error;
        }
    }

    // Alias para compatibilidad con controllers
    static async obtenerTodos(pagina, limite, filtros) {
        return this.obtenerTodasReparaciones(pagina, limite, filtros);
    }

    static async obtenerPorId(id) {
        return this.obtenerReparacionPorId(id);
    }
}

module.exports = ModeloReparacion;