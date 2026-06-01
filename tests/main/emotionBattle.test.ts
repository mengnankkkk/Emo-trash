// @vitest-environment node

import { describe, expect, it } from 'vitest'
import {
  buildEmotionBattleStats,
  checkBattleTrigger,
  detectEmotionBattles
} from '../../src/shared/emotionBattle'
import type { EmotionTag, GardenItem } from '../../src/preload/api'

function createItem(id: number, emotionTag: EmotionTag, timestamp: string): GardenItem {
  return {
    id,
    timestamp,
    releasedOn: timestamp.split(' ')[0],
    releasedHour: Number(timestamp.slice(11, 13)),
    flowerType: 1,
    colorHex: '#f87171',
    growthStage: 1,
    totalWaterings: 1,
    lastWateredOn: timestamp.split(' ')[0],
    emotionTag,
    rarity: 'common',
    gridX: 0,
    gridY: 0
  }
}

describe('emotionBattle', () => {
  it('按时间窗口匹配对立情绪，并生成每组进度', () => {
    const items = [
      createItem(1, 'anger', '2026-05-11 08:00:00'),
      createItem(2, 'calm', '2026-05-11 10:00:00'),
      createItem(3, 'anxiety', '2026-05-11 12:00:00'),
      createItem(4, 'relief', '2026-05-11 18:00:00'),
      createItem(5, 'collapse', '2026-05-09 08:00:00'),
      createItem(6, 'fatigue', '2026-05-11 18:00:00')
    ]

    const matches = detectEmotionBattles(items, 24)
    const stats = buildEmotionBattleStats(items)

    expect(matches).toHaveLength(2)
    expect(stats.totalMatches).toBe(2)
    expect(stats.uniquePairs).toBe(2)
    expect(stats.totalPairs).toBe(3)
    expect(stats.totalRarityBoost).toBeCloseTo(0.1)
    expect(stats.pairProgress.find((item) => item.pairKey === 'anger-calm')).toEqual(
      expect.objectContaining({
        matchCount: 1,
        unlocked: true,
        totalRarityBoost: 0.05
      })
    )
    expect(stats.pairProgress.find((item) => item.pairKey === 'collapse-fatigue')).toEqual(
      expect.objectContaining({
        matchCount: 0,
        unlocked: false,
        lastMatchedAt: null
      })
    )
  })

  it('新播种花朵能触发最近对立关系', () => {
    const newFlower = createItem(10, 'calm', '2026-05-11 20:00:00')
    const recentFlowers = [
      createItem(7, 'anxiety', '2026-05-11 17:00:00'),
      createItem(8, 'anger', '2026-05-11 18:00:00')
    ]

    const match = checkBattleTrigger(newFlower, recentFlowers, 24)

    expect(match).toEqual(
      expect.objectContaining({
        flowerId1: 8,
        flowerId2: 10,
        rarityBoost: 0.05
      })
    )
    expect(match?.emotionPair.label).toBeDefined()
  })
})
