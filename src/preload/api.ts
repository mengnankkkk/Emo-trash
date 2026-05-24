import { z } from 'zod'
import { emotionTagValues } from '../shared/emotionMeta'
import {
  emotionAnalysisMetadataSchema,
  emotionAnalysisSchema,
  emotionIntensitySchema
} from '../shared/emotionAnalysis'

export const emoTrashChannels = {
  analyzeEmotion: 'emotion:analyze',
  releaseEmotion: 'emotion:release',
  listGarden: 'garden:list',
  waterFlower: 'garden:water',
  triggerShake: 'window:shake',
  getEmotionStats: 'emotion:stats',
  getGardenGrowth: 'garden:growth',
  getAchievements: 'achievements:list',
  listEmotionCalendar: 'emotion:calendar',
  listEmotionTimeline: 'emotion:timeline'
} as const

export const emotionTagSchema = z.enum(emotionTagValues)
export const emotionAnalysisInputSchema = z.object({
  text: z.string().trim().min(1).max(4000)
})
export const emotionStatsRangeSchema = z.union([z.literal(7), z.literal(30)])
export const releaseEmotionInputSchema = emotionAnalysisSchema

export const gardenItemSchema = z.object({
  id: z.number().int().positive(),
  timestamp: z.string(),
  releasedOn: z.string(),
  releasedHour: z.number().int().min(0).max(23),
  flowerType: z.number().int().min(1).max(6),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  growthStage: z.number().int().min(0).max(5),
  totalWaterings: z.number().int().nonnegative(),
  lastWateredOn: z.string(),
  emotionTag: emotionTagSchema,
  analysis: emotionAnalysisMetadataSchema.optional()
})

export const seasonalThemeSchema = z.object({
  calendarSeason: z.enum(['spring', 'summer', 'autumn', 'winter']),
  calendarSeasonLabel: z.string(),
  gardenSeason: z.enum(['seed', 'bloom', 'flourish']),
  gardenSeasonLabel: z.string(),
  combinedLabel: z.string(),
  combinedKey: z.string(),
  moodTint: z.string()
})

export const emotionBreakdownItemSchema = z.object({
  tag: emotionTagSchema,
  count: z.number().int().nonnegative(),
  ratio: z.number().min(0).max(1)
})

export const emotionTrendItemSchema = z.object({
  date: z.string(),
  count: z.number().int().nonnegative(),
  dominantEmotionTag: emotionTagSchema.nullable()
})

export const emotionStatsSummarySchema = z.object({
  rangeDays: emotionStatsRangeSchema,
  totalReleases: z.number().int().nonnegative(),
  peakHour: z.number().int().min(0).max(23).nullable(),
  peakHourLabel: z.string(),
  currentStreakDays: z.number().int().nonnegative(),
  longestStreakDays: z.number().int().nonnegative(),
  emotionBreakdown: z.array(emotionBreakdownItemSchema),
  trend: z.array(emotionTrendItemSchema)
})

export const gardenGrowthSnapshotSchema = z.object({
  level: z.number().int().min(1).max(3),
  levelLabel: z.enum(['新芽', '开花', '盛放']),
  seasonKey: z.enum(['seed', 'bloom', 'flourish']),
  seasonLabel: z.string(),
  seasonalTheme: seasonalThemeSchema,
  currentStreakDays: z.number().int().nonnegative(),
  longestStreakDays: z.number().int().nonnegative(),
  recentReleaseCount: z.number().int().nonnegative(),
  totalBlooms: z.number().int().nonnegative(),
  witheredCount: z.number().int().nonnegative(),
  manualWateringsRemaining: z.number().int().min(0).max(3),
  progressToNextLevel: z.number().min(0).max(1),
  nextLevelLabel: z.enum(['开花', '盛放']).nullable()
})

export const waterFlowerInputSchema = z.object({
  flowerId: z.number().int().positive()
})

export const waterFlowerResultSchema = z.object({
  success: z.boolean(),
  remaining: z.number().int().min(0).max(3),
  garden: z.array(gardenItemSchema)
})

export const emotionCalendarDaySchema = z.object({
  date: z.string(),
  count: z.number().int().nonnegative(),
  dominantEmotionTag: emotionTagSchema.nullable(),
  intensityLevel: z.number().int().min(0).max(4)
})

export const emotionTimelineQuerySchema = z.object({
  date: z.string().optional(),
  rangeDays: z.number().int().min(1).max(365).optional(),
  emotionTags: z.array(emotionTagSchema).default([]),
  limit: z.number().int().min(1).max(365).default(50)
})

export const shakeWindowInputSchema = z.object({
  intensity: z.number().min(4).max(32).default(14),
  durationMs: z.number().min(120).max(1000).default(420)
})

export const achievementCategorySchema = z.enum(['milestone', 'streak', 'growth', 'diversity', 'ritual'])

export const achievementStatusSchema = z.object({
  id: z.string(),
  category: achievementCategorySchema,
  title: z.string(),
  description: z.string(),
  hint: z.string(),
  target: z.number().int().nonnegative(),
  unit: z.string(),
  progress: z.number().int().nonnegative(),
  unlocked: z.boolean(),
  unlockedAt: z.string().nullable()
})

export const achievementSummarySchema = z.object({
  totalCount: z.number().int().nonnegative(),
  unlockedCount: z.number().int().nonnegative(),
  unlockRatio: z.number().min(0).max(1),
  recentlyUnlocked: z.array(achievementStatusSchema),
  achievements: z.array(achievementStatusSchema)
})

export type EmotionTag = z.infer<typeof emotionTagSchema>
export type EmotionAnalysisInput = z.infer<typeof emotionAnalysisInputSchema>
export type EmotionIntensity = z.infer<typeof emotionIntensitySchema>
export type EmotionStatsRange = z.infer<typeof emotionStatsRangeSchema>
export type ReleaseEmotionInput = z.infer<typeof releaseEmotionInputSchema>
export type GardenItem = z.infer<typeof gardenItemSchema>
export type SeasonalTheme = z.infer<typeof seasonalThemeSchema>
export type EmotionBreakdownItem = z.infer<typeof emotionBreakdownItemSchema>
export type EmotionTrendItem = z.infer<typeof emotionTrendItemSchema>
export type EmotionStatsSummary = z.infer<typeof emotionStatsSummarySchema>
export type GardenGrowthSnapshot = z.infer<typeof gardenGrowthSnapshotSchema>
export type WaterFlowerResult = z.infer<typeof waterFlowerResultSchema>
export type EmotionCalendarDay = z.infer<typeof emotionCalendarDaySchema>
export type EmotionTimelineQuery = z.infer<typeof emotionTimelineQuerySchema>
export type EmotionTimelineEntry = GardenItem
export type ShakeWindowInput = z.infer<typeof shakeWindowInputSchema>
export type AchievementCategory = z.infer<typeof achievementCategorySchema>
export type AchievementStatus = z.infer<typeof achievementStatusSchema>
export type AchievementSummary = z.infer<typeof achievementSummarySchema>

export interface EmoTrashApi {
  analyzeEmotion(input: EmotionAnalysisInput): Promise<ReleaseEmotionInput>
  releaseEmotion(input: ReleaseEmotionInput): Promise<GardenItem[]>
  listGarden(): Promise<GardenItem[]>
  waterFlower(flowerId: number): Promise<WaterFlowerResult>
  getEmotionStats(rangeDays: EmotionStatsRange): Promise<EmotionStatsSummary>
  getGardenGrowth(): Promise<GardenGrowthSnapshot>
  getAchievements(): Promise<AchievementSummary>
  listEmotionCalendar(rangeDays: number, emotionTags?: EmotionTag[]): Promise<EmotionCalendarDay[]>
  listEmotionTimeline(query?: Partial<EmotionTimelineQuery>): Promise<EmotionTimelineEntry[]>
  triggerShake(input?: Partial<ShakeWindowInput>): Promise<void>
}
