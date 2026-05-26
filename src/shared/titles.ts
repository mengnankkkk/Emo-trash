import { emotionTagValues, type EmotionTag } from './emotionMeta'
import type { GardenItem } from '../preload/api'

export interface TitleDefinition {
  id: string
  label: string
  description: string
  condition: (items: GardenItem[], stats: TitleStats) => boolean
}

export interface TitleStatus {
  id: string
  label: string
  description: string
  unlocked: boolean
}

export interface TitleSummary {
  activeTitle: TitleStatus | null
  titles: TitleStatus[]
}

interface TitleStats {
  totalReleases: number
  nightReleases: number
  morningReleases: number
  longestStreak: number
  emotionCounts: Record<EmotionTag, number>
  legendaryCount: number
  flourishCount: number
}

function computeTitleStats(items: GardenItem[]): TitleStats {
  const emotionCounts = Object.fromEntries(emotionTagValues.map((tag) => [tag, 0])) as Record<
    EmotionTag,
    number
  >

  let nightReleases = 0
  let morningReleases = 0
  let legendaryCount = 0
  let flourishCount = 0

  for (const item of items) {
    emotionCounts[item.emotionTag] += 1

    if (item.releasedHour >= 23 || item.releasedHour <= 5) {
      nightReleases += 1
    }
    if (item.releasedHour >= 6 && item.releasedHour <= 8) {
      morningReleases += 1
    }
    if (item.rarity === 'legendary') {
      legendaryCount += 1
    }
    if (item.growthStage === 5) {
      flourishCount += 1
    }
  }

  const dates = [...new Set(items.map((item) => item.releasedOn))].sort()
  let longestStreak = 0
  let currentStreak = 1

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1])
    const curr = new Date(dates[i])
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000)

    if (diffDays === 1) {
      currentStreak += 1
      longestStreak = Math.max(longestStreak, currentStreak)
    } else {
      currentStreak = 1
    }
  }

  longestStreak = Math.max(longestStreak, currentStreak)
  if (dates.length === 0) longestStreak = 0

  return {
    totalReleases: items.length,
    nightReleases,
    morningReleases,
    longestStreak,
    emotionCounts,
    legendaryCount,
    flourishCount
  }
}

const titleDefinitions: TitleDefinition[] = [
  {
    id: 'night-owl',
    label: '夜猫子',
    description: '深夜(23:00-05:59)释放超过 20 次',
    condition: (_items, stats) => stats.nightReleases >= 20
  },
  {
    id: 'early-bird',
    label: '早起鸟',
    description: '清晨(06:00-08:59)释放超过 10 次',
    condition: (_items, stats) => stats.morningReleases >= 10
  },
  {
    id: 'emotion-master',
    label: '情绪全能者',
    description: '每种情绪都释放过 50 次以上',
    condition: (_items, stats) => emotionTagValues.every((tag) => stats.emotionCounts[tag] >= 50)
  },
  {
    id: 'legend-hunter',
    label: '传说猎人',
    description: '拥有至少 1 朵传说级花朵',
    condition: (_items, stats) => stats.legendaryCount >= 1
  },
  {
    id: 'garden-master',
    label: '花园大师',
    description: '花园中有 10 朵以上盛放的花',
    condition: (_items, stats) => stats.flourishCount >= 10
  },
  {
    id: 'persistent',
    label: '坚持者',
    description: '最长连续释放天数超过 30 天',
    condition: (_items, stats) => stats.longestStreak >= 30
  },
  {
    id: 'release-expert',
    label: '释放达人',
    description: '累计释放超过 200 次',
    condition: (_items, stats) => stats.totalReleases >= 200
  }
]

export function buildTitleSummary(items: GardenItem[]): TitleSummary {
  const stats = computeTitleStats(items)

  const titles: TitleStatus[] = titleDefinitions.map((def) => ({
    id: def.id,
    label: def.label,
    description: def.description,
    unlocked: def.condition(items, stats)
  }))

  const lastUnlocked = [...titles].reverse().find((t) => t.unlocked) ?? null

  return {
    activeTitle: lastUnlocked,
    titles
  }
}
