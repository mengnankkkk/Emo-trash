/**
 * 花园装饰系统
 *
 * 装饰物可以通过成就解锁，提供被动加成
 * 用户可以在花园中放置装饰物
 */

export const decorationTypeValues = [
  'stone',
  'fence',
  'fountain',
  'rainbow-gate',
  'wind-chime',
  'lantern',
  'bench',
  'statue'
] as const

export type DecorationType = (typeof decorationTypeValues)[number]

export interface DecorationDefinition {
  type: DecorationType
  label: string
  description: string
  price: number
  unlockCondition: {
    type: 'achievement' | 'battle' | 'release-count' | 'streak'
    value: string | number
  }
  bonus: {
    type: 'watering' | 'rarity' | 'growth' | 'visual'
    value: number | string
    description: string
  }
  emoji: string
  colorHex: string
}

export interface PlacedDecoration {
  id: number
  type: DecorationType
  positionX: number
  positionY: number
  placedAt: string
}

export interface DecorationStatus {
  type: DecorationType
  label: string
  description: string
  unlocked: boolean
  owned: boolean
  unlockLabel: string
  unlockHint: string
  unlockProgress: number
  unlockTarget: number
  unlockUnit: string
  bonus: {
    type: string
    value: number | string
    description: string
  }
  emoji: string
  colorHex: string
}

interface AchievementProgressStatus {
  id: string
  title: string
  progress: number
  target: number
  unit: string
  unlocked: boolean
}

interface TitleProgressStatus {
  id: string
  label: string
  unlocked: boolean
}

export interface DecorationSummary {
  totalDecorations: number
  unlockedCount: number
  placedCount: number
  decorations: DecorationStatus[]
  placed: PlacedDecoration[]
  activeBonus: {
    wateringBonus: number
    rarityBonus: number
    growthBonus: number
  }
}

/**
 * 装饰物定义
 */
export const decorationDefinitions: DecorationDefinition[] = [
  {
    type: 'stone',
    label: '花园石',
    description: '朴素的装饰石，为花园增添自然气息',
    price: 50,
    unlockCondition: { type: 'release-count', value: 5 },
    bonus: { type: 'visual', value: 'aesthetic', description: '纯装饰效果' },
    emoji: '🪨',
    colorHex: '#9ca3af'
  },
  {
    type: 'fence',
    label: '木栅栏',
    description: '围出一片专属的情绪空间',
    price: 80,
    unlockCondition: { type: 'release-count', value: 10 },
    bonus: { type: 'visual', value: 'aesthetic', description: '纯装饰效果' },
    emoji: '🪵',
    colorHex: '#92400e'
  },
  {
    type: 'fountain',
    label: '小喷泉',
    description: '潺潺流水，滋养花园',
    price: 200,
    unlockCondition: { type: 'achievement', value: 'manual-watering-10' },
    bonus: { type: 'watering', value: 1, description: '每日额外 +1 浇水次数' },
    emoji: '⛲',
    colorHex: '#06b6d4'
  },
  {
    type: 'rainbow-gate',
    label: '彩虹门',
    description: '穿过彩虹，迎接稀有的奇迹',
    price: 500,
    unlockCondition: { type: 'achievement', value: 'legend-hunter' },
    bonus: { type: 'rarity', value: 0.02, description: '稀有度概率 +2%' },
    emoji: '🌈',
    colorHex: '#a855f7'
  },
  {
    type: 'wind-chime',
    label: '风铃',
    description: '清脆的铃声，抚慰情绪',
    price: 150,
    unlockCondition: { type: 'streak', value: 7 },
    bonus: { type: 'visual', value: 'sound', description: '释放时播放舒缓音效' },
    emoji: '🎐',
    colorHex: '#f472b6'
  },
  {
    type: 'lantern',
    label: '花园灯笼',
    description: '温暖的光芒，照亮夜晚的情绪',
    price: 120,
    unlockCondition: { type: 'achievement', value: 'night-owl' },
    bonus: { type: 'visual', value: 'glow', description: '夜间模式视觉增强' },
    emoji: '🏮',
    colorHex: '#fb923c'
  },
  {
    type: 'bench',
    label: '休息长椅',
    description: '坐下来，静静观察花园的变化',
    price: 180,
    unlockCondition: { type: 'achievement', value: 'fifty-releases' },
    bonus: { type: 'visual', value: 'aesthetic', description: '纯装饰效果' },
    emoji: '🪑',
    colorHex: '#78716c'
  },
  {
    type: 'statue',
    label: '情绪雕像',
    description: '纪念那些被释放的情绪',
    price: 300,
    unlockCondition: { type: 'achievement', value: 'hundred-releases' },
    bonus: { type: 'growth', value: 0.1, description: '花朵成长速度 +10%' },
    emoji: '🗿',
    colorHex: '#6b7280'
  }
]

/**
 * 获取装饰物定义
 */
export function getDecorationDefinition(type: DecorationType): DecorationDefinition {
  return decorationDefinitions.find((d) => d.type === type) ?? decorationDefinitions[0]
}

/**
 * 检查装饰物是否解锁
 */
export function isDecorationUnlocked(
  definition: DecorationDefinition,
  stats: {
    releaseCount: number
    longestStreak: number
    unlockedAchievements: string[]
    unlockedTitles?: string[]
    battleCount: number
  }
): boolean {
  const { unlockCondition } = definition

  switch (unlockCondition.type) {
    case 'release-count':
      return stats.releaseCount >= (unlockCondition.value as number)
    case 'streak':
      return stats.longestStreak >= (unlockCondition.value as number)
    case 'achievement':
      return (
        stats.unlockedAchievements.includes(unlockCondition.value as string) ||
        (stats.unlockedTitles?.includes(unlockCondition.value as string) ?? false)
      )
    case 'battle':
      return stats.battleCount >= (unlockCondition.value as number)
    default:
      return false
  }
}

function getMissingText(current: number, target: number, unit: string): string {
  const missing = Math.max(0, target - current)
  return missing === 0 ? '条件已达成' : `还差 ${missing} ${unit}`
}

function getTitleMissingText(title: TitleProgressStatus): string {
  if (title.unlocked) {
    return '称号已获得'
  }

  if (title.id === 'legend-hunter') {
    return '还未获得传说花'
  }

  return `还未获得${title.label}称号`
}

function buildUnlockRequirement(
  definition: DecorationDefinition,
  stats: {
    releaseCount: number
    longestStreak: number
    unlockedAchievements: string[]
    unlockedTitles?: string[]
    battleCount: number
    achievementStatuses?: AchievementProgressStatus[]
    titleStatuses?: TitleProgressStatus[]
  }
): Pick<
  DecorationStatus,
  'unlockLabel' | 'unlockHint' | 'unlockProgress' | 'unlockTarget' | 'unlockUnit'
> {
  const { unlockCondition } = definition

  if (unlockCondition.type === 'release-count') {
    const target = unlockCondition.value as number
    return {
      unlockLabel: `需要释放 ${target} 次`,
      unlockHint: getMissingText(stats.releaseCount, target, '次释放'),
      unlockProgress: Math.min(stats.releaseCount, target),
      unlockTarget: target,
      unlockUnit: '次'
    }
  }

  if (unlockCondition.type === 'streak') {
    const target = unlockCondition.value as number
    return {
      unlockLabel: `需要连续 ${target} 天`,
      unlockHint: getMissingText(stats.longestStreak, target, '天'),
      unlockProgress: Math.min(stats.longestStreak, target),
      unlockTarget: target,
      unlockUnit: '天'
    }
  }

  if (unlockCondition.type === 'battle') {
    const target = unlockCondition.value as number
    return {
      unlockLabel: `需要情绪调和 ${target} 次`,
      unlockHint: getMissingText(stats.battleCount, target, '次调和'),
      unlockProgress: Math.min(stats.battleCount, target),
      unlockTarget: target,
      unlockUnit: '次'
    }
  }

  const conditionId = unlockCondition.value as string
  const achievement = stats.achievementStatuses?.find((item) => item.id === conditionId)
  if (achievement) {
    return {
      unlockLabel: `需要成就：${achievement.title}`,
      unlockHint: achievement.unlocked
        ? '成就已达成'
        : getMissingText(achievement.progress, achievement.target, achievement.unit),
      unlockProgress: Math.min(achievement.progress, achievement.target),
      unlockTarget: achievement.target,
      unlockUnit: achievement.unit
    }
  }

  const title = stats.titleStatuses?.find((item) => item.id === conditionId)
  if (title) {
    return {
      unlockLabel: `需要称号：${title.label}`,
      unlockHint: getTitleMissingText(title),
      unlockProgress: title.unlocked ? 1 : 0,
      unlockTarget: 1,
      unlockUnit: '项'
    }
  }

  const conditionUnlocked =
    stats.unlockedAchievements.includes(conditionId) ||
    (stats.unlockedTitles?.includes(conditionId) ?? false)

  return {
    unlockLabel: `需要条件：${conditionId}`,
    unlockHint: conditionUnlocked ? '条件已达成' : '条件尚未达成',
    unlockProgress: conditionUnlocked ? 1 : 0,
    unlockTarget: 1,
    unlockUnit: '项'
  }
}

/**
 * 计算装饰物提供的总加成
 */
export function calculateDecorationBonus(placed: PlacedDecoration[]): {
  wateringBonus: number
  rarityBonus: number
  growthBonus: number
} {
  let wateringBonus = 0
  let rarityBonus = 0
  let growthBonus = 0

  for (const decoration of placed) {
    const definition = getDecorationDefinition(decoration.type)

    switch (definition.bonus.type) {
      case 'watering':
        wateringBonus += definition.bonus.value as number
        break
      case 'rarity':
        rarityBonus += definition.bonus.value as number
        break
      case 'growth':
        growthBonus += definition.bonus.value as number
        break
    }
  }

  return { wateringBonus, rarityBonus, growthBonus }
}

/**
 * 构建装饰物摘要
 */
export function buildDecorationSummary(
  stats: {
    releaseCount: number
    longestStreak: number
    unlockedAchievements: string[]
    unlockedTitles?: string[]
    battleCount: number
    achievementStatuses?: AchievementProgressStatus[]
    titleStatuses?: TitleProgressStatus[]
  },
  ownedDecorations: DecorationType[],
  placedDecorations: PlacedDecoration[]
): DecorationSummary {
  const decorations: DecorationStatus[] = decorationDefinitions.map((def) => {
    const unlockRequirement = buildUnlockRequirement(def, stats)

    return {
      type: def.type,
      label: def.label,
      description: def.description,
      unlocked: isDecorationUnlocked(def, stats),
      owned: ownedDecorations.includes(def.type),
      ...unlockRequirement,
      bonus: def.bonus,
      emoji: def.emoji,
      colorHex: def.colorHex
    }
  })

  const unlockedCount = decorations.filter((d) => d.unlocked).length
  const activeBonus = calculateDecorationBonus(placedDecorations)

  return {
    totalDecorations: decorations.length,
    unlockedCount,
    placedCount: placedDecorations.length,
    decorations,
    placed: placedDecorations,
    activeBonus
  }
}
