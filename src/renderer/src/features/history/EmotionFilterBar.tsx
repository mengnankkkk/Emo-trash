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
              'flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition',
              selected
                ? 'border-rose-300 bg-rose-400/15 text-rose-100'
                : 'border-white/10 bg-black/20 text-white/60 hover:text-white'
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
