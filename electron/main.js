const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

console.log('🚀 Iniciando Electron main process');

let mainWindow = null;

// Prevenir múltiples instancias de la aplicación
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
  return;
}

// Manejar segunda instancia
app.on('second-instance', (event, commandLine, workingDirectory) => {
  console.log('⚠️ Intento de abrir segunda instancia, enfocando ventana existente...');
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

function startBackend() {
  try {
    console.log('🔧 Iniciando backend...');

    const backendPath = app.isPackaged
      ? path.join(process.resourcesPath, 'app', 'backend', 'server.js')
      : path.join(__dirname, '..', 'backend', 'server.js');

    console.log('📍 Ruta del backend:', backendPath);

    if (fs.existsSync(backendPath)) {
      console.log('✅ Archivo backend encontrado');

      // Cambiar al directorio del backend para que los requires relativos funcionen
      const backendDir = path.dirname(backendPath);
      process.chdir(backendDir);
      console.log('📂 Cambiado cwd a:', backendDir);

      // Setear variables de entorno para el backend
      process.env.PORT = '3001';
      process.env.HOST = '127.0.0.1';
      process.env.NODE_ENV = 'production';

      // Ejecutar el backend en el mismo proceso
      try {
        require(backendPath);
        console.log('🎉 Backend iniciado correctamente en el mismo proceso');
      } catch (error) {
        console.error('❌ Error al cargar el backend:', error);
      }

      // Verificar que el backend esté respondiendo
      setTimeout(() => {
        checkBackendHealth();
      }, 5000); // Verificar después de 5 segundos
    } else {
      console.error('❌ Archivo backend NO encontrado:', backendPath);
    }
  } catch (error) {
    console.error('❌ Error en startBackend:', error);
  }
}

function createWindow() {
  try {
    // Prevenir múltiples ventanas
    if (mainWindow && !mainWindow.isDestroyed()) {
      console.log('⚠️  Ventana ya existe, enfocándola...');
      mainWindow.focus();
      return;
    }

    console.log('🚀 Iniciando creación de ventana...');

    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        webSecurity: false
      },
      show: false
    });

    console.log('✅ Ventana creada exitosamente');

    // SIEMPRE abrir DevTools para diagnóstico
    mainWindow.webContents.openDevTools();
    console.log('✅ DevTools abiertos');

    // Cargar una página de carga inicial
    mainWindow.loadURL(`data:text/html,<html><head><style>body{font-family:Arial,sans-serif;padding:20px;background:#f0f0f0;}h1{color:#2c3e50;}</style></head><body><h1>🚀 UMSA Transporte</h1><p>Iniciando aplicación...</p><p>Si ves esto, Electron está funcionando correctamente.</p><p><strong>IMPORTANTE:</strong> Revisa la consola (DevTools) para ver los logs de diagnóstico.</p><div id="status">Cargando...</div><script>setTimeout(()=>{document.getElementById("status").innerHTML="DevTools listos - revisa la consola para más información";},1000);</script></body></html>`);
    console.log('✅ Página de carga inicial mostrada');

    mainWindow.once('ready-to-show', () => {
      console.log('🎯 Ventana lista para mostrar');
      mainWindow.show();

      // Después de mostrar la página de carga, intentar cargar el frontend real
      setTimeout(() => {
        console.log('⏳ Intentando cargar frontend real...');
        loadFrontend();
      }, 3000); // Esperar 3 segundos
    });

    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error('❌ Error al cargar página:', errorCode, errorDescription);
    });

    mainWindow.webContents.on('dom-ready', () => {
      console.log('📄 DOM listo');
    });

  } catch (error) {
    console.error('❌ Error en createWindow:', error);
    const errorWindow = new BrowserWindow({
      width: 600,
      height: 400,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });
    errorWindow.loadURL(`data:text/html,<h1>❌ Error crítico</h1><p>${error.message}</p>`);
    errorWindow.webContents.openDevTools();
  }
}

function checkBackendHealth() {
  const http = require('http');

  console.log('🔍 Verificando estado del backend en http://127.0.0.1:3001...');

  const options = {
    hostname: '127.0.0.1',
    port: 3001,
    path: '/',
    method: 'GET',
    timeout: 3000
  };

  const req = http.request(options, (res) => {
    console.log('✅ Backend responde correctamente - Status:', res.statusCode);
  });

  req.on('error', (err) => {
    console.error('❌ Backend no responde:', err.message);
    console.log('⚠️  El backend podría no estar iniciándose correctamente');
  });

  req.on('timeout', () => {
    console.error('⏰ Timeout verificando backend');
    req.destroy();
  });

  req.end();
}

function loadFrontend() {
  try {
    console.log('🔍 Buscando archivos del frontend...');

    if (!app.isPackaged && process.env.ELECTRON_DEV === 'true') {
      console.log('🌐 Modo desarrollo - cargando desde dev server');
      mainWindow.loadURL('http://localhost:4200');
      return;
    }

    console.log('📁 Modo producción - buscando archivos locales');
    console.log('📂 process.resourcesPath:', process.resourcesPath);
    console.log('📂 __dirname:', __dirname);

    let indexPath;
    if (app.isPackaged) {
      // Primero intentar la ruta desempaquetada (sin asar)
      indexPath = path.join(process.resourcesPath, 'app', 'frontend', 'dist', 'frontend', 'index.html');
      console.log('📍 Ruta sin asar:', indexPath);

      if (!fs.existsSync(indexPath)) {
        // Si no existe, intentar la ruta empaquetada
        indexPath = path.join(process.resourcesPath, 'app.asar', 'frontend', 'dist', 'frontend', 'index.html');
        console.log('📍 Ruta con asar:', indexPath);
      }
    } else {
      // En desarrollo empaquetado local
      indexPath = path.join(__dirname, '..', 'frontend', 'dist', 'frontend', 'index.html');
      console.log('📍 Ruta desarrollo:', indexPath);
    }

    if (fs.existsSync(indexPath)) {
      console.log('✅ Archivo encontrado, cargando...');
      mainWindow.loadFile(indexPath);
    } else {
      console.error('❌ Archivo NO encontrado:', indexPath);

      // Diagnóstico completo
      console.log('=== DIAGNÓSTICO DE ARCHIVOS ===');
      try {
        function listDirectory(dirPath, prefix = '') {
          try {
            const items = fs.readdirSync(dirPath);
            items.forEach(item => {
              const fullPath = path.join(dirPath, item);
              const stats = fs.statSync(fullPath);
              const isDirectory = stats.isDirectory();
              console.log(`${prefix}${isDirectory ? '📁' : '📄'} ${item}`);

              if (isDirectory && item !== 'node_modules' && prefix.length < 30) {
                listDirectory(fullPath, prefix + '  ');
              }
            });
          } catch (e) {
            console.log(`${prefix}❌ Error: ${e.message}`);
          }
        }

        console.log('Contenido de resources:');
        listDirectory(process.resourcesPath);

      } catch (e) {
        console.error('Error en diagnóstico:', e.message);
      }

      mainWindow.loadURL(`data:text/html,<h1>❌ Frontend no encontrado</h1><p>Archivo esperado: ${indexPath}</p><p>Revisa la consola para el diagnóstico completo.</p>`);
    }

  } catch (error) {
    console.error('❌ Error en loadFrontend:', error);
    mainWindow.loadURL(`data:text/html,<h1>❌ Error al cargar frontend</h1><p>${error.message}</p>`);
  }
}

app.whenReady().then(() => {
  console.log('🎉 App Electron lista');
  console.log('📦 Is packaged:', app.isPackaged);

  // Solo iniciar backend automáticamente en versión empaquetada
  if (app.isPackaged) {
    console.log('🚀 Iniciando backend en modo empaquetado');
    try {
      startBackend();
    } catch (error) {
      console.error('❌ Error al iniciar backend:', error);
    }
  } else {
    console.log('🌐 Modo desarrollo - backend iniciado por concurrently');
  }

  createWindow();

  app.on('activate', () => {
    // Prevenir múltiples ventanas en macOS
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      // Si ya hay ventanas, enfocar la existente
      const windows = BrowserWindow.getAllWindows();
      if (windows.length > 0) {
        windows[0].focus();
      }
    }
  });
});

app.on('window-all-closed', () => {
  console.log('🔽 Cerrando aplicación...');
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  console.log('👋 Aplicación cerrándose...');
});