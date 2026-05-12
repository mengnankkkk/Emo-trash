import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import EmotionStatsPanel from '../../src/renderer/src/features/analytics/EmotionStatsPanel'
import EmotionCalendarHeatmap from '../../src/renderer/src/features/history/EmotionCalendarHeatmap'
import EmotionTimeline from '../../src/renderer/src/features/history/EmotionTimeline'
import type {
  EmotionStatsSummary,
  EmotionTimelineEntry
} from '../../src/renderer/src/types/emotion'

const summary: EmotionStatsSummary = {
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

const timelineItems: EmotionTimelineEntry[] = [
  {
    id: 1,
    timestamp: '2026-05-11 20:00:00',
    releasedOn: '2026-05-11',
    releasedHour: 20,
    flowerType: 1,
    colorHex: '#f87171',
    growthStage: 2,
    emotionTag: 'anger'
  }
]

describe('emotion dashboard components', () => {
  it('切换统计范围并展示核心指标', () => {
    const onRangeChange = vi.fn()

    render(
      <EmotionStatsPanel
        summary={summary}
        rangeDays={7}
        onRangeChange={onRangeChange}
        loading={false}
      />
    )

    expect(screen.getByText('最近的情绪节律')).toBeInTheDocument()
    expect(screen.getByText('夜间 21:00 - 21:59')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '最近 30 天' }))

    expect(onRangeChange).toHaveBeenCalledWith(30)
  })

  it('点击热力图日期并展示时间轴条目', () => {
    const onSelectDate = vi.fn()

    render(
      <React.Fragment>
        <EmotionCalendarHeatmap
          days={[
            { date: '2026-05-10', count: 0, dominantEmotionTag: null, intensityLevel: 0 },
            { date: '2026-05-11', count: 2, dominantEmotionTag: 'anger', intensityLevel: 4 }
          ]}
          selectedDate={null}
          onSelectDate={onSelectDate}
        />
        <EmotionTimeline items={timelineItems} selectedDate="2026-05-11" />
      </React.Fragment>
    )

    fireEvent.click(screen.getByRole('button', { name: /05\/11/i }))

    expect(onSelectDate).toHaveBeenCalledWith('2026-05-11')
    expect(screen.getByText(/2026-05-11 20:00:00/)).toBeInTheDocument()
    expect(screen.getByText(/开花/)).toBeInTheDocument()
  })
})
