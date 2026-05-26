import type {
  EmotionAnalysisInput,
  EmotionStatsRange,
  EmotionTag,
  EmotionTimelineQuery,
  EmoTrashApi,
  GardenItem,
  PickFlowerResult,
  ReleaseEmotionInput,
  ShakeWindowInput,
  WaterFlowerResult
} from '../../../preload/api'
import { buildRuleBasedEmotionAnalysis } from '../../../shared/emotionAnalysis'
import {
  buildEmotionCalendar,
  buildEmotionStatsSummary,
  buildEmotionTimeline,
  buildGardenGrowthSnapshot,
  enrichGardenItems,
  formatLocalTimestamp,
  toDateKey,
  toHour
} from '../../../shared/emotionInsights'
import { buildAchievementSummary } from '../../../shared/achievements'
import { buildFlowerDexSummary } from '../../../shared/flowerDex'
import { buildTitleSummary } from '../../../shared/titles'

const STORAGE_KEY = 'emo-trash-browser-garden'
const WATERING_KEY = 'emo-trash-browser-waterings'

function readGarden(): GardenItem[] {
  const rawValue = window.localStorage.getItem(STORAGE_KEY)
  if (!rawValue) {
    return []
  }

  return enrichGardenItems(JSON.parse(rawValue) as GardenItem[])
}

function saveGarden(items: GardenItem[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

function getManualWateringsToday(): number {
  const raw = window.localStorage.getItem(WATERING_KEY)
  if (!raw) return 0
  const data = JSON.parse(raw) as { date: string; count: number }
  if (data.date !== toDateKey(new Date())) return 0
  return data.count
}

function recordManualWatering(): void {
  const today = toDateKey(new Date())
  const current = getManualWateringsToday()
  window.localStorage.setItem(WATERING_KEY, JSON.stringify({ date: today, count: current + 1 }))
}

const browserPreviewApi: EmoTrashApi = {
  async analyzeEmotion(input: EmotionAnalysisInput): Promise<ReleaseEmotionInput> {
    return buildRuleBasedEmotionAnalysis(input.text, {
      source: 'browser-preview',
      sourceModel: 'browser-preview-rules'
    })
  },
  async releaseEmotion(input: ReleaseEmotionInput): Promise<GardenItem[]> {
    const now = new Date()
    const nextItem: GardenItem = {
      id: Date.now(),
      timestamp: formatLocalTimestamp(now),
      releasedOn: toDateKey(now),
      releasedHour: toHour(now),
      flowerType: input.flowerType,
      colorHex: input.colorHex,
      growthStage: 1,
      totalWaterings: 1,
      lastWateredOn: toDateKey(now),
      emotionTag: input.emotionTag,
      rarity: 'common'
    }

    const garden = enrichGardenItems([nextItem, ...readGarden()])
    saveGarden(garden)
    return garden.slice(0, 24)
  },
  async listGarden(): Promise<GardenItem[]> {
    return readGarden().slice(0, 24)
  },
  async waterFlower(flowerId: number): Promise<WaterFlowerResult> {
    const used = getManualWateringsToday()
    const remaining = Math.max(0, 1 - used)

    if (remaining <= 0) {
      return { success: false, remaining: 0, garden: readGarden().slice(0, 24) }
    }

    const garden = readGarden()
    const target = garden.find((item) => item.id === flowerId)
    if (!target) {
      return { success: false, remaining, garden: garden.slice(0, 24) }
    }

    target.totalWaterings += 1
    target.lastWateredOn = toDateKey(new Date())
    recordManualWatering()

    const enriched = enrichGardenItems(garden)
    saveGarden(enriched)
    return { success: true, remaining: remaining - 1, garden: enriched.slice(0, 24) }
  },
  async pickFlower(flowerId: number): Promise<PickFlowerResult> {
    const garden = readGarden()
    const idx = garden.findIndex((item) => item.id === flowerId)
    if (idx === -1) {
      return { success: false, garden: garden.slice(0, 24) }
    }

    garden.splice(idx, 1)
    saveGarden(garden)
    return { success: true, garden: garden.slice(0, 24) }
  },
  async getEmotionStats(rangeDays: EmotionStatsRange) {
    return buildEmotionStatsSummary(readGarden(), rangeDays)
  },
  async getGardenGrowth() {
    const remaining = Math.max(0, 1 - getManualWateringsToday())
    return buildGardenGrowthSnapshot(readGarden(), remaining)
  },
  async getAchievements() {
    return buildAchievementSummary(readGarden())
  },
  async getFlowerDex() {
    return buildFlowerDexSummary(readGarden())
  },
  async getTitles() {
    return buildTitleSummary(readGarden())
  },
  async listEmotionCalendar(rangeDays: number, emotionTags: EmotionTag[] = []) {
    return buildEmotionCalendar(readGarden(), rangeDays, emotionTags)
  },
  async listEmotionTimeline(query?: Partial<EmotionTimelineQuery>) {
    return buildEmotionTimeline(readGarden(), {
      emotionTags: [],
      limit: 50,
      ...query
    })
  },
  async triggerShake(input?: Partial<ShakeWindowInput>): Promise<void> {
    const intensity = Math.min(32, Math.max(4, input?.intensity ?? 14))
    const durationMs = Math.min(1000, Math.max(120, input?.durationMs ?? 420))

    document.body.animate(
      [
        { transform: 'translate(0, 0)' },
        { transform: `translate(${intensity}px, 0)` },
        { transform: `translate(${-intensity}px, 0)` },
        { transform: 'translate(0, 0)' }
      ],
      {
        duration: durationMs,
        iterations: 2,
        easing: 'ease-in-out'
      }
    )
  }
}

export function getRuntimeApi(): EmoTrashApi {
  return window.api ?? browserPreviewApi
}
