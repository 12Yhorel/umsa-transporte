const ModeloReparacion = require('../models/Reparacion');
const PDFGenerator = require('../utils/pdfGenerator');

class ReparacionController {
    
    /**
     * Obtener todas las reparaciones
     */
    static async obtenerTodas(req, res) {
        try {
            const { 
                pagina = 1, 
                limite = 10, 
                estado, 
                vehiculo_id, 
                tecnico_id,
                fecha_desde,
                fecha_hasta,
                con_repuestos
            } = req.query;

            const filtros = {};
            if (estado) filtros.estado = estado;
            if (vehiculo_id) filtros.vehiculo_id = vehiculo_id;
            if (tecnico_id) filtros.tecnico_id = tecnico_id;
            if (fecha_desde) filtros.fecha_desde = fecha_desde;
            if (fecha_hasta) filtros.fecha_hasta = fecha_hasta;
            if (con_repuestos) filtros.con_repuestos = con_repuestos === 'true';

            const resultado = await ModeloReparacion.obtenerTodasReparaciones(pagina, limite, filtros);

            res.json({
                success: true,
                data: resultado
            });

        } catch (error) {
            console.error('Error en ReparacionController.obtenerTodas:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Obtener reparación por ID
     */
    static async obtenerPorId(req, res) {
        try {
            const { id } = req.params;

            const reparacion = await ModeloReparacion.obtenerReparacionPorId(id);

            if (!reparacion) {
                return res.status(404).json({
                    success: false,
                    message: 'Reparación no encontrada'
                });
            }

            res.json({
                success: true,
                data: reparacion
            });

        } catch (error) {
            console.error('Error en ReparacionController.obtenerPorId:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Crear nueva reparación
     */
    static async crear(req, res) {
        try {
            // Verificar permisos (solo administradores y técnicos)
            if (req.usuario.rol_id !== 1 && req.usuario.rol_id !== 2) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para crear reparaciones'
                });
            }

            console.log('[DEBUG] ReparacionController.crear - req.body:', req.body);

            const reparacionData = {
                ...req.body,
                tecnico_id: req.body.tecnico_id || req.usuario.id // Si no se especifica, usar el usuario actual
            };

            console.log('[DEBUG] ReparacionController.crear - reparacionData:', reparacionData);

            const nuevaReparacion = await ModeloReparacion.crear(reparacionData);

            res.status(201).json({
                success: true,
                message: 'Reparación creada exitosamente',
                data: nuevaReparacion
            });

        } catch (error) {
            console.error('Error en ReparacionController.crear:', error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Actualizar reparación
     */
    static async actualizar(req, res) {
        try {
            const { id } = req.params;

            // Verificar permisos (solo administradores y técnicos)
            if (req.usuario.rol_id !== 1 && req.usuario.rol_id !== 2) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para actualizar reparaciones'
                });
            }

            console.log('[DEBUG] ReparacionController.actualizar - ID:', id);
            console.log('[DEBUG] ReparacionController.actualizar - req.body:', req.body);

            const reparacionActualizada = await ModeloReparacion.actualizar(id, req.body);

            res.json({
                success: true,
                message: 'Reparación actualizada exitosamente',
                data: reparacionActualizada
            });

        } catch (error) {
            console.error('Error en ReparacionController.actualizar:', error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Eliminar reparación
     */
    static async eliminar(req, res) {
        try {
            const { id } = req.params;

            // Verificar permisos (solo administradores)
            if (req.usuario.rol_id !== 1) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para eliminar reparaciones'
                });
            }

            console.log('[DEBUG] ReparacionController.eliminar - ID:', id);

            const resultado = await ModeloReparacion.eliminar(id);

            res.json({
                success: true,
                message: resultado.message
            });

        } catch (error) {
            console.error('Error en ReparacionController.eliminar:', error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Actualizar estado de reparación
     */
    static async actualizarEstado(req, res) {
        try {
            const { id } = req.params;
            const { estado, observaciones, fecha_real_entrega } = req.body;

            // Verificar permisos (solo administradores y técnicos)
            if (req.usuario.rol_id !== 1 && req.usuario.rol_id !== 2) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para actualizar estados de reparación'
                });
            }

            const reparacionActualizada = await ModeloReparacion.actualizarEstado(
                id, 
                estado, 
                req.usuario.id,
                observaciones,
                fecha_real_entrega
            );

            res.json({
                success: true,
                message: 'Estado de reparación actualizado exitosamente',
                data: reparacionActualizada
            });

        } catch (error) {
            console.error('Error en ReparacionController.actualizarEstado:', error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Actualizar diagnóstico
     */
    static async actualizarDiagnostico(req, res) {
        try {
            const { id } = req.params;
            const { diagnostico } = req.body;

            // Verificar permisos (solo administradores y técnicos)
            if (req.usuario.rol_id !== 1 && req.usuario.rol_id !== 2) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para actualizar diagnósticos'
                });
            }

            const reparacionActualizada = await ModeloReparacion.actualizarDiagnostico(
                id, 
                diagnostico, 
                req.usuario.id
            );

            res.json({
                success: true,
                message: 'Diagnóstico actualizado exitosamente',
                data: reparacionActualizada
            });

        } catch (error) {
            console.error('Error en ReparacionController.actualizarDiagnostico:', error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Agregar repuesto a reparación
     */
    static async agregarRepuesto(req, res) {
        try {
            const { id } = req.params;
            const repuestoData = req.body;

            // Verificar permisos (solo administradores y técnicos)
            if (req.usuario.rol_id !== 1 && req.usuario.rol_id !== 2) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para agregar repuestos a reparaciones'
                });
            }

            const repuestoAgregado = await ModeloReparacion.agregarRepuesto(
                id, 
                repuestoData, 
                req.usuario.id
            );

            res.status(201).json({
                success: true,
                message: 'Repuesto agregado exitosamente',
                data: repuestoAgregado
            });

        } catch (error) {
            console.error('Error en ReparacionController.agregarRepuesto:', error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Remover repuesto de reparación
     */
    static async removerRepuesto(req, res) {
        try {
            const { id, consumo_id } = req.params;

            // Verificar permisos (solo administradores y técnicos)
            if (req.usuario.rol_id !== 1 && req.usuario.rol_id !== 2) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para remover repuestos de reparaciones'
                });
            }

            const resultado = await ModeloReparacion.removerRepuesto(
                consumo_id, 
                req.usuario.id
            );

            res.json({
                success: true,
                message: 'Repuesto removido exitosamente',
                data: resultado
            });

        } catch (error) {
            console.error('Error en ReparacionController.removerRepuesto:', error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Obtener repuestos utilizados
     */
    static async obtenerRepuestosUtilizados(req, res) {
        try {
            const { id } = req.params;

            const repuestos = await ModeloReparacion.obtenerRepuestosUtilizados(id);

            res.json({
                success: true,
                data: repuestos
            });

        } catch (error) {
            console.error('Error en ReparacionController.obtenerRepuestosUtilizados:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Obtener historial por vehículo
     */
    static async obtenerHistorialPorVehiculo(req, res) {
        try {
            const { vehiculo_id } = req.params;
            const { limite = 20 } = req.query;

            const historial = await ModeloReparacion.obtenerHistorialPorVehiculo(vehiculo_id, limite);

            res.json({
                success: true,
                data: historial
            });

        } catch (error) {
            console.error('Error en ReparacionController.obtenerHistorialPorVehiculo:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Obtener reparaciones activas
     */
    static async obtenerReparacionesActivas(req, res) {
        try {
            const reparaciones = await ModeloReparacion.obtenerReparacionesActivas();

            res.json({
                success: true,
                data: reparaciones
            });

        } catch (error) {
            console.error('Error en ReparacionController.obtenerReparacionesActivas:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Obtener próximas entregas
     */
    static async obtenerProximasEntregas(req, res) {
        try {
            const { dias = 7 } = req.query;

            const reparaciones = await ModeloReparacion.obtenerProximasEntregas(dias);

            res.json({
                success: true,
                data: reparaciones
            });

        } catch (error) {
            console.error('Error en ReparacionController.obtenerProximasEntregas:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Obtener estadísticas de reparaciones
     */
    static async obtenerEstadisticas(req, res) {
        try {
            const { periodo = 'mes' } = req.query;

            const estadisticas = await ModeloReparacion.obtenerEstadisticas(periodo);

            res.json({
                success: true,
                data: estadisticas
            });

        } catch (error) {
            console.error('Error en ReparacionController.obtenerEstadisticas:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Generar reporte PDF de reparaciones
     */
    static async generarReportePDF(req, res) {
        try {
            const { fecha_desde, fecha_hasta, estado } = req.query;

            // Obtener datos para el reporte
            const filtros = {};
            if (fecha_desde) filtros.fecha_desde = fecha_desde;
            if (fecha_hasta) filtros.fecha_hasta = fecha_hasta;
            if (estado) filtros.estado = estado;

            const resultado = await ModeloReparacion.obtenerTodasReparaciones(1, 1000, filtros);
            const estadisticas = await ModeloReparacion.obtenerEstadisticas('mes');
            const reparaciones = resultado.reparaciones || [];

            // Calcular métricas avanzadas
            const costoTotal = reparaciones.reduce((sum, r) => sum + (parseFloat(r.costo_total) || 0), 0);
            const enProceso = reparaciones.filter(r => ['RECIBIDO', 'DIAGNOSTICO', 'EN_REPARACION'].includes(r.estado)).length;
            const terminadas = reparaciones.filter(r => r.estado === 'TERMINADO').length;
            const entregadas = reparaciones.filter(r => r.estado === 'ENTREGADO').length;
            const promedioCosto = reparaciones.length > 0 ? costoTotal / reparaciones.length : 0;
            
            // Calcular tiempo promedio de reparación
            const reparacionesCompletadas = reparaciones.filter(r => r.fecha_real_entrega);
            const tiempoPromedio = reparacionesCompletadas.length > 0 
                ? reparacionesCompletadas.reduce((sum, r) => {
                    const dias = Math.ceil((new Date(r.fecha_real_entrega) - new Date(r.fecha_recepcion)) / (1000 * 60 * 60 * 24));
                    return sum + dias;
                }, 0) / reparacionesCompletadas.length
                : 0;

            // Vehículos más reparados
            const vehiculosCount = {};
            reparaciones.forEach(r => {
                const key = r.placa || `ID: ${r.vehiculo_id}`;
                vehiculosCount[key] = (vehiculosCount[key] || 0) + 1;
            });
            const topVehiculos = Object.entries(vehiculosCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);

            // Crear documento PDF
            const doc = PDFGenerator.createDocument();

            // Configurar pie de página automático
            PDFGenerator.setupAutoFooter(doc);

            // Encabezado
            const subtitle = fecha_desde && fecha_hasta 
                ? `Período: ${new Date(fecha_desde).toLocaleDateString('es-BO')} al ${new Date(fecha_hasta).toLocaleDateString('es-BO')}`
                : `Reporte General - ${new Date().toLocaleDateString('es-BO')}`;
            PDFGenerator.addHeader(doc, 'REPORTE DE REPARACIONES Y MANTENIMIENTO', subtitle);

            // Estadísticas generales en cajas
            const stats = [
                { label: 'Total Reparaciones', value: reparaciones.length.toString() },
                { label: 'Inversión Total', value: `Bs ${costoTotal.toFixed(2)}` },
                { label: 'En Proceso', value: enProceso.toString() },
                { label: 'Terminadas', value: terminadas.toString() },
                { label: 'Entregadas', value: entregadas.toString() },
                { label: 'Costo Promedio', value: `Bs ${promedioCosto.toFixed(2)}` },
                { label: 'Tiempo Promedio', value: `${tiempoPromedio.toFixed(1)} días` },
                { label: 'Vehículos Únicos', value: Object.keys(vehiculosCount).length.toString() }
            ];
            PDFGenerator.addStatsSection(doc, stats);

            // Gráfico de estados
            const estadosCounts = {};
            reparaciones.forEach(r => {
                estadosCounts[r.estado] = (estadosCounts[r.estado] || 0) + 1;
            });
            const chartData = Object.entries(estadosCounts).map(([estado, count]) => ({
                label: estado,
                value: count
            }));
            if (chartData.length > 0) {
                PDFGenerator.addBarChart(doc, 'DISTRIBUCION POR ESTADO', chartData);
            }

            // Sección: Vehículos más reparados
            if (topVehiculos.length > 0) {
                doc.fontSize(13)
                   .font('Helvetica-Bold')
                   .fillColor('#1a5490')
                   .text('VEHICULOS CON MAS REPARACIONES', 50, doc.y)
                   .fillColor('black')
                   .moveDown(0.5);

                topVehiculos.forEach(([vehiculo, count], index) => {
                    doc.fontSize(10)
                       .font('Helvetica')
                       .text(`${index + 1}. ${vehiculo}: ${count} reparaciones`, 70)
                       .moveDown(0.3);
                });
                doc.moveDown();
            }

            // Análisis de costos
            doc.fontSize(13)
               .font('Helvetica-Bold')
               .fillColor('#1a5490')
               .text('ANALISIS DE COSTOS', 50, doc.y)
               .fillColor('black')
               .moveDown(0.5);

            const reparacionesCostosas = reparaciones
                .filter(r => parseFloat(r.costo_total) > 0)
                .sort((a, b) => parseFloat(b.costo_total) - parseFloat(a.costo_total))
                .slice(0, 5);

            doc.fontSize(10)
               .font('Helvetica')
               .text(`• Reparación más costosa: Bs ${reparacionesCostosas[0] ? parseFloat(reparacionesCostosas[0].costo_total).toFixed(2) : '0.00'}`, 70)
               .moveDown(0.3)
               .text(`• Reparación más económica: Bs ${reparaciones.filter(r => parseFloat(r.costo_total) > 0).sort((a, b) => parseFloat(a.costo_total) - parseFloat(b.costo_total))[0] ? parseFloat(reparaciones.filter(r => parseFloat(r.costo_total) > 0).sort((a, b) => parseFloat(a.costo_total) - parseFloat(b.costo_total))[0].costo_total).toFixed(2) : '0.00'}`, 70)
               .moveDown(0.3)
               .text(`• Desviación del promedio: Bs ${(Math.sqrt(reparaciones.reduce((sum, r) => sum + Math.pow((parseFloat(r.costo_total) || 0) - promedioCosto, 2), 0) / (reparaciones.length || 1))).toFixed(2)}`, 70)
               .moveDown(1);

            // Nueva página para tabla detallada
            doc.addPage();
            doc.fontSize(14)
               .font('Helvetica-Bold')
               .fillColor('#1a5490')
               .text('DETALLE DE REPARACIONES', 50, 50)
               .fillColor('black')
               .moveDown(1);

            const headers = ['ID', 'Vehículo', 'Técnico', 'Estado', 'Costo (Bs)', 'Recepción', 'Entrega'];
            const rows = reparaciones.slice(0, 50).map(r => [
                r.id.toString(),
                (r.placa || `#${r.vehiculo_id}`),
                (r.tecnico_nombre || 'N/A'),
                r.estado,
                (parseFloat(r.costo_total) || 0).toFixed(2),
                new Date(r.fecha_recepcion).toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: '2-digit' }),
                r.fecha_real_entrega ? new Date(r.fecha_real_entrega).toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: '2-digit' }) : 'Pendiente'
            ]);

            if (rows.length > 0) {
                PDFGenerator.addTable(doc, headers, rows, { 
                    columnWidth: 70, 
                    rowHeight: 25,
                    fontSize: 9
                });
            }

            // Enviar PDF
            const filename = `reparaciones_${new Date().getTime()}.pdf`;
            PDFGenerator.sendAsResponse(doc, res, filename);

        } catch (error) {
            console.error('Error en ReparacionController.generarReportePDF:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error generando reporte PDF'
            });
        }
    }
}

module.exports = ReparacionController;