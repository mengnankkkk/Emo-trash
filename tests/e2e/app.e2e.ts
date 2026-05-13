import { test, expect, _electron as electron } from '@playwright/test'
import { spawn, type ChildProcessWithoutNullStreams } from 'child_process'
import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

const projectRoot = process.cwd()
const ansiPattern = new RegExp(String.raw`\[[0-9;]*m`, 'g')

function stripAnsi(text: string): string {
  return text.replace(ansiPattern, '')
}

function waitForRendererReady(devServer: ChildProcessWithoutNullStreams): Promise<string> {
  return new Promise((resolve, reject) => {
    let buffer = ''

    const onData = (chunk: Buffer): void => {
      buffer += stripAnsi(chunk.toString())

      const urlMatch =
        buffer.match(/http:\/\/127\.0\.0\.1:(\d+)\//) ?? buffer.match(/http:\/\/localhost:(\d+)\//)

      if (urlMatch) {
        cleanup()
        resolve(`http://127.0.0.1:${urlMatch[1]}`)
      }
    }

    const onExit = (): void => {
      cleanup()
      reject(new Error(`renderer 开发服务提前退出\n${buffer}`))
    }

    const timeout = setTimeout(() => {
      cleanup()
      reject(new Error(`等待 renderer 开发服务超时\n${buffer}`))
    }, 25_000)

    const cleanup = (): void => {
      clearTimeout(timeout)
      devServer.stdout.off('data', onData)
      devServer.stderr.off('data', onData)
      devServer.off('exit', onExit)
    }

    devServer.stdout.on('data', onData)
    devServer.stderr.on('data', onData)
    devServer.on('exit', onExit)
  })
}

test('Electron 真窗口主链路可用', async () => {
  const e2eUserDataDir = mkdtempSync(join(tmpdir(), 'emo-trash-e2e-'))
  const devServer = spawn('npx', ['vite', '--config', 'tests/e2e/vite.renderer.config.ts'], {
    cwd: projectRoot,
    shell: true,
    env: {
      ...process.env,
      FORCE_COLOR: '0'
    }
  })

  const rendererUrl = await waitForRendererReady(devServer)

  const electronApp = await electron.launch({
    args: [join(projectRoot, 'out/main/index.js')],
    env: {
      ...process.env,
      NODE_ENV: 'development',
      ELECTRON_RENDERER_URL: rendererUrl,
      EMO_TRASH_USER_DATA_DIR: e2eUserDataDir
    }
  })

  try {
    const window = await electronApp.firstWindow()
    const consoleErrors: string[] = []

    window.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text())
      }
    })

    await expect(window).toHaveTitle(/Emo-trash/)
    await expect(window.getByRole('heading', { name: '情绪垃圾桶' })).toBeVisible()

    const glitchOption = window.locator('[data-effect-option="glitch"]')
    await expect(glitchOption).toBeVisible()
    await glitchOption.click()
    await expect(glitchOption).toHaveAttribute('data-selected', 'true')

    await window.getByRole('textbox', { name: '输入室' }).fill('烦死了！！！今天真的很崩溃')
    const button = window.getByRole('button', { name: /长按|继续|坍缩/ })

    await button.dispatchEvent('pointerdown')
    await expect(button).toContainText('继续按住粉碎')
    await window.waitForTimeout(2300)
    await button.dispatchEvent('pointerup')

    const latestGardenItem = window.locator('[data-garden-item-id]').first()
    await expect(latestGardenItem).toBeVisible()
    await expect(latestGardenItem).toHaveAttribute('data-emotion-tag', 'collapse')
    await expect(latestGardenItem).toHaveAttribute('data-flower-skin', 'purple')
    await expect(latestGardenItem).toContainText('崩溃')
    await expect(latestGardenItem).toHaveAttribute('data-sprouting', 'true')

    await window.waitForTimeout(1300)
    await expect(latestGardenItem).toHaveAttribute('data-swaying', 'true')
    const ritualCanvas = window.locator('[data-effect-type]')
    await expect(ritualCanvas).toHaveAttribute('data-effect-type', 'glitch')
    await expect(ritualCanvas).toHaveAttribute('data-shard-count', /\d+/)
    await expect(latestGardenItem.getByText(/#\d+/)).toBeVisible()
    await expect(window.getByRole('textbox', { name: '输入室' })).toHaveValue('')

    await window.getByRole('button', { name: /花园/i }).click()
    await expect(window.locator('[data-app-page="garden"]')).toHaveAttribute('data-selected', 'true')
    await expect(window.locator('[data-garden-item-id="1"]').first()).toBeVisible()

    expect(consoleErrors).toEqual([])
  } finally {
    await electronApp.close()
    devServer.kill('SIGTERM')
    rmSync(e2eUserDataDir, { recursive: true, force: true })
  }
})
