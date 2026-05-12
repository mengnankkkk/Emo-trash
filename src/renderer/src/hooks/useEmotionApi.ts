import { useCallback } from 'react'
import type {
  EmotionStatsRange,
  EmotionTag,
  EmotionTimelineQuery,
  GardenGrowthSnapshot,
  GardenItem,
  EmotionCalendarDay,
  EmotionStatsSummary,
  EmotionTimelineEntry
} from '../types/emotion'
import { extractEmotionFeatures } from '../lib/extractEmotionFeatures'
import { getRuntimeApi } from '../lib/runtimeApi'

export function useEmotionApi(): {
  releaseEmotion: (text: string) => Promise<GardenItem[]>
  listGarden: () => Promise<GardenItem[]>
  getEmotionStats: (rangeDays: EmotionStatsRange) => Promise<EmotionStatsSummary>
  getGardenGrowth: () => Promise<GardenGrowthSnapshot>
  listEmotionCalendar: (
    rangeDays: number,
    emotionTags?: EmotionTag[]
  ) => Promise<EmotionCalendarDay[]>
  listEmotionTimeline: (query?: Partial<EmotionTimelineQuery>) => Promise<EmotionTimelineEntry[]>
} {
  const releaseEmotion = useCallback(async (text: string): Promise<GardenItem[]> => {
    const features = extractEmotionFeatures(text)
    const api = getRuntimeApi()

    await api.triggerShake({
      intensity: Math.min(28, 10 + features.emphasisLevel),
      durationMs: 420
    })

    return api.releaseEmotion(features)
  }, [])

  const listGarden = useCallback(() => {
    return getRuntimeApi().listGarden()
  }, [])

  const getEmotionStats = useCallback((rangeDays: EmotionStatsRange) => {
    return getRuntimeApi().getEmotionStats(rangeDays)
  }, [])

  const getGardenGrowth = useCallback(() => {
    return getRuntimeApi().getGardenGrowth()
  }, [])

  const listEmotionCalendar = useCallback((rangeDays: number, emotionTags: EmotionTag[] = []) => {
    return getRuntimeApi().listEmotionCalendar(rangeDays, emotionTags)
  }, [])

  const listEmotionTimeline = useCallback((query?: Partial<EmotionTimelineQuery>) => {
    return getRuntimeApi().listEmotionTimeline(query)
  }, [])

  return {
    releaseEmotion,
    listGarden,
    getEmotionStats,
    getGardenGrowth,
    listEmotionCalendar,
    listEmotionTimeline
  }
}
