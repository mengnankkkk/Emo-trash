import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { emoTrashChannels } from './api'
import type {
  EmotionAnalysisInput,
  EmotionStatsRange,
  EmotionTag,
  EmotionTimelineQuery,
  EmoTrashApi,
  ReleaseEmotionInput,
  ShakeWindowInput,
  PlaceDecorationInput,
  PurchaseDecorationInput,
  RemovePlacedDecorationInput
} from './api'

const api: EmoTrashApi = {
  analyzeEmotion(input: EmotionAnalysisInput) {
    return ipcRenderer.invoke(emoTrashChannels.analyzeEmotion, input)
  },
  releaseEmotion(input: ReleaseEmotionInput) {
    return ipcRenderer.invoke(emoTrashChannels.releaseEmotion, input)
  },
  listGarden() {
    return ipcRenderer.invoke(emoTrashChannels.listGarden)
  },
  waterFlower(flowerId: number) {
    return ipcRenderer.invoke(emoTrashChannels.waterFlower, { flowerId })
  },
  pickFlower(flowerId: number) {
    return ipcRenderer.invoke(emoTrashChannels.pickFlower, { flowerId })
  },
  getAchievements() {
    return ipcRenderer.invoke(emoTrashChannels.getAchievements)
  },
  getFlowerDex() {
    return ipcRenderer.invoke(emoTrashChannels.getFlowerDex)
  },
  getTitles() {
    return ipcRenderer.invoke(emoTrashChannels.getTitles)
  },
  getEmotionStats(rangeDays: EmotionStatsRange) {
    return ipcRenderer.invoke(emoTrashChannels.getEmotionStats, rangeDays)
  },
  getGardenGrowth() {
    return ipcRenderer.invoke(emoTrashChannels.getGardenGrowth)
  },
  listEmotionCalendar(rangeDays: number, emotionTags: EmotionTag[] = []) {
    return ipcRenderer.invoke(emoTrashChannels.listEmotionCalendar, {
      rangeDays,
      emotionTags
    })
  },
  listEmotionTimeline(query?: Partial<EmotionTimelineQuery>) {
    return ipcRenderer.invoke(emoTrashChannels.listEmotionTimeline, {
      emotionTags: [],
      limit: 50,
      ...query
    })
  },
  triggerShake(input?: Partial<ShakeWindowInput>) {
    return ipcRenderer.invoke(emoTrashChannels.triggerShake, input ?? {})
  },
  getEmotionBattleStats() {
    return ipcRenderer.invoke(emoTrashChannels.getEmotionBattleStats)
  },
  getDecorationSummary() {
    return ipcRenderer.invoke(emoTrashChannels.getDecorationSummary)
  },
  placeDecoration(input: PlaceDecorationInput) {
    return ipcRenderer.invoke(emoTrashChannels.placeDecoration, input)
  },
  removePlacedDecoration(input: RemovePlacedDecorationInput) {
    return ipcRenderer.invoke(emoTrashChannels.removePlacedDecoration, input)
  },
  getGardenLands() {
    return ipcRenderer.invoke(emoTrashChannels.getGardenLands)
  },
  unlockGardenLand(gridX: number, gridY: number) {
    return ipcRenderer.invoke(emoTrashChannels.unlockGardenLand, { gridX, gridY })
  },
  getCurrencyBalance() {
    return ipcRenderer.invoke(emoTrashChannels.getCurrencyBalance)
  },
  getCurrencyTransactions(limit?: number) {
    return ipcRenderer.invoke(emoTrashChannels.getCurrencyTransactions, { limit })
  },
  getSeedInventory() {
    return ipcRenderer.invoke(emoTrashChannels.getSeedInventory)
  },
  getTotalSeedCount() {
    return ipcRenderer.invoke(emoTrashChannels.getTotalSeedCount)
  },
  plantSeed(input) {
    return ipcRenderer.invoke(emoTrashChannels.plantSeed, input)
  },
  purchaseDecoration(input: PurchaseDecorationInput) {
    return ipcRenderer.invoke(emoTrashChannels.purchaseDecoration, input)
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
