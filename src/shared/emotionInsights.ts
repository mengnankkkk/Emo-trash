import type {
  EmotionCalendarDay,
  EmotionStatsRange,
  EmotionStatsSummary,
  EmotionTimelineEntry,
  EmotionTimelineQuery,
  GardenGrowthSnapshot,
  GardenItem
} from '../preload/api'
import { emotionTagValues, type EmotionTag } from './emotionMeta'

const dayMs = 24 * 60 * 60 * 1000

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

export function formatLocalTimestamp(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function toComparableTimestamp(value: string): string {
  if (value.includes('T')) {
    return value
  }

  if (value.includes(' ')) {
    return value.replace(' ', 'T')
  }

  return `${value}T00:00:00`
}

export function parseTimestamp(value: string): Date {
  const parsed = new Date(toComparableTimestamp(value))
  if (!Number.isNaN(parsed.getTime())) {
    return parsed
  }

  const [datePart, timePart = '00:00:00'] = value.split(' ')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour = 0, minute = 0, second = 0] = timePart.split(':').map(Number)
  return new Date(year, month - 1, day, hour, minute, second)
}

export function toDateKey(value: Date | string): string {
  const date = typeof value === 'string' ? parseTimestamp(value) : value
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function toHour(value: Date | string): number {
  const date = typeof value === 'string' ? parseTimestamp(value) : value
  return date.getHours()
}

function toDateStart(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function compareDateKey(left: string, right: string): number {
  return toDateStart(left).getTime() - toDateStart(right).getTime()
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

export function getDateKeys(rangeDays: number, now = new Date()): string[] {
  const start = addDays(
    new Date(now.getFullYear(), now.getMonth(), now.getDate()),
    -(rangeDays - 1)
  )
  return Array.from({ length: rangeDays }, (_, index) => toDateKey(addDays(start, index)))
}

function getRangeWindow(rangeDays: number, now = new Date()): { start: string; end: string } {
  const keys = getDateKeys(rangeDays, now)
  return {
    start: keys[0],
    end: keys[keys.length - 1]
  }
}

function isDateInRange(dateKey: string, rangeDays: number, now = new Date()): boolean {
  const window = getRangeWindow(rangeDays, now)
  return compareDateKey(dateKey, window.start) >= 0 && compareDateKey(dateKey, window.end) <= 0
}

function sortByNewest(items: GardenItem[]): GardenItem[] {
  return [...items].sort((left, right) => {
    const timeDiff =
      parseTimestamp(right.timestamp).getTime() - parseTimestamp(left.timestamp).getTime()
    if (timeDiff !== 0) {
      return timeDiff
    }

    return right.id - left.id
  })
}

function getDistinctDays(items: GardenItem[]): string[] {
  return [...new Set(items.map((item) => item.releasedOn))].sort((left, right) =>
    compareDateKey(right, left)
  )
}

function getDayDifference(newerDateKey: string, olderDateKey: string): number {
  const newer = toDateStart(newerDateKey).getTime()
  const older = toDateStart(olderDateKey).getTime()
  return Math.round((newer - older) / dayMs)
}

function getCurrentStreakDays(items: GardenItem[], now = new Date()): number {
  const days = getDistinctDays(items)
  if (days.length === 0) {
    return 0
  }

  const latestGap = getDayDifference(toDateKey(now), days[0])
  if (latestGap > 1) {
    return 0
  }

  let streak = 1
  for (let index = 1; index < days.length; index += 1) {
    if (getDayDifference(days[index - 1], days[index]) !== 1) {
      break
    }
    streak += 1
  }

  return streak
}

function getLongestStreakDays(items: GardenItem[]): number {
  const days = getDistinctDays(items)
  if (days.length === 0) {
    return 0
  }

  let longest = 1
  let current = 1
  for (let index = 1; index < days.length; index += 1) {
    if (getDayDifference(days[index - 1], days[index]) === 1) {
      current += 1
      longest = Math.max(longest, current)
      continue
    }

    current = 1
  }

  return longest
}

function getDominantEmotionTag(items: GardenItem[]): EmotionTag | null {
  if (items.length === 0) {
    return null
  }

  const counts = new Map<EmotionTag, number>()
  emotionTagValues.forEach((tag) => counts.set(tag, 0))
  items.forEach((item) => {
    counts.set(item.emotionTag, (counts.get(item.emotionTag) ?? 0) + 1)
  })

  let dominant: EmotionTag | null = null
  let maxCount = 0

  emotionTagValues.forEach((tag) => {
    const count = counts.get(tag) ?? 0
    if (count > maxCount) {
      maxCount = count
      dominant = tag
    }
  })

  return dominant
}

function getLevelByGrowth(currentStreakDays: number, recentReleaseCount: number): 1 | 2 | 3 {
  if (currentStreakDays >= 7 || recentReleaseCount >= 12) {
    return 3
  }

  if (currentStreakDays >= 3 || recentReleaseCount >= 5) {
    return 2
  }

  return 1
}

function getLevelLabel(level: 1 | 2 | 3): '发芽' | '开花' | '盛放' {
  if (level === 1) {
    return '发芽'
  }

  if (level === 2) {
    return '开花'
  }

  return '盛放'
}

function getSeasonKey(level: 1 | 2 | 3): 'seed' | 'bloom' | 'flourish' {
  if (level === 1) {
    return 'seed'
  }

  if (level === 2) {
    return 'bloom'
  }

  return 'flourish'
}

function getSeasonLabel(level: 1 | 2 | 3): string {
  if (level === 1) {
    return '新芽季'
  }

  if (level === 2) {
    return '开花季'
  }

  return '盛放季'
}

function getNextLevelLabel(level: 1 | 2 | 3): '开花' | '盛放' | null {
  if (level === 1) {
    return '开花'
  }

  if (level === 2) {
    return '盛放'
  }

  return null
}

function getProgressToNextLevel(
  level: 1 | 2 | 3,
  currentStreakDays: number,
  recentReleaseCount: number
): number {
  if (level === 3) {
    return 1
  }

  if (level === 1) {
    return Math.min(1, Math.max(currentStreakDays / 3, recentReleaseCount / 5))
  }

  return Math.min(1, Math.max(currentStreakDays / 7, recentReleaseCount / 12))
}

export function getPeakHourLabel(hour: number | null): string {
  if (hour === null) {
    return '暂无释放记录'
  }

  const period =
    hour < 5 ? '深夜' : hour < 9 ? '清晨' : hour < 12 ? '上午' : hour < 18 ? '下午' : '夜间'
  return `${period} ${pad(hour)}:00 - ${pad(hour)}:59`
}

export function buildGardenGrowthSnapshot(
  items: GardenItem[],
  now = new Date()
): GardenGrowthSnapshot {
  const recentReleaseCount = items.filter((item) => isDateInRange(item.releasedOn, 7, now)).length
  const currentStreakDays = getCurrentStreakDays(items, now)
  const level = getLevelByGrowth(currentStreakDays, recentReleaseCount)

  return {
    level,
    levelLabel: getLevelLabel(level),
    seasonKey: getSeasonKey(level),
    seasonLabel: getSeasonLabel(level),
    currentStreakDays,
    longestStreakDays: getLongestStreakDays(items),
    recentReleaseCount,
    totalBlooms: items.length,
    progressToNextLevel: getProgressToNextLevel(level, currentStreakDays, recentReleaseCount),
    nextLevelLabel: getNextLevelLabel(level)
  }
}

function deriveGrowthStage(
  item: GardenItem,
  snapshot: GardenGrowthSnapshot,
  now = new Date()
): 1 | 2 | 3 {
  const ageDays = Math.max(0, getDayDifference(toDateKey(now), item.releasedOn))
  let stage: 1 | 2 | 3 = 1

  if (ageDays >= 1 || snapshot.currentStreakDays >= 3 || snapshot.recentReleaseCount >= 5) {
    stage = 2
  }

  if (ageDays >= 3 || snapshot.currentStreakDays >= 7 || snapshot.recentReleaseCount >= 12) {
    stage = 3
  }

  return Math.max(item.growthStage, stage) as 1 | 2 | 3
}

export function enrichGardenItems(items: GardenItem[], now = new Date()): GardenItem[] {
  const sortedItems = sortByNewest(items)
  const snapshot = buildGardenGrowthSnapshot(sortedItems, now)
  return sortedItems.map((item) => ({
    ...item,
    growthStage: deriveGrowthStage(item, snapshot, now)
  }))
}

export function buildEmotionStatsSummary(
  items: GardenItem[],
  rangeDays: EmotionStatsRange,
  now = new Date()
): EmotionStatsSummary {
  const normalizedItems = sortByNewest(items)
  const filteredItems = normalizedItems.filter((item) =>
    isDateInRange(item.releasedOn, rangeDays, now)
  )
  const totalReleases = filteredItems.length
  const streakSnapshot = buildGardenGrowthSnapshot(normalizedItems, now)
  const breakdown = emotionTagValues.map((tag) => {
    const count = filteredItems.filter((item) => item.emotionTag === tag).length
    return {
      tag,
      count,
      ratio: totalReleases === 0 ? 0 : count / totalReleases
    }
  })

  const hourCounts = new Map<number, number>()
  filteredItems.forEach((item) => {
    hourCounts.set(item.releasedHour, (hourCounts.get(item.releasedHour) ?? 0) + 1)
  })

  let peakHour: number | null = null
  let peakCount = 0
  hourCounts.forEach((count, hour) => {
    if (count > peakCount) {
      peakCount = count
      peakHour = hour
    }
  })

  const trend = getDateKeys(rangeDays, now).map((date) => {
    const dayItems = filteredItems.filter((item) => item.releasedOn === date)
    return {
      date,
      count: dayItems.length,
      dominantEmotionTag: getDominantEmotionTag(dayItems)
    }
  })

  return {
    rangeDays,
    totalReleases,
    peakHour,
    peakHourLabel: getPeakHourLabel(peakHour),
    currentStreakDays: streakSnapshot.currentStreakDays,
    longestStreakDays: streakSnapshot.longestStreakDays,
    emotionBreakdown: breakdown,
    trend
  }
}

export function buildEmotionCalendar(
  items: GardenItem[],
  rangeDays: number,
  emotionTags: EmotionTag[] = [],
  now = new Date()
): EmotionCalendarDay[] {
  const filteredItems = sortByNewest(items).filter((item) => {
    if (!isDateInRange(item.releasedOn, rangeDays, now)) {
      return false
    }

    if (emotionTags.length === 0) {
      return true
    }

    return emotionTags.includes(item.emotionTag)
  })

  const grouped = new Map<string, GardenItem[]>()
  filteredItems.forEach((item) => {
    const group = grouped.get(item.releasedOn)
    if (group) {
      group.push(item)
      return
    }

    grouped.set(item.releasedOn, [item])
  })

  const dateKeys = getDateKeys(rangeDays, now)
  const maxCount = Math.max(...dateKeys.map((date) => grouped.get(date)?.length ?? 0), 0)

  return dateKeys.map((date) => {
    const dayItems = grouped.get(date) ?? []
    const count = dayItems.length
    const intensityLevel =
      count === 0 || maxCount === 0
        ? 0
        : Math.max(1, Math.min(4, Math.ceil((count / maxCount) * 4)))

    return {
      date,
      count,
      dominantEmotionTag: getDominantEmotionTag(dayItems),
      intensityLevel
    }
  })
}

export function buildEmotionTimeline(
  items: GardenItem[],
  query: EmotionTimelineQuery,
  now = new Date()
): EmotionTimelineEntry[] {
  const enrichedItems = enrichGardenItems(items, now)
  const filteredItems = enrichedItems.filter((item) => {
    if (query.date && item.releasedOn !== query.date) {
      return false
    }

    if (!query.date && query.rangeDays && !isDateInRange(item.releasedOn, query.rangeDays, now)) {
      return false
    }

    if (query.emotionTags.length > 0 && !query.emotionTags.includes(item.emotionTag)) {
      return false
    }

    return true
  })

  return filteredItems.slice(0, query.limit)
}
