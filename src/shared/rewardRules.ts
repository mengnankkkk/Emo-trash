import type { DailyCheckInReward, EmotionTag, FlowerRarity } from '../preload/api'
import { emotionTagValues } from './emotionMeta'

export const DAILY_CHECK_IN_CURRENCY_REWARD = 20
export const SEED_COMPOSE_COST = 3
export const SEED_COMPOSE_OUTPUT_RARITY: FlowerRarity = 'shiny'

const seedRecycleRewardMap: Record<FlowerRarity, number> = {
  common: 2,
  shiny: 8,
  stellar: 18,
  legendary: 60
}

export function pickRewardEmotion(seed: number): EmotionTag {
  return emotionTagValues[Math.abs(seed) % emotionTagValues.length]
}

export function buildDailyCheckInReward(streak: number): DailyCheckInReward {
  if (streak % 7 === 0) {
    return {
      type: 'seed',
      label: '连续 7 天星光种子',
      emotionTag: pickRewardEmotion(streak),
      rarity: 'stellar'
    }
  }

  if (streak % 3 === 0) {
    return {
      type: 'seed',
      label: '连续 3 天闪光种子',
      emotionTag: pickRewardEmotion(streak),
      rarity: 'shiny'
    }
  }

  if (streak % 2 === 0) {
    return {
      type: 'seed',
      label: '每日普通种子',
      emotionTag: pickRewardEmotion(streak),
      rarity: 'common'
    }
  }

  return {
    type: 'currency',
    label: '每日金币',
    coins: DAILY_CHECK_IN_CURRENCY_REWARD
  }
}

export function canComposeSeed(quantity: number): boolean {
  return quantity >= SEED_COMPOSE_COST
}

export function getSeedRecycleReward(rarity: FlowerRarity): number {
  return seedRecycleRewardMap[rarity]
}
