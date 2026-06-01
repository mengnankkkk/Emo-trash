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
      <div className="flex min-h-36 items-center justify-center rounded-[4px] border-2 border-dashed border-[var(--border-primary)] bg-[var(--bg-panel)] px-4 py-8 text-center text-sm text-[var(--text-muted)]">
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
            className="rounded-[4px] border-2 border-[var(--border-primary)] bg-[var(--bg-panel)] px-4 py-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-[4px] border-2 border-[var(--border-primary)] bg-[var(--bg-surface)] p-2">
                  <img
                    alt={asset.displayName}
                    className="garden-sprite h-7 w-7"
                    src={asset.textureUrl}
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {asset.displayName}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    {item.timestamp} · {getGrowthStageLabel(item.growthStage)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span
                  className="rounded-[2px] border-2 border-[var(--border-primary)] px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-[var(--text-secondary)]"
                  style={{ background: `${asset.colorHex}22` }}
                >
                  #{item.id}
                </span>
              </div>
            </div>

            {analysis ? (
              <div className="mt-4 grid gap-3 md:grid-cols-[0.82fr_1.18fr]">
                <div className="space-y-3">
                  <div className="rounded-[4px] border-2 border-[var(--border-primary)] bg-[var(--bg-surface)] px-3 py-3">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
                      触发场景
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                      {analysis.triggerScene}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                      {intensityLabel ? `${intensityLabel}强度` : '已记录'} ·{' '}
                      {analysis.timeContextLabel}
                    </p>
                  </div>

                  {analysis.suggestedLabels.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {analysis.suggestedLabels.map((label) => (
                        <span
                          key={`${item.id}-${label}`}
                          className="rounded-[2px] border-2 border-[var(--border-primary)] bg-[var(--bg-surface)] px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-[var(--text-secondary)]"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="rounded-[4px] border-2 border-[var(--accent-purple)] bg-[color-mix(in_srgb,var(--accent-purple)_8%,var(--bg-panel))] px-3 py-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--accent-purple)]">
                    引导问题
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">
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
