#!/bin/bash

# Script para regenerar todos los códigos QR del inventario
# Este script se conecta a la base de datos y regenera los códigos QR
# de todos los items del inventario

echo "🔄 Iniciando regeneración de códigos QR..."
echo ""

# Cargar variables de entorno
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✅ Variables de entorno cargadas"
else
    echo "❌ Archivo .env no encontrado"
    exit 1
fi

# Verificar directorio
QR_DIR="./public/qr-codes"
if [ ! -d "$QR_DIR" ]; then
    echo "📁 Creando directorio $QR_DIR..."
    mkdir -p "$QR_DIR"
    chmod 755 "$QR_DIR"
fi

echo "📊 Conectando a base de datos..."
echo ""

# Obtener todos los items con sus códigos QR
node -e "
const mysql = require('mysql2/promise');
const QRCode = require('qr-image');
const fs = require('fs');
const path = require('path');

async function regenerarQRs() {
    let conexion;
    try {
        conexion = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'gestion_transporte_umsa',
        });

        console.log('✅ Conectado a la base de datos');
        console.log('');

        const [items] = await conexion.execute(
            'SELECT id, codigo_qr, nombre FROM items_inventario WHERE activo = TRUE ORDER BY id'
        );

        console.log(\`📦 Items encontrados: \${items.length}\`);
        console.log('');

        let generados = 0;
        let errores = 0;

        for (const item of items) {
            try {
                const qrPath = path.join(__dirname, 'public', 'qr-codes', \`inventario_\${item.id}.png\`);
                
                await new Promise((resolve, reject) => {
                    const qrCode = QRCode.image(item.codigo_qr, { type: 'png', size: 10 });
                    const writeStream = fs.createWriteStream(qrPath, { mode: 0o644 });
                    
                    qrCode.pipe(writeStream);
                    
                    writeStream.on('finish', () => {
                        generados++;
                        console.log(\`  ✅ [\${generados}/\${items.length}] QR generado: \${item.nombre.substring(0, 40)}\`);
                        resolve();
                    });
                    
                    writeStream.on('error', reject);
                    qrCode.on('error', reject);
                });
            } catch (error) {
                errores++;
                console.error(\`  ❌ Error con item \${item.id}: \${error.message}\`);
            }
        }

        console.log('');
        console.log('📊 Resumen:');
        console.log(\`  ✅ Generados: \${generados}\`);
        console.log(\`  ❌ Errores: \${errores}\`);
        console.log(\`  📦 Total: \${items.length}\`);
        console.log('');
        console.log('✅ Proceso completado');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        if (conexion) await conexion.end();
    }
}

regenerarQRs();
"

echo ""
echo "🎉 ¡Regeneración completada!"
