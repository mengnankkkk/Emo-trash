import * as React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App from '../../src/renderer/src/App'
import type {
  DecorationSummary,
  EmotionCalendarDay,
  EmotionStatsSummary,
  EmotionTimelineEntry,
  GardenGrowthSnapshot,
  GardenItem,
  ReleaseEmotionInput,
  SeedInventoryItem
} from '../../src/renderer/src/types/emotion'

const draftAnalysis: ReleaseEmotionInput = {
  textLength: 8,
  exclamationDensity: 0.1,
  emphasisLevel: 4,
  flowerType: 1,
  colorHex: '#f87171',
  emotionTag: 'anger',
  analysis: {
    emotionIntensity: 'moderate',
    triggerScene: '工作压力',
    guidanceQuestion: '这件事里最让你生气的瞬间是什么？',
    suggestedLabels: ['生气', '委屈'],
    confidence: 0.82,
    timeContextHour: 20,
    timeContextLabel: '晚上 18:00 - 22:59',
    source: 'ai',
    sourceModel: 'test-model'
  }
}

const gardenItems: GardenItem[] = [
  {
    id: 1,
    timestamp: '2026-05-11 20:00:00',
    flowerType: 1,
    colorHex: '#f87171',
    growthStage: 2,
    totalWaterings: 3,
    lastWateredOn: '2026-05-11',
    emotionTag: 'anger',
    releasedOn: '2026-05-11',
    releasedHour: 20,
    gridX: 0,
    gridY: 0,
    rarity: 'common'
  }
]

const statsSummary: EmotionStatsSummary = {
  rangeDays: 7,
  totalReleases: 6,
  peakHour: 21,
  peakHourLabel: '夜间 21:00 - 21:59',
  currentStreakDays: 4,
  longestStreakDays: 6,
  emotionBreakdown: [
    { tag: 'anger', count: 2, ratio: 0.33 },
    { tag: 'collapse', count: 1, ratio: 0.16 },
    { tag: 'anxiety', count: 2, ratio: 0.33 },
    { tag: 'fatigue', count: 1, ratio: 0.16 },
    { tag: 'calm', count: 0, ratio: 0 },
    { tag: 'relief', count: 0, ratio: 0 }
  ],
  trend: [
    { date: '2026-05-05', count: 1, dominantEmotionTag: 'anger' },
    { date: '2026-05-06', count: 0, dominantEmotionTag: null },
    { date: '2026-05-07', count: 2, dominantEmotionTag: 'anxiety' },
    { date: '2026-05-08', count: 1, dominantEmotionTag: 'fatigue' },
    { date: '2026-05-09', count: 1, dominantEmotionTag: 'collapse' },
    { date: '2026-05-10', count: 0, dominantEmotionTag: null },
    { date: '2026-05-11', count: 1, dominantEmotionTag: 'anger' }
  ]
}

const growthSnapshot: GardenGrowthSnapshot = {
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
  manualWateringsRemaining: 1,
  progressToNextLevel: 0.68,
  nextLevelLabel: '盛放'
}

const calendarDays: EmotionCalendarDay[] = [
  { date: '2026-05-10', count: 0, dominantEmotionTag: null, intensityLevel: 0 },
  { date: '2026-05-11', count: 2, dominantEmotionTag: 'anger', intensityLevel: 4 }
]

const timelineItems: EmotionTimelineEntry[] = [
  {
    id: 1,
    timestamp: '2026-05-11 20:00:00',
    releasedOn: '2026-05-11',
    releasedHour: 20,
    flowerType: 1,
    colorHex: '#f87171',
    growthStage: 2,
    totalWaterings: 3,
    lastWateredOn: '2026-05-11',
    emotionTag: 'anger',
    gridX: 0,
    gridY: 0,
    rarity: 'common'
  }
]

const decorationSummary: DecorationSummary = {
  totalDecorations: 0,
  unlockedCount: 0,
  placedCount: 0,
  decorations: [],
  placed: [],
  activeBonus: {
    wateringBonus: 0,
    rarityBonus: 0,
    growthBonus: 0
  }
}

const seedInventory: SeedInventoryItem[] = []

const pickFlowerMock = vi.fn().mockResolvedValue({
  success: true,
  garden: [],
  coinsEarned: 0,
  message: '花朵还没成熟，已采摘但不会获得金币。'
})

vi.mock('../../src/renderer/src/features/ritual/RitualCanvas', () => ({
  default: () => <div data-testid="ritual-canvas-mock" />
}))

vi.mock('../../src/renderer/src/hooks/useEmotionApi', () => ({
  useEmotionApi: () => ({
    analyzeEmotion: vi.fn().mockResolvedValue(draftAnalysis),
    listGarden: vi.fn().mockResolvedValue(gardenItems),
    releaseEmotion: vi.fn().mockResolvedValue({
      seedAdded: true,
      emotionTag: 'anger',
      rarity: 'common'
    }),
    waterFlower: vi.fn().mockResolvedValue({ success: true, remaining: 0, garden: gardenItems }),
    pickFlower: pickFlowerMock,
    getEmotionStats: vi.fn().mockResolvedValue(statsSummary),
    getAchievements: vi.fn().mockResolvedValue({
      totalCount: 12,
      unlockedCount: 3,
      unlockRatio: 0.25,
      recentlyUnlocked: [],
      achievements: []
    }),
    getGardenGrowth: vi.fn().mockResolvedValue(growthSnapshot),
    getFlowerDex: vi.fn().mockResolvedValue({
      totalSlots: 24,
      unlockedCount: 1,
      entries: []
    }),
    getTitles: vi.fn().mockResolvedValue({
      activeTitle: null,
      titles: []
    }),
    listEmotionCalendar: vi.fn().mockResolvedValue(calendarDays),
    listEmotionTimeline: vi.fn().mockResolvedValue(timelineItems),
    getGardenLands: vi.fn().mockResolvedValue([
      { id: 1, gridX: 0, gridY: 0, unlocked: true, unlockedAt: '2026-05-11 20:00:00' }
    ]),
    unlockGardenLand: vi.fn().mockResolvedValue({
      success: false,
      balance: 100,
      message: 'not-supported'
    }),
    getCurrencyBalance: vi.fn().mockResolvedValue({ balance: 100 }),
    getCurrencyTransactions: vi.fn().mockResolvedValue([]),
    getSeedInventory: vi.fn().mockResolvedValue(seedInventory),
    getTotalSeedCount: vi.fn().mockResolvedValue({ count: 0 }),
    plantSeed: vi.fn().mockResolvedValue({
      success: false,
      garden: gardenItems,
      message: 'no-seed'
    }),
    getDecorationSummary: vi.fn().mockResolvedValue(decorationSummary),
    purchaseDecoration: vi.fn().mockResolvedValue({
      success: false,
      balance: 100,
      message: 'not-supported'
    }),
    placeDecoration: vi.fn().mockResolvedValue({
      id: 1,
      type: 'stone',
      positionX: 0,
      positionY: 0,
      placedAt: '2026-05-11'
    })
  })
}))

describe('App 页面导航', () => {
  it('可以切换主要页面并显示对应内容', async () => {
    render(React.createElement(App))

    expect(screen.getByText(/情绪粉碎台/)).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()

    const analyticsButton = screen.getByRole('button', { name: /统计/i })
    fireEvent.click(analyticsButton)

    await waitFor(() => {
      expect(analyticsButton).toHaveAttribute('aria-current', 'page')
      expect(screen.getByText(/情绪统计/)).toBeInTheDocument()
      expect(screen.getByText(/花园成长/)).toBeInTheDocument()
    })

    const gardenButton = screen.getByRole('button', { name: /^花园$/i })
    fireEvent.click(gardenButton)

    await waitFor(() => {
      expect(gardenButton).toHaveAttribute('aria-current', 'page')
      expect(screen.getByText(/花园操作台/)).toBeInTheDocument()
    })
  })

  it('采摘后即使花园变空也不会白屏', async () => {
    render(React.createElement(App))

    const gardenButton = screen.getByRole('button', { name: /^花园$/i })
    fireEvent.click(gardenButton)

    await waitFor(() => {
      expect(gardenButton).toHaveAttribute('aria-current', 'page')
      expect(screen.getByRole('button', { name: /采摘/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /采摘/i }))

    const flowerCell = document.querySelector('.flower-in-grid')?.parentElement
    expect(flowerCell).not.toBeNull()

    fireEvent.click(flowerCell as HTMLElement)

    await waitFor(() => {
      expect(pickFlowerMock).toHaveBeenCalledWith(1)
      expect(screen.getByText(/花园操作台/)).toBeInTheDocument()
      expect(screen.getByText(/花朵/)).toBeInTheDocument()
    })
  })
})
