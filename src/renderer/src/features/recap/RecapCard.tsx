import { getFlowerAssetByTag } from '../../lib/flowerAssets'
import type { EmotionTag } from '../../../../shared/emotionMeta'
import type { EmotionIntensity } from '../../types/emotion'

interface RecapCardProps {
  emotionTag: EmotionTag
  intensity: EmotionIntensity
  currentStreak: number
  onDismiss: () => void
}

const intensityPoetry: Record<EmotionIntensity, string> = {
  mild: '一阵轻微的涟漪，已经散去。',
  moderate: '一股不小的浪潮，已经退去。',
  strong: '一场猛烈的风暴，已经平息。'
}

function RecapCard({ emotionTag, intensity, currentStreak, onDismiss }: RecapCardProps): React.JSX.Element {
  const asset = getFlowerAssetByTag(emotionTag)

  return (
    <div className="recap-card flex flex-col items-center gap-5 rounded-[4px] border-3 border-[var(--border-primary)] bg-[var(--bg-panel)] px-8 py-10 shadow-[4px_4px_0_var(--pixel-shadow)]">
      <div className="relative flex items-center justify-center">
        <span
          className="absolute h-20 w-20 rounded-[4px] blur-xl"
          style={{ background: asset.colorHex, opacity: 0.3 }}
        />
        <img
          alt={asset.displayName}
          className="garden-sprite relative h-14 w-14"
          src={asset.textureUrl}
        />
      </div>

      <div className="flex flex-col items-center gap-2 text-center">
        <span
          className="text-lg font-semibold"
          style={{ color: asset.colorHex }}
        >
          {asset.displayName}
        </span>
        <p className="max-w-56 text-sm leading-relaxed text-[var(--text-secondary)]">
          {intensityPoetry[intensity]}
        </p>
      </div>

      {currentStreak > 0 && (
        <span className="rounded-[2px] border-2 border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)] px-3 py-1 text-xs tracking-[0.16em] text-[var(--accent-emerald)]">
          连续 {currentStreak} 天
        </span>
      )}

      <button
        type="button"
        onClick={onDismiss}
        className="pixel-btn mt-2"
      >
        继续
      </button>
    </div>
  )
}

export default RecapCard
