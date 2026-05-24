interface CaptureInputProps {
  value: string
  disabled?: boolean
  onChange: (value: string) => void
}

function CaptureInput({ value, disabled = false, onChange }: CaptureInputProps): React.JSX.Element {
  return (
    <label className="flex w-full flex-col gap-3">
      <span className="text-xs uppercase tracking-[0.28em] text-[var(--text-muted)]">输入室</span>
      <textarea
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder="把不想留下的话扔进来……"
        className="min-h-52 w-full resize-none rounded-[4px] border-3 border-[var(--border-primary)] bg-[var(--bg-panel)] px-6 py-5 font-mono text-lg leading-8 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent-rose)] focus:bg-[var(--bg-base)]"
        style={{ boxShadow: 'inset 2px 2px 0 var(--pixel-shadow)' }}
      />
    </label>
  )
}

export default CaptureInput
