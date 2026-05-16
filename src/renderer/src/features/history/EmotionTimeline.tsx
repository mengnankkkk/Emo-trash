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

function getIntensityLabel(value?: string): string | null {
  if (value === 'mild') {
    return '轻微'
  }

  if (value === 'moderate') {
    return '中等'
  }

  if (value === 'strong') {
    return '强烈'
  }

  return null
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
        const analysis = item.analysis
        const intensityLabel = getIntensityLabel(analysis?.emotionIntensity)

        return (
          <article
            key={item.id}
            data-timeline-item-id={item.id}
            className="rounded-3xl border border-white/10 bg-black/20 px-4 py-4"
          >
            <div className="flex items-start justify-between gap-4">
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
            </div>

            {analysis ? (
              <div className="mt-4 grid gap-3 md:grid-cols-[0.82fr_1.18fr]">
                <div className="space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">触发场景</p>
                    <p className="mt-2 text-sm font-semibold text-white">{analysis.triggerScene}</p>
                    <p className="mt-1 text-xs text-white/45">
                      {intensityLabel ? `${intensityLabel}强度` : '已记录'} · {analysis.timeContextLabel}
                    </p>
                  </div>

                  {analysis.suggestedLabels.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {analysis.suggestedLabels.map((label) => (
                        <span
                          key={`${item.id}-${label}`}
                          className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-white/70"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="rounded-2xl border border-rose-300/15 bg-rose-400/10 px-3 py-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-rose-100/70">引导问题</p>
                  <p className="mt-2 text-sm leading-6 text-rose-50">
                    {analysis.guidanceQuestion}
                  </p>
                </div>
              </div>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}

export default EmotionTimeline
