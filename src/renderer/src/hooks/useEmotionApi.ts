import { useCallback } from 'react'
import type { GardenItem } from '../types/emotion'
import { extractEmotionFeatures } from '../lib/extractEmotionFeatures'
import { getRuntimeApi } from '../lib/runtimeApi'

export function useEmotionApi(): {
  releaseEmotion: (text: string) => Promise<GardenItem[]>
  listGarden: () => Promise<GardenItem[]>
} {
  const releaseEmotion = useCallback(async (text: string): Promise<GardenItem[]> => {
    const features = extractEmotionFeatures(text)
    const api = getRuntimeApi()

    await api.triggerShake({
      intensity: Math.min(28, 10 + features.emphasisLevel),
      durationMs: 420
    })

    return api.releaseEmotion(features)
  }, [])

  const listGarden = useCallback(() => {
    return getRuntimeApi().listGarden()
  }, [])

  return {
    releaseEmotion,
    listGarden
  }
}
