import type Database from 'better-sqlite3'
import type { DecorationType, PlacedDecoration } from '../../../shared/gardenDecoration'
import type { EmotionBattleMatch } from '../../../shared/emotionBattle'
import { toDateKey } from '../../../shared/emotionInsights'

interface DecorationRow {
  id: number
  type: string
  unlocked_at: string
}

interface PlacedDecorationRow {
  id: number
  decoration_id: number
  position_x: number
  position_y: number
  placed_at: string
  type: string
}

interface EmotionBattleRow {
  id: number
  flower_id_1: number
  flower_id_2: number
  emotion_pair: string
  matched_at: string
  rarity_boost: number
}

/**
 * 装饰物和情绪对抗数据访问层
 */
export class DecorationBattleRepository {
  constructor(private database: Database.Database) {}

  /**
   * 获取用户拥有的装饰物
   */
  getOwnedDecorations(): DecorationType[] {
    const rows = this.database
      .prepare('SELECT type FROM decoration ORDER BY unlocked_at ASC')
      .all() as DecorationRow[]

    return rows.map((row) => row.type as DecorationType)
  }

  /**
   * 解锁装饰物
   */
  unlockDecoration(type: DecorationType): void {
    const existing = this.database.prepare('SELECT id FROM decoration WHERE type = ?').get(type) as
      | DecorationRow
      | undefined

    if (existing) {
      return
    }

    this.database
      .prepare('INSERT INTO decoration (type, unlocked_at) VALUES (?, ?)')
      .run(type, toDateKey(new Date()))
  }

  /**
   * 获取已放置的装饰物
   */
  getPlacedDecorations(): PlacedDecoration[] {
    const rows = this.database
      .prepare(
        `
        SELECT
          pd.id,
          pd.decoration_id,
          pd.position_x,
          pd.position_y,
          pd.placed_at,
          d.type
        FROM placed_decoration pd
        JOIN decoration d ON pd.decoration_id = d.id
        ORDER BY pd.placed_at ASC
      `
      )
      .all() as PlacedDecorationRow[]

    return rows.map((row) => ({
      id: row.id,
      type: row.type as DecorationType,
      positionX: row.position_x,
      positionY: row.position_y,
      placedAt: row.placed_at
    }))
  }

  /**
   * 放置装饰物
   */
  placeDecoration(type: DecorationType, positionX: number, positionY: number): PlacedDecoration {
    const decoration = this.database
      .prepare('SELECT id FROM decoration WHERE type = ?')
      .get(type) as DecorationRow | undefined

    if (!decoration) {
      throw new Error(`Decoration ${type} not unlocked`)
    }

    const placedAt = toDateKey(new Date())
    const result = this.database
      .prepare(
        `
        INSERT INTO placed_decoration (decoration_id, position_x, position_y, placed_at)
        VALUES (?, ?, ?, ?)
      `
      )
      .run(decoration.id, positionX, positionY, placedAt)

    return {
      id: result.lastInsertRowid as number,
      type,
      positionX,
      positionY,
      placedAt
    }
  }

  /**
   * 移除已放置的装饰物
   */
  removePlacedDecoration(placedId: number): void {
    this.database.prepare('DELETE FROM placed_decoration WHERE id = ?').run(placedId)
  }

  /**
   * 移动已放置的装饰物
   */
  movePlacedDecoration(placedId: number, positionX: number, positionY: number): PlacedDecoration {
    // 获取装饰物信息
    const placed = this.database
      .prepare(
        `
        SELECT pd.id, pd.decoration_id, d.type
        FROM placed_decoration pd
        JOIN decoration d ON pd.decoration_id = d.id
        WHERE pd.id = ?
      `
      )
      .get(placedId) as PlacedDecorationRow | undefined

    if (!placed) {
      throw new Error(`Placed decoration ${placedId} not found`)
    }

    // 更新位置
    this.database
      .prepare('UPDATE placed_decoration SET position_x = ?, position_y = ? WHERE id = ?')
      .run(positionX, positionY, placedId)

    return {
      id: placedId,
      type: placed.type as DecorationType,
      positionX,
      positionY,
      placedAt: placed.placed_at
    }
  }

  /**
   * 记录情绪对抗匹配
   */
  recordEmotionBattle(match: EmotionBattleMatch): void {
    const existing = this.database
      .prepare(
        `
        SELECT id FROM emotion_battle
        WHERE (flower_id_1 = ? AND flower_id_2 = ?)
           OR (flower_id_1 = ? AND flower_id_2 = ?)
      `
      )
      .get(match.flowerId1, match.flowerId2, match.flowerId2, match.flowerId1) as
      | EmotionBattleRow
      | undefined

    if (existing) {
      return
    }

    const pairKey = `${match.emotionPair.emotion1}-${match.emotionPair.emotion2}`

    this.database
      .prepare(
        `
        INSERT INTO emotion_battle (flower_id_1, flower_id_2, emotion_pair, matched_at, rarity_boost)
        VALUES (?, ?, ?, ?, ?)
      `
      )
      .run(match.flowerId1, match.flowerId2, pairKey, match.matchedAt, match.rarityBoost)
  }

  /**
   * 获取所有情绪对抗记录
   */
  getEmotionBattles(): EmotionBattleRow[] {
    return this.database
      .prepare('SELECT * FROM emotion_battle ORDER BY matched_at DESC')
      .all() as EmotionBattleRow[]
  }

  /**
   * 获取情绪对抗统计
   */
  getEmotionBattleCount(): number {
    const result = this.database.prepare('SELECT COUNT(*) as count FROM emotion_battle').get() as {
      count: number
    }

    return result.count
  }
}
