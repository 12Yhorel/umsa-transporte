const ModeloInventario = require('../models/Inventario');
const path = require('path');
const fs = require('fs');

class InventarioController {
    
    /**
     * Obtener todos los ítems de inventario
     */
    static async obtenerTodosItems(req, res) {
        const inicio = Date.now();
        console.log(`[Inventario] Iniciando petición: ${req.method} ${req.originalUrl}`);
        
        try {
            const { 
                pagina = 1, 
                limite = 10, 
                categoria_id, 
                tipo_categoria, 
                estado_stock,
                bajo_stock,
                incluir_desactivados,
                busqueda 
            } = req.query;

            const filtros = {};
            if (categoria_id) filtros.categoria_id = categoria_id;
            if (tipo_categoria) filtros.tipo_categoria = tipo_categoria;
            if (estado_stock) filtros.estado_stock = estado_stock;
            if (bajo_stock === 'true') filtros.bajo_stock = true;
            if (incluir_desactivados === 'true') filtros.incluir_desactivados = true;
            if (busqueda) filtros.busqueda = busqueda;

            console.log(`[Inventario] Llamando modelo con filtros:`, filtros);
            const resultado = await ModeloInventario.obtenerTodosItems(pagina, limite, filtros);
            
            const duracion = Date.now() - inicio;
            console.log(`[Inventario] Respuesta enviada en ${duracion}ms`);

            res.json({
                success: true,
                data: resultado
            });

        } catch (error) {
            const duracion = Date.now() - inicio;
            console.error(`[ERROR] [Inventario] Error después de ${duracion}ms:`, error.message);
            
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    message: 'Error interno del servidor'
                });
            }
        }
    }

    /**
     * Obtener ítem por ID
     */
    static async obtenerItemPorId(req, res) {
        try {
            const { id } = req.params;

            const item = await ModeloInventario.obtenerItemPorId(id);

            if (!item) {
                return res.status(404).json({
                    success: false,
                    message: 'Ítem no encontrado'
                });
            }

            res.json({
                success: true,
                data: item
            });

        } catch (error) {
            console.error('Error en InventarioController.obtenerItemPorId:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Obtener ítem por código QR
     */
    static async obtenerItemPorQR(req, res) {
        try {
            const { codigo_qr } = req.params;

            const item = await ModeloInventario.obtenerItemPorQR(codigo_qr);

            if (!item) {
                return res.status(404).json({
                    success: false,
                    message: 'Ítem no encontrado'
                });
            }

            res.json({
                success: true,
                data: item
            });

        } catch (error) {
            console.error('Error en InventarioController.obtenerItemPorQR:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Crear nuevo ítem
     */
    static async crearItem(req, res) {
        try {
            // Verificar permisos (solo administradores y técnicos)
            if (req.usuario.rol_id !== 1 && req.usuario.rol_id !== 2) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para crear ítems de inventario'
                });
            }

            const itemData = req.body;
            const nuevoItem = await ModeloInventario.crear(itemData);

            res.status(201).json({
                success: true,
                message: 'Ítem creado exitosamente',
                data: nuevoItem
            });

        } catch (error) {
            console.error('Error en InventarioController.crearItem:', error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Actualizar ítem
     */
    static async actualizarItem(req, res) {
        try {
            const { id } = req.params;
            const datosActualizacion = req.body;

            // Verificar permisos (solo administradores y técnicos)
            if (req.usuario.rol_id !== 1 && req.usuario.rol_id !== 2) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para actualizar ítems de inventario'
                });
            }

            const itemActualizado = await ModeloInventario.actualizar(id, datosActualizacion);

            res.json({
                success: true,
                message: 'Ítem actualizado exitosamente',
                data: itemActualizado
            });

        } catch (error) {
            console.error('Error en InventarioController.actualizarItem:', error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Desactivar ítem
     */
    static async desactivarItem(req, res) {
        try {
            const { id } = req.params;

            // Verificar permisos (solo administradores)
            if (req.usuario.rol_id !== 1) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para desactivar ítems de inventario'
                });
            }

            await ModeloInventario.desactivarItem(id);

            res.json({
                success: true,
                message: 'Ítem desactivado exitosamente'
            });

        } catch (error) {
            console.error('Error en InventarioController.desactivarItem:', error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Registrar entrada de stock
     */
    static async registrarEntrada(req, res) {
        try {
            const { id } = req.params;
            const { cantidad, motivo, referencia_id } = req.body;

            // Validar cantidad
            if (!cantidad || cantidad <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'La cantidad debe ser mayor a 0'
                });
            }

            // Verificar permisos (solo administradores y técnicos)
            if (req.usuario.rol_id !== 1 && req.usuario.rol_id !== 2) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para registrar entradas de stock'
                });
            }

            const resultado = await ModeloInventario.registrarEntrada(
                id, 
                cantidad, 
                motivo, 
                referencia_id, 
                req.usuario.id
            );

            res.json({
                success: true,
                message: 'Entrada de stock registrada exitosamente',
                data: resultado
            });

        } catch (error) {
            console.error('Error en InventarioController.registrarEntrada:', error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Registrar salida de stock
     */
    static async registrarSalida(req, res) {
        try {
            const { id } = req.params;
            const { cantidad, motivo, referencia_id } = req.body;

            // Validar cantidad
            if (!cantidad || cantidad <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'La cantidad debe ser mayor a 0'
                });
            }

            // Validar motivo obligatorio para salidas
            if (!motivo || motivo.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'El motivo es obligatorio para salidas de stock'
                });
            }

            // Verificar permisos (solo administradores y técnicos)
            if (req.usuario.rol_id !== 1 && req.usuario.rol_id !== 2) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para registrar salidas de stock'
                });
            }

            const resultado = await ModeloInventario.registrarSalida(
                id, 
                cantidad, 
                motivo, 
                referencia_id, 
                req.usuario.id
            );

            res.json({
                success: true,
                message: 'Salida de stock registrada exitosamente',
                data: resultado
            });

        } catch (error) {
            console.error('Error en InventarioController.registrarSalida:', error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Ajustar stock de un ítem
     */
    static async ajustarStock(req, res) {
        try {
            const { id } = req.params;
            const { nuevo_stock, motivo } = req.body;

            // Validar nuevo_stock
            if (nuevo_stock === undefined || nuevo_stock === null || nuevo_stock < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El nuevo stock debe ser un número mayor o igual a 0'
                });
            }

            // Verificar permisos (solo administradores)
            if (req.usuario.rol_id !== 1) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para ajustar stock'
                });
            }

            const resultado = await ModeloInventario.ajustarStock(
                id, 
                nuevo_stock, 
                motivo, 
                req.usuario.id
            );

            res.json({
                success: true,
                message: 'Stock ajustado exitosamente',
                data: resultado
            });

        } catch (error) {
            console.error('Error en InventarioController.ajustarStock:', error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Obtener ítems con stock bajo
     */
    static async obtenerItemsStockBajo(req, res) {
        try {
            const items = await ModeloInventario.obtenerItemsStockBajo();

            res.json({
                success: true,
                data: items
            });

        } catch (error) {
            console.error('Error en InventarioController.obtenerItemsStockBajo:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Obtener historial de movimientos
     */
    static async obtenerHistorialMovimientos(req, res) {
        try {
            const { id } = req.params;
            const { limite = 20 } = req.query;

            const movimientos = await ModeloInventario.obtenerHistorialMovimientos(id, limite);

            res.json({
                success: true,
                data: movimientos
            });

        } catch (error) {
            console.error('Error en InventarioController.obtenerHistorialMovimientos:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Obtener categorías
     */
    static async obtenerCategorias(req, res) {
        try {
            const categorias = await ModeloInventario.obtenerCategorias();

            res.json({
                success: true,
                data: categorias
            });

        } catch (error) {
            console.error('Error en InventarioController.obtenerCategorias:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Crear categoría
     */
    static async crearCategoria(req, res) {
        try {
            // Verificar permisos (solo administradores)
            if (req.usuario.rol_id !== 1) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para crear categorías'
                });
            }

            const categoriaData = req.body;
            const nuevaCategoria = await ModeloInventario.crearCategoria(categoriaData);

            res.status(201).json({
                success: true,
                message: 'Categoría creada exitosamente',
                data: nuevaCategoria
            });

        } catch (error) {
            console.error('Error en InventarioController.crearCategoria:', error.message);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Obtener proveedores
     */
    static async obtenerProveedores(req, res) {
        try {
            const proveedores = await ModeloInventario.obtenerProveedores();

            res.json({
                success: true,
                data: proveedores
            });

        } catch (error) {
            console.error('Error en InventarioController.obtenerProveedores:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Obtener estadísticas de inventario
     */
    static async obtenerEstadisticas(req, res) {
        try {
            const estadisticas = await ModeloInventario.obtenerEstadisticas();

            res.json({
                success: true,
                data: estadisticas
            });

        } catch (error) {
            console.error('Error en InventarioController.obtenerEstadisticas:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Buscar ítems
     */
    static async buscarItems(req, res) {
        try {
            const { termino, limite = 10 } = req.query;

            if (!termino) {
                return res.status(400).json({
                    success: false,
                    message: 'Término de búsqueda requerido'
                });
            }

            const items = await ModeloInventario.buscarItems(termino, limite);

            res.json({
                success: true,
                data: items
            });

        } catch (error) {
            console.error('Error en InventarioController.buscarItems:', error.message);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Generar reporte PDF de inventario
     */
    static async generarReportePDF(req, res) {
        try {
            const PDFGenerator = require('../utils/pdfGenerator');
            const { categoria_id, bajo_stock } = req.query;

            const filtros = {};
            if (categoria_id) filtros.categoria_id = categoria_id;
            if (bajo_stock === 'true') filtros.bajo_stock = true;

            const resultado = await ModeloInventario.obtenerTodosItems(1, 1000, filtros);
            const items = resultado.items || [];

            // Métricas avanzadas usando los campos correctos
            const valorTotal = items.reduce((sum, i) => sum + (i.stock_actual * (parseFloat(i.precio_unitario) || 0)), 0);
            const stockBajo = items.filter(i => i.stock_actual <= i.stock_minimo && i.stock_actual > 0).length;
            const agotados = items.filter(i => i.stock_actual === 0).length;
            const stockNormal = items.filter(i => i.stock_actual > i.stock_minimo).length;
            const cantidadTotal = items.reduce((sum, i) => sum + i.stock_actual, 0);
            
            // Items más valiosos
            const itemsValiosos = items
                .map(i => ({
                    nombre: i.nombre,
                    valor: i.stock_actual * (parseFloat(i.precio_unitario) || 0)
                }))
                .filter(i => i.valor > 0)
                .sort((a, b) => b.valor - a.valor)
                .slice(0, 5);

            // Análisis por categoría
            const categoriaCounts = {};
            const categoriaValor = {};
            items.forEach(i => {
                const cat = i.categoria_nombre || 'Sin Categoria';
                categoriaCounts[cat] = (categoriaCounts[cat] || 0) + 1;
                categoriaValor[cat] = (categoriaValor[cat] || 0) + (i.stock_actual * (parseFloat(i.precio_unitario) || 0));
            });

            const doc = PDFGenerator.createDocument();

            // Configurar pie de página automático
            PDFGenerator.setupAutoFooter(doc);

            const subtitle = categoria_id || bajo_stock
                ? `Reporte Filtrado - ${new Date().toLocaleDateString('es-BO')}`
                : `Reporte General de Inventario - ${new Date().toLocaleDateString('es-BO')}`;
            PDFGenerator.addHeader(doc, 'REPORTE DE INVENTARIO Y REPUESTOS', subtitle);

            // Estadísticas en cajas
            const stats = [
                { label: 'Total Items', value: items.length.toString() },
                { label: 'Valor Total', value: `Bs ${valorTotal.toFixed(2)}` },
                { label: 'Stock Normal', value: stockNormal.toString() },
                { label: 'Stock Bajo', value: stockBajo.toString() },
                { label: 'Agotados', value: agotados.toString() },
                { label: 'Cantidad Total', value: cantidadTotal.toString() },
                { label: 'Valor Promedio', value: `Bs ${(valorTotal / items.length || 0).toFixed(2)}` },
                { label: 'Categorias', value: Object.keys(categoriaCounts).length.toString() }
            ];
            PDFGenerator.addStatsSection(doc, stats);

            // Gráfico por categoría
            const chartData = Object.entries(categoriaCounts).map(([cat, count]) => ({
                label: cat.substring(0, 12),
                value: count
            }));
            if (chartData.length > 0) {
                PDFGenerator.addBarChart(doc, 'DISTRIBUCION POR CATEGORIA', chartData.slice(0, 7));
            }

            // Items más valiosos
            if (itemsValiosos.length > 0) {
                doc.fontSize(13)
                   .font('Helvetica-Bold')
                   .fillColor('#1a5490')
                   .text('ITEMS MAS VALIOSOS EN INVENTARIO', 50, doc.y)
                   .fillColor('black')
                   .moveDown(0.5);

                itemsValiosos.forEach((item, index) => {
                    doc.fontSize(10)
                       .font('Helvetica')
                       .text(`${index + 1}. ${item.nombre.substring(0, 40)}: Bs ${item.valor.toFixed(2)}`, 70)
                       .moveDown(0.3);
                });
                doc.moveDown();
            }

            // Análisis financiero por categoría
            const categoriasConValor = Object.entries(categoriaValor).filter(([cat, valor]) => valor > 0);
            if (categoriasConValor.length > 0) {
                doc.fontSize(13)
                   .font('Helvetica-Bold')
                   .fillColor('#1a5490')
                   .text('VALOR INVENTARIO POR CATEGORIA', 50, doc.y)
                   .fillColor('black')
                   .moveDown(0.5);

                categoriasConValor
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8)
                    .forEach(([cat, valor]) => {
                        const porcentaje = ((valor / valorTotal) * 100).toFixed(1);
                        doc.fontSize(10)
                           .font('Helvetica')
                           .text(`• ${cat}: Bs ${valor.toFixed(2)} (${porcentaje}%)`, 70)
                           .moveDown(0.3);
                    });
                doc.moveDown();
            }

            // Alertas de stock
            doc.fontSize(13)
               .font('Helvetica-Bold')
               .fillColor('#e74c3c')
               .text('ALERTAS DE STOCK', 50, doc.y)
               .fillColor('black')
               .moveDown(0.5);

            doc.fontSize(10)
               .font('Helvetica')
               .text(`• Items con stock critico (agotados): ${agotados}`, 70)
               .moveDown(0.3)
               .text(`• Items con stock bajo (por debajo del minimo): ${stockBajo}`, 70)
               .moveDown(0.3)
               .text(`• Total items requieren atencion: ${agotados + stockBajo}`, 70)
               .moveDown(1);

            // Tabla detallada
            doc.addPage();
            doc.fontSize(14)
               .font('Helvetica-Bold')
               .fillColor('#1a5490')
               .text('DETALLE DE INVENTARIO', 50, 50)
               .fillColor('black')
               .moveDown(1);

            const headers = ['Código', 'Nombre', 'Categoría', 'Stock', 'Mín', 'Unidad', 'Precio', 'Valor'];
            const rows = items.slice(0, 50).map(i => [
                (i.codigo_qr || `#${i.id}`),
                i.nombre,
                (i.categoria_nombre || 'N/A'),
                i.stock_actual.toString(),
                i.stock_minimo.toString(),
                i.unidad_medida || 'UNIDAD',
                `Bs ${(parseFloat(i.precio_unitario) || 0).toFixed(2)}`,
                `Bs ${(i.stock_actual * (parseFloat(i.precio_unitario) || 0)).toFixed(2)}`
            ]);

            if (rows.length > 0) {
                const columnWidths = [55, 110, 80, 40, 35, 50, 55, 55];
                PDFGenerator.addTable(doc, headers, rows, { columnWidths, rowHeight: 30 });
            }

            const filename = `inventario_${new Date().getTime()}.pdf`;
            PDFGenerator.sendAsResponse(doc, res, filename);

        } catch (error) {
            console.error('Error en InventarioController.generarReportePDF:', error.message);
            res.status(500).json({ success: false, message: 'Error generando reporte PDF' });
        }
    }

    /**
     * Generar código QR para un ítem
     */
    static async generarQRItem(req, res) {
        try {
            const { id } = req.params;

            // Verificar que el ítem existe
            const item = await ModeloInventario.obtenerItemPorId(id);
            if (!item) {
                return res.status(404).json({
                    success: false,
                    message: 'Ítem no encontrado'
                });
            }

            // Generar o regenerar el código QR
            await ModeloInventario.generarImagenQR(item.codigo_qr, item.id);

            res.json({
                success: true,
                message: 'Código QR generado exitosamente',
                data: {
                    codigo_qr: item.codigo_qr,
                    url: `/qr-codes/inventario_${item.id}.png`
                }
            });

        } catch (error) {
            console.error('Error en InventarioController.generarQRItem:', error.message);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Descargar imagen del código QR de un ítem
     */
    static async descargarQRItem(req, res) {
        try {
            const { id } = req.params;

            // Verificar que el ítem existe
            const item = await ModeloInventario.obtenerItemPorId(id);
            if (!item) {
                return res.status(404).json({
                    success: false,
                    message: 'Ítem no encontrado'
                });
            }

            const rutaQR = path.join(__dirname, '..', 'public', 'qr-codes', `inventario_${item.id}.png`);

            // Verificar si el archivo QR existe
            if (!fs.existsSync(rutaQR)) {
                console.log(`🔄 Generando QR para item ${item.id}...`);
                try {
                    await ModeloInventario.generarImagenQR(item.codigo_qr, item.id);
                    // Esperar un poco para asegurar que el archivo se escribió
                    await new Promise(resolve => setTimeout(resolve, 100));
                } catch (genError) {
                    console.error(`Error al generar QR para item ${item.id}:`, genError.message);
                    return res.status(500).json({
                        success: false,
                        message: `Error al generar código QR: ${genError.message}`
                    });
                }
            }

            // Verificar nuevamente después de intentar generarlo
            if (!fs.existsSync(rutaQR)) {
                return res.status(404).json({
                    success: false,
                    message: 'No se pudo generar el código QR. Verifique los permisos del directorio.'
                });
            }

            // Enviar el archivo
            const nombreArchivo = `QR_${item.nombre.replace(/[^a-zA-Z0-9]/g, '_')}_${item.id}.png`;
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
            
            const stream = fs.createReadStream(rutaQR);
            stream.on('error', (streamError) => {
                console.error('Error leyendo archivo QR:', streamError.message);
                if (!res.headersSent) {
                    res.status(500).json({
                        success: false,
                        message: 'Error al leer el archivo QR'
                    });
                }
            });
            stream.pipe(res);

        } catch (error) {
            console.error('Error en InventarioController.descargarQRItem:', error.message);
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    message: error.message
                });
            }
        }
    }

    /**
     * Generar QR masivo para todos los ítems
     */
    static async generarQRMasivo(req, res) {
        try {
            // Verificar permisos (solo administradores)
            if (req.usuario.rol_id !== 1) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para generar códigos QR masivos'
                });
            }

            console.log('🚀 Iniciando generación masiva de códigos QR...');

            // Obtener todos los ítems activos
            const resultado = await ModeloInventario.obtenerTodosItems(1, 1000, { activo: true });
            const items = resultado.items || [];
            
            if (items.length === 0) {
                return res.json({
                    success: true,
                    message: 'No hay ítems para generar códigos QR',
                    data: { generados: 0, errores: 0, total: 0 }
                });
            }

            let generados = 0;
            let errores = 0;
            const erroresDetallados = [];

            // Procesar en lotes de 10 para no saturar
            const LOTE = 10;
            for (let i = 0; i < items.length; i += LOTE) {
                const lote = items.slice(i, i + LOTE);
                const promesas = lote.map(async (item) => {
                    try {
                        await ModeloInventario.generarImagenQR(item.codigo_qr, item.id);
                        generados++;
                        return { exito: true, id: item.id };
                    } catch (error) {
                        errores++;
                        erroresDetallados.push(`Item ${item.id}: ${error.message}`);
                        return { exito: false, id: item.id, error: error.message };
                    }
                });

                await Promise.all(promesas);
                console.log(`📊 Progreso: ${Math.min(i + LOTE, items.length)}/${items.length} procesados`);
            }

            console.log(`✅ Generación completada: ${generados} exitosos, ${errores} errores`);

            res.json({
                success: true,
                message: `Códigos QR generados: ${generados}, Errores: ${errores}`,
                data: {
                    generados,
                    errores,
                    total: items.length,
                    erroresDetallados: errores > 0 ? erroresDetallados.slice(0, 10) : []
                }
            });

        } catch (error) {
            console.error('❌ Error en InventarioController.generarQRMasivo:', error.message);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = InventarioController;
