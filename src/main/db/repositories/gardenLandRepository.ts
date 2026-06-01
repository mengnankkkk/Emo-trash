import type Database from 'better-sqlite3'

export interface GardenLandCell {
  id: number
  gridX: number
  gridY: number
  unlocked: boolean
  unlockedAt: string
}

export class GardenLandRepository {
  constructor(private readonly database: Database.Database) {}

  /**
   * 获取所有土地格子
   */
  getAllLands(): GardenLandCell[] {
    const rows = this.database
      .prepare(
        `
        SELECT id, grid_x, grid_y, unlocked, unlocked_at
        FROM garden_land
        ORDER BY grid_y, grid_x
      `
      )
      .all() as Array<{
      id: number
      grid_x: number
      grid_y: number
      unlocked: number
      unlocked_at: string
    }>

    return rows.map((row) => ({
      id: row.id,
      gridX: row.grid_x,
      gridY: row.grid_y,
      unlocked: row.unlocked === 1,
      unlockedAt: row.unlocked_at
    }))
  }

  /**
   * 获取已解锁的土地数量
   */
  getUnlockedCount(): number {
    const result = this.database
      .prepare('SELECT COUNT(*) as count FROM garden_land WHERE unlocked = 1')
      .get() as { count: number }

    return result.count
  }

  /**
   * 解锁指定土地（不包含金币扣除逻辑，由上层处理）
   */
  unlockLand(gridX: number, gridY: number): boolean {
    const now = new Date().toISOString()

    const result = this.database
      .prepare(
        `
        UPDATE garden_land
        SET unlocked = 1, unlocked_at = ?
        WHERE grid_x = ? AND grid_y = ? AND unlocked = 0
      `
      )
      .run(now, gridX, gridY)

    return result.changes > 0
  }

  /**
   * 获取解锁土地的金币价格
   */
  getUnlockPrice(): number {
    // 每块土地100金币
    return 100
  }

  /**
   * 检查指定位置是否已解锁
   */
  isLandUnlocked(gridX: number, gridY: number): boolean {
    const result = this.database
      .prepare(
        `
        SELECT unlocked
        FROM garden_land
        WHERE grid_x = ? AND grid_y = ?
      `
      )
      .get(gridX, gridY) as { unlocked: number } | undefined

    return result?.unlocked === 1
  }

  /**
   * 获取指定位置的土地信息
   */
  getLandAt(gridX: number, gridY: number): GardenLandCell | null {
    const row = this.database
      .prepare(
        `
        SELECT id, grid_x, grid_y, unlocked, unlocked_at
        FROM garden_land
        WHERE grid_x = ? AND grid_y = ?
      `
      )
      .get(gridX, gridY) as
      | {
          id: number
          grid_x: number
          grid_y: number
          unlocked: number
          unlocked_at: string
        }
      | undefined

    if (!row) {
      return null
    }

    return {
      id: row.id,
      gridX: row.grid_x,
      gridY: row.grid_y,
      unlocked: row.unlocked === 1,
      unlockedAt: row.unlocked_at
    }
  }
}
