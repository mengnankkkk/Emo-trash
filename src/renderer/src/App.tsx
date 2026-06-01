import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  AchievementSummary,
  DecorationType,
  EmotionCalendarDay,
  EmotionIntensity,
  EmotionStatsSummary,
  EmotionTag,
  EmotionTimelineEntry,
  EmotionBattleMatch,
  FlowerDexSummary,
  FlowerRarity,
  GardenGrowthSnapshot,
  GardenItem,
  GardenLandCell,
  PlacedDecoration,
  ReleaseEmotionInput,
  SeedInventoryItem,
  TitleSummary
} from './types/emotion'
import CaptureInput from './features/capture/CaptureInput'
import DailyQuickEntry from './features/capture/DailyQuickEntry'
import EmotionStatsPanel from './features/analytics/EmotionStatsPanel'
import GardenGrowthPanel from './features/garden/GardenGrowthPanel'
import GridGardenView from './features/garden/GridGardenView'
import GardenWeather from './features/garden/GardenWeather'
import EmotionCalendarHeatmap from './features/history/EmotionCalendarHeatmap'
import EmotionFilterBar from './features/history/EmotionFilterBar'
import EmotionTimeline from './features/history/EmotionTimeline'
import AchievementsPage from './features/achievements/AchievementsPage'
import AchievementToast, { type ToastItem } from './features/achievements/AchievementToast'
import { CoinToast } from './components/CoinToast'
import { SeedInventoryPanel } from './features/garden/SeedInventoryPanel'
import FlowerDexPage from './features/flowerdex/FlowerDexPage'
import { EmotionBattlePanel } from './features/battle/EmotionBattlePanel'
import { BattleToast } from './features/battle/BattleToast'
import RecapCard from './features/recap/RecapCard'
import HoldToShredButton from './features/ritual/HoldToShredButton'
import RitualCanvas from './features/ritual/RitualCanvas'
import { useEmotionApi } from './hooks/useEmotionApi'
import {
  getEmotionDefinitionByTag,
  ritualEffectValues,
  getRitualEffectDefinition,
  type RitualEffect
} from '../../shared/emotionMeta'
import { getTimeContextLabel } from '../../shared/emotionAnalysis'
import { computeEmotionWeather } from '../../shared/emotionWeather'

type AppPage = 'release' | 'analytics' | 'garden' | 'achievements' | 'flowerdex' | 'battle'
type AnalyticsTab = 'overview' | 'history'

const defaultStatusText = '把想扔掉的内容输入进来，然后长按底部按钮。'

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
    subtitle: '情绪粉碎台',
    summary: '把情绪转成种子，送进你的花园',
    indexLabel: '01'
  },
  {
    value: 'analytics',
    label: '统计',
    subtitle: '情绪回看',
    summary: '查看近况、热力图和时间线记录',
    indexLabel: '02'
  },
  {
    value: 'garden',
    label: '花园',
    subtitle: '种植养成',
    summary: '播种、浇水、采摘都在这里完成',
    indexLabel: '03'
  },
  {
    value: 'achievements',
    label: '成就',
    subtitle: '徽章档案',
    summary: '查看解锁进度与当前称号',
    indexLabel: '04'
  },
  {
    value: 'flowerdex',
    label: '图鉴',
    subtitle: '花朵收集册',
    summary: '查看花朵图鉴并管理装饰收藏',
    indexLabel: '05'
  },
  {
    value: 'battle',
    label: '对战',
    subtitle: '情绪碰撞场',
    summary: '带着花园战力进入像素对决',
    indexLabel: '06'
  }
]

function App(): React.JSX.Element {
  const [inputValue, setInputValue] = useState('')
  const [draftAnalysis, setDraftAnalysis] = useState<ReleaseEmotionInput | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [ritualText, setRitualText] = useState('')
  const [gardenItems, setGardenItems] = useState<GardenItem[]>([])
  const [gardenLands, setGardenLands] = useState<GardenLandCell[]>([])
  const [seedInventory, setSeedInventory] = useState<SeedInventoryItem[]>([])
  const [activeSeed, setActiveSeed] = useState<{ emotionTag: EmotionTag; rarity: string } | null>(
    null
  )
  const [placedDecorations, setPlacedDecorations] = useState<PlacedDecoration[]>([])
  const [activeDecoration, setActiveDecoration] = useState<DecorationType | null>(null)
  const [currencyBalance, setCurrencyBalance] = useState(0)
  const [coinToastAmount, setCoinToastAmount] = useState<number | null>(null)
  const [battleToast, setBattleToast] = useState<EmotionBattleMatch | null>(null)
  const [ritualActive, setRitualActive] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusText, setStatusText] = useState(defaultStatusText)
  const [particleState, setParticleState] = useState<'idle' | 'burst'>('idle')
  const [currentEffect, setCurrentEffect] = useState<RitualEffect>('burst')
  const [activePage, setActivePage] = useState<AppPage>('release')
  const [analyticsTab, setAnalyticsTab] = useState<AnalyticsTab>('overview')
  const [statsSummary, setStatsSummary] = useState<EmotionStatsSummary | null>(null)
  const [growthSnapshot, setGrowthSnapshot] = useState<GardenGrowthSnapshot | null>(null)
  const [calendarDays, setCalendarDays] = useState<EmotionCalendarDay[]>([])
  const [timelineItems, setTimelineItems] = useState<EmotionTimelineEntry[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [emotionFilter, setEmotionFilter] = useState<EmotionTag[]>([])
  const [isDashboardLoading, setIsDashboardLoading] = useState(true)
  const [achievementSummary, setAchievementSummary] = useState<AchievementSummary | null>(null)
  const [flowerDexSummary, setFlowerDexSummary] = useState<FlowerDexSummary | null>(null)
  const [titleSummary, setTitleSummary] = useState<TitleSummary | null>(null)
  const [recapData, setRecapData] = useState<{
    emotionTag: EmotionTag
    intensity: EmotionIntensity
    rarity: FlowerRarity
  } | null>(null)
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
    pickFlower,
    getEmotionStats,
    getGardenGrowth,
    getAchievements,
    getFlowerDex,
    getTitles,
    listEmotionCalendar,
    listEmotionTimeline,
    getGardenLands,
    unlockGardenLand,
    getCurrencyBalance,
    getSeedInventory,
    plantSeed,
    getDecorationSummary,
    purchaseDecoration,
    placeDecoration
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
        const [
          nextGardenResult,
          nextStatsResult,
          nextGrowthResult,
          nextCalendarResult,
          nextAchievementsResult,
          nextFlowerDexResult,
          nextTitlesResult
        ] = await Promise.allSettled([
          options.nextGarden ? Promise.resolve(options.nextGarden) : listGarden(),
          getEmotionStats(7),
          getGardenGrowth(),
          listEmotionCalendar(30, emotionFilter),
          getAchievements(),
          getFlowerDex(),
          getTitles()
        ])

        if (requestId !== refreshRequestIdRef.current) {
          return
        }

        const nextGarden =
          nextGardenResult.status === 'fulfilled' ? nextGardenResult.value : options.nextGarden ?? []
        const nextStats = nextStatsResult.status === 'fulfilled' ? nextStatsResult.value : null
        const nextGrowth = nextGrowthResult.status === 'fulfilled' ? nextGrowthResult.value : null
        const nextCalendar =
          nextCalendarResult.status === 'fulfilled' ? nextCalendarResult.value : calendarDays
        const nextAchievements =
          nextAchievementsResult.status === 'fulfilled' ? nextAchievementsResult.value : null
        const nextFlowerDex =
          nextFlowerDexResult.status === 'fulfilled' ? nextFlowerDexResult.value : null
        const nextTitles = nextTitlesResult.status === 'fulfilled' ? nextTitlesResult.value : null

        setGardenItems(nextGarden)
        setStatsSummary(nextStats)
        setGrowthSnapshot(nextGrowth)
        setCalendarDays(nextCalendar)
        setAchievementSummary(nextAchievements)
        setFlowerDexSummary(nextFlowerDex)
        setTitleSummary(nextTitles)

        if (nextAchievements) {
          const newlyUnlocked = nextAchievements.recentlyUnlocked.filter(
            (achievement) => !seenUnlockedIdsRef.current.has(achievement.id)
          )
          if (newlyUnlocked.length > 0) {
            newlyUnlocked.forEach((achievement) => seenUnlockedIdsRef.current.add(achievement.id))
            if (seenUnlockedIdsRef.current.size > newlyUnlocked.length) {
              setAchievementToasts((prev) => [
                ...prev,
                ...newlyUnlocked.map((achievement) => ({
                  id: achievement.id,
                  title: achievement.title
                }))
              ])
            }
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
      } catch (error) {
        console.error('refreshAllPanels failed', error)
        setStatusText('界面刷新失败，请稍后重试。')
        window.setTimeout(() => setStatusText(defaultStatusText), 2000)
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
      getFlowerDex,
      getGardenGrowth,
      getTitles,
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

  const activeEffectLabel = useMemo(() => {
    return getRitualEffectDefinition(currentEffect).label
  }, [currentEffect])

  const timelineHeadline = useMemo(() => {
    if (!selectedDate) {
      return '最近时间线'
    }

    return `${selectedDate} 的情绪时间线`
  }, [selectedDate])

  const previewGardenItems = useMemo(() => {
    return gardenItems.slice(0, 6)
  }, [gardenItems])

  const currentWeather = useMemo(() => computeEmotionWeather(gardenItems), [gardenItems])

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
        triggerScene: '快速记录',
        guidanceQuestion: '要不要先把这份情绪种下，再慢慢看它会开成什么？',
        suggestedLabels: [def.displayName],
        confidence: 1,
        timeContextHour: hour,
        timeContextLabel: getTimeContextLabel(hour),
        source: 'rule-fallback',
        sourceModel: 'quick-entry'
      }
    }

    try {
      const seedResult = await releaseEmotion(quickInput)
      const nextSeeds = await getSeedInventory()
      setSeedInventory(nextSeeds)

      if (seedResult.seedAdded) {
        setStatusText(`已获得一颗${seedResult.emotionTag}种子，去花园里播种吧。`)
        window.setTimeout(() => setStatusText(defaultStatusText), 3000)
      }

      setRecapData({ emotionTag, intensity: 'mild', rarity: (seedResult.rarity as any) ?? 'common' })
    } catch (error) {
      console.error(error)
      setStatusText('快速释放失败，请稍后再试。')
    }
  }

  const handleCommit = async (): Promise<void> => {
    const trimmedInput = inputValue.trim()
    if (!trimmedInput || !draftAnalysis) {
      return
    }

    const randomEffect = ritualEffectValues[Math.floor(Math.random() * ritualEffectValues.length)]
    setCurrentEffect(randomEffect)
    setIsSubmitting(true)
    setRitualText(trimmedInput)
    setParticleState('burst')
    setRitualActive(true)
    setStatusText('正在粉碎情绪，并把它凝成一颗种子……')

    try {
      const seedResult = await releaseEmotion(draftAnalysis)
      const nextSeeds = await getSeedInventory()
      const pendingRecap = {
        emotionTag: draftAnalysis.emotionTag,
        intensity: draftAnalysis.analysis.emotionIntensity,
        rarity: (seedResult.rarity as any) ?? 'common'
      }

      setInputValue('')
      setDraftAnalysis(null)
      setSeedInventory(nextSeeds)
      setStatusText('释放完成，新的种子已经放进背包。')
      await refreshAllPanels({ preferSelectedDate: true })

      window.setTimeout(() => {
        setRitualActive(false)
        setRitualText('')
        setParticleState('idle')
        setRecapData(pendingRecap)
      }, 1400)
    } catch (error) {
      console.error(error)
      setStatusText('释放失败，请稍后重试。')
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
      void refreshAllPanels({ nextGarden: result.garden, preferSelectedDate: true }).catch(
        (error) => {
          console.error('refresh after pick failed', error)
        }
      )
    }
  }

  const _handlePickFlowerLegacy = async (flowerId: number): Promise<void> => {
    const result = await pickFlower(flowerId)

    if (!result.success) {
      setStatusText(result.message || '采摘失败。')
      window.setTimeout(() => setStatusText(defaultStatusText), 2000)
      return
    }

    setGardenItems(result.garden)

    if (result.coinsEarned > 0) {
      setCoinToastAmount(result.coinsEarned)
    }

    if (result.message) {
      setStatusText(result.message)
      window.setTimeout(() => setStatusText(defaultStatusText), 2000)
    }

    const balance = await getCurrencyBalance()
    setCurrencyBalance(balance.balance)
    await refreshAllPanels({ nextGarden: result.garden, preferSelectedDate: true })
  }

  void _handlePickFlowerLegacy

  const handlePickFlower = async (flowerId: number): Promise<void> => {
    try {
      const result = await pickFlower(flowerId)

      if (!result.success) {
        setStatusText(result.message || '采摘失败。')
        window.setTimeout(() => setStatusText(defaultStatusText), 2000)
        return
      }

      setGardenItems(result.garden)

      if (result.coinsEarned > 0) {
        setCoinToastAmount(result.coinsEarned)
      }

      if (result.message) {
        setStatusText(result.message)
        window.setTimeout(() => setStatusText(defaultStatusText), 2000)
      }

      try {
        const balance = await getCurrencyBalance()
        setCurrencyBalance(balance.balance)
      } catch (error) {
        console.error('load currency balance after pick failed', error)
      }

      if (result.battleMatch) {
        setBattleToast(result.battleMatch)
        setStatusText(`对立触发：${result.battleMatch.emotionPair.label}`)
      }
      await refreshAllPanels({ nextGarden: result.garden, preferSelectedDate: true })
    } catch (error) {
      console.error('pick flower failed', error)
      setStatusText('采摘失败，请稍后重试。')
      window.setTimeout(() => setStatusText(defaultStatusText), 2000)
    }
  }

  const handleUnlockLand = async (gridX: number, gridY: number): Promise<void> => {
    const result = await unlockGardenLand(gridX, gridY)

    if (result.success) {
      const nextLands = await getGardenLands()
      setGardenLands(nextLands)
      setCurrencyBalance(result.balance)
      setStatusText(`地块解锁成功，花费 ${result.coinsSpent} 金币。`)
      window.setTimeout(() => setStatusText(defaultStatusText), 2000)
    } else {
      setStatusText(result.message || '地块解锁失败。')
      window.setTimeout(() => setStatusText(defaultStatusText), 2000)
    }
  }

  const handlePlantSeed = async (gridX: number, gridY: number): Promise<void> => {
    if (!activeSeed) return

    const result = await plantSeed({
      emotionTag: activeSeed.emotionTag,
      rarity: activeSeed.rarity as any,
      gridX,
      gridY
    })

    if (result.success) {
      setGardenItems(result.garden)
      setActiveSeed(null)
      setStatusText('播种成功，花朵已经开始生长。')
      window.setTimeout(() => setStatusText(defaultStatusText), 2000)

      const nextSeeds = await getSeedInventory()
      setSeedInventory(nextSeeds)
      await refreshAllPanels({ nextGarden: result.garden, preferSelectedDate: true })
    } else {
      setStatusText(result.message || '播种失败。')
      window.setTimeout(() => setStatusText(defaultStatusText), 2000)
    }
  }

  const loadCurrencyBalance = async (): Promise<void> => {
    const balance = await getCurrencyBalance()
    setCurrencyBalance(balance.balance)
  }

  const loadGardenLands = async (): Promise<void> => {
    const lands = await getGardenLands()
    setGardenLands(lands)
  }

  const loadSeedInventory = async (): Promise<void> => {
    const seeds = await getSeedInventory()
    setSeedInventory(seeds)
  }

  const loadPlacedDecorations = async (): Promise<void> => {
    const summary = await getDecorationSummary()
    setPlacedDecorations(summary.placed)
  }

  const handlePurchaseDecoration = async (type: DecorationType): Promise<void> => {
    const result = await purchaseDecoration(type)
    if (result.success) {
      setCurrencyBalance(result.balance)
      setStatusText('购买成功，返回花园即可放置装饰。')
      window.setTimeout(() => setStatusText(defaultStatusText), 2000)
    } else {
      setStatusText(result.message || '购买失败。')
      window.setTimeout(() => setStatusText(defaultStatusText), 2000)
    }
  }

  const handlePlaceDecoration = async (gridX: number, gridY: number): Promise<void> => {
    if (!activeDecoration) return

    await placeDecoration({ type: activeDecoration, positionX: gridX, positionY: gridY })
    setActiveDecoration(null)
    await loadPlacedDecorations()
    setStatusText('装饰已放置到花园。')
    window.setTimeout(() => setStatusText(defaultStatusText), 2000)
  }

  useEffect(() => {
    loadGardenLands()
    loadCurrencyBalance()
    loadSeedInventory()
    loadPlacedDecorations()
  }, [])

  return (
    <main
      className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-4 px-4 py-4"
      data-calendar-season={growthSnapshot?.seasonalTheme?.calendarSeason ?? 'spring'}
      data-weather={currentWeather.type}
    >
      <header className="game-hud flex-wrap justify-between">
        <div className="flex items-center gap-4">
          <span
            className="text-[11px] font-bold"
            style={{
              background: 'linear-gradient(90deg, #e91e63, #7b1fa2, #0277bd)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            EMO-TRASH
          </span>
          <span className="game-hud-stat">
            金币 <span className="game-hud-stat-value" style={{ color: '#ffa726' }}>{currencyBalance}</span>
          </span>
          <span className="game-hud-stat">
            花朵 <span className="game-hud-stat-value">{gardenItems.length}</span>
          </span>
          <span className="game-hud-stat">
            连续 <span className="game-hud-stat-value">{growthSnapshot?.currentStreakDays ?? 0}天</span>
          </span>
          <span className="game-hud-stat">
            浇水{' '}
            <span className="game-hud-stat-value">
              {growthSnapshot?.manualWateringsRemaining ?? 1}/1
            </span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          {titleSummary?.activeTitle && (
            <span
              className="rounded-[2px] border-2 border-[var(--accent-amber)] bg-[color-mix(in_srgb,var(--accent-amber)_12%,var(--bg-panel))] px-2 py-0.5 text-[10px] font-bold tracking-[0.16em] text-[var(--accent-amber)]"
              title={titleSummary.activeTitle.description}
            >
              当前称号 {titleSummary.activeTitle.label}
            </span>
          )}
          <span className="text-[10px] text-[var(--text-muted)]">
            {growthSnapshot?.seasonalTheme?.combinedLabel ?? '新芽季'}
          </span>
        </div>
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
          <div className="pixel-panel pixel-panel--rose flex flex-col p-5">
            <div className="mb-4 flex items-center justify-between border-b-3 border-dashed border-[#e91e63]/30 pb-3">
              <h2 className="text-sm font-bold tracking-widest text-[var(--accent-rose)]">
                情绪粉碎台
              </h2>
              <span className="text-[10px] text-[var(--text-muted)]">{statusText}</span>
            </div>

            <div className="flex flex-1 flex-col gap-4">
              <CaptureInput value={inputValue} disabled={isSubmitting} onChange={setInputValue} />
              <div
                className="border-3 border-[#00838f] bg-[var(--accent-cyan-soft)] p-3"
                style={{ borderRadius: '4px' }}
              >
                <div className="flex items-center justify-between gap-3 border-b-3 border-dashed border-[#00838f]/30 pb-2">
                  <h3 className="text-[11px] font-bold tracking-widest text-[var(--accent-cyan)]">
                    AI 情绪识别
                  </h3>
                  <span
                    className="border-2 border-[var(--accent-purple)] bg-[var(--accent-purple-soft)] px-2 py-0.5 text-[9px] text-[var(--accent-purple)]"
                    style={{ borderRadius: '2px' }}
                  >
                    {isAnalyzing
                      ? '识别中...'
                      : analysisSummary
                        ? analysisSummary.sourceLabel
                        : '等待输入'}
                  </span>
                </div>
                {analysisSummary ? (
                  <div className="mt-4 space-y-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-[4px] border-2 border-[var(--border-primary)] bg-[var(--bg-panel)] px-3 py-3">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
                          主情绪
                        </p>
                        <p className="mt-2 text-base font-semibold text-[var(--text-primary)]">
                          {analysisSummary.emotionTag} / {analysisSummary.intensityLabel}
                        </p>
                        <p className="mt-1 text-xs text-[var(--text-secondary)]">
                          置信度 {analysisSummary.confidence}% / {analysisSummary.timeContextLabel}
                        </p>
                      </div>
                      <div className="rounded-[4px] border-2 border-[var(--border-primary)] bg-[var(--bg-panel)] px-3 py-3">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
                          触发场景
                        </p>
                        <p className="mt-2 text-base font-semibold text-[var(--text-primary)]">
                          {analysisSummary.triggerScene}
                        </p>
                        <p className="mt-1 text-xs text-[var(--text-secondary)]">
                          自动结合输入内容与时间语境生成
                        </p>
                      </div>
                    </div>
                    <div className="rounded-[4px] border-2 border-[var(--accent-rose)] bg-[var(--accent-rose-soft)] px-3 py-3">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--accent-rose)]">
                        引导问题
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">
                        {analysisSummary.guidanceQuestion}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {analysisSummary.suggestedLabels.map((label, idx) => {
                        const tagColors = [
                          '#e91e63',
                          '#7b1fa2',
                          '#0277bd',
                          '#2e7d32',
                          '#e65100',
                          '#00838f'
                        ]
                        const color = tagColors[idx % tagColors.length]
                        return (
                          <span
                            key={label}
                            className="rounded-[2px] border-2 px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em]"
                            style={{ borderColor: color, color, background: `${color}11` }}
                          >
                            {label}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">
                    输入几句内容后，这里会自动显示识别出的主情绪、触发场景和温和追问。
                  </p>
                )}
              </div>
              <HoldToShredButton disabled={isDisabled} onCommit={handleCommit} />
            </div>
          </div>

          <div className="pixel-panel pixel-panel--amber flex flex-col gap-4 p-5">
            <div className="border-b-3 border-dashed border-[#e65100]/30 pb-3">
              <h2 className="text-sm font-bold tracking-widest text-[var(--accent-amber)]">
                粉碎仪式
              </h2>
              <p className="mt-1 text-[10px] text-[var(--text-muted)]">长按提交后随机触发特效</p>
            </div>
            {ritualActive && (
              <div
                className="flex items-center gap-2 border-2 border-[var(--accent-amber)] bg-[var(--accent-amber-soft)] px-3 py-2"
                style={{ borderRadius: '4px' }}
              >
                <span className="text-[10px] text-[var(--accent-amber)]">当前特效</span>
                <span className="text-[11px] font-bold text-[var(--accent-amber)]">
                  [{activeEffectLabel}]
                </span>
              </div>
            )}
            <RitualCanvas
              text={ritualActive ? ritualText : inputValue}
              active={ritualActive}
              particleState={particleState}
              effectType={currentEffect}
            />
            <p className="text-center text-[10px] leading-5 text-[var(--text-muted)]">
              仅提取情绪特征，不保存原始文本
            </p>
            <GardenWeather weatherType={currentWeather.type} label={currentWeather.label} />
            <GridGardenView
              items={previewGardenItems}
              lands={gardenLands}
              growthSnapshot={growthSnapshot}
              activeSeed={activeSeed}
              onWaterFlower={handleWaterFlower}
              onPickFlower={handlePickFlower}
              onUnlockLand={handleUnlockLand}
              onPlantSeed={handlePlantSeed}
              wateringDisabled={(growthSnapshot?.manualWateringsRemaining ?? 0) <= 0}
            />
          </div>

          {!ritualActive && recapData && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-overlay)] backdrop-blur-sm">
              <RecapCard
                emotionTag={recapData.emotionTag}
                intensity={recapData.intensity}
                rarity={recapData.rarity}
                currentStreak={growthSnapshot?.currentStreakDays ?? 0}
                onDismiss={() => setRecapData(null)}
              />
            </div>
          )}
        </section>
      ) : null}

      {activePage === 'analytics' ? (
        <section className="flex flex-col gap-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAnalyticsTab('overview')}
              className={[
                'pixel-btn text-[11px]',
                analyticsTab === 'overview'
                  ? '!border-[var(--accent-sky)] !text-[var(--accent-sky)]'
                  : ''
              ].join(' ')}
            >
              总览
            </button>
            <button
              type="button"
              onClick={() => setAnalyticsTab('history')}
              className={[
                'pixel-btn text-[11px]',
                analyticsTab === 'history'
                  ? '!border-[var(--accent-purple)] !text-[var(--accent-purple)]'
                  : ''
              ].join(' ')}
            >
              历史
            </button>
          </div>

          {analyticsTab === 'overview' ? (
            <section className="grid gap-4 xl:grid-cols-[1.18fr_0.82fr]">
              <div className="pixel-panel pixel-panel--sky p-5">
                <h2 className="mb-3 border-b-3 border-dashed border-[#0277bd]/30 pb-2 text-sm font-bold tracking-widest text-[var(--accent-sky)]">
                  情绪概览
                </h2>
                <EmotionStatsPanel summary={statsSummary} loading={isDashboardLoading} />
              </div>
              <div className="pixel-panel pixel-panel--emerald p-5">
                <h2 className="mb-3 border-b-3 border-dashed border-[#2e7d32]/30 pb-2 text-sm font-bold tracking-widest text-[var(--accent-emerald)]">
                  花园进度
                </h2>
                <GardenGrowthPanel snapshot={growthSnapshot} loading={isDashboardLoading} />
              </div>
            </section>
          ) : (
            <section className="pixel-panel pixel-panel--purple flex flex-col gap-4 p-5">
              <h2 className="border-b-3 border-dashed border-[#7b1fa2]/30 pb-2 text-sm font-bold tracking-widest text-[var(--accent-purple)]">
                情绪历史
              </h2>
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
              <div className="space-y-2 border-t-3 border-dashed border-[var(--border-primary)] pt-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold tracking-widest text-[var(--accent-purple)]">
                    时间线 / {timelineHeadline}
                  </h3>
                  <span className="text-[10px] text-[var(--text-muted)]">按日期查看</span>
                </div>
                <EmotionTimeline items={timelineItems} selectedDate={selectedDate} />
              </div>
            </section>
          )}
        </section>
      ) : null}

      {activePage === 'garden' ? (
        <section className="pixel-panel pixel-panel--cyan flex flex-col gap-3 p-5">
          <h2 className="mb-1 border-b-3 border-dashed border-[#00838f]/30 pb-2 text-sm font-bold tracking-widest text-[var(--accent-cyan)]">
            花园操作台
          </h2>
          <GardenWeather weatherType={currentWeather.type} label={currentWeather.label} />
          <SeedInventoryPanel
            seeds={seedInventory}
            activeSeed={activeSeed}
            onSelectSeed={(emotionTag, rarity) => setActiveSeed({ emotionTag, rarity })}
            onDeselectSeed={() => setActiveSeed(null)}
          />
          <GridGardenView
            items={gardenItems}
            lands={gardenLands}
            placedDecorations={placedDecorations}
            activeDecoration={activeDecoration}
            growthSnapshot={growthSnapshot}
            activeSeed={activeSeed}
            onWaterFlower={handleWaterFlower}
            onPickFlower={handlePickFlower}
            onUnlockLand={handleUnlockLand}
            onPlantSeed={handlePlantSeed}
            onPlaceDecoration={handlePlaceDecoration}
            wateringDisabled={(growthSnapshot?.manualWateringsRemaining ?? 0) <= 0}
          />
        </section>
      ) : null}

      {activePage === 'achievements' ? (
        <AchievementsPage
          summary={achievementSummary}
          titleSummary={titleSummary}
          loading={isDashboardLoading}
        />
      ) : null}

      {activePage === 'flowerdex' ? (
        <FlowerDexPage
          summary={flowerDexSummary}
          loading={isDashboardLoading}
          balance={currencyBalance}
          activeDecoration={activeDecoration}
          onPurchaseDecoration={handlePurchaseDecoration}
          onSelectDecoration={(type) => setActiveDecoration(type)}
        />
      ) : null}

      {activePage === 'battle' ? <EmotionBattlePanel /> : null}

      <AchievementToast
        items={achievementToasts}
        onDismiss={(id) => setAchievementToasts((prev) => prev.filter((toast) => toast.id !== id))}
      />

      {coinToastAmount !== null && (
        <CoinToast amount={coinToastAmount} onComplete={() => setCoinToastAmount(null)} />
      )}

      <BattleToast match={battleToast} onComplete={() => setBattleToast(null)} />

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
