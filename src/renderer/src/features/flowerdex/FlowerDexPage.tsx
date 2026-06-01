import { useMemo, useState } from 'react'
import type { DecorationType, FlowerDexEntry, FlowerDexSummary } from '../../types/emotion'
import type { EmotionTag } from '../../../../shared/emotionMeta'
import { emotionDefinitions } from '../../../../shared/emotionMeta'
import { rarityDefinitions, rarityValues } from '../../../../shared/rarity'
import { buildDexFlowerTexture } from '../../lib/flowerAssets'
import { DecorationShop } from '../decoration/DecorationPanel'

type DexTab = 'flowers' | 'decorations'

interface FlowerDexPageProps {
  summary: FlowerDexSummary | null
  loading: boolean
  balance: number
  activeDecoration: DecorationType | null
  onPurchaseDecoration: (type: DecorationType) => Promise<void>
  onSelectDecoration: (type: DecorationType) => void
}

function DexCell({ entry }: { entry: FlowerDexEntry }): React.JSX.Element {
  const emotionDef = emotionDefinitions.find((item) => item.emotionTag === entry.emotionTag)
  const rarityDef = rarityDefinitions[entry.rarity]

  if (!entry.unlocked) {
    const isLegendary = entry.rarity === 'legendary'
    return (
      <div
        className="dex-cell--locked flex flex-col items-center justify-center gap-1 rounded-[2px] border-2 border-dashed border-[var(--border-primary)] bg-[var(--bg-surface)] p-3 opacity-40"
        title={isLegendary ? '???' : `${emotionDef?.displayName ?? ''} · ${rarityDef.label}`}
      >
        <div className="flex h-8 w-8 items-center justify-center">
          <span className="text-xl opacity-50">{isLegendary ? '✶' : '□'}</span>
        </div>
        <span className="text-[9px] font-medium text-[var(--text-muted)]">
          {isLegendary ? '???' : rarityDef.label}
        </span>
      </div>
    )
  }

  const textureUrl = buildDexFlowerTexture(entry.emotionTag as EmotionTag, entry.rarity)
  const rarityClass =
    entry.rarity === 'shiny'
      ? 'flower-rarity-shiny'
      : entry.rarity === 'stellar'
        ? 'flower-rarity-stellar'
        : entry.rarity === 'legendary'
          ? 'flower-rarity-legendary'
          : ''

  return (
    <div
      className={[
        'dex-cell flex flex-col items-center justify-center gap-1 rounded-[2px] border-2 p-3 transition-transform hover:translate-y-[-2px]',
        rarityClass
      ].join(' ')}
      style={{
        borderColor: rarityDef.color,
        background: `linear-gradient(135deg, var(--bg-panel) 0%, color-mix(in srgb, ${rarityDef.color} 8%, var(--bg-panel)) 100%)`,
        boxShadow: `3px 3px 0 color-mix(in srgb, ${rarityDef.color} 30%, transparent)`
      }}
      title={`${emotionDef?.displayName ?? ''} · ${rarityDef.label}\n首次: ${entry.firstSeenAt?.split(' ')[0] ?? ''}\n累计: ${entry.totalCount}`}
    >
      <img
        alt={`${emotionDef?.displayName}-${rarityDef.label}`}
        src={textureUrl}
        className="garden-sprite h-8 w-8"
        style={{ imageRendering: 'pixelated' }}
      />
      <span className="text-[9px] font-bold" style={{ color: rarityDef.color }}>
        {rarityDef.label}
      </span>
      <span className="text-[8px] text-[var(--text-muted)]">x{entry.totalCount}</span>
    </div>
  )
}

function FlowerDexPage({
  summary,
  loading,
  balance,
  activeDecoration,
  onPurchaseDecoration,
  onSelectDecoration
}: FlowerDexPageProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<DexTab>('flowers')

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
    <section className="pixel-panel pixel-panel--purple flex flex-col gap-5 p-5">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('flowers')}
          className={[
            'pixel-btn text-[11px]',
            activeTab === 'flowers'
              ? '!border-[var(--accent-emerald)] !text-[var(--accent-emerald)]'
              : ''
          ].join(' ')}
        >
          <span aria-hidden="true">✿</span> 花朵图鉴
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('decorations')}
          className={[
            'pixel-btn text-[11px]',
            activeTab === 'decorations'
              ? '!border-[var(--accent-emerald)] !text-[var(--accent-emerald)]'
              : ''
          ].join(' ')}
        >
          <span aria-hidden="true">▣</span> 装饰收藏
        </button>
      </div>

      {activeTab === 'flowers' && (
        <>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--text-muted)]">花朵图鉴</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                已收集 {summary.unlockedCount} / {summary.totalSlots}
              </h2>
            </div>
            <div className="rounded-[2px] border-2 border-[var(--accent-emerald)] bg-[color-mix(in_srgb,var(--accent-emerald)_10%,var(--bg-panel))] px-3 py-1 text-xs font-bold tracking-[0.18em] text-[var(--accent-emerald)]">
              {unlockedPercent}%
            </div>
          </div>

          <div className="pixel-progress">
            <div
              className="pixel-progress-fill"
              style={{
                width: `${unlockedPercent}%`,
                background: 'linear-gradient(90deg, #00bcd4, #9c27b0, #ff6f00)'
              }}
            />
          </div>

          <div className="flex flex-wrap gap-3 text-[10px] text-[var(--text-muted)]">
            {rarityValues.map((rarity) => (
              <span key={rarity} className="flex items-center gap-1">
                <span
                  className="inline-block h-2 w-2 rounded-[1px] border border-[var(--border-primary)]"
                  style={{ backgroundColor: rarityDefinitions[rarity].color }}
                />
                {rarityDefinitions[rarity].label}
              </span>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            {emotionDefinitions.map((emotionDef) => {
              const entries = groupedByEmotion[emotionDef.emotionTag] ?? []
              const rowUnlocked = entries.filter((entry) => entry.unlocked).length

              return (
                <div key={emotionDef.emotionTag} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 border-b-2 border-dashed border-[var(--border-primary)] pb-1">
                    <span
                      className="inline-block h-3 w-3 rounded-[1px] border-2"
                      style={{
                        backgroundColor: emotionDef.colorHex,
                        borderColor: emotionDef.colorHex
                      }}
                    />
                    <span className="text-xs font-bold tracking-[0.1em] text-[var(--text-primary)]">
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
        </>
      )}

      {activeTab === 'decorations' && (
        <DecorationShop
          balance={balance}
          onPurchase={onPurchaseDecoration}
          onPlace={onSelectDecoration}
          activeDecoration={activeDecoration}
        />
      )}
    </section>
  )
}

export default FlowerDexPage
