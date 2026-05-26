import type { EmotionTag } from './emotionMeta'
import type { GardenItem } from '../preload/api'

export type WeatherType =
  | 'thunderstorm'
  | 'windy'
  | 'rainstorm'
  | 'cloudy'
  | 'sunny'
  | 'rainbow'
  | 'overcast'

export interface EmotionWeather {
  type: WeatherType
  label: string
  description: string
  dominantEmotion: EmotionTag | null
}

const weatherMap: Record<EmotionTag, { type: WeatherType; label: string; description: string }> = {
  anger: { type: 'thunderstorm', label: '雷暴', description: '愤怒的电流在空气中噼啪作响' },
  anxiety: { type: 'windy', label: '大风', description: '焦虑的风不停地吹' },
  collapse: { type: 'rainstorm', label: '暴雨', description: '崩溃化作倾盆大雨' },
  fatigue: { type: 'cloudy', label: '阴天', description: '疲惫像厚重的云层压下来' },
  calm: { type: 'sunny', label: '晴天', description: '平静的阳光洒满花园' },
  relief: { type: 'rainbow', label: '彩虹', description: '释然之后天空出现了彩虹' }
}

const defaultWeather: EmotionWeather = {
  type: 'overcast',
  label: '多云',
  description: '今天还没有释放情绪',
  dominantEmotion: null
}

export function computeEmotionWeather(items: GardenItem[]): EmotionWeather {
  const today = new Date()
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const todayItems = items.filter((item) => item.releasedOn === todayKey)

  if (todayItems.length === 0) {
    return defaultWeather
  }

  const counts: Partial<Record<EmotionTag, number>> = {}
  for (const item of todayItems) {
    counts[item.emotionTag] = (counts[item.emotionTag] ?? 0) + 1
  }

  const sorted = Object.entries(counts).sort(
    (a, b) => (b[1] as number) - (a[1] as number)
  )
  const [topEmotion, topCount] = sorted[0] as [EmotionTag, number]
  const ratio = topCount / todayItems.length

  if (ratio < 0.4 && sorted.length > 1) {
    return {
      type: 'overcast',
      label: '多云',
      description: '今天的情绪比较混杂',
      dominantEmotion: null
    }
  }

  const mapped = weatherMap[topEmotion]
  return {
    type: mapped.type,
    label: mapped.label,
    description: mapped.description,
    dominantEmotion: topEmotion
  }
}
