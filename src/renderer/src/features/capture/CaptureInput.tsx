interface CaptureInputProps {
  value: string
  disabled?: boolean
  onChange: (value: string) => void
}

function CaptureInput({ value, disabled = false, onChange }: CaptureInputProps): React.JSX.Element {
  return (
    <label className="flex w-full flex-col gap-3">
      <span className="text-xs uppercase tracking-[0.28em] text-white/35">输入室</span>
      <textarea
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder="把不想留下的话扔进来……"
        className="min-h-52 w-full resize-none rounded-3xl border border-white/10 bg-black/30 px-6 py-5 font-mono text-lg leading-8 text-white outline-none transition placeholder:text-white/20 focus:border-rose-400/45 focus:bg-black/45"
      />
    </label>
  )
}

export default CaptureInput
