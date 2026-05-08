import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { closeDatabase, initDatabase } from './db'
import { registerEmotionIpc } from './ipc/emotionIpc'
import { createMainWindow, getMainWindow } from './windows/mainWindow'

const testingUserDataDir = process.env.EMO_TRASH_USER_DATA_DIR

if (testingUserDataDir) {
  app.setPath('userData', testingUserDataDir)
  app.setPath('sessionData', join(testingUserDataDir, 'session-data'))
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.mengnankkkk.emo-trash')

  app.on('browser-window-created', (_event, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  initDatabase()
  registerEmotionIpc({ getWindow: getMainWindow })
  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    closeDatabase()
    app.quit()
  }
})

app.on('before-quit', () => {
  closeDatabase()
})
