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
  bonus: {
    type: string
    value: number | string
    description: string
  }
  emoji: string
  colorHex: string
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
      return stats.unlockedAchievements.includes(unlockCondition.value as string)
    case 'battle':
      return stats.battleCount >= (unlockCondition.value as number)
    default:
      return false
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
    battleCount: number
  },
  ownedDecorations: DecorationType[],
  placedDecorations: PlacedDecoration[]
): DecorationSummary {
  const decorations: DecorationStatus[] = decorationDefinitions.map((def) => ({
    type: def.type,
    label: def.label,
    description: def.description,
    unlocked: isDecorationUnlocked(def, stats),
    owned: ownedDecorations.includes(def.type),
    bonus: def.bonus,
    emoji: def.emoji,
    colorHex: def.colorHex
  }))

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
