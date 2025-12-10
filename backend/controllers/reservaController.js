const ModeloReserva = require('../models/Reserva');
const PDFGenerator = require('../utils/pdfGenerator');

class ReservaController {
    
    /**
     * Obtener todas las reservas
     */
    static async obtenerTodas(req, res) {
        try {
            const { 
                pagina = 1, 
                limite = 10, 
                estado, 
                solicitante_id, 
                vehiculo_id,
                fecha_desde,
                fecha_hasta,
                departamento,
                solo_futuras,
                requiere_aprobacion
            } = req.query;

            const filtros = {};
            if (estado) filtros.estado = estado;
            if (solicitante_id) filtros.solicitante_id = solicitante_id;
            if (vehiculo_id) filtros.vehiculo_id = vehiculo_id;
            if (fecha_desde) filtros.fecha_desde = fecha_desde;
            if (fecha_hasta) filtros.fecha_hasta = fecha_hasta;
            if (departamento) filtros.departamento = departamento;
            if (solo_futuras) filtros.solo_futuras = solo_futuras === 'true';
            if (requiere_aprobacion) filtros.requiere_aprobacion = requiere_aprobacion === 'true';

            const resultado = await ModeloReserva.obtenerTodasReservas(pagina, limite, filtros);

            res.json({
                success: true,
                data: resultado
            });

        } catch (error) {
            console.error('Error en ReservaController.obtenerTodas:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Obtener reserva por ID
     */
    static async obtenerPorId(req, res) {
        try {
            const { id } = req.params;

            const reserva = await ModeloReserva.obtenerReservaPorId(id);

            if (!reserva) {
                return res.status(404).json({
                    success: false,
                    message: 'Reserva no encontrada'
                });
            }

            res.json({
                success: true,
                data: reserva
            });

        } catch (error) {
            console.error('Error en ReservaController.obtenerPorId:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Crear nueva reserva
     */
    static async crear(req, res) {
        try {
            // Log temporal para verificar que llega nombre_unidad
            console.log('Datos recibidos para crear reserva:', req.body);
            console.log('nombre_unidad:', req.body.nombre_unidad);

            const reservaData = {
                ...req.body,
                solicitante_id: req.body.solicitante_id || req.usuario.id // Si no se especifica, usar el usuario actual
            };

            const nuevaReserva = await ModeloReserva.crear(reservaData);

            res.status(201).json({
                success: true,
                message: 'Reserva creada exitosamente',
                data: nuevaReserva
            });

        } catch (error) {
            console.error('Error en ReservaController.crear:', error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Aprobar reserva
     */
    static async aprobar(req, res) {
        try {
            const { id } = req.params;
            const { observaciones } = req.body;

            // Verificar permisos (solo administradores)
            if (req.usuario.rol_id !== 1) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para aprobar reservas'
                });
            }

            const reservaAprobada = await ModeloReserva.aprobarReserva(
                id, 
                req.usuario.id, 
                observaciones
            );

            res.json({
                success: true,
                message: 'Reserva aprobada exitosamente',
                data: reservaAprobada
            });

        } catch (error) {
            console.error('Error en ReservaController.aprobar:', error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Rechazar reserva
     */
    static async rechazar(req, res) {
        try {
            const { id } = req.params;
            const { observaciones } = req.body;

            // Verificar permisos (solo administradores)
            if (req.usuario.rol_id !== 1) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para rechazar reservas'
                });
            }

            if (!observaciones) {
                return res.status(400).json({
                    success: false,
                    message: 'Se requieren observaciones para rechazar una reserva'
                });
            }

            const reservaRechazada = await ModeloReserva.rechazarReserva(
                id, 
                req.usuario.id, 
                observaciones
            );

            res.json({
                success: true,
                message: 'Reserva rechazada exitosamente',
                data: reservaRechazada
            });

        } catch (error) {
            console.error('Error en ReservaController.rechazar:', error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Cancelar reserva
     */
    static async cancelar(req, res) {
        try {
            const { id } = req.params;
            const { motivo } = req.body;

            const reservaCancelada = await ModeloReserva.cancelarReserva(
                id, 
                req.usuario.id, 
                motivo
            );

            res.json({
                success: true,
                message: 'Reserva cancelada exitosamente',
                data: reservaCancelada
            });

        } catch (error) {
            console.error('Error en ReservaController.cancelar:', error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Completar reserva
     */
    static async completar(req, res) {
        try {
            const { id } = req.params;
            const { observaciones } = req.body;

            // Verificar permisos (solo administradores y conductores)
            if (req.usuario.rol_id !== 1 && req.usuario.rol_id !== 3) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para completar reservas'
                });
            }

            const reservaCompletada = await ModeloReserva.completarReserva(
                id, 
                req.usuario.id, 
                observaciones
            );

            res.json({
                success: true,
                message: 'Reserva completada exitosamente',
                data: reservaCompletada
            });

        } catch (error) {
            console.error('Error en ReservaController.completar:', error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Verificar disponibilidad
     */
    static async verificarDisponibilidad(req, res) {
        try {
            const { vehiculo_id, fecha, hora_inicio, hora_fin, conductor_id } = req.query;

            if (!vehiculo_id || !fecha || !hora_inicio || !hora_fin) {
                return res.status(400).json({
                    success: false,
                    message: 'Parámetros requeridos: vehiculo_id, fecha, hora_inicio, hora_fin'
                });
            }

            const conflictoVehiculo = await ModeloReserva.verificarDisponibilidadVehiculo(
                vehiculo_id, 
                fecha, 
                hora_inicio, 
                hora_fin
            );

            let conflictoConductor = false;
            if (conductor_id) {
                conflictoConductor = await ModeloReserva.verificarDisponibilidadConductor(
                    conductor_id, 
                    fecha, 
                    hora_inicio, 
                    hora_fin
                );
            }

            res.json({
                success: true,
                data: {
                    disponible: !conflictoVehiculo && !conflictoConductor,
                    conflicto_vehiculo: conflictoVehiculo,
                    conflicto_conductor: conflictoConductor
                }
            });

        } catch (error) {
            console.error('Error en ReservaController.verificarDisponibilidad:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Obtener calendario de disponibilidad
     */
    static async obtenerCalendario(req, res) {
        try {
            const { fecha_inicio, fecha_fin, vehiculo_id } = req.query;

            if (!fecha_inicio || !fecha_fin) {
                return res.status(400).json({
                    success: false,
                    message: 'Parámetros requeridos: fecha_inicio, fecha_fin'
                });
            }

            const calendario = await ModeloReserva.obtenerCalendarioDisponibilidad(
                fecha_inicio, 
                fecha_fin, 
                vehiculo_id
            );

            res.json({
                success: true,
                data: calendario
            });

        } catch (error) {
            console.error('Error en ReservaController.obtenerCalendario:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Obtener reservas próximas
     */
    static async obtenerProximas(req, res) {
        try {
            const { dias = 7 } = req.query;

            const reservas = await ModeloReserva.obtenerReservasProximas(dias);

            res.json({
                success: true,
                data: reservas
            });

        } catch (error) {
            console.error('Error en ReservaController.obtenerProximas:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Obtener estadísticas de reservas
     */
    static async obtenerEstadisticas(req, res) {
        try {
            const { periodo = 'mes' } = req.query;

            const estadisticas = await ModeloReserva.obtenerEstadisticas(periodo);

            res.json({
                success: true,
                data: estadisticas
            });

        } catch (error) {
            console.error('Error en ReservaController.obtenerEstadisticas:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Generar reporte PDF de reservas
     */
    static async generarReportePDF(req, res) {
        try {
            const { fecha_desde, fecha_hasta, estado } = req.query;

            const filtros = {};
            if (fecha_desde) filtros.fecha_desde = fecha_desde;
            if (fecha_hasta) filtros.fecha_hasta = fecha_hasta;
            if (estado) filtros.estado = estado;

            const resultado = await ModeloReserva.obtenerTodasReservas(1, 1000, filtros);
            const reservas = resultado.reservas || [];

            // Métricas avanzadas
            const pendientes = reservas.filter(r => r.estado === 'PENDIENTE').length;
            const aprobadas = reservas.filter(r => r.estado === 'APROBADA').length;
            const rechazadas = reservas.filter(r => r.estado === 'RECHAZADA').length;
            const enCurso = reservas.filter(r => r.estado === 'EN_CURSO').length;
            const completadas = reservas.filter(r => r.estado === 'COMPLETADA').length;
            const canceladas = reservas.filter(r => r.estado === 'CANCELADA').length;
            
            // Tasa de aprobación
            const totalProcesadas = aprobadas + rechazadas;
            const tasaAprobacion = totalProcesadas > 0 ? ((aprobadas / totalProcesadas) * 100).toFixed(1) : 0;

            // Vehículos más solicitados
            const vehiculosCount = {};
            reservas.forEach(r => {
                const key = r.placa || `ID: ${r.vehiculo_id}`;
                vehiculosCount[key] = (vehiculosCount[key] || 0) + 1;
            });
            const topVehiculos = Object.entries(vehiculosCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);

            // Análisis temporal
            const diasReserva = {};
            reservas.forEach(r => {
                const dia = new Date(r.fecha_inicio).toLocaleDateString('es-BO', { weekday: 'long' });
                diasReserva[dia] = (diasReserva[dia] || 0) + 1;
            });

            const doc = PDFGenerator.createDocument();

            // Configurar pie de página automático
            PDFGenerator.setupAutoFooter(doc);

            const subtitle = fecha_desde && fecha_hasta 
                ? `Periodo: ${new Date(fecha_desde).toLocaleDateString('es-BO')} al ${new Date(fecha_hasta).toLocaleDateString('es-BO')}`
                : `Reporte General - ${new Date().toLocaleDateString('es-BO')}`;
            PDFGenerator.addHeader(doc, 'REPORTE DE RESERVAS DE VEHICULOS', subtitle);

            // Estadísticas en cajas
            const stats = [
                { label: 'Total Reservas', value: reservas.length.toString() },
                { label: 'Pendientes', value: pendientes.toString() },
                { label: 'Aprobadas', value: aprobadas.toString() },
                { label: 'En Curso', value: enCurso.toString() },
                { label: 'Completadas', value: completadas.toString() },
                { label: 'Canceladas', value: canceladas.toString() },
                { label: 'Rechazadas', value: rechazadas.toString() },
                { label: 'Tasa Aprobacion', value: `${tasaAprobacion}%` }
            ];
            PDFGenerator.addStatsSection(doc, stats);

            // Gráfico por estado
            const estadosCounts = {};
            reservas.forEach(r => {
                estadosCounts[r.estado] = (estadosCounts[r.estado] || 0) + 1;
            });
            const chartData = Object.entries(estadosCounts).map(([estado, count]) => ({
                label: estado,
                value: count
            }));
            if (chartData.length > 0) {
                PDFGenerator.addBarChart(doc, 'DISTRIBUCION POR ESTADO', chartData);
            }

            // Vehículos más solicitados
            if (topVehiculos.length > 0) {
                doc.fontSize(13)
                   .font('Helvetica-Bold')
                   .fillColor('#1a5490')
                   .text('VEHICULOS MAS SOLICITADOS', 50, doc.y)
                   .fillColor('black')
                   .moveDown(0.5);

                topVehiculos.forEach(([vehiculo, count], index) => {
                    const porcentaje = ((count / reservas.length) * 100).toFixed(1);
                    doc.fontSize(10)
                       .font('Helvetica')
                       .text(`${index + 1}. ${vehiculo}: ${count} reservas (${porcentaje}%)`, 70)
                       .moveDown(0.3);
                });
                doc.moveDown();
            }

            // Análisis por día de la semana
            doc.fontSize(13)
               .font('Helvetica-Bold')
               .fillColor('#1a5490')
               .text('DISTRIBUCION POR DIA DE LA SEMANA', 50, doc.y)
               .fillColor('black')
               .moveDown(0.5);

            Object.entries(diasReserva)
                .sort((a, b) => b[1] - a[1])
                .forEach(([dia, count]) => {
                    doc.fontSize(10)
                       .font('Helvetica')
                       .text(`• ${dia}: ${count} reservas`, 70)
                       .moveDown(0.3);
                });
            doc.moveDown();

            // Tabla detallada
            doc.addPage();
            doc.fontSize(14)
               .font('Helvetica-Bold')
               .fillColor('#1a5490')
               .text('DETALLE DE RESERVAS', 50, 50)
               .fillColor('black')
               .moveDown(1);

            const headers = ['ID', 'Vehiculo', 'Solicitante', 'Unidad', 'Fecha', 'Ruta', 'Estado'];
            const rows = reservas.slice(0, 50).map(r => [
                r.id,
                r.vehiculo?.placa || r.placa || `#${r.vehiculo_id}`,
                (r.solicitante?.nombres || r.solicitante_nombre || 'N/A'),
                r.nombre_unidad || 'Sin especificar',
                new Date(r.fecha_reserva || r.fecha_inicio).toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit' }),
                `${r.origen || ''} → ${r.destino || ''}`,
                r.estado
            ]);

            if (rows.length > 0) {
                const columnWidths = [30, 60, 70, 90, 45, 105, 65];
                PDFGenerator.addTable(doc, headers, rows, { columnWidths, rowHeight: 30 });
            }

            const filename = `reservas_${new Date().getTime()}.pdf`;
            PDFGenerator.sendAsResponse(doc, res, filename);

        } catch (error) {
            console.error('Error en ReservaController.generarReportePDF:', error.message);
            res.status(500).json({ success: false, message: 'Error generando reporte PDF' });
        }
    }

    /**
     * Actualizar reserva
     */
    static async actualizar(req, res) {
        try {
            const { id } = req.params;
            const datosActualizacion = req.body;

            // Verificar permisos (solo admin puede actualizar)
            if (req.usuario.rol_id !== 1) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para actualizar reservas'
                });
            }

            const reservaActualizada = await ModeloReserva.actualizar(id, datosActualizacion);

            res.json({
                success: true,
                message: 'Reserva actualizada exitosamente',
                data: reservaActualizada
            });

        } catch (error) {
            console.error('Error en ReservaController.actualizar:', error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Eliminar reserva
     */
    static async eliminar(req, res) {
        try {
            const { id } = req.params;

            // Verificar permisos (solo admin puede eliminar)
            if (req.usuario.rol_id !== 1) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para eliminar reservas'
                });
            }

            await ModeloReserva.eliminar(id);

            res.json({
                success: true,
                message: 'Reserva eliminada exitosamente'
            });

        } catch (error) {
            console.error('Error en ReservaController.eliminar:', error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Cambiar estado de la reserva
     */
    static async cambiarEstado(req, res) {
        try {
            const { id } = req.params;
            const { estado } = req.body;

            // Verificar permisos (solo admin)
            if (req.usuario.rol_id !== 1) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para cambiar el estado de reservas'
                });
            }

            const reservaActualizada = await ModeloReserva.cambiarEstado(id, estado);

            res.json({
                success: true,
                message: `Reserva ${estado.toLowerCase()} exitosamente`,
                data: reservaActualizada
            });

        } catch (error) {
            console.error('Error en ReservaController.cambiarEstado:', error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = ReservaController;