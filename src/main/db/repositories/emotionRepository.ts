import type Database from 'better-sqlite3'
import type { EmotionTag, FlowerRarity, GardenItem, ReleaseEmotionInput } from '../../../preload/api'
import { emotionAnalysisMetadataSchema, getTimeContextLabel } from '../../../shared/emotionAnalysis'
import { enrichGardenItems } from '../../../shared/emotionInsights'
import { determineRarity } from '../../../shared/rarity'

type GardenRow = {
  id: number
  timestamp: string
  released_on: string
  released_hour: number
  flower_type: number
  color_hex: string
  growth_stage: number
  total_waterings: number
  last_watered_on: string
  emotion_tag: EmotionTag
  rarity: FlowerRarity
  grid_x: number
  grid_y: number
  emotion_intensity?: string | null
  trigger_scene?: string | null
  guidance_question?: string | null
  suggested_labels?: string | null
  analysis_confidence?: number | null
  analysis_source?: string | null
  source_model?: string | null
}

const GARDEN_SELECT_COLUMNS = `
  id, timestamp, released_on, released_hour, flower_type, color_hex, growth_stage,
  total_waterings, last_watered_on, emotion_tag, rarity, grid_x, grid_y,
  emotion_intensity, trigger_scene, guidance_question, suggested_labels,
  analysis_confidence, analysis_source, source_model
`

export class EmotionRepository {
  constructor(private readonly database: Database.Database) {}

  createSeed(
    input: ReleaseEmotionInput,
    timestamp: string,
    releasedOn: string,
    releasedHour: number,
    options?: {
      rarity?: FlowerRarity
      totalWaterings?: number
      lastWateredOn?: string
      gridX?: number
      gridY?: number
    }
  ): GardenItem {
    const rarity = options?.rarity ?? determineRarity()
    const totalWaterings = options?.totalWaterings ?? 1
    const lastWateredOn = options?.lastWateredOn ?? releasedOn
    const gridX = options?.gridX ?? 0
    const gridY = options?.gridY ?? 0

    const result = this.database
      .prepare(
        `
          INSERT INTO digital_garden (
            timestamp, flower_type, color_hex, growth_stage,
            emotion_tag, emotion_intensity, trigger_scene, guidance_question,
            suggested_labels, analysis_confidence, analysis_source, source_model,
            released_on, released_hour, total_waterings, last_watered_on, rarity,
            grid_x, grid_y
          )
          VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
      )
      .run(
        timestamp,
        input.flowerType,
        input.colorHex,
        input.emotionTag,
        input.analysis.emotionIntensity,
        input.analysis.triggerScene,
        input.analysis.guidanceQuestion,
        JSON.stringify(input.analysis.suggestedLabels),
        input.analysis.confidence,
        input.analysis.source,
        input.analysis.sourceModel,
        releasedOn,
        releasedHour,
        totalWaterings,
        lastWateredOn,
        rarity,
        gridX,
        gridY
      )

    const newId = Number(result.lastInsertRowid)
    if (totalWaterings > 0) {
      const insertWateringLog = this.database.prepare(
        `INSERT INTO watering_log (flower_id, watered_on, source) VALUES (?, ?, ?)`
      )

      for (let index = 0; index < totalWaterings; index += 1) {
        insertWateringLog.run(newId, lastWateredOn, index === 0 ? 'release' : 'manual')
      }
    }

    return this.findById(newId)
  }

  listGarden(limit = 24): GardenItem[] {
    const rows = this.database
      .prepare(
        `SELECT ${GARDEN_SELECT_COLUMNS} FROM digital_garden WHERE picked_on IS NULL ORDER BY timestamp DESC, id DESC LIMIT ?`
      )
      .all(limit) as GardenRow[]

    return rows.map((row) => this.mapRow(row))
  }

  listAllGarden(): GardenItem[] {
    const rows = this.database
      .prepare(
        `SELECT ${GARDEN_SELECT_COLUMNS} FROM digital_garden WHERE picked_on IS NULL ORDER BY timestamp DESC, id DESC`
      )
      .all() as GardenRow[]

    return rows.map((row) => this.mapRow(row))
  }

  listAllGardenIncludingPicked(): GardenItem[] {
    const rows = this.database
      .prepare(
        `SELECT ${GARDEN_SELECT_COLUMNS} FROM digital_garden ORDER BY timestamp DESC, id DESC`
      )
      .all() as GardenRow[]

    return rows.map((row) => this.mapRow(row))
  }

  pickFlower(flowerId: number, dateKey: string): void {
    this.database.prepare(`UPDATE digital_garden SET picked_on = ? WHERE id = ?`).run(dateKey, flowerId)
  }

  recordWatering(
    flowerId: number,
    source: 'release' | 'manual',
    dateKey: string,
    growthMultiplier = 1.0
  ): void {
    this.database
      .prepare(`INSERT INTO watering_log (flower_id, watered_on, source) VALUES (?, ?, ?)`)
      .run(flowerId, dateKey, source)

    // 应用成长速度加成
    const wateringIncrement = Math.ceil(1 * growthMultiplier)
    this.database
      .prepare(
        `UPDATE digital_garden SET total_waterings = total_waterings + ?, last_watered_on = ? WHERE id = ?`
      )
      .run(wateringIncrement, dateKey, flowerId)
  }

  getManualWateringCountToday(dateKey: string): number {
    const result = this.database
      .prepare(
        `SELECT COUNT(*) as count FROM watering_log WHERE source = 'manual' AND watered_on = ?`
      )
      .get(dateKey) as { count: number }

    return result.count
  }

  flowerExists(flowerId: number): boolean {
    const row = this.database
      .prepare(`SELECT id FROM digital_garden WHERE id = ? AND picked_on IS NULL`)
      .get(flowerId) as { id: number } | undefined

    return row !== undefined
  }

  isGridOccupied(gridX: number, gridY: number): boolean {
    const row = this.database
      .prepare(
        `
        SELECT id
        FROM digital_garden
        WHERE grid_x = ? AND grid_y = ? AND picked_on IS NULL
      `
      )
      .get(gridX, gridY) as { id: number } | undefined

    return row !== undefined
  }

  findActiveFlowerById(flowerId: number): GardenItem | null {
    const row = this.database
      .prepare(`SELECT ${GARDEN_SELECT_COLUMNS} FROM digital_garden WHERE id = ? AND picked_on IS NULL`)
      .get(flowerId) as GardenRow | undefined

    return row ? this.mapRow(row) : null
  }

  syncGrowthStages(items: GardenItem[]): void {
    const nextItems = enrichGardenItems(items)
    const update = this.database.prepare(`UPDATE digital_garden SET growth_stage = ? WHERE id = ?`)

    const commit = this.database.transaction((entries: GardenItem[]) => {
      entries.forEach((item) => {
        update.run(item.growthStage, item.id)
      })
    })

    commit(nextItems)
  }

  private findById(id: number): GardenItem {
    const row = this.database
      .prepare(`SELECT ${GARDEN_SELECT_COLUMNS} FROM digital_garden WHERE id = ?`)
      .get(id) as GardenRow | undefined

    if (!row) {
      throw new Error(`未找到花园记录：${id}`)
    }

    return this.mapRow(row)
  }

  private mapRow(row: GardenRow): GardenItem {
    const parsedLabels = (() => {
      try {
        return JSON.parse(row.suggested_labels ?? '[]') as string[]
      } catch {
        return []
      }
    })()

    const analysis = emotionAnalysisMetadataSchema.safeParse({
      emotionIntensity: row.emotion_intensity ?? 'moderate',
      triggerScene: row.trigger_scene ?? '日常情绪波动',
      guidanceQuestion: row.guidance_question ?? '发生了什么让你有这样的感受？',
      suggestedLabels: parsedLabels,
      confidence: row.analysis_confidence ?? 0,
      timeContextHour: row.released_hour,
      timeContextLabel: getTimeContextLabel(row.released_hour),
      source: row.analysis_source ?? 'rule-fallback',
      sourceModel: row.source_model ?? 'built-in-rules'
    })

    return {
      id: row.id,
      timestamp: row.timestamp,
      releasedOn: row.released_on,
      releasedHour: row.released_hour,
      flowerType: row.flower_type,
      colorHex: row.color_hex,
      growthStage: row.growth_stage,
      totalWaterings: row.total_waterings ?? 0,
      lastWateredOn: row.last_watered_on ?? '',
      emotionTag: row.emotion_tag,
      rarity: row.rarity ?? 'common',
      gridX: row.grid_x ?? 0,
      gridY: row.grid_y ?? 0,
      analysis: analysis.success ? analysis.data : undefined
    }
  }

  updateFlowerPosition(flowerId: number, gridX: number, gridY: number): void {
    this.database
      .prepare(
        `
        UPDATE digital_garden
        SET grid_x = ?, grid_y = ?
        WHERE id = ?
      `
      )
      .run(gridX, gridY, flowerId)
  }
}
