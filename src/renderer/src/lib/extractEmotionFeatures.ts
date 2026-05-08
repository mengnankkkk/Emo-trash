import type { EmotionFeatureInput } from '../types/emotion'

const EMOTION_KEYWORDS = ['恨', '烦', '崩', '滚', '死', '累', '痛', '怒', '厌', '糟']

const FLOWER_COLORS = ['#f87171', '#fb7185', '#c084fc', '#60a5fa', '#34d399', '#fbbf24']

export function extractEmotionFeatures(text: string): EmotionFeatureInput {
  const trimmedText = text.trim()
  const textLength = trimmedText.length
  const exclamationMatches = trimmedText.match(/[!！]/g) ?? []
  const keywordHits = EMOTION_KEYWORDS.reduce((count, keyword) => {
    return count + (trimmedText.includes(keyword) ? 1 : 0)
  }, 0)

  const exclamationDensity =
    textLength === 0 ? 0 : Math.min(1, exclamationMatches.length / textLength)
  const emphasisLevel = Math.min(
    12,
    keywordHits * 2 + exclamationMatches.length + Math.ceil(textLength / 18)
  )
  const flowerType = (Math.max(1, emphasisLevel) % FLOWER_COLORS.length) + 1
  const colorHex = FLOWER_COLORS[(flowerType - 1) % FLOWER_COLORS.length]

  return {
    textLength,
    exclamationDensity,
    emphasisLevel,
    flowerType,
    colorHex
  }
}
