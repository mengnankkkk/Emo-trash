import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { GardenGrowthSnapshot, GardenItem } from '../../types/emotion'
import { getFlowerAssetByType, getFlowerAssets } from '../../lib/flowerAssets'
import { getGrowthStageLabel } from '../../../../shared/emotionInsights'
import type { CalendarSeason, GardenSeason } from '../../../../shared/seasonalTheme'

const seasonColors: Record<CalendarSeason, { particle: string; tintBase: string }> = {
  spring: { particle: 'rgba(76, 175, 80, 0.9)', tintBase: '76, 175, 80' },
  summer: { particle: 'rgba(255, 152, 0, 0.9)', tintBase: '255, 152, 0' },
  autumn: { particle: 'rgba(183, 28, 28, 0.8)', tintBase: '183, 28, 28' },
  winter: { particle: 'rgba(25, 118, 210, 0.85)', tintBase: '25, 118, 210' }
}

const gardenTintOpacity: Record<GardenSeason, number> = {
  seed: 0.10,
  bloom: 0.18,
  flourish: 0.28
}

const gardenGlowOpacity: Record<GardenSeason, number> = {
  seed: 0,
  bloom: 0.18,
  flourish: 0.28
}

const particleCounts: Record<GardenSeason, number> = {
  seed: 4,
  bloom: 8,
  flourish: 14
}

const particleDurations: Record<CalendarSeason, [number, number]> = {
  spring: [6, 10],
  summer: [4, 7],
  autumn: [7, 12],
  winter: [9, 15]
}

function SeasonalParticles({
  calendarSeason,
  gardenSeason
}: {
  calendarSeason: CalendarSeason
  gardenSeason: GardenSeason
}): React.JSX.Element {
  const count = particleCounts[gardenSeason]
  const color = seasonColors[calendarSeason].particle
  const [minDur, maxDur] = particleDurations[calendarSeason]

  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const left = ((i * 37 + 13) % 90) + 5
      const delay = ((i * 1.7 + 0.3) % (maxDur - 1)).toFixed(1)
      const duration = (minDur + ((i * 2.3) % (maxDur - minDur))).toFixed(1)
      const size = 3 + (i % 3)
      return { left, delay, duration, size, key: i }
    })
  }, [count, minDur, maxDur])

  return (
    <>
      {particles.map((p) => (
        <div
          key={p.key}
          className="season-particle"
          data-season={calendarSeason}
          style={{
            left: `${p.left}%`,
            top: calendarSeason === 'autumn' || calendarSeason === 'winter' ? '0%' : '100%',
            width: p.size,
            height: p.size,
            background: color,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            animationIterationCount: 'infinite',
            animationTimingFunction: 'ease-in-out'
          }}
        />
      ))}
    </>
  )
}

interface GardenViewProps {
  items: GardenItem[]
  growthSnapshot: GardenGrowthSnapshot | null
  onWaterFlower?: (flowerId: number) => void
  onPickFlower?: (flowerId: number) => void
  wateringDisabled?: boolean
}

function GardenView({ items, growthSnapshot, onWaterFlower, onPickFlower, wateringDisabled }: GardenViewProps): React.JSX.Element {
  const previousIdsRef = useRef<Set<number>>(new Set())
  const hydratedRef = useRef(false)
  const [sproutingIds, setSproutingIds] = useState<Set<number>>(new Set())
  const [swayingIds, setSwayingIds] = useState<Set<number>>(new Set())
  const [splashId, setSplashId] = useState<number | null>(null)
  const [activeTool, setActiveTool] = useState<'none' | 'water' | 'pick'>('none')
  const flowerAssets = useMemo(() => getFlowerAssets(), [])

  const handleToolClick = useCallback((tool: 'water' | 'pick') => {
    setActiveTool((prev) => (prev === tool ? 'none' : tool))
  }, [])

  const handleFlowerClick = useCallback((flowerId: number) => {
    if (activeTool === 'water' && onWaterFlower) {
      setSplashId(flowerId)
      window.setTimeout(() => setSplashId(null), 600)
      onWaterFlower(flowerId)
    } else if (activeTool === 'pick' && onPickFlower) {
      onPickFlower(flowerId)
    }
  }, [activeTool, onWaterFlower, onPickFlower])

  useEffect(() => {
    const nextIds = new Set(items.map((item) => item.id))

    if (!hydratedRef.current) {
      hydratedRef.current = true
      previousIdsRef.current = nextIds
      return
    }

    const newIds = [...nextIds].filter((id) => !previousIdsRef.current.has(id))
    previousIdsRef.current = nextIds

    if (newIds.length === 0) {
      return
    }

    setSproutingIds((current) => {
      const next = new Set(current)
      newIds.forEach((id) => next.add(id))
      return next
    })

    setSwayingIds((current) => {
      const next = new Set(current)
      newIds.forEach((id) => next.delete(id))
      return next
    })

    const sproutTimer = window.setTimeout(() => {
      setSproutingIds((current) => {
        const next = new Set(current)
        newIds.forEach((id) => next.delete(id))
        return next
      })

      setSwayingIds((current) => {
        const next = new Set(current)
        newIds.forEach((id) => next.add(id))
        return next
      })
    }, 1100)

    const swayTimer = window.setTimeout(() => {
      setSwayingIds((current) => {
        const next = new Set(current)
        newIds.forEach((id) => next.delete(id))
        return next
      })
    }, 3600)

    return () => {
      window.clearTimeout(sproutTimer)
      window.clearTimeout(swayTimer)
    }
  }, [items])

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="text-xs uppercase tracking-[0.28em] text-[var(--text-muted)]">像素花园</span>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">保留的是结果，不是原文。</p>
        </div>
        {growthSnapshot ? (
          <div className="rounded-[2px] border-2 border-[var(--border-primary)] bg-[var(--bg-surface)] px-4 py-2 text-xs tracking-[0.18em] text-[var(--accent-emerald)]">
            当前阶段：{growthSnapshot.levelLabel}
          </div>
        ) : (
          <span className="text-xs text-[var(--text-muted)]">等待新的花朵生长</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 rounded-[4px] border-2 border-[var(--border-primary)] bg-[var(--bg-surface)] p-3">
        {flowerAssets.map((asset) => (
          <div
            key={asset.emotionTag}
            className="emotion-chip flex items-center gap-2 rounded-[4px] border-2 border-[var(--border-primary)] bg-[var(--bg-panel)] px-3 py-2"
          >
            <img alt={asset.displayName} className="garden-sprite h-5 w-5" src={asset.textureUrl} />
            <span className="text-xs font-medium text-[var(--text-secondary)]">{asset.displayName}</span>
          </div>
        ))}
      </div>

      {(() => {
        const theme = growthSnapshot?.seasonalTheme
        const calendarSeason = theme?.calendarSeason ?? 'spring'
        const gardenSeason = theme?.gardenSeason ?? 'seed'
        const colors = seasonColors[calendarSeason]
        const tintOpacity = gardenTintOpacity[gardenSeason]
        const glowOpacity = gardenGlowOpacity[gardenSeason]

        return (
          <>
            <div className="garden-toolbar">
              <button
                type="button"
                className="garden-tool-btn"
                data-active={activeTool === 'water' ? 'true' : 'false'}
                style={{ '--tool-color': '#0277bd', '--tool-bg': '#e1f5fe' } as React.CSSProperties}
                onClick={() => handleToolClick('water')}
              >
                <span style={{ width: 16, height: 16, display: 'inline-block', position: 'relative' }}>
                  <span style={{
                    position: 'absolute', width: 2, height: 2,
                    boxShadow: '4px 0 0 #0277bd, 6px 0 0 #0277bd, 2px 2px 0 #0277bd, 4px 2px 0 #0277bd, 6px 2px 0 #0277bd, 8px 2px 0 #0277bd, 0 4px 0 #0288d1, 2px 4px 0 #0288d1, 4px 4px 0 #0288d1, 6px 4px 0 #0288d1, 8px 4px 0 #0288d1, 10px 4px 0 #0288d1, 0 6px 0 #0288d1, 2px 6px 0 #0288d1, 8px 6px 0 #0288d1, 10px 6px 0 #0288d1, 0 8px 0 #01579b, 2px 8px 0 #01579b, 4px 8px 0 #01579b, 6px 8px 0 #01579b, 8px 8px 0 #01579b, 10px 8px 0 #01579b, 2px 10px 0 #01579b, 4px 10px 0 #01579b, 6px 10px 0 #01579b, 8px 10px 0 #01579b'
                  }} />
                </span>
                浇水{wateringDisabled ? '（已用完）' : ''}
              </button>
              <button
                type="button"
                className="garden-tool-btn"
                data-active={activeTool === 'pick' ? 'true' : 'false'}
                style={{ '--tool-color': '#2e7d32', '--tool-bg': '#e8f5e9' } as React.CSSProperties}
                onClick={() => handleToolClick('pick')}
              >
                <span style={{ width: 16, height: 16, display: 'inline-block', position: 'relative' }}>
                  <span style={{
                    position: 'absolute', width: 2, height: 2,
                    boxShadow: '4px 0 0 #2e7d32, 8px 0 0 #2e7d32, 4px 2px 0 #388e3c, 6px 2px 0 #388e3c, 8px 2px 0 #388e3c, 4px 4px 0 #388e3c, 6px 4px 0 #388e3c, 8px 4px 0 #388e3c, 2px 6px 0 #1b5e20, 4px 6px 0 #1b5e20, 6px 6px 0 #1b5e20, 8px 6px 0 #1b5e20, 10px 6px 0 #1b5e20, 2px 8px 0 #1b5e20, 4px 8px 0 #1b5e20, 6px 8px 0 #1b5e20, 8px 8px 0 #1b5e20, 10px 8px 0 #1b5e20, 4px 10px 0 #2e7d32, 6px 10px 0 #2e7d32, 8px 10px 0 #2e7d32, 4px 12px 0 #2e7d32, 6px 12px 0 #2e7d32, 8px 12px 0 #2e7d32'
                  }} />
                </span>
                采摘
              </button>
            </div>
            <div
              className="garden-atmosphere grid min-h-36 grid-cols-2 gap-3 border-2 border-[var(--border-primary)] bg-[var(--bg-surface)] p-4 md:grid-cols-4 xl:grid-cols-6"
            data-calendar-season={calendarSeason}
            data-garden-season={gardenSeason}
            style={{
              '--garden-tint': `rgba(${colors.tintBase}, ${tintOpacity})`,
              '--garden-glow': `rgba(${colors.tintBase}, ${glowOpacity})`,
              '--garden-glow-soft': `rgba(${colors.tintBase}, ${glowOpacity * 0.5})`
            } as React.CSSProperties}
          >
            <SeasonalParticles calendarSeason={calendarSeason} gardenSeason={gardenSeason} />
            {items.length === 0 ? (
              <div className="col-span-full flex items-center justify-center rounded-[4px] border-2 border-dashed border-[var(--border-primary)] bg-[var(--bg-panel)] px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                这里还没有长出任何花。
              </div>
            ) : (
              items.map((item) => {
                const isSprouting = sproutingIds.has(item.id)
                const isSwaying = swayingIds.has(item.id)
                const flowerAsset = getFlowerAssetByType(item.flowerType)
                const growthStageLabel = getGrowthStageLabel(item.growthStage)
                const isWithered = item.growthStage === 0

                return (
                  <article
                    key={item.id}
                    data-garden-item-id={item.id}
                    data-emotion-tag={flowerAsset.emotionTag}
                    data-growth-stage={item.growthStage}
                    data-sprouting={isSprouting ? 'true' : 'false'}
                    data-swaying={isSwaying ? 'true' : 'false'}
                    data-idle-sway={isSprouting ? 'false' : 'true'}
                    data-flower-skin={flowerAsset.label}
                    className={[
                      'garden-card garden-card--interactive flex min-h-32 flex-col items-center justify-between gap-2 rounded-[4px] border-2 border-[var(--border-primary)] bg-[var(--bg-panel)] px-3 py-3',
                      !isSprouting ? 'garden-card--idle' : '',
                      isSprouting ? 'garden-card--sprouting' : '',
                      isSwaying ? 'garden-card--swaying' : '',
                      isWithered ? 'garden-card--withered' : '',
                      item.growthStage === 2 ? 'garden-card--growth-2' : '',
                      item.growthStage === 3 ? 'garden-card--growth-3' : '',
                      item.growthStage === 4 ? 'garden-card--growth-4' : '',
                      item.growthStage === 5 ? 'garden-card--growth-5' : '',
                      activeTool !== 'none' ? 'garden-card--targetable' : '',
                      splashId === item.id ? 'garden-card--water-splash' : ''
                    ].join(' ')}
                    style={activeTool !== 'none' ? {
                      '--tool-color': activeTool === 'water' ? '#0277bd' : '#2e7d32',
                      '--tool-bg': activeTool === 'water' ? 'rgba(2,119,189,0.1)' : 'rgba(46,125,50,0.1)'
                    } as React.CSSProperties : undefined}
                  >
                    {activeTool !== 'none' && (
                      <button
                        type="button"
                        onClick={() => handleFlowerClick(item.id)}
                        className="absolute inset-0 z-10 cursor-pointer rounded-[4px] border-0 bg-transparent"
                        aria-label={activeTool === 'water' ? '浇水' : '采摘'}
                      />
                    )}
                    <div className="garden-flower relative h-10 w-10">
                      <span className="garden-glow absolute inset-x-1 bottom-0 h-3 rounded-full bg-emerald-400/30 blur-sm" />
                      <img
                        alt={`${flowerAsset.label} flower`}
                        className="garden-sprite garden-bloom absolute left-1/2 top-0 h-8 w-8 -translate-x-1/2"
                        src={flowerAsset.textureUrl}
                      />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="emotion-chip rounded-[2px] border-2 border-[var(--border-primary)] bg-[var(--bg-surface)] px-2 py-0.5 text-[10px] font-semibold tracking-[0.16em] text-[var(--text-secondary)]">
                        {flowerAsset.displayName}
                      </span>
                      <span className={`text-[11px] ${isWithered ? 'text-red-500' : 'text-[var(--text-secondary)]'}`}>
                        {growthStageLabel}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        浇水 {item.totalWaterings} 次
                      </span>
                    </div>
                  </article>
                )
              })
            )}
          </div>
          </>
        )
      })()}
    </section>
  )
}

export default GardenView
