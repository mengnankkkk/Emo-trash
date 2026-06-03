import { BrowserWindow, ipcMain } from 'electron'
import {
  emotionAnalysisInputSchema,
  emoTrashChannels,
  emotionStatsRangeSchema,
  emotionTagSchema,
  emotionTimelineQuerySchema,
  pickFlowerInputSchema,
  plantSeedInputSchema,
  releaseEmotionInputSchema,
  shakeWindowInputSchema,
  waterFlowerInputSchema
} from '../../preload/api'
import { getDatabase } from '../db'
import { CurrencyRepository } from '../db/repositories/currencyRepository'
import { DecorationBattleRepository } from '../db/repositories/decorationBattleRepository'
import { EmotionRepository } from '../db/repositories/emotionRepository'
import { GardenLandRepository } from '../db/repositories/gardenLandRepository'
import { SeedInventoryRepository } from '../db/repositories/seedInventoryRepository'
import { EmotionAnalysisService } from '../services/emotionAnalysisService'
import { ReleaseService } from '../services/releaseService'
import { WindowEffectService } from '../services/windowEffectService'

interface RegisterEmotionIpcOptions {
  getWindow: () => BrowserWindow | null
}

export function registerEmotionIpc({ getWindow }: RegisterEmotionIpcOptions): void {
  const database = getDatabase()
  const emotionRepository = new EmotionRepository(database)
  const decorationBattleRepository = new DecorationBattleRepository(database)
  const gardenLandRepository = new GardenLandRepository(database)
  const currencyRepository = new CurrencyRepository(database)
  const seedInventoryRepository = new SeedInventoryRepository(database)
  const emotionAnalysisService = new EmotionAnalysisService()
  const releaseService = new ReleaseService(
    emotionRepository,
    decorationBattleRepository,
    currencyRepository,
    seedInventoryRepository,
    emotionAnalysisService
  )
  const windowEffectService = new WindowEffectService()

  ipcMain.handle(emoTrashChannels.analyzeEmotion, async (_event, payload) => {
    const input = emotionAnalysisInputSchema.parse(payload)
    return emotionAnalysisService.analyze(input.text)
  })

  ipcMain.handle(emoTrashChannels.releaseEmotion, (_event, payload) => {
    const input = releaseEmotionInputSchema.parse(payload)
    return releaseService.releaseEmotion(input)
  })

  ipcMain.handle(emoTrashChannels.listGarden, () => releaseService.listGarden())

  ipcMain.handle(emoTrashChannels.waterFlower, (_event, payload) => {
    const input = waterFlowerInputSchema.parse(payload)
    return releaseService.waterFlower(input.flowerId)
  })

  ipcMain.handle(emoTrashChannels.pickFlower, (_event, payload) => {
    const input = pickFlowerInputSchema.parse(payload)
    return releaseService.pickFlower(input.flowerId)
  })

  ipcMain.handle(emoTrashChannels.getEmotionStats, (_event, payload) => {
    const rangeDays = emotionStatsRangeSchema.parse(payload)
    return releaseService.getEmotionStats(rangeDays)
  })

  ipcMain.handle(emoTrashChannels.getGardenGrowth, () => releaseService.getGardenGrowth())
  ipcMain.handle(emoTrashChannels.getAchievements, () => releaseService.getAchievements())
  ipcMain.handle(emoTrashChannels.getFlowerDex, () => releaseService.getFlowerDex())
  ipcMain.handle(emoTrashChannels.getTitles, () => releaseService.getTitles())

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

  ipcMain.handle(emoTrashChannels.getEmotionBattleStats, () => {
    return releaseService.getEmotionBattleStats()
  })

  ipcMain.handle(emoTrashChannels.getDecorationSummary, () => {
    return releaseService.getDecorationSummary()
  })

  ipcMain.handle(emoTrashChannels.placeDecoration, (_event, payload) => {
    const { type, positionX, positionY } = payload
    return releaseService.placeDecoration(type, positionX, positionY)
  })

  ipcMain.handle(emoTrashChannels.movePlacedDecoration, (_event, payload) => {
    const { placedId, positionX, positionY } = payload
    return releaseService.movePlacedDecoration(placedId, positionX, positionY)
  })

  ipcMain.handle(emoTrashChannels.removePlacedDecoration, (_event, payload) => {
    const { placedId } = payload
    releaseService.removePlacedDecoration(placedId)
    return { success: true }
  })

  ipcMain.handle(emoTrashChannels.purchaseDecoration, (_event, payload) => {
    const { type } = payload
    return releaseService.purchaseDecoration(type)
  })

  ipcMain.handle(emoTrashChannels.getGardenLands, () => gardenLandRepository.getAllLands())

  ipcMain.handle(emoTrashChannels.unlockGardenLand, (_event, payload) => {
    const { gridX, gridY } = payload

    if (gardenLandRepository.isLandUnlocked(gridX, gridY)) {
      return { success: false, message: '该土地已经解锁', balance: currencyRepository.getBalance() }
    }

    const price = gardenLandRepository.getUnlockPrice()
    const result = currencyRepository.spendCurrency(price, `解锁土地(${gridX},${gridY})`)

    if (!result) {
      return { success: false, message: '金币不足', balance: currencyRepository.getBalance() }
    }

    const unlocked = gardenLandRepository.unlockLand(gridX, gridY)
    if (!unlocked) {
      currencyRepository.addCurrency(price, '退还：解锁土地失败')
      return { success: false, message: '解锁失败', balance: currencyRepository.getBalance() }
    }

    return { success: true, balance: result.balance, coinsSpent: price }
  })

  ipcMain.handle(emoTrashChannels.getCurrencyBalance, () => {
    return { balance: releaseService.getCurrencyBalance() }
  })

  ipcMain.handle(emoTrashChannels.getCurrencyTransactions, (_event, payload) => {
    const limit = payload?.limit ?? 50
    return releaseService.getCurrencyTransactions(limit)
  })

  ipcMain.handle(emoTrashChannels.getSeedInventory, () => releaseService.getSeedInventory())
  ipcMain.handle(emoTrashChannels.getTotalSeedCount, () => ({ count: releaseService.getTotalSeedCount() }))

  ipcMain.handle(emoTrashChannels.plantSeed, (_event, payload) => {
    const input = plantSeedInputSchema.parse(payload)
    if (!gardenLandRepository.isLandUnlocked(input.gridX, input.gridY)) {
      return {
        success: false,
        message: '这块土地还没有解锁',
        garden: releaseService.listGarden()
      }
    }

    return releaseService.plantSeed(input.emotionTag, input.rarity, input.gridX, input.gridY)
  })
}
