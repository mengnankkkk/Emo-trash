import type Database from 'better-sqlite3'
import type { EmotionTag, GardenItem, ReleaseEmotionInput } from '../../../preload/api'
import { enrichGardenItems } from '../../../shared/emotionInsights'

type GardenRow = {
  id: number
  timestamp: string
  released_on: string
  released_hour: number
  flower_type: number
  color_hex: string
  growth_stage: number
  emotion_tag: EmotionTag
}

export class EmotionRepository {
  constructor(private readonly database: Database.Database) {}

  createSeed(
    input: ReleaseEmotionInput,
    timestamp: string,
    releasedOn: string,
    releasedHour: number
  ): GardenItem {
    const result = this.database
      .prepare(
        `
          INSERT INTO digital_garden (
            timestamp,
            flower_type,
            color_hex,
            growth_stage,
            emotion_tag,
            released_on,
            released_hour
          )
          VALUES (?, ?, ?, 1, ?, ?, ?)
        `
      )
      .run(timestamp, input.flowerType, input.colorHex, input.emotionTag, releasedOn, releasedHour)

    return this.findById(Number(result.lastInsertRowid))
  }

  listGarden(limit = 24): GardenItem[] {
    const rows = this.database
      .prepare(
        `
          SELECT id, timestamp, released_on, released_hour, flower_type, color_hex, growth_stage, emotion_tag
          FROM digital_garden
          ORDER BY timestamp DESC, id DESC
          LIMIT ?
        `
      )
      .all(limit) as GardenRow[]

    return rows.map((row) => this.mapRow(row))
  }

  listAllGarden(): GardenItem[] {
    const rows = this.database
      .prepare(
        `
          SELECT id, timestamp, released_on, released_hour, flower_type, color_hex, growth_stage, emotion_tag
          FROM digital_garden
          ORDER BY timestamp DESC, id DESC
        `
      )
      .all() as GardenRow[]

    return rows.map((row) => this.mapRow(row))
  }

  syncGrowthStages(items: GardenItem[]): void {
    const nextItems = enrichGardenItems(items)
    const update = this.database.prepare(
      `
        UPDATE digital_garden
        SET growth_stage = ?
        WHERE id = ?
      `
    )

    const commit = this.database.transaction((entries: GardenItem[]) => {
      entries.forEach((item) => {
        update.run(item.growthStage, item.id)
      })
    })

    commit(nextItems)
  }

  private findById(id: number): GardenItem {
    const row = this.database
      .prepare(
        `
          SELECT id, timestamp, released_on, released_hour, flower_type, color_hex, growth_stage, emotion_tag
          FROM digital_garden
          WHERE id = ?
        `
      )
      .get(id) as GardenRow | undefined

    if (!row) {
      throw new Error(`未找到花园记录：${id}`)
    }

    return this.mapRow(row)
  }

  private mapRow(row: GardenRow): GardenItem {
    return {
      id: row.id,
      timestamp: row.timestamp,
      releasedOn: row.released_on,
      releasedHour: row.released_hour,
      flowerType: row.flower_type,
      colorHex: row.color_hex,
      growthStage: row.growth_stage,
      emotionTag: row.emotion_tag
    }
  }
}
