const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let backendProcess = null;

function startBackendIfRequested() {
  // Si la variable ELECTRON_START_BACKEND=true, arrancamos el backend como proceso hijo
  if (process.env.ELECTRON_START_BACKEND === 'true') {
    const backendEntry = path.join(__dirname, '..', 'backend', 'server.js');
    backendProcess = spawn(process.execPath, [backendEntry], {
      stdio: 'inherit',
      env: { ...process.env }
    });

    backendProcess.on('error', (err) => {
      console.error('Error al iniciar backend hijo:', err);
    });

    backendProcess.on('close', (code) => {
      console.log(`Backend hijo finalizó con código ${code}`);
    });
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env.ELECTRON_DEV === 'true') {
    win.loadURL('http://localhost:4200');
    win.webContents.openDevTools();
  } else {
    // Ruta esperada del build de Angular
    const indexPath = path.join(__dirname, '..', 'frontend', 'dist', 'umsa-transporte-frontend', 'index.html');
    win.loadFile(indexPath);
  }
}

app.whenReady().then(() => {
  startBackendIfRequested();
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
  if (process.platform !== 'darwin') app.quit();
});
