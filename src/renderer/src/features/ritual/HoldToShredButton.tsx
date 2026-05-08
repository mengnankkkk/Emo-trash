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
      className="group relative flex h-16 w-full items-center justify-center overflow-hidden rounded-full border border-rose-500/40 bg-rose-500/15 text-sm font-semibold uppercase tracking-[0.3em] text-rose-100 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-white/30"
    >
      <span
        className="absolute inset-y-0 left-0 bg-gradient-to-r from-rose-600/70 to-orange-400/70 transition-[width] duration-75"
        style={{ width: `${progress}%` }}
      />
      <span className="relative z-10">
        {isReady ? '坍缩完成' : isPressing ? '继续按住粉碎' : '长按 2 秒粉碎'}
      </span>
    </button>
  )
}

export default HoldToShredButton
