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
    released_on TEXT DEFAULT '',
    released_hour INTEGER DEFAULT 0
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

export function initializeSchema(database: Database.Database): void {
  database.exec(DIGITAL_GARDEN_SCHEMA)
  ensureColumn(database, 'emotion_tag', "emotion_tag TEXT DEFAULT 'fatigue'")
  ensureColumn(database, 'released_on', "released_on TEXT DEFAULT ''")
  ensureColumn(database, 'released_hour', 'released_hour INTEGER DEFAULT 0')
  backfillDerivedFields(database)
}
