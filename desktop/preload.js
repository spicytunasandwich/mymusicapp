const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('audiraDesktop', {
  isElectron: true,
  platform: process.platform,

  // Window Controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),

  // Media Playback Sync with OS / Global Shortcuts
  onMediaCommand: (callback) => {
    ipcRenderer.on('media-command', (event, command) => callback(command));
  },

  // Update Discord / OS Now Playing status
  updateTrackStatus: (trackInfo) => {
    ipcRenderer.send('update-track-status', trackInfo);
  }
});
