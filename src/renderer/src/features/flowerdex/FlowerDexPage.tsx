import { useMemo } from 'react'
import type { FlowerDexEntry, FlowerDexSummary } from '../../types/emotion'
import { emotionDefinitions } from '../../../../shared/emotionMeta'
import { rarityDefinitions, rarityValues, type FlowerRarity } from '../../../../shared/rarity'

interface FlowerDexPageProps {
  summary: FlowerDexSummary | null
  loading: boolean
}

const rarityBorderStyles: Record<FlowerRarity, string> = {
  common: 'border-[var(--border-primary)]',
  shiny: 'border-[#00bcd4]',
  stellar: 'border-[#9c27b0]',
  legendary: 'border-[#ff6f00]'
}

const rarityGlowStyles: Record<FlowerRarity, string> = {
  common: '',
  shiny: 'shadow-[0_0_6px_rgba(0,188,212,0.3)]',
  stellar: 'shadow-[0_0_8px_rgba(156,39,176,0.4)]',
  legendary: 'shadow-[0_0_12px_rgba(255,111,0,0.5)]'
}

function DexCell({ entry }: { entry: FlowerDexEntry }): React.JSX.Element {
  const emotionDef = emotionDefinitions.find((d) => d.emotionTag === entry.emotionTag)
  const rarityDef = rarityDefinitions[entry.rarity]

  if (!entry.unlocked) {
    const isLegendary = entry.rarity === 'legendary'
    return (
      <div
        className="flex flex-col items-center justify-center gap-1 rounded-[4px] border-2 border-dashed border-[var(--border-primary)] bg-[var(--bg-surface)] p-3 opacity-50"
        title={isLegendary ? '???' : `${emotionDef?.displayName ?? ''} · ${rarityDef.label}`}
      >
        <div className="flex h-8 w-8 items-center justify-center text-base text-[var(--text-muted)]">
          {isLegendary ? '?' : '🔒'}
        </div>
        <span className="text-[9px] text-[var(--text-muted)]">
          {isLegendary ? '???' : rarityDef.label}
        </span>
      </div>
    )
  }

  return (
    <div
      className={[
        'flex flex-col items-center justify-center gap-1 rounded-[4px] border-2 p-3 transition',
        rarityBorderStyles[entry.rarity],
        rarityGlowStyles[entry.rarity],
        'bg-[var(--bg-surface)]'
      ].join(' ')}
      title={`${emotionDef?.displayName ?? ''} · ${rarityDef.label}\n首次获得: ${entry.firstSeenAt?.split(' ')[0] ?? ''}\n累计: ${entry.totalCount}`}
    >
      <div
        className="flex h-8 w-8 items-center justify-center rounded-full"
        style={{ backgroundColor: `${emotionDef?.colorHex ?? '#888'}22` }}
      >
        <div
          className="h-4 w-4 rounded-sm"
          style={{ backgroundColor: emotionDef?.colorHex ?? '#888' }}
        />
      </div>
      <span className="text-[9px] font-semibold" style={{ color: rarityDef.color }}>
        {rarityDef.label}
      </span>
      <span className="text-[8px] text-[var(--text-muted)]">×{entry.totalCount}</span>
    </div>
  )
}

function FlowerDexPage({ summary, loading }: FlowerDexPageProps): React.JSX.Element {
  const groupedByEmotion = useMemo(() => {
    if (!summary) return {}
    const groups: Record<string, FlowerDexEntry[]> = {}
    for (const entry of summary.entries) {
      if (!groups[entry.emotionTag]) {
        groups[entry.emotionTag] = []
      }
      groups[entry.emotionTag].push(entry)
    }
    return groups
  }, [summary])

  if (!summary) {
    return (
      <section className="pixel-panel flex items-center justify-center p-8 text-sm text-[var(--text-muted)]">
        {loading ? '正在加载图鉴数据…' : '暂无图鉴数据。'}
      </section>
    )
  }

  const unlockedPercent = Math.round((summary.unlockedCount / summary.totalSlots) * 100)

  return (
    <section className="pixel-panel flex flex-col gap-6 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--text-muted)]">花朵图鉴</p>
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
            已收集 {summary.unlockedCount} / {summary.totalSlots}
          </h2>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="rounded-[2px] border-2 border-[var(--accent-emerald)] bg-[color-mix(in_srgb,var(--accent-emerald)_10%,var(--bg-panel))] px-3 py-1 text-xs font-semibold tracking-[0.18em] text-[var(--accent-emerald)]">
            {unlockedPercent}% 完成
          </span>
        </div>
      </div>

      <div className="pixel-progress">
        <div
          className="pixel-progress-fill bg-gradient-to-r from-cyan-500 via-purple-400 to-amber-400"
          style={{ width: `${unlockedPercent}%` }}
        />
      </div>

      <div className="space-y-1 text-[10px] text-[var(--text-muted)]">
        <div className="flex gap-4">
          {rarityValues.map((rarity) => (
            <span key={rarity} className="flex items-center gap-1">
              <span
                className="inline-block h-2 w-2 rounded-sm"
                style={{ backgroundColor: rarityDefinitions[rarity].color }}
              />
              {rarityDefinitions[rarity].label} (
              {Math.round(rarityDefinitions[rarity].probability * 100)}%)
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {emotionDefinitions.map((emotionDef) => {
          const entries = groupedByEmotion[emotionDef.emotionTag] ?? []
          const rowUnlocked = entries.filter((e) => e.unlocked).length

          return (
            <div key={emotionDef.emotionTag} className="space-y-2">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-sm"
                  style={{ backgroundColor: emotionDef.colorHex }}
                />
                <span className="text-xs font-semibold text-[var(--text-primary)]">
                  {emotionDef.displayName}
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">{rowUnlocked}/4</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {entries.map((entry) => (
                  <DexCell key={`${entry.emotionTag}-${entry.rarity}`} entry={entry} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default FlowerDexPage
