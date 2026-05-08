import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useHoldProgress } from '../../src/renderer/src/hooks/useHoldProgress'

describe('useHoldProgress', () => {
  it('达到阈值后触发提交', async () => {
    vi.useFakeTimers()
    const onCommit = vi.fn()

    const { result } = renderHook(() =>
      useHoldProgress({
        thresholdMs: 200,
        onCommit
      })
    )

    act(() => {
      result.current.startHolding()
      vi.advanceTimersByTime(210)
    })

    expect(onCommit).toHaveBeenCalledTimes(1)
    expect(result.current.progress).toBe(100)

    vi.useRealTimers()
  })

  it('提前松开时取消提交', () => {
    vi.useFakeTimers()
    const onCommit = vi.fn()

    const { result } = renderHook(() =>
      useHoldProgress({
        thresholdMs: 300,
        onCommit
      })
    )

    act(() => {
      result.current.startHolding()
      vi.advanceTimersByTime(120)
      result.current.stopHolding()
    })

    expect(onCommit).not.toHaveBeenCalled()
    expect(result.current.progress).toBe(0)
    expect(result.current.isPressing).toBe(false)

    vi.useRealTimers()
  })
})
