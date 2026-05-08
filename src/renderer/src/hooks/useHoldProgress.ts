import { useCallback, useEffect, useRef, useState } from 'react'

interface UseHoldProgressOptions {
  thresholdMs?: number
  disabled?: boolean
  onCommit: () => void | Promise<void>
}

interface UseHoldProgressResult {
  progress: number
  isPressing: boolean
  isReady: boolean
  startHolding: () => void
  stopHolding: () => void
}

export function useHoldProgress({
  thresholdMs = 2000,
  disabled = false,
  onCommit
}: UseHoldProgressOptions): UseHoldProgressResult {
  const [progress, setProgress] = useState(0)
  const [isPressing, setIsPressing] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const intervalRef = useRef<number | null>(null)
  const timeoutRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const committedRef = useRef(false)

  const clearTimers = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const resetState = useCallback(() => {
    clearTimers()
    setIsPressing(false)
    setIsReady(false)
    setProgress(0)
    startTimeRef.current = null
    committedRef.current = false
  }, [clearTimers])

  const stopHolding = useCallback(() => {
    if (committedRef.current) {
      clearTimers()
      setIsPressing(false)
      setProgress(100)
      return
    }

    resetState()
  }, [clearTimers, resetState])

  const startHolding = useCallback(() => {
    if (disabled || isPressing) {
      return
    }

    committedRef.current = false
    startTimeRef.current = Date.now()
    setIsPressing(true)
    setIsReady(false)
    setProgress(0)

    intervalRef.current = window.setInterval(() => {
      const start = startTimeRef.current
      if (!start) {
        return
      }

      const nextProgress = Math.min(100, ((Date.now() - start) / thresholdMs) * 100)
      setProgress(nextProgress)
    }, 16)

    timeoutRef.current = window.setTimeout(async () => {
      committedRef.current = true
      setIsReady(true)
      setProgress(100)
      clearTimers()
      await onCommit()
      setIsPressing(false)
    }, thresholdMs)
  }, [clearTimers, disabled, isPressing, onCommit, thresholdMs])

  useEffect(() => {
    return () => {
      clearTimers()
    }
  }, [clearTimers])

  return {
    progress,
    isPressing,
    isReady,
    startHolding,
    stopHolding
  }
}
