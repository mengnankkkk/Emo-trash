import type { DailyCheckInStatus } from '../../types/emotion'
import { getEmotionDefinitionByTag } from '../../../../shared/emotionMeta'
import { getRarityDefinition } from '../../../../shared/rarity'

export function DailyCheckInCard({
  status,
  claiming,
  onClaim
}: {
  status: DailyCheckInStatus | null
  claiming: boolean
  onClaim: () => void
}): React.JSX.Element {
  const reward = status?.rewardPreview
  const rewardText = !reward
    ? '正在读取奖励'
    : reward.type === 'currency'
      ? `${reward.coins ?? 0} 金币`
      : `${getEmotionDefinitionByTag(reward.emotionTag ?? 'calm').displayName} ${getRarityDefinition(reward.rarity ?? 'common').label}种子`

  return (
    <section className="pixel-panel pixel-panel--amber flex flex-wrap items-center justify-between gap-4 p-4">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-[var(--text-muted)]">每日签到</p>
        <h2 className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
          {status?.checkedInToday ? '今日已领取' : '今天可以领取奖励'}
        </h2>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          连续 {status?.currentStreak ?? 0} 天，下一次奖励：{rewardText}
        </p>
      </div>
      <button
        type="button"
        disabled={!status || status.checkedInToday || claiming}
        className="pixel-btn text-[11px] disabled:opacity-40"
        onClick={onClaim}
      >
        {claiming ? '领取中...' : status?.checkedInToday ? '已签到' : '领取奖励'}
      </button>
    </section>
  )
}
