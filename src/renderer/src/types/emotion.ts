import type {
  EmotionCalendarDay,
  EmotionStatsRange,
  EmotionStatsSummary,
  EmotionTag,
  EmotionTimelineEntry,
  EmotionTimelineQuery,
  GardenGrowthSnapshot,
  GardenItem
} from '../../../preload/api'
import type { RitualEffect } from '../../../shared/emotionMeta'

export type {
  EmotionCalendarDay,
  EmotionStatsRange,
  EmotionStatsSummary,
  EmotionTag,
  EmotionTimelineEntry,
  EmotionTimelineQuery,
  GardenGrowthSnapshot,
  GardenItem,
  RitualEffect
}

export interface EmotionFeatureInput {
  textLength: number
  exclamationDensity: number
  emphasisLevel: number
  flowerType: number
  colorHex: string
  emotionTag: EmotionTag
}
