import { getFlowerAssetByTag } from '../../lib/flowerAssets'
import type { EmotionTag } from '../../../../shared/emotionMeta'
import type { EmotionIntensity } from '../../types/emotion'
import type { FlowerRarity } from '../../../../preload/api'
import { getRarityDefinition } from '../../../../shared/rarity'

interface RecapCardProps {
  emotionTag: EmotionTag
  intensity: EmotionIntensity
  currentStreak: number
  rarity: FlowerRarity
  onDismiss: () => void
}

const intensityPoetry: Record<EmotionIntensity, string> = {
  mild: '一阵轻微的涟漪，已经散去。',
  moderate: '一股不小的浪潮，已经退去。',
  strong: '一场猛烈的风暴，已经平息。'
}

function RecapCard({
  emotionTag,
  intensity,
  currentStreak,
  rarity,
  onDismiss
}: RecapCardProps): React.JSX.Element {
  const asset = getFlowerAssetByTag(emotionTag)
  const rarityDef = getRarityDefinition(rarity)
  const isRare = rarity !== 'common'

  return (
    <div
      className={`recap-card flex flex-col items-center gap-5 rounded-[4px] border-3 bg-[var(--bg-panel)] px-8 py-10 ${isRare ? `border-[${rarityDef.color}]` : 'border-[var(--border-primary)]'}`}
      style={{ boxShadow: '4px 4px 0 var(--pixel-shadow)' }}
    >
      {isRare && (
        <div
          className="recap-rarity-banner flex items-center gap-2 rounded-[2px] border-2 px-3 py-1 text-xs font-semibold tracking-[0.2em]"
          style={{
            borderColor: rarityDef.color,
            backgroundColor: `${rarityDef.color}15`,
            color: rarityDef.color
          }}
        >
          {rarity === 'legendary' && '🌟 '}
          {rarity === 'stellar' && '⭐ '}
          {rarity === 'shiny' && '✨ '}
          {rarityDef.label}花朵
        </div>
      )}
      <div
        className={`relative flex items-center justify-center ${isRare ? 'recap-rare-glow' : ''}`}
        data-rarity={rarity}
      >
        <span
          className="absolute h-20 w-20 rounded-[4px] blur-xl"
          style={{
            background: isRare ? rarityDef.color : asset.colorHex,
            opacity: isRare ? 0.5 : 0.3
          }}
        />
        <img
          alt={asset.displayName}
          className={`garden-sprite relative h-14 w-14 ${isRare ? 'recap-rare-sprite' : ''}`}
          src={asset.textureUrl}
          data-rarity={rarity}
        />
      </div>

      <div className="flex flex-col items-center gap-2 text-center">
        <span
          className="text-lg font-semibold"
          style={{ color: isRare ? rarityDef.color : asset.colorHex }}
        >
          {asset.displayName}
        </span>
        <p className="max-w-56 text-sm leading-relaxed text-[var(--text-secondary)]">
          {intensityPoetry[intensity]}
        </p>
        {isRare && (
          <p className="max-w-64 text-xs italic leading-relaxed text-[var(--text-muted)]">
            {rarityDef.description}
          </p>
        )}
      </div>

      {currentStreak > 0 && (
        <span className="rounded-[2px] border-2 border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)] px-3 py-1 text-xs tracking-[0.16em] text-[var(--accent-emerald)]">
          连续 {currentStreak} 天
        </span>
      )}

      <button type="button" onClick={onDismiss} className="pixel-btn mt-2">
        继续
      </button>
    </div>
  )
}

export default RecapCard
