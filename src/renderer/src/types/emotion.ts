export type EmotionTag = 'anger' | 'collapse' | 'anxiety' | 'fatigue' | 'calm' | 'relief'

export interface EmotionFeatureInput {
  textLength: number
  exclamationDensity: number
  emphasisLevel: number
  flowerType: number
  colorHex: string
  emotionTag: EmotionTag
}

export interface GardenItem {
  id: number
  timestamp: string
  flowerType: number
  colorHex: string
  growthStage: number
  emotionTag?: EmotionTag
}
