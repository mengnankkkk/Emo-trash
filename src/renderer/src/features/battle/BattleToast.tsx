import { useEffect, useState } from 'react'
import type { EmotionBattleMatch } from '../../../../preload/api'

interface BattleToastProps {
  match: EmotionBattleMatch | null
  onComplete: () => void
}

function formatBoost(value: number): string {
  return `+${Math.round(value * 100)}%`
}

export function BattleToast({ match, onComplete }: BattleToastProps): React.JSX.Element | null {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    setVisible(true)

    if (!match) {
      return
    }

    const hideTimer = window.setTimeout(() => {
      setVisible(false)
      window.setTimeout(onComplete, 350)
    }, 3600)

    return () => window.clearTimeout(hideTimer)
  }, [match, onComplete])

  if (!match) {
    return null
  }

  return (
    <div className="fixed right-6 top-20 z-50 max-w-sm">
      <div
        className={[
          'rounded-[4px] border-3 border-[var(--accent-rose)] bg-[var(--bg-panel)] px-4 py-3 shadow-[4px_4px_0_var(--pixel-shadow)]',
          visible ? 'achievement-toast--enter' : 'achievement-toast--exit'
        ].join(' ')}
      >
        <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--accent-rose)]">
          对立触发
        </div>
        <div className="mt-1 text-sm font-bold text-[var(--text-primary)]">
          {match.emotionPair.label}
        </div>
        <div className="mt-1 text-[11px] leading-5 text-[var(--text-muted)]">
          {match.emotionPair.description}
        </div>
        <div className="mt-2 inline-flex rounded-[2px] border-2 border-[var(--accent-amber)] px-2 py-0.5 text-[10px] font-bold text-[var(--accent-amber)]">
          稀有度加成 {formatBoost(match.rarityBoost)}
        </div>
      </div>
    </div>
  )
}
