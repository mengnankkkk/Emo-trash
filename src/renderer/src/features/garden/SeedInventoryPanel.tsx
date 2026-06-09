import { useMemo, useState } from 'react'
import type { EmotionTag, FlowerRarity, SeedInventoryItem } from '../../types/emotion'
import { getFlowerAssetByTag, getFlowerAssets } from '../../lib/flowerAssets'
import { canComposeSeed } from '../../../../shared/rewardRules'
import { getRarityDefinition, rarityValues } from '../../../../shared/rarity'

interface SeedInventoryPanelProps {
  seeds: SeedInventoryItem[]
  activeSeed: { emotionTag: EmotionTag; rarity: FlowerRarity } | null
  onSelectSeed: (emotionTag: EmotionTag, rarity: FlowerRarity) => void
  onDeselectSeed: () => void
  onComposeSeed: (emotionTag: EmotionTag) => void
  onRecycleSeed: (emotionTag: EmotionTag, rarity: FlowerRarity) => void
}

export function SeedInventoryPanel({
  seeds,
  activeSeed,
  onSelectSeed,
  onDeselectSeed,
  onComposeSeed,
  onRecycleSeed
}: SeedInventoryPanelProps): React.JSX.Element {
  const [emotionFilter, setEmotionFilter] = useState<EmotionTag | 'all'>('all')
  const [rarityFilter, setRarityFilter] = useState<FlowerRarity | 'all'>('all')
  const totalSeeds = useMemo(() => seeds.reduce((sum, item) => sum + item.quantity, 0), [seeds])
  const flowerAssets = useMemo(() => getFlowerAssets(), [])
  const filteredSeeds = useMemo(() => {
    return seeds.filter((seed) => {
      const emotionMatched = emotionFilter === 'all' || seed.emotionTag === emotionFilter
      const rarityMatched = rarityFilter === 'all' || seed.rarity === rarityFilter
      return emotionMatched && rarityMatched
    })
  }, [emotionFilter, rarityFilter, seeds])

  if (seeds.length === 0) {
    return (
      <div className="rounded-[4px] border-2 border-dashed border-[var(--border-primary)] bg-[var(--bg-surface)] p-4 text-center">
        <p className="text-sm text-[var(--text-muted)]">
          背包里还没有种子，先去释放情绪或签到拿到种子吧。
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.28em] text-[var(--text-muted)]">种子背包</span>
        <span className="text-xs text-[var(--text-secondary)]">共 {totalSeeds} 颗种子</span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
          情绪筛选
          <select
            value={emotionFilter}
            onChange={(event) => setEmotionFilter(event.target.value as EmotionTag | 'all')}
            className="rounded-[2px] border-2 border-[var(--border-primary)] bg-[var(--bg-panel)] px-2 py-1 text-xs normal-case tracking-normal text-[var(--text-primary)]"
          >
            <option value="all">全部情绪</option>
            {flowerAssets.map((asset) => (
              <option key={asset.emotionTag} value={asset.emotionTag}>
                {asset.displayName}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
          稀有度筛选
          <select
            value={rarityFilter}
            onChange={(event) => setRarityFilter(event.target.value as FlowerRarity | 'all')}
            className="rounded-[2px] border-2 border-[var(--border-primary)] bg-[var(--bg-panel)] px-2 py-1 text-xs normal-case tracking-normal text-[var(--text-primary)]"
          >
            <option value="all">全部稀有度</option>
            {rarityValues.map((rarity) => (
              <option key={rarity} value={rarity}>
                {getRarityDefinition(rarity).label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {activeSeed && (
        <div className="rounded-[4px] border-2 border-[var(--accent-emerald)] bg-[color-mix(in_srgb,var(--accent-emerald)_10%,var(--bg-surface))] p-3 text-center">
          <p className="text-xs text-[var(--accent-emerald)]">
            已选择种子，点击花园里的空地即可播种。
          </p>
          <button
            type="button"
            onClick={onDeselectSeed}
            className="mt-2 rounded-[2px] border-2 border-[var(--border-primary)] bg-[var(--bg-panel)] px-3 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"
          >
            取消选择
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
        {filteredSeeds.map((seed) => {
          const emotionTag = seed.emotionTag
          const seedRarity = seed.rarity
          const asset = getFlowerAssetByTag(emotionTag)
          const rarity = getRarityDefinition(seedRarity)
          const isActive =
            activeSeed?.emotionTag === emotionTag && activeSeed?.rarity === seedRarity
          const canCompose = seedRarity === 'common' && canComposeSeed(seed.quantity)

          return (
            <article
              key={`${emotionTag}-${seedRarity}`}
              className={[
                'flex flex-col items-center gap-1 rounded-[4px] border-2 p-2 transition-all',
                isActive
                  ? 'border-[var(--accent-emerald)] bg-[color-mix(in_srgb,var(--accent-emerald)_15%,var(--bg-panel))]'
                  : 'border-[var(--border-primary)] bg-[var(--bg-panel)] hover:border-[var(--accent-emerald)]'
              ].join(' ')}
            >
              <button
                type="button"
                onClick={() => {
                  if (isActive) {
                    onDeselectSeed()
                  } else {
                    onSelectSeed(emotionTag, seedRarity)
                  }
                }}
                className="flex w-full flex-col items-center gap-1"
              >
                <img
                  alt={asset.displayName}
                  className="garden-sprite h-6 w-6"
                  src={asset.textureUrl}
                />
                <span className="text-[10px] font-medium text-[var(--text-secondary)]">
                  {asset.displayName}
                </span>
                <span className="rounded-full bg-[var(--bg-surface)] px-2 py-0.5 text-[9px] font-bold text-[var(--text-primary)]">
                  x{seed.quantity}
                </span>
                <span className="text-[8px] font-bold" style={{ color: rarity.color }}>
                  {rarity.label}
                </span>
              </button>

              {canCompose && (
                <button
                  type="button"
                  onClick={() => onComposeSeed(emotionTag)}
                  className="mt-1 rounded-[2px] border-2 border-[var(--accent-cyan)] bg-[color-mix(in_srgb,var(--accent-cyan)_10%,var(--bg-panel))] px-2 py-0.5 text-[9px] font-bold text-[var(--accent-cyan)]"
                >
                  合成闪光
                </button>
              )}

              <button
                type="button"
                onClick={() => onRecycleSeed(emotionTag, seedRarity)}
                className="rounded-[2px] border-2 border-[var(--accent-amber)] bg-[color-mix(in_srgb,var(--accent-amber)_10%,var(--bg-panel))] px-2 py-0.5 text-[9px] font-bold text-[var(--accent-amber)]"
              >
                回收
              </button>
            </article>
          )
        })}
      </div>

      {filteredSeeds.length === 0 && (
        <div className="rounded-[4px] border-2 border-dashed border-[var(--border-primary)] bg-[var(--bg-surface)] p-4 text-center text-sm text-[var(--text-muted)]">
          当前筛选下没有种子。
        </div>
      )}
    </div>
  )
}
