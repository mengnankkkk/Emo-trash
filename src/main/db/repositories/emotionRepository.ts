import type Database from 'better-sqlite3'
import type { GardenItem, ReleaseEmotionInput } from '../../../preload/api'

type GardenRow = {
  id: number
  timestamp: string
  flower_type: number
  color_hex: string
  growth_stage: number
}

export class EmotionRepository {
  constructor(private readonly database: Database.Database) {}

  createSeed(input: ReleaseEmotionInput): GardenItem {
    const result = this.database
      .prepare(
        `
          INSERT INTO digital_garden (flower_type, color_hex, growth_stage)
          VALUES (?, ?, 1)
        `
      )
      .run(input.flowerType, input.colorHex)

    return this.findById(Number(result.lastInsertRowid))
  }

  listGarden(limit = 24): GardenItem[] {
    const rows = this.database
      .prepare(
        `
          SELECT id, timestamp, flower_type, color_hex, growth_stage
          FROM digital_garden
          ORDER BY id DESC
          LIMIT ?
        `
      )
      .all(limit) as GardenRow[]

    return rows.map((row) => this.mapRow(row))
  }

  private findById(id: number): GardenItem {
    const row = this.database
      .prepare(
        `
          SELECT id, timestamp, flower_type, color_hex, growth_stage
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
      flowerType: row.flower_type,
      colorHex: row.color_hex,
      growthStage: row.growth_stage
    }
  }
}
