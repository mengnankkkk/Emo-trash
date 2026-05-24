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
        'flex flex-col gap-3 rounded-[4px] border-2 p-4 transition',
        achievement.unlocked
          ? 'achievement-card--unlocked border-[var(--accent-yellow)] bg-[color-mix(in_srgb,var(--accent-yellow)_10%,var(--bg-panel))]'
          : 'border-[var(--border-primary)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)]'
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
            {categoryLabels[achievement.category] ?? achievement.category}
          </span>
          <h4 className={[
            'mt-1 text-sm font-semibold',
            achievement.unlocked ? 'text-[var(--accent-yellow)]' : 'text-[var(--text-primary)]'
          ].join(' ')}>
            {achievement.title}
          </h4>
        </div>
        <span className={[
          'rounded-[2px] border-2 px-2 py-0.5 text-[10px] font-semibold tracking-[0.14em]',
          achievement.unlocked
            ? 'border-[var(--accent-yellow)] text-[var(--accent-yellow)]'
            : 'border-[var(--border-primary)] text-[var(--text-muted)]'
        ].join(' ')}>
          {achievement.unlocked ? '已解锁' : `${progressPercent}%`}
        </span>
      </div>

      <p className="text-xs leading-5 text-[var(--text-secondary)]">
        {achievement.unlocked ? achievement.description : achievement.hint}
      </p>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
          <span>{achievement.progress} / {achievement.target} {achievement.unit}</span>
          {achievement.unlockedAt && (
            <span>解锁于 {achievement.unlockedAt.split(' ')[0]}</span>
          )}
        </div>
        <div className="pixel-progress">
          <div
            className={[
              'pixel-progress-fill',
              achievement.unlocked
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                : 'bg-[var(--border-primary)]'
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
      <section className="pixel-panel flex items-center justify-center p-8 text-sm text-[var(--text-muted)]">
        {loading ? '正在计算成就进度…' : '暂无成就数据。'}
      </section>
    )
  }

  const unlockedPercent = Math.round(summary.unlockRatio * 100)

  return (
    <section className="pixel-panel flex flex-col gap-6 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--text-muted)]">成就系统</p>
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
            已解锁 {summary.unlockedCount} / {summary.totalCount}
          </h2>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="rounded-[2px] border-2 border-[var(--accent-yellow)] bg-[color-mix(in_srgb,var(--accent-yellow)_10%,var(--bg-panel))] px-3 py-1 text-xs font-semibold tracking-[0.18em] text-[var(--accent-yellow)]">
            {unlockedPercent}% 完成
          </span>
        </div>
      </div>

      <div className="pixel-progress">
        <div
          className="pixel-progress-fill bg-gradient-to-r from-emerald-500 via-sky-400 to-amber-400"
          style={{ width: `${unlockedPercent}%` }}
        />
      </div>

      {summary.recentlyUnlocked.length > 0 && (
        <div className="rounded-[4px] border-2 border-[var(--accent-yellow)] bg-[color-mix(in_srgb,var(--accent-yellow)_8%,var(--bg-panel))] p-4">
          <p className="mb-3 text-xs uppercase tracking-[0.22em] text-[var(--accent-yellow)]">最近解锁</p>
          <div className="flex flex-wrap gap-2">
            {summary.recentlyUnlocked.map((item) => (
              <span
                key={item.id}
                className="rounded-[2px] border-2 border-[var(--accent-yellow)] bg-[color-mix(in_srgb,var(--accent-yellow)_10%,var(--bg-panel))] px-3 py-1 text-xs font-semibold text-[var(--accent-yellow)]"
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