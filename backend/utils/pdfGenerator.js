const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFGenerator {
    /**
     * Crear un nuevo documento PDF
     */
    static createDocument() {
        return new PDFDocument({
            size: 'LETTER',
            margins: {
                top: 50,
                bottom: 50,
                left: 50,
                right: 50
            }
        });
    }

    /**
     * Agregar encabezado al PDF
     */
    static addHeader(doc, title, subtitle = '') {
        // Fondo azul para el encabezado
        doc.rect(0, 0, doc.page.width, 130)
           .fill('#1a5490');

        // Logo o título principal
        doc.fontSize(22)
           .font('Helvetica-Bold')
           .fillColor('white')
           .text('UNIVERSIDAD MAYOR DE SAN ANDRÉS', 50, 30, { align: 'center' })
           .fontSize(14)
           .text('Sistema de la Unidad de Transporte - UMSA', { align: 'center' })
           .moveDown(0.5);

        // Título del reporte con fondo
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .text(title, { align: 'center' })
           .moveDown(0.3);

        if (subtitle) {
            doc.fontSize(11)
               .font('Helvetica')
               .text(subtitle, { align: 'center' })
               .moveDown();
        }

        // Resetear color
        doc.fillColor('black');
        doc.y = 140;

        // Fecha de generación
        const fecha = new Date().toLocaleDateString('es-BO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        doc.fontSize(9)
           .font('Helvetica')
           .text(`Fecha de generacion: ${fecha}`, 50, doc.y)
           .moveDown(1);
    }

    /**
     * Agregar pie de página a una página específica
     */
    static addFooter(doc, pageNumber = 1) {
        const bottom = doc.page.height - 50;
        
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#666')
           .text(
               `Pagina ${pageNumber}`,
               50,
               bottom,
               { align: 'center', width: doc.page.width - 100 }
           )
           .text(
               `Sistema de la Unidad de Transporte - UMSA - ${new Date().getFullYear()}`,
               50,
               bottom + 12,
               { align: 'center', width: doc.page.width - 100 }
           );
        
        doc.fillColor('black');
    }

    /**
     * Configurar pie de página - simplemente no hace nada
     * El footer se agrega manualmente al final del documento
     */
    static setupAutoFooter(doc) {
        // No hacer nada - evitar páginas en blanco
    }

    /**
     * Agregar sección de estadísticas con diseño de cajas
     */
    static addStatsSection(doc, stats) {
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .fillColor('#1a5490')
           .text('RESUMEN EJECUTIVO', { underline: false })
           .fillColor('black')
           .moveDown(0.8);

        const boxWidth = 120;
        const boxHeight = 60;
        const spacing = 15;
        const startX = 50;
        let currentX = startX;
        let currentY = doc.y;

        stats.forEach((stat, index) => {
            // Nueva fila cada 4 cajas
            if (index > 0 && index % 4 === 0) {
                currentX = startX;
                currentY += boxHeight + spacing;
            }

            // Fondo de la caja con gradiente simulado
            const colors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c'];
            const color = colors[index % colors.length];
            
            doc.rect(currentX, currentY, boxWidth, boxHeight)
               .fillAndStroke(color, '#34495e');

            // Valor (número grande)
            doc.fontSize(18)
               .font('Helvetica-Bold')
               .fillColor('white')
               .text(stat.value, currentX + 5, currentY + 10, {
                   width: boxWidth - 10,
                   align: 'center'
               });

            // Etiqueta
            doc.fontSize(8)
               .font('Helvetica')
               .text(stat.label, currentX + 5, currentY + 35, {
                   width: boxWidth - 10,
                   align: 'center'
               });

            currentX += boxWidth + spacing;
            doc.fillColor('black');
        });

        doc.y = currentY + boxHeight + spacing + 10;
    }

    /**
     * Agregar tabla al documento
     */
    static addTable(doc, headers, rows, options = {}) {
        const startX = options.startX || 50;
        const startY = options.startY || doc.y;
        const rowHeight = options.rowHeight || 25;
        
        // Soportar anchos personalizados por columna o ancho uniforme
        let columnWidths;
        if (options.columnWidths && Array.isArray(options.columnWidths)) {
            columnWidths = options.columnWidths;
        } else {
            const columnWidth = options.columnWidth || (doc.page.width - 100) / headers.length;
            columnWidths = new Array(headers.length).fill(columnWidth);
        }

        let currentY = startY;

        // Encabezados
        doc.fontSize(9)
           .font('Helvetica-Bold');

        let currentX = startX;
        headers.forEach((header, i) => {
            const colWidth = columnWidths[i];
            doc.rect(currentX, currentY, colWidth, rowHeight)
               .fillAndStroke('#3498db', '#2c3e50')
               .fillColor('white')
               .text(header, currentX + 5, currentY + 8, {
                   width: colWidth - 10,
                   align: 'left'
               });
            currentX += colWidth;
        });

        currentY += rowHeight;
        doc.fillColor('black');

        // Filas
        doc.font('Helvetica');
        rows.forEach((row, rowIndex) => {
            const fillColor = rowIndex % 2 === 0 ? '#ecf0f1' : 'white';
            
            // Calcular altura necesaria para esta fila
            let maxHeight = rowHeight;
            row.forEach((cell, colIndex) => {
                const colWidth = columnWidths[colIndex];
                const cellText = String(cell);
                const textHeight = doc.heightOfString(cellText, {
                    width: colWidth - 10,
                    align: 'left'
                });
                maxHeight = Math.max(maxHeight, textHeight + 16);
            });
            
            currentX = startX;
            row.forEach((cell, colIndex) => {
                const colWidth = columnWidths[colIndex];
                doc.rect(currentX, currentY, colWidth, maxHeight)
                   .fillAndStroke(fillColor, '#bdc3c7');
                
                doc.fillColor('black')
                   .text(String(cell), currentX + 5, currentY + 8, {
                       width: colWidth - 10,
                       align: 'left'
                   });
                currentX += colWidth;
            });

            currentY += maxHeight;

            // Nueva página si es necesario
            if (currentY > doc.page.height - 100) {
                doc.addPage();
                currentY = 50;
                
                // Repetir encabezados en nueva página
                doc.fontSize(9).font('Helvetica-Bold');
                currentX = startX;
                headers.forEach((header, i) => {
                    const colWidth = columnWidths[i];
                    doc.rect(currentX, currentY, colWidth, rowHeight)
                       .fillAndStroke('#3498db', '#2c3e50')
                       .fillColor('white')
                       .text(header, currentX + 5, currentY + 8, {
                           width: colWidth - 10,
                           align: 'left'
                       });
                    currentX += colWidth;
                });
                currentY += rowHeight;
                doc.fillColor('black').font('Helvetica');
            }
        });

        doc.y = currentY + 10;
    }

    /**
     * Agregar gráfico de barras mejorado con colores y sombras
     */
    static addBarChart(doc, title, data, options = {}) {
        const startX = options.startX || 50;
        const startY = options.startY || doc.y;
        const chartWidth = options.width || 500;
        const chartHeight = options.height || 180;
        const maxValue = Math.max(...data.map(d => d.value), 1);

        // Título de sección
        doc.fontSize(13)
           .font('Helvetica-Bold')
           .fillColor('#1a5490')
           .text(title, startX, startY)
           .fillColor('black')
           .moveDown(0.8);

        const barWidth = Math.min(chartWidth / data.length, 80);
        const graphStartY = doc.y;
        const colors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c', '#34495e'];

        // Líneas de referencia horizontales
        doc.strokeColor('#e0e0e0');
        for (let i = 0; i <= 5; i++) {
            const y = graphStartY + (chartHeight / 5) * i;
            doc.moveTo(startX, y).lineTo(startX + chartWidth, y).stroke();
            const value = Math.round((maxValue * (5 - i)) / 5);
            doc.fontSize(7)
               .fillColor('#666')
               .text(value, startX - 30, y - 3);
        }
        doc.strokeColor('black');

        // Barras
        data.forEach((item, index) => {
            const barHeight = (item.value / maxValue) * chartHeight;
            const x = startX + (index * barWidth) + (index * 10);
            const y = graphStartY + chartHeight - barHeight;
            const color = colors[index % colors.length];

            // Sombra
            doc.rect(x + 7, y + 2, barWidth - 14, barHeight)
               .fill('#00000020');

            // Barra principal
            doc.rect(x + 5, y, barWidth - 14, barHeight)
               .fillAndStroke(color, '#2c3e50');

            // Valor encima de la barra
            doc.fontSize(9)
               .font('Helvetica-Bold')
               .fillColor('black')
               .text(item.value, x, y - 18, {
                   width: barWidth,
                   align: 'center'
               });

            // Etiqueta debajo
            doc.fontSize(8)
               .font('Helvetica')
               .text(item.label, x, graphStartY + chartHeight + 8, {
                   width: barWidth,
                   align: 'center'
               });
        });

        doc.y = graphStartY + chartHeight + 35;
    }

    /**
     * Finalizar y guardar documento
     */
    static finalize(doc, filePath) {
        return new Promise((resolve, reject) => {
            const stream = fs.createWriteStream(filePath);
            
            stream.on('finish', () => resolve(filePath));
            stream.on('error', reject);
            
            doc.pipe(stream);
            doc.end();
        });
    }

    /**
     * Enviar documento como respuesta HTTP
     */
    static sendAsResponse(doc, res, filename) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        doc.pipe(res);
        doc.end();
    }
}

module.exports = PDFGenerator;
