import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  EmotionCalendarDay,
  EmotionStatsRange,
  EmotionStatsSummary,
  EmotionTag,
  EmotionTimelineEntry,
  GardenGrowthSnapshot,
  GardenItem,
  RitualEffect
} from './types/emotion'
import CaptureInput from './features/capture/CaptureInput'
import EmotionStatsPanel from './features/analytics/EmotionStatsPanel'
import GardenGrowthPanel from './features/garden/GardenGrowthPanel'
import GardenView from './features/garden/GardenView'
import EmotionCalendarHeatmap from './features/history/EmotionCalendarHeatmap'
import EmotionFilterBar from './features/history/EmotionFilterBar'
import EmotionTimeline from './features/history/EmotionTimeline'
import HoldToShredButton from './features/ritual/HoldToShredButton'
import RitualCanvas from './features/ritual/RitualCanvas'
import { useEmotionApi } from './hooks/useEmotionApi'

type AppPage = 'release' | 'analytics' | 'history' | 'garden'

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
  }
]

function App(): React.JSX.Element {
  const [inputValue, setInputValue] = useState('')
  const [ritualText, setRitualText] = useState('')
  const [gardenItems, setGardenItems] = useState<GardenItem[]>([])
  const [ritualActive, setRitualActive] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusText, setStatusText] = useState('把想扔掉的内容输入进来，然后长按底部按钮。')
  const [particleState, setParticleState] = useState<'idle' | 'burst'>('idle')
  const [effectType, setEffectType] = useState<RitualEffect>('burst')
  const [activePage, setActivePage] = useState<AppPage>('release')
  const [statsRange, setStatsRange] = useState<EmotionStatsRange>(7)
  const [statsSummary, setStatsSummary] = useState<EmotionStatsSummary | null>(null)
  const [growthSnapshot, setGrowthSnapshot] = useState<GardenGrowthSnapshot | null>(null)
  const [calendarDays, setCalendarDays] = useState<EmotionCalendarDay[]>([])
  const [timelineItems, setTimelineItems] = useState<EmotionTimelineEntry[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [emotionFilter, setEmotionFilter] = useState<EmotionTag[]>([])
  const [isDashboardLoading, setIsDashboardLoading] = useState(true)
  const hasLoadedRef = useRef(false)
  const refreshRequestIdRef = useRef(0)
  const {
    listGarden,
    releaseEmotion,
    getEmotionStats,
    getGardenGrowth,
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

  const refreshStatsOnly = useCallback(
    async (nextRange: EmotionStatsRange): Promise<void> => {
      const nextStats = await getEmotionStats(nextRange)
      setStatsSummary(nextStats)
    },
    [getEmotionStats]
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
        const [nextGarden, nextStats, nextGrowth, nextCalendar] = await Promise.all([
          options.nextGarden ? Promise.resolve(options.nextGarden) : listGarden(),
          getEmotionStats(statsRange),
          getGardenGrowth(),
          listEmotionCalendar(30, emotionFilter)
        ])

        if (requestId !== refreshRequestIdRef.current) {
          return
        }

        setGardenItems(nextGarden)
        setStatsSummary(nextStats)
        setGrowthSnapshot(nextGrowth)
        setCalendarDays(nextCalendar)

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
      getEmotionStats,
      getGardenGrowth,
      listEmotionCalendar,
      listEmotionTimeline,
      listGarden,
      resolvePreferredDate,
      selectedDate,
      statsRange
    ]
  )

  useEffect(() => {
    if (hasLoadedRef.current) {
      return
    }

    hasLoadedRef.current = true
    void refreshAllPanels({ preferSelectedDate: false })
  }, [refreshAllPanels])

  const isDisabled = useMemo(() => {
    return isSubmitting || inputValue.trim().length === 0
  }, [inputValue, isSubmitting])

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

  const pageHeadline = useMemo(() => {
    if (activePage === 'release') {
      return {
        eyebrow: '情绪垃圾桶',
        title: '把主界面拆开，只保留当前要做的事',
        description: statusText
      }
    }

    if (activePage === 'analytics') {
      return {
        eyebrow: '情绪统计',
        title: '单独查看最近节律与花园成长',
        description: '把统计和成长面板从主流程里拿出来，切页时不打断已有数据状态。'
      }
    }

    if (activePage === 'history') {
      return {
        eyebrow: '情绪历史',
        title: '把热力图和时间轴放进独立复盘页',
        description: '这里专门用于按日期和情绪标签回看最近 30 天的释放轨迹。'
      }
    }

    return {
      eyebrow: '像素花园',
      title: '让花园自己占一整页',
      description: '完整花园和成长状态单独展示，不再挤在仪式和统计下面。'
    }
  }, [activePage, statusText])

  const activePageMeta = useMemo(() => {
    return appPages.find((page) => page.value === activePage) ?? appPages[0]
  }, [activePage])

  const pageSummaryCards = useMemo(() => {
    if (activePage === 'release') {
      return [
        {
          label: '当前输入',
          value: `${inputValue.trim().length} 字`,
          detail: '只在本机进入粉碎仪式'
        },
        { label: '当前特效', value: activeEffect.label, detail: activeEffect.subtitle },
        { label: '花园结果', value: `${gardenItems.length} 朵`, detail: '原文不会留在花园里' }
      ]
    }

    if (activePage === 'analytics') {
      return [
        { label: '统计范围', value: `${statsRange} 天`, detail: '可切换最近 7 / 30 天' },
        {
          label: '累计释放',
          value: `${statsSummary?.totalReleases ?? 0} 次`,
          detail: '来自本地花园记录'
        },
        {
          label: '连续释放',
          value: `${statsSummary?.currentStreakDays ?? 0} 天`,
          detail: growthSnapshot?.seasonLabel ?? '等待花园稳定生长'
        }
      ]
    }

    if (activePage === 'history') {
      return [
        { label: '选中日期', value: selectedDate ?? '最近记录', detail: '点击热力图可切换日期' },
        { label: '时间轴', value: `${timelineItems.length} 条`, detail: '显示当日释放结果' },
        {
          label: '筛选情绪',
          value: `${emotionFilter.length} 类`,
          detail: '按标签收窄热力图和时间轴'
        }
      ]
    }

    return [
      { label: '花朵总数', value: `${gardenItems.length} 朵`, detail: '完整保留释放后的花' },
      {
        label: '当前阶段',
        value: growthSnapshot?.levelLabel ?? '生长期',
        detail: '由连续释放和活跃度推进'
      },
      {
        label: '最近活跃',
        value: `${growthSnapshot?.recentReleaseCount ?? 0} 次`,
        detail: '统计最近 7 天释放'
      }
    ]
  }, [
    activeEffect.label,
    activeEffect.subtitle,
    activePage,
    emotionFilter.length,
    gardenItems.length,
    growthSnapshot?.levelLabel,
    growthSnapshot?.recentReleaseCount,
    growthSnapshot?.seasonLabel,
    inputValue,
    selectedDate,
    statsRange,
    statsSummary?.currentStreakDays,
    statsSummary?.totalReleases,
    timelineItems.length
  ])

  const handleCommit = async (): Promise<void> => {
    const trimmedInput = inputValue.trim()
    if (!trimmedInput) {
      return
    }

    setIsSubmitting(true)
    setRitualText(trimmedInput)
    setParticleState('burst')
    setRitualActive(true)
    setStatusText('正在坍缩当前输入，只保留花朵结果。')

    try {
      const nextGarden = await releaseEmotion(trimmedInput)
      setGardenItems(nextGarden)
      setInputValue('')
      setStatusText('原文已经坍缩，新的花朵正在花园里发芽。')
      await refreshAllPanels({ nextGarden, preferSelectedDate: true })
    } catch (error) {
      console.error(error)
      setStatusText('这次粉碎没有成功，请稍后再试。')
    } finally {
      window.setTimeout(() => {
        setRitualActive(false)
        setRitualText('')
        setParticleState('idle')
      }, 1400)
      setIsSubmitting(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-5 py-6 md:px-10 md:py-10">
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 backdrop-blur">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.32em] text-white/30">
              {activePageMeta.label} / {pageHeadline.eyebrow}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
              {pageHeadline.title}
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-white/55">{pageHeadline.description}</p>
          </div>
          <div className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.28em] text-rose-200/80">
            本地坍缩
          </div>
        </div>

        <div className="mt-5 rounded-[1.7rem] border border-white/10 bg-black/25 p-2">
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
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
                  className={[
                    'group relative overflow-hidden rounded-[1.35rem] border px-4 py-3 text-left transition',
                    selected
                      ? 'border-rose-300 bg-rose-400/15 text-rose-100 shadow-[2px_2px_0_rgba(251,113,133,0.18)]'
                      : 'border-transparent bg-white/[0.03] text-white/60 hover:border-white/10 hover:bg-white/[0.06] hover:text-white'
                  ].join(' ')}
                >
                  <span
                    className={[
                      'absolute inset-x-4 top-0 h-0.5 rounded-full transition',
                      selected
                        ? 'bg-rose-200 opacity-100'
                        : 'bg-white/20 opacity-0 group-hover:opacity-60'
                    ].join(' ')}
                  />
                  <span className="flex items-start justify-between gap-3">
                    <span>
                      <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-white/30">
                        {page.indexLabel}
                      </span>
                      <span className="mt-1 block text-sm font-semibold tracking-[0.14em]">
                        {page.label}
                      </span>
                    </span>
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] tracking-[0.16em] text-white/35">
                      {selected ? '当前' : '进入'}
                    </span>
                  </span>
                  <span className="mt-2 block text-xs text-white/45">{page.subtitle}</span>
                  <span className="mt-1 block text-[11px] leading-5 text-white/35">
                    {page.summary}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {pageSummaryCards.map((card) => (
            <div
              key={card.label}
              className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] px-4 py-3"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/30">
                {card.label}
              </p>
              <p className="mt-2 text-xl font-semibold text-white">{card.value}</p>
              <p className="mt-1 text-xs leading-5 text-white/40">{card.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {activePage === 'release' ? (
        <section className="grid flex-1 gap-6 lg:grid-cols-[1.12fr_0.88fr]">
          <div className="flex flex-col rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20 backdrop-blur">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.32em] text-white/30">Emo-trash</p>
                <h2 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
                  情绪垃圾桶
                </h2>
              </div>
              <div className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.28em] text-rose-200/80">
                当前流程
              </div>
            </div>

            <p className="mb-8 max-w-2xl text-sm leading-7 text-white/55">{statusText}</p>

            <div className="flex flex-1 flex-col gap-6">
              <CaptureInput value={inputValue} disabled={isSubmitting} onChange={setInputValue} />
              <HoldToShredButton disabled={isDisabled} onCommit={handleCommit} />
            </div>
          </div>

          <div className="flex flex-col gap-6 rounded-[2rem] border border-white/10 bg-black/25 p-5 shadow-2xl shadow-black/30">
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.28em] text-white/30">粉碎仪式</p>
                <h2 className="text-2xl font-semibold text-white">让输入在眼前坍塌</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {ritualEffectOptions.map((option) => {
                  const selected = option.value === effectType
                  return (
                    <button
                      key={option.value}
                      type="button"
                      data-effect-option={option.value}
                      data-selected={selected ? 'true' : 'false'}
                      onClick={() => setEffectType(option.value)}
                      className={[
                        'ritual-effect-chip rounded-2xl border px-3 py-2 text-left transition',
                        selected
                          ? 'border-rose-300 bg-rose-400/15 text-rose-100 shadow-[2px_2px_0_rgba(251,113,133,0.2)]'
                          : 'border-white/10 bg-white/[0.03] text-white/55 hover:border-white/20 hover:text-white'
                      ].join(' ')}
                    >
                      <span className="block text-xs font-semibold tracking-[0.18em]">
                        {option.label}
                      </span>
                      <span className="mt-1 block text-[10px] text-white/45">
                        {option.subtitle}
                      </span>
                    </button>
                  )
                })}
              </div>
              <div className="ritual-effect-panel rounded-3xl border border-white/10 bg-black/20 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.24em] text-white/30">当前特效</p>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold text-white">{activeEffect.label}</span>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-white/45">
                        {activeEffect.subtitle}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-rose-100/80">
                    推荐搭配
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-white/55">{activeEffect.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {activeEffect.recommendedTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-white/70"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <RitualCanvas
              text={ritualActive ? ritualText : inputValue}
              active={ritualActive}
              particleState={particleState}
              effectType={effectType}
            />
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm leading-7 text-white/45">
              长按达到阈值后，系统只会提取张力特征，并把它映射成一朵花的种子写入本地花园。
            </div>
            <GardenGrowthPanel snapshot={growthSnapshot} loading={isDashboardLoading} />
            <GardenView items={previewGardenItems} growthSnapshot={growthSnapshot} />
          </div>
        </section>
      ) : null}

      {activePage === 'analytics' ? (
        <section className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
          <EmotionStatsPanel
            summary={statsSummary}
            rangeDays={statsRange}
            onRangeChange={(nextRange) => {
              setStatsRange(nextRange)
              void refreshStatsOnly(nextRange)
            }}
            loading={isDashboardLoading}
          />
          <GardenGrowthPanel snapshot={growthSnapshot} loading={isDashboardLoading} />
        </section>
      ) : null}

      {activePage === 'history' ? (
        <section className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-black/25 p-5 shadow-2xl shadow-black/30">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.28em] text-white/30">情绪历史</p>
            <h2 className="text-2xl font-semibold text-white">把最近 30 天排成一张热力地图</h2>
          </div>
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
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-white">{timelineHeadline}</h3>
              <span className="text-xs text-white/35">支持按情绪筛选查看</span>
            </div>
            <EmotionTimeline items={timelineItems} selectedDate={selectedDate} />
          </div>
        </section>
      ) : null}

      {activePage === 'garden' ? (
        <section className="grid gap-6 xl:grid-cols-[0.84fr_1.16fr]">
          <GardenGrowthPanel snapshot={growthSnapshot} loading={isDashboardLoading} />
          <div className="rounded-[2rem] border border-white/10 bg-black/25 p-5 shadow-2xl shadow-black/30">
            <GardenView items={gardenItems} growthSnapshot={growthSnapshot} />
          </div>
        </section>
      ) : null}
    </main>
  )
}

export default App
