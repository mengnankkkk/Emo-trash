// @vitest-environment node

import { readFileSync } from 'fs'
import { describe, expect, it } from 'vitest'
import { DIGITAL_GARDEN_SCHEMA } from '../../src/main/db/schema'

describe('EmotionRepository 持久化契约', () => {
  it('schema 包含统计与成长所需字段，仍不包含原文字段', () => {
    expect(DIGITAL_GARDEN_SCHEMA).toContain('digital_garden')
    expect(DIGITAL_GARDEN_SCHEMA).toContain('flower_type INTEGER NOT NULL')
    expect(DIGITAL_GARDEN_SCHEMA).toContain('color_hex TEXT NOT NULL')
    expect(DIGITAL_GARDEN_SCHEMA).toContain('growth_stage INTEGER DEFAULT 1')
    expect(DIGITAL_GARDEN_SCHEMA).toContain("emotion_tag TEXT DEFAULT 'fatigue'")
    expect(DIGITAL_GARDEN_SCHEMA).toContain("released_on TEXT DEFAULT ''")
    expect(DIGITAL_GARDEN_SCHEMA).toContain('released_hour INTEGER DEFAULT 0')

    const columnNames =
      DIGITAL_GARDEN_SCHEMA.match(/^\s*([a-z_]+)\s+/gim)?.map(
        (line) => line.trim().split(/\s+/)[0]
      ) ?? []

    expect(columnNames).not.toContain('text')
    expect(columnNames).not.toContain('content')
  })

  it('仓储写入包含情绪与时间衍生字段，但仍不写入原文', () => {
    const source = readFileSync('src/main/db/repositories/emotionRepository.ts', 'utf8')

    expect(source).toContain('INSERT INTO digital_garden')
    expect(source).toContain('timestamp,')
    expect(source).toContain('emotion_tag')
    expect(source).toContain('released_on')
    expect(source).toContain('released_hour')
    expect(source).toContain('input.emotionTag')
    expect(source).not.toContain('input.text')
    expect(source).not.toContain('input.content')
  })
})
