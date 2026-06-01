import EmotionTrendChart from './EmotionTrendChart'
import { getFlowerAssetByTag } from '../../lib/flowerAssets'
import type { EmotionStatsSummary } from '../../types/emotion'

interface EmotionStatsPanelProps {
  summary: EmotionStatsSummary | null
  loading: boolean
}

function EmotionStatsPanel({ summary, loading }: EmotionStatsPanelProps): React.JSX.Element {
  const hasData = !!summary

  return (
    <section className="flex h-full flex-col rounded-[4px] border-2 border-[var(--border-primary)] bg-[var(--bg-surface)] p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--text-muted)]">情绪统计</p>
          <h3 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">最近的情绪节律</h3>
        </div>
        <span className="rounded-[2px] border-2 border-[var(--border-primary)] bg-[var(--bg-panel)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-sky)]">
          最近 7 天
        </span>
      </div>

      {!hasData ? (
        <div className="mt-6 flex flex-1 items-center justify-center rounded-[4px] border-2 border-dashed border-[var(--border-primary)] bg-[var(--bg-panel)] px-4 text-center text-sm text-[var(--text-muted)]">
          {loading ? '正在整理最近的花园记录…' : '还没有足够的记录来生成统计。'}
        </div>
      ) : (
        <div className="mt-6 flex flex-1 flex-col gap-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-[4px] border-2 border-[var(--border-primary)] bg-[var(--bg-panel)] p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
                释放次数
              </p>
              <p className="mt-3 text-3xl font-semibold text-[var(--text-primary)]">
                {summary.totalReleases}
              </p>
            </article>
            <article className="rounded-[4px] border-2 border-[var(--border-primary)] bg-[var(--bg-panel)] p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
                高频时段
              </p>
              <p className="mt-3 text-lg font-semibold text-[var(--text-primary)]">
                {summary.peakHourLabel}
              </p>
            </article>
            <article className="rounded-[4px] border-2 border-[var(--border-primary)] bg-[var(--bg-panel)] p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
                当前连续
              </p>
              <p
                className="mt-3 text-3xl font-semibold text-[var(--text-primary)]"
                data-current-streak={summary.currentStreakDays}
              >
                {summary.currentStreakDays}
              </p>
            </article>
            <article className="rounded-[4px] border-2 border-[var(--border-primary)] bg-[var(--bg-panel)] p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
                最长连续
              </p>
              <p className="mt-3 text-3xl font-semibold text-[var(--text-primary)]">
                {summary.longestStreakDays}
              </p>
            </article>
          </div>

          <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[4px] border-2 border-[var(--border-primary)] bg-[var(--bg-panel)] p-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
                  情绪占比
                </p>
                <span className="text-xs text-[var(--text-muted)]">
                  看最近 {summary.rangeDays} 天
                </span>
              </div>
              <div className="space-y-3">
                {summary.emotionBreakdown.map((item) => {
                  const asset = getFlowerAssetByTag(item.tag)
                  return (
                    <div
                      key={item.tag}
                      data-emotion-breakdown-item={item.tag}
                      className="rounded-[4px] border-2 border-[var(--border-primary)] bg-[var(--bg-surface)] p-3"
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <img
                            alt={asset.displayName}
                            className="garden-sprite h-5 w-5"
                            src={asset.textureUrl}
                          />
                          <span className="text-sm font-medium text-[var(--text-primary)]">
                            {asset.displayName}
                          </span>
                        </div>
                        <span className="text-xs text-[var(--text-secondary)]">
                          {item.count} 次
                        </span>
                      </div>
                      <div className="pixel-progress">
                        <div
                          className="pixel-progress-fill"
                          style={{
                            width: `${Math.round(item.ratio * 100)}%`,
                            background: asset.colorHex
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-[4px] border-2 border-[var(--border-primary)] bg-[var(--bg-panel)] p-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">趋势</p>
                <span className="text-xs text-[var(--text-muted)]">颜色代表当天主情绪</span>
              </div>
              <EmotionTrendChart trend={summary.trend} />
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default EmotionStatsPanel
