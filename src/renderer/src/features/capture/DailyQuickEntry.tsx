import { getFlowerAssetByTag } from '../../lib/flowerAssets'
import { emotionTagValues, type EmotionTag } from '../../../../shared/emotionMeta'

interface DailyQuickEntryProps {
  onSelect: (emotionTag: EmotionTag) => void
  onSkip: () => void
}

function DailyQuickEntry({ onSelect, onSkip }: DailyQuickEntryProps): React.JSX.Element {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="daily-quick-entry flex flex-col items-center gap-6 rounded-[2rem] border border-white/10 bg-black/85 px-8 py-8 shadow-2xl shadow-black/40 backdrop-blur-md">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-xs uppercase tracking-[0.28em] text-white/35">今日心情</p>
          <h2 className="text-xl font-semibold text-white">现在感觉怎么样？</h2>
          <p className="max-w-64 text-xs leading-5 text-white/40">
            点一下就好，不用写字。
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {emotionTagValues.map((tag) => {
            const asset = getFlowerAssetByTag(tag)
            return (
              <button
                key={tag}
                type="button"
                onClick={() => onSelect(tag)}
                className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 transition hover:border-white/20 hover:bg-white/[0.06]"
              >
                <img
                  alt={asset.displayName}
                  className="garden-sprite h-8 w-8"
                  src={asset.textureUrl}
                />
                <span className="text-xs font-medium text-white/70">{asset.displayName}</span>
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={onSkip}
          className="text-xs text-white/35 transition hover:text-white/55"
        >
          跳过，我想自己写
        </button>
      </div>
    </div>
  )
}

export default DailyQuickEntry
