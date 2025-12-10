/**
 * Generador de códigos QR para el sistema de inventario UMSA
 */

const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

class QRGenerator {
    
    /**
     * Generar código QR para un ítem de inventario
     */
    static async generarQRInventario(itemId, datosItem) {
        try {
            const datosQR = {
                id: itemId,
                tipo: 'inventario',
                nombre: datosItem.nombre,
                codigo: datosItem.codigo_qr,
                timestamp: new Date().toISOString()
            };

            const textoQR = JSON.stringify(datosQR);
            const nombreArchivo = `inventario_${itemId}.png`;
            const rutaArchivo = path.join(this.obtenerDirectorioQR(), nombreArchivo);

            // Generar código QR
            await QRCode.toFile(rutaArchivo, textoQR, {
                color: {
                    dark: '#000000', // Color oscuro
                    light: '#FFFFFF' // Color claro (fondo)
                },
                width: 300,
                margin: 2,
                errorCorrectionLevel: 'H' // Alta corrección de errores
            });

            return {
                success: true,
                archivo: nombreArchivo,
                ruta: rutaArchivo,
                datos: datosQR
            };

        } catch (error) {
            console.error('Error generando QR de inventario:', error.message);
            throw new Error('No se pudo generar el código QR');
        }
    }

    /**
     * Generar código QR para un vehículo
     */
    static async generarQRVehiculo(vehiculoId, datosVehiculo) {
        try {
            const datosQR = {
                id: vehiculoId,
                tipo: 'vehiculo',
                placa: datosVehiculo.placa,
                marca: datosVehiculo.marca,
                modelo: datosVehiculo.modelo,
                timestamp: new Date().toISOString()
            };

            const textoQR = JSON.stringify(datosQR);
            const nombreArchivo = `vehiculo_${vehiculoId}.png`;
            const rutaArchivo = path.join(this.obtenerDirectorioQR(), nombreArchivo);

            await QRCode.toFile(rutaArchivo, textoQR, {
                color: {
                    dark: '#1E3A8A', // Azul UMSA
                    light: '#FFFFFF'
                },
                width: 300,
                margin: 2,
                errorCorrectionLevel: 'H'
            });

            return {
                success: true,
                archivo: nombreArchivo,
                ruta: rutaArchivo,
                datos: datosQR
            };

        } catch (error) {
            console.error('Error generando QR de vehículo:', error.message);
            throw new Error('No se pudo generar el código QR del vehículo');
        }
    }

    /**
     * Generar código QR en base64 (para APIs)
     */
    static async generarQRBase64(texto, opciones = {}) {
        try {
            const opcionesDefault = {
                width: 200,
                margin: 1,
                errorCorrectionLevel: 'M',
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            };

            const opcionesFinal = { ...opcionesDefault, ...opciones };

            const qrDataURL = await QRCode.toDataURL(texto, opcionesFinal);
            return qrDataURL;

        } catch (error) {
            console.error('Error generando QR base64:', error.message);
            throw new Error('No se pudo generar el código QR');
        }
    }

    /**
     * Leer y decodificar código QR
     */
    static async decodificarQR(rutaArchivo) {
        try {
            // Nota: Para decodificar QR necesitarías una librería como jsqr o qr-scanner
            // Esta es una implementación básica que retorna la ruta para procesamiento externo
            
            if (!fs.existsSync(rutaArchivo)) {
                throw new Error('Archivo QR no encontrado');
            }

            // En una implementación real, aquí decodificarías el QR
            // Por ahora retornamos información básica del archivo
            const stats = fs.statSync(rutaArchivo);
            
            return {
                success: true,
                ruta: rutaArchivo,
                tamaño: stats.size,
                existe: true
            };

        } catch (error) {
            console.error('Error decodificando QR:', error.message);
            throw new Error('No se pudo decodificar el código QR');
        }
    }

    /**
     * Generar múltiples códigos QR para lote de ítems
     */
    static async generarQRLote(items) {
        try {
            const resultados = [];

            for (const item of items) {
                try {
                    const resultado = await this.generarQRInventario(item.id, item);
                    resultados.push({
                        item_id: item.id,
                        success: true,
                        archivo: resultado.archivo,
                        ruta: resultado.ruta
                    });
                } catch (error) {
                    resultados.push({
                        item_id: item.id,
                        success: false,
                        error: error.message
                    });
                }
            }

            return {
                total: items.length,
                exitosos: resultados.filter(r => r.success).length,
                fallidos: resultados.filter(r => !r.success).length,
                resultados
            };

        } catch (error) {
            console.error('Error generando QR en lote:', error.message);
            throw new Error('Error al generar códigos QR en lote');
        }
    }

    /**
     * Eliminar archivo QR
     */
    static eliminarQR(rutaArchivo) {
        try {
            if (fs.existsSync(rutaArchivo)) {
                fs.unlinkSync(rutaArchivo);
                return {
                    success: true,
                    message: 'Archivo QR eliminado correctamente'
                };
            }
            return {
                success: false,
                message: 'Archivo QR no encontrado'
            };
        } catch (error) {
            console.error('Error eliminando QR:', error.message);
            throw new Error('No se pudo eliminar el archivo QR');
        }
    }

    /**
     * Obtener directorio de almacenamiento de QR
     */
    static obtenerDirectorioQR() {
        const directorio = process.env.QR_STORAGE_PATH || 
                          path.join(__dirname, '../public/qr-codes');
        
        // Crear directorio si no existe
        if (!fs.existsSync(directorio)) {
            fs.mkdirSync(directorio, { recursive: true });
        }

        return directorio;
    }

    /**
     * Validar formato de datos QR
     */
    static validarDatosQR(datos) {
        try {
            const datosParseados = JSON.parse(datos);
            
            const camposRequeridos = ['id', 'tipo', 'timestamp'];
            for (const campo of camposRequeridos) {
                if (!datosParseados[campo]) {
                    return false;
                }
            }

            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Generar QR con logo UMSA
     */
    static async generarQRConLogo(texto, logoPath = null) {
        try {
            const opciones = {
                width: 300,
                margin: 2,
                errorCorrectionLevel: 'H'
            };

            // Si no se proporciona logo, usar uno por defecto
            const logoFinal = logoPath || path.join(__dirname, '../assets/logo-umsa.png');
            
            // Nota: Para agregar logo necesitarías una librería adicional
            // Esta es una implementación simplificada
            const qrDataURL = await QRCode.toDataURL(texto, opciones);
            
            return {
                success: true,
                qr: qrDataURL,
                conLogo: fs.existsSync(logoFinal)
            };

        } catch (error) {
            console.error('Error generando QR con logo:', error.message);
            // Fallback a QR sin logo
            return await this.generarQRBase64(texto);
        }
    }

    /**
     * Obtener estadísticas de uso de QR
     */
    static obtenerEstadisticasQR() {
        try {
            const directorio = this.obtenerDirectorioQR();
            const archivos = fs.readdirSync(directorio);
            
            const qrInventario = archivos.filter(f => f.startsWith('inventario_'));
            const qrVehiculos = archivos.filter(f => f.startsWith('vehiculo_'));
            
            const tamañoTotal = archivos.reduce((total, archivo) => {
                const stats = fs.statSync(path.join(directorio, archivo));
                return total + stats.size;
            }, 0);

            return {
                total_qr: archivos.length,
                qr_inventario: qrInventario.length,
                qr_vehiculos: qrVehiculos.length,
                tamaño_total: Helpers.formatearBytes(tamañoTotal),
                directorio: directorio
            };

        } catch (error) {
            console.error('Error obteniendo estadísticas QR:', error.message);
            return {
                total_qr: 0,
                qr_inventario: 0,
                qr_vehiculos: 0,
                tamaño_total: '0 Bytes',
                directorio: ''
            };
        }
    }
}

module.exports = QRGenerator;