const ModeloVehiculo = require('../models/Vehiculo');
const PDFGenerator = require('../utils/pdfGenerator');

class VehiculoController {
    
    /**
     * Obtener todos los vehículos
     */
    static async obtenerTodos(req, res) {
        const inicio = Date.now();
        console.log(`[Vehiculos] Iniciando petición: ${req.method} ${req.originalUrl}`);
        
        try {
            const { pagina = 1, limite = 10, estado, marca, tipo_combustible, busqueda } = req.query;

            const filtros = {};
            if (estado) filtros.estado = estado;
            if (marca) filtros.marca = marca;
            if (tipo_combustible) filtros.tipo_combustible = tipo_combustible;
            if (busqueda) filtros.busqueda = busqueda;

            console.log(`[Vehiculos] Llamando modelo con filtros:`, filtros);
            const resultado = await ModeloVehiculo.obtenerTodosVehiculos(pagina, limite, filtros);

            const duracion = Date.now() - inicio;
            console.log(`[Vehiculos] Respuesta enviada en ${duracion}ms`);

            res.json({
                success: true,
                data: resultado
            });

        } catch (error) {
            const duracion = Date.now() - inicio;
            console.error(`[ERROR] [Vehiculos] Error después de ${duracion}ms:`, error.message);
            
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    message: 'Error interno del servidor'
                });
            }
        }
    }

    /**
     * Obtener vehículo por ID
     */
    static async obtenerPorId(req, res) {
        try {
            const { id } = req.params;

            const vehiculo = await ModeloVehiculo.obtenerVehiculoPorId(id);

            if (!vehiculo) {
                return res.status(404).json({
                    success: false,
                    message: 'Vehículo no encontrado'
                });
            }

            res.json({
                success: true,
                data: vehiculo
            });

        } catch (error) {
            console.error('Error en VehiculoController.obtenerPorId:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Crear nuevo vehículo
     */
    static async crear(req, res) {
        try {
            // Verificar permisos (solo administradores y técnicos)
            if (req.usuario.rol_id !== 1 && req.usuario.rol_id !== 2) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para crear vehículos'
                });
            }

            const vehiculoData = req.body;
            const nuevoVehiculo = await ModeloVehiculo.crear(vehiculoData);

            res.status(201).json({
                success: true,
                message: 'Vehículo creado exitosamente',
                data: nuevoVehiculo
            });

        } catch (error) {
            console.error('Error en VehiculoController.crear:', error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Actualizar vehículo
     */
    static async actualizar(req, res) {
        try {
            const { id } = req.params;
            const datosActualizacion = req.body;

            // Verificar permisos (solo administradores y técnicos)
            if (req.usuario.rol_id !== 1 && req.usuario.rol_id !== 2) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para actualizar vehículos'
                });
            }

            const vehiculoActualizado = await ModeloVehiculo.actualizarVehiculo(id, datosActualizacion);

            res.json({
                success: true,
                message: 'Vehículo actualizado exitosamente',
                data: vehiculoActualizado
            });

        } catch (error) {
            console.error('Error en VehiculoController.actualizar:', error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Actualizar kilometraje
     */
    static async actualizarKilometraje(req, res) {
        try {
            const { id } = req.params;
            const { kilometraje } = req.body;

            // Verificar permisos (solo administradores y técnicos)
            if (req.usuario.rol_id !== 1 && req.usuario.rol_id !== 2) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para actualizar kilometraje'
                });
            }

            if (!kilometraje || kilometraje < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Kilometraje debe ser un número positivo'
                });
            }

            const vehiculoActualizado = await ModeloVehiculo.actualizarKilometraje(id, kilometraje);

            res.json({
                success: true,
                message: 'Kilometraje actualizado exitosamente',
                data: vehiculoActualizado
            });

        } catch (error) {
            console.error('Error en VehiculoController.actualizarKilometraje:', error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Obtener vehículos disponibles
     */
    static async obtenerDisponibles(req, res) {
        try {
            const { fecha, hora_inicio, hora_fin } = req.query;

            const vehiculos = await ModeloVehiculo.obtenerVehiculosDisponibles(fecha, hora_inicio, hora_fin);

            res.json({
                success: true,
                data: vehiculos
            });

        } catch (error) {
            console.error('Error en VehiculoController.obtenerDisponibles:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Obtener estadísticas de vehículos
     */
    static async obtenerEstadisticas(req, res) {
        try {
            const estadisticas = await ModeloVehiculo.obtenerEstadisticas();

            res.json({
                success: true,
                data: estadisticas
            });

        } catch (error) {
            console.error('Error en VehiculoController.obtenerEstadisticas:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Generar reporte PDF de vehículos
     */
    static async generarReportePDF(req, res) {
        try {
            const { estado, tipo_combustible } = req.query;

            const filtros = {};
            if (estado) filtros.estado = estado;
            if (tipo_combustible) filtros.tipo_combustible = tipo_combustible;

            const resultado = await ModeloVehiculo.obtenerTodosVehiculos(1, 1000, filtros);
            const vehiculos = resultado.vehiculos || [];

            // Métricas avanzadas
            const disponibles = vehiculos.filter(v => v.estado === 'DISPONIBLE').length;
            const enUso = vehiculos.filter(v => v.estado === 'EN_USO').length;
            const enReparacion = vehiculos.filter(v => v.estado === 'EN_REPARACION').length;
            const inactivos = vehiculos.filter(v => v.estado === 'INACTIVO').length;
            const anioPromedio = vehiculos.length > 0 ? Math.round(vehiculos.reduce((sum, v) => sum + (parseInt(v.anio) || 0), 0) / vehiculos.length) : 0;
            const kmTotal = vehiculos.reduce((sum, v) => sum + (parseFloat(v.kilometraje_actual) || 0), 0);
            const kmPromedio = vehiculos.length > 0 ? Math.round(kmTotal / vehiculos.length) : 0;
            
            // Análisis por tipo de combustible
            const combustibleCounts = {};
            vehiculos.forEach(v => {
                combustibleCounts[v.tipo_combustible || 'N/A'] = (combustibleCounts[v.tipo_combustible || 'N/A'] || 0) + 1;
            });

            // Vehículos más antiguos y nuevos
            const vehiculosConAnio = vehiculos.filter(v => v.anio);
            const masAntiguo = vehiculosConAnio.length > 0 ? Math.min(...vehiculosConAnio.map(v => v.anio)) : 0;
            const masNuevo = vehiculosConAnio.length > 0 ? Math.max(...vehiculosConAnio.map(v => v.anio)) : 0;

            const doc = PDFGenerator.createDocument();

            // Configurar pie de página automático
            PDFGenerator.setupAutoFooter(doc);

            const subtitle = estado || tipo_combustible 
                ? `Filtros aplicados - ${new Date().toLocaleDateString('es-BO')}`
                : `Reporte General de Flota - ${new Date().toLocaleDateString('es-BO')}`;
            PDFGenerator.addHeader(doc, 'REPORTE DE FLOTA VEHICULAR', subtitle);

            // Estadísticas en cajas
            const stats = [
                { label: 'Total Vehículos', value: vehiculos.length.toString() },
                { label: 'Disponibles', value: disponibles.toString() },
                { label: 'En Uso', value: enUso.toString() },
                { label: 'En Reparación', value: enReparacion.toString() },
                { label: 'Inactivos', value: inactivos.toString() },
                { label: 'Año Promedio', value: anioPromedio.toString() },
                { label: 'KM Total Flota', value: kmTotal > 0 ? `${(kmTotal / 1000).toFixed(0)}K` : '0' },
                { label: 'KM Promedio', value: kmPromedio > 0 ? `${(kmPromedio / 1000).toFixed(0)}K` : '0' }
            ];
            PDFGenerator.addStatsSection(doc, stats);

            // Gráfico por estado
            const estadosCounts = {};
            vehiculos.forEach(v => {
                estadosCounts[v.estado] = (estadosCounts[v.estado] || 0) + 1;
            });
            const chartDataEstados = Object.entries(estadosCounts).map(([estado, count]) => ({
                label: estado,
                value: count
            }));
            if (chartDataEstados.length > 0) {
                PDFGenerator.addBarChart(doc, 'DISTRIBUCION POR ESTADO', chartDataEstados);
            }

            // Análisis de combustible
            doc.fontSize(13)
               .font('Helvetica-Bold')
               .fillColor('#1a5490')
               .text('ANALISIS DE COMBUSTIBLE', 50, doc.y)
               .fillColor('black')
               .moveDown(0.5);

            Object.entries(combustibleCounts).forEach(([tipo, count]) => {
                const porcentaje = ((count / vehiculos.length) * 100).toFixed(1);
                doc.fontSize(10)
                   .font('Helvetica')
                   .text(`• ${tipo}: ${count} vehiculos (${porcentaje}%)`, 70)
                   .moveDown(0.3);
            });
            doc.moveDown();

            // Análisis de antigüedad
            doc.fontSize(13)
               .font('Helvetica-Bold')
               .fillColor('#1a5490')
               .text('ANALISIS DE ANTIGUEDAD', 50, doc.y)
               .fillColor('black')
               .moveDown(0.5);

            doc.fontSize(10)
               .font('Helvetica')
               .text(`• Vehiculo mas antiguo: ${masAntiguo}`, 70)
               .moveDown(0.3)
               .text(`• Vehiculo mas reciente: ${masNuevo}`, 70)
               .moveDown(0.3)
               .text(`• Promedio de edad: ${new Date().getFullYear() - anioPromedio} años`, 70)
               .moveDown(1);

            // Tabla detallada
            doc.addPage();
            doc.fontSize(14)
               .font('Helvetica-Bold')
               .fillColor('#1a5490')
               .text('DETALLE DE VEHICULOS', 50, 50)
               .fillColor('black')
               .moveDown(1);

            const headers = ['Placa', 'Marca/Modelo', 'Año', 'Estado', 'Combustible', 'KM'];
            const rows = vehiculos.slice(0, 50).map(v => [
                v.placa,
                `${v.marca} ${v.modelo}`.substring(0, 18),
                v.anio || v.año || 'N/A',
                v.estado.substring(0, 12),
                (v.tipo_combustible || 'N/A').substring(0, 10),
                `${((v.kilometraje_actual || 0) / 1000).toFixed(0)}K`
            ]);

            if (rows.length > 0) {
                PDFGenerator.addTable(doc, headers, rows, { columnWidth: 85, rowHeight: 22 });
            }

            const filename = `vehiculos_${new Date().getTime()}.pdf`;
            PDFGenerator.sendAsResponse(doc, res, filename);

        } catch (error) {
            console.error('Error en VehiculoController.generarReportePDF:', error.message);
            res.status(500).json({ success: false, message: 'Error generando reporte PDF' });
        }
    }

    /**
     * Eliminar vehículo
     */
    static async eliminar(req, res) {
        try {
            const { id } = req.params;

            // Verificar permisos (solo administradores)
            if (req.usuario.rol_id !== 1 && req.usuario.rol !== 'ADMINISTRADOR') {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para eliminar vehículos'
                });
            }

            await ModeloVehiculo.eliminar(id);

            res.json({
                success: true,
                message: 'Vehículo eliminado exitosamente'
            });

        } catch (error) {
            console.error('Error en VehiculoController.eliminar:', error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = VehiculoController;