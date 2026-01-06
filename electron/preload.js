const { contextBridge } = require('electron');
const os = require('os');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: () => os.platform(),
  arch: () => os.arch(),
  // Aquí se pueden añadir métodos seguros para IPC en el futuro
});
