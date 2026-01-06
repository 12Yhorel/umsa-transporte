const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

let backendProcess = null;
let mainWindow = null;

function startBackend() {
  try {
    console.log('Iniciando backend...');
    console.log('Directorio actual:', process.cwd());
    console.log('Directorio resources:', process.resourcesPath);
    console.log('¿Empaquetado?', app.isPackaged);

    // En producción, el backend está en el mismo directorio que main.js
    const backendPath = app.isPackaged
      ? path.join(process.resourcesPath, 'app', 'backend', 'server.js')
      : path.join(__dirname, '..', 'backend', 'server.js');

    console.log('Ruta del backend:', backendPath);

    // Verificar que el archivo existe
    if (fs.existsSync(backendPath)) {
      console.log('Archivo backend encontrado');

      backendProcess = spawn(process.execPath, [backendPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          NODE_ENV: 'production',
          PORT: '3001'
        },
        cwd: app.isPackaged
          ? path.join(process.resourcesPath, 'app', 'backend')
          : path.join(__dirname, '..', 'backend')
      });

      backendProcess.stdout.on('data', (data) => {
        console.log('Backend stdout:', data.toString());
      });

      backendProcess.stderr.on('data', (data) => {
        console.error('Backend stderr:', data.toString());
      });

      backendProcess.on('error', (err) => {
        console.error('Error al iniciar backend:', err);
      });

      backendProcess.on('close', (code) => {
        console.log(`Backend finalizó con código ${code}`);
      });
    } else {
      console.error('Archivo backend NO encontrado:', backendPath);
    }
  } catch (error) {
    console.error('Error en startBackend:', error);
  }
}

function createWindow() {
  try {
    console.log('Creando ventana principal...');

    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false
      },
      show: false // No mostrar hasta que esté listo
    });

    // Mostrar DevTools en desarrollo
    if (!app.isPackaged) {
      mainWindow.webContents.openDevTools();
    }

    if (!app.isPackaged && process.env.ELECTRON_DEV === 'true') {
      // Modo desarrollo: cargar desde dev server
      console.log('Cargando desde dev server: http://localhost:4200');
      mainWindow.loadURL('http://localhost:4200');
    } else {
      // Modo producción: cargar archivos locales
      let indexPath;
      if (app.isPackaged) {
        // En el empaquetado, los archivos están en resources/app/frontend/dist/
        indexPath = path.join(process.resourcesPath, 'app', 'frontend', 'dist', 'umsa-transporte-frontend', 'index.html');
      } else {
        // En desarrollo empaquetado local
        indexPath = path.join(__dirname, '..', 'frontend', 'dist', 'umsa-transporte-frontend', 'index.html');
      }

      console.log('Cargando archivo local:', indexPath);
      console.log('¿Archivo existe?', fs.existsSync(indexPath));

      // Verificar que el archivo existe
      if (fs.existsSync(indexPath)) {
        console.log('Archivo encontrado, cargando...');
        mainWindow.loadFile(indexPath);
      } else {
        console.error('Archivo NO encontrado:', indexPath);
        try {
          console.log('Contenido del directorio resources/app:', fs.readdirSync(path.join(process.resourcesPath, 'app')));
        } catch (e) {
          console.error('Error al leer directorio:', e.message);
        }
        mainWindow.loadURL('data:text/html,<h1>Error: Frontend no encontrado</h1><p>Archivo esperado: ' + indexPath + '</p><p>Verifica que el build del frontend se haya completado correctamente.</p>');
      }
    }

    mainWindow.once('ready-to-show', () => {
      console.log('Ventana lista, mostrando...');
      mainWindow.show();
    });

    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error('Error al cargar página:', errorCode, errorDescription);
    });

    mainWindow.webContents.on('dom-ready', () => {
      console.log('DOM listo');
    });
  } catch (error) {
    console.error('Error en createWindow:', error);
    // Crear ventana de error si falla
    const errorWindow = new BrowserWindow({
      width: 600,
      height: 400,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });
    errorWindow.loadURL('data:text/html,<h1>Error al crear ventana</h1><p>' + error.message + '</p>');
  }
}

app.whenReady().then(() => {
  console.log('App Electron lista');

  // Intentar iniciar backend (no bloquear si falla)
  try {
    startBackend();
  } catch (error) {
    console.error('Error al iniciar backend:', error);
  }

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  console.log('Cerrando aplicación...');
  if (backendProcess) {
    console.log('Terminando proceso backend...');
    backendProcess.kill();
  }
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  console.log('Aplicación cerrándose...');
  if (backendProcess) {
    backendProcess.kill();
  }
});
