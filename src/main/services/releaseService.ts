import type {
  EmotionCalendarDay,
  EmotionStatsRange,
  EmotionStatsSummary,
  EmotionTag,
  EmotionTimelineEntry,
  EmotionTimelineQuery,
  GardenGrowthSnapshot,
  GardenItem,
  ReleaseEmotionInput
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
import { EmotionAnalysisService } from './emotionAnalysisService'
import { EmotionRepository } from '../db/repositories/emotionRepository'

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
    return buildGardenGrowthSnapshot(items)
  }

  listEmotionCalendar(rangeDays: number, emotionTags: EmotionTag[] = []): EmotionCalendarDay[] {
    const items = this.getEnrichedItems()
    return buildEmotionCalendar(items, rangeDays, emotionTags)
  }

  listEmotionTimeline(query: EmotionTimelineQuery): EmotionTimelineEntry[] {
    const items = this.getEnrichedItems()
    return buildEmotionTimeline(items, query)
  }

  private getEnrichedItems(): GardenItem[] {
    const items = this.emotionRepository.listAllGarden()
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
