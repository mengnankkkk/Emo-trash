import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  AchievementSummary,
  EmotionCalendarDay,
  EmotionIntensity,
  EmotionStatsSummary,
  EmotionTag,
  EmotionTimelineEntry,
  GardenGrowthSnapshot,
  GardenItem,
  ReleaseEmotionInput,
  RitualEffect
} from './types/emotion'
import CaptureInput from './features/capture/CaptureInput'
import DailyQuickEntry from './features/capture/DailyQuickEntry'
import EmotionStatsPanel from './features/analytics/EmotionStatsPanel'
import GardenGrowthPanel from './features/garden/GardenGrowthPanel'
import GardenView from './features/garden/GardenView'
import EmotionCalendarHeatmap from './features/history/EmotionCalendarHeatmap'
import EmotionFilterBar from './features/history/EmotionFilterBar'
import EmotionTimeline from './features/history/EmotionTimeline'
import AchievementsPage from './features/achievements/AchievementsPage'
import AchievementToast, { type ToastItem } from './features/achievements/AchievementToast'
import RecapCard from './features/recap/RecapCard'
import HoldToShredButton from './features/ritual/HoldToShredButton'
import RitualCanvas from './features/ritual/RitualCanvas'
import { useEmotionApi } from './hooks/useEmotionApi'
import { getEmotionDefinitionByTag } from '../../shared/emotionMeta'
import { getTimeContextLabel } from '../../shared/emotionAnalysis'

type AppPage = 'release' | 'analytics' | 'history' | 'garden' | 'achievements'

const ritualEffectOptions: Array<{
  value: RitualEffect
  label: string
  subtitle: string
  description: string
  recommendedTags: string[]
}> = [
  {
    value: 'burst',
    label: '爆散',
    subtitle: '横向扩散 / 中等旋转',
    description: '像素碎块会向四周炸开，适合把一股憋着的情绪瞬间抛出去。',
    recommendedTags: ['愤怒', '崩溃']
  },
  {
    value: 'fall',
    label: '坠落',
    subtitle: '强重力 / 低横移',
    description: '文字会像失去支撑一样整块下沉，适合疲惫、麻木和放空状态。',
    recommendedTags: ['疲惫', '平静']
  },
  {
    value: 'glitch',
    label: '故障',
    subtitle: '错位闪断 / 抽动偏移',
    description: '碎片会出现短促错位和信号跳变，更像情绪在脑海里持续抖动。',
    recommendedTags: ['焦虑', '崩溃']
  },
  {
    value: 'ash',
    label: '灰化',
    subtitle: '失色飘散 / 缓慢退场',
    description: '文字会逐渐失去颜色并化成灰烬向上漂散，适合释然和慢慢放下。',
    recommendedTags: ['释然', '平静']
  }
]

const appPages: Array<{
  value: AppPage
  label: string
  subtitle: string
  summary: string
  indexLabel: string
}> = [
  {
    value: 'release',
    label: '释放',
    subtitle: '输入与粉碎仪式',
    summary: '先把当下情绪处理掉',
    indexLabel: '01'
  },
  {
    value: 'analytics',
    label: '统计',
    subtitle: '最近节律与成长',
    summary: '查看最近释放节律',
    indexLabel: '02'
  },
  {
    value: 'history',
    label: '历史',
    subtitle: '热力图与时间轴',
    summary: '按日期复盘释放轨迹',
    indexLabel: '03'
  },
  {
    value: 'garden',
    label: '花园',
    subtitle: '完整花园视图',
    summary: '保留所有花朵结果',
    indexLabel: '04'
  },
  {
    value: 'achievements',
    label: '成就',
    subtitle: '里程碑与解锁',
    summary: '查看释放节律的里程碑',
    indexLabel: '05'
  }
]

function App(): React.JSX.Element {
  const [inputValue, setInputValue] = useState('')
  const [draftAnalysis, setDraftAnalysis] = useState<ReleaseEmotionInput | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [ritualText, setRitualText] = useState('')
  const [gardenItems, setGardenItems] = useState<GardenItem[]>([])
  const [ritualActive, setRitualActive] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusText, setStatusText] = useState('把想扔掉的内容输入进来，然后长按底部按钮。')
  const [particleState, setParticleState] = useState<'idle' | 'burst'>('idle')
  const [effectType, setEffectType] = useState<RitualEffect>('burst')
  const [activePage, setActivePage] = useState<AppPage>('release')
  const [statsSummary, setStatsSummary] = useState<EmotionStatsSummary | null>(null)
  const [growthSnapshot, setGrowthSnapshot] = useState<GardenGrowthSnapshot | null>(null)
  const [calendarDays, setCalendarDays] = useState<EmotionCalendarDay[]>([])
  const [timelineItems, setTimelineItems] = useState<EmotionTimelineEntry[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [emotionFilter, setEmotionFilter] = useState<EmotionTag[]>([])
  const [isDashboardLoading, setIsDashboardLoading] = useState(true)
  const [achievementSummary, setAchievementSummary] = useState<AchievementSummary | null>(null)
  const [recapData, setRecapData] = useState<{ emotionTag: EmotionTag; intensity: EmotionIntensity } | null>(null)
  const [achievementToasts, setAchievementToasts] = useState<ToastItem[]>([])
  const [showQuickEntry, setShowQuickEntry] = useState(false)
  const seenUnlockedIdsRef = useRef<Set<string>>(new Set())
  const hasLoadedRef = useRef(false)
  const refreshRequestIdRef = useRef(0)
  const analysisRequestIdRef = useRef(0)
  const {
    analyzeEmotion,
    listGarden,
    releaseEmotion,
    waterFlower,
    getEmotionStats,
    getGardenGrowth,
    getAchievements,
    listEmotionCalendar,
    listEmotionTimeline
  } = useEmotionApi()

  const resolvePreferredDate = useCallback(
    (days: EmotionCalendarDay[], preferredDate: string | null): string | null => {
      if (preferredDate && days.some((day) => day.date === preferredDate)) {
        return preferredDate
      }

      return (
        [...days].reverse().find((day) => day.count > 0)?.date ??
        days[days.length - 1]?.date ??
        null
      )
    },
    []
  )

  const refreshTimeline = useCallback(
    async (date: string, tags: EmotionTag[]): Promise<void> => {
      const nextTimeline = await listEmotionTimeline({
        date,
        emotionTags: tags,
        limit: 50
      })
      setTimelineItems(nextTimeline)
    },
    [listEmotionTimeline]
  )

  const refreshHistory = useCallback(
    async (tags: EmotionTag[], preferredDate: string | null = selectedDate): Promise<void> => {
      const nextCalendar = await listEmotionCalendar(30, tags)
      setCalendarDays(nextCalendar)

      const nextSelectedDate = resolvePreferredDate(nextCalendar, preferredDate)
      setSelectedDate(nextSelectedDate)

      if (nextSelectedDate) {
        const nextTimeline = await listEmotionTimeline({
          date: nextSelectedDate,
          emotionTags: tags,
          limit: 50
        })
        setTimelineItems(nextTimeline)
        return
      }

      setTimelineItems([])
    },
    [listEmotionCalendar, listEmotionTimeline, resolvePreferredDate, selectedDate]
  )

  const refreshAllPanels = useCallback(
    async (
      options: {
        preferSelectedDate: boolean
        nextGarden?: GardenItem[]
      } = { preferSelectedDate: true }
    ): Promise<void> => {
      const requestId = refreshRequestIdRef.current + 1
      refreshRequestIdRef.current = requestId
      setIsDashboardLoading(true)

      try {
        const [nextGarden, nextStats, nextGrowth, nextCalendar, nextAchievements] = await Promise.all([
          options.nextGarden ? Promise.resolve(options.nextGarden) : listGarden(),
          getEmotionStats(7),
          getGardenGrowth(),
          listEmotionCalendar(30, emotionFilter),
          getAchievements()
        ])

        if (requestId !== refreshRequestIdRef.current) {
          return
        }

        setGardenItems(nextGarden)
        setStatsSummary(nextStats)
        setGrowthSnapshot(nextGrowth)
        setCalendarDays(nextCalendar)
        setAchievementSummary(nextAchievements)

        const newlyUnlocked = nextAchievements.recentlyUnlocked.filter(
          (a) => !seenUnlockedIdsRef.current.has(a.id)
        )
        if (newlyUnlocked.length > 0) {
          newlyUnlocked.forEach((a) => seenUnlockedIdsRef.current.add(a.id))
          if (seenUnlockedIdsRef.current.size > newlyUnlocked.length) {
            setAchievementToasts((prev) => [
              ...prev,
              ...newlyUnlocked.map((a) => ({ id: a.id, title: a.title }))
            ])
          }
        }

        const requestedDate = options.preferSelectedDate ? selectedDate : null
        const nextSelectedDate = resolvePreferredDate(nextCalendar, requestedDate)
        setSelectedDate(nextSelectedDate)

        if (nextSelectedDate) {
          const nextTimeline = await listEmotionTimeline({
            date: nextSelectedDate,
            emotionTags: emotionFilter,
            limit: 50
          })

          if (requestId !== refreshRequestIdRef.current) {
            return
          }

          setTimelineItems(nextTimeline)
        } else {
          setTimelineItems([])
        }
      } finally {
        if (requestId === refreshRequestIdRef.current) {
          setIsDashboardLoading(false)
        }
      }
    },
    [
      emotionFilter,
      getAchievements,
      getEmotionStats,
      getGardenGrowth,
      listEmotionCalendar,
      listEmotionTimeline,
      listGarden,
      resolvePreferredDate,
      selectedDate
    ]
  )

  const quickEntryCheckedRef = useRef(false)

  useEffect(() => {
    if (hasLoadedRef.current) {
      return
    }

    hasLoadedRef.current = true
    void refreshAllPanels({ preferSelectedDate: false })
  }, [refreshAllPanels])

  useEffect(() => {
    if (quickEntryCheckedRef.current || isDashboardLoading) return
    quickEntryCheckedRef.current = true

    const today = new Date()
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    if (!gardenItems.some((item) => item.releasedOn === todayKey)) {
      setShowQuickEntry(true)
    }
  }, [gardenItems, isDashboardLoading])

  useEffect(() => {
    const trimmed = inputValue.trim()

    if (!trimmed) {
      setDraftAnalysis(null)
      setIsAnalyzing(false)
      return
    }

    const requestId = analysisRequestIdRef.current + 1
    analysisRequestIdRef.current = requestId
    setIsAnalyzing(true)

    const timer = window.setTimeout(() => {
      void analyzeEmotion(trimmed)
        .then((result) => {
          if (analysisRequestIdRef.current === requestId) {
            setDraftAnalysis(result)
          }
        })
        .catch((error) => {
          console.error(error)
          if (analysisRequestIdRef.current === requestId) {
            setDraftAnalysis(null)
          }
        })
        .finally(() => {
          if (analysisRequestIdRef.current === requestId) {
            setIsAnalyzing(false)
          }
        })
    }, 320)

    return () => {
      window.clearTimeout(timer)
    }
  }, [analyzeEmotion, inputValue])

  const isDisabled = useMemo(() => {
    return isSubmitting || inputValue.trim().length === 0 || !draftAnalysis
  }, [draftAnalysis, inputValue, isSubmitting])

  const activeEffect = useMemo(() => {
    return (
      ritualEffectOptions.find((option) => option.value === effectType) ?? ritualEffectOptions[0]
    )
  }, [effectType])

  const timelineHeadline = useMemo(() => {
    if (!selectedDate) {
      return '最近时间轴'
    }

    return `${selectedDate} 的情绪时间轴`
  }, [selectedDate])

  const previewGardenItems = useMemo(() => {
    return gardenItems.slice(0, 6)
  }, [gardenItems])

  const intensityLabelMap: Record<EmotionIntensity, string> = {
    mild: '轻微',
    moderate: '中等',
    strong: '强烈'
  }

  const analysisSummary = useMemo(() => {
    if (!draftAnalysis) {
      return null
    }

    return {
      emotionTag: draftAnalysis.emotionTag,
      intensityLabel: intensityLabelMap[draftAnalysis.analysis.emotionIntensity],
      triggerScene: draftAnalysis.analysis.triggerScene,
      guidanceQuestion: draftAnalysis.analysis.guidanceQuestion,
      suggestedLabels: draftAnalysis.analysis.suggestedLabels,
      timeContextLabel: draftAnalysis.analysis.timeContextLabel,
      confidence: Math.round(draftAnalysis.analysis.confidence * 100),
      sourceLabel: draftAnalysis.analysis.source === 'ai' ? 'AI 识别' : '规则回退'
    }
  }, [draftAnalysis])

  const handleQuickRelease = async (emotionTag: EmotionTag): Promise<void> => {
    setShowQuickEntry(false)
    const def = getEmotionDefinitionByTag(emotionTag)
    const hour = new Date().getHours()
    const quickInput: ReleaseEmotionInput = {
      textLength: 0,
      exclamationDensity: 0,
      emphasisLevel: 0,
      flowerType: def.flowerType,
      colorHex: def.colorHex,
      emotionTag,
      analysis: {
        emotionIntensity: 'mild',
        triggerScene: '快捷记录',
        guidanceQuestion: '今天过得怎么样？',
        suggestedLabels: [def.displayName],
        confidence: 1,
        timeContextHour: hour,
        timeContextLabel: getTimeContextLabel(hour),
        source: 'rule-fallback',
        sourceModel: 'quick-entry'
      }
    }

    try {
      const nextGarden = await releaseEmotion(quickInput)
      setGardenItems(nextGarden)
      await refreshAllPanels({ nextGarden, preferSelectedDate: true })
      setRecapData({ emotionTag, intensity: 'mild' })
    } catch (error) {
      console.error(error)
      setStatusText('快捷释放没有成功，请稍后再试。')
    }
  }

  const handleCommit = async (): Promise<void> => {
    const trimmedInput = inputValue.trim()
    if (!trimmedInput || !draftAnalysis) {
      return
    }

    const pendingRecap = {
      emotionTag: draftAnalysis.emotionTag,
      intensity: draftAnalysis.analysis.emotionIntensity
    }

    setIsSubmitting(true)
    setRitualText(trimmedInput)
    setParticleState('burst')
    setRitualActive(true)
    setStatusText('正在坍缩当前输入，只保留花朵结果。')

    try {
      const nextGarden = await releaseEmotion(draftAnalysis)
      setGardenItems(nextGarden)
      setInputValue('')
      setDraftAnalysis(null)
      setStatusText('原文已经坍缩，新的花朵正在花园里发芽。')
      await refreshAllPanels({ nextGarden, preferSelectedDate: true })

      window.setTimeout(() => {
        setRitualActive(false)
        setRitualText('')
        setParticleState('idle')
        setRecapData(pendingRecap)
      }, 1400)
    } catch (error) {
      console.error(error)
      setStatusText('这次粉碎没有成功，请稍后再试。')
      window.setTimeout(() => {
        setRitualActive(false)
        setRitualText('')
        setParticleState('idle')
      }, 1400)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleWaterFlower = async (flowerId: number): Promise<void> => {
    const result = await waterFlower(flowerId)
    if (result.success) {
      setGardenItems(result.garden)
      await refreshAllPanels({ nextGarden: result.garden, preferSelectedDate: true })
    }
  }

  return (
    <main
      className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-4 px-4 py-4"
      data-calendar-season={growthSnapshot?.seasonalTheme?.calendarSeason ?? 'spring'}
    >
      <header className="game-hud flex-wrap justify-between">
        <div className="flex items-center gap-4">
          <span className="text-[11px] font-bold text-rose-300">EMO-TRASH</span>
          <span className="game-hud-stat">花朵 <span className="game-hud-stat-value">{gardenItems.length}</span></span>
          <span className="game-hud-stat">连续 <span className="game-hud-stat-value">{growthSnapshot?.currentStreakDays ?? 0}天</span></span>
          <span className="game-hud-stat">浇水 <span className="game-hud-stat-value">{growthSnapshot?.manualWateringsRemaining ?? 3}/3</span></span>
        </div>
        <span className="text-[10px] text-white/40">{growthSnapshot?.seasonalTheme?.combinedLabel ?? '新芽季'}</span>
      </header>

      <nav className="game-nav">
        {appPages.map((page) => {
          const selected = page.value === activePage
          return (
            <button
              key={page.value}
              type="button"
              aria-current={selected ? 'page' : undefined}
              data-app-page={page.value}
              data-selected={selected ? 'true' : 'false'}
              onClick={() => setActivePage(page.value)}
              className="game-nav-item"
            >
              {page.label}
            </button>
          )
        })}
      </nav>

      {activePage === 'release' ? (
        <section className="grid flex-1 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="pixel-panel flex flex-col p-5">
            <div className="mb-4 flex items-center justify-between border-b-2 border-dashed border-white/10 pb-3">
              <h2 className="text-sm font-bold tracking-widest text-rose-300">▼ 情绪垃圾桶</h2>
              <span className="text-[10px] text-white/50">{statusText}</span>
            </div>

            <div className="flex flex-1 flex-col gap-4">
              <CaptureInput value={inputValue} disabled={isSubmitting} onChange={setInputValue} />
              <div className="border-2 border-white/10 bg-black/40 p-3" style={{ borderRadius: '4px' }}>
                <div className="flex items-center justify-between gap-3 border-b-2 border-dashed border-white/5 pb-2">
                  <h3 className="text-[11px] font-bold tracking-widest text-cyan-300">▼ AI 情绪识别</h3>
                  <span className="border border-white/15 bg-black/40 px-2 py-0.5 text-[9px] text-white/60" style={{ borderRadius: '2px' }}>
                    {isAnalyzing ? '识别中…' : analysisSummary ? analysisSummary.sourceLabel : '待输入'}
                  </span>
                </div>
                {analysisSummary ? (
                  <div className="mt-4 space-y-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">主情绪</p>
                        <p className="mt-2 text-base font-semibold text-white">
                          {analysisSummary.emotionTag} · {analysisSummary.intensityLabel}
                        </p>
                        <p className="mt-1 text-xs text-white/45">
                          置信度 {analysisSummary.confidence}% · {analysisSummary.timeContextLabel}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">触发场景</p>
                        <p className="mt-2 text-base font-semibold text-white">
                          {analysisSummary.triggerScene}
                        </p>
                        <p className="mt-1 text-xs text-white/45">自动结合输入与时间语境生成</p>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-rose-300/20 bg-rose-400/10 px-3 py-3">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-rose-100/70">引导问题</p>
                      <p className="mt-2 text-sm leading-6 text-rose-50">
                        {analysisSummary.guidanceQuestion}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {analysisSummary.suggestedLabels.map((label) => (
                        <span
                          key={label}
                          className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-white/70"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-sm leading-6 text-white/45">
                    输入几句话后，这里会自动显示识别到的主情绪、触发场景和温和追问。
                  </p>
                )}
              </div>
              <HoldToShredButton disabled={isDisabled} onCommit={handleCommit} />
            </div>
          </div>

          <div className="pixel-panel flex flex-col gap-4 p-5">
            <div className="border-b-2 border-dashed border-white/10 pb-3">
              <h2 className="text-sm font-bold tracking-widest text-amber-300">▼ 粉碎仪式</h2>
              <p className="mt-1 text-[10px] text-white/40">选择特效后长按提交</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {ritualEffectOptions.map((option) => {
                const selected = option.value === effectType
                return (
                  <button
                    key={option.value}
                    type="button"
                    data-effect-option={option.value}
                    data-selected={selected ? 'true' : 'false'}
                    onClick={() => setEffectType(option.value)}
                    className="pixel-btn text-left"
                    style={{
                      background: selected ? 'rgba(251, 113, 133, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      borderColor: selected ? 'rgba(251, 113, 133, 0.5)' : 'rgba(255, 255, 255, 0.15)',
                      color: selected ? '#fda4af' : 'rgba(255, 255, 255, 0.6)'
                    }}
                  >
                    <span className="block text-[11px] font-bold">[{option.label}]</span>
                    <span className="mt-0.5 block text-[9px] text-white/45">{option.subtitle}</span>
                  </button>
                )
              })}
            </div>
            <div className="border-2 border-white/10 bg-black/40 p-3" style={{ borderRadius: '4px' }}>
              <p className="text-[10px] text-amber-300/80">▸ {activeEffect.label}</p>
              <p className="mt-1 text-[10px] leading-5 text-white/55">{activeEffect.description}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {activeEffect.recommendedTags.map((tag) => (
                  <span
                    key={tag}
                    className="border border-amber-300/30 bg-amber-300/5 px-1.5 py-0.5 text-[9px] text-amber-200/80"
                    style={{ borderRadius: '2px' }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <RitualCanvas
              text={ritualActive ? ritualText : inputValue}
              active={ritualActive}
              particleState={particleState}
              effectType={effectType}
            />
            <p className="text-center text-[10px] leading-5 text-white/40">
              ※ 仅提取张力特征，不存原文
            </p>
            <GardenView items={previewGardenItems} growthSnapshot={growthSnapshot} onWaterFlower={handleWaterFlower} wateringDisabled={(growthSnapshot?.manualWateringsRemaining ?? 0) <= 0} />
          </div>

          {!ritualActive && recapData && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <RecapCard
                emotionTag={recapData.emotionTag}
                intensity={recapData.intensity}
                currentStreak={growthSnapshot?.currentStreakDays ?? 0}
                onDismiss={() => setRecapData(null)}
              />
            </div>
          )}
        </section>
      ) : null}

      {activePage === 'analytics' ? (
        <section className="grid gap-4 xl:grid-cols-[1.18fr_0.82fr]">
          <div className="pixel-panel p-5">
            <h2 className="mb-3 border-b-2 border-dashed border-white/10 pb-2 text-sm font-bold tracking-widest text-cyan-300">▼ 情绪统计</h2>
            <EmotionStatsPanel summary={statsSummary} loading={isDashboardLoading} />
          </div>
          <div className="pixel-panel p-5">
            <h2 className="mb-3 border-b-2 border-dashed border-white/10 pb-2 text-sm font-bold tracking-widest text-emerald-300">▼ 花园成长</h2>
            <GardenGrowthPanel snapshot={growthSnapshot} loading={isDashboardLoading} />
          </div>
        </section>
      ) : null}

      {activePage === 'history' ? (
        <section className="pixel-panel flex flex-col gap-4 p-5">
          <h2 className="border-b-2 border-dashed border-white/10 pb-2 text-sm font-bold tracking-widest text-purple-300">▼ 情绪历史</h2>
          <EmotionFilterBar
            selectedTags={emotionFilter}
            onChange={(nextTags) => {
              setEmotionFilter(nextTags)
              void refreshHistory(nextTags, selectedDate)
            }}
          />
          <EmotionCalendarHeatmap
            days={calendarDays}
            selectedDate={selectedDate}
            onSelectDate={(nextDate) => {
              setSelectedDate(nextDate)
              void refreshTimeline(nextDate, emotionFilter)
            }}
          />
          <div className="space-y-2 border-t-2 border-dashed border-white/10 pt-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold tracking-widest text-purple-300">▸ {timelineHeadline}</h3>
              <span className="text-[10px] text-white/35">按情绪筛选</span>
            </div>
            <EmotionTimeline items={timelineItems} selectedDate={selectedDate} />
          </div>
        </section>
      ) : null}

      {activePage === 'garden' ? (
        <section className="grid gap-4 xl:grid-cols-[0.84fr_1.16fr]">
          <div className="pixel-panel p-5">
            <h2 className="mb-3 border-b-2 border-dashed border-white/10 pb-2 text-sm font-bold tracking-widest text-emerald-300">▼ 花园状态</h2>
            <GardenGrowthPanel snapshot={growthSnapshot} loading={isDashboardLoading} />
          </div>
          <div className="pixel-panel p-5">
            <h2 className="mb-3 border-b-2 border-dashed border-white/10 pb-2 text-sm font-bold tracking-widest text-emerald-300">▼ 像素花园</h2>
            <GardenView items={gardenItems} growthSnapshot={growthSnapshot} onWaterFlower={handleWaterFlower} wateringDisabled={(growthSnapshot?.manualWateringsRemaining ?? 0) <= 0} />
          </div>
        </section>
      ) : null}

      {activePage === 'achievements' ? (
        <AchievementsPage summary={achievementSummary} loading={isDashboardLoading} />
      ) : null}

      <AchievementToast
        items={achievementToasts}
        onDismiss={(id) => setAchievementToasts((prev) => prev.filter((t) => t.id !== id))}
      />

      {showQuickEntry && (
        <DailyQuickEntry
          onSelect={(tag) => void handleQuickRelease(tag)}
          onSkip={() => setShowQuickEntry(false)}
        />
      )}
    </main>
  )
}

export default App
