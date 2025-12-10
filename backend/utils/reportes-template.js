// Métodos de reporte PDF para agregar a los controladores

// RESERVAS CONTROLLER
/**
 * Generar reporte PDF de reservas
 */
static async generarReportePDF(req, res) {
    try {
        const { fecha_desde, fecha_hasta, estado } = req.query;
        const PDFGenerator = require('../utils/pdfGenerator');
        const ModeloReserva = require('../models/Reserva');

        const filtros = {};
        if (fecha_desde) filtros.fecha_desde = fecha_desde;
        if (fecha_hasta) filtros.fecha_hasta = fecha_hasta;
        if (estado) filtros.estado = estado;

        const resultado = await ModeloReserva.obtenerTodasReservas(1, 1000, filtros);
        const reservas = resultado.reservas || [];

        const doc = PDFGenerator.createDocument();

        const subtitle = fecha_desde && fecha_hasta 
            ? `Período: ${fecha_desde} al ${fecha_hasta}`
            : 'Todas las reservas';
        PDFGenerator.addHeader(doc, 'Reporte de Reservas', subtitle);

        const stats = [
            { label: 'Total de Reservas', value: reservas.length },
            { label: 'Aprobadas', value: reservas.filter(r => r.estado === 'APROBADA').length },
            { label: 'Pendientes', value: reservas.filter(r => r.estado === 'PENDIENTE').length },
            { label: 'Completadas', value: reservas.filter(r => r.estado === 'COMPLETADA').length },
            { label: 'Canceladas', value: reservas.filter(r => r.estado === 'CANCELADA').length }
        ];
        PDFGenerator.addStatsSection(doc, stats);

        const estadosCounts = {};
        reservas.forEach(r => {
            estadosCounts[r.estado] = (estadosCounts[r.estado] || 0) + 1;
        });
        const chartData = Object.entries(estadosCounts).map(([estado, count]) => ({
            label: estado,
            value: count
        }));
        if (chartData.length > 0) {
            PDFGenerator.addBarChart(doc, 'Reservas por Estado', chartData);
        }

        doc.addPage();
        doc.fontSize(12).font('Helvetica-Bold').text('Detalle de Reservas', { underline: true }).moveDown(0.5);

        const headers = ['ID', 'Vehículo', 'Solicitante', 'Fecha', 'Estado', 'Conductor'];
        const rows = reservas.slice(0, 50).map(r => [
            r.id,
            r.placa || `ID: ${r.vehiculo_id}`,
            r.solicitante_nombre || 'N/A',
            new Date(r.fecha_inicio).toLocaleDateString('es-BO'),
            r.estado,
            r.conductor_nombre || 'N/A'
        ]);

        if (rows.length > 0) {
            PDFGenerator.addTable(doc, headers, rows, { columnWidth: 85 });
        }

        PDFGenerator.addFooter(doc, 1);

        const filename = `reservas_${new Date().getTime()}.pdf`;
        PDFGenerator.sendAsResponse(doc, res, filename);

    } catch (error) {
        console.error('Error en ReservaController.generarReportePDF:', error.message);
        res.status(500).json({ success: false, message: 'Error generando reporte PDF' });
    }
}

// INVENTARIO CONTROLLER
/**
 * Generar reporte PDF de inventario
 */
static async generarReportePDF(req, res) {
    try {
        const { categoria, stock_minimo } = req.query;
        const PDFGenerator = require('../utils/pdfGenerator');
        const ModeloInventario = require('../models/Inventario');

        const filtros = {};
        if (categoria) filtros.categoria = categoria;
        if (stock_minimo) filtros.stock_minimo = stock_minimo;

        const resultado = await ModeloInventario.obtenerTodosItems(1, 1000, filtros);
        const items = resultado.items || [];

        const doc = PDFGenerator.createDocument();

        PDFGenerator.addHeader(doc, 'Reporte de Inventario', 'Control de Repuestos y Materiales');

        const valorTotal = items.reduce((sum, i) => sum + (i.cantidad_disponible * (parseFloat(i.precio_unitario) || 0)), 0);
        const stats = [
            { label: 'Total de Items', value: items.length },
            { label: 'Valor Total Inventario', value: `Bs ${valorTotal.toFixed(2)}` },
            { label: 'Items con Stock Bajo', value: items.filter(i => i.cantidad_disponible <= i.stock_minimo).length },
            { label: 'Items Agotados', value: items.filter(i => i.cantidad_disponible === 0).length },
            { label: 'Cantidad Total Piezas', value: items.reduce((sum, i) => sum + i.cantidad_disponible, 0) }
        ];
        PDFGenerator.addStatsSection(doc, stats);

        const categoriaCounts = {};
        items.forEach(i => {
            const cat = i.categoria || 'Sin Categoría';
            categoriaCounts[cat] = (categoriaCounts[cat] || 0) + 1;
        });
        const chartData = Object.entries(categoriaCounts).map(([cat, count]) => ({
            label: cat,
            value: count
        }));
        if (chartData.length > 0) {
            PDFGenerator.addBarChart(doc, 'Items por Categoría', chartData);
        }

        doc.addPage();
        doc.fontSize(12).font('Helvetica-Bold').text('Detalle de Inventario', { underline: true }).moveDown(0.5);

        const headers = ['Código', 'Nombre', 'Categoría', 'Stock', 'Precio (Bs)', 'Valor'];
        const rows = items.slice(0, 50).map(i => [
            i.codigo || i.id,
            i.nombre,
            i.categoria || 'N/A',
            i.cantidad_disponible,
            (parseFloat(i.precio_unitario) || 0).toFixed(2),
            (i.cantidad_disponible * (parseFloat(i.precio_unitario) || 0)).toFixed(2)
        ]);

        if (rows.length > 0) {
            PDFGenerator.addTable(doc, headers, rows, { columnWidth: 85 });
        }

        PDFGenerator.addFooter(doc, 1);

        const filename = `inventario_${new Date().getTime()}.pdf`;
        PDFGenerator.sendAsResponse(doc, res, filename);

    } catch (error) {
        console.error('Error en InventarioController.generarReportePDF:', error.message);
        res.status(500).json({ success: false, message: 'Error generando reporte PDF' });
    }
}

// CONDUCTORES CONTROLLER
/**
 * Generar reporte PDF de conductores
 */
static async generarReportePDF(req, res) {
    try {
        const { estado, licencia_tipo } = req.query;
        const PDFGenerator = require('../utils/pdfGenerator');
        const ModeloConductor = require('../models/Conductor');

        const filtros = {};
        if (estado) filtros.estado = estado;
        if (licencia_tipo) filtros.licencia_tipo = licencia_tipo;

        const resultado = await ModeloConductor.obtenerTodosConductores(1, 1000, filtros);
        const conductores = resultado.conductores || [];

        const doc = PDFGenerator.createDocument();

        PDFGenerator.addHeader(doc, 'Reporte de Conductores', 'Personal de Transporte UMSA');

        const stats = [
            { label: 'Total de Conductores', value: conductores.length },
            { label: 'Activos', value: conductores.filter(c => c.estado === 'ACTIVO').length },
            { label: 'Inactivos', value: conductores.filter(c => c.estado === 'INACTIVO').length },
            { label: 'Licencia A', value: conductores.filter(c => c.licencia_tipo === 'A').length },
            { label: 'Licencia B', value: conductores.filter(c => c.licencia_tipo === 'B').length }
        ];
        PDFGenerator.addStatsSection(doc, stats);

        const estadosCounts = {};
        conductores.forEach(c => {
            estadosCounts[c.estado] = (estadosCounts[c.estado] || 0) + 1;
        });
        const chartData = Object.entries(estadosCounts).map(([estado, count]) => ({
            label: estado,
            value: count
        }));
        if (chartData.length > 0) {
            PDFGenerator.addBarChart(doc, 'Conductores por Estado', chartData);
        }

        doc.addPage();
        doc.fontSize(12).font('Helvetica-Bold').text('Detalle de Conductores', { underline: true }).moveDown(0.5);

        const headers = ['CI', 'Nombre', 'Licencia', 'Tipo Lic.', 'Estado', 'Teléfono'];
        const rows = conductores.slice(0, 50).map(c => [
            c.ci,
            `${c.nombre} ${c.apellido}`,
            c.licencia_numero || 'N/A',
            c.licencia_tipo || 'N/A',
            c.estado,
            c.telefono || 'N/A'
        ]);

        if (rows.length > 0) {
            PDFGenerator.addTable(doc, headers, rows, { columnWidth: 85 });
        }

        PDFGenerator.addFooter(doc, 1);

        const filename = `conductores_${new Date().getTime()}.pdf`;
        PDFGenerator.sendAsResponse(doc, res, filename);

    } catch (error) {
        console.error('Error en ConductorController.generarReportePDF:', error.message);
        res.status(500).json({ success: false, message: 'Error generando reporte PDF' });
    }
}
