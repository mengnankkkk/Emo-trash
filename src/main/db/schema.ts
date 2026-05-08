import type Database from 'better-sqlite3'

export const DIGITAL_GARDEN_SCHEMA = `
  CREATE TABLE IF NOT EXISTS digital_garden (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    flower_type INTEGER NOT NULL,
    color_hex TEXT NOT NULL,
    growth_stage INTEGER DEFAULT 1
  );
`

export function initializeSchema(database: Database.Database): void {
  database.exec(DIGITAL_GARDEN_SCHEMA)
}
