import type Database from 'better-sqlite3'
import type { EmotionTag, GardenItem, ReleaseEmotionInput } from '../../../preload/api'
import { emotionAnalysisMetadataSchema, getTimeContextLabel } from '../../../shared/emotionAnalysis'
import { enrichGardenItems } from '../../../shared/emotionInsights'
import { determineRarity, type FlowerRarity } from '../../../shared/rarity'

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
  total_waterings, last_watered_on, emotion_tag, rarity,
  emotion_intensity, trigger_scene, guidance_question, suggested_labels,
  analysis_confidence, analysis_source, source_model
`

export class EmotionRepository {
  constructor(private readonly database: Database.Database) {}

  createSeed(
    input: ReleaseEmotionInput,
    timestamp: string,
    releasedOn: string,
    releasedHour: number
  ): GardenItem {
    const rarity = determineRarity()
    const result = this.database
      .prepare(
        `
          INSERT INTO digital_garden (
            timestamp, flower_type, color_hex, growth_stage,
            emotion_tag, emotion_intensity, trigger_scene, guidance_question,
            suggested_labels, analysis_confidence, analysis_source, source_model,
            released_on, released_hour, total_waterings, last_watered_on, rarity
          )
          VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
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
        releasedOn,
        rarity
      )

    const newId = Number(result.lastInsertRowid)
    this.database
      .prepare(`INSERT INTO watering_log (flower_id, watered_on, source) VALUES (?, ?, 'release')`)
      .run(newId, releasedOn)

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
    this.database
      .prepare(`UPDATE digital_garden SET picked_on = ? WHERE id = ?`)
      .run(dateKey, flowerId)
  }

  recordWatering(flowerId: number, source: 'release' | 'manual', dateKey: string): void {
    this.database
      .prepare(`INSERT INTO watering_log (flower_id, watered_on, source) VALUES (?, ?, ?)`)
      .run(flowerId, dateKey, source)

    this.database
      .prepare(
        `UPDATE digital_garden SET total_waterings = total_waterings + 1, last_watered_on = ? WHERE id = ?`
      )
      .run(dateKey, flowerId)
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
      .prepare(`SELECT id FROM digital_garden WHERE id = ?`)
      .get(flowerId) as { id: number } | undefined

    return row !== undefined
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
      analysis: analysis.success ? analysis.data : undefined
    }
  }
}
