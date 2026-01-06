# Electron wrapper - UMSA Transporte

Instrucciones rápidas para ejecutar la aplicación como escritorio usando Electron.

## 🔧 Solución para Pantalla en Blanco

Si ves una pantalla en blanco al ejecutar la aplicación empaquetada:

### 1. Verificar Build del Frontend
Asegúrate de que el frontend esté construido correctamente:
```bash
cd frontend
npm run build
```
Debe crear la carpeta `dist/umsa-transporte-frontend/`

### 2. Verificar Backend
El backend se inicia automáticamente. Revisa la consola de Electron (F12) para ver logs del backend.

### 3. Problemas Comunes
- **Archivo no encontrado**: Verifica que `frontend/dist/umsa-transporte-frontend/index.html` existe
- **Backend no inicia**: Revisa permisos de ejecución en `backend/server.js`
- **BD no conecta**: Asegúrate de que MySQL esté corriendo en puerto 3306

## 📁 Icono de la Aplicación

Para personalizar el icono:

1. Crea un archivo `icon.ico` (256x256 recomendado)
2. Colócalo en `electron/assets/icon.ico`
3. Actualiza `package.json`:
   ```json
   "win": {
     "icon": "electron/assets/icon.ico"
   },
   "nsis": {
     "installerIcon": "electron/assets/icon.ico",
     "uninstallerIcon": "electron/assets/icon.ico",
     "installerHeaderIcon": "electron/assets/icon.ico"
   }
   ```

## 🚀 Modos de Ejecución

### Desarrollo
```bash
# Arranca backend + frontend + Electron
ELECTRON_START_BACKEND=true npm run electron:dev
```

### Producción (Archivos Locales)
```bash
# Construye y ejecuta
npm run electron:prod
```

### Empaquetado
```bash
# Genera instalador .exe
npm run dist:win
```

## 🐛 Debug

- Abre DevTools con F12
- Revisa logs en consola
- Verifica rutas de archivos con `console.log(process.resourcesPath)`

## 📋 Checklist Pre-Empaquetado

- [ ] Frontend construido (`npm run build`)
- [ ] Backend probado (`npm start` en backend/)
- [ ] Base de datos configurada
- [ ] Icono agregado (opcional)
- [ ] `package.json` actualizado con configuración de build

## 📋 Requisitos
- Node.js 18+
- Instalar dependencias en la raíz:

```bash
cd /ruta/al/proyecto/umsa-transporte
npm install
```

También se instalarán las dependencias de `backend` y `frontend` por separado cuando las uses.
