import { useCallback } from 'react'
import type {
  EmotionAnalysisInput,
  EmotionStatsRange,
  EmotionTag,
  EmotionTimelineQuery,
  GardenGrowthSnapshot,
  GardenItem,
  EmotionCalendarDay,
  EmotionStatsSummary,
  EmotionTimelineEntry,
  WaterFlowerResult,
  PickFlowerResult,
  AchievementSummary
} from '../types/emotion'
import type { ReleaseEmotionInput } from '../../../preload/api'
import { getRuntimeApi } from '../lib/runtimeApi'

export function useEmotionApi(): {
  analyzeEmotion: (text: string) => Promise<ReleaseEmotionInput>
  releaseEmotion: (input: ReleaseEmotionInput) => Promise<GardenItem[]>
  listGarden: () => Promise<GardenItem[]>
  waterFlower: (flowerId: number) => Promise<WaterFlowerResult>
  pickFlower: (flowerId: number) => Promise<PickFlowerResult>
  getEmotionStats: (rangeDays: EmotionStatsRange) => Promise<EmotionStatsSummary>
  getGardenGrowth: () => Promise<GardenGrowthSnapshot>
  getAchievements: () => Promise<AchievementSummary>
  listEmotionCalendar: (
    rangeDays: number,
    emotionTags?: EmotionTag[]
  ) => Promise<EmotionCalendarDay[]>
  listEmotionTimeline: (query?: Partial<EmotionTimelineQuery>) => Promise<EmotionTimelineEntry[]>
} {
  const analyzeEmotion = useCallback(async (text: string): Promise<ReleaseEmotionInput> => {
    const input: EmotionAnalysisInput = { text }
    return getRuntimeApi().analyzeEmotion(input)
  }, [])

  const releaseEmotion = useCallback(async (input: ReleaseEmotionInput): Promise<GardenItem[]> => {
    const api = getRuntimeApi()
    await api.triggerShake({
      intensity: Math.min(28, 10 + input.emphasisLevel),
      durationMs: 420
    })

    return api.releaseEmotion(input)
  }, [])

  const listGarden = useCallback(() => {
    return getRuntimeApi().listGarden()
  }, [])

  const waterFlower = useCallback((flowerId: number) => {
    return getRuntimeApi().waterFlower(flowerId)
  }, [])

  const pickFlower = useCallback((flowerId: number) => {
    return getRuntimeApi().pickFlower(flowerId)
  }, [])

  const getEmotionStats = useCallback((rangeDays: EmotionStatsRange) => {
    return getRuntimeApi().getEmotionStats(rangeDays)
  }, [])

  const getGardenGrowth = useCallback(() => {
    return getRuntimeApi().getGardenGrowth()
  }, [])

  const getAchievements = useCallback(() => {
    return getRuntimeApi().getAchievements()
  }, [])

  const listEmotionCalendar = useCallback((rangeDays: number, emotionTags: EmotionTag[] = []) => {
    return getRuntimeApi().listEmotionCalendar(rangeDays, emotionTags)
  }, [])

  const listEmotionTimeline = useCallback((query?: Partial<EmotionTimelineQuery>) => {
    return getRuntimeApi().listEmotionTimeline(query)
  }, [])

  return {
    analyzeEmotion,
    releaseEmotion,
    listGarden,
    waterFlower,
    pickFlower,
    getEmotionStats,
    getGardenGrowth,
    getAchievements,
    listEmotionCalendar,
    listEmotionTimeline
  }
}
