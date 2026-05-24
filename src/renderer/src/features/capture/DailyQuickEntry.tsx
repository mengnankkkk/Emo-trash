import { getFlowerAssetByTag } from '../../lib/flowerAssets'
import { emotionTagValues, type EmotionTag } from '../../../../shared/emotionMeta'

interface DailyQuickEntryProps {
  onSelect: (emotionTag: EmotionTag) => void
  onSkip: () => void
}

function DailyQuickEntry({ onSelect, onSkip }: DailyQuickEntryProps): React.JSX.Element {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-overlay)] backdrop-blur-sm">
      <div className="daily-quick-entry flex flex-col items-center gap-6 rounded-[4px] border-3 border-[var(--border-primary)] bg-[var(--bg-panel)] px-8 py-8 shadow-[4px_4px_0_var(--pixel-shadow)]">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--text-muted)]">今日心情</p>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">现在感觉怎么样？</h2>
          <p className="max-w-64 text-xs leading-5 text-[var(--text-secondary)]">
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
                className="flex flex-col items-center gap-2 rounded-[4px] border-2 border-[var(--border-primary)] bg-[var(--bg-surface)] px-4 py-3 transition hover:border-[var(--border-strong)] hover:bg-[var(--bg-base)]"
              >
                <img
                  alt={asset.displayName}
                  className="garden-sprite h-8 w-8"
                  src={asset.textureUrl}
                />
                <span className="text-xs font-medium text-[var(--text-secondary)]">{asset.displayName}</span>
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={onSkip}
          className="text-xs text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
        >
          跳过，我想自己写
        </button>
      </div>
    </div>
  )
}

export default DailyQuickEntry
