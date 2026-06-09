import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  EmotionTag,
  FlowerRarity,
  GardenGrowthSnapshot,
  GardenItem,
  GardenLandCell
} from '../../types/emotion'
import type { PlacedDecoration, DecorationType } from '../../../../preload/api'
import { getFlowerAssetByType } from '../../lib/flowerAssets'
import { getGrowthStageLabel } from '../../../../shared/emotionInsights'
import { getDecorationDefinition } from '../../../../shared/gardenDecoration'
import type { CalendarSeason, GardenSeason } from '../../../../shared/seasonalTheme'

const GRID_COLS = 6
const GRID_ROWS = 4
const CELL_SIZE = 80 // 像素

const seasonColors: Record<CalendarSeason, { particle: string; tintBase: string }> = {
  spring: { particle: 'rgba(76, 175, 80, 0.9)', tintBase: '76, 175, 80' },
  summer: { particle: 'rgba(255, 152, 0, 0.9)', tintBase: '255, 152, 0' },
  autumn: { particle: 'rgba(183, 28, 28, 0.8)', tintBase: '183, 28, 28' },
  winter: { particle: 'rgba(25, 118, 210, 0.85)', tintBase: '25, 118, 210' }
}

const gardenTintOpacity: Record<GardenSeason, number> = {
  seed: 0.1,
  bloom: 0.18,
  flourish: 0.28
}

interface GridGardenViewProps {
  items: GardenItem[]
  lands: GardenLandCell[]
  placedDecorations?: PlacedDecoration[]
  activeDecoration?: DecorationType | null
  movingDecoration?: PlacedDecoration | null
  growthSnapshot: GardenGrowthSnapshot | null
  activeSeed?: { emotionTag: EmotionTag; rarity: FlowerRarity } | null
  onWaterFlower?: (flowerId: number) => void
  onPickFlower?: (flowerId: number) => void
  onSelectFlower?: (flower: GardenItem) => void
  onUnlockLand?: (gridX: number, gridY: number) => void
  onPlantSeed?: (gridX: number, gridY: number) => void
  onPlaceDecoration?: (gridX: number, gridY: number) => void
  onMoveDecoration?: (gridX: number, gridY: number) => void
  onSelectDecorationToMove?: (decoration: PlacedDecoration) => void
  onCancelDecorationMove?: () => void
  onRemoveDecoration?: (placedId: number) => void
  wateringDisabled?: boolean
}

function GridGardenView({
  items,
  lands,
  placedDecorations = [],
  activeDecoration,
  movingDecoration,
  growthSnapshot,
  activeSeed,
  onWaterFlower,
  onPickFlower,
  onSelectFlower,
  onUnlockLand,
  onPlantSeed,
  onPlaceDecoration,
  onMoveDecoration,
  onSelectDecorationToMove,
  onCancelDecorationMove,
  onRemoveDecoration,
  wateringDisabled
}: GridGardenViewProps): React.JSX.Element {
  const [activeTool, setActiveTool] = useState<'none' | 'water' | 'pick' | 'unlock'>('none')
  const [splashId, setSplashId] = useState<number | null>(null)
  const previousIdsRef = useRef<Set<number>>(new Set())
  const hydratedRef = useRef(false)
  const [sproutingIds, setSproutingIds] = useState<Set<number>>(new Set())

  const isPlantingMode = activeSeed !== null && activeSeed !== undefined
  const isDecorationMode = activeDecoration !== null && activeDecoration !== undefined
  const isMovingMode = movingDecoration !== null && movingDecoration !== undefined

  const handleToolClick = useCallback((tool: 'water' | 'pick' | 'unlock') => {
    setActiveTool((prev) => (prev === tool ? 'none' : tool))
  }, [])

  const handleFlowerClick = useCallback(
    (flowerId: number) => {
      if (activeTool === 'water' && onWaterFlower) {
        setSplashId(flowerId)
        window.setTimeout(() => setSplashId(null), 600)
        onWaterFlower(flowerId)
      } else if (activeTool === 'pick' && onPickFlower) {
        onPickFlower(flowerId)
      }
    },
    [activeTool, onWaterFlower, onPickFlower]
  )

  const handleDecorationClick = useCallback(
    (decoration: PlacedDecoration) => {
      if (onSelectDecorationToMove) {
        onSelectDecorationToMove(decoration)
      }
    },
    [onSelectDecorationToMove]
  )

  const handleLandClick = useCallback(
    (gridX: number, gridY: number, hasFlower: boolean, hasDecoration: boolean, isUnlocked: boolean) => {
      if (isPlantingMode && isUnlocked && !hasFlower && !hasDecoration && onPlantSeed) {
        onPlantSeed(gridX, gridY)
        return
      }
      if (isMovingMode && isUnlocked && !hasFlower && !hasDecoration && onMoveDecoration) {
        onMoveDecoration(gridX, gridY)
        return
      }
      if (isDecorationMode && isUnlocked && !hasFlower && !hasDecoration && onPlaceDecoration) {
        onPlaceDecoration(gridX, gridY)
        return
      }
      if (activeTool === 'unlock' && !isUnlocked && onUnlockLand) {
        onUnlockLand(gridX, gridY)
      }
    },
    [activeTool, isPlantingMode, isMovingMode, isDecorationMode, onUnlockLand, onPlantSeed, onMoveDecoration, onPlaceDecoration]
  )

  // 创建装饰物地图
  const decorationMap = useMemo(() => {
    const map = new Map<string, PlacedDecoration>()
    placedDecorations.forEach((deco) => {
      const key = `${Math.floor(deco.positionX)},${Math.floor(deco.positionY)}`
      map.set(key, deco)
    })
    return map
  }, [placedDecorations])

  // 检测新花朵并触发发芽动画
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

    const sproutTimer = window.setTimeout(() => {
      setSproutingIds((current) => {
        const next = new Set(current)
        newIds.forEach((id) => next.delete(id))
        return next
      })
    }, 1100)

    return () => {
      window.clearTimeout(sproutTimer)
    }
  }, [items])

  // 创建网格地图：每个格子对应的花朵
  const gridMap = useMemo(() => {
    const map = new Map<string, GardenItem>()
    items.forEach((item) => {
      const key = `${item.gridX},${item.gridY}`
      map.set(key, item)
    })
    return map
  }, [items])

  // 创建土地地图
  const landMap = useMemo(() => {
    const map = new Map<string, GardenLandCell>()
    lands.forEach((land) => {
      const key = `${land.gridX},${land.gridY}`
      map.set(key, land)
    })
    return map
  }, [lands])

  const theme = growthSnapshot?.seasonalTheme
  const calendarSeason = theme?.calendarSeason ?? 'spring'
  const gardenSeason = theme?.gardenSeason ?? 'seed'
  const colors = seasonColors[calendarSeason]
  const tintOpacity = gardenTintOpacity[gardenSeason]

  return (
    <section className="flex flex-col gap-4">
      {/* 标题栏 */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="text-xs uppercase tracking-[0.28em] text-[var(--text-muted)]">
            像素花园
          </span>
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

      {/* 工具栏 */}
      <div className="garden-toolbar">
        <button
          type="button"
          className="garden-tool-btn"
          data-active={activeTool === 'water' ? 'true' : 'false'}
          style={{ '--tool-color': '#0277bd', '--tool-bg': '#e1f5fe' } as React.CSSProperties}
          onClick={() => handleToolClick('water')}
        >
          <span style={{ width: 16, height: 16, display: 'inline-block', position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                width: 2,
                height: 2,
                boxShadow:
                  '4px 0 0 #0277bd, 6px 0 0 #0277bd, 2px 2px 0 #0277bd, 4px 2px 0 #0277bd, 6px 2px 0 #0277bd, 8px 2px 0 #0277bd, 0 4px 0 #0288d1, 2px 4px 0 #0288d1, 4px 4px 0 #0288d1, 6px 4px 0 #0288d1, 8px 4px 0 #0288d1, 10px 4px 0 #0288d1, 0 6px 0 #0288d1, 2px 6px 0 #0288d1, 8px 6px 0 #0288d1, 10px 6px 0 #0288d1, 0 8px 0 #01579b, 2px 8px 0 #01579b, 4px 8px 0 #01579b, 6px 8px 0 #01579b, 8px 8px 0 #01579b, 10px 8px 0 #01579b, 2px 10px 0 #01579b, 4px 10px 0 #01579b, 6px 10px 0 #01579b, 8px 10px 0 #01579b'
              }}
            />
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
            <span
              style={{
                position: 'absolute',
                width: 2,
                height: 2,
                boxShadow:
                  '4px 0 0 #2e7d32, 8px 0 0 #2e7d32, 4px 2px 0 #388e3c, 6px 2px 0 #388e3c, 8px 2px 0 #388e3c, 4px 4px 0 #388e3c, 6px 4px 0 #388e3c, 8px 4px 0 #388e3c, 2px 6px 0 #1b5e20, 4px 6px 0 #1b5e20, 6px 6px 0 #1b5e20, 8px 6px 0 #1b5e20, 10px 6px 0 #1b5e20, 2px 8px 0 #1b5e20, 4px 8px 0 #1b5e20, 6px 8px 0 #1b5e20, 8px 8px 0 #1b5e20, 10px 8px 0 #1b5e20, 4px 10px 0 #2e7d32, 6px 10px 0 #2e7d32, 8px 10px 0 #2e7d32, 4px 12px 0 #2e7d32, 6px 12px 0 #2e7d32, 8px 12px 0 #2e7d32'
              }}
            />
          </span>
          采摘
        </button>
        <button
          type="button"
          className="garden-tool-btn"
          data-active={activeTool === 'unlock' ? 'true' : 'false'}
          style={{ '--tool-color': '#f57c00', '--tool-bg': '#fff3e0' } as React.CSSProperties}
          onClick={() => handleToolClick('unlock')}
        >
          <span style={{ width: 16, height: 16, display: 'inline-block', position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                width: 2,
                height: 2,
                boxShadow:
                  '6px 0 0 #f57c00, 8px 0 0 #f57c00, 4px 2px 0 #f57c00, 10px 2px 0 #f57c00, 4px 4px 0 #f57c00, 10px 4px 0 #f57c00, 4px 6px 0 #fb8c00, 6px 6px 0 #fb8c00, 8px 6px 0 #fb8c00, 10px 6px 0 #fb8c00, 4px 8px 0 #fb8c00, 6px 8px 0 #fb8c00, 8px 8px 0 #fb8c00, 10px 8px 0 #fb8c00, 4px 10px 0 #e65100, 6px 10px 0 #e65100, 8px 10px 0 #e65100, 10px 10px 0 #e65100'
              }}
            />
          </span>
          解锁土地
        </button>
      </div>

      {movingDecoration && (
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-[4px] border-2 border-[var(--accent-sky)] bg-[color-mix(in_srgb,var(--accent-sky)_10%,var(--bg-panel))] p-3"
          style={{ boxShadow: '2px 2px 0 color-mix(in srgb, var(--accent-sky) 35%, transparent)' }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">
              {getDecorationDefinition(movingDecoration.type).emoji}
            </span>
            <div>
              <p className="text-[11px] font-bold tracking-[0.12em] text-[var(--accent-sky)]">
                正在移动装饰
              </p>
              <p className="mt-1 text-[10px] text-[var(--text-secondary)]">
                选择一块已解锁空地完成移动，或把它收回到收藏。
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-[2px] border-2 border-[var(--border-primary)] bg-[var(--bg-panel)] px-3 py-1 text-[10px] font-bold tracking-[0.1em] text-[var(--text-secondary)]"
              onClick={onCancelDecorationMove}
            >
              取消移动
            </button>
            <button
              type="button"
              className="rounded-[2px] border-2 border-[var(--accent-rose)] bg-[color-mix(in_srgb,var(--accent-rose)_10%,var(--bg-panel))] px-3 py-1 text-[10px] font-bold tracking-[0.1em] text-[var(--accent-rose)]"
              onClick={() => onRemoveDecoration?.(movingDecoration.id)}
            >
              收回装饰
            </button>
          </div>
        </div>
      )}

      {/* 网格花园 */}
      <div
        className="garden-grid-container relative overflow-hidden rounded-[4px] border-2 border-[var(--border-primary)] bg-[var(--bg-surface)] p-4"
        style={
          {
            '--garden-tint': `rgba(${colors.tintBase}, ${tintOpacity})`,
            minHeight: GRID_ROWS * CELL_SIZE + 32
          } as React.CSSProperties
        }
      >
        <div
          className="garden-grid relative mx-auto"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${GRID_COLS}, ${CELL_SIZE}px)`,
            gridTemplateRows: `repeat(${GRID_ROWS}, ${CELL_SIZE}px)`,
            gap: '4px'
          }}
        >
          {Array.from({ length: GRID_ROWS * GRID_COLS }).map((_, index) => {
            const gridX = index % GRID_COLS
            const gridY = Math.floor(index / GRID_COLS)
            const key = `${gridX},${gridY}`
            const land = landMap.get(key)
            const flower = gridMap.get(key)
            const decoration = decorationMap.get(key)
            const isUnlocked = land?.unlocked ?? false
            const isSprouting = flower ? sproutingIds.has(flower.id) : false
            const canPlaceDecoration = isDecorationMode && isUnlocked && !flower && !decoration
            const canMoveDecoration = isMovingMode && isUnlocked && !flower && !decoration
            const isDecorationBeingMoved = movingDecoration && decoration && decoration.id === movingDecoration.id

            return (
              <div
                key={key}
                className={[
                  'land-cell relative rounded-[2px] border-2 transition-all',
                  isUnlocked
                    ? 'border-[var(--border-primary)] bg-[#8b7355]'
                    : 'border-dashed border-[var(--border-primary)] bg-[#4a4a4a] opacity-40',
                  activeTool === 'unlock' && !isUnlocked
                    ? 'cursor-pointer hover:border-orange-500 hover:opacity-70'
                    : '',
                  isPlantingMode && isUnlocked && !flower && !decoration
                    ? 'cursor-pointer hover:border-green-500 hover:bg-[#6d8b55]'
                    : '',
                  canPlaceDecoration
                    ? 'cursor-pointer hover:border-amber-500 hover:bg-[#a08855]'
                    : '',
                  canMoveDecoration
                    ? 'cursor-pointer hover:border-blue-500 hover:bg-[#7088a5]'
                    : '',
                  (activeTool !== 'none' || onSelectFlower) && flower ? 'cursor-pointer' : ''
                ].join(' ')}
                style={{
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  backgroundImage: isUnlocked
                    ? 'repeating-linear-gradient(0deg, #6d5a44 0px, #6d5a44 2px, #8b7355 2px, #8b7355 4px)'
                    : undefined
                }}
                onClick={() => {
                  if (isPlantingMode && isUnlocked && !flower && !decoration) {
                    handleLandClick(gridX, gridY, false, false, true)
                  } else if (canMoveDecoration) {
                    handleLandClick(gridX, gridY, false, false, true)
                  } else if (canPlaceDecoration) {
                    handleLandClick(gridX, gridY, false, false, true)
                  } else if (!isUnlocked && activeTool === 'unlock') {
                    handleLandClick(gridX, gridY, false, false, false)
                  } else if (flower && (activeTool === 'water' || activeTool === 'pick')) {
                    handleFlowerClick(flower.id)
                  } else if (
                    flower &&
                    activeTool === 'none' &&
                    !isPlantingMode &&
                    !isDecorationMode &&
                    !isMovingMode
                  ) {
                    onSelectFlower?.(flower)
                  }
                }}
              >
                {!isUnlocked && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl opacity-50">🔒</span>
                  </div>
                )}

                {isPlantingMode && isUnlocked && !flower && !decoration && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl opacity-60 animate-pulse">🌱</span>
                  </div>
                )}

                {canPlaceDecoration && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl opacity-60 animate-pulse">✨</span>
                  </div>
                )}

                {canMoveDecoration && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl opacity-60 animate-pulse">📍</span>
                  </div>
                )}

                {decoration && isUnlocked && (
                  <div
                    className={[
                      'absolute inset-0 flex items-center justify-center transition-all',
                      isDecorationBeingMoved ? 'opacity-50 animate-pulse' : '',
                      !isMovingMode && !isPlantingMode && !isDecorationMode && activeTool === 'none'
                        ? 'cursor-pointer hover:scale-110'
                        : ''
                    ].join(' ')}
                    onClick={(e) => {
                      if (!isMovingMode && !isPlantingMode && !isDecorationMode && activeTool === 'none') {
                        e.stopPropagation()
                        handleDecorationClick(decoration)
                      }
                    }}
                  >
                    <span className="text-3xl drop-shadow-md">
                      {getDecorationDefinition(decoration.type).emoji}
                    </span>
                  </div>
                )}

                {/* 花朵 */}
                {flower && isUnlocked && (
                  <div
                    className={[
                      'flower-in-grid absolute inset-0 flex flex-col items-center justify-center gap-1 p-1',
                      isSprouting ? 'garden-card--sprouting' : '',
                      splashId === flower.id ? 'garden-card--water-splash' : '',
                      flower.rarity === 'shiny' ? 'flower-rarity-shiny' : '',
                      flower.rarity === 'stellar' ? 'flower-rarity-stellar' : '',
                      flower.rarity === 'legendary' ? 'flower-rarity-legendary' : ''
                    ].join(' ')}
                  >
                    <div className="garden-flower relative h-8 w-8">
                      <span className="garden-glow absolute inset-x-1 bottom-0 h-2 rounded-full bg-emerald-400/30 blur-sm" />
                      <img
                        alt={`flower-${flower.id}`}
                        className="garden-sprite garden-bloom absolute left-1/2 top-0 h-7 w-7 -translate-x-1/2"
                        src={getFlowerAssetByType(flower.flowerType).textureUrl}
                      />
                    </div>
                    <span className="text-[9px] text-[var(--text-muted)]">
                      {getGrowthStageLabel(flower.growthStage)}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default GridGardenView
