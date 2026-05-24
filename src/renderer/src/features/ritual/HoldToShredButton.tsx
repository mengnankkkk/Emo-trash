import { useHoldProgress } from '../../hooks/useHoldProgress'

interface HoldToShredButtonProps {
  disabled?: boolean
  onCommit: () => Promise<void> | void
}

function HoldToShredButton({
  disabled = false,
  onCommit
}: HoldToShredButtonProps): React.JSX.Element {
  const { progress, isPressing, isReady, startHolding, stopHolding } = useHoldProgress({
    disabled,
    onCommit
  })

  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={startHolding}
      onPointerUp={stopHolding}
      onPointerLeave={stopHolding}
      onPointerCancel={stopHolding}
      className="group relative flex h-16 w-full items-center justify-center overflow-hidden rounded-[4px] border-3 border-[var(--accent-rose)] bg-[var(--accent-rose-soft)] text-sm font-semibold uppercase tracking-[0.3em] text-[var(--accent-rose)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:border-[var(--border-primary)] disabled:bg-[var(--bg-surface)] disabled:text-[var(--text-muted)]"
      style={{ boxShadow: '3px 3px 0 var(--pixel-shadow)' }}
    >
      <span
        className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--accent-rose)] to-[var(--accent-amber)] opacity-70 transition-[width] duration-75"
        style={{ width: `${progress}%` }}
      />
      <span className="relative z-10">
        {isReady ? '坍缩完成' : isPressing ? '继续按住粉碎' : '长按 2 秒粉碎'}
      </span>
    </button>
  )
}

export default HoldToShredButton
