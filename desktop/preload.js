const { contextBridge, ipcRenderer } = require('electron');

// Expose safe, high-security IPC endpoints to the renderer window
contextBridge.exposeInMainWorld('electronAPI', {
  // Expose version details
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
  
  // Future IPC triggers can be registered here safely
  ping: () => ipcRenderer.invoke('ping')
});
