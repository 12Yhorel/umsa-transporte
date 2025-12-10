/**
 * MODELO DE RESERVAS - SISTEMA DE LA UNIDAD DE TRANSPORTE - UMSA
 * Gestión completa de reservas vehiculares con sistema de aprobación
 * Universidad Mayor de San Andrés
 */

const { obtenerConexion, ejecutarConsulta } = require('../config/database');
const { enviarNotificacion } = require('../utils/notificaciones');

class ModeloReserva {
    /**
     * Mapear campos de entrada aceptando camelCase y snake_case.
     * Convierte keys como solicitanteId -> solicitante_id, fechaReserva -> fecha_reserva, etc.
     */
    static mapearCamposEntrada(data = {}) {
        const mapped = { ...data };

        // Mapeos comunes camelCase -> snake_case
        if (mapped.solicitanteId !== undefined && mapped.solicitante_id === undefined) {
            mapped.solicitante_id = mapped.solicitanteId;
            delete mapped.solicitanteId;
        }
        if (mapped.vehiculoId !== undefined && mapped.vehiculo_id === undefined) {
            mapped.vehiculo_id = mapped.vehiculoId;
            delete mapped.vehiculoId;
        }
        if (mapped.conductorId !== undefined && mapped.conductor_id === undefined) {
            mapped.conductor_id = mapped.conductorId;
            delete mapped.conductorId;
        }
        if (mapped.fechaReserva !== undefined && mapped.fecha_reserva === undefined) {
            mapped.fecha_reserva = mapped.fechaReserva;
            delete mapped.fechaReserva;
        }
        if (mapped.horaInicio !== undefined && mapped.hora_inicio === undefined) {
            mapped.hora_inicio = mapped.horaInicio;
            delete mapped.horaInicio;
        }
        if (mapped.horaFin !== undefined && mapped.hora_fin === undefined) {
            mapped.hora_fin = mapped.horaFin;
            delete mapped.horaFin;
        }
        if (mapped.numeroPasajeros !== undefined && mapped.numero_pasajeros === undefined) {
            mapped.numero_pasajeros = mapped.numeroPasajeros;
            delete mapped.numeroPasajeros;
        }

        // Mapear usuario_id -> solicitante_id si viene del frontend
        if (mapped.usuario_id !== undefined && mapped.solicitante_id === undefined) {
            mapped.solicitante_id = mapped.usuario_id;
            // leave usuario_id as-is for reference
        }

        // Si frontend envía fecha/hora combinado (fecha_inicio, fecha_fin), convertir a fecha_reserva, hora_inicio, hora_fin
        if (mapped.fecha_inicio && !mapped.fecha_reserva) {
            // fecha_inicio esperado en formato ISO 'YYYY-MM-DDTHH:mm'
            const d1 = new Date(mapped.fecha_inicio);
            if (!isNaN(d1.getTime())) {
                mapped.fecha_reserva = d1.toISOString().split('T')[0];
                mapped.hora_inicio = d1.toTimeString().split(' ')[0].slice(0,5);
            }
        }
        if (mapped.fecha_fin && !mapped.hora_fin) {
            const d2 = new Date(mapped.fecha_fin);
            if (!isNaN(d2.getTime())) {
                mapped.hora_fin = d2.toTimeString().split(' ')[0].slice(0,5);
            }
        }

        // Asegurar tipos básicos
        if (mapped.numero_pasajeros !== undefined) mapped.numero_pasajeros = parseInt(mapped.numero_pasajeros) || 1;

        return mapped;
    }

    /**
     * Mapear campos de salida para la API: crear propiedades combinadas
     * `fecha_inicio` y `fecha_fin` en formato `YYYY-MM-DDTHH:mm` para
     * que el frontend que usa `datetime-local` pueda mostrarlas/editar.
     */
    static mapearCamposSalidaReserva(reserva = {}) {
        if (!reserva) return reserva;
        try {
            // Normalizar fecha_reserva a YYYY-MM-DD usando UTC para evitar
            // formatos locale inesperados al convertir objetos Date.
            if (reserva.fecha_reserva) {
                const d = new Date(reserva.fecha_reserva);
                if (!isNaN(d.getTime())) {
                    const fechaStr = d.toISOString().split('T')[0];
                    if (reserva.hora_inicio) {
                        const hi = ('' + reserva.hora_inicio).slice(0,5);
                        reserva.fecha_inicio = `${fechaStr}T${hi}`;
                    }
                    if (reserva.hora_fin) {
                        const hf = ('' + reserva.hora_fin).slice(0,5);
                        reserva.fecha_fin = `${fechaStr}T${hf}`;
                    }
                }
            }
        } catch (err) {
            console.error('Error mapearCamposSalidaReserva:', err.message);
        }
        return reserva;
    }
    
    /**
     * Crear una nueva solicitud de reserva
     */
    static async crear(reservaData) {
        try {
            // Aceptar camelCase o snake_case en el body
            const datos = this.mapearCamposEntrada(reservaData);

            const {
                solicitante_id,
                vehiculo_id,
                fecha_reserva,
                hora_inicio,
                hora_fin,
                origen = '',
                destino,
                nombre_unidad = 'Sin especificar',
                motivo,
                numero_pasajeros = 1,
                conductor_id = null,
                observaciones = null
            } = datos;

            // Validaciones básicas
            if (!solicitante_id || !vehiculo_id || !fecha_reserva || !hora_inicio || !hora_fin || !destino || !nombre_unidad || !motivo) {
                throw new Error('Faltan campos requeridos: solicitante_id, vehiculo_id, fecha_reserva, hora_inicio, hora_fin, destino, nombre_unidad, motivo');
            }

            // Validar fechas y horarios
            if (!this.validarHorario(hora_inicio, hora_fin)) {
                throw new Error('El horario de fin debe ser posterior al horario de inicio');
            }

            if (!this.validarFechaFutura(fecha_reserva)) {
                throw new Error('La fecha de reserva debe ser futura');
            }

            // Verificar que el solicitante existe
            const solicitante = await this.obtenerUsuarioPorId(solicitante_id);
            if (!solicitante) {
                throw new Error('El solicitante especificado no existe');
            }

            // Verificar que el vehículo existe y está disponible
            const vehiculo = await this.obtenerVehiculoPorId(vehiculo_id);
            if (!vehiculo) {
                throw new Error('El vehículo especificado no existe');
            }

            if (vehiculo.estado !== 'DISPONIBLE') {
                throw new Error(`El vehículo no está disponible. Estado actual: ${vehiculo.estado}`);
            }

            // Verificar capacidad del vehículo
            if (numero_pasajeros > vehiculo.capacidad) {
                throw new Error(`El vehículo tiene capacidad para ${vehiculo.capacidad} pasajeros, se solicitaron ${numero_pasajeros}`);
            }

            // Verificar conductor si se especifica
            if (conductor_id) {
                const conductor = await this.obtenerConductorPorId(conductor_id);
                if (!conductor || !conductor.habilitado) {
                    throw new Error('El conductor especificado no existe o no está habilitado');
                }
            }

            // Verificar disponibilidad del vehículo
            const conflicto = await this.verificarDisponibilidadVehiculo(vehiculo_id, fecha_reserva, hora_inicio, hora_fin);
            if (conflicto) {
                throw new Error('El vehículo no está disponible en el horario solicitado');
            }

            // Verificar disponibilidad del conductor si se especifica
            if (conductor_id) {
                const conflictoConductor = await this.verificarDisponibilidadConductor(conductor_id, fecha_reserva, hora_inicio, hora_fin);
                if (conflictoConductor) {
                    throw new Error('El conductor no está disponible en el horario solicitado');
                }
            }

            const conexion = await obtenerConexion();

            const sql = `INSERT INTO reservas 
                (solicitante_id, vehiculo_id, conductor_id, fecha_reserva, hora_inicio, 
                 hora_fin, origen, destino, nombre_unidad, motivo, observaciones) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            const params = [solicitante_id, vehiculo_id, conductor_id, fecha_reserva, hora_inicio, 
                hora_fin, origen, destino, nombre_unidad, motivo, observaciones];

              // Logs de SQL eliminados (depuración previa)

              const [resultado] = await conexion.execute(sql, params);

                        // Obtener la reserva recién creada
                        const reservaCreada = await this.obtenerReservaPorId(resultado.insertId);
            
            // Iniciar workflow de aprobación
            await this.iniciarWorkflowAprobacion(resultado.insertId);
            
            // Enviar notificación al solicitante
            await this.enviarNotificacionCreacion(reservaCreada);

            // Registrar en auditoría
            await this.registrarAuditoria(
                'CREACION_RESERVA',
                'reservas',
                resultado.insertId,
                null,
                { 
                    solicitante_id, 
                    vehiculo_id, 
                    fecha_reserva, 
                    estado: 'PENDIENTE' 
                },
                solicitante_id
            );

            return reservaCreada;

        } catch (error) {
            console.error('Error en ModeloReserva.crear:', error.message);
            throw error;
        }
    }

    /**
     * Obtener reserva por ID con información completa
     */
    static async obtenerReservaPorId(id) {
        try {
            const [reservas] = await ejecutarConsulta(
                `SELECT 
                    r.*,
                    v.placa, v.marca, v.modelo, v.color, v.capacidad,
                    CONCAT(s.nombres, ' ', s.apellidos) as solicitante_nombre,
                    s.email as solicitante_email,
                    s.departamento as solicitante_departamento,
                    CONCAT(c.usuario_id, ' - ', cu.nombres, ' ', cu.apellidos) as conductor_nombre,
                    cu.email as conductor_email,
                    CONCAT(a.nombres, ' ', a.apellidos) as aprobador_nombre,
                    DATEDIFF(r.fecha_reserva, CURDATE()) as dias_restantes,
                    TIMESTAMPDIFF(HOUR, CONCAT(r.fecha_reserva, ' ', r.hora_inicio), CONCAT(r.fecha_reserva, ' ', r.hora_fin)) as duracion_horas
                 FROM reservas r
                 INNER JOIN vehiculos v ON r.vehiculo_id = v.id
                 INNER JOIN usuarios s ON r.solicitante_id = s.id
                 LEFT JOIN conductores c ON r.conductor_id = c.id
                 LEFT JOIN usuarios cu ON c.usuario_id = cu.id
                 LEFT JOIN usuarios a ON r.aprobado_por = a.id
                 WHERE r.id = ?`,
                [id]
            );

            if (reservas.length === 0) {
                return null;
            }

            const reserva = reservas[0];
            // Añadir campos combinados para facilidad del frontend
            this.mapearCamposSalidaReserva(reserva);
            
            // Calcular información adicional
            reserva.puede_cancelar = this.puedeCancelarReserva(reserva);
            reserva.puede_modificar = this.puedeModificarReserva(reserva);
            reserva.esta_proxima = this.estaProximaReserva(reserva);
            reserva.requiere_aprobacion = this.requiereAprobacion(reserva);
            
            // Obtener historial de aprobación
            reserva.historial_aprobacion = await this.obtenerHistorialAprobacion(id);

            return reserva;

        } catch (error) {
            console.error('Error en ModeloReserva.obtenerReservaPorId:', error.message);
            throw error;
        }
    }

    /**
     * Obtener todas las reservas con paginación y filtros
     */
    static async obtenerTodasReservas(pagina = 1, limite = 10, filtros = {}) {
        try {
            // Convertir a enteros para evitar problemas con MySQL prepared statements
            pagina = parseInt(pagina);
            limite = parseInt(limite);
            const offset = (pagina - 1) * limite;
            let consulta = `
                SELECT 
                    r.*,
                    v.placa, v.marca, v.modelo,
                    CONCAT(s.nombres, ' ', s.apellidos) as solicitante_nombre,
                    s.departamento as solicitante_departamento,
                    CONCAT(cu.nombres, ' ', cu.apellidos) as conductor_nombre,
                    cu.nombres as conductor_nombres,
                    cu.apellidos as conductor_apellidos,
                    DATEDIFF(r.fecha_reserva, CURDATE()) as dias_restantes
                FROM reservas r
                INNER JOIN vehiculos v ON r.vehiculo_id = v.id
                INNER JOIN usuarios s ON r.solicitante_id = s.id
                LEFT JOIN conductores c ON r.conductor_id = c.id
                LEFT JOIN usuarios cu ON c.usuario_id = cu.id
            `;
            
            const parametros = [];
            const condiciones = [];

            // Aplicar filtros
            if (filtros.estado) {
                condiciones.push('r.estado = ?');
                parametros.push(filtros.estado);
            }

            if (filtros.solicitante_id) {
                condiciones.push('r.solicitante_id = ?');
                parametros.push(filtros.solicitante_id);
            }

            if (filtros.vehiculo_id) {
                condiciones.push('r.vehiculo_id = ?');
                parametros.push(filtros.vehiculo_id);
            }

            if (filtros.fecha_desde) {
                condiciones.push('r.fecha_reserva >= ?');
                parametros.push(filtros.fecha_desde);
            }

            if (filtros.fecha_hasta) {
                condiciones.push('r.fecha_reserva <= ?');
                parametros.push(filtros.fecha_hasta);
            }

            if (filtros.departamento) {
                condiciones.push('s.departamento = ?');
                parametros.push(filtros.departamento);
            }

            if (filtros.solo_futuras) {
                condiciones.push('(r.fecha_reserva >= CURDATE() OR r.estado = "PENDIENTE")');
            }

            if (filtros.requiere_aprobacion) {
                condiciones.push('r.estado = "PENDIENTE"');
            }

            if (condiciones.length > 0) {
                consulta += ' WHERE ' + condiciones.join(' AND ');
            }

            // Ordenar - interpolar directamente LIMIT/OFFSET
            consulta += ` ORDER BY r.fecha_reserva DESC, r.hora_inicio DESC LIMIT ${limite} OFFSET ${offset}`;

            const [reservas] = await ejecutarConsulta(consulta, parametros);

            // Enriquecer datos para cada reserva
            for (let reserva of reservas) {
                // Construir objeto vehiculo
                reserva.vehiculo = {
                    id: reserva.vehiculo_id,
                    placa: reserva.placa,
                    marca: reserva.marca,
                    modelo: reserva.modelo
                };

                // Construir objeto solicitante
                reserva.solicitante = {
                    id: reserva.solicitante_id,
                    nombres: reserva.solicitante_nombre ? reserva.solicitante_nombre.split(' ')[0] : '',
                    departamento: reserva.solicitante_departamento
                };

                // Construir objeto conductor si existe
                if (reserva.conductor_id && reserva.conductor_nombres) {
                    reserva.conductor = {
                        id: reserva.conductor_id,
                        nombres: reserva.conductor_nombres,
                        apellidos: reserva.conductor_apellidos
                    };
                } else {
                    reserva.conductor = null;
                }

                // Añadir campos combinados para que el frontend pueda usar
                // `datetime-local` y editar fácilmente.
                this.mapearCamposSalidaReserva(reserva);
                reserva.puede_cancelar = this.puedeCancelarReserva(reserva);
                reserva.puede_modificar = this.puedeModificarReserva(reserva);
                reserva.esta_proxima = this.estaProximaReserva(reserva);
            }

            // Obtener total para paginación
            const total = await this.obtenerTotalReservas(filtros);

            return {
                reservas,
                paginacion: {
                    pagina: parseInt(pagina),
                    limite: parseInt(limite),
                    total,
                    totalPaginas: Math.ceil(total / limite)
                }
            };

        } catch (error) {
            console.error('Error en ModeloReserva.obtenerTodasReservas:', error.message);
            throw error;
        }
    }

    /**
     * Obtener total de reservas con filtros
     */
    static async obtenerTotalReservas(filtros = {}) {
        try {
            let consulta = `
                SELECT COUNT(*) as total 
                FROM reservas r
                INNER JOIN vehiculos v ON r.vehiculo_id = v.id
                INNER JOIN usuarios s ON r.solicitante_id = s.id
                LEFT JOIN conductores c ON r.conductor_id = c.id
                LEFT JOIN usuarios cu ON c.usuario_id = cu.id
            `;
            
            const parametros = [];
            const condiciones = [];

            // Aplicar filtros (misma lógica que obtenerTodasReservas)
            if (filtros.estado) {
                condiciones.push('r.estado = ?');
                parametros.push(filtros.estado);
            }

            if (filtros.solicitante_id) {
                condiciones.push('r.solicitante_id = ?');
                parametros.push(filtros.solicitante_id);
            }

            if (filtros.vehiculo_id) {
                condiciones.push('r.vehiculo_id = ?');
                parametros.push(filtros.vehiculo_id);
            }

            if (filtros.fecha_desde) {
                condiciones.push('r.fecha_reserva >= ?');
                parametros.push(filtros.fecha_desde);
            }

            if (filtros.fecha_hasta) {
                condiciones.push('r.fecha_reserva <= ?');
                parametros.push(filtros.fecha_hasta);
            }

            if (filtros.departamento) {
                condiciones.push('s.departamento = ?');
                parametros.push(filtros.departamento);
            }

            if (filtros.solo_futuras) {
                condiciones.push('(r.fecha_reserva >= CURDATE() OR r.estado = "PENDIENTE")');
            }

            if (filtros.requiere_aprobacion) {
                condiciones.push('r.estado = "PENDIENTE"');
            }

            if (condiciones.length > 0) {
                consulta += ' WHERE ' + condiciones.join(' AND ');
            }

            const [resultado] = await ejecutarConsulta(consulta, parametros);
            return resultado[0].total;

        } catch (error) {
            console.error('Error en ModeloReserva.obtenerTotalReservas:', error.message);
            throw error;
        }
    }

    /**
     * Aprobar una reserva
     */
    static async aprobarReserva(id, aprobadorId, observaciones = null) {
        try {
            // Verificar que la reserva existe y está pendiente
            const reserva = await this.obtenerReservaPorId(id);
            if (!reserva) {
                throw new Error('Reserva no encontrada');
            }

            if (reserva.estado !== 'PENDIENTE') {
                throw new Error(`La reserva no puede ser aprobada. Estado actual: ${reserva.estado}`);
            }

            // Verificar que el aprobador existe
            const aprobador = await this.obtenerUsuarioPorId(aprobadorId);
            if (!aprobador) {
                throw new Error('El usuario aprobador no existe');
            }

            const conexion = await obtenerConexion();
            const [resultado] = await conexion.execute(
                'UPDATE reservas SET estado = "APROBADA", aprobado_por = ?, fecha_aprobacion = NOW(), observaciones = ? WHERE id = ?',
                [aprobadorId, observaciones, id]
            );

            if (resultado.affectedRows === 0) {
                throw new Error('No se pudo aprobar la reserva');
            }

            // Enviar notificación al solicitante
            await this.enviarNotificacionAprobacion(id);

            // Registrar en auditoría
            await this.registrarAuditoria(
                'APROBACION_RESERVA',
                'reservas',
                id,
                { estado_anterior: 'PENDIENTE' },
                { estado_nuevo: 'APROBADA', aprobado_por: aprobadorId },
                aprobadorId
            );

            return await this.obtenerReservaPorId(id);

        } catch (error) {
            console.error('Error en ModeloReserva.aprobarReserva:', error.message);
            throw error;
        }
    }

    /**
     * Rechazar una reserva
     */
    static async rechazarReserva(id, aprobadorId, observaciones) {
        try {
            if (!observaciones) {
                throw new Error('Se requieren observaciones para rechazar una reserva');
            }

            // Verificar que la reserva existe y está pendiente
            const reserva = await this.obtenerReservaPorId(id);
            if (!reserva) {
                throw new Error('Reserva no encontrada');
            }

            if (reserva.estado !== 'PENDIENTE') {
                throw new Error(`La reserva no puede ser rechazada. Estado actual: ${reserva.estado}`);
            }

            const conexion = await obtenerConexion();
            const [resultado] = await conexion.execute(
                'UPDATE reservas SET estado = "RECHAZADA", aprobado_por = ?, fecha_aprobacion = NOW(), observaciones = ? WHERE id = ?',
                [aprobadorId, observaciones, id]
            );

            if (resultado.affectedRows === 0) {
                throw new Error('No se pudo rechazar la reserva');
            }

            // Enviar notificación al solicitante
            await this.enviarNotificacionRechazo(id, observaciones);

            // Registrar en auditoría
            await this.registrarAuditoria(
                'RECHAZO_RESERVA',
                'reservas',
                id,
                { estado_anterior: 'PENDIENTE' },
                { estado_nuevo: 'RECHAZADA', aprobado_por: aprobadorId, observaciones },
                aprobadorId
            );

            return await this.obtenerReservaPorId(id);

        } catch (error) {
            console.error('Error en ModeloReserva.rechazarReserva:', error.message);
            throw error;
        }
    }

    /**
     * Cancelar una reserva
     */
    static async cancelarReserva(id, usuarioId, motivo = null) {
        try {
            // Verificar que la reserva existe
            const reserva = await this.obtenerReservaPorId(id);
            if (!reserva) {
                throw new Error('Reserva no encontrada');
            }

            // Verificar permisos para cancelar
            if (!this.puedeCancelarReserva(reserva, usuarioId)) {
                throw new Error('No tiene permisos para cancelar esta reserva');
            }

            const estadosPermitidos = ['PENDIENTE', 'APROBADA'];
            if (!estadosPermitidos.includes(reserva.estado)) {
                throw new Error(`No se puede cancelar una reserva en estado: ${reserva.estado}`);
            }

            const conexion = await obtenerConexion();
            const [resultado] = await conexion.execute(
                'UPDATE reservas SET estado = "CANCELADA", observaciones = CONCAT(COALESCE(observaciones, ""), " | Cancelación: ", ?) WHERE id = ?',
                [motivo || 'Sin motivo especificado', id]
            );

            if (resultado.affectedRows === 0) {
                throw new Error('No se pudo cancelar la reserva');
            }

            // Enviar notificación de cancelación
            await this.enviarNotificacionCancelacion(id, motivo);

            // Registrar en auditoría
            await this.registrarAuditoria(
                'CANCELACION_RESERVA',
                'reservas',
                id,
                { estado_anterior: reserva.estado },
                { estado_nuevo: 'CANCELADA', motivo },
                usuarioId
            );

            return await this.obtenerReservaPorId(id);

        } catch (error) {
            console.error('Error en ModeloReserva.cancelarReserva:', error.message);
            throw error;
        }
    }

    /**
     * Completar una reserva (marcar como completada)
     */
    static async completarReserva(id, usuarioId, observaciones = null) {
        try {
            // Verificar que la reserva existe y está aprobada
            const reserva = await this.obtenerReservaPorId(id);
            if (!reserva) {
                throw new Error('Reserva no encontrada');
            }

            if (reserva.estado !== 'APROBADA') {
                throw new Error(`Solo se pueden completar reservas aprobadas. Estado actual: ${reserva.estado}`);
            }

            // Verificar que la fecha de reserva ya pasó
            const hoy = new Date().toISOString().split('T')[0];
            if (reserva.fecha_reserva > hoy) {
                throw new Error('No se puede completar una reserva futura');
            }

            const conexion = await obtenerConexion();
            const [resultado] = await conexion.execute(
                'UPDATE reservas SET estado = "COMPLETADA", observaciones = CONCAT(COALESCE(observaciones, ""), " | Completada: ", ?) WHERE id = ?',
                [observaciones || 'Completada exitosamente', id]
            );

            if (resultado.affectedRows === 0) {
                throw new Error('No se pudo completar la reserva');
            }

            // Registrar en auditoría
            await this.registrarAuditoria(
                'COMPLETACION_RESERVA',
                'reservas',
                id,
                { estado_anterior: 'APROBADA' },
                { estado_nuevo: 'COMPLETADA', observaciones },
                usuarioId
            );

            return await this.obtenerReservaPorId(id);

        } catch (error) {
            console.error('Error en ModeloReserva.completarReserva:', error.message);
            throw error;
        }
    }

    /**
     * Verificar disponibilidad de vehículo
     */
    static async verificarDisponibilidadVehiculo(vehiculoId, fecha, horaInicio, horaFin, excluirReservaId = null) {
        try {
            let consulta = `
                SELECT COUNT(*) as conflictos
                FROM reservas r
                WHERE r.vehiculo_id = ?
                AND r.fecha_reserva = ?
                AND r.estado IN ('PENDIENTE', 'APROBADA')
                AND (
                    (r.hora_inicio BETWEEN ? AND ?) OR
                    (r.hora_fin BETWEEN ? AND ?) OR
                    (? BETWEEN r.hora_inicio AND r.hora_fin) OR
                    (? BETWEEN r.hora_inicio AND r.hora_fin)
                )
            `;

            const parametros = [vehiculoId, fecha, horaInicio, horaFin, horaInicio, horaFin, horaInicio, horaFin];

            if (excluirReservaId) {
                consulta += ' AND r.id != ?';
                parametros.push(excluirReservaId);
            }

            const [resultado] = await ejecutarConsulta(consulta, parametros);
            return resultado[0].conflictos > 0;

        } catch (error) {
            console.error('Error en ModeloReserva.verificarDisponibilidadVehiculo:', error.message);
            throw error;
        }
    }

    /**
     * Verificar disponibilidad de conductor
     */
    static async verificarDisponibilidadConductor(conductorId, fecha, horaInicio, horaFin, excluirReservaId = null) {
        try {
            let consulta = `
                SELECT COUNT(*) as conflictos
                FROM reservas r
                WHERE r.conductor_id = ?
                AND r.fecha_reserva = ?
                AND r.estado IN ('PENDIENTE', 'APROBADA')
                AND (
                    (r.hora_inicio BETWEEN ? AND ?) OR
                    (r.hora_fin BETWEEN ? AND ?) OR
                    (? BETWEEN r.hora_inicio AND r.hora_fin) OR
                    (? BETWEEN r.hora_inicio AND r.hora_fin)
                )
            `;

            const parametros = [conductorId, fecha, horaInicio, horaFin, horaInicio, horaFin, horaInicio, horaFin];

            if (excluirReservaId) {
                consulta += ' AND r.id != ?';
                parametros.push(excluirReservaId);
            }

            const [resultado] = await ejecutarConsulta(consulta, parametros);
            return resultado[0].conflictos > 0;

        } catch (error) {
            console.error('Error en ModeloReserva.verificarDisponibilidadConductor:', error.message);
            throw error;
        }
    }

    /**
     * Obtener calendario de disponibilidad
     */
    static async obtenerCalendarioDisponibilidad(fechaInicio, fechaFin, vehiculoId = null) {
        try {
            let consulta = `
                SELECT 
                    v.id as vehiculo_id,
                    v.placa,
                    v.marca,
                    v.modelo,
                    v.capacidad,
                    r.fecha_reserva as fecha,
                    r.hora_inicio,
                    r.hora_fin,
                    r.estado,
                    CONCAT(s.nombres, ' ', s.apellidos) as solicitante_nombre
                FROM vehiculos v
                LEFT JOIN reservas r ON v.id = r.vehiculo_id 
                    AND r.fecha_reserva BETWEEN ? AND ?
                    AND r.estado IN ('PENDIENTE', 'APROBADA')
                LEFT JOIN usuarios s ON r.solicitante_id = s.id
                WHERE v.estado = 'DISPONIBLE'
            `;

            const parametros = [fechaInicio, fechaFin];

            if (vehiculoId) {
                consulta += ' AND v.id = ?';
                parametros.push(vehiculoId);
            }

            consulta += ' ORDER BY v.placa, r.fecha_reserva, r.hora_inicio';

            const [resultado] = await ejecutarConsulta(consulta, parametros);

            // Procesar resultado para formato de calendario
            const calendario = {};
            resultado.forEach(item => {
                if (!calendario[item.vehiculo_id]) {
                    calendario[item.vehiculo_id] = {
                        vehiculo_id: item.vehiculo_id,
                        placa: item.placa,
                        marca: item.marca,
                        modelo: item.modelo,
                        capacidad: item.capacidad,
                        reservas: []
                    };
                }

                if (item.fecha) {
                    calendario[item.vehiculo_id].reservas.push({
                        fecha: item.fecha,
                        hora_inicio: item.hora_inicio,
                        hora_fin: item.hora_fin,
                        estado: item.estado,
                        solicitante: item.solicitante_nombre
                    });
                }
            });

            return Object.values(calendario);

        } catch (error) {
            console.error('Error en ModeloReserva.obtenerCalendarioDisponibilidad:', error.message);
            throw error;
        }
    }

    /**
     * Obtener reservas próximas (hoy y próximos días)
     */
    static async obtenerReservasProximas(dias = 7) {
        try {
            const [reservas] = await ejecutarConsulta(
                `SELECT 
                    r.*,
                    v.placa, v.marca, v.modelo,
                    CONCAT(s.nombres, ' ', s.apellidos) as solicitante_nombre,
                    s.departamento as solicitante_departamento,
                    CONCAT(cu.nombres, ' ', cu.apellidos) as conductor_nombre,
                    DATEDIFF(r.fecha_reserva, CURDATE()) as dias_restantes
                 FROM reservas r
                 INNER JOIN vehiculos v ON r.vehiculo_id = v.id
                 INNER JOIN usuarios s ON r.solicitante_id = s.id
                 LEFT JOIN conductores c ON r.conductor_id = c.id
                 LEFT JOIN usuarios cu ON c.usuario_id = cu.id
                 WHERE r.estado = 'APROBADA'
                 AND r.fecha_reserva BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
                 ORDER BY r.fecha_reserva ASC, r.hora_inicio ASC`,
                [dias]
            );

            return reservas;

        } catch (error) {
            console.error('Error en ModeloReserva.obtenerReservasProximas:', error.message);
            throw error;
        }
    }

    /**
     * Obtener estadísticas de reservas
     */
    static async obtenerEstadisticas(periodo = 'mes') {
        try {
            let filtroFecha = '';
            switch (periodo) {
                case 'semana':
                    filtroFecha = 'AND r.fecha_solicitud >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
                    break;
                case 'mes':
                    filtroFecha = 'AND r.fecha_solicitud >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)';
                    break;
                case 'trimestre':
                    filtroFecha = 'AND r.fecha_solicitud >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)';
                    break;
                case 'año':
                    filtroFecha = 'AND r.fecha_solicitud >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)';
                    break;
                default:
                    filtroFecha = 'AND r.fecha_solicitud >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)';
            }

            const [estadisticas] = await ejecutarConsulta(`
                SELECT 
                    COUNT(*) as total_reservas,
                    SUM(CASE WHEN r.estado = 'APROBADA' THEN 1 ELSE 0 END) as reservas_aprobadas,
                    SUM(CASE WHEN r.estado = 'PENDIENTE' THEN 1 ELSE 0 END) as reservas_pendientes,
                    SUM(CASE WHEN r.estado = 'RECHAZADA' THEN 1 ELSE 0 END) as reservas_rechazadas,
                    SUM(CASE WHEN r.estado = 'COMPLETADA' THEN 1 ELSE 0 END) as reservas_completadas,
                    SUM(CASE WHEN r.estado = 'CANCELADA' THEN 1 ELSE 0 END) as reservas_canceladas,
                    COUNT(DISTINCT r.solicitante_id) as solicitantes_unicos,
                    COUNT(DISTINCT r.vehiculo_id) as vehiculos_utilizados,
                    AVG(DATEDIFF(r.fecha_aprobacion, r.fecha_solicitud)) as tiempo_aprobacion_promedio
                FROM reservas r
                WHERE 1=1 ${filtroFecha}
            `);

            const [reservasPorDepartamento] = await ejecutarConsulta(`
                SELECT s.departamento, COUNT(*) as cantidad_reservas
                FROM reservas r
                INNER JOIN usuarios s ON r.solicitante_id = s.id
                WHERE 1=1 ${filtroFecha}
                GROUP BY s.departamento
                ORDER BY cantidad_reservas DESC
            `);

            const [reservasPorVehiculo] = await ejecutarConsulta(`
                SELECT v.placa, v.marca, v.modelo, COUNT(*) as cantidad_reservas
                FROM reservas r
                INNER JOIN vehiculos v ON r.vehiculo_id = v.id
                WHERE 1=1 ${filtroFecha}
                GROUP BY v.id, v.placa, v.marca, v.modelo
                ORDER BY cantidad_reservas DESC
                LIMIT 10
            `);

            const [reservasPorDia] = await ejecutarConsulta(`
                SELECT DAYNAME(fecha_reserva) as dia_semana, COUNT(*) as cantidad_reservas
                FROM reservas
                WHERE 1=1 ${filtroFecha}
                GROUP BY DAYNAME(fecha_reserva), DAYOFWEEK(fecha_reserva)
                ORDER BY DAYOFWEEK(fecha_reserva)
            `);

            return {
                general: estadisticas[0],
                por_departamento: reservasPorDepartamento,
                por_vehiculo: reservasPorVehiculo,
                por_dia: reservasPorDia
            };

        } catch (error) {
            console.error('Error en ModeloReserva.obtenerEstadisticas:', error.message);
            throw error;
        }
    }

    /**
     * Métodos auxiliares privados
     */

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
            console.error('Error en ModeloReserva.obtenerUsuarioPorId:', error.message);
            throw error;
        }
    }

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
            console.error('Error en ModeloReserva.obtenerVehiculoPorId:', error.message);
            throw error;
        }
    }

    /**
     * Obtener conductor por ID
     */
    static async obtenerConductorPorId(id) {
        try {
            const [conductores] = await ejecutarConsulta(
                `SELECT c.*, u.nombres, u.apellidos 
                 FROM conductores c 
                 INNER JOIN usuarios u ON c.usuario_id = u.id 
                 WHERE c.id = ?`,
                [id]
            );

            return conductores[0] || null;

        } catch (error) {
            console.error('Error en ModeloReserva.obtenerConductorPorId:', error.message);
            throw error;
        }
    }

    /**
     * Validar horario
     */
    static validarHorario(horaInicio, horaFin) {
        return horaInicio < horaFin;
    }

    /**
     * Validar fecha futura
     */
    static validarFechaFutura(fecha) {
        const hoy = new Date().toISOString().split('T')[0];
        return fecha >= hoy;
    }

    /**
     * Verificar si una reserva puede ser cancelada
     */
    static puedeCancelarReserva(reserva, usuarioId = null) {
        if (reserva.estado !== 'PENDIENTE' && reserva.estado !== 'APROBADA') {
            return false;
        }

        // Verificar que no sea el mismo día de la reserva
        const hoy = new Date().toISOString().split('T')[0];
        if (reserva.fecha_reserva === hoy) {
            return false;
        }

        // Si se especifica usuario, verificar que sea el solicitante o un admin
        if (usuarioId) {
            return reserva.solicitante_id === usuarioId || usuarioId === 1; // Admin
        }

        return true;
    }

    /**
     * Verificar si una reserva puede ser modificada
     */
    static puedeModificarReserva(reserva) {
        return reserva.estado === 'PENDIENTE';
    }

    /**
     * Verificar si una reserva está próxima
     */
    static estaProximaReserva(reserva) {
        const hoy = new Date().toISOString().split('T')[0];
        const diferenciaDias = (new Date(reserva.fecha_reserva) - new Date(hoy)) / (1000 * 60 * 60 * 24);
        return diferenciaDias <= 2 && diferenciaDias >= 0; // Próximos 2 días
    }

    /**
     * Verificar si requiere aprobación
     */
    static requiereAprobacion(reserva) {
        return reserva.estado === 'PENDIENTE';
    }

    /**
     * Iniciar workflow de aprobación
     */
    static async iniciarWorkflowAprobacion(reservaId) {
        try {
            // Aquí se implementaría la lógica de workflow multi-nivel
            // Por ahora, notificar a los administradores
            await this.notificarAdministradoresNuevaReserva(reservaId);
        } catch (error) {
            console.error('Error iniciando workflow de aprobación:', error.message);
        }
    }

    /**
     * Obtener historial de aprobación
     */
    static async obtenerHistorialAprobacion(reservaId) {
        try {
            const [historial] = await ejecutarConsulta(
                `SELECT 
                    a.accion,
                    a.creado_en as fecha,
                    CONCAT(u.nombres, ' ', u.apellidos) as usuario_nombre,
                    a.datos_anteriores,
                    a.datos_nuevos
                 FROM auditoria_sistema a
                 LEFT JOIN usuarios u ON a.usuario_id = u.id
                 WHERE a.tabla_afectada = 'reservas' 
                 AND a.registro_id = ?
                 ORDER BY a.creado_en DESC`,
                [reservaId]
            );

            return historial;
        } catch (error) {
            console.error('Error obteniendo historial de aprobación:', error.message);
            return [];
        }
    }

    /**
     * Métodos de notificación
     */
    static async enviarNotificacionCreacion(reserva) {
        try {
            const asunto = 'Nueva Solicitud de Reserva Creada';
            const mensaje = `
                Se ha creado una nueva solicitud de reserva:
                
                Vehículo: ${reserva.marca} ${reserva.modelo} (${reserva.placa})
                Fecha: ${reserva.fecha_reserva}
                Horario: ${reserva.hora_inicio} - ${reserva.hora_fin}
                Solicitante: ${reserva.solicitante_nombre}
                Departamento: ${reserva.solicitante_departamento}
                
                Estado: PENDIENTE DE APROBACIÓN
            `;

            await enviarNotificacion(reserva.solicitante_email, asunto, mensaje);
        } catch (error) {
            console.error('Error enviando notificación de creación:', error.message);
        }
    }

    static async enviarNotificacionAprobacion(reservaId) {
        try {
            const reserva = await this.obtenerReservaPorId(reservaId);
            const asunto = 'Reserva Aprobada';
            const mensaje = `
                Su solicitud de reserva ha sido APROBADA:
                
                Vehículo: ${reserva.marca} ${reserva.modelo} (${reserva.placa})
                Fecha: ${reserva.fecha_reserva}
                Horario: ${reserva.hora_inicio} - ${reserva.hora_fin}
                Conductor: ${reserva.conductor_nombre || 'Por asignar'}
                
                ¡Por favor esté puntual!
            `;

            await enviarNotificacion(reserva.solicitante_email, asunto, mensaje);
        } catch (error) {
            console.error('Error enviando notificación de aprobación:', error.message);
        }
    }

    static async enviarNotificacionRechazo(reservaId, motivo) {
        try {
            const reserva = await this.obtenerReservaPorId(reservaId);
            const asunto = 'Reserva Rechazada';
            const mensaje = `
                Su solicitud de reserva ha sido RECHAZADA:
                
                Vehículo: ${reserva.marca} ${reserva.modelo} (${reserva.placa})
                Fecha: ${reserva.fecha_reserva}
                Horario: ${reserva.hora_inicio} - ${reserva.hora_fin}
                
                Motivo: ${motivo}
                
                Puede crear una nueva solicitud con diferentes parámetros.
            `;

            await enviarNotificacion(reserva.solicitante_email, asunto, mensaje);
        } catch (error) {
            console.error('Error enviando notificación de rechazo:', error.message);
        }
    }

    static async enviarNotificacionCancelacion(reservaId, motivo) {
        try {
            const reserva = await this.obtenerReservaPorId(reservaId);
            const asunto = 'Reserva Cancelada';
            const mensaje = `
                Su reserva ha sido CANCELADA:
                
                Vehículo: ${reserva.marca} ${reserva.modelo} (${reserva.placa})
                Fecha: ${reserva.fecha_reserva}
                Horario: ${reserva.hora_inicio} - ${reserva.hora_fin}
                
                Motivo: ${motivo || 'No especificado'}
            `;

            await enviarNotificacion(reserva.solicitante_email, asunto, mensaje);
        } catch (error) {
            console.error('Error enviando notificación de cancelación:', error.message);
        }
    }

    static async notificarAdministradoresNuevaReserva(reservaId) {
        try {
            const reserva = await this.obtenerReservaPorId(reservaId);
            const [administradores] = await ejecutarConsulta(
                'SELECT email FROM usuarios WHERE rol_id = 1 AND activo = TRUE'
            );

            const asunto = 'Nueva Reserva Requiere Aprobación';
            const mensaje = `
                Nueva solicitud de reserva requiere aprobación:
                
                ID: ${reserva.id}
                Vehículo: ${reserva.marca} ${reserva.modelo} (${reserva.placa})
                Fecha: ${reserva.fecha_reserva}
                Horario: ${reserva.hora_inicio} - ${reserva.hora_fin}
                Solicitante: ${reserva.solicitante_nombre}
                Departamento: ${reserva.solicitante_departamento}
                Motivo: ${reserva.motivo}
                
                Por favor revise el sistema para aprobar o rechazar esta solicitud.
            `;

            for (const admin of administradores) {
                await enviarNotificacion(admin.email, asunto, mensaje);
            }
        } catch (error) {
            console.error('Error notificando administradores:', error.message);
        }
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
            console.error('Error registrando auditoría de reserva:', error.message);
        }
    }

    // Alias para compatibilidad con controllers
    static async obtenerTodos(pagina, limite, filtros) {
        return this.obtenerTodasReservas(pagina, limite, filtros);
    }

    static async obtenerPorId(id) {
        return this.obtenerReservaPorId(id);
    }

    static async aprobar(id, aprobadorId, observaciones) {
        return this.aprobarReserva(id, aprobadorId, observaciones);
    }

    static async rechazar(id, aprobadorId, observaciones) {
        return this.rechazarReserva(id, aprobadorId, observaciones);
    }

    static async cancelar(id, usuarioId, motivo) {
        return this.cancelarReserva(id, usuarioId, motivo);
    }

    static async completar(id, usuarioId, observaciones) {
        return this.completarReserva(id, usuarioId, observaciones);
    }

    /**
     * Actualizar reserva
     */
    static async actualizar(id, datosActualizacion) {
        const conexion = await obtenerConexion();
        try {
            // Obtener reserva actual
            const reservaActual = await this.obtenerPorId(id);
            if (!reservaActual) {
                throw new Error('Reserva no encontrada');
            }

            // Construir query dinámicamente
            const camposPermitidos = ['vehiculo_id', 'conductor_id', 'fecha_reserva', 'hora_inicio', 'hora_fin', 
                                      'origen', 'destino', 'nombre_unidad', 'motivo', 'observaciones', 'estado'];
            const campos = [];
            const valores = [];

            for (const [campo, valor] of Object.entries(datosActualizacion)) {
                if (camposPermitidos.includes(campo) && valor !== undefined) {
                    campos.push(`${campo} = ?`);
                    valores.push(valor);
                }
            }

            if (campos.length === 0) {
                throw new Error('No hay campos válidos para actualizar');
            }

            valores.push(id);

            await conexion.execute(
                `UPDATE reservas SET ${campos.join(', ')} WHERE id = ?`,
                valores
            );

            // Registrar auditoría
            await this.registrarAuditoria(
                'ACTUALIZACION_RESERVA',
                'reservas',
                id,
                reservaActual,
                datosActualizacion
            );

            return await this.obtenerPorId(id);

        } catch (error) {
            console.error('Error en ModeloReserva.actualizar:', error.message);
            throw error;
        }
    }

    /**
     * Eliminar reserva
     */
    static async eliminar(id) {
        const conexion = await obtenerConexion();
        try {
            // Obtener reserva antes de eliminar
            const reserva = await this.obtenerPorId(id);
            if (!reserva) {
                throw new Error('Reserva no encontrada');
            }

            // Registrar en auditoría ANTES de eliminar
            await this.registrarAuditoria(
                'ELIMINACION_RESERVA',
                'reservas',
                id,
                reserva,
                null
            );

            // Eliminar registros de auditoría de la reserva
            await conexion.execute(
                'DELETE FROM auditoria_sistema WHERE tabla_afectada = ? AND registro_id = ?',
                ['reservas', id]
            );

            // Eliminar la reserva
            const [resultado] = await conexion.execute(
                'DELETE FROM reservas WHERE id = ?',
                [id]
            );

            if (resultado.affectedRows === 0) {
                throw new Error('No se pudo eliminar la reserva');
            }

            return { success: true, message: 'Reserva eliminada correctamente' };

        } catch (error) {
            console.error('Error en ModeloReserva.eliminar:', error.message);
            throw error;
        }
    }

    /**
     * Cambiar estado de la reserva
     */
    static async cambiarEstado(id, nuevoEstado) {
        const conexion = await obtenerConexion();
        try {
            // Validar estado
            const estadosValidos = ['PENDIENTE', 'APROBADA', 'RECHAZADA', 'CANCELADA', 'COMPLETADA'];
            if (!estadosValidos.includes(nuevoEstado)) {
                throw new Error('Estado no válido');
            }

            // Obtener reserva actual
            const reservaActual = await this.obtenerPorId(id);
            if (!reservaActual) {
                throw new Error('Reserva no encontrada');
            }

            await conexion.execute(
                'UPDATE reservas SET estado = ? WHERE id = ?',
                [nuevoEstado, id]
            );

            // Registrar auditoría
            await this.registrarAuditoria(
                'CAMBIO_ESTADO_RESERVA',
                'reservas',
                id,
                { estado: reservaActual.estado },
                { estado: nuevoEstado }
            );

            return await this.obtenerPorId(id);

        } catch (error) {
            console.error('Error en ModeloReserva.cambiarEstado:', error.message);
            throw error;
        }
    }
}

module.exports = ModeloReserva;