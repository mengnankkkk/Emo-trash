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

export const EMOTION_BATTLE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS emotion_battle (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    flower_id_1 INTEGER NOT NULL,
    flower_id_2 INTEGER NOT NULL,
    emotion_pair TEXT NOT NULL,
    matched_at TEXT NOT NULL,
    rarity_boost REAL DEFAULT 0.05
  );
`

export const DECORATION_SCHEMA = `
  CREATE TABLE IF NOT EXISTS decoration (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    unlocked_at TEXT NOT NULL
  );
`

export const PLACED_DECORATION_SCHEMA = `
  CREATE TABLE IF NOT EXISTS placed_decoration (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    decoration_id INTEGER NOT NULL,
    position_x REAL NOT NULL,
    position_y REAL NOT NULL,
    placed_at TEXT NOT NULL,
    FOREIGN KEY (decoration_id) REFERENCES decoration(id)
  );
`

export const GARDEN_LAND_SCHEMA = `
  CREATE TABLE IF NOT EXISTS garden_land (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    grid_x INTEGER NOT NULL,
    grid_y INTEGER NOT NULL,
    unlocked BOOLEAN DEFAULT 0,
    unlocked_at TEXT DEFAULT '',
    UNIQUE(grid_x, grid_y)
  );
`

export const USER_CURRENCY_SCHEMA = `
  CREATE TABLE IF NOT EXISTS user_currency (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    balance INTEGER DEFAULT 0,
    updated_at TEXT NOT NULL
  );
`

export const CURRENCY_TRANSACTION_SCHEMA = `
  CREATE TABLE IF NOT EXISTS currency_transaction (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    transaction_type TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`

export const SEED_INVENTORY_SCHEMA = `
  CREATE TABLE IF NOT EXISTS seed_inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    emotion_tag TEXT NOT NULL,
    rarity TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    obtained_at TEXT NOT NULL
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

function initializeGardenLand(database: Database.Database): void {
  // 检查是否已经初始化过土地
  const count = database.prepare('SELECT COUNT(*) as count FROM garden_land').get() as {
    count: number
  }

  if (count.count > 0) {
    return
  }

  // 初始化6x4=24块土地，中心4块默认解锁
  const insert = database.prepare(`
    INSERT INTO garden_land (grid_x, grid_y, unlocked, unlocked_at)
    VALUES (?, ?, ?, ?)
  `)

  const now = new Date().toISOString()
  const insertMany = database.transaction(() => {
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 6; x++) {
        // 中心4块地默认解锁 (x: 2,3, y: 1,2)
        const isCenter = (x === 2 || x === 3) && (y === 1 || y === 2)
        insert.run(x, y, isCenter ? 1 : 0, isCenter ? now : '')
      }
    }
  })

  insertMany()
}

function initializeUserCurrency(database: Database.Database): void {
  // 检查是否已经初始化过货币
  const count = database.prepare('SELECT COUNT(*) as count FROM user_currency').get() as {
    count: number
  }

  if (count.count > 0) {
    return
  }

  // 初始化用户货币，起始金币100
  const now = new Date().toISOString()
  database
    .prepare(
      `
    INSERT INTO user_currency (balance, updated_at)
    VALUES (100, ?)
  `
    )
    .run(now)

  // 记录初始交易
  database
    .prepare(
      `
    INSERT INTO currency_transaction (amount, balance_after, transaction_type, description, created_at)
    VALUES (100, 100, 'initial', '初始金币', ?)
  `
    )
    .run(now)
}

export function initializeSchema(database: Database.Database): void {
  database.exec(DIGITAL_GARDEN_SCHEMA)
  database.exec(WATERING_LOG_SCHEMA)
  database.exec(EMOTION_BATTLE_SCHEMA)
  database.exec(DECORATION_SCHEMA)
  database.exec(PLACED_DECORATION_SCHEMA)
  database.exec(GARDEN_LAND_SCHEMA)
  database.exec(USER_CURRENCY_SCHEMA)
  database.exec(CURRENCY_TRANSACTION_SCHEMA)
  database.exec(SEED_INVENTORY_SCHEMA)
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
  ensureColumn(database, 'grid_x', 'grid_x INTEGER DEFAULT 0')
  ensureColumn(database, 'grid_y', 'grid_y INTEGER DEFAULT 0')
  backfillDerivedFields(database)
  backfillWateringFields(database)
  initializeGardenLand(database)
  initializeUserCurrency(database)
}
