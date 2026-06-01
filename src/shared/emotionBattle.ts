/**
 * 情绪对抗系统
 *
 * 检测用户在短时间内释放对立情绪，形成"情绪对"
 * 提供稀有度加成和特殊成就奖励
 */

import type { EmotionTag } from './emotionMeta'
import type { GardenItem } from '../preload/api'
import { parseTimestamp } from './emotionInsights'

export interface EmotionPair {
  emotion1: EmotionTag
  emotion2: EmotionTag
  label: string
  description: string
}

export interface EmotionBattleMatch {
  id: string
  flowerId1: number
  flowerId2: number
  emotionPair: EmotionPair
  matchedAt: string
  rarityBoost: number
}

export interface EmotionBattlePairProgress {
  pair: EmotionPair
  pairKey: string
  matchCount: number
  unlocked: boolean
  lastMatchedAt: string | null
  totalRarityBoost: number
}

export interface EmotionBattleStats {
  totalMatches: number
  uniquePairs: number
  totalPairs: number
  totalRarityBoost: number
  pairProgress: EmotionBattlePairProgress[]
  recentMatches: EmotionBattleMatch[]
}

/**
 * 定义对立情绪对
 */
export const emotionPairs: EmotionPair[] = [
  {
    emotion1: 'anger',
    emotion2: 'calm',
    label: '怒火与平静',
    description: '愤怒的火焰遇见平静的湖水'
  },
  {
    emotion1: 'anxiety',
    emotion2: 'relief',
    label: '焦虑与释然',
    description: '紧绷的心弦终于松弛下来'
  },
  {
    emotion1: 'collapse',
    emotion2: 'fatigue',
    label: '崩溃与疲惫',
    description: '爆发的能量归于沉寂'
  }
]

/**
 * 检查两个情绪是否构成对立
 */
export function areEmotionsOpposite(
  emotion1: EmotionTag,
  emotion2: EmotionTag
): EmotionPair | null {
  return (
    emotionPairs.find(
      (pair) =>
        (pair.emotion1 === emotion1 && pair.emotion2 === emotion2) ||
        (pair.emotion1 === emotion2 && pair.emotion2 === emotion1)
    ) ?? null
  )
}

/**
 * 检测花园中的情绪对抗匹配
 *
 * @param items 花园中的所有花朵
 * @param timeWindowHours 时间窗口（小时），默认24小时
 * @returns 检测到的情绪对列表
 */
export function detectEmotionBattles(
  items: GardenItem[],
  timeWindowHours = 24
): EmotionBattleMatch[] {
  const matches: EmotionBattleMatch[] = []
  const matchedFlowerIds = new Set<number>()

  // 按时间排序
  const sortedItems = [...items].sort(
    (a, b) => parseTimestamp(a.timestamp).getTime() - parseTimestamp(b.timestamp).getTime()
  )

  for (let i = 0; i < sortedItems.length; i++) {
    const flower1 = sortedItems[i]

    // 跳过已匹配的花朵
    if (matchedFlowerIds.has(flower1.id)) {
      continue
    }

    const flower1Time = parseTimestamp(flower1.timestamp).getTime()

    // 在时间窗口内查找对立情绪
    for (let j = i + 1; j < sortedItems.length; j++) {
      const flower2 = sortedItems[j]

      // 跳过已匹配的花朵
      if (matchedFlowerIds.has(flower2.id)) {
        continue
      }

      const flower2Time = parseTimestamp(flower2.timestamp).getTime()
      const timeDiffHours = (flower2Time - flower1Time) / (1000 * 60 * 60)

      // 超出时间窗口，停止搜索
      if (timeDiffHours > timeWindowHours) {
        break
      }

      // 检查是否为对立情绪
      const pair = areEmotionsOpposite(flower1.emotionTag, flower2.emotionTag)
      if (pair) {
        matches.push({
          id: `${flower1.id}-${flower2.id}`,
          flowerId1: flower1.id,
          flowerId2: flower2.id,
          emotionPair: pair,
          matchedAt: flower2.timestamp,
          rarityBoost: 0.05 // 5% 稀有度加成
        })

        // 标记为已匹配
        matchedFlowerIds.add(flower1.id)
        matchedFlowerIds.add(flower2.id)
        break
      }
    }
  }

  return matches
}

/**
 * 构建情绪对抗统计
 */
export function buildEmotionBattleStats(items: GardenItem[]): EmotionBattleStats {
  const matches = detectEmotionBattles(items)
  const pairProgress = emotionPairs.map((pair) => {
    const pairKey = `${pair.emotion1}-${pair.emotion2}`
    const pairMatches = matches.filter(
      (match) =>
        match.emotionPair.emotion1 === pair.emotion1 &&
        match.emotionPair.emotion2 === pair.emotion2
    )
    const lastMatch = pairMatches[pairMatches.length - 1]

    return {
      pair,
      pairKey,
      matchCount: pairMatches.length,
      unlocked: pairMatches.length > 0,
      lastMatchedAt: lastMatch?.matchedAt ?? null,
      totalRarityBoost: pairMatches.reduce((sum, match) => sum + match.rarityBoost, 0)
    }
  })

  return {
    totalMatches: matches.length,
    uniquePairs: pairProgress.filter((item) => item.unlocked).length,
    totalPairs: emotionPairs.length,
    totalRarityBoost: matches.reduce((sum, match) => sum + match.rarityBoost, 0),
    pairProgress,
    recentMatches: matches.slice(-5).reverse()
  }
}

/**
 * 检查是否应该触发情绪对抗奖励
 *
 * @param newFlower 新释放的花朵
 * @param recentFlowers 最近的花朵列表
 * @param timeWindowHours 时间窗口
 * @returns 如果触发对抗，返回匹配信息
 */
export function checkBattleTrigger(
  newFlower: GardenItem,
  recentFlowers: GardenItem[],
  timeWindowHours = 24
): EmotionBattleMatch | null {
  const newFlowerTime = parseTimestamp(newFlower.timestamp).getTime()

  for (const flower of recentFlowers) {
    // 跳过自己
    if (flower.id === newFlower.id) {
      continue
    }

    const flowerTime = parseTimestamp(flower.timestamp).getTime()
    const timeDiffHours = Math.abs(newFlowerTime - flowerTime) / (1000 * 60 * 60)

    // 超出时间窗口
    if (timeDiffHours > timeWindowHours) {
      continue
    }

    // 检查是否为对立情绪
    const pair = areEmotionsOpposite(newFlower.emotionTag, flower.emotionTag)
    if (pair) {
      return {
        id: `${flower.id}-${newFlower.id}`,
        flowerId1: flower.id,
        flowerId2: newFlower.id,
        emotionPair: pair,
        matchedAt: newFlower.timestamp,
        rarityBoost: 0.05
      }
    }
  }

  return null
}
