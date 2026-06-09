import type {
  CurrencyBalance,
  CurrencyTransaction,
  DailyCheckInReward,
  DailyCheckInStatus,
  DecorationType,
  EmotionAnalysisInput,
  EmotionStatsRange,
  EmotionTag,
  EmotionTimelineQuery,
  EmoTrashApi,
  FlowerRarity,
  GardenItem,
  GardenLandCell,
  MovePlacedDecorationInput,
  PickFlowerResult,
  PlaceDecorationInput,
  PlantSeedInput,
  ReleaseEmotionInput,
  ReleaseEmotionResult,
  SeedInventoryItem,
  ShakeWindowInput,
  UnlockLandResult,
  WaterFlowerResult
} from '../../../preload/api'
import { buildAchievementSummary } from '../../../shared/achievements'
import { buildRuleBasedEmotionAnalysis } from '../../../shared/emotionAnalysis'
import { buildEmotionBattleStats, checkBattleTrigger } from '../../../shared/emotionBattle'
import {
  buildEmotionCalendar,
  buildEmotionStatsSummary,
  buildEmotionTimeline,
  buildGardenGrowthSnapshot,
  enrichGardenItems,
  formatLocalTimestamp,
  isFlowerMature,
  toDateKey,
  toHour
} from '../../../shared/emotionInsights'
import { buildFlowerDexSummary } from '../../../shared/flowerDex'
import { buildDecorationSummary } from '../../../shared/gardenDecoration'
import { emotionTagValues, getEmotionDefinitionByTag } from '../../../shared/emotionMeta'
import {
  buildDailyCheckInReward,
  getSeedRecycleReward,
  SEED_COMPOSE_COST,
  SEED_COMPOSE_OUTPUT_RARITY
} from '../../../shared/rewardRules'
import { determineRarity } from '../../../shared/rarity'
import { buildTitleSummary } from '../../../shared/titles'

const STORAGE_KEY = 'emo-trash-browser-garden'
const WATERING_KEY = 'emo-trash-browser-waterings'
const SEED_KEY = 'emo-trash-browser-seeds'
const CURRENCY_KEY = 'emo-trash-browser-currency'
const CHECKIN_KEY = 'emo-trash-browser-checkin'

const rarityRewardMap: Record<FlowerRarity, number> = {
  common: 10,
  shiny: 25,
  stellar: 50,
  legendary: 100
}

function readGarden(): GardenItem[] {
  const rawValue = window.localStorage.getItem(STORAGE_KEY)
  if (!rawValue) {
    return []
  }

  return enrichGardenItems(JSON.parse(rawValue) as GardenItem[])
}

function saveGarden(items: GardenItem[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

function readSeeds(): SeedInventoryItem[] {
  const rawValue = window.localStorage.getItem(SEED_KEY)
  if (!rawValue) {
    return []
  }

  return JSON.parse(rawValue) as SeedInventoryItem[]
}

function saveSeeds(seeds: SeedInventoryItem[]): void {
  window.localStorage.setItem(SEED_KEY, JSON.stringify(seeds))
}

function addBrowserSeed(emotionTag: EmotionTag, rarity: FlowerRarity, quantity = 1): SeedInventoryItem[] {
  const seeds = readSeeds()
  const existing = seeds.find((item) => item.emotionTag === emotionTag && item.rarity === rarity)

  if (existing) {
    existing.quantity += quantity
    existing.obtainedAt = new Date().toISOString()
  } else {
    seeds.push({
      id: Date.now(),
      emotionTag,
      rarity,
      quantity,
      obtainedAt: new Date().toISOString()
    })
  }

  saveSeeds(seeds)
  return seeds
}

function useBrowserSeed(emotionTag: EmotionTag, rarity: FlowerRarity, quantity = 1): SeedInventoryItem[] | null {
  const seeds = readSeeds()
  const index = seeds.findIndex((item) => item.emotionTag === emotionTag && item.rarity === rarity)

  if (index === -1 || seeds[index].quantity < quantity) {
    return null
  }

  seeds[index].quantity -= quantity
  if (seeds[index].quantity <= 0) {
    seeds.splice(index, 1)
  }

  saveSeeds(seeds)
  return seeds
}

function readBrowserCheckIn(): { lastClaimedOn: string | null; streak: number } {
  const rawValue = window.localStorage.getItem(CHECKIN_KEY)
  if (!rawValue) {
    return { lastClaimedOn: null, streak: 0 }
  }

  return JSON.parse(rawValue) as { lastClaimedOn: string | null; streak: number }
}

function writeBrowserCheckIn(value: { lastClaimedOn: string; streak: number }): void {
  window.localStorage.setItem(CHECKIN_KEY, JSON.stringify(value))
}

function getPreviousDateKey(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00`)
  date.setDate(date.getDate() - 1)
  return toDateKey(date)
}

function getBrowserCheckInStatus(): DailyCheckInStatus {
  const todayKey = toDateKey(new Date())
  const record = readBrowserCheckIn()
  const checkedInToday = record.lastClaimedOn === todayKey
  const currentStreak = checkedInToday
    ? record.streak
    : record.lastClaimedOn === getPreviousDateKey(todayKey)
      ? record.streak
      : 0
  const nextStreak = checkedInToday ? currentStreak + 1 : currentStreak + 1

  return {
    todayKey,
    checkedInToday,
    currentStreak,
    nextStreak,
    lastClaimedOn: record.lastClaimedOn,
    rewardPreview: buildBrowserCheckInReward(nextStreak)
  }
}

function buildBrowserCheckInReward(streak: number): DailyCheckInReward {
  return buildDailyCheckInReward(streak)

  const emotionTag = emotionTagValues[streak % emotionTagValues.length]
  if (streak % 7 === 0) {
    return { type: 'seed', label: '连续 7 天星光种子', emotionTag, rarity: 'stellar' }
  }
  if (streak % 3 === 0) {
    return { type: 'seed', label: '连续 3 天闪光种子', emotionTag, rarity: 'shiny' }
  }
  if (streak % 2 === 0) {
    return { type: 'seed', label: '每日普通种子', emotionTag, rarity: 'common' }
  }
  return { type: 'currency', label: '每日金币', coins: 20 }
}

function readBrowserCurrency(): number {
  const rawValue = window.localStorage.getItem(CURRENCY_KEY)
  if (!rawValue) {
    return 100
  }

  return Number(rawValue)
}

function saveBrowserCurrency(balance: number): void {
  window.localStorage.setItem(CURRENCY_KEY, String(balance))
}

function getManualWateringsToday(): number {
  const rawValue = window.localStorage.getItem(WATERING_KEY)
  if (!rawValue) {
    return 0
  }

  const data = JSON.parse(rawValue) as { date: string; count: number }
  return data.date === toDateKey(new Date()) ? data.count : 0
}

function recordManualWatering(): void {
  const today = toDateKey(new Date())
  window.localStorage.setItem(
    WATERING_KEY,
    JSON.stringify({ date: today, count: getManualWateringsToday() + 1 })
  )
}

function getPreviewLands(): GardenLandCell[] {
  const lands: GardenLandCell[] = []

  for (let y = 0; y < 4; y += 1) {
    for (let x = 0; x < 6; x += 1) {
      const isCenter = (x === 2 || x === 3) && (y === 1 || y === 2)
      lands.push({
        id: y * 6 + x + 1,
        gridX: x,
        gridY: y,
        unlocked: isCenter,
        unlockedAt: isCenter ? new Date().toISOString() : ''
      })
    }
  }

  return lands
}

const browserPreviewApi: EmoTrashApi = {
  async analyzeEmotion(input: EmotionAnalysisInput): Promise<ReleaseEmotionInput> {
    return buildRuleBasedEmotionAnalysis(input.text, {
      source: 'browser-preview',
      sourceModel: 'browser-preview-rules'
    })
  },

  async releaseEmotion(input: ReleaseEmotionInput): Promise<ReleaseEmotionResult> {
    const rarity = determineRarity()
    const obtainedAt = new Date().toISOString()
    const seeds = readSeeds()
    const existing = seeds.find(
      (item) => item.emotionTag === input.emotionTag && item.rarity === rarity
    )

    if (existing) {
      existing.quantity += 1
      existing.obtainedAt = obtainedAt
    } else {
      seeds.push({
        id: Date.now(),
        emotionTag: input.emotionTag,
        rarity,
        quantity: 1,
        obtainedAt
      })
    }

    saveSeeds(seeds)

    return {
      seedAdded: true,
      emotionTag: input.emotionTag,
      rarity,
      coinsEarned: 15 // Mock金币奖励
    }
  },

  async listGarden(): Promise<GardenItem[]> {
    return readGarden().slice(0, 24)
  },

  async waterFlower(flowerId: number): Promise<WaterFlowerResult> {
    const remaining = Math.max(0, 1 - getManualWateringsToday())
    if (remaining <= 0) {
      return { success: false, remaining: 0, garden: readGarden().slice(0, 24) }
    }

    const garden = readGarden()
    const target = garden.find((item) => item.id === flowerId)
    if (!target) {
      return { success: false, remaining, garden: garden.slice(0, 24) }
    }

    target.totalWaterings += 1
    target.lastWateredOn = toDateKey(new Date())
    recordManualWatering()

    const enrichedGarden = enrichGardenItems(garden)
    saveGarden(enrichedGarden)

    return {
      success: true,
      remaining: remaining - 1,
      garden: enrichedGarden.slice(0, 24)
    }
  },

  async pickFlower(flowerId: number): Promise<PickFlowerResult> {
    const garden = readGarden()
    const flowerIndex = garden.findIndex((item) => item.id === flowerId)
    if (flowerIndex === -1) {
      return {
        success: false,
        garden: garden.slice(0, 24),
        coinsEarned: 0,
        message: '这朵花已经不在花园里了。'
      }
    }

    const flower = enrichGardenItems([garden[flowerIndex]])[0]
    if (!isFlowerMature(flower)) {
      garden.splice(flowerIndex, 1)
      saveGarden(garden)
      return {
        success: true,
        garden: garden.slice(0, 24),
        coinsEarned: 0,
        message: '花朵还没成熟，已采摘但不会获得金币。'
      }
    }

    const coinsEarned = rarityRewardMap[flower.rarity] ?? rarityRewardMap.common
    garden.splice(flowerIndex, 1)
    saveGarden(garden)
    saveBrowserCurrency(readBrowserCurrency() + coinsEarned)

    return {
      success: true,
      garden: garden.slice(0, 24),
      coinsEarned,
      message: `采摘完成，获得 ${coinsEarned} 金币。`
    }
  },

  async getEmotionStats(rangeDays: EmotionStatsRange) {
    return buildEmotionStatsSummary(readGarden(), rangeDays)
  },

  async getGardenGrowth() {
    return buildGardenGrowthSnapshot(readGarden(), Math.max(0, 1 - getManualWateringsToday()))
  },

  async getAchievements() {
    return buildAchievementSummary(readGarden())
  },

  async getFlowerDex() {
    return buildFlowerDexSummary(readGarden())
  },

  async getTitles() {
    return buildTitleSummary(readGarden())
  },

  async listEmotionCalendar(rangeDays: number, emotionTags: EmotionTag[] = []) {
    return buildEmotionCalendar(readGarden(), rangeDays, emotionTags)
  },

  async listEmotionTimeline(query?: Partial<EmotionTimelineQuery>) {
    return buildEmotionTimeline(readGarden(), {
      emotionTags: [],
      limit: 50,
      ...query
    })
  },

  async triggerShake(input?: Partial<ShakeWindowInput>): Promise<void> {
    const intensity = Math.min(32, Math.max(4, input?.intensity ?? 14))
    const durationMs = Math.min(1000, Math.max(120, input?.durationMs ?? 420))

    document.body.animate(
      [
        { transform: 'translate(0, 0)' },
        { transform: `translate(${intensity}px, 0)` },
        { transform: `translate(${-intensity}px, 0)` },
        { transform: 'translate(0, 0)' }
      ],
      {
        duration: durationMs,
        iterations: 2,
        easing: 'ease-in-out'
      }
    )
  },

  async getEmotionBattleStats() {
    return buildEmotionBattleStats(readGarden())
  },

  async getDecorationSummary() {
    const garden = readGarden()
    const achievements = buildAchievementSummary(garden)
    const titles = buildTitleSummary(garden)

    return buildDecorationSummary(
      {
        releaseCount: garden.length,
        longestStreak: buildGardenGrowthSnapshot(garden, 0).longestStreakDays,
        unlockedAchievements: achievements.achievements
          .filter((item) => item.unlocked)
          .map((item) => item.id),
        unlockedTitles: titles.titles.filter((item) => item.unlocked).map((item) => item.id),
        achievementStatuses: achievements.achievements,
        titleStatuses: titles.titles,
        battleCount: 0
      },
      [],
      []
    )
  },

  async placeDecoration(input: PlaceDecorationInput) {
    return {
      id: Date.now(),
      type: input.type,
      positionX: input.positionX,
      positionY: input.positionY,
      placedAt: toDateKey(new Date())
    }
  },

  async movePlacedDecoration(input: MovePlacedDecorationInput) {
    return {
      id: input.placedId,
      type: 'stone' as DecorationType,
      positionX: input.positionX,
      positionY: input.positionY,
      placedAt: toDateKey(new Date())
    }
  },

  async removePlacedDecoration(): Promise<{ success: boolean }> {
    return { success: true }
  },

  async purchaseDecoration(): Promise<{ success: boolean; balance: number; message?: string }> {
    return {
      success: false,
      balance: readBrowserCurrency(),
      message: '浏览器预览模式暂不支持购买装饰物'
    }
  },

  async getGardenLands(): Promise<GardenLandCell[]> {
    return getPreviewLands()
  },

  async unlockGardenLand(): Promise<UnlockLandResult> {
    return {
      success: false,
      balance: readBrowserCurrency(),
      message: '浏览器预览模式暂不支持解锁土地'
    }
  },

  async getCurrencyBalance(): Promise<CurrencyBalance> {
    return { balance: readBrowserCurrency() }
  },

  async getCurrencyTransactions(): Promise<CurrencyTransaction[]> {
    return []
  },

  async getSeedInventory(): Promise<SeedInventoryItem[]> {
    return readSeeds()
  },

  async getTotalSeedCount(): Promise<{ count: number }> {
    const count = readSeeds().reduce((sum, item) => sum + item.quantity, 0)
    return { count }
  },

  async getDailyCheckInStatus() {
    return getBrowserCheckInStatus()
  },

  async claimDailyCheckIn() {
    const status = getBrowserCheckInStatus()
    if (status.checkedInToday) {
      return {
        success: false,
        status,
        balance: readBrowserCurrency(),
        seeds: readSeeds(),
        message: '今天已经签到过了。'
      }
    }

    const reward = status.rewardPreview
    if (reward.type === 'currency') {
      saveBrowserCurrency(readBrowserCurrency() + (reward.coins ?? 0))
    } else if (reward.emotionTag && reward.rarity) {
      addBrowserSeed(reward.emotionTag, reward.rarity)
    }

    writeBrowserCheckIn({ lastClaimedOn: status.todayKey, streak: status.nextStreak })

    return {
      success: true,
      status: getBrowserCheckInStatus(),
      balance: readBrowserCurrency(),
      seeds: readSeeds(),
      reward
    }
  },

  async composeSeed(input) {
    const seeds = readSeeds()
    const target = seeds.find(
      (item) => item.emotionTag === input.emotionTag && item.rarity === 'common'
    )

    if (!target || target.quantity < SEED_COMPOSE_COST) {
      return {
        success: false,
        seeds,
        balance: readBrowserCurrency(),
        message: '需要 3 颗同情绪普通种子才能合成闪光种子。'
      }
    }

    useBrowserSeed(input.emotionTag, 'common', SEED_COMPOSE_COST)
    const nextSeeds = addBrowserSeed(input.emotionTag, SEED_COMPOSE_OUTPUT_RARITY)

    return {
      success: true,
      seeds: nextSeeds,
      balance: readBrowserCurrency(),
      message: '合成成功，获得 1 颗闪光种子。'
    }
  },

  async recycleSeed(input) {
    const nextSeeds = useBrowserSeed(input.emotionTag, input.rarity)

    if (!nextSeeds) {
      return {
        success: false,
        seeds: readSeeds(),
        balance: readBrowserCurrency(),
        message: '背包里没有这颗种子。'
      }
    }

    const rewardCoins = getSeedRecycleReward(input.rarity)
    const nextBalance = readBrowserCurrency() + rewardCoins
    saveBrowserCurrency(nextBalance)

    return {
      success: true,
      seeds: nextSeeds,
      balance: nextBalance,
      rewardCoins,
      message: `回收成功，获得 ${rewardCoins} 金币。`
    }
  },

  async plantSeed(input: PlantSeedInput) {
    const lands = getPreviewLands()
    const land = lands.find((item) => item.gridX === input.gridX && item.gridY === input.gridY)
    if (!land?.unlocked) {
      return { success: false, garden: readGarden().slice(0, 24), message: '这块土地还没有解锁' }
    }

    const garden = readGarden()
    const occupied = garden.some((item) => item.gridX === input.gridX && item.gridY === input.gridY)
    if (occupied) {
      return { success: false, garden: garden.slice(0, 24), message: '该地块已经种着花朵了' }
    }

    const seeds = readSeeds()
    const seedIndex = seeds.findIndex(
      (item) => item.emotionTag === input.emotionTag && item.rarity === input.rarity
    )

    if (seedIndex === -1 || seeds[seedIndex].quantity <= 0) {
      return { success: false, garden: garden.slice(0, 24), message: '背包里没有这颗种子' }
    }

    seeds[seedIndex].quantity -= 1
    if (seeds[seedIndex].quantity <= 0) {
      seeds.splice(seedIndex, 1)
    }
    saveSeeds(seeds)

    const now = new Date()
    const definition = getEmotionDefinitionByTag(input.emotionTag)
    const nextItem: GardenItem = {
      id: Date.now(),
      timestamp: formatLocalTimestamp(now),
      releasedOn: toDateKey(now),
      releasedHour: toHour(now),
      flowerType: definition.flowerType,
      colorHex: definition.colorHex,
      growthStage: 1,
      totalWaterings: 0,
      lastWateredOn: '',
      emotionTag: input.emotionTag,
      rarity: input.rarity,
      gridX: input.gridX,
      gridY: input.gridY
    }

    const battleMatch = checkBattleTrigger(nextItem, garden.slice(0, 9), 24)
    const nextGarden = enrichGardenItems([nextItem, ...garden])
    saveGarden(nextGarden)

    return { success: true, garden: nextGarden.slice(0, 24), battleMatch }
  }
}

export function getRuntimeApi(): EmoTrashApi {
  return window.api ?? browserPreviewApi
}
