import type {
  AchievementSummary,
  DailyCheckInResult,
  DailyCheckInReward,
  DailyCheckInStatus,
  EmotionCalendarDay,
  EmotionStatsRange,
  EmotionStatsSummary,
  EmotionTag,
  EmotionTimelineEntry,
  EmotionTimelineQuery,
  FlowerDexSummary,
  FlowerRarity,
  GardenGrowthSnapshot,
  GardenItem,
  PickFlowerResult,
  PlantSeedResult,
  ReleaseEmotionInput,
  ReleaseEmotionResult,
  SeedInventoryItem,
  SeedOperationResult,
  TitleSummary,
  WaterFlowerResult
} from '../../preload/api'
import {
  buildEmotionCalendar,
  buildEmotionStatsSummary,
  buildEmotionTimeline,
  buildGardenGrowthSnapshot,
  enrichGardenItems,
  formatLocalTimestamp,
  isFlowerMature,
  parseTimestamp,
  toDateKey,
  toHour
} from '../../shared/emotionInsights'
import { buildAchievementSummary } from '../../shared/achievements'
import { buildFlowerDexSummary } from '../../shared/flowerDex'
import { buildTitleSummary } from '../../shared/titles'
import {
  buildEmotionBattleStats,
  checkBattleTrigger,
  type EmotionBattleStats
} from '../../shared/emotionBattle'
import {
  buildDecorationSummary,
  calculateDecorationBonus,
  decorationDefinitions,
  type DecorationSummary,
  type DecorationType,
  type PlacedDecoration
} from '../../shared/gardenDecoration'
import { emotionTagValues, getEmotionDefinitionByTag } from '../../shared/emotionMeta'
import {
  buildDailyCheckInReward,
  getSeedRecycleReward,
  SEED_COMPOSE_COST,
  SEED_COMPOSE_OUTPUT_RARITY
} from '../../shared/rewardRules'
import { determineRarity } from '../../shared/rarity'
import { EmotionAnalysisService } from './emotionAnalysisService'
import { DecorationBattleRepository } from '../db/repositories/decorationBattleRepository'
import { CurrencyRepository } from '../db/repositories/currencyRepository'
import { DailyCheckInRepository } from '../db/repositories/dailyCheckInRepository'
import { EmotionRepository } from '../db/repositories/emotionRepository'
import { GardenLandRepository } from '../db/repositories/gardenLandRepository'
import { SeedInventoryRepository } from '../db/repositories/seedInventoryRepository'

const DAILY_MANUAL_WATERING_LIMIT = 1
const MAX_RARITY_BONUS = 0.25

const rarityRewardMap: Record<FlowerRarity, number> = {
  common: 5,
  shiny: 15,
  stellar: 30,
  legendary: 100
}

export class ReleaseService {
  constructor(
    private readonly emotionRepository: EmotionRepository,
    private readonly decorationBattleRepository: DecorationBattleRepository,
    private readonly currencyRepository: CurrencyRepository,
    private readonly seedInventoryRepository: SeedInventoryRepository,
    private readonly gardenLandRepository?: GardenLandRepository,
    private readonly emotionAnalysisService?: EmotionAnalysisService,
    private readonly dailyCheckInRepository?: DailyCheckInRepository
  ) {}

  analyzeEmotion(text: string): Promise<ReleaseEmotionInput> {
    if (!this.emotionAnalysisService) {
      throw new Error('EmotionAnalysisService is not configured')
    }

    return this.emotionAnalysisService.analyze(text)
  }

  releaseEmotion(input: ReleaseEmotionInput): ReleaseEmotionResult {
    const emotionTag = input.emotionTag
    const emotionIntensity = input.analysis?.emotionIntensity ?? 'moderate'

    const rarity =
      (input as { rarity?: FlowerRarity }).rarity ??
      determineRarity(Math.random(), this.getActiveRarityBonus())

    // 添加种子到背包
    this.seedInventoryRepository.addSeed(emotionTag, rarity)

    // 根据情绪强度发放金币
    const intensityCoins = emotionIntensity === 'mild' ? 5 : emotionIntensity === 'strong' ? 20 : 10
    // 根据稀有度发放额外金币
    const rarityCoins = rarityRewardMap[rarity] ?? 0
    const totalCoins = intensityCoins + rarityCoins

    this.currencyRepository.addCurrency(totalCoins, `释放${emotionTag}情绪`)

    return {
      seedAdded: true,
      emotionTag,
      rarity,
      coinsEarned: totalCoins
    }
  }

  plantSeed(
    emotionTag: EmotionTag,
    rarity: FlowerRarity,
    gridX: number,
    gridY: number
  ): PlantSeedResult {
    if (this.emotionRepository.isGridOccupied(gridX, gridY)) {
      return {
        success: false,
        garden: this.listGarden(),
        message: '该地块已经种着花朵了'
      }
    }

    const hasSeed = this.seedInventoryRepository.useSeed(emotionTag, rarity)
    if (!hasSeed) {
      return {
        success: false,
        garden: this.listGarden(),
        message: '背包里没有这颗种子'
      }
    }

    const now = new Date()
    const emotionDefinition = getEmotionDefinitionByTag(emotionTag)
    const plantedInput: ReleaseEmotionInput = {
      textLength: 0,
      exclamationDensity: 0,
      emphasisLevel: 0,
      flowerType: emotionDefinition.flowerType,
      colorHex: emotionDefinition.colorHex,
      emotionTag: emotionDefinition.emotionTag,
      analysis: {
        emotionIntensity: 'moderate',
        triggerScene: '手动种植',
        guidanceQuestion: '这颗种子会长成怎样的花？',
        suggestedLabels: [emotionDefinition.displayName],
        confidence: 1,
        timeContextHour: toHour(now),
        timeContextLabel: '播种时刻',
        source: 'rule-fallback',
        sourceModel: 'manual-planting'
      }
    }

    const plantedFlower = this.emotionRepository.createSeed(
      plantedInput,
      formatLocalTimestamp(now),
      toDateKey(now),
      toHour(now),
      {
        rarity,
        totalWaterings: 0,
        lastWateredOn: '',
        gridX,
        gridY
      }
    )

    const recentFlowers = this.listGarden()
      .filter((item) => item.id !== plantedFlower.id)
      .slice(0, 9)
    const battleMatch = checkBattleTrigger(plantedFlower, recentFlowers, 24)

    if (battleMatch) {
      this.decorationBattleRepository.recordEmotionBattle(battleMatch)
    }

    return {
      success: true,
      garden: this.listGarden(),
      battleMatch
    }
  }

  waterFlower(flowerId: number): WaterFlowerResult {
    const now = new Date()
    const dateKey = toDateKey(now)

    if (!this.emotionRepository.flowerExists(flowerId)) {
      return {
        success: false,
        remaining: this.getRemainingManualWaterings(dateKey),
        garden: this.listGarden()
      }
    }

    const remaining = this.getRemainingManualWaterings(dateKey)
    if (remaining <= 0) {
      return { success: false, remaining: 0, garden: this.listGarden() }
    }

    // 获取装饰加成
    const decorationBonus = calculateDecorationBonus(
      this.decorationBattleRepository.getPlacedDecorations()
    )
    const growthMultiplier = 1.0 + decorationBonus.growthBonus

    this.emotionRepository.recordWatering(flowerId, 'manual', dateKey, growthMultiplier)

    // 手动浇水奖励金币
    const wateringReward = 3
    this.currencyRepository.addCurrency(wateringReward, '手动浇水')

    return {
      success: true,
      remaining: remaining - 1,
      garden: this.listGarden(),
      coinsEarned: wateringReward
    }
  }

  getEmotionBattleStats(): EmotionBattleStats {
    return buildEmotionBattleStats(this.getEnrichedItems())
  }

  getDecorationSummary(): DecorationSummary {
    const items = this.getEnrichedItems()
    const unlockedLandCount = this.gardenLandRepository?.getUnlockedCount() ?? 0
    const ownedDecorationCount = this.decorationBattleRepository.getOwnedDecorations().length
    const achievements = buildAchievementSummary(items, unlockedLandCount, ownedDecorationCount)
    const titles = buildTitleSummary(items)
    const battleCount = this.decorationBattleRepository.getEmotionBattleCount()

    const stats = {
      releaseCount: items.length,
      longestStreak: buildGardenGrowthSnapshot(items, 0, new Date()).longestStreakDays,
      unlockedAchievements: achievements.achievements.filter((a) => a.unlocked).map((a) => a.id),
      unlockedTitles: titles.titles.filter((title) => title.unlocked).map((title) => title.id),
      battleCount,
      achievementStatuses: achievements.achievements,
      titleStatuses: titles.titles
    }

    return buildDecorationSummary(
      stats,
      this.decorationBattleRepository.getOwnedDecorations(),
      this.decorationBattleRepository.getPlacedDecorations()
    )
  }

  placeDecoration(type: DecorationType, positionX: number, positionY: number): PlacedDecoration {
    return this.decorationBattleRepository.placeDecoration(type, positionX, positionY)
  }

  movePlacedDecoration(placedId: number, positionX: number, positionY: number): PlacedDecoration {
    return this.decorationBattleRepository.movePlacedDecoration(placedId, positionX, positionY)
  }

  purchaseDecoration(type: DecorationType): {
    success: boolean
    message?: string
    balance: number
  } {
    const definition = decorationDefinitions.find((item) => item.type === type)
    if (!definition) {
      return {
        success: false,
        message: '装饰物不存在',
        balance: this.currencyRepository.getBalance()
      }
    }

    const owned = this.decorationBattleRepository.getOwnedDecorations()
    if (owned.includes(type)) {
      return {
        success: false,
        message: '已拥有该装饰物',
        balance: this.currencyRepository.getBalance()
      }
    }

    const summary = this.getDecorationSummary()
    const status = summary.decorations.find((item) => item.type === type)
    if (!status?.unlocked) {
      return {
        success: false,
        message: '装饰物尚未解锁',
        balance: this.currencyRepository.getBalance()
      }
    }

    const result = this.currencyRepository.spendCurrency(
      definition.price,
      `购买装饰物 ${definition.label}`
    )
    if (!result) {
      return { success: false, message: '金币不足', balance: this.currencyRepository.getBalance() }
    }

    this.decorationBattleRepository.unlockDecoration(type)
    return { success: true, balance: result.balance }
  }

  removePlacedDecoration(placedId: number): void {
    this.decorationBattleRepository.removePlacedDecoration(placedId)
  }

  pickFlower(flowerId: number): PickFlowerResult {
    const flower = this.emotionRepository.findActiveFlowerById(flowerId)
    if (!flower) {
      return {
        success: false,
        garden: this.listGarden(),
        coinsEarned: 0,
        message: '这朵花已经不在花园里了。'
      }
    }

    const enrichedFlower = enrichGardenItems([flower])[0]
    if (!isFlowerMature(enrichedFlower)) {
      this.emotionRepository.pickFlower(flowerId, toDateKey(new Date()))
      return {
        success: true,
        garden: this.listGarden(),
        coinsEarned: 0,
        message: '花朵还没成熟，已采摘但不会获得金币。'
      }
    }

    const coinsEarned = rarityRewardMap[enrichedFlower.rarity] ?? rarityRewardMap.common
    this.currencyRepository.addCurrency(coinsEarned, `采摘 ${enrichedFlower.rarity} 花朵`)
    this.emotionRepository.pickFlower(flowerId, toDateKey(new Date()))

    return {
      success: true,
      garden: this.listGarden(),
      coinsEarned,
      message: `采摘完成，获得 ${coinsEarned} 金币。`
    }
  }

  listGarden(): GardenItem[] {
    const items = this.emotionRepository.listAllGarden()
    const enrichedItems = enrichGardenItems(items)
    this.emotionRepository.syncGrowthStages(enrichedItems)
    return enrichedItems.slice(0, 24)
  }

  getEmotionStats(rangeDays: EmotionStatsRange): EmotionStatsSummary {
    return buildEmotionStatsSummary(this.getEnrichedItems(), rangeDays)
  }

  getGardenGrowth(): GardenGrowthSnapshot {
    const now = new Date()
    return buildGardenGrowthSnapshot(
      this.getEnrichedItems(),
      this.getRemainingManualWaterings(toDateKey(now)),
      now
    )
  }

  getAchievements(): AchievementSummary {
    const unlockedLandCount = this.gardenLandRepository?.getUnlockedCount() ?? 0
    const ownedDecorationCount = this.decorationBattleRepository.getOwnedDecorations().length
    return buildAchievementSummary(this.getEnrichedItems(), unlockedLandCount, ownedDecorationCount)
  }

  getFlowerDex(): FlowerDexSummary {
    return buildFlowerDexSummary(this.getEnrichedItems())
  }

  getTitles(): TitleSummary {
    return buildTitleSummary(this.getEnrichedItems())
  }

  listEmotionCalendar(rangeDays: number, emotionTags: EmotionTag[] = []): EmotionCalendarDay[] {
    return buildEmotionCalendar(this.getEnrichedItems(), rangeDays, emotionTags)
  }

  listEmotionTimeline(query: EmotionTimelineQuery): EmotionTimelineEntry[] {
    return buildEmotionTimeline(this.getEnrichedItems(), query)
  }

  getCurrencyBalance(): number {
    return this.currencyRepository.getBalance()
  }

  getCurrencyTransactions(limit = 50) {
    return this.currencyRepository.getTransactionHistory(limit)
  }

  getSeedInventory(): SeedInventoryItem[] {
    return this.seedInventoryRepository.getAllSeeds().map((seed) => ({
      ...seed,
      emotionTag: seed.emotionTag as EmotionTag,
      rarity: seed.rarity as FlowerRarity
    }))
  }

  getTotalSeedCount(): number {
    return this.seedInventoryRepository.getTotalSeedCount()
  }

  getDailyCheckInStatus(): DailyCheckInStatus {
    const repository = this.requireDailyCheckInRepository()
    const todayKey = toDateKey(new Date())
    const checkedInToday = repository.hasCheckedIn(todayKey)
    const currentStreak = repository.getCurrentStreak(todayKey)
    const nextStreak = checkedInToday ? currentStreak + 1 : currentStreak + 1
    const lastRecord = repository.getLastRecord()

    return {
      todayKey,
      checkedInToday,
      currentStreak,
      nextStreak,
      lastClaimedOn: lastRecord?.checkedOn ?? null,
      rewardPreview: this.buildCheckInReward(nextStreak)
    }
  }

  claimDailyCheckIn(): DailyCheckInResult {
    const repository = this.requireDailyCheckInRepository()
    const status = this.getDailyCheckInStatus()

    if (status.checkedInToday) {
      return {
        success: false,
        status,
        balance: this.currencyRepository.getBalance(),
        seeds: this.getSeedInventory(),
        message: '今天已经签到过了。'
      }
    }

    const reward = status.rewardPreview
    const recorded = repository.recordCheckIn({
      dateKey: status.todayKey,
      rewardType: reward.type,
      rewardAmount: reward.coins ?? 0,
      emotionTag: reward.emotionTag,
      rarity: reward.rarity
    })

    if (!recorded) {
      const nextStatus = this.getDailyCheckInStatus()
      return {
        success: false,
        status: nextStatus,
        balance: this.currencyRepository.getBalance(),
        seeds: this.getSeedInventory(),
        message: '今天已经签到过了。'
      }
    }

    if (reward.type === 'currency') {
      this.currencyRepository.addCurrency(reward.coins ?? 0, `每日签到：${reward.label}`)
    } else if (reward.emotionTag && reward.rarity) {
      this.seedInventoryRepository.addSeed(reward.emotionTag, reward.rarity)
    }

    return {
      success: true,
      status: this.getDailyCheckInStatus(),
      balance: this.currencyRepository.getBalance(),
      seeds: this.getSeedInventory(),
      reward
    }
  }

  composeSeed(emotionTag: EmotionTag): SeedOperationResult {
    const commonCount = this.seedInventoryRepository.getSeedCount(emotionTag, 'common')
    if (commonCount < SEED_COMPOSE_COST) {
      return {
        success: false,
        seeds: this.getSeedInventory(),
        balance: this.currencyRepository.getBalance(),
        message: '需要 3 颗同情绪普通种子才能合成闪光种子。'
      }
    }

    this.seedInventoryRepository.useSeed(emotionTag, 'common', SEED_COMPOSE_COST)
    this.seedInventoryRepository.addSeed(emotionTag, SEED_COMPOSE_OUTPUT_RARITY)

    return {
      success: true,
      seeds: this.getSeedInventory(),
      balance: this.currencyRepository.getBalance(),
      message: '合成成功，获得 1 颗闪光种子。'
    }
  }

  recycleSeed(emotionTag: EmotionTag, rarity: FlowerRarity): SeedOperationResult {
    const used = this.seedInventoryRepository.useSeed(emotionTag, rarity)
    if (!used) {
      return {
        success: false,
        seeds: this.getSeedInventory(),
        balance: this.currencyRepository.getBalance(),
        message: '背包里没有这颗种子。'
      }
    }

    const rewardCoins = getSeedRecycleReward(rarity)
    const result = this.currencyRepository.addCurrency(rewardCoins, `回收${rarity}种子`)

    return {
      success: true,
      seeds: this.getSeedInventory(),
      balance: result.balance,
      rewardCoins,
      message: `回收成功，获得 ${rewardCoins} 金币。`
    }
  }

  private getRemainingManualWaterings(dateKey: string): number {
    const used = this.emotionRepository.getManualWateringCountToday(dateKey)
    const decorationBonus = this.getDecorationWateringBonus()
    return Math.max(0, DAILY_MANUAL_WATERING_LIMIT + decorationBonus - used)
  }

  private getDecorationWateringBonus(): number {
    return calculateDecorationBonus(this.decorationBattleRepository.getPlacedDecorations())
      .wateringBonus
  }

  private getActiveRarityBonus(): number {
    const decorationBonus = calculateDecorationBonus(
      this.decorationBattleRepository.getPlacedDecorations()
    ).rarityBonus
    const battleBonus = buildEmotionBattleStats(this.getEnrichedItems()).totalRarityBoost

    return Math.min(MAX_RARITY_BONUS, decorationBonus + battleBonus)
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

  private requireDailyCheckInRepository(): DailyCheckInRepository {
    if (!this.dailyCheckInRepository) {
      throw new Error('DailyCheckInRepository is not configured')
    }

    return this.dailyCheckInRepository
  }

  private buildCheckInReward(streak: number): DailyCheckInReward {
    return buildDailyCheckInReward(streak)

    if (streak % 7 === 0) {
      return {
        type: 'seed',
        label: '连续 7 天星光种子',
        emotionTag: this.pickRewardEmotion(streak),
        rarity: 'stellar'
      }
    }

    if (streak % 3 === 0) {
      return {
        type: 'seed',
        label: '连续 3 天闪光种子',
        emotionTag: this.pickRewardEmotion(streak),
        rarity: 'shiny'
      }
    }

    if (streak % 2 === 0) {
      return {
        type: 'seed',
        label: '每日普通种子',
        emotionTag: this.pickRewardEmotion(streak),
        rarity: 'common'
      }
    }

    return {
      type: 'currency',
      label: '每日金币',
      coins: 20
    }
  }

  private pickRewardEmotion(seed: number): EmotionTag {
    return emotionTagValues[Math.abs(seed) % emotionTagValues.length]
  }
}
