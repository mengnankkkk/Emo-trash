import { getFlowerAssetByTag } from '../../lib/flowerAssets'
import type { EmotionCalendarDay } from '../../types/emotion'

interface EmotionCalendarHeatmapProps {
  days: EmotionCalendarDay[]
  selectedDate: string | null
  onSelectDate: (date: string) => void
}

function EmotionCalendarHeatmap({
  days,
  selectedDate,
  onSelectDate
}: EmotionCalendarHeatmapProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-5 gap-2 md:grid-cols-6 xl:grid-cols-10">
      {days.map((day) => {
        const asset = day.dominantEmotionTag ? getFlowerAssetByTag(day.dominantEmotionTag) : null
        const selected = selectedDate === day.date
        const background =
          day.count === 0
            ? 'var(--bg-surface)'
            : asset
              ? `${asset.colorHex}${['00', '33', '55', '77', 'aa'][day.intensityLevel]}`
              : 'var(--bg-surface)'

        return (
          <button
            key={day.date}
            type="button"
            data-calendar-date={day.date}
            data-selected={selected ? 'true' : 'false'}
            onClick={() => onSelectDate(day.date)}
            className={[
              'flex min-h-22 flex-col items-start justify-between rounded-[4px] border-2 px-3 py-3 text-left transition',
              selected
                ? 'border-[var(--accent-purple)] shadow-[0_0_0_1px_var(--accent-purple)]'
                : 'border-[var(--border-primary)]'
            ].join(' ')}
            style={{ background }}
          >
            <span className="text-xs text-[var(--text-secondary)]">
              {day.date.slice(5).replace('-', '/')}
            </span>
            <div>
              <div className="text-lg font-semibold text-[var(--text-primary)]">{day.count}</div>
              <div className="mt-1 text-[11px] text-[var(--text-secondary)]">
                {asset ? asset.displayName : '无记录'}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default EmotionCalendarHeatmap
