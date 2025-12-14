/**
 * Script de prueba para verificar generación de códigos QR
 */

const QRCode = require('qr-image');
const fs = require('fs');
const path = require('path');

async function probarGeneracionQR() {
    console.log('🧪 Iniciando prueba de generación QR...\n');

    const qrDir = path.join(__dirname, 'public', 'qr-codes');
    const qrTestPath = path.join(qrDir, 'test_qr.png');
    const codigoTest = 'UMSA-TEST-' + Date.now();

    // 1. Verificar directorio
    console.log(`📁 Verificando directorio: ${qrDir}`);
    if (!fs.existsSync(qrDir)) {
        console.log('  ⚠️  Directorio no existe, creando...');
        fs.mkdirSync(qrDir, { recursive: true, mode: 0o755 });
    }
    console.log('  ✅ Directorio OK');

    // 2. Verificar permisos de escritura
    console.log('\n🔐 Verificando permisos de escritura...');
    try {
        fs.accessSync(qrDir, fs.constants.W_OK);
        console.log('  ✅ Permisos de escritura OK');
    } catch (err) {
        console.error('  ❌ Sin permisos de escritura:', err.message);
        return;
    }

    // 3. Generar QR de prueba
    console.log('\n🎨 Generando código QR de prueba...');
    console.log(`  Código: ${codigoTest}`);
    
    return new Promise((resolve, reject) => {
        try {
            const qrCode = QRCode.image(codigoTest, { type: 'png', size: 10 });
            const writeStream = fs.createWriteStream(qrTestPath, { mode: 0o644 });
            
            qrCode.pipe(writeStream);

            writeStream.on('finish', () => {
                console.log('  ✅ QR generado exitosamente');
                
                // Verificar archivo
                if (fs.existsSync(qrTestPath)) {
                    const stats = fs.statSync(qrTestPath);
                    console.log(`\n📊 Estadísticas del archivo:`);
                    console.log(`  - Tamaño: ${stats.size} bytes`);
                    console.log(`  - Ruta: ${qrTestPath}`);
                    console.log(`  - Permisos: ${(stats.mode & parseInt('777', 8)).toString(8)}`);
                    
                    // Limpiar archivo de prueba
                    console.log('\n🧹 Limpiando archivo de prueba...');
                    fs.unlinkSync(qrTestPath);
                    console.log('  ✅ Limpieza completada');
                    
                    console.log('\n✅ ¡PRUEBA EXITOSA! La generación de QR funciona correctamente.\n');
                    resolve();
                } else {
                    console.error('  ❌ El archivo no se creó');
                    reject(new Error('Archivo QR no encontrado después de generación'));
                }
            });

            writeStream.on('error', (error) => {
                console.error('  ❌ Error escribiendo archivo:', error.message);
                reject(error);
            });

            qrCode.on('error', (error) => {
                console.error('  ❌ Error generando imagen QR:', error.message);
                reject(error);
            });
        } catch (err) {
            console.error('  ❌ Error en generación:', err.message);
            reject(err);
        }
    });
}

// Ejecutar prueba
probarGeneracionQR()
    .then(() => {
        console.log('🎉 Todas las pruebas pasaron correctamente');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Prueba fallida:', error.message);
        console.error('\n💡 Soluciones posibles:');
        console.error('  1. Verificar que qr-image esté instalado: npm install qr-image');
        console.error('  2. Verificar permisos del directorio public/qr-codes');
        console.error('  3. Ejecutar: sudo chown -R $USER:$USER backend/public/qr-codes');
        process.exit(1);
    });
