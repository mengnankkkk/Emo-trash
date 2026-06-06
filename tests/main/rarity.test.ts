// @vitest-environment node

import { describe, expect, it } from 'vitest'
import {
  determineRarity,
  getBoostedRarityDefinitions,
  rarityDefinitions
} from '../../src/shared/rarity'

describe('rarity', () => {
  it('稀有度加成会降低普通概率并提高非普通概率', () => {
    const boosted = getBoostedRarityDefinitions(0.1)

    expect(boosted.common.probability).toBeLessThan(rarityDefinitions.common.probability)
    expect(boosted.shiny.probability).toBeGreaterThan(rarityDefinitions.shiny.probability)
    expect(boosted.stellar.probability).toBeGreaterThan(rarityDefinitions.stellar.probability)
    expect(boosted.legendary.probability).toBeGreaterThan(rarityDefinitions.legendary.probability)
  })

  it('稀有度加成不会通过压低随机数反向增加普通花', () => {
    expect(determineRarity(0.8)).toBe('common')
    expect(determineRarity(0.8, 0.1)).toBe('shiny')
  })
})
