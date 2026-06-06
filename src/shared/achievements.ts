import type { GardenItem } from '../preload/api'
import { emotionTagValues, type EmotionTag } from './emotionMeta'
import {
  buildGardenGrowthSnapshot,
  enrichGardenItems,
  parseTimestamp,
  toDateKey
} from './emotionInsights'
import { detectEmotionBattles } from './emotionBattle'

export type AchievementCategory =
  | 'milestone'
  | 'streak'
  | 'growth'
  | 'diversity'
  | 'ritual'
  | 'battle'

export interface AchievementDefinition {
  id: string
  category: AchievementCategory
  title: string
  description: string
  hint: string
  target: number
  unit: string
}

export interface AchievementStatus {
  id: string
  category: AchievementCategory
  title: string
  description: string
  hint: string
  target: number
  unit: string
  progress: number
  unlocked: boolean
  unlockedAt: string | null
}

export interface AchievementSummary {
  totalCount: number
  unlockedCount: number
  unlockRatio: number
  recentlyUnlocked: AchievementStatus[]
  achievements: AchievementStatus[]
}

const achievementDefinitions: AchievementDefinition[] = [
  {
    id: 'first-release',
    category: 'milestone',
    title: '首次释放',
    description: '完成第一次情绪释放，把第一颗种子放进花园。',
    hint: '完成任意一次粉碎仪式即可解锁。',
    target: 1,
    unit: '次'
  },
  {
    id: 'ten-releases',
    category: 'milestone',
    title: '十朵起步',
    description: '累计释放 10 次，花园开始有了规模。',
    hint: '继续把不想留的情绪交给仪式。',
    target: 10,
    unit: '朵'
  },
  {
    id: 'fifty-releases',
    category: 'milestone',
    title: '半百花园',
    description: '累计释放 50 次，已经形成稳定的释放节律。',
    hint: '保持当前节律，不必勉强自己。',
    target: 50,
    unit: '朵'
  },
  {
    id: 'hundred-releases',
    category: 'milestone',
    title: '百朵花园',
    description: '累计释放 100 次，花园进入大规模阶段。',
    hint: '这是一段需要时间累积的成就。',
    target: 100,
    unit: '朵'
  },
  {
    id: 'streak-3',
    category: 'streak',
    title: '连续三日',
    description: '连续 3 天进行至少一次释放。',
    hint: '今天完成一次释放，连续天数会自动累计。',
    target: 3,
    unit: '天'
  },
  {
    id: 'streak-7',
    category: 'streak',
    title: '连续七日',
    description: '连续 7 天进行至少一次释放。',
    hint: '让花园进入开花期的节律标志。',
    target: 7,
    unit: '天'
  },
  {
    id: 'streak-14',
    category: 'streak',
    title: '连续两周',
    description: '连续 14 天进行至少一次释放。',
    hint: '只要有空就释放一次，不必长篇大论。',
    target: 14,
    unit: '天'
  },
  {
    id: 'first-bloom',
    category: 'growth',
    title: '首次开花',
    description: '让花园中的任意一朵花成长到开花阶段。',
    hint: '坚持给花朵浇水，到达第 4 阶段。',
    target: 1,
    unit: '朵'
  },
  {
    id: 'first-flourish',
    category: 'growth',
    title: '首次盛放',
    description: '让花园中的任意一朵花成长到盛放阶段。',
    hint: '需要持续浇水并保持花朵不枯萎。',
    target: 1,
    unit: '朵'
  },
  {
    id: 'three-flourish',
    category: 'growth',
    title: '三朵盛放',
    description: '让 3 朵花同时进入盛放阶段。',
    hint: '需要长期稳定的浇水节律。',
    target: 3,
    unit: '朵'
  },
  {
    id: 'all-emotions',
    category: 'diversity',
    title: '情绪全谱',
    description: '至少释放过全部 6 类情绪。',
    hint: '当不同情绪出现时不要回避，每种都会留下不同的花。',
    target: emotionTagValues.length,
    unit: '类'
  },
  {
    id: 'manual-watering-10',
    category: 'ritual',
    title: '细心园丁',
    description: '累计完成 10 次手动浇水。',
    hint: '在花园页可以单独给花朵浇水，基础每天 1 次，装饰可增加次数。',
    target: 10,
    unit: '次'
  },
  {
    id: 'emotion-harmonizer',
    category: 'battle',
    title: '情绪调和者',
    description: '触发 10 次情绪对抗匹配。',
    hint: '在 24 小时内释放对立情绪（愤怒↔平静、焦虑↔释然、崩溃↔疲惫）。',
    target: 10,
    unit: '次'
  },
  {
    id: 'balance-master',
    category: 'battle',
    title: '平衡大师',
    description: '收集全部 3 种情绪对。',
    hint: '体验所有对立情绪的转换。',
    target: 3,
    unit: '种'
  },
  {
    id: 'collector-5',
    category: 'diversity',
    title: '初级收藏家',
    description: '收集 5 种不同的花朵类型。',
    hint: '尝试释放不同情绪和强度的组合。',
    target: 5,
    unit: '种'
  },
  {
    id: 'collector-10',
    category: 'diversity',
    title: '中级收藏家',
    description: '收集 10 种不同的花朵类型。',
    hint: '探索更多情绪和稀有度的组合。',
    target: 10,
    unit: '种'
  },
  {
    id: 'collector-20',
    category: 'diversity',
    title: '高级收藏家',
    description: '收集 20 种不同的花朵类型。',
    hint: '成为真正的花朵收藏大师。',
    target: 20,
    unit: '种'
  },
  {
    id: 'first-shiny',
    category: 'growth',
    title: '初遇闪光',
    description: '获得首个闪光花朵。',
    hint: '闪光花朵基础概率为 12%，装饰和情绪调和可提升稀有概率。',
    target: 1,
    unit: '朵'
  },
  {
    id: 'first-stellar',
    category: 'growth',
    title: '星辰降临',
    description: '获得首个星光花朵。',
    hint: '星光花朵基础概率为 2.5%，装饰和情绪调和可提升稀有概率。',
    target: 1,
    unit: '朵'
  },
  {
    id: 'first-legendary',
    category: 'growth',
    title: '传说诞生',
    description: '获得首个传说花朵。',
    hint: '传说花朵基础概率为 0.5%，需要一点运气，也可通过加成提高机会。',
    target: 1,
    unit: '朵'
  },
  {
    id: 'watering-50',
    category: 'ritual',
    title: '勤劳园丁',
    description: '累计完成 50 次手动浇水。',
    hint: '持续照顾花园的奖励。',
    target: 50,
    unit: '次'
  },
  {
    id: 'watering-100',
    category: 'ritual',
    title: '浇水大师',
    description: '累计完成 100 次手动浇水。',
    hint: '你已经是花园护理专家了。',
    target: 100,
    unit: '次'
  },
  {
    id: 'watering-500',
    category: 'ritual',
    title: '浇水传说',
    description: '累计完成 500 次手动浇水。',
    hint: '无人能比的护花使者。',
    target: 500,
    unit: '次'
  },
  {
    id: 'streak-30',
    category: 'streak',
    title: '连续一月',
    description: '连续 30 天进行至少一次释放。',
    hint: '这是一个月的坚持，已经形成稳固习惯。',
    target: 30,
    unit: '天'
  },
  {
    id: 'full-garden',
    category: 'milestone',
    title: '完整花园',
    description: '解锁全部 24 块土地。',
    hint: '让花园达到最大规模。',
    target: 24,
    unit: '块'
  },
  {
    id: 'decorator',
    category: 'ritual',
    title: '装饰大师',
    description: '收集全部 8 种装饰物。',
    hint: '用装饰物美化你的花园。',
    target: 8,
    unit: '种'
  },
  {
    id: 'battle-master',
    category: 'battle',
    title: '对抗专家',
    description: '触发 50 次情绪对抗匹配。',
    hint: '熟练掌握情绪转换的艺术。',
    target: 50,
    unit: '次'
  },
  {
    id: 'battle-legend',
    category: 'battle',
    title: '对抗传说',
    description: '触发 100 次情绪对抗匹配。',
    hint: '情绪平衡的终极大师。',
    target: 100,
    unit: '次'
  }
]

function getDistinctEmotionCount(items: GardenItem[]): number {
  const seen = new Set<EmotionTag>()
  items.forEach((item) => seen.add(item.emotionTag))
  return seen.size
}

function getFlourishCount(items: GardenItem[]): number {
  return items.filter((item) => item.growthStage === 5).length
}

function getBloomOrAboveCount(items: GardenItem[]): number {
  return items.filter((item) => item.growthStage >= 4).length
}

function getManualWateringEstimate(items: GardenItem[]): number {
  return items.reduce((sum, item) => sum + Math.max(0, item.totalWaterings - 1), 0)
}

function getDistinctFlowerTypeCount(items: GardenItem[]): number {
  const seen = new Set<string>()
  items.forEach((item) => {
    const key = `${item.emotionTag}-${item.rarity}`
    seen.add(key)
  })
  return seen.size
}

function hasRarity(items: GardenItem[], rarity: string): boolean {
  return items.some((item) => item.rarity === rarity)
}

function getEarliestUnlockTimestamp(
  items: GardenItem[],
  predicate: (orderedItems: GardenItem[]) => boolean
): string | null {
  const ordered = [...items].sort(
    (left, right) =>
      parseTimestamp(left.timestamp).getTime() - parseTimestamp(right.timestamp).getTime()
  )

  for (let index = 0; index < ordered.length; index += 1) {
    const slice = ordered.slice(0, index + 1)
    if (predicate(slice)) {
      return ordered[index].timestamp
    }
  }

  return null
}

function getTotalReleaseUnlockTimestamp(items: GardenItem[], target: number): string | null {
  return getEarliestUnlockTimestamp(items, (slice) => slice.length >= target)
}

function getStreakUnlockTimestamp(items: GardenItem[], target: number): string | null {
  return getEarliestUnlockTimestamp(items, (slice) => {
    const snapshot = buildGardenGrowthSnapshot(
      slice,
      3,
      parseTimestamp(slice[slice.length - 1].timestamp)
    )
    return snapshot.longestStreakDays >= target
  })
}

function getDiversityUnlockTimestamp(items: GardenItem[], target: number): string | null {
  return getEarliestUnlockTimestamp(items, (slice) => getDistinctEmotionCount(slice) >= target)
}

function buildStatus(
  definition: AchievementDefinition,
  progress: number,
  unlockedAt: string | null
): AchievementStatus {
  const cappedProgress = Math.min(progress, definition.target)
  return {
    id: definition.id,
    category: definition.category,
    title: definition.title,
    description: definition.description,
    hint: definition.hint,
    target: definition.target,
    unit: definition.unit,
    progress: cappedProgress,
    unlocked: progress >= definition.target,
    unlockedAt: progress >= definition.target ? unlockedAt : null
  }
}

export function buildAchievementSummary(
  rawItems: GardenItem[],
  unlockedLandCount = 0,
  ownedDecorationCount = 0,
  now = new Date()
): AchievementSummary {
  const items = enrichGardenItems(rawItems, now)
  const snapshot = buildGardenGrowthSnapshot(items, 3, now)
  const totalReleases = items.length
  const distinctEmotions = getDistinctEmotionCount(items)
  const distinctFlowerTypes = getDistinctFlowerTypeCount(items)
  const flourishCount = getFlourishCount(items)
  const bloomCount = getBloomOrAboveCount(items)
  const manualWaterings = getManualWateringEstimate(items)
  const longestStreak = snapshot.longestStreakDays
  const hasShiny = hasRarity(items, 'shiny')
  const hasStellar = hasRarity(items, 'stellar')
  const hasLegendary = hasRarity(items, 'legendary')

  // 情绪对抗统计
  const battleMatches = detectEmotionBattles(items)
  const totalBattles = battleMatches.length
  const uniqueBattlePairs = new Set(
    battleMatches.map((m) => `${m.emotionPair.emotion1}-${m.emotionPair.emotion2}`)
  ).size

  const statuses: AchievementStatus[] = achievementDefinitions.map((definition) => {
    if (definition.id === 'first-release') {
      return buildStatus(definition, totalReleases, getTotalReleaseUnlockTimestamp(items, 1))
    }

    if (definition.id === 'ten-releases') {
      return buildStatus(definition, totalReleases, getTotalReleaseUnlockTimestamp(items, 10))
    }

    if (definition.id === 'fifty-releases') {
      return buildStatus(definition, totalReleases, getTotalReleaseUnlockTimestamp(items, 50))
    }

    if (definition.id === 'hundred-releases') {
      return buildStatus(definition, totalReleases, getTotalReleaseUnlockTimestamp(items, 100))
    }

    if (definition.id === 'streak-3') {
      return buildStatus(definition, longestStreak, getStreakUnlockTimestamp(items, 3))
    }

    if (definition.id === 'streak-7') {
      return buildStatus(definition, longestStreak, getStreakUnlockTimestamp(items, 7))
    }

    if (definition.id === 'streak-14') {
      return buildStatus(definition, longestStreak, getStreakUnlockTimestamp(items, 14))
    }

    if (definition.id === 'first-bloom') {
      return buildStatus(definition, bloomCount > 0 ? 1 : 0, bloomCount > 0 ? toDateKey(now) : null)
    }

    if (definition.id === 'first-flourish') {
      return buildStatus(
        definition,
        flourishCount > 0 ? 1 : 0,
        flourishCount > 0 ? toDateKey(now) : null
      )
    }

    if (definition.id === 'three-flourish') {
      return buildStatus(definition, flourishCount, flourishCount >= 3 ? toDateKey(now) : null)
    }

    if (definition.id === 'all-emotions') {
      return buildStatus(
        definition,
        distinctEmotions,
        getDiversityUnlockTimestamp(items, definition.target)
      )
    }

    if (definition.id === 'manual-watering-10') {
      return buildStatus(definition, manualWaterings, manualWaterings >= 10 ? toDateKey(now) : null)
    }

    if (definition.id === 'emotion-harmonizer') {
      return buildStatus(definition, totalBattles, totalBattles >= 10 ? toDateKey(now) : null)
    }

    if (definition.id === 'balance-master') {
      return buildStatus(
        definition,
        uniqueBattlePairs,
        uniqueBattlePairs >= 3 ? toDateKey(now) : null
      )
    }

    if (definition.id === 'collector-5') {
      return buildStatus(definition, distinctFlowerTypes, distinctFlowerTypes >= 5 ? toDateKey(now) : null)
    }

    if (definition.id === 'collector-10') {
      return buildStatus(definition, distinctFlowerTypes, distinctFlowerTypes >= 10 ? toDateKey(now) : null)
    }

    if (definition.id === 'collector-20') {
      return buildStatus(definition, distinctFlowerTypes, distinctFlowerTypes >= 20 ? toDateKey(now) : null)
    }

    if (definition.id === 'first-shiny') {
      return buildStatus(definition, hasShiny ? 1 : 0, hasShiny ? toDateKey(now) : null)
    }

    if (definition.id === 'first-stellar') {
      return buildStatus(definition, hasStellar ? 1 : 0, hasStellar ? toDateKey(now) : null)
    }

    if (definition.id === 'first-legendary') {
      return buildStatus(definition, hasLegendary ? 1 : 0, hasLegendary ? toDateKey(now) : null)
    }

    if (definition.id === 'watering-50') {
      return buildStatus(definition, manualWaterings, manualWaterings >= 50 ? toDateKey(now) : null)
    }

    if (definition.id === 'watering-100') {
      return buildStatus(definition, manualWaterings, manualWaterings >= 100 ? toDateKey(now) : null)
    }

    if (definition.id === 'watering-500') {
      return buildStatus(definition, manualWaterings, manualWaterings >= 500 ? toDateKey(now) : null)
    }

    if (definition.id === 'streak-30') {
      return buildStatus(definition, longestStreak, getStreakUnlockTimestamp(items, 30))
    }

    if (definition.id === 'full-garden') {
      return buildStatus(definition, unlockedLandCount, unlockedLandCount >= 24 ? toDateKey(now) : null)
    }

    if (definition.id === 'decorator') {
      return buildStatus(definition, ownedDecorationCount, ownedDecorationCount >= 8 ? toDateKey(now) : null)
    }

    if (definition.id === 'battle-master') {
      return buildStatus(definition, totalBattles, totalBattles >= 50 ? toDateKey(now) : null)
    }

    if (definition.id === 'battle-legend') {
      return buildStatus(definition, totalBattles, totalBattles >= 100 ? toDateKey(now) : null)
    }

    return buildStatus(definition, 0, null)
  })

  const unlockedCount = statuses.filter((status) => status.unlocked).length
  const recentlyUnlocked = statuses
    .filter((status) => status.unlocked && status.unlockedAt)
    .sort((left, right) => {
      const leftTime = left.unlockedAt ? parseTimestamp(left.unlockedAt).getTime() : 0
      const rightTime = right.unlockedAt ? parseTimestamp(right.unlockedAt).getTime() : 0
      return rightTime - leftTime
    })
    .slice(0, 3)

  return {
    totalCount: statuses.length,
    unlockedCount,
    unlockRatio: statuses.length === 0 ? 0 : unlockedCount / statuses.length,
    recentlyUnlocked,
    achievements: statuses
  }
}

export function getAchievementDefinitions(): AchievementDefinition[] {
  return achievementDefinitions
}
