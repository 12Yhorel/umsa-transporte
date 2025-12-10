#!/bin/bash

# Script para iniciar el servidor backend con logs detallados
# Universidad Mayor de San Andrés - Sistema de la Unidad de Transporte

echo "🚀 Iniciando servidor backend UMSA Transporte..."
echo ""

# Verificar si hay procesos anteriores
if [ -f "../backend.pid" ]; then
    OLD_PID=$(cat ../backend.pid)
    if ps -p $OLD_PID > /dev/null 2>&1; then
        echo "⚠️  Proceso anterior detectado (PID: $OLD_PID)"
        echo "   Deteniendo proceso anterior..."
        kill $OLD_PID 2>/dev/null
        sleep 1
    fi
    rm -f ../backend.pid
fi

# Limpiar pantalla
clear

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   UMSA TRANSPORTE - SERVIDOR BACKEND"
echo "   Puerto: 3001"
echo "   Ambiente: development"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Ejecutar servidor
NODE_ENV=development node server.js

# Capturar código de salida
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ Servidor detenido correctamente"
else
    echo ""
    echo "❌ Servidor detenido con errores (código: $EXIT_CODE)"
fi

exit $EXIT_CODE
