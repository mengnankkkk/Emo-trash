import type { GardenGrowthSnapshot } from '../../types/emotion'

interface GardenGrowthPanelProps {
  snapshot: GardenGrowthSnapshot | null
  loading: boolean
}

function GardenGrowthPanel({ snapshot, loading }: GardenGrowthPanelProps): React.JSX.Element {
  if (!snapshot) {
    return (
      <section className="flex h-full items-center justify-center rounded-[2rem] border border-white/10 bg-black/25 p-5 text-sm text-white/35 shadow-2xl shadow-black/30">
        {loading ? '正在校准花园的成长状态…' : '还没有足够的花朵来评估成长状态。'}
      </section>
    )
  }

  return (
    <section
      className="flex h-full flex-col rounded-[2rem] border border-white/10 bg-black/25 p-5 shadow-2xl shadow-black/30"
      data-garden-level={snapshot.level}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-white/30">花园成长</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">{snapshot.levelLabel}</h3>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs tracking-[0.2em] text-rose-100/80">
          {snapshot.seasonLabel}
        </span>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-white/30">当前连续</p>
          <p className="mt-3 text-3xl font-semibold text-white">{snapshot.currentStreakDays} 天</p>
        </article>
        <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-white/30">最近 7 天活跃</p>
          <p className="mt-3 text-3xl font-semibold text-white">{snapshot.recentReleaseCount}</p>
        </article>
      </div>

      <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-3 flex items-center justify-between gap-3 text-sm text-white/60">
          <span>成长进度</span>
          <span>
            {snapshot.nextLevelLabel ? `下一阶段：${snapshot.nextLevelLabel}` : '已经进入最高阶段'}
          </span>
        </div>
        <div className="h-3 rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-rose-300 to-amber-300"
            style={{ width: `${Math.round(snapshot.progressToNextLevel * 100)}%` }}
          />
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-white/55">
        你的花园目前已经累计 {snapshot.totalBlooms} 朵花，最长连续释放 {snapshot.longestStreakDays}{' '}
        天。
        {snapshot.level === 1 && ' 继续保持几天，花园就会从新芽状态进入开花期。'}
        {snapshot.level === 2 && ' 你已经让花园稳定开花，再保持一段连续节律就能进入盛放期。'}
        {snapshot.level === 3 && ' 你的花园已经进入盛放状态，说明最近的情绪清理节律非常稳定。'}
      </div>
    </section>
  )
}

export default GardenGrowthPanel
