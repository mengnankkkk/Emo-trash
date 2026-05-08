import { BrowserWindow, ipcMain } from 'electron'
import { getDatabase } from '../db'
import { EmotionRepository } from '../db/repositories/emotionRepository'
import { ReleaseService } from '../services/releaseService'
import { WindowEffectService } from '../services/windowEffectService'
import {
  emoTrashChannels,
  releaseEmotionInputSchema,
  shakeWindowInputSchema
} from '../../preload/api'

interface RegisterEmotionIpcOptions {
  getWindow: () => BrowserWindow | null
}

export function registerEmotionIpc({ getWindow }: RegisterEmotionIpcOptions): void {
  const emotionRepository = new EmotionRepository(getDatabase())
  const releaseService = new ReleaseService(emotionRepository)
  const windowEffectService = new WindowEffectService()

  ipcMain.handle(emoTrashChannels.releaseEmotion, (_event, payload) => {
    const input = releaseEmotionInputSchema.parse(payload)
    return releaseService.releaseEmotion(input)
  })

  ipcMain.handle(emoTrashChannels.listGarden, () => {
    return releaseService.listGarden()
  })

  ipcMain.handle(emoTrashChannels.triggerShake, async (_event, payload) => {
    const input = shakeWindowInputSchema.parse(payload ?? {})
    await windowEffectService.shake(getWindow(), input)
  })
}
