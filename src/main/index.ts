import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join } from 'path'
import { SessionManager } from './discovery/SessionManager'
import { TrayManager } from './tray/TrayManager'

let mainWindow: BrowserWindow | null = null
let sessionManager: SessionManager | null = null
let trayManager: TrayManager | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    minWidth: 600,
    minHeight: 400,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 10 },
    backgroundColor: '#1a1a2e',
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // In dev, load from Vite dev server; in prod, load built file
  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Fullscreen toggle IPC
  ipcMain.handle('toggle-fullscreen', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return
    mainWindow.setFullScreen(!mainWindow.isFullScreen())
  })

  // Tray icon
  trayManager = new TrayManager(mainWindow)
  trayManager.create()

  // Initialize session management after renderer is ready
  mainWindow.webContents.on('did-finish-load', async () => {
    if (!mainWindow) return
    sessionManager = new SessionManager(mainWindow)
    try {
      await sessionManager.initialize()
      console.log('[Visual Agents] Session manager initialized')
    } catch (err) {
      console.error('[Visual Agents] Failed to initialize session manager:', err)
    }
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', async () => {
  if (sessionManager) {
    await sessionManager.shutdown()
  }
  if (trayManager) {
    trayManager.destroy()
  }
})

export { mainWindow }
