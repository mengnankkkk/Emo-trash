import { useMemo } from 'react'
import { useHoldProgress } from '../../hooks/useHoldProgress'

interface HoldToShredButtonProps {
  disabled?: boolean
  onCommit: () => Promise<void> | void
}

const breathPhases = [
  { label: '吸气…', start: 0, end: 25 },
  { label: '屏住…', start: 25, end: 50 },
  { label: '呼气…', start: 50, end: 75 },
  { label: '释放…', start: 75, end: 100 }
]

function HoldToShredButton({
  disabled = false,
  onCommit
}: HoldToShredButtonProps): React.JSX.Element {
  const { progress, isPressing, isReady, startHolding, stopHolding } = useHoldProgress({
    disabled,
    onCommit
  })

  const breathPhase = useMemo(() => {
    if (!isPressing || isReady) return null
    return breathPhases.find((p) => progress >= p.start && progress < p.end) ?? breathPhases[3]
  }, [isPressing, isReady, progress])

  const pulseScale = useMemo(() => {
    if (!isPressing || isReady) return 1
    const cycle = (progress % 25) / 25
    return 1 + Math.sin(cycle * Math.PI) * 0.03
  }, [isPressing, isReady, progress])

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        disabled={disabled}
        onPointerDown={startHolding}
        onPointerUp={stopHolding}
        onPointerLeave={stopHolding}
        onPointerCancel={stopHolding}
        className="shred-btn group relative flex h-16 w-full items-center justify-center overflow-hidden rounded-[4px] border-3 border-[var(--accent-rose)] bg-[var(--accent-rose-soft)] text-sm font-semibold uppercase tracking-[0.3em] text-[var(--accent-rose)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:border-[var(--border-primary)] disabled:bg-[var(--bg-surface)] disabled:text-[var(--text-muted)]"
        style={{
          boxShadow: '3px 3px 0 var(--pixel-shadow)',
          transform: `scale(${pulseScale})`
        }}
      >
        <span
          className="absolute inset-y-0 left-0 transition-[width] duration-75"
          style={{
            width: `${progress}%`,
            background: isPressing
              ? `linear-gradient(90deg, var(--accent-rose), var(--accent-purple) ${progress}%, var(--accent-amber))`
              : 'linear-gradient(90deg, var(--accent-rose), var(--accent-amber))',
            opacity: 0.7
          }}
        />
        {isPressing && !isReady && (
          <span
            className="shred-btn-glow absolute inset-0"
            style={{ opacity: 0.15 + (progress / 100) * 0.25 }}
          />
        )}
        <span className="relative z-10">
          {isReady ? '坍缩完成' : isPressing ? '继续按住粉碎' : '长按 2 秒粉碎'}
        </span>
      </button>
      {isPressing && !isReady && breathPhase && (
        <div className="flex items-center gap-3">
          <span
            className="shred-breath-dot"
            style={{
              transform: `scale(${0.6 + Math.sin(((progress % 25) / 25) * Math.PI) * 0.4})`
            }}
          />
          <span className="text-[11px] tracking-[0.2em] text-[var(--text-muted)]">
            {breathPhase.label}
          </span>
          <span className="text-[9px] text-[var(--text-muted)]">{Math.round(progress)}%</span>
        </div>
      )}
    </div>
  )
}

export default HoldToShredButton
