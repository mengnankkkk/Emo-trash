import { useEffect, useState } from 'react'

interface ToastItem {
  id: string
  title: string
}

interface AchievementToastProps {
  items: ToastItem[]
  onDismiss: (id: string) => void
}

function AchievementToast({ items, onDismiss }: AchievementToastProps): React.JSX.Element | null {
  if (items.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {items.map((item) => (
        <ToastEntry key={item.id} item={item} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ToastEntry({
  item,
  onDismiss
}: {
  item: ToastItem
  onDismiss: (id: string) => void
}): React.JSX.Element {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(false)
      window.setTimeout(() => onDismiss(item.id), 400)
    }, 3500)
    return () => window.clearTimeout(timer)
  }, [item.id, onDismiss])

  return (
    <div
      className={[
        'achievement-toast flex items-center gap-3 rounded-[4px] border-3 border-[var(--accent-yellow)] bg-[var(--bg-panel)] px-4 py-3 shadow-[4px_4px_0_var(--pixel-shadow)]',
        visible ? 'achievement-toast--enter' : 'achievement-toast--exit'
      ].join(' ')}
    >
      <span className="text-lg">✦</span>
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--accent-yellow)]">
          成就解锁
        </span>
        <span className="text-sm font-semibold text-[var(--text-primary)]">{item.title}</span>
      </div>
    </div>
  )
}

export default AchievementToast
export type { ToastItem }
