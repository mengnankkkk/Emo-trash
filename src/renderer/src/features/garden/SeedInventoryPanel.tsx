import { useMemo } from 'react'
import type { EmotionTag, SeedInventoryItem } from '../../types/emotion'
import { getFlowerAssetByTag } from '../../lib/flowerAssets'

interface SeedInventoryPanelProps {
  seeds: SeedInventoryItem[]
  activeSeed: { emotionTag: EmotionTag; rarity: string } | null
  onSelectSeed: (emotionTag: EmotionTag, rarity: string) => void
  onDeselectSeed: () => void
}

export function SeedInventoryPanel({
  seeds,
  activeSeed,
  onSelectSeed,
  onDeselectSeed
}: SeedInventoryPanelProps): React.JSX.Element {
  const totalSeeds = useMemo(() => seeds.reduce((sum, item) => sum + item.quantity, 0), [seeds])

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

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
        {seeds.map((seed) => {
          const asset = getFlowerAssetByTag(seed.emotionTag as EmotionTag)
          const isActive =
            activeSeed?.emotionTag === seed.emotionTag && activeSeed?.rarity === seed.rarity

          return (
            <button
              key={`${seed.emotionTag}-${seed.rarity}`}
              type="button"
              onClick={() => {
                if (isActive) {
                  onDeselectSeed()
                } else {
                  onSelectSeed(seed.emotionTag as EmotionTag, seed.rarity)
                }
              }}
              className={[
                'flex flex-col items-center gap-1 rounded-[4px] border-2 p-2 transition-all',
                isActive
                  ? 'border-[var(--accent-emerald)] bg-[color-mix(in_srgb,var(--accent-emerald)_15%,var(--bg-panel))]'
                  : 'border-[var(--border-primary)] bg-[var(--bg-panel)] hover:border-[var(--accent-emerald)]'
              ].join(' ')}
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
              {seed.rarity !== 'common' && (
                <span
                  className="text-[8px]"
                  style={{
                    color:
                      seed.rarity === 'shiny'
                        ? '#00bcd4'
                        : seed.rarity === 'stellar'
                          ? '#9c27b0'
                          : '#ff6f00'
                  }}
                >
                  {seed.rarity}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
