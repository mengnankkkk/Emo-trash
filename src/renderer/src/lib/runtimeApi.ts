import type {
  EmoTrashApi,
  GardenItem,
  ReleaseEmotionInput,
  ShakeWindowInput
} from '../../../preload/api'

const STORAGE_KEY = 'emo-trash-browser-garden'

function readGarden(): GardenItem[] {
  const rawValue = window.localStorage.getItem(STORAGE_KEY)
  if (!rawValue) {
    return []
  }

  return JSON.parse(rawValue) as GardenItem[]
}

function saveGarden(items: GardenItem[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

const browserPreviewApi: EmoTrashApi = {
  async releaseEmotion(input: ReleaseEmotionInput): Promise<GardenItem[]> {
    const nextItem: GardenItem = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      flowerType: input.flowerType,
      colorHex: input.colorHex,
      growthStage: 1
    }

    const garden = [nextItem, ...readGarden()].slice(0, 24)
    saveGarden(garden)
    return garden
  },
  async listGarden(): Promise<GardenItem[]> {
    return readGarden()
  },
  async triggerShake(input?: Partial<ShakeWindowInput>): Promise<void> {
    const intensity = Math.min(32, Math.max(4, input?.intensity ?? 14))
    const durationMs = Math.min(1000, Math.max(120, input?.durationMs ?? 420))

    document.body.animate(
      [
        { transform: 'translate(0, 0)' },
        { transform: `translate(${intensity}px, 0)` },
        { transform: `translate(${-intensity}px, 0)` },
        { transform: 'translate(0, 0)' }
      ],
      {
        duration: durationMs,
        iterations: 2,
        easing: 'ease-in-out'
      }
    )
  }
}

export function getRuntimeApi(): EmoTrashApi {
  return window.api ?? browserPreviewApi
}
