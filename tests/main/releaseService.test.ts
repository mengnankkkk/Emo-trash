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
    gridX: 0,
    gridY: 0,
    rarity: 'common',
    ...partial
  }
}

describe('ReleaseService', () => {
  it('释放后写入种子背包，并返回种子结果', () => {
    const addSeed = vi.fn()
    const service = new ReleaseService({} as never, {} as never, {} as never, {
      addSeed
    } as never)

    const result = service.releaseEmotion({
      textLength: 12,
      exclamationDensity: 0.25,
      emphasisLevel: 4,
      flowerType: 2,
      colorHex: '#fb7185',
      emotionTag: 'collapse',
      rarity: 'common'
    } as never)

    expect(addSeed).toHaveBeenCalledWith('collapse', 'common')
    expect(result).toEqual({
      seedAdded: true,
      emotionTag: 'collapse',
      rarity: 'common'
    })
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
    } as never, {
      getPlacedDecorations: vi.fn().mockReturnValue([]),
      getEmotionBattleCount: vi.fn().mockReturnValue(0)
    } as never, {
      getBalance: vi.fn().mockReturnValue(100)
    } as never, {
      addSeed: vi.fn()
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

  it('播种触发对立关系时返回 battleMatch', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-11T20:00:00'))

    const existingFlower = createItem({
      id: 8,
      timestamp: '2026-05-11 18:00:00',
      releasedOn: '2026-05-11',
      releasedHour: 18,
      flowerType: 1,
      colorHex: '#f87171',
      emotionTag: 'anger',
      gridX: 1,
      gridY: 1
    })
    const plantedFlower = createItem({
      id: 10,
      timestamp: '2026-05-11 20:00:00',
      releasedOn: '2026-05-11',
      releasedHour: 20,
      flowerType: 5,
      colorHex: '#34d399',
      emotionTag: 'calm',
      gridX: 2,
      gridY: 1
    })
    const recordEmotionBattle = vi.fn()

    const service = new ReleaseService({
      isGridOccupied: vi.fn().mockReturnValue(false),
      createSeed: vi.fn().mockReturnValue(plantedFlower),
      listAllGarden: vi.fn().mockReturnValue([plantedFlower, existingFlower]),
      listAllGardenIncludingPicked: vi.fn().mockReturnValue([plantedFlower, existingFlower]),
      syncGrowthStages: vi.fn()
    } as never, {
      recordEmotionBattle,
      getPlacedDecorations: vi.fn().mockReturnValue([]),
      getEmotionBattleCount: vi.fn().mockReturnValue(0)
    } as never, {
      getBalance: vi.fn().mockReturnValue(100)
    } as never, {
      useSeed: vi.fn().mockReturnValue(true),
      addSeed: vi.fn()
    } as never)

    const result = service.plantSeed('calm', 'common', 2, 1)

    expect(result.success).toBe(true)
    expect(result.battleMatch).toEqual(
      expect.objectContaining({
        flowerId1: 8,
        flowerId2: 10,
        rarityBoost: 0.05
      })
    )
    expect(recordEmotionBattle).toHaveBeenCalledWith(result.battleMatch)

    vi.useRealTimers()
  })
})
