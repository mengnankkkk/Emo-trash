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
    <div className="recap-card flex flex-col items-center gap-5 rounded-[2rem] border border-white/10 bg-black/80 px-8 py-10 shadow-2xl shadow-black/40 backdrop-blur-md">
      <div className="relative flex items-center justify-center">
        <span
          className="absolute h-20 w-20 rounded-full blur-xl"
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
        <p className="max-w-56 text-sm leading-relaxed text-white/55">
          {intensityPoetry[intensity]}
        </p>
      </div>

      {currentStreak > 0 && (
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs tracking-[0.16em] text-emerald-200/70">
          连续 {currentStreak} 天
        </span>
      )}

      <button
        type="button"
        onClick={onDismiss}
        className="pixel-btn mt-2 bg-white/[0.06] text-white/70 hover:text-white"
      >
        继续
      </button>
    </div>
  )
}

export default RecapCard
