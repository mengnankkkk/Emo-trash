import { z } from 'zod'
import { emotionTagValues } from '../shared/emotionMeta'

export const emoTrashChannels = {
  releaseEmotion: 'emotion:release',
  listGarden: 'garden:list',
  triggerShake: 'window:shake',
  getEmotionStats: 'emotion:stats',
  getGardenGrowth: 'garden:growth',
  listEmotionCalendar: 'emotion:calendar',
  listEmotionTimeline: 'emotion:timeline'
} as const

export const emotionTagSchema = z.enum(emotionTagValues)
export const emotionStatsRangeSchema = z.union([z.literal(7), z.literal(30)])

export const releaseEmotionInputSchema = z.object({
  textLength: z.number().int().nonnegative(),
  exclamationDensity: z.number().min(0).max(1),
  emphasisLevel: z.number().int().min(0).max(12),
  flowerType: z.number().int().min(1).max(6),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  emotionTag: emotionTagSchema
})

export const gardenItemSchema = z.object({
  id: z.number().int().positive(),
  timestamp: z.string(),
  releasedOn: z.string(),
  releasedHour: z.number().int().min(0).max(23),
  flowerType: z.number().int().min(1).max(6),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  growthStage: z.number().int().min(1).max(3),
  emotionTag: emotionTagSchema
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
  levelLabel: z.enum(['发芽', '开花', '盛放']),
  seasonKey: z.enum(['seed', 'bloom', 'flourish']),
  seasonLabel: z.string(),
  currentStreakDays: z.number().int().nonnegative(),
  longestStreakDays: z.number().int().nonnegative(),
  recentReleaseCount: z.number().int().nonnegative(),
  totalBlooms: z.number().int().nonnegative(),
  progressToNextLevel: z.number().min(0).max(1),
  nextLevelLabel: z.enum(['开花', '盛放']).nullable()
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

export type EmotionTag = z.infer<typeof emotionTagSchema>
export type EmotionStatsRange = z.infer<typeof emotionStatsRangeSchema>
export type ReleaseEmotionInput = z.infer<typeof releaseEmotionInputSchema>
export type GardenItem = z.infer<typeof gardenItemSchema>
export type EmotionBreakdownItem = z.infer<typeof emotionBreakdownItemSchema>
export type EmotionTrendItem = z.infer<typeof emotionTrendItemSchema>
export type EmotionStatsSummary = z.infer<typeof emotionStatsSummarySchema>
export type GardenGrowthSnapshot = z.infer<typeof gardenGrowthSnapshotSchema>
export type EmotionCalendarDay = z.infer<typeof emotionCalendarDaySchema>
export type EmotionTimelineQuery = z.infer<typeof emotionTimelineQuerySchema>
export type EmotionTimelineEntry = GardenItem
export type ShakeWindowInput = z.infer<typeof shakeWindowInputSchema>

export interface EmoTrashApi {
  releaseEmotion(input: ReleaseEmotionInput): Promise<GardenItem[]>
  listGarden(): Promise<GardenItem[]>
  getEmotionStats(rangeDays: EmotionStatsRange): Promise<EmotionStatsSummary>
  getGardenGrowth(): Promise<GardenGrowthSnapshot>
  listEmotionCalendar(rangeDays: number, emotionTags?: EmotionTag[]): Promise<EmotionCalendarDay[]>
  listEmotionTimeline(query?: Partial<EmotionTimelineQuery>): Promise<EmotionTimelineEntry[]>
  triggerShake(input?: Partial<ShakeWindowInput>): Promise<void>
}
