import type {
  AchievementSummary,
  EmotionCalendarDay,
  EmotionStatsRange,
  EmotionStatsSummary,
  EmotionTag,
  EmotionTimelineEntry,
  EmotionTimelineQuery,
  GardenGrowthSnapshot,
  GardenItem,
  ReleaseEmotionInput,
  WaterFlowerResult
} from '../../preload/api'
import {
  buildEmotionCalendar,
  buildEmotionStatsSummary,
  buildEmotionTimeline,
  buildGardenGrowthSnapshot,
  enrichGardenItems,
  formatLocalTimestamp,
  parseTimestamp,
  toDateKey,
  toHour
} from '../../shared/emotionInsights'
import { buildAchievementSummary } from '../../shared/achievements'
import { EmotionAnalysisService } from './emotionAnalysisService'
import { EmotionRepository } from '../db/repositories/emotionRepository'

const DAILY_MANUAL_WATERING_LIMIT = 1

export class ReleaseService {
  constructor(
    private readonly emotionRepository: EmotionRepository,
    private readonly emotionAnalysisService?: EmotionAnalysisService
  ) {}

  analyzeEmotion(text: string) {
    if (!this.emotionAnalysisService) {
      throw new Error('EmotionAnalysisService is not configured')
    }

    return this.emotionAnalysisService.analyze(text)
  }

  releaseEmotion(input: ReleaseEmotionInput): GardenItem[] {
    const now = new Date()
    this.emotionRepository.createSeed(input, formatLocalTimestamp(now), toDateKey(now), toHour(now))
    return this.listGarden()
  }

  waterFlower(flowerId: number): WaterFlowerResult {
    const now = new Date()
    const dateKey = toDateKey(now)

    if (!this.emotionRepository.flowerExists(flowerId)) {
      return { success: false, remaining: this.getRemainingManualWaterings(dateKey), garden: this.listGarden() }
    }

    const remaining = this.getRemainingManualWaterings(dateKey)
    if (remaining <= 0) {
      return { success: false, remaining: 0, garden: this.listGarden() }
    }

    this.emotionRepository.recordWatering(flowerId, 'manual', dateKey)
    const nextRemaining = remaining - 1

    return { success: true, remaining: nextRemaining, garden: this.listGarden() }
  }

  pickFlower(flowerId: number): { success: boolean; garden: GardenItem[] } {
    if (!this.emotionRepository.flowerExists(flowerId)) {
      return { success: false, garden: this.listGarden() }
    }

    const dateKey = toDateKey(new Date())
    this.emotionRepository.pickFlower(flowerId, dateKey)
    return { success: true, garden: this.listGarden() }
  }

  listGarden(): GardenItem[] {
    const items = this.emotionRepository.listAllGarden()
    const enrichedItems = enrichGardenItems(items)
    this.emotionRepository.syncGrowthStages(enrichedItems)
    return enrichedItems.slice(0, 24)
  }

  getEmotionStats(rangeDays: EmotionStatsRange): EmotionStatsSummary {
    const items = this.getEnrichedItems()
    return buildEmotionStatsSummary(items, rangeDays)
  }

  getGardenGrowth(): GardenGrowthSnapshot {
    const items = this.getEnrichedItems()
    const now = new Date()
    const remaining = this.getRemainingManualWaterings(toDateKey(now))
    return buildGardenGrowthSnapshot(items, remaining, now)
  }

  getAchievements(): AchievementSummary {
    const items = this.getEnrichedItems()
    return buildAchievementSummary(items)
  }

  listEmotionCalendar(rangeDays: number, emotionTags: EmotionTag[] = []): EmotionCalendarDay[] {
    const items = this.getEnrichedItems()
    return buildEmotionCalendar(items, rangeDays, emotionTags)
  }

  listEmotionTimeline(query: EmotionTimelineQuery): EmotionTimelineEntry[] {
    const items = this.getEnrichedItems()
    return buildEmotionTimeline(items, query)
  }

  private getRemainingManualWaterings(dateKey: string): number {
    const used = this.emotionRepository.getManualWateringCountToday(dateKey)
    return Math.max(0, DAILY_MANUAL_WATERING_LIMIT - used)
  }

  private getEnrichedItems(): GardenItem[] {
    const items = this.emotionRepository.listAllGardenIncludingPicked()
    const enrichedItems = enrichGardenItems(items)
    const sourceById = new Map(items.map((item) => [item.id, item]))
    const needsSync = enrichedItems.some(
      (item) => sourceById.get(item.id)?.growthStage !== item.growthStage
    )

    if (needsSync) {
      this.emotionRepository.syncGrowthStages(enrichedItems)
    }

    return enrichedItems.sort((left, right) => {
      const timeDiff =
        parseTimestamp(right.timestamp).getTime() - parseTimestamp(left.timestamp).getTime()
      if (timeDiff !== 0) {
        return timeDiff
      }

      return right.id - left.id
    })
  }
}
