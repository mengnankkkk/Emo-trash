import type { GardenItem, ReleaseEmotionInput } from '../../preload/api'
import { EmotionRepository } from '../db/repositories/emotionRepository'

export class ReleaseService {
  constructor(private readonly emotionRepository: EmotionRepository) {}

  releaseEmotion(input: ReleaseEmotionInput): GardenItem[] {
    this.emotionRepository.createSeed(input)
    return this.emotionRepository.listGarden()
  }

  listGarden(): GardenItem[] {
    return this.emotionRepository.listGarden()
  }
}
