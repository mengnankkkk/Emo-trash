import type { BrowserWindow } from 'electron'
import type { ShakeWindowInput } from '../../preload/api'

export class WindowEffectService {
  private readonly activeTimers = new WeakMap<BrowserWindow, ReturnType<typeof setInterval>>()

  async shake(window: BrowserWindow | null, options: ShakeWindowInput): Promise<void> {
    if (!window || window.isDestroyed()) {
      return
    }

    if (this.activeTimers.has(window)) {
      return
    }

    const [originX, originY] = window.getPosition()
    const intensity = Math.round(options.intensity)
    const durationMs = Math.round(options.durationMs)

    await new Promise<void>((resolve) => {
      const timer = setInterval(() => {
        if (window.isDestroyed()) {
          clearInterval(timer)
          this.activeTimers.delete(window)
          resolve()
          return
        }

        const offsetX = Math.round((Math.random() - 0.5) * intensity * 2)
        const offsetY = Math.round((Math.random() - 0.5) * intensity * 1.4)
        window.setPosition(originX + offsetX, originY + offsetY)
      }, 16)

      this.activeTimers.set(window, timer)

      setTimeout(() => {
        clearInterval(timer)
        this.activeTimers.delete(window)

        if (!window.isDestroyed()) {
          window.setPosition(originX, originY)
        }

        resolve()
      }, durationMs)
    })
  }
}
