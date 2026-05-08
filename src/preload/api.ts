import { z } from 'zod'

export const emoTrashChannels = {
  releaseEmotion: 'emotion:release',
  listGarden: 'garden:list',
  triggerShake: 'window:shake'
} as const

export const releaseEmotionInputSchema = z.object({
  textLength: z.number().int().nonnegative(),
  exclamationDensity: z.number().min(0).max(1),
  emphasisLevel: z.number().int().min(0).max(12),
  flowerType: z.number().int().min(1).max(6),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/)
})

export const gardenItemSchema = z.object({
  id: z.number().int().positive(),
  timestamp: z.string(),
  flowerType: z.number().int().min(1).max(6),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  growthStage: z.number().int().min(1)
})

export const shakeWindowInputSchema = z.object({
  intensity: z.number().min(4).max(32).default(14),
  durationMs: z.number().min(120).max(1000).default(420)
})

export type ReleaseEmotionInput = z.infer<typeof releaseEmotionInputSchema>
export type GardenItem = z.infer<typeof gardenItemSchema>
export type ShakeWindowInput = z.infer<typeof shakeWindowInputSchema>

export interface EmoTrashApi {
  releaseEmotion(input: ReleaseEmotionInput): Promise<GardenItem[]>
  listGarden(): Promise<GardenItem[]>
  triggerShake(input?: Partial<ShakeWindowInput>): Promise<void>
}
