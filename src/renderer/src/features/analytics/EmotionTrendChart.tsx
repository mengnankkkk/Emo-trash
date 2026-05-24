import { getFlowerAssetByTag } from '../../lib/flowerAssets'
import type { EmotionStatsSummary } from '../../types/emotion'

interface EmotionTrendChartProps {
  trend: EmotionStatsSummary['trend']
}

function EmotionTrendChart({ trend }: EmotionTrendChartProps): React.JSX.Element {
  const maxCount = Math.max(...trend.map((item) => item.count), 1)
  const columnCount = trend.length <= 7 ? trend.length : Math.min(trend.length, 15)

  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
    >
      {trend.map((item) => {
        const asset = item.dominantEmotionTag ? getFlowerAssetByTag(item.dominantEmotionTag) : null
        const height =
          item.count === 0 ? 10 : Math.max(14, Math.round((item.count / maxCount) * 68))

        return (
          <div key={item.date} className="flex flex-col items-center gap-2">
            <div className="flex h-20 w-full items-end justify-center rounded-2xl border border-white/10 bg-black/20 px-2 py-2">
              <div
                className="w-full rounded-full transition-[height]"
                style={{
                  height,
                  background: asset ? asset.colorHex : 'rgba(255,255,255,0.14)'
                }}
              />
            </div>
            <div className="text-center text-[10px] text-white/35">
              <div>{item.date.slice(5).replace('-', '/')}</div>
              <div className="mt-1 text-white/60">{item.count}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default EmotionTrendChart
