// @vitest-environment node

import { readFileSync } from 'fs'
import { describe, expect, it } from 'vitest'
import { DIGITAL_GARDEN_SCHEMA } from '../../src/main/db/schema'

describe('EmotionRepository 持久化契约', () => {
  it('schema 只包含花朵结果字段，不包含原文字段', () => {
    expect(DIGITAL_GARDEN_SCHEMA).toContain('digital_garden')
    expect(DIGITAL_GARDEN_SCHEMA).toContain('flower_type INTEGER NOT NULL')
    expect(DIGITAL_GARDEN_SCHEMA).toContain('color_hex TEXT NOT NULL')
    expect(DIGITAL_GARDEN_SCHEMA).toContain('growth_stage INTEGER DEFAULT 1')
    const columnNames =
      DIGITAL_GARDEN_SCHEMA.match(/^\s*([a-z_]+)\s+/gim)?.map(
        (line) => line.trim().split(/\s+/)[0]
      ) ?? []

    expect(columnNames).not.toContain('text')
    expect(columnNames).not.toContain('content')
  })

  it('仓储写入仅使用花朵类型和颜色', () => {
    const source = readFileSync('src/main/db/repositories/emotionRepository.ts', 'utf8')

    expect(source).toContain('INSERT INTO digital_garden')
    expect(source).toContain('flower_type, color_hex, growth_stage')
    expect(source).toContain('input.flowerType, input.colorHex')
    expect(source).not.toContain('input.text')
    expect(source).not.toContain('input.content')
  })
})
