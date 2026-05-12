import { getFlowerAssetByTag } from '../../lib/flowerAssets'
import type { EmotionTimelineEntry } from '../../types/emotion'

interface EmotionTimelineProps {
  items: EmotionTimelineEntry[]
  selectedDate: string | null
}

function getGrowthStageLabel(growthStage: number): string {
  if (growthStage === 1) {
    return '发芽'
  }

  if (growthStage === 2) {
    return '开花'
  }

  return '盛放'
}

function EmotionTimeline({ items, selectedDate }: EmotionTimelineProps): React.JSX.Element {
  if (items.length === 0) {
    return (
      <div className="flex min-h-36 items-center justify-center rounded-3xl border border-dashed border-white/10 bg-black/15 px-4 py-8 text-center text-sm text-white/35">
        {selectedDate ? '这一天没有符合筛选条件的情绪释放记录。' : '还没有可展示的时间轴记录。'}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const asset = getFlowerAssetByTag(item.emotionTag)
        return (
          <article
            key={item.id}
            data-timeline-item-id={item.id}
            className="flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-black/20 px-4 py-4"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2">
                <img
                  alt={asset.displayName}
                  className="garden-sprite h-7 w-7"
                  src={asset.textureUrl}
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{asset.displayName}</p>
                <p className="mt-1 text-xs text-white/45">
                  {item.timestamp} · {getGrowthStageLabel(item.growthStage)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span
                className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-white/70"
                style={{ background: `${asset.colorHex}22` }}
              >
                #{item.id}
              </span>
            </div>
          </article>
        )
      })}
    </div>
  )
}

export default EmotionTimeline
