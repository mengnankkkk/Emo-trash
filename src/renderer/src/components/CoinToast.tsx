import { useEffect, useState } from 'react'

interface CoinToastProps {
  amount: number
  onComplete?: () => void
}

export function CoinToast({ amount, onComplete }: CoinToastProps): React.ReactElement | null {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      onComplete?.()
    }, 2000)

    return () => clearTimeout(timer)
  }, [onComplete])

  if (!visible) return null

  return (
    <div
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce"
      style={{
        animation: 'coinFloat 2s ease-out forwards'
      }}
    >
      <div
        className="px-6 py-3 rounded-full shadow-lg flex items-center gap-2"
        style={{
          background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 50%, #ffa500 100%)',
          border: '2px solid rgba(255, 255, 255, 0.5)',
          boxShadow: '0 4px 20px rgba(255, 215, 0, 0.6)'
        }}
      >
        <span className="text-2xl">💰</span>
        <span className="text-white font-bold text-lg drop-shadow-md">+{amount}</span>
      </div>
    </div>
  )
}
