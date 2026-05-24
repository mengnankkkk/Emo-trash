import { useEffect, useMemo, useRef, useState } from 'react'
import type { GardenGrowthSnapshot, GardenItem } from '../../types/emotion'
import { getFlowerAssetByType, getFlowerAssets } from '../../lib/flowerAssets'
import { getGrowthStageLabel } from '../../../../shared/emotionInsights'
import type { CalendarSeason, GardenSeason } from '../../../../shared/seasonalTheme'

const seasonColors: Record<CalendarSeason, { particle: string; tintBase: string }> = {
  spring: { particle: 'rgba(110, 231, 183, 0.8)', tintBase: '52, 211, 153' },
  summer: { particle: 'rgba(253, 224, 71, 0.8)', tintBase: '251, 191, 36' },
  autumn: { particle: 'rgba(251, 146, 60, 0.8)', tintBase: '251, 146, 60' },
  winter: { particle: 'rgba(186, 220, 255, 0.8)', tintBase: '147, 197, 253' }
}

const gardenTintOpacity: Record<GardenSeason, number> = {
  seed: 0.03,
  bloom: 0.06,
  flourish: 0.10
}

const gardenGlowOpacity: Record<GardenSeason, number> = {
  seed: 0,
  bloom: 0.08,
  flourish: 0.14
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
  wateringDisabled?: boolean
}

function GardenView({ items, growthSnapshot, onWaterFlower, wateringDisabled }: GardenViewProps): React.JSX.Element {
  const previousIdsRef = useRef<Set<number>>(new Set())
  const hydratedRef = useRef(false)
  const [sproutingIds, setSproutingIds] = useState<Set<number>>(new Set())
  const [swayingIds, setSwayingIds] = useState<Set<number>>(new Set())
  const flowerAssets = useMemo(() => getFlowerAssets(), [])

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
          <span className="text-xs uppercase tracking-[0.28em] text-white/35">像素花园</span>
          <p className="mt-2 text-sm text-white/45">保留的是结果，不是原文。</p>
        </div>
        {growthSnapshot ? (
          <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs tracking-[0.18em] text-emerald-100/80">
            当前阶段：{growthSnapshot.levelLabel}
          </div>
        ) : (
          <span className="text-xs text-white/35">等待新的花朵生长</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-black/15 p-3">
        {flowerAssets.map((asset) => (
          <div
            key={asset.emotionTag}
            className="emotion-chip flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2"
          >
            <img alt={asset.displayName} className="garden-sprite h-5 w-5" src={asset.textureUrl} />
            <span className="text-xs font-medium text-white/75">{asset.displayName}</span>
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
          <div
            className="garden-atmosphere grid min-h-36 grid-cols-2 gap-3 border border-white/10 bg-white/[0.03] p-4 md:grid-cols-4 xl:grid-cols-6"
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
              <div className="col-span-full flex items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/10 px-4 py-8 text-center text-sm text-white/30">
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
                      'garden-card garden-card--interactive flex min-h-32 flex-col items-center justify-between gap-2 rounded-2xl border border-white/10 bg-black/25 px-3 py-3',
                      !isSprouting ? 'garden-card--idle' : '',
                      isSprouting ? 'garden-card--sprouting' : '',
                      isSwaying ? 'garden-card--swaying' : '',
                      isWithered ? 'garden-card--withered' : '',
                      item.growthStage === 2 ? 'garden-card--growth-2' : '',
                      item.growthStage === 3 ? 'garden-card--growth-3' : '',
                      item.growthStage === 4 ? 'garden-card--growth-4' : '',
                      item.growthStage === 5 ? 'garden-card--growth-5' : ''
                    ].join(' ')}
                  >
                    <div className="garden-flower relative h-10 w-10">
                      <span className="garden-glow absolute inset-x-1 bottom-0 h-3 rounded-full bg-emerald-400/30 blur-sm" />
                      <img
                        alt={`${flowerAsset.label} flower`}
                        className="garden-sprite garden-bloom absolute left-1/2 top-0 h-8 w-8 -translate-x-1/2"
                        src={flowerAsset.textureUrl}
                      />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="emotion-chip rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold tracking-[0.16em] text-white/75">
                        {flowerAsset.displayName}
                      </span>
                      <span className={`text-[11px] ${isWithered ? 'text-red-300/70' : 'text-white/45'}`}>
                        {growthStageLabel}
                      </span>
                      <span className="text-[10px] text-white/30">
                        浇水 {item.totalWaterings} 次
                      </span>
                    </div>
                    {onWaterFlower && (
                      <button
                        type="button"
                        disabled={wateringDisabled || item.growthStage === 5}
                        onClick={() => onWaterFlower(item.id)}
                        className="water-btn mt-1 rounded-full border border-sky-300/30 bg-sky-400/10 px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] text-sky-200/80 transition hover:border-sky-300/50 hover:bg-sky-400/20 hover:shadow-[0_0_12px_rgba(56,189,248,0.15)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:shadow-none"
                      >
                        浇水
                      </button>
                    )}
                  </article>
                )
              })
            )}
          </div>
        )
      })()}
    </section>
  )
}

export default GardenView
