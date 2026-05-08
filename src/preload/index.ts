import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { emoTrashChannels } from './api'
import type { EmoTrashApi, ReleaseEmotionInput, ShakeWindowInput } from './api'

const api: EmoTrashApi = {
  releaseEmotion(input: ReleaseEmotionInput) {
    return ipcRenderer.invoke(emoTrashChannels.releaseEmotion, input)
  },
  listGarden() {
    return ipcRenderer.invoke(emoTrashChannels.listGarden)
  },
  triggerShake(input?: Partial<ShakeWindowInput>) {
    return ipcRenderer.invoke(emoTrashChannels.triggerShake, input ?? {})
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore: 仅用于关闭 contextIsolation 的开发兜底分支。
  window.electron = electronAPI
  // @ts-ignore: 仅用于关闭 contextIsolation 的开发兜底分支。
  window.api = api
}
