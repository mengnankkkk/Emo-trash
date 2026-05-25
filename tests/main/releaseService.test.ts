// @vitest-environment node

import { describe, expect, it, vi } from 'vitest'
import { ReleaseService } from '../../src/main/services/releaseService'
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
    totalWaterings: 1,
    lastWateredOn: partial.releasedOn ?? '',
    ...partial
  }
}

describe('ReleaseService', () => {
  it('在释放后返回最新花园列表，并写入 emotionTag 与时间桶', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-11T21:15:00'))

    const createSeed = vi.fn()
    const listAllGarden = vi.fn().mockReturnValue([
      createItem({
        id: 3,
        timestamp: '2026-05-11 21:15:00',
        releasedOn: '2026-05-11',
        releasedHour: 21,
        flowerType: 2,
        colorHex: '#fb7185',
        emotionTag: 'collapse'
      })
    ])
    const syncGrowthStages = vi.fn()
    const getManualWateringCountToday = vi.fn().mockReturnValue(0)

    const service = new ReleaseService({
      createSeed,
      listAllGarden,
      syncGrowthStages,
      getManualWateringCountToday
    } as never)

    const result = service.releaseEmotion({
      textLength: 12,
      exclamationDensity: 0.25,
      emphasisLevel: 4,
      flowerType: 2,
      colorHex: '#fb7185',
      emotionTag: 'collapse'
    })

    expect(createSeed).toHaveBeenCalledWith(
      expect.objectContaining({ emotionTag: 'collapse' }),
      '2026-05-11 21:15:00',
      '2026-05-11',
      21
    )
    expect(result[0]).toEqual(
      expect.objectContaining({
        emotionTag: 'collapse',
        releasedOn: '2026-05-11',
        releasedHour: 21
      })
    )
    expect(syncGrowthStages).toHaveBeenCalled()

    vi.useRealTimers()
  })

  it('提供统计、成长和时间轴查询', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-11T10:00:00'))

    const items = [
      createItem({
        id: 1,
        timestamp: '2026-05-11 09:00:00',
        releasedOn: '2026-05-11',
        releasedHour: 9,
        flowerType: 1,
        colorHex: '#f87171',
        emotionTag: 'anger'
      }),
      createItem({
        id: 2,
        timestamp: '2026-05-10 21:00:00',
        releasedOn: '2026-05-10',
        releasedHour: 21,
        flowerType: 3,
        colorHex: '#fbbf24',
        emotionTag: 'anxiety'
      }),
      createItem({
        id: 3,
        timestamp: '2026-05-09 21:20:00',
        releasedOn: '2026-05-09',
        releasedHour: 21,
        flowerType: 6,
        colorHex: '#fb7185',
        emotionTag: 'relief'
      })
    ]

    const service = new ReleaseService({
      createSeed: vi.fn(),
      listAllGarden: vi.fn().mockReturnValue(items),
      listAllGardenIncludingPicked: vi.fn().mockReturnValue(items),
      syncGrowthStages: vi.fn(),
      getManualWateringCountToday: vi.fn().mockReturnValue(0)
    } as never)

    const stats = service.getEmotionStats(7)
    const growth = service.getGardenGrowth()
    const timeline = service.listEmotionTimeline({
      date: '2026-05-10',
      emotionTags: ['anxiety'],
      limit: 10
    })

    expect(stats.totalReleases).toBe(3)
    expect(stats.currentStreakDays).toBe(3)
    expect(growth.level).toBe(2)
    expect(timeline).toHaveLength(1)
    expect(timeline[0].emotionTag).toBe('anxiety')

    vi.useRealTimers()
  })
})
