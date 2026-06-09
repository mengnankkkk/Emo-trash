import type Database from 'better-sqlite3'
import type { EmotionTag } from '../../../shared/emotionMeta'
import type { FlowerRarity } from '../../../shared/rarity'

export interface SeedInventoryItem {
  id: number
  emotionTag: string
  rarity: string
  quantity: number
  obtainedAt: string
}

export class SeedInventoryRepository {
  constructor(private readonly database: Database.Database) {}

  /**
   * 添加种子到背包
   */
  addSeed(emotionTag: EmotionTag, rarity: FlowerRarity, quantity = 1): void {
    const now = new Date().toISOString()
    const normalizedQuantity = Math.max(1, Math.floor(quantity))

    // 检查是否已有相同类型和稀有度的种子
    const existing = this.database
      .prepare(
        `
        SELECT id, quantity FROM seed_inventory
        WHERE emotion_tag = ? AND rarity = ?
      `
      )
      .get(emotionTag, rarity) as { id: number; quantity: number } | undefined

    if (existing) {
      // 增加数量
      this.database
        .prepare(
          `
          UPDATE seed_inventory
          SET quantity = quantity + ?
          WHERE id = ?
        `
        )
        .run(normalizedQuantity, existing.id)
    } else {
      // 新增种子
      this.database
        .prepare(
          `
          INSERT INTO seed_inventory (emotion_tag, rarity, quantity, obtained_at)
          VALUES (?, ?, ?, ?)
        `
        )
        .run(emotionTag, rarity, normalizedQuantity, now)
    }
  }

  /**
   * 使用种子（播种）
   */
  useSeed(emotionTag: EmotionTag, rarity: FlowerRarity, quantity = 1): boolean {
    const normalizedQuantity = Math.max(1, Math.floor(quantity))
    const existing = this.database
      .prepare(
        `
        SELECT id, quantity FROM seed_inventory
        WHERE emotion_tag = ? AND rarity = ?
      `
      )
      .get(emotionTag, rarity) as { id: number; quantity: number } | undefined

    if (!existing || existing.quantity < normalizedQuantity) {
      return false // 没有种子
    }

    if (existing.quantity === normalizedQuantity) {
      // 删除记录
      this.database
        .prepare(
          `
          DELETE FROM seed_inventory WHERE id = ?
        `
        )
        .run(existing.id)
    } else {
      // 减少数量
      this.database
        .prepare(
          `
          UPDATE seed_inventory
          SET quantity = quantity - ?
          WHERE id = ?
        `
        )
        .run(normalizedQuantity, existing.id)
    }

    return true
  }

  /**
   * 获取所有种子
   */
  getAllSeeds(): SeedInventoryItem[] {
    const rows = this.database
      .prepare(
        `
        SELECT id, emotion_tag, rarity, quantity, obtained_at
        FROM seed_inventory
        WHERE quantity > 0
        ORDER BY obtained_at DESC
      `
      )
      .all() as Array<{
      id: number
      emotion_tag: string
      rarity: string
      quantity: number
      obtained_at: string
    }>

    return rows.map((row) => ({
      id: row.id,
      emotionTag: row.emotion_tag,
      rarity: row.rarity,
      quantity: row.quantity,
      obtainedAt: row.obtained_at
    }))
  }

  /**
   * 获取特定种子的数量
   */
  getSeedCount(emotionTag: EmotionTag, rarity: FlowerRarity): number {
    const result = this.database
      .prepare(
        `
        SELECT quantity FROM seed_inventory
        WHERE emotion_tag = ? AND rarity = ?
      `
      )
      .get(emotionTag, rarity) as { quantity: number } | undefined

    return result?.quantity ?? 0
  }

  /**
   * 获取种子总数
   */
  getTotalSeedCount(): number {
    const result = this.database
      .prepare(
        `
        SELECT SUM(quantity) as total FROM seed_inventory
      `
      )
      .get() as { total: number | null } | undefined

    return result?.total ?? 0
  }
}
