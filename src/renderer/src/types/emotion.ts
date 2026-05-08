export interface EmotionFeatureInput {
  textLength: number
  exclamationDensity: number
  emphasisLevel: number
  flowerType: number
  colorHex: string
}

export interface GardenItem {
  id: number
  timestamp: string
  flowerType: number
  colorHex: string
  growthStage: number
}
