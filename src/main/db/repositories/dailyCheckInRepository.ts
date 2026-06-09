import type Database from 'better-sqlite3'

export interface DailyCheckInRecord {
  id: number
  checkedOn: string
  rewardType: string
  rewardAmount: number
  emotionTag: string
  rarity: string
  claimedAt: string
}

interface DailyCheckInRow {
  id: number
  checked_on: string
  reward_type: string
  reward_amount: number
  emotion_tag: string
  rarity: string
  claimed_at: string
}

function toPreviousDateKey(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00`)
  date.setDate(date.getDate() - 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`
}

function mapRecord(row: DailyCheckInRow): DailyCheckInRecord {
  return {
    id: row.id,
    checkedOn: row.checked_on,
    rewardType: row.reward_type,
    rewardAmount: row.reward_amount,
    emotionTag: row.emotion_tag,
    rarity: row.rarity,
    claimedAt: row.claimed_at
  }
}

export class DailyCheckInRepository {
  constructor(private readonly database: Database.Database) {}

  hasCheckedIn(dateKey: string): boolean {
    const result = this.database
      .prepare('SELECT id FROM daily_checkin WHERE checked_on = ?')
      .get(dateKey) as { id: number } | undefined

    return !!result
  }

  getLastRecord(): DailyCheckInRecord | null {
    const row = this.database
      .prepare(
        `
        SELECT id, checked_on, reward_type, reward_amount, emotion_tag, rarity, claimed_at
        FROM daily_checkin
        ORDER BY checked_on DESC
        LIMIT 1
      `
      )
      .get() as DailyCheckInRow | undefined

    return row ? mapRecord(row) : null
  }

  recordCheckIn(input: {
    dateKey: string
    rewardType: string
    rewardAmount?: number
    emotionTag?: string
    rarity?: string
  }): boolean {
    const result = this.database
      .prepare(
        `
        INSERT OR IGNORE INTO daily_checkin
          (checked_on, reward_type, reward_amount, emotion_tag, rarity, claimed_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `
      )
      .run(
        input.dateKey,
        input.rewardType,
        input.rewardAmount ?? 0,
        input.emotionTag ?? '',
        input.rarity ?? '',
        new Date().toISOString()
      )

    return result.changes > 0
  }

  getCurrentStreak(todayKey: string): number {
    const rows = this.database
      .prepare(
        `
        SELECT checked_on
        FROM daily_checkin
        ORDER BY checked_on DESC
        LIMIT 120
      `
      )
      .all() as Array<{ checked_on: string }>

    const checkedDays = new Set(rows.map((row) => row.checked_on))
    let cursor = checkedDays.has(todayKey) ? todayKey : toPreviousDateKey(todayKey)
    let streak = 0

    while (checkedDays.has(cursor)) {
      streak += 1
      cursor = toPreviousDateKey(cursor)
    }

    return streak
  }
}
