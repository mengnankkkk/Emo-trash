import { emotionTagValues, type EmotionTag } from './emotionMeta'
import { rarityValues, type FlowerRarity } from './rarity'
import type { GardenItem } from '../preload/api'

export interface FlowerDexEntry {
  emotionTag: EmotionTag
  rarity: FlowerRarity
  unlocked: boolean
  firstSeenAt: string | null
  totalCount: number
}

export interface FlowerDexSummary {
  totalSlots: number
  unlockedCount: number
  entries: FlowerDexEntry[]
}

export function buildFlowerDexSummary(items: GardenItem[]): FlowerDexSummary {
  const collected = new Map<string, { firstSeenAt: string; totalCount: number }>()

  for (const item of items) {
    const key = `${item.emotionTag}:${item.rarity}`
    const existing = collected.get(key)

    if (!existing) {
      collected.set(key, { firstSeenAt: item.timestamp, totalCount: 1 })
    } else {
      existing.totalCount += 1
      if (item.timestamp < existing.firstSeenAt) {
        existing.firstSeenAt = item.timestamp
      }
    }
  }

  const entries: FlowerDexEntry[] = []

  for (const emotionTag of emotionTagValues) {
    for (const rarity of rarityValues) {
      const key = `${emotionTag}:${rarity}`
      const data = collected.get(key)

      entries.push({
        emotionTag,
        rarity,
        unlocked: data !== undefined,
        firstSeenAt: data?.firstSeenAt ?? null,
        totalCount: data?.totalCount ?? 0
      })
    }
  }

  const unlockedCount = entries.filter((entry) => entry.unlocked).length

  return {
    totalSlots: entries.length,
    unlockedCount,
    entries
  }
}
