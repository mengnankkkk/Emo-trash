import { app } from 'electron'
import Database from 'better-sqlite3'
import { join } from 'path'
import { initializeSchema } from './schema'

let database: Database.Database | null = null

export function initDatabase(): Database.Database {
  if (database) {
    return database
  }

  const databasePath = join(app.getPath('userData'), 'emo-trash.db')
  const instance = new Database(databasePath)

  instance.pragma('journal_mode = WAL')
  initializeSchema(instance)

  database = instance
  return instance
}

export function getDatabase(): Database.Database {
  if (!database) {
    throw new Error('数据库尚未初始化')
  }

  return database
}

export function closeDatabase(): void {
  database?.close()
  database = null
}
