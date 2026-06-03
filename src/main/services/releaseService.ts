import type {
  AchievementSummary,
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
import { getEmotionDefinitionByTag } from '../../shared/emotionMeta'
import { determineRarity } from '../../shared/rarity'
import { EmotionAnalysisService } from './emotionAnalysisService'
import { DecorationBattleRepository } from '../db/repositories/decorationBattleRepository'
import { CurrencyRepository } from '../db/repositories/currencyRepository'
import { EmotionRepository } from '../db/repositories/emotionRepository'
import { SeedInventoryRepository } from '../db/repositories/seedInventoryRepository'

const DAILY_MANUAL_WATERING_LIMIT = 1

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
    private readonly emotionAnalysisService?: EmotionAnalysisService
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

    // 获取装饰加成
    const decorationBonus = calculateDecorationBonus(
      this.decorationBattleRepository.getPlacedDecorations()
    )

    // 应用稀有度加成到随机值
    const baseRandom = Math.random()
    const rarityBoostedRandom = Math.max(0, baseRandom - decorationBonus.rarityBonus)
    const rarity = ((input as { rarity?: FlowerRarity }).rarity ??
      determineRarity(rarityBoostedRandom)) as FlowerRarity

    // 添加种子到背包
    this.seedInventoryRepository.addSeed(emotionTag, rarity)

    // 根据情绪强度发放金币
    const intensityCoins = emotionIntensity === 'mild' ? 5 : emotionIntensity === 'strong' ? 20 : 10
    // 根据稀有度发放额外金币
    const rarityBonus = rarityRewardMap[rarity] ?? 0
    const totalCoins = intensityCoins + rarityBonus

    this.currencyRepository.addCurrency(totalCoins, `释放${emotionTag}情绪`)

    return {
      seedAdded: true,
      emotionTag,
      rarity,
      coinsEarned: totalCoins
    }
  }

  plantSeed(
    emotionTag: string,
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
    const emotionDefinition = getEmotionDefinitionByTag(emotionTag as EmotionTag)
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
    const unlockedLandCount = this.gardenLandRepository.getUnlockedCount()
    const ownedDecorationCount = this.decorationBattleRepository.getOwnedDecorations().length
    const achievements = buildAchievementSummary(items, unlockedLandCount, ownedDecorationCount)
    const battleCount = this.decorationBattleRepository.getEmotionBattleCount()

    const stats = {
      releaseCount: items.length,
      longestStreak: buildGardenGrowthSnapshot(items, 0, new Date()).longestStreakDays,
      unlockedAchievements: achievements.achievements.filter((a) => a.unlocked).map((a) => a.id),
      battleCount
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
    const unlockedLandCount = this.gardenLandRepository.getUnlockedCount()
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

  getSeedInventory() {
    return this.seedInventoryRepository.getAllSeeds()
  }

  getTotalSeedCount(): number {
    return this.seedInventoryRepository.getTotalSeedCount()
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
