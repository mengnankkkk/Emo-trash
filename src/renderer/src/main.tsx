import './styles.css'

import { Component, StrictMode, type ErrorInfo, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

interface AppErrorBoundaryState {
  error: Error | null
}

class AppErrorBoundary extends Component<{ children: ReactNode }, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    error: null
  }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[renderer] React render failed', error, errorInfo.componentStack)
  }

  render(): ReactNode {
    if (!this.state.error) {
      return this.props.children
    }

    return (
      <main className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center gap-4 px-4 py-4">
        <section className="pixel-panel pixel-panel--rose flex max-w-xl flex-col gap-3 p-5 text-center">
          <h1 className="text-base font-bold tracking-widest text-[var(--accent-rose)]">
            界面渲染失败
          </h1>
          <p className="text-sm leading-6 text-[var(--text-secondary)]">
            程序没有退出，但当前界面遇到了运行时错误。错误已经输出到启动终端。
          </p>
          <pre className="max-h-40 overflow-auto rounded-[4px] border-2 border-[var(--border-primary)] bg-[var(--bg-surface)] p-3 text-left text-[11px] text-[var(--text-muted)]">
            {this.state.error.message}
          </pre>
          <button
            type="button"
            className="pixel-btn mx-auto text-[11px]"
            onClick={() => window.location.reload()}
          >
            重新加载
          </button>
        </section>
      </main>
    )
  }
}

window.addEventListener('error', (event) => {
  console.error('[renderer] Uncaught error', event.error ?? event.message)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('[renderer] Unhandled promise rejection', event.reason)
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>
)
