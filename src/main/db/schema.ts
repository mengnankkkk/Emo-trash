import type Database from 'better-sqlite3'
import { getEmotionDefinitionByFlowerType } from '../../shared/emotionMeta'
import { parseTimestamp, toDateKey, toHour } from '../../shared/emotionInsights'

export const DIGITAL_GARDEN_SCHEMA = `
  CREATE TABLE IF NOT EXISTS digital_garden (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    flower_type INTEGER NOT NULL,
    color_hex TEXT NOT NULL,
    growth_stage INTEGER DEFAULT 1,
    emotion_tag TEXT DEFAULT 'fatigue',
    emotion_intensity TEXT DEFAULT 'moderate',
    trigger_scene TEXT DEFAULT '',
    guidance_question TEXT DEFAULT '',
    suggested_labels TEXT DEFAULT '[]',
    analysis_confidence REAL DEFAULT 0,
    analysis_source TEXT DEFAULT 'rule-fallback',
    source_model TEXT DEFAULT 'built-in-rules',
    released_on TEXT DEFAULT '',
    released_hour INTEGER DEFAULT 0,
    total_waterings INTEGER DEFAULT 0,
    last_watered_on TEXT DEFAULT ''
  );
`

export const WATERING_LOG_SCHEMA = `
  CREATE TABLE IF NOT EXISTS watering_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    flower_id INTEGER NOT NULL,
    watered_on TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'release'
  );
`

function getColumnNames(database: Database.Database): string[] {
  const rows = database.prepare(`PRAGMA table_info(digital_garden)`).all() as Array<{
    name: string
  }>
  return rows.map((row) => row.name)
}

function ensureColumn(database: Database.Database, columnName: string, definition: string): void {
  const columnNames = getColumnNames(database)
  if (columnNames.includes(columnName)) {
    return
  }

  database.exec(`ALTER TABLE digital_garden ADD COLUMN ${definition}`)
}

function backfillDerivedFields(database: Database.Database): void {
  const rows = database
    .prepare(
      `
        SELECT id, timestamp, flower_type, emotion_tag, released_on, released_hour
        FROM digital_garden
      `
    )
    .all() as Array<{
    id: number
    timestamp: string
    flower_type: number
    emotion_tag: string | null
    released_on: string | null
    released_hour: number | null
  }>

  const update = database.prepare(
    `
      UPDATE digital_garden
      SET emotion_tag = ?, released_on = ?, released_hour = ?
      WHERE id = ?
    `
  )

  const updateMany = database.transaction((entries: typeof rows) => {
    entries.forEach((row) => {
      const date = parseTimestamp(row.timestamp)
      const definition = getEmotionDefinitionByFlowerType(row.flower_type)
      const nextEmotionTag =
        row.emotion_tag && row.emotion_tag.length > 0 ? row.emotion_tag : definition.emotionTag
      const nextReleasedOn =
        row.released_on && row.released_on.length > 0 ? row.released_on : toDateKey(date)
      const nextReleasedHour = Number.isInteger(row.released_hour)
        ? row.released_hour
        : toHour(date)
      update.run(nextEmotionTag, nextReleasedOn, nextReleasedHour, row.id)
    })
  })

  updateMany(rows)
}

function backfillWateringFields(database: Database.Database): void {
  const rows = database
    .prepare(
      `
        SELECT id, growth_stage, released_on, total_waterings
        FROM digital_garden
        WHERE total_waterings = 0
      `
    )
    .all() as Array<{
    id: number
    growth_stage: number
    released_on: string
    total_waterings: number
  }>

  if (rows.length === 0) {
    return
  }

  const stageToWaterings: Record<number, number> = {
    1: 1,
    2: 6,
    3: 16
  }

  const updateFlower = database.prepare(
    `
      UPDATE digital_garden
      SET total_waterings = ?, last_watered_on = ?, growth_stage = ?
      WHERE id = ?
    `
  )

  const insertLog = database.prepare(
    `
      INSERT INTO watering_log (flower_id, watered_on, source)
      VALUES (?, ?, 'release')
    `
  )

  const commit = database.transaction((entries: typeof rows) => {
    entries.forEach((row) => {
      const baseDate = row.released_on && row.released_on.length > 0 ? row.released_on : ''
      const initialWaterings = stageToWaterings[row.growth_stage] ?? 1
      const nextStage =
        row.growth_stage === 1 ? 1 : row.growth_stage === 2 ? 3 : row.growth_stage >= 3 ? 5 : 1

      updateFlower.run(initialWaterings, baseDate, nextStage, row.id)
      insertLog.run(row.id, baseDate)
    })
  })

  commit(rows)
}

export function initializeSchema(database: Database.Database): void {
  database.exec(DIGITAL_GARDEN_SCHEMA)
  database.exec(WATERING_LOG_SCHEMA)
  ensureColumn(database, 'emotion_tag', "emotion_tag TEXT DEFAULT 'fatigue'")
  ensureColumn(database, 'emotion_intensity', "emotion_intensity TEXT DEFAULT 'moderate'")
  ensureColumn(database, 'trigger_scene', "trigger_scene TEXT DEFAULT ''")
  ensureColumn(database, 'guidance_question', "guidance_question TEXT DEFAULT ''")
  ensureColumn(database, 'suggested_labels', "suggested_labels TEXT DEFAULT '[]'")
  ensureColumn(database, 'analysis_confidence', 'analysis_confidence REAL DEFAULT 0')
  ensureColumn(database, 'analysis_source', "analysis_source TEXT DEFAULT 'rule-fallback'")
  ensureColumn(database, 'source_model', "source_model TEXT DEFAULT 'built-in-rules'")
  ensureColumn(database, 'released_on', "released_on TEXT DEFAULT ''")
  ensureColumn(database, 'released_hour', 'released_hour INTEGER DEFAULT 0')
  ensureColumn(database, 'total_waterings', 'total_waterings INTEGER DEFAULT 0')
  ensureColumn(database, 'last_watered_on', "last_watered_on TEXT DEFAULT ''")
  ensureColumn(database, 'picked_on', 'picked_on TEXT')
  ensureColumn(database, 'rarity', "rarity TEXT DEFAULT 'common'")
  backfillDerivedFields(database)
  backfillWateringFields(database)
}
