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
      console.log('Modo producción - buscando archivos locales');
      console.log('process.resourcesPath:', process.resourcesPath);
      console.log('__dirname:', __dirname);

      let indexPath;
      if (app.isPackaged) {
        // En el empaquetado, los archivos están en resources/app/frontend/dist/frontend/
        indexPath = path.join(process.resourcesPath, 'app', 'frontend', 'dist', 'frontend', 'index.html');
        console.log('Ruta empaquetada calculada:', indexPath);

        // Verificar si existe en esta ruta
        if (fs.existsSync(indexPath)) {
          console.log('✅ Archivo encontrado en ruta empaquetada');
        } else {
          console.log('❌ Archivo NO encontrado en ruta empaquetada');

          // Intentar otras rutas posibles
          const possiblePaths = [
            path.join(process.resourcesPath, 'frontend', 'dist', 'frontend', 'index.html'),
            path.join(process.resourcesPath, 'app', 'frontend', 'dist', 'index.html'),
            path.join(process.resourcesPath, 'frontend', 'dist', 'index.html'),
            path.join(process.resourcesPath, 'index.html')
          ];

          for (const testPath of possiblePaths) {
            if (fs.existsSync(testPath)) {
              console.log('✅ Archivo encontrado en ruta alternativa:', testPath);
              indexPath = testPath;
              break;
            } else {
              console.log('❌ No encontrado en:', testPath);
            }
          }

          // Listar contenido del directorio resources para debug
          try {
            console.log('Contenido de process.resourcesPath:');
            const resourcesContent = fs.readdirSync(process.resourcesPath);
            resourcesContent.forEach(item => {
              console.log('  -', item);
              if (item === 'app') {
                console.log('  Contenido de app/:');
                const appContent = fs.readdirSync(path.join(process.resourcesPath, 'app'));
                appContent.forEach(subItem => {
                  console.log('    -', subItem);
                  if (subItem === 'frontend') {
                    console.log('    Contenido de frontend/:');
                    const frontendContent = fs.readdirSync(path.join(process.resourcesPath, 'app', 'frontend'));
                    frontendContent.forEach(frontItem => {
                      console.log('      -', frontItem);
                    });
                  }
                });
              }
            });
          } catch (e) {
            console.error('Error al listar directorio:', e.message);
          }
        }
      } else {
        // En desarrollo empaquetado local
        indexPath = path.join(__dirname, '..', 'frontend', 'dist', 'frontend', 'index.html');
        console.log('Ruta desarrollo calculada:', indexPath);
      }

      console.log('Ruta final a cargar:', indexPath);
      console.log('¿Archivo existe?', fs.existsSync(indexPath));

      // Verificar que el archivo existe
      if (fs.existsSync(indexPath)) {
        console.log('Archivo encontrado, cargando...');
        mainWindow.loadFile(indexPath);
      } else {
        console.error('Archivo NO encontrado:', indexPath);
        mainWindow.loadURL('data:text/html,<h1>Error: Frontend no encontrado</h1><p>Archivo esperado: ' + indexPath + '</p><p>Revisa los logs de consola para más detalles sobre la estructura de archivos.</p>');
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
