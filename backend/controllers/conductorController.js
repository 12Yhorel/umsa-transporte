const ModeloConductor = require('../models/Conductor');

class ConductorController {
    
    /**
     * Obtener todos los conductores
     */
    static async obtenerTodos(req, res) {
        const inicio = Date.now();
        console.log(`[Conductores] Iniciando petición: ${req.method} ${req.originalUrl}`);
        
        try {
            const { pagina = 1, limite = 10, estado, busqueda } = req.query;

            const filtros = {};
            // Mapear 'estado' a 'habilitado'
            if (estado === 'ACTIVO') filtros.habilitado = true;
            else if (estado === 'INACTIVO') filtros.habilitado = false;
            if (busqueda) filtros.busqueda = busqueda;

            console.log(`[Conductores] Llamando modelo con filtros:`, filtros);
            const resultado = await ModeloConductor.obtenerTodosConductores(pagina, limite, filtros);

            const duracion = Date.now() - inicio;
            console.log(`[Conductores] Respuesta enviada en ${duracion}ms`);

            res.json({
                success: true,
                data: resultado
            });

        } catch (error) {
            const duracion = Date.now() - inicio;
            console.error(`[ERROR] [Conductores] Error después de ${duracion}ms:`, error.message);
            
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    message: 'Error interno del servidor'
                });
            }
        }
    }

    /**
     * Obtener conductor por ID
     */
    static async obtenerPorId(req, res) {
        try {
            const { id } = req.params;

            const conductor = await ModeloConductor.obtenerConductorPorId(id);

            if (!conductor) {
                return res.status(404).json({
                    success: false,
                    message: 'Conductor no encontrado'
                });
            }

            res.json({
                success: true,
                data: conductor
            });

        } catch (error) {
            console.error('Error en ConductorController.obtenerPorId:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Crear nuevo conductor
     */
    static async crear(req, res) {
        try {
            // Verificar permisos (solo administradores)
            if (req.usuario.rol_id !== 1) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para crear conductores'
                });
            }

            const conductorData = req.body;
            const nuevoConductor = await ModeloConductor.crear(conductorData);

            res.status(201).json({
                success: true,
                message: 'Conductor creado exitosamente',
                data: nuevoConductor
            });

        } catch (error) {
            console.error('Error en ConductorController.crear:', error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Actualizar conductor
     */
    static async actualizar(req, res) {
        try {
            const { id } = req.params;
            const datosActualizacion = req.body;

            // Verificar permisos (solo administradores)
            if (req.usuario.rol_id !== 1) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para actualizar conductores'
                });
            }

            const conductorActualizado = await ModeloConductor.actualizarConductor(id, datosActualizacion);

            res.json({
                success: true,
                message: 'Conductor actualizado exitosamente',
                data: conductorActualizado
            });

        } catch (error) {
            console.error('Error en ConductorController.actualizar:', error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Habilitar conductor
     */
    static async habilitar(req, res) {
        try {
            const { id } = req.params;

            // Verificar permisos (solo administradores)
            if (req.usuario.rol_id !== 1) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para habilitar conductores'
                });
            }

            await ModeloConductor.habilitar(id);

            res.json({
                success: true,
                message: 'Conductor habilitado exitosamente'
            });

        } catch (error) {
            console.error('Error en ConductorController.habilitar:', error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Deshabilitar conductor
     */
    static async deshabilitar(req, res) {
        try {
            const { id } = req.params;

            // Verificar permisos (solo administradores)
            if (req.usuario.rol_id !== 1) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para deshabilitar conductores'
                });
            }

            await ModeloConductor.deshabilitar(id);

            res.json({
                success: true,
                message: 'Conductor deshabilitado exitosamente'
            });

        } catch (error) {
            console.error('Error en ConductorController.deshabilitar:', error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Cambiar habilitación del conductor (habilitar/deshabilitar)
     */
    static async cambiarHabilitacion(req, res) {
        try {
            const { id } = req.params;
            const { habilitado } = req.body;

            // Verificar permisos (solo administradores)
            if (req.usuario.rol_id !== 1) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para cambiar la habilitación de conductores'
                });
            }

            if (typeof habilitado !== 'boolean') {
                return res.status(400).json({
                    success: false,
                    message: 'El campo habilitado debe ser booleano'
                });
            }

            if (habilitado) {
                await ModeloConductor.habilitar(id);
            } else {
                await ModeloConductor.deshabilitar(id);
            }

            const conductor = await ModeloConductor.obtenerPorId(id);

            res.json({
                success: true,
                message: `Conductor ${habilitado ? 'habilitado' : 'deshabilitado'} exitosamente`,
                data: conductor
            });

        } catch (error) {
            console.error('Error en ConductorController.cambiarHabilitacion:', error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Obtener conductores disponibles
     */
    static async obtenerDisponibles(req, res) {
        try {
            const { fecha, hora_inicio, hora_fin } = req.query;

            const conductores = await ModeloConductor.obtenerConductoresDisponibles(fecha, hora_inicio, hora_fin);

            res.json({
                success: true,
                data: conductores
            });

        } catch (error) {
            console.error('Error en ConductorController.obtenerDisponibles:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Obtener alertas de vencimiento
     */
    static async obtenerAlertasVencimiento(req, res) {
        try {
            const { dias = 30 } = req.query;

            const alertas = await ModeloConductor.obtenerAlertasVencimiento(dias);

            res.json({
                success: true,
                data: alertas
            });

        } catch (error) {
            console.error('Error en ConductorController.obtenerAlertasVencimiento:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Obtener estadísticas de conductores
     */
    static async obtenerEstadisticas(req, res) {
        try {
            const estadisticas = await ModeloConductor.obtenerEstadisticas();

            res.json({
                success: true,
                data: estadisticas
            });

        } catch (error) {
            console.error('Error en ConductorController.obtenerEstadisticas:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Generar reporte PDF de conductores
     */
    static async generarReportePDF(req, res) {
        try {
            const PDFGenerator = require('../utils/pdfGenerator');
            const { habilitado } = req.query;

            const filtros = {};
            if (habilitado) filtros.habilitado = habilitado === 'true';

            const resultado = await ModeloConductor.obtenerTodosConductores(1, 1000, filtros);
            const conductores = resultado.conductores || [];

            // Métricas avanzadas
            const habilitadosCount = conductores.filter(c => c.habilitado === true || c.habilitado === 1).length;
            const noHabilitadosCount = conductores.filter(c => c.habilitado === false || c.habilitado === 0).length;
            
            // Análisis de licencias
            const licenciaCounts = {};
            conductores.forEach(c => {
                const cat = c.licencia_categoria || 'N/A';
                licenciaCounts[cat] = (licenciaCounts[cat] || 0) + 1;
            });

            // Licencias próximas a vencer (30 días)
            const hoy = new Date();
            const proximasVencer = conductores.filter(c => {
                if (!c.licencia_vencimiento) return false;
                const vencimiento = new Date(c.licencia_vencimiento);
                const diasRestantes = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24));
                return diasRestantes > 0 && diasRestantes <= 30;
            });

            // Licencias vencidas
            const vencidas = conductores.filter(c => {
                if (!c.licencia_vencimiento) return false;
                const vencimiento = new Date(c.licencia_vencimiento);
                return vencimiento < hoy;
            });

            // Conductores con más antigüedad
            const conductoresConFecha = conductores.filter(c => c.created_at);
            conductoresConFecha.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            const masAntiguos = conductoresConFecha.slice(0, 5);

            const doc = PDFGenerator.createDocument();

            // Configurar pie de página automático
            PDFGenerator.setupAutoFooter(doc);

            const subtitle = habilitado !== undefined
                ? `Filtro: ${habilitado === 'true' ? 'Habilitados' : 'No Habilitados'} - ${new Date().toLocaleDateString('es-BO')}`
                : `Reporte General - ${new Date().toLocaleDateString('es-BO')}`;
            PDFGenerator.addHeader(doc, 'REPORTE DE CONDUCTORES', subtitle);

            // Estadísticas en cajas
            const stats = [
                { label: 'Total Conductores', value: conductores.length.toString() },
                { label: 'Habilitados', value: habilitadosCount.toString() },
                { label: 'No Habilitados', value: noHabilitadosCount.toString() },
                { label: 'Lic. Categoria A', value: (licenciaCounts['A'] || 0).toString() },
                { label: 'Lic. Categoria B', value: (licenciaCounts['B'] || 0).toString() },
                { label: 'Lic. Categoria C', value: (licenciaCounts['C'] || 0).toString() },
                { label: 'Proximas Vencer', value: proximasVencer.length.toString() },
                { label: 'Lic. Vencidas', value: vencidas.length.toString() }
            ];
            PDFGenerator.addStatsSection(doc, stats);

            // Gráfico por categoría de licencia
            const chartData = Object.entries(licenciaCounts).map(([cat, count]) => ({
                label: `Categoria ${cat}`,
                value: count
            }));
            if (chartData.length > 0) {
                PDFGenerator.addBarChart(doc, 'DISTRIBUCION POR CATEGORIA DE LICENCIA', chartData);
            }

            // Alertas de licencias
            if (vencidas.length > 0 || proximasVencer.length > 0) {
                doc.fontSize(13)
                   .font('Helvetica-Bold')
                   .fillColor('#e74c3c')
                   .text('ALERTAS DE LICENCIAS', 50, doc.y)
                   .fillColor('black')
                   .moveDown(0.5);

                if (vencidas.length > 0) {
                    doc.fontSize(10)
                       .font('Helvetica-Bold')
                       .fillColor('#c0392b')
                       .text(`CRITICO: ${vencidas.length} licencias VENCIDAS`, 70)
                       .fillColor('black')
                       .moveDown(0.3);

                    vencidas.slice(0, 5).forEach(c => {
                        doc.fontSize(9)
                           .font('Helvetica')
                           .text(`  • ${c.nombres} ${c.apellidos} - Vencio: ${new Date(c.licencia_vencimiento).toLocaleDateString('es-BO')}`, 90)
                           .moveDown(0.2);
                    });
                    doc.moveDown(0.3);
                }

                if (proximasVencer.length > 0) {
                    doc.fontSize(10)
                       .font('Helvetica-Bold')
                       .fillColor('#e67e22')
                       .text(`ATENCION: ${proximasVencer.length} licencias por vencer en 30 dias`, 70)
                       .fillColor('black')
                       .moveDown(0.3);

                    proximasVencer.slice(0, 5).forEach(c => {
                        const diasRestantes = Math.ceil((new Date(c.licencia_vencimiento) - hoy) / (1000 * 60 * 60 * 24));
                        doc.fontSize(9)
                           .font('Helvetica')
                           .text(`  • ${c.nombres} ${c.apellidos} - Vence en ${diasRestantes} dias`, 90)
                           .moveDown(0.2);
                    });
                }
                doc.moveDown();
            }

            // Conductores más antiguos
            if (masAntiguos.length > 0) {
                doc.fontSize(13)
                   .font('Helvetica-Bold')
                   .fillColor('#1a5490')
                   .text('CONDUCTORES CON MAS ANTIGUEDAD', 50, doc.y)
                   .fillColor('black')
                   .moveDown(0.5);

                masAntiguos.forEach((c, index) => {
                    const antiguedad = Math.floor((hoy - new Date(c.created_at)) / (1000 * 60 * 60 * 24 * 365));
                    doc.fontSize(10)
                       .font('Helvetica')
                       .text(`${index + 1}. ${c.nombres} ${c.apellidos} - ${antiguedad} años en servicio`, 70)
                       .moveDown(0.3);
                });
                doc.moveDown();
            }

            // Tabla detallada
            doc.addPage();
            doc.fontSize(14)
               .font('Helvetica-Bold')
               .fillColor('#1a5490')
               .text('DETALLE DE CONDUCTORES', 50, 50)
               .fillColor('black')
               .moveDown(1);

            const headers = ['Nombre', 'Licencia', 'Cat.', 'Vencimiento', 'Habilitado', 'Telefono'];
            const rows = conductores.slice(0, 50).map(c => [
                `${c.nombres} ${c.apellidos}`.substring(0, 20),
                (c.licencia_numero || 'N/A').substring(0, 12),
                c.licencia_categoria || 'N/A',
                c.licencia_vencimiento ? new Date(c.licencia_vencimiento).toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: '2-digit' }) : 'N/A',
                c.habilitado ? 'SI' : 'NO',
                (c.telefono || 'N/A').substring(0, 12)
            ]);

            if (rows.length > 0) {
                PDFGenerator.addTable(doc, headers, rows, { columnWidth: 85, rowHeight: 22 });
            }

            const filename = `conductores_${new Date().getTime()}.pdf`;
            PDFGenerator.sendAsResponse(doc, res, filename);

        } catch (error) {
            console.error('Error en ConductorController.generarReportePDF:', error.message);
            res.status(500).json({ success: false, message: 'Error generando reporte PDF' });
        }
    }

    /**
     * Eliminar conductor
     */
    static async eliminar(req, res) {
        try {
            const { id } = req.params;

            // Verificar permisos (solo administradores)
            if (req.usuario.rol_id !== 1) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para eliminar conductores'
                });
            }

            console.log(`[Conductores] Eliminando conductor ID: ${id} por usuario ${req.usuario.id}`);

            const resultado = await ModeloConductor.eliminar(id, req.usuario.id);

            res.json({
                success: true,
                message: resultado.message
            });

        } catch (error) {
            console.error('Error en ConductorController.eliminar:', error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = ConductorController;