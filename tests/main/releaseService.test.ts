// @vitest-environment node

import { describe, expect, it, vi } from 'vitest'
import { ReleaseService } from '../../src/main/services/releaseService'

describe('ReleaseService', () => {
  it('在释放后返回最新花园列表', () => {
    const createSeed = vi.fn()
    const listGarden = vi.fn().mockReturnValue([
      {
        id: 3,
        timestamp: '2026-05-07 21:00:00',
        flowerType: 2,
        colorHex: '#fb7185',
        growthStage: 1
      }
    ])

    const service = new ReleaseService({ createSeed, listGarden } as never)

    const result = service.releaseEmotion({
      textLength: 12,
      exclamationDensity: 0.25,
      emphasisLevel: 4,
      flowerType: 2,
      colorHex: '#fb7185'
    })

    expect(createSeed).toHaveBeenCalledTimes(1)
    expect(result).toEqual([
      {
        id: 3,
        timestamp: '2026-05-07 21:00:00',
        flowerType: 2,
        colorHex: '#fb7185',
        growthStage: 1
      }
    ])
  })
})
