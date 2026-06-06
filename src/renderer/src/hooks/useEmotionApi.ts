import { useCallback } from 'react'
import type {
  CurrencyBalance,
  CurrencyTransaction,
  DecorationSummary,
  EmotionAnalysisInput,
  EmotionStatsRange,
  EmotionTag,
  EmotionTimelineQuery,
  FlowerDexSummary,
  GardenGrowthSnapshot,
  GardenItem,
  GardenLandCell,
  EmotionCalendarDay,
  EmotionStatsSummary,
  EmotionTimelineEntry,
  PlaceDecorationInput,
  PurchaseDecorationResult,
  TitleSummary,
  UnlockLandResult,
  WaterFlowerResult,
  PickFlowerResult,
  AchievementSummary,
  ReleaseEmotionResult,
  SeedInventoryItem,
  PlantSeedInput,
  PlantSeedResult
} from '../types/emotion'
import type {
  ReleaseEmotionInput,
  DecorationType,
  MovePlacedDecorationInput,
  PlacedDecoration
} from '../../../preload/api'
import { getRuntimeApi } from '../lib/runtimeApi'

export function useEmotionApi(): {
  analyzeEmotion: (text: string) => Promise<ReleaseEmotionInput>
  releaseEmotion: (input: ReleaseEmotionInput) => Promise<ReleaseEmotionResult>
  listGarden: () => Promise<GardenItem[]>
  waterFlower: (flowerId: number) => Promise<WaterFlowerResult>
  pickFlower: (flowerId: number) => Promise<PickFlowerResult>
  getEmotionStats: (rangeDays: EmotionStatsRange) => Promise<EmotionStatsSummary>
  getGardenGrowth: () => Promise<GardenGrowthSnapshot>
  getAchievements: () => Promise<AchievementSummary>
  getFlowerDex: () => Promise<FlowerDexSummary>
  getTitles: () => Promise<TitleSummary>
  listEmotionCalendar: (
    rangeDays: number,
    emotionTags?: EmotionTag[]
  ) => Promise<EmotionCalendarDay[]>
  listEmotionTimeline: (query?: Partial<EmotionTimelineQuery>) => Promise<EmotionTimelineEntry[]>
  getGardenLands: () => Promise<GardenLandCell[]>
  unlockGardenLand: (gridX: number, gridY: number) => Promise<UnlockLandResult>
  getCurrencyBalance: () => Promise<CurrencyBalance>
  getCurrencyTransactions: (limit?: number) => Promise<CurrencyTransaction[]>
  getSeedInventory: () => Promise<SeedInventoryItem[]>
  getTotalSeedCount: () => Promise<{ count: number }>
  plantSeed: (input: PlantSeedInput) => Promise<PlantSeedResult>
  getDecorationSummary: () => Promise<DecorationSummary>
  purchaseDecoration: (type: DecorationType) => Promise<PurchaseDecorationResult>
  placeDecoration: (input: PlaceDecorationInput) => Promise<PlacedDecoration>
  movePlacedDecoration: (input: MovePlacedDecorationInput) => Promise<PlacedDecoration>
} {
  const analyzeEmotion = useCallback(async (text: string): Promise<ReleaseEmotionInput> => {
    const input: EmotionAnalysisInput = { text }
    return getRuntimeApi().analyzeEmotion(input)
  }, [])

  const releaseEmotion = useCallback(async (input: ReleaseEmotionInput): Promise<ReleaseEmotionResult> => {
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

  const getFlowerDex = useCallback(() => {
    return getRuntimeApi().getFlowerDex()
  }, [])

  const getTitles = useCallback(() => {
    return getRuntimeApi().getTitles()
  }, [])

  const listEmotionCalendar = useCallback((rangeDays: number, emotionTags: EmotionTag[] = []) => {
    return getRuntimeApi().listEmotionCalendar(rangeDays, emotionTags)
  }, [])

  const listEmotionTimeline = useCallback((query?: Partial<EmotionTimelineQuery>) => {
    return getRuntimeApi().listEmotionTimeline(query)
  }, [])

  const getGardenLands = useCallback(() => {
    return getRuntimeApi().getGardenLands()
  }, [])

  const unlockGardenLand = useCallback((gridX: number, gridY: number) => {
    return getRuntimeApi().unlockGardenLand(gridX, gridY)
  }, [])

  const getCurrencyBalance = useCallback(() => {
    return getRuntimeApi().getCurrencyBalance()
  }, [])

  const getCurrencyTransactions = useCallback((limit?: number) => {
    return getRuntimeApi().getCurrencyTransactions(limit)
  }, [])

  const getSeedInventory = useCallback(() => {
    return getRuntimeApi().getSeedInventory()
  }, [])

  const getTotalSeedCount = useCallback(() => {
    return getRuntimeApi().getTotalSeedCount()
  }, [])

  const plantSeed = useCallback((input: PlantSeedInput) => {
    return getRuntimeApi().plantSeed(input)
  }, [])

  const getDecorationSummary = useCallback(() => {
    return getRuntimeApi().getDecorationSummary()
  }, [])

  const purchaseDecoration = useCallback((type: DecorationType) => {
    return getRuntimeApi().purchaseDecoration({ type })
  }, [])

  const placeDecoration = useCallback((input: PlaceDecorationInput) => {
    return getRuntimeApi().placeDecoration(input)
  }, [])

  const movePlacedDecoration = useCallback((input: MovePlacedDecorationInput) => {
    return getRuntimeApi().movePlacedDecoration(input)
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
    getFlowerDex,
    getTitles,
    listEmotionCalendar,
    listEmotionTimeline,
    getGardenLands,
    unlockGardenLand,
    getCurrencyBalance,
    getCurrencyTransactions,
    getSeedInventory,
    getTotalSeedCount,
    plantSeed,
    getDecorationSummary,
    purchaseDecoration,
    placeDecoration,
    movePlacedDecoration
  }
}
