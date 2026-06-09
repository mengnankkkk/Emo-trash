import type { CurrencyTransaction } from '../../types/emotion'

export function CurrencyLedger({
  transactions,
  balance
}: {
  transactions: CurrencyTransaction[]
  balance: number
}): React.JSX.Element {
  return (
    <section className="rounded-[4px] border-2 border-[var(--border-primary)] bg-[var(--bg-surface)] p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--text-muted)]">金币账本</p>
          <h3 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">最近收支</h3>
        </div>
        <span className="rounded-[2px] border-2 border-[var(--accent-amber)] bg-[color-mix(in_srgb,var(--accent-amber)_10%,var(--bg-panel))] px-3 py-1.5 text-xs font-bold text-[var(--accent-amber)]">
          G {balance}
        </span>
      </div>

      {transactions.length === 0 ? (
        <div className="mt-5 rounded-[4px] border-2 border-dashed border-[var(--border-primary)] bg-[var(--bg-panel)] px-4 py-8 text-center text-sm text-[var(--text-muted)]">
          还没有金币流水。
        </div>
      ) : (
        <div className="mt-5 space-y-2">
          {transactions.slice(0, 8).map((transaction) => {
            const isSpend = transaction.transactionType === 'spend'
            const amountLabel = `${isSpend ? '-' : '+'}${Math.abs(transaction.amount)}`
            return (
              <article
                key={transaction.id}
                className="flex items-center justify-between gap-3 rounded-[4px] border-2 border-[var(--border-primary)] bg-[var(--bg-panel)] px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-[var(--text-primary)]">
                    {transaction.description}
                  </p>
                  <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                    {transaction.createdAt.split('T')[0] || transaction.createdAt}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className="text-sm font-bold"
                    style={{ color: isSpend ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}
                  >
                    {amountLabel}
                  </p>
                  <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                    余额 {transaction.balanceAfter}
                  </p>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
