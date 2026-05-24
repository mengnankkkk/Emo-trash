import type { AchievementStatus, AchievementSummary } from '../../types/emotion'

interface AchievementsPageProps {
  summary: AchievementSummary | null
  loading: boolean
}

const categoryLabels: Record<string, string> = {
  milestone: '里程碑',
  streak: '连续释放',
  growth: '花园成长',
  diversity: '情绪多样',
  ritual: '仪式习惯'
}

function AchievementCard({ achievement }: { achievement: AchievementStatus }): React.JSX.Element {
  const progressPercent = achievement.target > 0
    ? Math.round((achievement.progress / achievement.target) * 100)
    : 0

  return (
    <article
      data-achievement-id={achievement.id}
      data-unlocked={achievement.unlocked ? 'true' : 'false'}
      className={[
        'flex flex-col gap-3 rounded-2xl border p-4 transition',
        achievement.unlocked
          ? 'achievement-card--unlocked border-emerald-300/30 bg-emerald-400/10'
          : 'border-white/10 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.05]'
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/30">
            {categoryLabels[achievement.category] ?? achievement.category}
          </span>
          <h4 className={[
            'mt-1 text-sm font-semibold',
            achievement.unlocked ? 'text-emerald-100' : 'text-white/80'
          ].join(' ')}>
            {achievement.title}
          </h4>
        </div>
        <span className={[
          'rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-[0.14em]',
          achievement.unlocked
            ? 'border-emerald-300/30 text-emerald-200/80'
            : 'border-white/10 text-white/40'
        ].join(' ')}>
          {achievement.unlocked ? '已解锁' : `${progressPercent}%`}
        </span>
      </div>

      <p className="text-xs leading-5 text-white/50">
        {achievement.unlocked ? achievement.description : achievement.hint}
      </p>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] text-white/35">
          <span>{achievement.progress} / {achievement.target} {achievement.unit}</span>
          {achievement.unlockedAt && (
            <span>解锁于 {achievement.unlockedAt.split(' ')[0]}</span>
          )}
        </div>
        <div className="h-1.5 rounded-full bg-white/8">
          <div
            className={[
              'h-full rounded-full transition-all',
              achievement.unlocked
                ? 'bg-gradient-to-r from-emerald-400 to-emerald-300'
                : 'bg-white/20'
            ].join(' ')}
            style={{ width: `${Math.min(100, progressPercent)}%` }}
          />
        </div>
      </div>
    </article>
  )
}

function AchievementsPage({ summary, loading }: AchievementsPageProps): React.JSX.Element {
  if (!summary) {
    return (
      <section className="flex items-center justify-center rounded-[2rem] border border-white/10 bg-black/25 p-8 text-sm text-white/35 shadow-2xl shadow-black/30">
        {loading ? '正在计算成就进度…' : '暂无成就数据。'}
      </section>
    )
  }

  const unlockedPercent = Math.round(summary.unlockRatio * 100)

  return (
    <section className="flex flex-col gap-6 rounded-[2rem] border border-white/10 bg-black/25 p-5 shadow-2xl shadow-black/30">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.28em] text-white/30">成就系统</p>
          <h2 className="text-2xl font-semibold text-white">
            已解锁 {summary.unlockedCount} / {summary.totalCount}
          </h2>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-emerald-200/80">
            {unlockedPercent}% 完成
          </span>
        </div>
      </div>

      <div className="h-2 rounded-full bg-white/8">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-sky-300 to-amber-300"
          style={{ width: `${unlockedPercent}%` }}
        />
      </div>

      {summary.recentlyUnlocked.length > 0 && (
        <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/5 p-4">
          <p className="mb-3 text-xs uppercase tracking-[0.22em] text-emerald-200/60">最近解锁</p>
          <div className="flex flex-wrap gap-2">
            {summary.recentlyUnlocked.map((item) => (
              <span
                key={item.id}
                className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-100/80"
              >
                {item.title}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {summary.achievements.map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </div>
    </section>
  )
}

export default AchievementsPage
