import { useCallback, useEffect, useState } from 'react'
import type { DecorationStatus, DecorationSummary, DecorationType } from '../../../../preload/api'
import { getDecorationDefinition } from '../../../../shared/gardenDecoration'
import { getRuntimeApi } from '../../lib/runtimeApi'

interface DecorationShopProps {
  balance: number
  onPurchase: (type: DecorationType) => Promise<void>
  onPlace: (type: DecorationType) => void
  activeDecoration: DecorationType | null
}

const decorationPixelIcon: Record<string, string> = {
  stone: '▣',
  fence: '▥',
  fountain: '◉',
  'rainbow-gate': '▤',
  'wind-chime': '✦',
  lantern: '◌',
  bench: '▬',
  statue: '◈'
}

export function DecorationShop({
  balance,
  onPurchase,
  onPlace,
  activeDecoration
}: DecorationShopProps): React.JSX.Element {
  const [summary, setSummary] = useState<DecorationSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const loadSummary = useCallback(async () => {
    try {
      const data = await getRuntimeApi().getDecorationSummary()
      setSummary(data)
    } catch (error) {
      console.error('加载装饰系统失败:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSummary()
  }, [loadSummary])

  if (loading || !summary) {
    return (
      <div className="rounded-[2px] border-2 border-dashed border-[var(--border-primary)] bg-[var(--bg-surface)] p-4 text-center text-sm text-[var(--text-muted)]">
        正在加载装饰收藏…
      </div>
    )
  }

  const ownedPercent = Math.round((summary.unlockedCount / summary.totalDecorations) * 100)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.28em] text-[var(--text-muted)]">装饰收藏</span>
        <div className="rounded-[2px] border-2 border-[var(--accent-amber)] bg-[color-mix(in_srgb,var(--accent-amber)_10%,var(--bg-panel))] px-2 py-0.5 text-[10px] font-bold tracking-[0.18em] text-[var(--accent-amber)]">
          {summary.unlockedCount}/{summary.totalDecorations}
        </div>
      </div>

      <div className="pixel-progress">
        <div
          className="pixel-progress-fill"
          style={{
            width: `${ownedPercent}%`,
            background: 'linear-gradient(90deg, #06b6d4, #a855f7, #f59e0b)'
          }}
        />
      </div>

      {activeDecoration && (
        <div
          className="rounded-[2px] border-2 border-[var(--accent-amber)] bg-[color-mix(in_srgb,var(--accent-amber)_10%,var(--bg-panel))] p-2 text-center text-[11px] font-bold tracking-[0.1em] text-[var(--accent-amber)]"
          style={{ boxShadow: '2px 2px 0 color-mix(in srgb, var(--accent-amber) 30%, transparent)' }}
        >
          已选择装饰物，回到花园点击空地即可放置。
        </div>
      )}

      {summary.placedCount > 0 && (
        <div
          className="rounded-[2px] border-2 border-[var(--border-primary)] bg-[var(--bg-panel)] p-2"
          style={{ boxShadow: '2px 2px 0 var(--pixel-shadow)' }}
        >
          <div className="mb-1 text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
            当前加成
          </div>
          <div className="flex flex-wrap gap-2 text-[10px]">
            {summary.activeBonus.wateringBonus > 0 && (
              <span className="rounded-[2px] border-2 border-[#0277bd] bg-[color-mix(in_srgb,#0277bd_10%,transparent)] px-2 py-0.5 text-[#0277bd]">
                水滴 +{summary.activeBonus.wateringBonus}
              </span>
            )}
            {summary.activeBonus.rarityBonus > 0 && (
              <span className="rounded-[2px] border-2 border-[#9c27b0] bg-[color-mix(in_srgb,#9c27b0_10%,transparent)] px-2 py-0.5 text-[#9c27b0]">
                稀有 +{(summary.activeBonus.rarityBonus * 100).toFixed(0)}%
              </span>
            )}
            {summary.activeBonus.growthBonus > 0 && (
              <span className="rounded-[2px] border-2 border-[#2e7d32] bg-[color-mix(in_srgb,#2e7d32_10%,transparent)] px-2 py-0.5 text-[#2e7d32]">
                生长 +{(summary.activeBonus.growthBonus * 100).toFixed(0)}%
              </span>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {summary.decorations.map((decoration) => (
          <DecorationShopCard
            key={decoration.type}
            decoration={decoration}
            balance={balance}
            isActive={activeDecoration === decoration.type}
            onPurchase={async () => {
              await onPurchase(decoration.type as DecorationType)
              await loadSummary()
            }}
            onPlace={() => onPlace(decoration.type as DecorationType)}
          />
        ))}
      </div>
    </div>
  )
}

function DecorationShopCard({
  decoration,
  balance,
  isActive,
  onPurchase,
  onPlace
}: {
  decoration: DecorationStatus
  balance: number
  isActive: boolean
  onPurchase: () => Promise<void>
  onPlace: () => void
}): React.JSX.Element {
  const price = getDecorationDefinition(decoration.type).price
  const canAfford = balance >= price
  const isLocked = !decoration.unlocked && !decoration.owned
  const missingCoins = Math.max(0, price - balance)
  const progressPercent =
    decoration.unlockTarget > 0
      ? Math.round((decoration.unlockProgress / decoration.unlockTarget) * 100)
      : 0
  const buttonLabel = decoration.owned
    ? '放置'
    : isLocked
      ? decoration.unlockHint
      : canAfford
        ? `购买 G ${price}`
        : `还差 ${missingCoins} 金币`

  return (
    <div
      className={[
        'flex flex-col items-center gap-1 rounded-[2px] border-2 p-2 transition-transform hover:translate-y-[-2px]',
        isActive ? 'border-[var(--accent-amber)]' : '',
        !isActive && decoration.owned ? 'border-[var(--accent-emerald)]' : '',
        !isActive && !decoration.owned ? 'border-[var(--border-primary)]' : ''
      ].join(' ')}
      style={{
        background: isActive
          ? 'color-mix(in srgb, var(--accent-amber) 12%, var(--bg-panel))'
          : decoration.owned
            ? 'color-mix(in srgb, var(--accent-emerald) 6%, var(--bg-panel))'
            : 'var(--bg-panel)',
        boxShadow: isActive
          ? '3px 3px 0 color-mix(in srgb, var(--accent-amber) 40%, transparent)'
          : decoration.owned
            ? '2px 2px 0 color-mix(in srgb, var(--accent-emerald) 30%, transparent)'
            : '2px 2px 0 var(--pixel-shadow)',
        opacity: isLocked ? 0.5 : 1
      }}
    >
      <span
        className="flex h-9 w-9 items-center justify-center rounded-[2px] border-2 border-[var(--border-primary)] bg-[var(--bg-surface)] text-lg font-bold"
        aria-hidden="true"
      >
        {isLocked ? '□' : (decorationPixelIcon[decoration.type] ?? '▣')}
      </span>
      <span className="text-[10px] font-bold tracking-[0.05em] text-[var(--text-primary)]">
        {decoration.label}
      </span>
      <p className="min-h-8 text-center text-[9px] leading-4 text-[var(--text-muted)]">
        {decoration.unlockLabel}
      </p>
      {!decoration.unlocked && (
        <div className="w-full space-y-1">
          <div className="flex items-center justify-between text-[8px] text-[var(--text-muted)]">
            <span>{decoration.unlockHint}</span>
            <span>
              {decoration.unlockProgress}/{decoration.unlockTarget} {decoration.unlockUnit}
            </span>
          </div>
          <div className="pixel-progress !h-2">
            <div
              className="pixel-progress-fill bg-[var(--border-primary)]"
              style={{ width: `${Math.min(100, progressPercent)}%` }}
            />
          </div>
        </div>
      )}
      {decoration.unlocked && !decoration.owned && (
        <span className="text-[9px] font-semibold text-[var(--accent-emerald)]">已解锁</span>
      )}

      {decoration.owned ? (
        <button
          type="button"
          onClick={onPlace}
          className="mt-1 rounded-[2px] border-2 border-[var(--accent-emerald)] bg-transparent px-2 py-0.5 text-[9px] font-bold tracking-[0.08em] text-[var(--accent-emerald)] transition-transform hover:translate-y-[-1px]"
          style={{ boxShadow: '2px 2px 0 color-mix(in srgb, var(--accent-emerald) 40%, transparent)' }}
        >
          {buttonLabel}
        </button>
      ) : (
        <button
          type="button"
          onClick={onPurchase}
          disabled={!canAfford || isLocked}
          className={[
            'mt-1 rounded-[2px] border-2 px-2 py-0.5 text-[9px] font-bold tracking-[0.08em] transition-transform',
            canAfford && !isLocked
              ? 'border-[var(--accent-amber)] text-[var(--accent-amber)] hover:translate-y-[-1px]'
              : 'border-[var(--border-primary)] text-[var(--text-muted)]'
          ].join(' ')}
          style={{
            boxShadow:
              canAfford && !isLocked
                ? '2px 2px 0 color-mix(in srgb, var(--accent-amber) 40%, transparent)'
                : '1px 1px 0 var(--pixel-shadow)'
          }}
        >
          {buttonLabel}
        </button>
      )}
    </div>
  )
}
