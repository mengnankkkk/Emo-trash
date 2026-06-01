import type Database from 'better-sqlite3'

export interface CurrencyBalance {
  balance: number
  updatedAt: string
}

export interface CurrencyTransaction {
  id: number
  amount: number
  balanceAfter: number
  transactionType: string
  description: string
  createdAt: string
}

export type TransactionType = 'earn' | 'spend' | 'initial'

export class CurrencyRepository {
  constructor(private readonly database: Database.Database) {}

  /**
   * 获取当前金币余额
   */
  getBalance(): number {
    const result = this.database
      .prepare('SELECT balance FROM user_currency ORDER BY id DESC LIMIT 1')
      .get() as { balance: number } | undefined

    return result?.balance ?? 0
  }

  /**
   * 增加金币（赚取）
   */
  addCurrency(amount: number, description: string): CurrencyBalance {
    const currentBalance = this.getBalance()
    const newBalance = currentBalance + amount
    const now = new Date().toISOString()

    // 更新余额
    this.database
      .prepare('UPDATE user_currency SET balance = ?, updated_at = ? WHERE id = 1')
      .run(newBalance, now)

    // 记录交易
    this.database
      .prepare(
        `
        INSERT INTO currency_transaction (amount, balance_after, transaction_type, description, created_at)
        VALUES (?, ?, 'earn', ?, ?)
      `
      )
      .run(amount, newBalance, description, now)

    return { balance: newBalance, updatedAt: now }
  }

  /**
   * 扣除金币（消费）
   */
  spendCurrency(amount: number, description: string): CurrencyBalance | null {
    const currentBalance = this.getBalance()

    if (currentBalance < amount) {
      return null // 余额不足
    }

    const newBalance = currentBalance - amount
    const now = new Date().toISOString()

    // 更新余额
    this.database
      .prepare('UPDATE user_currency SET balance = ?, updated_at = ? WHERE id = 1')
      .run(newBalance, now)

    // 记录交易（金额为负数）
    this.database
      .prepare(
        `
        INSERT INTO currency_transaction (amount, balance_after, transaction_type, description, created_at)
        VALUES (?, ?, 'spend', ?, ?)
      `
      )
      .run(-amount, newBalance, description, now)

    return { balance: newBalance, updatedAt: now }
  }

  /**
   * 获取交易历史
   */
  getTransactionHistory(limit = 50): CurrencyTransaction[] {
    const rows = this.database
      .prepare(
        `
        SELECT id, amount, balance_after, transaction_type, description, created_at
        FROM currency_transaction
        ORDER BY id DESC
        LIMIT ?
      `
      )
      .all(limit) as Array<{
      id: number
      amount: number
      balance_after: number
      transaction_type: string
      description: string
      created_at: string
    }>

    return rows.map((row) => ({
      id: row.id,
      amount: row.amount,
      balanceAfter: row.balance_after,
      transactionType: row.transaction_type,
      description: row.description,
      createdAt: row.created_at
    }))
  }

  /**
   * 获取今日收入
   */
  getTodayEarnings(): number {
    const today = new Date().toISOString().split('T')[0]

    const result = this.database
      .prepare(
        `
        SELECT SUM(amount) as total
        FROM currency_transaction
        WHERE transaction_type = 'earn'
        AND DATE(created_at) = ?
      `
      )
      .get(today) as { total: number | null } | undefined

    return result?.total ?? 0
  }

  /**
   * 获取今日支出
   */
  getTodaySpending(): number {
    const today = new Date().toISOString().split('T')[0]

    const result = this.database
      .prepare(
        `
        SELECT SUM(ABS(amount)) as total
        FROM currency_transaction
        WHERE transaction_type = 'spend'
        AND DATE(created_at) = ?
      `
      )
      .get(today) as { total: number | null } | undefined

    return result?.total ?? 0
  }
}
