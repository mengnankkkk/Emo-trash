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
    <section className="flex h-full flex-col rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-white/30">情绪统计</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">最近的情绪节律</h3>
        </div>
        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-semibold text-rose-100">
          最近 7 天
        </span>
      </div>

      {!hasData ? (
        <div className="mt-6 flex flex-1 items-center justify-center rounded-3xl border border-dashed border-white/10 bg-black/15 px-4 text-center text-sm text-white/35">
          {loading ? '正在整理最近的花园记录…' : '还没有足够的记录来生成统计。'}
        </div>
      ) : (
        <div className="mt-6 flex flex-1 flex-col gap-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-white/30">释放次数</p>
              <p className="mt-3 text-3xl font-semibold text-white">{summary.totalReleases}</p>
            </article>
            <article className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-white/30">高频时段</p>
              <p className="mt-3 text-lg font-semibold text-white">{summary.peakHourLabel}</p>
            </article>
            <article className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-white/30">当前连续</p>
              <p
                className="mt-3 text-3xl font-semibold text-white"
                data-current-streak={summary.currentStreakDays}
              >
                {summary.currentStreakDays}
              </p>
            </article>
            <article className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-white/30">最长连续</p>
              <p className="mt-3 text-3xl font-semibold text-white">{summary.longestStreakDays}</p>
            </article>
          </div>

          <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.22em] text-white/30">情绪占比</p>
                <span className="text-xs text-white/35">看最近 {summary.rangeDays} 天</span>
              </div>
              <div className="space-y-3">
                {summary.emotionBreakdown.map((item) => {
                  const asset = getFlowerAssetByTag(item.tag)
                  return (
                    <div
                      key={item.tag}
                      data-emotion-breakdown-item={item.tag}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <img
                            alt={asset.displayName}
                            className="garden-sprite h-5 w-5"
                            src={asset.textureUrl}
                          />
                          <span className="text-sm font-medium text-white/80">
                            {asset.displayName}
                          </span>
                        </div>
                        <span className="text-xs text-white/45">{item.count} 次</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/8">
                        <div
                          className="h-full rounded-full"
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

            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.22em] text-white/30">趋势</p>
                <span className="text-xs text-white/35">颜色代表当天主情绪</span>
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
