import { BrowserWindow, ipcMain } from 'electron'
import { getDatabase } from '../db'
import { EmotionRepository } from '../db/repositories/emotionRepository'
import { ReleaseService } from '../services/releaseService'
import { WindowEffectService } from '../services/windowEffectService'
import {
  emoTrashChannels,
  emotionStatsRangeSchema,
  emotionTagSchema,
  emotionTimelineQuerySchema,
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

  ipcMain.handle(emoTrashChannels.getEmotionStats, (_event, payload) => {
    const rangeDays = emotionStatsRangeSchema.parse(payload)
    return releaseService.getEmotionStats(rangeDays)
  })

  ipcMain.handle(emoTrashChannels.getGardenGrowth, () => {
    return releaseService.getGardenGrowth()
  })

  ipcMain.handle(emoTrashChannels.listEmotionCalendar, (_event, payload) => {
    const rangeDays = Math.max(1, Math.min(365, Number(payload?.rangeDays ?? 30)))
    const emotionTags = Array.isArray(payload?.emotionTags)
      ? payload.emotionTags.map((tag: unknown) => emotionTagSchema.parse(tag))
      : []
    return releaseService.listEmotionCalendar(rangeDays, emotionTags)
  })

  ipcMain.handle(emoTrashChannels.listEmotionTimeline, (_event, payload) => {
    const query = emotionTimelineQuerySchema.parse(payload ?? {})
    return releaseService.listEmotionTimeline(query)
  })

  ipcMain.handle(emoTrashChannels.triggerShake, async (_event, payload) => {
    const input = shakeWindowInputSchema.parse(payload ?? {})
    await windowEffectService.shake(getWindow(), input)
  })
}
