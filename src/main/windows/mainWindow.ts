import { BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import icon from '../../../resources/icon.png?asset'

let mainWindow: BrowserWindow | null = null

export function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1120,
    height: 820,
    minWidth: 760,
    minHeight: 680,
    show: false,
    autoHideMenuBar: true,
    title: 'Emo-trash',
    backgroundColor: '#05060a',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow = window

  window.on('ready-to-show', () => {
    window.show()
  })

  window.on('closed', () => {
    if (mainWindow === window) {
      mainWindow = null
    }
  })

  window.webContents.on('console-message', ({ level, message, lineNumber, sourceId }) => {
    const source = sourceId ? `${sourceId}:${lineNumber}` : `line ${lineNumber}`
    console.log(`[renderer:${level}] ${message} (${source})`)
  })

  window.webContents.on('render-process-gone', (_event, details) => {
    console.error('[renderer] render-process-gone', details)
  })

  window.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error('[renderer] did-fail-load', { errorCode, errorDescription, validatedURL })
  })

  window.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    window.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return window
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}
