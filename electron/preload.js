const { contextBridge } = require('electron');

try {
  // Exponer APIs seguras al renderer process
  contextBridge.exposeInMainWorld('electronAPI', {
    platform: () => process.platform,
    arch: () => process.arch,
    // Aquí se pueden añadir métodos seguros para IPC en el futuro
  });

  console.log('✅ Preload script cargado correctamente');
} catch (error) {
  console.error('❌ Error en preload script:', error);
}