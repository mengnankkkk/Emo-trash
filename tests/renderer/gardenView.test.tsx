import * as React from 'react'
import { act, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import GardenView from '../../src/renderer/src/features/garden/GardenView'
import type { GardenGrowthSnapshot, GardenItem } from '../../src/renderer/src/types/emotion'

const snapshot: GardenGrowthSnapshot = {
  level: 2,
  levelLabel: '开花',
  seasonKey: 'bloom',
  seasonLabel: '开花季',
  seasonalTheme: {
    calendarSeason: 'spring',
    calendarSeasonLabel: '春',
    gardenSeason: 'bloom',
    gardenSeasonLabel: '开花季',
    combinedLabel: '春日开花',
    combinedKey: 'spring-bloom',
    moodTint: 'rgba(52, 211, 153, 0.08)'
  },
  currentStreakDays: 4,
  longestStreakDays: 6,
  totalBlooms: 12,
  recentReleaseCount: 5,
  witheredCount: 0,
  manualWateringsRemaining: 3,
  progressToNextLevel: 0.68,
  nextLevelLabel: '盛放'
}

const baseItem: GardenItem = {
  id: 1,
  timestamp: '2026-05-11 20:00:00',
  flowerType: 1,
  colorHex: '#f87171',
  growthStage: 2,
  totalWaterings: 3,
  lastWateredOn: '2026-05-11',
  emotionTag: 'anger',
  releasedOn: '2026-05-11',
  releasedHour: 20
}

describe('GardenView 动效状态', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('首屏已有花朵只进入常驻摇曳，不会误触发新花动画', () => {
    const { container } = render(<GardenView items={[baseItem]} growthSnapshot={snapshot} />)

    const item = container.querySelector('[data-garden-item-id="1"]')
    expect(item).toHaveAttribute('data-sprouting', 'false')
    expect(item).toHaveAttribute('data-swaying', 'false')
    expect(item).toHaveAttribute('data-idle-sway', 'true')
    expect(item.className).toContain('garden-card--idle')
  })

  it('新增花朵会按时序经历 sprouting 到 swaying，再回到 idle', () => {
    vi.useFakeTimers()

    const { rerender } = render(<GardenView items={[baseItem]} growthSnapshot={snapshot} />)

    const nextItem: GardenItem = {
      ...baseItem,
      id: 2,
      flowerType: 3,
      growthStage: 3,
      totalWaterings: 5,
      emotionTag: 'anxiety',
      colorHex: '#fbbf24'
    }

    rerender(<GardenView items={[nextItem, baseItem]} growthSnapshot={snapshot} />)

    const latestItem = document.querySelector('[data-garden-item-id="2"]')
    expect(latestItem).not.toBeNull()
    expect(latestItem).toHaveAttribute('data-sprouting', 'true')
    expect(latestItem).toHaveAttribute('data-swaying', 'false')
    expect(latestItem).toHaveAttribute('data-idle-sway', 'false')
    expect(latestItem?.className).toContain('garden-card--sprouting')
    expect(latestItem?.className).toContain('garden-card--growth-3')

    act(() => {
      vi.advanceTimersByTime(1100)
    })

    expect(latestItem).toHaveAttribute('data-sprouting', 'false')
    expect(latestItem).toHaveAttribute('data-swaying', 'true')
    expect(latestItem).toHaveAttribute('data-idle-sway', 'true')
    expect(latestItem?.className).toContain('garden-card--swaying')
    expect(latestItem?.className).toContain('garden-card--idle')

    act(() => {
      vi.advanceTimersByTime(2500)
    })

    expect(latestItem).toHaveAttribute('data-sprouting', 'false')
    expect(latestItem).toHaveAttribute('data-swaying', 'false')
    expect(latestItem).toHaveAttribute('data-idle-sway', 'true')
    expect(latestItem?.className).toContain('garden-card--idle')

    vi.useRealTimers()
  })
})
