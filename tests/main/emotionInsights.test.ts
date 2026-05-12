// @vitest-environment node

import { describe, expect, it, vi } from 'vitest'
import {
  buildEmotionCalendar,
  buildEmotionStatsSummary,
  buildEmotionTimeline,
  buildGardenGrowthSnapshot,
  enrichGardenItems
} from '../../src/shared/emotionInsights'
import type { GardenItem } from '../../src/preload/api'

function createItem(
  partial: Partial<GardenItem> &
    Pick<
      GardenItem,
      'id' | 'timestamp' | 'releasedOn' | 'releasedHour' | 'flowerType' | 'colorHex' | 'emotionTag'
    >
): GardenItem {
  return {
    growthStage: 1,
    ...partial
  }
}

describe('emotionInsights', () => {
  it('生成统计摘要、连续天数与高频时段', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-11T10:00:00'))

    const items: GardenItem[] = [
      createItem({
        id: 1,
        timestamp: '2026-05-11 09:10:00',
        releasedOn: '2026-05-11',
        releasedHour: 9,
        flowerType: 1,
        colorHex: '#f87171',
        emotionTag: 'anger'
      }),
      createItem({
        id: 2,
        timestamp: '2026-05-10 09:30:00',
        releasedOn: '2026-05-10',
        releasedHour: 9,
        flowerType: 3,
        colorHex: '#fbbf24',
        emotionTag: 'anxiety'
      }),
      createItem({
        id: 3,
        timestamp: '2026-05-09 22:20:00',
        releasedOn: '2026-05-09',
        releasedHour: 22,
        flowerType: 3,
        colorHex: '#fbbf24',
        emotionTag: 'anxiety'
      }),
      createItem({
        id: 4,
        timestamp: '2026-05-06 22:10:00',
        releasedOn: '2026-05-06',
        releasedHour: 22,
        flowerType: 6,
        colorHex: '#fb7185',
        emotionTag: 'relief'
      })
    ]

    const summary = buildEmotionStatsSummary(items, 7)

    expect(summary.totalReleases).toBe(4)
    expect(summary.currentStreakDays).toBe(3)
    expect(summary.longestStreakDays).toBe(3)
    expect(summary.peakHour).toBe(9)
    expect(summary.emotionBreakdown.find((item) => item.tag === 'anxiety')?.count).toBe(2)
    expect(summary.trend.find((item) => item.date === '2026-05-11')?.count).toBe(1)

    vi.useRealTimers()
  })

  it('根据连续活跃和花朵年龄推进成长阶段', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-11T08:00:00'))

    const items: GardenItem[] = [
      createItem({
        id: 1,
        timestamp: '2026-05-11 07:00:00',
        releasedOn: '2026-05-11',
        releasedHour: 7,
        flowerType: 2,
        colorHex: '#c084fc',
        emotionTag: 'collapse'
      }),
      createItem({
        id: 2,
        timestamp: '2026-05-10 07:00:00',
        releasedOn: '2026-05-10',
        releasedHour: 7,
        flowerType: 5,
        colorHex: '#34d399',
        emotionTag: 'calm'
      }),
      createItem({
        id: 3,
        timestamp: '2026-05-09 07:00:00',
        releasedOn: '2026-05-09',
        releasedHour: 7,
        flowerType: 6,
        colorHex: '#fb7185',
        emotionTag: 'relief'
      }),
      createItem({
        id: 4,
        timestamp: '2026-05-08 07:00:00',
        releasedOn: '2026-05-08',
        releasedHour: 7,
        flowerType: 4,
        colorHex: '#60a5fa',
        emotionTag: 'fatigue'
      }),
      createItem({
        id: 5,
        timestamp: '2026-05-07 07:00:00',
        releasedOn: '2026-05-07',
        releasedHour: 7,
        flowerType: 1,
        colorHex: '#f87171',
        emotionTag: 'anger'
      })
    ]

    const snapshot = buildGardenGrowthSnapshot(items)
    const enriched = enrichGardenItems(items)

    expect(snapshot.level).toBe(2)
    expect(snapshot.levelLabel).toBe('开花')
    expect(snapshot.currentStreakDays).toBe(5)
    expect(enriched[0].growthStage).toBe(2)
    expect(enriched[4].growthStage).toBe(3)

    vi.useRealTimers()
  })

  it('生成热力图和按日期/情绪筛选的时间轴', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-11T21:00:00'))

    const items: GardenItem[] = [
      createItem({
        id: 1,
        timestamp: '2026-05-11 20:00:00',
        releasedOn: '2026-05-11',
        releasedHour: 20,
        flowerType: 1,
        colorHex: '#f87171',
        emotionTag: 'anger'
      }),
      createItem({
        id: 2,
        timestamp: '2026-05-11 10:00:00',
        releasedOn: '2026-05-11',
        releasedHour: 10,
        flowerType: 3,
        colorHex: '#fbbf24',
        emotionTag: 'anxiety'
      }),
      createItem({
        id: 3,
        timestamp: '2026-05-10 18:00:00',
        releasedOn: '2026-05-10',
        releasedHour: 18,
        flowerType: 3,
        colorHex: '#fbbf24',
        emotionTag: 'anxiety'
      })
    ]

    const calendar = buildEmotionCalendar(items, 3, ['anxiety'])
    const timeline = buildEmotionTimeline(items, {
      date: '2026-05-11',
      emotionTags: ['anger'],
      limit: 10
    })

    expect(calendar).toHaveLength(3)
    expect(calendar.find((item) => item.date === '2026-05-11')?.count).toBe(1)
    expect(calendar.find((item) => item.date === '2026-05-11')?.dominantEmotionTag).toBe('anxiety')
    expect(timeline).toHaveLength(1)
    expect(timeline[0].emotionTag).toBe('anger')

    vi.useRealTimers()
  })
})
