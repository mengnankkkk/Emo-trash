import type {
  EmotionStatsRange,
  EmotionTag,
  EmotionTimelineQuery,
  EmoTrashApi,
  GardenItem,
  ReleaseEmotionInput,
  ShakeWindowInput
} from '../../../preload/api'
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

const STORAGE_KEY = 'emo-trash-browser-garden'

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

const browserPreviewApi: EmoTrashApi = {
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
      emotionTag: input.emotionTag
    }

    const garden = enrichGardenItems([nextItem, ...readGarden()])
    saveGarden(garden)
    return garden.slice(0, 24)
  },
  async listGarden(): Promise<GardenItem[]> {
    return readGarden().slice(0, 24)
  },
  async getEmotionStats(rangeDays: EmotionStatsRange) {
    return buildEmotionStatsSummary(readGarden(), rangeDays)
  },
  async getGardenGrowth() {
    return buildGardenGrowthSnapshot(readGarden())
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
