/**
 * 花朵稀有度系统
 *
 * 稀有度分级：
 * - common (普通): 85% - 默认样式
 * - shiny (闪光): 12% - 边缘微光 + 轻微脉动
 * - stellar (星光): 2.5% - 星星粒子环绕 + 彩虹光晕
 * - legendary (传说): 0.5% - 多色渐变 + 旋转光环 + 持续粒子特效
 */

export const rarityValues = ['common', 'shiny', 'stellar', 'legendary'] as const
export type FlowerRarity = (typeof rarityValues)[number]

export interface RarityDefinition {
  value: FlowerRarity
  label: string
  probability: number
  color: string
  description: string
}

export const rarityDefinitions: Record<FlowerRarity, RarityDefinition> = {
  common: {
    value: 'common',
    label: '普通',
    probability: 0.85,
    color: '#707890',
    description: '平凡而真实的情绪痕迹'
  },
  shiny: {
    value: 'shiny',
    label: '闪光',
    probability: 0.12,
    color: '#00bcd4',
    description: '带着微光的特殊时刻'
  },
  stellar: {
    value: 'stellar',
    label: '星光',
    probability: 0.025,
    color: '#9c27b0',
    description: '如星辰般闪耀的珍贵记忆'
  },
  legendary: {
    value: 'legendary',
    label: '传说',
    probability: 0.005,
    color: '#ff6f00',
    description: '千载难逢的情绪结晶'
  }
}

const nonCommonRarityValues = rarityValues.filter((rarity) => rarity !== 'common')

function clampProbability(value: number): number {
  return Math.min(1, Math.max(0, value))
}

export function getBoostedRarityDefinitions(
  rareBonus = 0
): Record<FlowerRarity, RarityDefinition> {
  const normalizedBonus = clampProbability(rareBonus)
  const baseCommonProbability = rarityDefinitions.common.probability
  const nextCommonProbability = Math.max(0, baseCommonProbability - normalizedBonus)
  const actualBonus = baseCommonProbability - nextCommonProbability
  const totalRareProbability = nonCommonRarityValues.reduce(
    (sum, rarity) => sum + rarityDefinitions[rarity].probability,
    0
  )

  if (actualBonus <= 0 || totalRareProbability <= 0) {
    return rarityDefinitions
  }

  return {
    common: {
      ...rarityDefinitions.common,
      probability: nextCommonProbability
    },
    shiny: {
      ...rarityDefinitions.shiny,
      probability:
        rarityDefinitions.shiny.probability +
        actualBonus * (rarityDefinitions.shiny.probability / totalRareProbability)
    },
    stellar: {
      ...rarityDefinitions.stellar,
      probability:
        rarityDefinitions.stellar.probability +
        actualBonus * (rarityDefinitions.stellar.probability / totalRareProbability)
    },
    legendary: {
      ...rarityDefinitions.legendary,
      probability:
        rarityDefinitions.legendary.probability +
        actualBonus * (rarityDefinitions.legendary.probability / totalRareProbability)
    }
  }
}

/**
 * 根据随机数判定稀有度
 * 使用累积概率分布
 */
export function determineRarity(random = Math.random(), rareBonus = 0): FlowerRarity {
  const definitions = getBoostedRarityDefinitions(rareBonus)
  let cumulative = 0

  for (const rarity of rarityValues) {
    cumulative += definitions[rarity].probability
    if (random < cumulative) {
      return rarity
    }
  }

  return 'common'
}

/**
 * 获取稀有度定义
 */
export function getRarityDefinition(rarity: FlowerRarity): RarityDefinition {
  return rarityDefinitions[rarity]
}

/**
 * 判断是否为稀有花朵（非普通）
 */
export function isRareFlower(rarity: FlowerRarity): boolean {
  return rarity !== 'common'
}
