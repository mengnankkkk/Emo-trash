import { getFlowerAssets } from '../../lib/flowerAssets'
import type { EmotionTag } from '../../types/emotion'

interface EmotionFilterBarProps {
  selectedTags: EmotionTag[]
  onChange: (nextTags: EmotionTag[]) => void
}

function EmotionFilterBar({ selectedTags, onChange }: EmotionFilterBarProps): React.JSX.Element {
  const assets = getFlowerAssets()

  function toggleTag(tag: EmotionTag): void {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((item) => item !== tag))
      return
    }

    onChange([...selectedTags, tag])
  }

  return (
    <div className="flex flex-wrap gap-2">
      {assets.map((asset) => {
        const selected = selectedTags.includes(asset.emotionTag)
        return (
          <button
            key={asset.emotionTag}
            type="button"
            data-emotion-filter={asset.emotionTag}
            data-selected={selected ? 'true' : 'false'}
            onClick={() => toggleTag(asset.emotionTag)}
            className={[
              'flex items-center gap-2 rounded-[2px] border-2 px-3 py-2 text-xs font-semibold transition',
              selected
                ? 'border-[var(--accent-purple)] bg-[color-mix(in_srgb,var(--accent-purple)_12%,var(--bg-panel))] text-[var(--accent-purple)]'
                : 'border-[var(--border-primary)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            ].join(' ')}
          >
            <img alt={asset.displayName} className="garden-sprite h-4 w-4" src={asset.textureUrl} />
            <span>{asset.displayName}</span>
          </button>
        )
      })}
    </div>
  )
}

export default EmotionFilterBar
