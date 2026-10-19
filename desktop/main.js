const { app, BrowserWindow, ipcMain, globalShortcut, Tray, Menu, nativeImage } = require('electron');
const path = require('path');

let mainWindow = null;
let tray = null;
const isDev = process.argv.includes('--dev') || process.env.NODE_ENV === 'development';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 940,
    minHeight: 600,
    frame: false, // Frameless custom dark window
    backgroundColor: '#0B0C14',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../web/dist/index.html'));
  }

  // Register Global Keyboard Media Keys
  registerGlobalMediaKeys();

  // Create System Tray
  createSystemTray();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function registerGlobalMediaKeys() {
  globalShortcut.register('MediaPlayPause', () => {
    if (mainWindow) mainWindow.webContents.send('media-command', 'toggle-play');
  });

  globalShortcut.register('MediaNextTrack', () => {
    if (mainWindow) mainWindow.webContents.send('media-command', 'next-track');
  });

  globalShortcut.register('MediaPreviousTrack', () => {
    if (mainWindow) mainWindow.webContents.send('media-command', 'prev-track');
  });

  globalShortcut.register('MediaStop', () => {
    if (mainWindow) mainWindow.webContents.send('media-command', 'stop');
  });
}

function createSystemTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, '../web/public/brand/logo.svg'));
  tray = new Tray(icon.resize({ width: 16, height: 16 }));

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Audira Music', enabled: false },
    { type: 'separator' },
    {
      label: 'Play / Pause',
      click: () => mainWindow?.webContents.send('media-command', 'toggle-play')
    },
    {
      label: 'Next Track',
      click: () => mainWindow?.webContents.send('media-command', 'next-track')
    },
    {
      label: 'Previous Track',
      click: () => mainWindow?.webContents.send('media-command', 'prev-track')
    },
    { type: 'separator' },
    {
      label: 'Show / Hide Audira',
      click: () => {
        if (mainWindow.isVisible()) mainWindow.hide();
        else {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Audira Music Player');
  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// Window IPC Handlers
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});

// Update Discord Rich Presence / OS Status
ipcMain.on('update-track-status', (event, track) => {
  if (tray && track) {
    tray.setToolTip(`Audira: ${track.title} - ${track.artist_name}`);
  }
});

app.whenReady().then(createWindow);

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
