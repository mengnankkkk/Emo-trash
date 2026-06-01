import { useCallback, useEffect, useMemo, useState } from 'react'
import type { EmotionBattleStats } from '../../../../preload/api'
import { getRuntimeApi } from '../../lib/runtimeApi'

function formatBoost(value: number): string {
  return `+${Math.round(value * 100)}%`
}

function formatMatchDate(value: string | null): string {
  if (!value) {
    return '尚未触发'
  }

  return value.split(' ')[0] ?? value
}

export function EmotionBattlePanel(): React.JSX.Element {
  const [stats, setStats] = useState<EmotionBattleStats | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadStats = useCallback(async () => {
    setLoading(true)
    setLoadError(null)

    try {
      const data = await getRuntimeApi().getEmotionBattleStats()
      setStats(data)
    } catch (error) {
      console.error('加载情绪对抗统计失败:', error)
      setStats(null)
      setLoadError(error instanceof Error ? error.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadStats()
  }, [loadStats])

  const completionPercent = useMemo(() => {
    if (!stats) {
      return 0
    }

    return Math.min(100, Math.max(0, Math.round((stats.uniquePairs / stats.totalPairs) * 100)))
  }, [stats])

  const nextPair = useMemo(() => {
    return stats?.pairProgress.find((item) => !item.unlocked) ?? null
  }, [stats])

  if (loading) {
    return (
      <section className="pixel-panel pixel-panel--rose flex items-center justify-center p-8 text-sm text-[var(--text-muted)]">
        正在加载对抗数据...
      </section>
    )
  }

  if (!stats) {
    return (
      <section className="pixel-panel pixel-panel--rose flex flex-col items-center justify-center gap-3 p-8 text-center text-sm text-[var(--text-muted)]">
        <p>对抗数据加载失败。</p>
        {loadError && <p className="text-[11px] text-[var(--accent-rose)]">{loadError}</p>}
        <button type="button" className="pixel-btn text-[11px]" onClick={() => void loadStats()}>
          重新加载
        </button>
      </section>
    )
  }

  return (
    <section className="pixel-panel pixel-panel--rose flex flex-col gap-5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--text-muted)]">
            情绪对抗
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">对立平衡</h2>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-[2px] border-2 border-[var(--border-primary)] bg-[var(--bg-surface)] px-3 py-2">
            <div className="text-[10px] text-[var(--text-muted)]">匹配</div>
            <div className="mt-1 text-lg font-bold text-[var(--text-primary)]">
              {stats.totalMatches}
            </div>
          </div>
          <div className="rounded-[2px] border-2 border-[var(--border-primary)] bg-[var(--bg-surface)] px-3 py-2">
            <div className="text-[10px] text-[var(--text-muted)]">图鉴</div>
            <div className="mt-1 text-lg font-bold text-[var(--accent-rose)]">
              {stats.uniquePairs}/{stats.totalPairs}
            </div>
          </div>
          <div className="rounded-[2px] border-2 border-[var(--border-primary)] bg-[var(--bg-surface)] px-3 py-2">
            <div className="text-[10px] text-[var(--text-muted)]">加成</div>
            <div className="mt-1 text-lg font-bold text-[var(--accent-amber)]">
              {formatBoost(stats.totalRarityBoost)}
            </div>
          </div>
        </div>
      </div>

      <div className="pixel-progress">
        <div
          className="pixel-progress-fill"
          style={{
            width: `${completionPercent}%`,
            background: 'linear-gradient(90deg, #f87171, #c084fc, #fb7185)'
          }}
        />
      </div>

      <div className="rounded-[2px] border-2 border-dashed border-[var(--border-primary)] bg-[var(--bg-surface)] p-3">
        <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
          下一组目标
        </div>
        <div className="mt-2 text-sm text-[var(--text-secondary)]">
          {nextPair
            ? `${nextPair.pair.label}: 24 小时内播种 ${nextPair.pair.emotion1} 与 ${nextPair.pair.emotion2}`
            : '所有对立关系都已触发，继续累积匹配可以提高稀有度加成。'}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {stats.pairProgress.map((item) => (
          <div
            key={item.pairKey}
            className="rounded-[2px] border-2 border-[var(--border-primary)] bg-[var(--bg-panel)] p-3"
            style={{
              boxShadow: item.unlocked
                ? '3px 3px 0 color-mix(in srgb, var(--accent-rose) 35%, transparent)'
                : '2px 2px 0 var(--pixel-shadow)'
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-bold text-[var(--text-primary)]">{item.pair.label}</div>
              <span
                className={[
                  'rounded-[2px] border-2 px-2 py-0.5 text-[9px] font-bold',
                  item.unlocked
                    ? 'border-[var(--accent-emerald)] text-[var(--accent-emerald)]'
                    : 'border-[var(--border-primary)] text-[var(--text-muted)]'
                ].join(' ')}
              >
                {item.unlocked ? '已点亮' : '未点亮'}
              </span>
            </div>
            <p className="mt-2 min-h-10 text-[11px] leading-5 text-[var(--text-muted)]">
              {item.pair.description}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
              <div className="rounded-[2px] bg-[var(--bg-surface)] px-2 py-1">
                次数 <span className="font-bold text-[var(--text-primary)]">{item.matchCount}</span>
              </div>
              <div className="rounded-[2px] bg-[var(--bg-surface)] px-2 py-1">
                加成{' '}
                <span className="font-bold text-[var(--accent-amber)]">
                  {formatBoost(item.totalRarityBoost)}
                </span>
              </div>
            </div>
            <div className="mt-2 text-[10px] text-[var(--text-muted)]">
              最近: {formatMatchDate(item.lastMatchedAt)}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 border-b-2 border-dashed border-[var(--border-primary)] pb-1">
          <span className="text-xs font-bold tracking-[0.1em] text-[var(--text-primary)]">
            最近匹配
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">
            {stats.recentMatches.length}
          </span>
        </div>
        {stats.recentMatches.length > 0 ? (
          stats.recentMatches.map((match) => (
            <div
              key={match.id}
              className="rounded-[2px] border-2 border-[var(--border-primary)] bg-[var(--bg-panel)] p-3"
              style={{ boxShadow: '2px 2px 0 var(--pixel-shadow)' }}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-[var(--text-primary)]">
                    {match.emotionPair.label}
                  </div>
                  <div className="mt-1 text-[10px] text-[var(--text-muted)]">
                    {match.emotionPair.description}
                  </div>
                </div>
                <div className="rounded-[2px] border-2 border-[var(--accent-amber)] bg-[color-mix(in_srgb,var(--accent-amber)_10%,var(--bg-panel))] px-2 py-1 text-[10px] font-bold text-[var(--accent-amber)]">
                  {formatBoost(match.rarityBoost)}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[2px] border-2 border-dashed border-[var(--border-primary)] bg-[var(--bg-surface)] p-6 text-center">
            <div className="text-sm text-[var(--text-secondary)]">
              24 小时内播种对立情绪，即可点亮第一组对抗关系。
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
