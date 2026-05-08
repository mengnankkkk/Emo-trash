import { ElectronAPI } from '@electron-toolkit/preload'
import type { EmoTrashApi } from './api'

declare global {
  interface Window {
    electron: ElectronAPI
    api: EmoTrashApi
  }
}
