# Electron wrapper - UMSA Transporte

Instrucciones rápidas para ejecutar la aplicación como escritorio usando Electron.

1) Requisitos
- Node.js 18+
- Instalar dependencias en la raíz:

```bash
cd /ruta/al/proyecto/umsa-transporte
npm install
```

También se instalarán las dependencias de `backend` y `frontend` por separado cuando las uses.

2) Modo desarrollo (recomendado durante el desarrollo)
- Este modo lanza `backend` y `frontend` en dev servers y luego abre Electron apuntando a `http://localhost:4200`.

```bash
# Desde la raíz del proyecto
ELECTRON_START_BACKEND=true npm run electron:dev
```

3) Modo producción (estático)
- Construye el frontend y luego lanza Electron que cargará los archivos estáticos.

```bash
# Desde la raíz
npm run electron:build-frontend
# Finalmente (modo producción)
npm run electron:prod
```

4) Empaquetado
- Para empaquetar la app (Windows / macOS / Linux) recomendamos usar `electron-builder` o `electron-forge`.
- Añade un script y configuración específica según la herramienta elegida.

5) Notas
- En este primer esqueleto la comunicación entre UI y backend usa HTTP como en la versión web. Si quieres comunicación directa por IPC (más segura), puedo añadir canales con `ipcMain`/`ipcRenderer` y exponer funciones en `preload.js`.
