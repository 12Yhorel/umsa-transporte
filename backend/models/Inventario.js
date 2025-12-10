/**
 * MODELO DE INVENTARIO - SISTEMA DE LA UNIDAD DE TRANSPORTE - UMSA
 * Gestión completa de inventarios multi-categoría con códigos QR
 * Universidad Mayor de San Andrés
 */

const { obtenerConexion, ejecutarConsulta } = require('../config/database');
const QRCode = require('qr-image');
const fs = require('fs');
const path = require('path');

class ModeloInventario {
    
    /**
     * Crear un nuevo ítem de inventario
     */
    static async crear(itemData) {
        try {
            const {
                nombre,
                descripcion = null,
                categoria_id,
                stock_actual = 0,
                stock_minimo = process.env.INVENTARIO_STOCK_MINIMO_DEFAULT || 5,
                stock_maximo = process.env.INVENTARIO_STOCK_MAXIMO_DEFAULT || 100,
                unidad_medida = 'UNIDAD',
                precio_unitario = null,
                ubicacion = null
            } = itemData;

            // Validaciones básicas
            if (!nombre || !categoria_id) {
                throw new Error('Faltan campos requeridos: nombre, categoria_id');
            }

            // Verificar que la categoría existe
            const categoriaExistente = await this.obtenerCategoriaPorId(categoria_id);
            if (!categoriaExistente) {
                throw new Error('La categoría especificada no existe');
            }

            // Validar stocks
            if (stock_actual < 0) {
                throw new Error('El stock actual no puede ser negativo');
            }

            if (stock_minimo < 0) {
                throw new Error('El stock mínimo no puede ser negativo');
            }

            if (stock_maximo < stock_minimo) {
                throw new Error('El stock máximo no puede ser menor al stock mínimo');
            }

            // Generar código QR único
            const codigoQR = await this.generarCodigoQRUnico();

            const conexion = await obtenerConexion();
            
            const [resultado] = await conexion.execute(
                `INSERT INTO items_inventario 
                 (codigo_qr, nombre, descripcion, categoria_id, stock_actual, stock_minimo, 
                  stock_maximo, unidad_medida, precio_unitario, ubicacion) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [codigoQR, nombre, descripcion, categoria_id, stock_actual, stock_minimo, 
                 stock_maximo, unidad_medida, precio_unitario, ubicacion]
            );

            // Generar imagen QR
            await this.generarImagenQR(codigoQR, resultado.insertId);

            // Obtener el ítem recién creado
            const itemCreado = await this.obtenerItemPorId(resultado.insertId);
            
            // Registrar movimiento inicial
            await this.registrarMovimiento(
                resultado.insertId,
                'ENTRADA',
                stock_actual,
                0,
                stock_actual,
                'Stock inicial',
                null
            );

            // Registrar en auditoría
            await this.registrarAuditoria(
                'CREACION_ITEM_INVENTARIO',
                'items_inventario',
                resultado.insertId,
                null,
                { nombre, categoria_id, stock_actual }
            );

            return itemCreado;

        } catch (error) {
            console.error('Error en ModeloInventario.crear:', error.message);
            throw error;
        }
    }

    /**
     * Obtener ítem por ID
     */
    static async obtenerItemPorId(id) {
        try {
            const [items] = await ejecutarConsulta(
                `SELECT i.*, c.nombre as categoria_nombre, c.tipo as categoria_tipo
                 FROM items_inventario i 
                 INNER JOIN categorias_inventario c ON i.categoria_id = c.id 
                 WHERE i.id = ? AND i.activo = TRUE`,
                [id]
            );

            if (items.length === 0) {
                return null;
            }

            const item = items[0];
            
            // Calcular estado del stock
            item.estado_stock = this.calcularEstadoStock(item.stock_actual, item.stock_minimo);
            item.necesita_reposicion = item.stock_actual <= item.stock_minimo;
            item.stock_optimo = item.stock_actual > item.stock_minimo && item.stock_actual < item.stock_maximo;

            return item;

        } catch (error) {
            console.error('Error en ModeloInventario.obtenerItemPorId:', error.message);
            throw error;
        }
    }

    /**
     * Obtener ítem por código QR
     */
    static async obtenerItemPorQR(codigoQR) {
        try {
            const [items] = await ejecutarConsulta(
                `SELECT i.*, c.nombre as categoria_nombre, c.tipo as categoria_tipo
                 FROM items_inventario i 
                 INNER JOIN categorias_inventario c ON i.categoria_id = c.id 
                 WHERE i.codigo_qr = ? AND i.activo = TRUE`,
                [codigoQR]
            );

            if (items.length === 0) {
                return null;
            }

            const item = items[0];
            item.estado_stock = this.calcularEstadoStock(item.stock_actual, item.stock_minimo);
            item.necesita_reposicion = item.stock_actual <= item.stock_minimo;

            return item;

        } catch (error) {
            console.error('Error en ModeloInventario.obtenerItemPorQR:', error.message);
            throw error;
        }
    }

    /**
     * Obtener todos los ítems con paginación y filtros
     */
    static async obtenerTodosItems(pagina = 1, limite = 10, filtros = {}) {
        try {
            const offset = (pagina - 1) * limite;
            let consulta = `
                SELECT i.*, c.nombre as categoria_nombre, c.tipo as categoria_tipo
                FROM items_inventario i 
                INNER JOIN categorias_inventario c ON i.categoria_id = c.id 
            `;
            
            // Si no se pide incluir desactivados, solo mostrar activos
            if (!filtros.incluir_desactivados) {
                consulta += 'WHERE i.activo = TRUE';
            } else {
                consulta += 'WHERE 1=1';
            }
            
            const parametros = [];
            const condiciones = [];

            // Aplicar filtros
            if (filtros.categoria_id) {
                condiciones.push('i.categoria_id = ?');
                parametros.push(filtros.categoria_id);
            }

            if (filtros.tipo_categoria) {
                condiciones.push('c.tipo = ?');
                parametros.push(filtros.tipo_categoria);
            }

            if (filtros.estado_stock) {
                if (filtros.estado_stock === 'BAJO') {
                    condiciones.push('i.stock_actual <= i.stock_minimo');
                } else if (filtros.estado_stock === 'OPTIMO') {
                    condiciones.push('i.stock_actual > i.stock_minimo AND i.stock_actual < i.stock_maximo');
                } else if (filtros.estado_stock === 'EXCESIVO') {
                    condiciones.push('i.stock_actual >= i.stock_maximo');
                }
            }

            if (filtros.bajo_stock) {
                condiciones.push('i.stock_actual <= i.stock_minimo');
            }

            if (filtros.busqueda) {
                condiciones.push('(i.nombre LIKE ? OR i.descripcion LIKE ? OR i.codigo_qr LIKE ?)');
                parametros.push(`%${filtros.busqueda}%`, `%${filtros.busqueda}%`, `%${filtros.busqueda}%`);
            }

            if (condiciones.length > 0) {
                consulta += ' AND ' + condiciones.join(' AND ');
            }

            // Ordenar y paginar
            consulta += ' ORDER BY c.nombre, i.nombre';

            // Validar y sanitizar valores numéricos para evitar SQL injection
            const limiteInt = parseInt(limite, 10) || 20;
            const offsetInt = parseInt(offset, 10) || 0;
            
            // Concatenar LIMIT y OFFSET de forma segura (valores ya validados como enteros)
            const consultaFinal = `${consulta} LIMIT ${limiteInt} OFFSET ${offsetInt}`;

            const [items] = await ejecutarConsulta(consultaFinal, parametros);

            // Calcular estados de stock para cada ítem
            items.forEach(item => {
                item.estado_stock = this.calcularEstadoStock(item.stock_actual, item.stock_minimo);
                item.necesita_reposicion = item.stock_actual <= item.stock_minimo;
                item.stock_optimo = item.stock_actual > item.stock_minimo && item.stock_actual < item.stock_maximo;
            });

            // Obtener total para paginación
            const total = await this.obtenerTotalItems(filtros);

            return {
                items,
                paginacion: {
                    pagina: parseInt(pagina),
                    limite: parseInt(limite),
                    total,
                    totalPaginas: Math.ceil(total / limite)
                }
            };

        } catch (error) {
            console.error('Error en ModeloInventario.obtenerTodosItems:', error.message);
            throw error;
        }
    }

    /**
     * Obtener total de ítems con filtros
     */
    static async obtenerTotalItems(filtros = {}) {
        try {
            let consulta = `
                SELECT COUNT(*) as total 
                FROM items_inventario i
                INNER JOIN categorias_inventario c ON i.categoria_id = c.id
            `;
            
            // Si no se pide incluir desactivados, solo contar activos
            if (!filtros.incluir_desactivados) {
                consulta += 'WHERE i.activo = TRUE';
            } else {
                consulta += 'WHERE 1=1';
            }            const parametros = [];
            const condiciones = [];

            // Aplicar filtros (misma lógica que obtenerTodosItems)
            if (filtros.categoria_id) {
                condiciones.push('i.categoria_id = ?');
                parametros.push(filtros.categoria_id);
            }

            if (filtros.tipo_categoria) {
                condiciones.push('c.tipo = ?');
                parametros.push(filtros.tipo_categoria);
            }

            if (filtros.estado_stock) {
                if (filtros.estado_stock === 'BAJO') {
                    condiciones.push('i.stock_actual <= i.stock_minimo');
                } else if (filtros.estado_stock === 'OPTIMO') {
                    condiciones.push('i.stock_actual > i.stock_minimo AND i.stock_actual < i.stock_maximo');
                } else if (filtros.estado_stock === 'EXCESIVO') {
                    condiciones.push('i.stock_actual >= i.stock_maximo');
                }
            }

            if (filtros.bajo_stock) {
                condiciones.push('i.stock_actual <= i.stock_minimo');
            }

            if (filtros.busqueda) {
                condiciones.push('(i.nombre LIKE ? OR i.descripcion LIKE ? OR i.codigo_qr LIKE ?)');
                parametros.push(`%${filtros.busqueda}%`, `%${filtros.busqueda}%`, `%${filtros.busqueda}%`);
            }

            if (condiciones.length > 0) {
                consulta += ' AND ' + condiciones.join(' AND ');
            }

            const [resultado] = await ejecutarConsulta(consulta, parametros);
            return resultado[0].total;

        } catch (error) {
            console.error('Error en ModeloInventario.obtenerTotalItems:', error.message);
            throw error;
        }
    }

    /**
     * Actualizar ítem de inventario
     */
    static async actualizarItem(id, datosActualizacion) {
        try {
            // Verificar que el ítem existe
            const itemExistente = await this.obtenerItemPorId(id);
            if (!itemExistente) {
                throw new Error('Ítem de inventario no encontrado');
            }

            // Campos permitidos para actualización
            const camposPermitidos = [
                'nombre', 'descripcion', 'categoria_id', 'stock_actual', 'stock_minimo', 'stock_maximo',
                'unidad_medida', 'precio_unitario', 'ubicacion'
            ];
            
            const camposActualizar = {};
            
            for (const campo of camposPermitidos) {
                if (datosActualizacion[campo] !== undefined) {
                    camposActualizar[campo] = datosActualizacion[campo];
                }
            }

            // Si no hay campos para actualizar
            if (Object.keys(camposActualizar).length === 0) {
                throw new Error('No se proporcionaron campos válidos para actualizar');
            }

            // Validar categoría si se actualiza
            if (datosActualizacion.categoria_id) {
                const categoriaExistente = await this.obtenerCategoriaPorId(datosActualizacion.categoria_id);
                if (!categoriaExistente) {
                    throw new Error('La categoría especificada no existe');
                }
            }

            // Validar stocks si se actualizan
            if (datosActualizacion.stock_minimo !== undefined && datosActualizacion.stock_minimo < 0) {
                throw new Error('El stock mínimo no puede ser negativo');
            }

            if (datosActualizacion.stock_maximo !== undefined && datosActualizacion.stock_maximo < 0) {
                throw new Error('El stock máximo no puede ser negativo');
            }

            if (datosActualizacion.stock_minimo !== undefined && datosActualizacion.stock_maximo !== undefined) {
                if (datosActualizacion.stock_maximo < datosActualizacion.stock_minimo) {
                    throw new Error('El stock máximo no puede ser menor al stock mínimo');
                }
            }

            const conexion = await obtenerConexion();
            const campos = Object.keys(camposActualizar);
            const valores = Object.values(camposActualizar);

            const setClause = campos.map(campo => `${campo} = ?`).join(', ');
            const consulta = `UPDATE items_inventario SET ${setClause} WHERE id = ?`;

            const [resultado] = await conexion.execute(consulta, [...valores, id]);

            if (resultado.affectedRows === 0) {
                throw new Error('No se pudo actualizar el ítem');
            }

            // Registrar en auditoría
            await this.registrarAuditoria(
                'ACTUALIZACION_ITEM_INVENTARIO',
                'items_inventario',
                id,
                itemExistente,
                camposActualizar
            );

            // Obtener ítem actualizado
            const itemActualizado = await this.obtenerItemPorId(id);
            return itemActualizado;

        } catch (error) {
            console.error('Error en ModeloInventario.actualizarItem:', error.message);
            throw error;
        }
    }

    /**
     * Registrar entrada de stock
     */
    static async registrarEntrada(itemId, cantidad, motivo = 'Reposición de stock', referenciaId = null, usuarioId = 1) {
        try {
            // Verificar que el ítem existe
            const item = await this.obtenerItemPorId(itemId);
            if (!item) {
                throw new Error('Ítem de inventario no encontrado');
            }

            // Validar cantidad
            if (cantidad <= 0) {
                throw new Error('La cantidad debe ser mayor a 0');
            }

            const stockAnterior = item.stock_actual;
            const nuevoStock = stockAnterior + cantidad;

            const conexion = await obtenerConexion();
            
            // Actualizar stock
            const [resultado] = await conexion.execute(
                'UPDATE items_inventario SET stock_actual = ? WHERE id = ?',
                [nuevoStock, itemId]
            );

            if (resultado.affectedRows === 0) {
                throw new Error('No se pudo actualizar el stock');
            }

            // Registrar movimiento
            await this.registrarMovimiento(
                itemId,
                'ENTRADA',
                cantidad,
                stockAnterior,
                nuevoStock,
                motivo,
                referenciaId,
                usuarioId
            );

            // Verificar si se solucionó alerta de stock bajo
            if (stockAnterior <= item.stock_minimo && nuevoStock > item.stock_minimo) {
                await this.registrarAuditoria(
                    'ALERTA_STOCK_SOLUCIONADA',
                    'items_inventario',
                    itemId,
                    { stock_anterior: stockAnterior },
                    { stock_actual: nuevoStock }
                );
            }

            return {
                item_id: itemId,
                movimiento: 'ENTRADA',
                cantidad,
                stock_anterior: stockAnterior,
                stock_actual: nuevoStock,
                motivo
            };

        } catch (error) {
            console.error('Error en ModeloInventario.registrarEntrada:', error.message);
            throw error;
        }
    }

    /**
     * Registrar salida de stock
     */
    static async registrarSalida(itemId, cantidad, motivo, referenciaId = null, usuarioId = 1) {
        try {
            // Verificar que el ítem existe
            const item = await this.obtenerItemPorId(itemId);
            if (!item) {
                throw new Error('Ítem de inventario no encontrado');
            }

            // Validar cantidad
            if (cantidad <= 0) {
                throw new Error('La cantidad debe ser mayor a 0');
            }

            // Verificar stock suficiente
            if (item.stock_actual < cantidad) {
                throw new Error(`Stock insuficiente. Disponible: ${item.stock_actual}, Solicitado: ${cantidad}`);
            }

            const stockAnterior = item.stock_actual;
            const nuevoStock = stockAnterior - cantidad;

            const conexion = await obtenerConexion();
            
            // Actualizar stock
            const [resultado] = await conexion.execute(
                'UPDATE items_inventario SET stock_actual = ? WHERE id = ?',
                [nuevoStock, itemId]
            );

            if (resultado.affectedRows === 0) {
                throw new Error('No se pudo actualizar el stock');
            }

            // Registrar movimiento
            await this.registrarMovimiento(
                itemId,
                'SALIDA',
                cantidad,
                stockAnterior,
                nuevoStock,
                motivo,
                referenciaId,
                usuarioId
            );

            // Verificar si se genera alerta de stock bajo
            if (nuevoStock <= item.stock_minimo) {
                await this.registrarAuditoria(
                    'ALERTA_STOCK_BAJO',
                    'items_inventario',
                    itemId,
                    { stock_anterior: stockAnterior },
                    { stock_actual: nuevoStock }
                );
            }

            return {
                item_id: itemId,
                movimiento: 'SALIDA',
                cantidad,
                stock_anterior: stockAnterior,
                stock_actual: nuevoStock,
                motivo
            };

        } catch (error) {
            console.error('Error en ModeloInventario.registrarSalida:', error.message);
            throw error;
        }
    }

    /**
     * Ajustar stock (para correcciones)
     */
    static async ajustarStock(itemId, nuevoStock, motivo = 'Ajuste de inventario', usuarioId = 1) {
        try {
            // Verificar que el ítem existe
            const item = await this.obtenerItemPorId(itemId);
            if (!item) {
                throw new Error('Ítem de inventario no encontrado');
            }

            // Validar nuevo stock
            if (nuevoStock < 0) {
                throw new Error('El stock no puede ser negativo');
            }

            const stockAnterior = item.stock_actual;
            const diferencia = nuevoStock - stockAnterior;

            const conexion = await obtenerConexion();
            
            // Actualizar stock
            const [resultado] = await conexion.execute(
                'UPDATE items_inventario SET stock_actual = ? WHERE id = ?',
                [nuevoStock, itemId]
            );

            if (resultado.affectedRows === 0) {
                throw new Error('No se pudo ajustar el stock');
            }

            // Registrar movimiento de ajuste
            await this.registrarMovimiento(
                itemId,
                'AJUSTE',
                diferencia,
                stockAnterior,
                nuevoStock,
                motivo,
                null,
                usuarioId
            );

            return {
                item_id: itemId,
                movimiento: 'AJUSTE',
                diferencia,
                stock_anterior: stockAnterior,
                stock_actual: nuevoStock,
                motivo
            };

        } catch (error) {
            console.error('Error en ModeloInventario.ajustarStock:', error.message);
            throw error;
        }
    }

    /**
     * Obtener ítems con stock bajo (para alertas)
     */
    static async obtenerItemsStockBajo() {
        try {
            const [items] = await ejecutarConsulta(
                `SELECT i.*, c.nombre as categoria_nombre, c.tipo as categoria_tipo,
                        (i.stock_minimo - i.stock_actual) as cantidad_faltante
                 FROM items_inventario i 
                 INNER JOIN categorias_inventario c ON i.categoria_id = c.id 
                 WHERE i.activo = TRUE 
                 AND i.stock_actual <= i.stock_minimo
                 ORDER BY cantidad_faltante DESC, c.nombre, i.nombre`
            );

            return items;

        } catch (error) {
            console.error('Error en ModeloInventario.obtenerItemsStockBajo:', error.message);
            throw error;
        }
    }

    /**
     * Obtener historial de movimientos de un ítem
     */
    static async obtenerHistorialMovimientos(itemId, limite = 20) {
        try {
            const [movimientos] = await ejecutarConsulta(
                `SELECT m.*, u.nombres, u.apellidos
                 FROM movimientos_inventario m 
                 LEFT JOIN usuarios u ON m.usuario_id = u.id 
                 WHERE m.item_id = ? 
                 ORDER BY m.creado_en DESC
                 LIMIT ?`,
                [itemId, limite]
            );

            return movimientos;

        } catch (error) {
            console.error('Error en ModeloInventario.obtenerHistorialMovimientos:', error.message);
            throw error;
        }
    }

    /**
     * Gestión de categorías
     */

    /**
     * Obtener todas las categorías
     */
    static async obtenerTodasCategorias() {
        try {
            const [categorias] = await ejecutarConsulta(
                'SELECT * FROM categorias_inventario ORDER BY nombre'
            );

            return categorias;

        } catch (error) {
            console.error('Error en ModeloInventario.obtenerTodasCategorias:', error.message);
            throw error;
        }
    }

    /**
     * Obtener categoría por ID
     */
    static async obtenerCategoriaPorId(id) {
        try {
            const [categorias] = await ejecutarConsulta(
                'SELECT * FROM categorias_inventario WHERE id = ?',
                [id]
            );

            return categorias[0] || null;

        } catch (error) {
            console.error('Error en ModeloInventario.obtenerCategoriaPorId:', error.message);
            throw error;
        }
    }

    /**
     * Crear categoría
     */
    static async crearCategoria(categoriaData) {
        try {
            const { nombre, tipo, descripcion = null } = categoriaData;

            if (!nombre || !tipo) {
                throw new Error('Faltan campos requeridos: nombre, tipo');
            }

            // Validar tipo
            const tiposValidos = ['LIMPIEZA', 'REPUESTO', 'HERRAMIENTA'];
            if (!tiposValidos.includes(tipo)) {
                throw new Error('Tipo de categoría no válido. Debe ser: LIMPIEZA, REPUESTO o HERRAMIENTA');
            }

            // Verificar que el nombre no exista
            const [categoriasExistentes] = await ejecutarConsulta(
                'SELECT id FROM categorias_inventario WHERE nombre = ?',
                [nombre]
            );

            if (categoriasExistentes.length > 0) {
                throw new Error('El nombre de la categoría ya existe');
            }

            const [resultado] = await ejecutarConsulta(
                'INSERT INTO categorias_inventario (nombre, tipo, descripcion) VALUES (?, ?, ?)',
                [nombre, tipo, descripcion]
            );

            return await this.obtenerCategoriaPorId(resultado.insertId);

        } catch (error) {
            console.error('Error en ModeloInventario.crearCategoria:', error.message);
            throw error;
        }
    }

    /**
     * Crear categoría si no existe (para inicialización)
     */
    static async crearCategoriaSiNoExiste(categoriaData) {
        try {
            const { nombre, tipo, descripcion } = categoriaData;

            // Verificar si la categoría ya existe
            const [categoriasExistentes] = await ejecutarConsulta(
                'SELECT id FROM categorias_inventario WHERE nombre = ?',
                [nombre]
            );

            if (categoriasExistentes.length > 0) {
                return categoriasExistentes[0].id;
            }

            // Crear nueva categoría
            const [resultado] = await ejecutarConsulta(
                'INSERT INTO categorias_inventario (nombre, tipo, descripcion) VALUES (?, ?, ?)',
                [nombre, tipo, descripcion]
            );

            return resultado.insertId;

        } catch (error) {
            console.error('Error en ModeloInventario.crearCategoriaSiNoExiste:', error.message);
            throw error;
        }
    }

    /**
     * Métodos auxiliares privados
     */

    /**
     * Generar código QR único
     */
    static async generarCodigoQRUnico() {
        try {
            let codigoUnico = false;
            let codigoQR;
            let intentos = 0;
            const maxIntentos = 10;

            while (!codigoUnico && intentos < maxIntentos) {
                // Generar código alfanumérico único
                codigoQR = 'UMSA-' + Math.random().toString(36).substr(2, 9).toUpperCase();
                
                // Verificar que no exista
                const itemExistente = await this.obtenerItemPorQR(codigoQR);
                if (!itemExistente) {
                    codigoUnico = true;
                }
                
                intentos++;
            }

            if (!codigoUnico) {
                throw new Error('No se pudo generar un código QR único después de varios intentos');
            }

            return codigoQR;

        } catch (error) {
            console.error('Error en ModeloInventario.generarCodigoQRUnico:', error.message);
            throw error;
        }
    }

    /**
     * Generar imagen QR y guardar en sistema de archivos
     */
    static async generarImagenQR(codigoQR, itemId) {
        try {
            const qrCode = QRCode.image(codigoQR, { type: 'png' });
            const qrPath = path.join(process.env.QR_CODES_PATH || './public/qr-codes', `inventario_${itemId}.png`);
            
            // Crear directorio si no existe
            const dir = path.dirname(qrPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true, mode: 0o777 });
            }

            // Guardar imagen
            const writeStream = fs.createWriteStream(qrPath);
            qrCode.pipe(writeStream);

            // Esperar a que termine de escribir
            return new Promise((resolve, reject) => {
                writeStream.on('finish', () => {
                    resolve(`/qr-codes/inventario_${itemId}.png`);
                });
                writeStream.on('error', (error) => {
                    reject(error);
                });
            });

        } catch (error) {
            console.error('Error en ModeloInventario.generarImagenQR:', error.message);
            throw error;
        }
    }

    /**
     * Calcular estado del stock
     */
    static calcularEstadoStock(stockActual, stockMinimo) {
        if (stockActual <= stockMinimo) {
            return 'BAJO';
        } else if (stockActual <= stockMinimo * 2) {
            return 'MEDIO';
        } else {
            return 'OPTIMO';
        }
    }

    /**
     * Registrar movimiento de inventario
     */
    static async registrarMovimiento(itemId, tipo, cantidad, stockAnterior, stockActual, motivo, referenciaId = null, usuarioId = 1) {
        try {
            await ejecutarConsulta(
                `INSERT INTO movimientos_inventario 
                 (item_id, tipo_movimiento, cantidad, stock_anterior, stock_actual, motivo, referencia_id, usuario_id) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [itemId, tipo, cantidad, stockAnterior, stockActual, motivo, referenciaId, usuarioId]
            );

        } catch (error) {
            console.error('Error registrando movimiento de inventario:', error.message);
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
            console.error('Error registrando auditoría de inventario:', error.message);
        }
    }

    /**
     * Obtener estadísticas del inventario
     */
    static async obtenerEstadisticas() {
        try {
            const [estadisticas] = await ejecutarConsulta(`
                SELECT 
                    COUNT(*) as total_items,
                    SUM(CASE WHEN i.activo = TRUE THEN 1 ELSE 0 END) as items_activos,
                    SUM(i.stock_actual) as stock_total,
                    SUM(CASE WHEN i.stock_actual <= i.stock_minimo THEN 1 ELSE 0 END) as items_stock_bajo,
                    SUM(CASE WHEN i.stock_actual = 0 THEN 1 ELSE 0 END) as items_sin_stock,
                    COUNT(DISTINCT i.categoria_id) as categorias_activas,
                    AVG(i.precio_unitario) as precio_promedio
                FROM items_inventario i
                WHERE i.activo = TRUE
            `);

            const [distribucionCategorias] = await ejecutarConsulta(`
                SELECT c.tipo, COUNT(i.id) as cantidad_items, SUM(i.stock_actual) as stock_total
                FROM categorias_inventario c 
                LEFT JOIN items_inventario i ON c.id = i.categoria_id AND i.activo = TRUE
                GROUP BY c.tipo
                ORDER BY cantidad_items DESC
            `);

            const [movimientosRecientes] = await ejecutarConsulta(`
                SELECT m.tipo_movimiento, COUNT(*) as cantidad, DATE(m.creado_en) as fecha
                FROM movimientos_inventario m 
                WHERE m.creado_en >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                GROUP BY m.tipo_movimiento, DATE(m.creado_en)
                ORDER BY fecha DESC, m.tipo_movimiento
            `);

            return {
                general: estadisticas[0],
                por_categoria: distribucionCategorias,
                movimientos_recientes: movimientosRecientes
            };

        } catch (error) {
            console.error('Error en ModeloInventario.obtenerEstadisticas:', error.message);
            throw error;
        }
    }

    /**
     * Obtener total de ítems (para estadísticas del sistema)
     */
    static async obtenerTotalItems() {
        try {
            const [resultado] = await ejecutarConsulta(
                'SELECT COUNT(*) as total FROM items_inventario WHERE activo = TRUE'
            );

            return resultado[0].total;

        } catch (error) {
            console.error('Error en ModeloInventario.obtenerTotalItems:', error.message);
            throw error;
        }
    }

    /**
     * Buscar ítems por término
     */
    static async buscarItems(termino, limite = 10) {
        try {
            const [items] = await ejecutarConsulta(
                `SELECT i.id, i.nombre, i.codigo_qr, i.stock_actual, i.stock_minimo,
                        c.nombre as categoria_nombre, c.tipo as categoria_tipo
                 FROM items_inventario i 
                 INNER JOIN categorias_inventario c ON i.categoria_id = c.id 
                 WHERE i.activo = TRUE 
                 AND (i.nombre LIKE ? OR i.descripcion LIKE ? OR i.codigo_qr LIKE ?)
                 ORDER BY i.nombre
                 LIMIT ?`,
                [`%${termino}%`, `%${termino}%`, `%${termino}%`, limite]
            );

            // Calcular estados de stock
            items.forEach(item => {
                item.estado_stock = this.calcularEstadoStock(item.stock_actual, item.stock_minimo);
                item.necesita_reposicion = item.stock_actual <= item.stock_minimo;
            });

            return items;

        } catch (error) {
            console.error('Error en ModeloInventario.buscarItems:', error.message);
            throw error;
        }
    }

    /**
     * Obtener valor total del inventario
     */
    static async obtenerValorTotalInventario() {
        try {
            const [resultado] = await ejecutarConsulta(`
                SELECT SUM(i.stock_actual * COALESCE(i.precio_unitario, 0)) as valor_total
                FROM items_inventario i 
                WHERE i.activo = TRUE AND i.precio_unitario IS NOT NULL
            `);

            return resultado[0].valor_total || 0;

        } catch (error) {
            console.error('Error en ModeloInventario.obtenerValorTotalInventario:', error.message);
            throw error;
        }
    }

    /**
     * Desactivar item (eliminación lógica)
     */
    static async desactivarItem(id) {
        try {
            const item = await this.obtenerItemPorId(id);
            if (!item) {
                throw new Error('Item no encontrado');
            }

            await ejecutarConsulta(
                'UPDATE items_inventario SET activo = FALSE WHERE id = ?',
                [id]
            );

            return true;

        } catch (error) {
            console.error('Error en ModeloInventario.desactivarItem:', error.message);
            throw error;
        }
    }

    /**
     * Obtener proveedores (tabla no existe en BD actual, retornar array vacío)
     */
    static async obtenerProveedores() {
        try {
            // Verificar existencia de la tabla en el schema para evitar errores/logs
            const [existe] = await ejecutarConsulta(
                `SELECT COUNT(*) as existe
                 FROM information_schema.tables
                 WHERE table_schema = DATABASE() AND table_name = 'proveedores'`
            );

            if (!existe[0] || existe[0].existe === 0) {
                // No existe: retornar lista vacía sin disparar error
                return [];
            }

            const [proveedores] = await ejecutarConsulta(
                'SELECT * FROM proveedores WHERE activo = TRUE ORDER BY nombre'
            );
            return proveedores;

        } catch (error) {
            // No registrar como error crítico para no ensuciar logs si la tabla no existiera
            return [];
        }
    }

    // Alias para compatibilidad con controllers
    static async actualizar(id, datosActualizacion) {
        return this.actualizarItem(id, datosActualizacion);
    }

    static async obtenerCategorias() {
        return this.obtenerTodasCategorias();
    }
}

module.exports = ModeloInventario;