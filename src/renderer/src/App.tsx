import { useEffect, useMemo, useState } from 'react'
import CaptureInput from './features/capture/CaptureInput'
import GardenView from './features/garden/GardenView'
import HoldToShredButton from './features/ritual/HoldToShredButton'
import RitualCanvas from './features/ritual/RitualCanvas'
import { useEmotionApi } from './hooks/useEmotionApi'
import type { GardenItem } from './types/emotion'

function App(): React.JSX.Element {
  const [inputValue, setInputValue] = useState('')
  const [ritualText, setRitualText] = useState('')
  const [gardenItems, setGardenItems] = useState<GardenItem[]>([])
  const [ritualActive, setRitualActive] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusText, setStatusText] = useState('把想扔掉的内容输入进来，然后长按底部按钮。')
  const [particleState, setParticleState] = useState<'idle' | 'burst'>('idle')
  const { listGarden, releaseEmotion } = useEmotionApi()

  useEffect(() => {
    async function loadGarden(): Promise<void> {
      const items = await listGarden()
      setGardenItems(items)
    }

    void loadGarden()
  }, [listGarden])

  const isDisabled = useMemo(() => {
    return isSubmitting || inputValue.trim().length === 0
  }, [inputValue, isSubmitting])

  const handleCommit = async (): Promise<void> => {
    const trimmedInput = inputValue.trim()
    if (!trimmedInput) {
      return
    }

    setIsSubmitting(true)
    setRitualText(trimmedInput)
    setParticleState('burst')
    setRitualActive(true)
    setStatusText('正在坍缩当前输入，只保留花朵结果。')

    try {
      const nextGarden = await releaseEmotion(trimmedInput)
      setGardenItems(nextGarden)
      setInputValue('')
      setStatusText('原文已经坍缩，新的花朵正在花园里发芽。')
    } catch (error) {
      console.error(error)
      setStatusText('这次粉碎没有成功，请稍后再试。')
    } finally {
      window.setTimeout(() => {
        setRitualActive(false)
        setRitualText('')
        setParticleState('idle')
      }, 1400)
      setIsSubmitting(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-5 py-6 md:px-10 md:py-10">
      <section className="grid flex-1 gap-6 lg:grid-cols-[1.12fr_0.88fr]">
        <div className="flex flex-col rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20 backdrop-blur">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.32em] text-white/30">Emo-trash</p>
              <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
                情绪垃圾桶
              </h1>
            </div>
            <div className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.28em] text-rose-200/80">
              本地坍缩
            </div>
          </div>

          <p className="mb-8 max-w-2xl text-sm leading-7 text-white/55">{statusText}</p>

          <div className="flex flex-1 flex-col gap-6">
            <CaptureInput value={inputValue} disabled={isSubmitting} onChange={setInputValue} />
            <HoldToShredButton disabled={isDisabled} onCommit={handleCommit} />
          </div>
        </div>

        <div className="flex flex-col gap-6 rounded-[2rem] border border-white/10 bg-black/25 p-5 shadow-2xl shadow-black/30">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.28em] text-white/30">粉碎仪式</p>
            <h2 className="text-2xl font-semibold text-white">让输入在眼前坍塌</h2>
          </div>
          <RitualCanvas
            text={ritualActive ? ritualText : inputValue}
            active={ritualActive}
            particleState={particleState}
          />
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm leading-7 text-white/45">
            长按达到阈值后，系统只会提取张力特征，并把它映射成一朵花的种子写入本地花园。
          </div>
        </div>
      </section>

      <GardenView items={gardenItems} />
    </main>
  )
}

export default App
