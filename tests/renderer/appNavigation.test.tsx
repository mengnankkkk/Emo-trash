import * as React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App from '../../src/renderer/src/App'
import type {
  EmotionCalendarDay,
  EmotionStatsSummary,
  EmotionTimelineEntry,
  GardenGrowthSnapshot,
  GardenItem,
  ReleaseEmotionInput
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
    releasedHour: 20
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
  manualWateringsRemaining: 3,
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
    emotionTag: 'anger'
  }
]

vi.mock('../../src/renderer/src/features/ritual/RitualCanvas', () => ({
  default: () => <div data-testid="ritual-canvas-mock" />
}))

vi.mock('../../src/renderer/src/hooks/useEmotionApi', () => ({
  useEmotionApi: () => ({
    analyzeEmotion: vi.fn().mockResolvedValue(draftAnalysis),
    listGarden: vi.fn().mockResolvedValue(gardenItems),
    releaseEmotion: vi.fn().mockResolvedValue(gardenItems),
    waterFlower: vi.fn().mockResolvedValue({ success: true, remaining: 2, garden: gardenItems }),
    getEmotionStats: vi.fn().mockResolvedValue(statsSummary),
    getAchievements: vi.fn().mockResolvedValue({
      totalCount: 12,
      unlockedCount: 3,
      unlockRatio: 0.25,
      recentlyUnlocked: [],
      achievements: []
    }),
    getGardenGrowth: vi.fn().mockResolvedValue(growthSnapshot),
    listEmotionCalendar: vi.fn().mockResolvedValue(calendarDays),
    listEmotionTimeline: vi.fn().mockResolvedValue(timelineItems)
  })
}))

describe('App 页面导航', () => {
  it('在不同子页面之间切换并展示对应内容', async () => {
    render(React.createElement(App))

    expect(screen.getByRole('heading', { name: '情绪垃圾桶' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: '输入室' })).toBeInTheDocument()

    const analyticsButton = screen.getByRole('button', { name: /统计/i })
    fireEvent.click(analyticsButton)

    await waitFor(() => {
      expect(analyticsButton).toHaveAttribute('aria-current', 'page')
      expect(screen.getByText('统计范围')).toBeInTheDocument()
      expect(screen.getByText('累计释放')).toBeInTheDocument()
      expect(screen.getByText('释放次数')).toBeInTheDocument()
      expect(screen.getByText('最近的情绪节律')).toBeInTheDocument()
      expect(screen.getByText('开花')).toBeInTheDocument()
    })

    const historyButton = screen.getByRole('button', { name: /历史/i })
    fireEvent.click(historyButton)

    await waitFor(() => {
      expect(historyButton).toHaveAttribute('aria-current', 'page')
      expect(screen.getByText('选中日期')).toBeInTheDocument()
      expect(screen.getByText('时间轴')).toBeInTheDocument()
      expect(screen.getByText('把最近 30 天排成一张热力地图')).toBeInTheDocument()
      expect(screen.getByText(/2026-05-11 的情绪时间轴/)).toBeInTheDocument()
    })

    const gardenButton = screen.getByRole('button', { name: /花园/i })
    fireEvent.click(gardenButton)

    await waitFor(() => {
      expect(gardenButton).toHaveAttribute('aria-current', 'page')
      expect(screen.getByText('花朵总数')).toBeInTheDocument()
      expect(screen.getByText('最近活跃')).toBeInTheDocument()
      expect(screen.getByText('当前阶段：开花')).toBeInTheDocument()
      expect(screen.getByText('保留的是结果，不是原文。')).toBeInTheDocument()
    })
  })
})
