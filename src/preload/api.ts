import { z } from 'zod'
import { emotionTagValues } from '../shared/emotionMeta'
import {
  emotionAnalysisMetadataSchema,
  emotionAnalysisSchema,
  emotionIntensitySchema
} from '../shared/emotionAnalysis'
import { rarityValues } from '../shared/rarity'
import { decorationTypeValues } from '../shared/gardenDecoration'

export const emoTrashChannels = {
  analyzeEmotion: 'emotion:analyze',
  releaseEmotion: 'emotion:release',
  listGarden: 'garden:list',
  waterFlower: 'garden:water',
  pickFlower: 'garden:pick',
  triggerShake: 'window:shake',
  getEmotionStats: 'emotion:stats',
  getGardenGrowth: 'garden:growth',
  getAchievements: 'achievements:list',
  getFlowerDex: 'flowerdex:list',
  getTitles: 'titles:list',
  listEmotionCalendar: 'emotion:calendar',
  listEmotionTimeline: 'emotion:timeline',
  getEmotionBattleStats: 'emotion:battle-stats',
  getDecorationSummary: 'decoration:summary',
  placeDecoration: 'decoration:place',
  movePlacedDecoration: 'decoration:move',
  removePlacedDecoration: 'decoration:remove',
  purchaseDecoration: 'decoration:purchase',
  getGardenLands: 'garden:lands',
  unlockGardenLand: 'garden:unlock-land',
  getCurrencyBalance: 'currency:balance',
  getCurrencyTransactions: 'currency:transactions',
  getSeedInventory: 'seed:inventory',
  getTotalSeedCount: 'seed:total-count',
  plantSeed: 'seed:plant',
  getDailyCheckInStatus: 'checkin:status',
  claimDailyCheckIn: 'checkin:claim',
  composeSeed: 'seed:compose',
  recycleSeed: 'seed:recycle'
} as const

export const emotionTagSchema = z.enum(emotionTagValues)
export const raritySchema = z.enum(rarityValues)
export const emotionAnalysisInputSchema = z.object({
  text: z.string().trim().min(1).max(4000)
})
export const emotionStatsRangeSchema = z.literal(7)
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
  rarity: raritySchema,
  gridX: z.number().int().min(0).max(5),
  gridY: z.number().int().min(0).max(3),
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
  manualWateringsRemaining: z.number().int().min(0),
  progressToNextLevel: z.number().min(0).max(1),
  nextLevelLabel: z.enum(['开花', '盛放']).nullable()
})

export const waterFlowerInputSchema = z.object({
  flowerId: z.number().int().positive()
})

export const pickFlowerInputSchema = z.object({
  flowerId: z.number().int().positive()
})

export const waterFlowerResultSchema = z.object({
  success: z.boolean(),
  remaining: z.number().int().min(0),
  garden: z.array(gardenItemSchema),
  coinsEarned: z.number().int().nonnegative().optional()
})

export const pickFlowerResultSchema = z.object({
  success: z.boolean(),
  garden: z.array(gardenItemSchema),
  coinsEarned: z.number().int().nonnegative(),
  message: z.string().optional()
})

export const currencyBalanceSchema = z.object({
  balance: z.number().int().nonnegative()
})

export const currencyTransactionSchema = z.object({
  id: z.number().int().positive(),
  amount: z.number().int(),
  balanceAfter: z.number().int().nonnegative(),
  transactionType: z.enum(['earn', 'spend', 'initial']),
  description: z.string(),
  createdAt: z.string()
})

export const unlockLandResultSchema = z.object({
  success: z.boolean(),
  balance: z.number().int().nonnegative(),
  coinsSpent: z.number().int().nonnegative().optional(),
  message: z.string().optional()
})

export const seedInventoryItemSchema = z.object({
  id: z.number().int().positive(),
  emotionTag: emotionTagSchema,
  rarity: raritySchema,
  quantity: z.number().int().nonnegative(),
  obtainedAt: z.string()
})

export const releaseEmotionResultSchema = z.object({
  seedAdded: z.boolean(),
  emotionTag: emotionTagSchema,
  rarity: raritySchema,
  coinsEarned: z.number().int().nonnegative()
})

export const plantSeedInputSchema = z.object({
  emotionTag: emotionTagSchema,
  rarity: raritySchema,
  gridX: z.number().int(),
  gridY: z.number().int()
})

export const plantSeedResultSchema = z.object({
  success: z.boolean(),
  garden: z.array(gardenItemSchema),
  battleMatch: z
    .lazy(() => emotionBattleMatchSchema)
    .nullable()
    .optional(),
  message: z.string().optional()
})

export const dailyCheckInRewardSchema = z.object({
  type: z.enum(['currency', 'seed']),
  label: z.string(),
  coins: z.number().int().positive().optional(),
  emotionTag: emotionTagSchema.optional(),
  rarity: raritySchema.optional()
})

export const dailyCheckInStatusSchema = z.object({
  todayKey: z.string(),
  checkedInToday: z.boolean(),
  currentStreak: z.number().int().nonnegative(),
  nextStreak: z.number().int().positive(),
  lastClaimedOn: z.string().nullable(),
  rewardPreview: dailyCheckInRewardSchema
})

export const dailyCheckInResultSchema = z.object({
  success: z.boolean(),
  status: dailyCheckInStatusSchema,
  balance: z.number().int().nonnegative(),
  seeds: z.array(seedInventoryItemSchema),
  reward: dailyCheckInRewardSchema.optional(),
  message: z.string().optional()
})

export const composeSeedInputSchema = z.object({
  emotionTag: emotionTagSchema
})

export const seedOperationResultSchema = z.object({
  success: z.boolean(),
  seeds: z.array(seedInventoryItemSchema),
  balance: z.number().int().nonnegative(),
  message: z.string().optional(),
  rewardCoins: z.number().int().nonnegative().optional()
})

export const recycleSeedInputSchema = z.object({
  emotionTag: emotionTagSchema,
  rarity: raritySchema
})

export const emotionCalendarDaySchema = z.object({
  date: z.string(),
  count: z.number().int().nonnegative(),
  dominantEmotionTag: emotionTagSchema.nullable(),
  intensityLevel: z.number().int().min(0).max(4)
})

export const emotionCalendarQuerySchema = z.object({
  rangeDays: z.coerce.number().int().min(1).max(365).default(30),
  emotionTags: z.array(emotionTagSchema).default([])
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

export const achievementCategorySchema = z.enum([
  'milestone',
  'streak',
  'growth',
  'diversity',
  'ritual',
  'battle'
])

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

export const flowerDexEntrySchema = z.object({
  emotionTag: emotionTagSchema,
  rarity: raritySchema,
  unlocked: z.boolean(),
  firstSeenAt: z.string().nullable(),
  totalCount: z.number().int().nonnegative()
})

export const flowerDexSummarySchema = z.object({
  totalSlots: z.number().int().positive(),
  unlockedCount: z.number().int().nonnegative(),
  entries: z.array(flowerDexEntrySchema)
})

export const titleStatusSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  unlocked: z.boolean()
})

export const titleSummarySchema = z.object({
  activeTitle: titleStatusSchema.nullable(),
  titles: z.array(titleStatusSchema)
})

export const emotionPairSchema = z.object({
  emotion1: emotionTagSchema,
  emotion2: emotionTagSchema,
  label: z.string(),
  description: z.string()
})

export const emotionBattleMatchSchema = z.object({
  id: z.string(),
  flowerId1: z.number().int().positive(),
  flowerId2: z.number().int().positive(),
  emotionPair: emotionPairSchema,
  matchedAt: z.string(),
  rarityBoost: z.number()
})

export const emotionBattlePairProgressSchema = z.object({
  pair: emotionPairSchema,
  pairKey: z.string(),
  matchCount: z.number().int().nonnegative(),
  unlocked: z.boolean(),
  lastMatchedAt: z.string().nullable(),
  totalRarityBoost: z.number()
})

export const emotionBattleStatsSchema = z.object({
  totalMatches: z.number().int().nonnegative(),
  uniquePairs: z.number().int().nonnegative(),
  totalPairs: z.number().int().positive(),
  totalRarityBoost: z.number(),
  pairProgress: z.array(emotionBattlePairProgressSchema),
  recentMatches: z.array(emotionBattleMatchSchema)
})

export const decorationTypeSchema = z.enum(decorationTypeValues)

export const placedDecorationSchema = z.object({
  id: z.number().int().positive(),
  type: decorationTypeSchema,
  positionX: z.number(),
  positionY: z.number(),
  placedAt: z.string()
})

export const decorationStatusSchema = z.object({
  type: decorationTypeSchema,
  label: z.string(),
  description: z.string(),
  unlocked: z.boolean(),
  owned: z.boolean(),
  unlockLabel: z.string(),
  unlockHint: z.string(),
  unlockProgress: z.number().int().nonnegative(),
  unlockTarget: z.number().int().nonnegative(),
  unlockUnit: z.string(),
  bonus: z.object({
    type: z.string(),
    value: z.union([z.number(), z.string()]),
    description: z.string()
  }),
  emoji: z.string(),
  colorHex: z.string()
})

export const decorationSummarySchema = z.object({
  totalDecorations: z.number().int().nonnegative(),
  unlockedCount: z.number().int().nonnegative(),
  placedCount: z.number().int().nonnegative(),
  decorations: z.array(decorationStatusSchema),
  placed: z.array(placedDecorationSchema),
  activeBonus: z.object({
    wateringBonus: z.number(),
    rarityBonus: z.number(),
    growthBonus: z.number()
  })
})

export const placeDecorationInputSchema = z.object({
  type: decorationTypeSchema,
  positionX: z.number(),
  positionY: z.number()
})

export const movePlacedDecorationInputSchema = z.object({
  placedId: z.number().int().positive(),
  positionX: z.number(),
  positionY: z.number()
})

export const removePlacedDecorationInputSchema = z.object({
  placedId: z.number().int().positive()
})

export const purchaseDecorationInputSchema = z.object({
  type: decorationTypeSchema
})

export const unlockGardenLandInputSchema = z.object({
  gridX: z.number().int().min(0).max(5),
  gridY: z.number().int().min(0).max(3)
})

export const currencyTransactionsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(365).default(50)
})

export const purchaseDecorationResultSchema = z.object({
  success: z.boolean(),
  balance: z.number().int().nonnegative(),
  message: z.string().optional()
})

export type EmotionTag = z.infer<typeof emotionTagSchema>
export type FlowerRarity = z.infer<typeof raritySchema>
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
export type PickFlowerResult = z.infer<typeof pickFlowerResultSchema>
export type EmotionCalendarDay = z.infer<typeof emotionCalendarDaySchema>
export type EmotionCalendarQuery = z.infer<typeof emotionCalendarQuerySchema>
export type EmotionTimelineQuery = z.infer<typeof emotionTimelineQuerySchema>
export type EmotionTimelineEntry = GardenItem
export type ShakeWindowInput = z.infer<typeof shakeWindowInputSchema>
export type AchievementCategory = z.infer<typeof achievementCategorySchema>
export type AchievementStatus = z.infer<typeof achievementStatusSchema>
export type AchievementSummary = z.infer<typeof achievementSummarySchema>
export type FlowerDexEntry = z.infer<typeof flowerDexEntrySchema>
export type FlowerDexSummary = z.infer<typeof flowerDexSummarySchema>
export type TitleStatus = z.infer<typeof titleStatusSchema>
export type TitleSummary = z.infer<typeof titleSummarySchema>
export type EmotionPair = z.infer<typeof emotionPairSchema>
export type EmotionBattleMatch = z.infer<typeof emotionBattleMatchSchema>
export type EmotionBattlePairProgress = z.infer<typeof emotionBattlePairProgressSchema>
export type EmotionBattleStats = z.infer<typeof emotionBattleStatsSchema>
export type DecorationType = z.infer<typeof decorationTypeSchema>
export type PlacedDecoration = z.infer<typeof placedDecorationSchema>
export type DecorationStatus = z.infer<typeof decorationStatusSchema>
export type DecorationSummary = z.infer<typeof decorationSummarySchema>
export type PlaceDecorationInput = z.infer<typeof placeDecorationInputSchema>
export type MovePlacedDecorationInput = z.infer<typeof movePlacedDecorationInputSchema>
export type RemovePlacedDecorationInput = z.infer<typeof removePlacedDecorationInputSchema>
export type PurchaseDecorationInput = z.infer<typeof purchaseDecorationInputSchema>
export type PurchaseDecorationResult = z.infer<typeof purchaseDecorationResultSchema>
export type CurrencyBalance = z.infer<typeof currencyBalanceSchema>
export type CurrencyTransaction = z.infer<typeof currencyTransactionSchema>
export type CurrencyTransactionsQuery = z.infer<typeof currencyTransactionsQuerySchema>
export type UnlockGardenLandInput = z.infer<typeof unlockGardenLandInputSchema>
export type UnlockLandResult = z.infer<typeof unlockLandResultSchema>
export type SeedInventoryItem = z.infer<typeof seedInventoryItemSchema>
export type ReleaseEmotionResult = z.infer<typeof releaseEmotionResultSchema>
export type PlantSeedInput = z.infer<typeof plantSeedInputSchema>
export type PlantSeedResult = z.infer<typeof plantSeedResultSchema>
export type DailyCheckInReward = z.infer<typeof dailyCheckInRewardSchema>
export type DailyCheckInStatus = z.infer<typeof dailyCheckInStatusSchema>
export type DailyCheckInResult = z.infer<typeof dailyCheckInResultSchema>
export type ComposeSeedInput = z.infer<typeof composeSeedInputSchema>
export type RecycleSeedInput = z.infer<typeof recycleSeedInputSchema>
export type SeedOperationResult = z.infer<typeof seedOperationResultSchema>

export interface GardenLandCell {
  id: number
  gridX: number
  gridY: number
  unlocked: boolean
  unlockedAt: string
}

export interface EmoTrashApi {
  analyzeEmotion(input: EmotionAnalysisInput): Promise<ReleaseEmotionInput>
  releaseEmotion(input: ReleaseEmotionInput): Promise<ReleaseEmotionResult>
  listGarden(): Promise<GardenItem[]>
  waterFlower(flowerId: number): Promise<WaterFlowerResult>
  pickFlower(flowerId: number): Promise<PickFlowerResult>
  getEmotionStats(rangeDays: EmotionStatsRange): Promise<EmotionStatsSummary>
  getGardenGrowth(): Promise<GardenGrowthSnapshot>
  getAchievements(): Promise<AchievementSummary>
  getFlowerDex(): Promise<FlowerDexSummary>
  getTitles(): Promise<TitleSummary>
  listEmotionCalendar(rangeDays: number, emotionTags?: EmotionTag[]): Promise<EmotionCalendarDay[]>
  listEmotionTimeline(query?: Partial<EmotionTimelineQuery>): Promise<EmotionTimelineEntry[]>
  triggerShake(input?: Partial<ShakeWindowInput>): Promise<void>
  getEmotionBattleStats(): Promise<EmotionBattleStats>
  getDecorationSummary(): Promise<DecorationSummary>
  placeDecoration(input: PlaceDecorationInput): Promise<PlacedDecoration>
  movePlacedDecoration(input: MovePlacedDecorationInput): Promise<PlacedDecoration>
  removePlacedDecoration(input: RemovePlacedDecorationInput): Promise<{ success: boolean }>
  purchaseDecoration(input: PurchaseDecorationInput): Promise<PurchaseDecorationResult>
  getGardenLands(): Promise<GardenLandCell[]>
  unlockGardenLand(gridX: number, gridY: number): Promise<UnlockLandResult>
  getCurrencyBalance(): Promise<CurrencyBalance>
  getCurrencyTransactions(limit?: number): Promise<CurrencyTransaction[]>
  getSeedInventory(): Promise<SeedInventoryItem[]>
  getTotalSeedCount(): Promise<{ count: number }>
  plantSeed(input: PlantSeedInput): Promise<PlantSeedResult>
  getDailyCheckInStatus(): Promise<DailyCheckInStatus>
  claimDailyCheckIn(): Promise<DailyCheckInResult>
  composeSeed(input: ComposeSeedInput): Promise<SeedOperationResult>
  recycleSeed(input: RecycleSeedInput): Promise<SeedOperationResult>
}
