import { useEffect, useMemo, useState } from 'react'
import CaptureInput from './features/capture/CaptureInput'
import GardenView from './features/garden/GardenView'
import HoldToShredButton from './features/ritual/HoldToShredButton'
import RitualCanvas from './features/ritual/RitualCanvas'
import { useEmotionApi } from './hooks/useEmotionApi'
import type { GardenItem, RitualEffect } from './types/emotion'

const ritualEffectOptions: Array<{
  value: RitualEffect
  label: string
  subtitle: string
  description: string
  recommendedTags: string[]
}> = [
  {
    value: 'burst',
    label: '爆散',
    subtitle: '横向扩散 / 中等旋转',
    description: '像素碎块会向四周炸开，适合把一股憋着的情绪瞬间抛出去。',
    recommendedTags: ['愤怒', '崩溃']
  },
  {
    value: 'fall',
    label: '坠落',
    subtitle: '强重力 / 低横移',
    description: '文字会像失去支撑一样整块下沉，适合疲惫、麻木和放空状态。',
    recommendedTags: ['疲惫', '平静']
  },
  {
    value: 'glitch',
    label: '故障',
    subtitle: '错位闪断 / 抽动偏移',
    description: '碎片会出现短促错位和信号跳变，更像情绪在脑海里持续抖动。',
    recommendedTags: ['焦虑', '崩溃']
  },
  {
    value: 'ash',
    label: '灰化',
    subtitle: '失色飘散 / 缓慢退场',
    description: '文字会逐渐失去颜色并化成灰烬向上漂散，适合释然和慢慢放下。',
    recommendedTags: ['释然', '平静']
  }
]

function App(): React.JSX.Element {
  const [inputValue, setInputValue] = useState('')
  const [ritualText, setRitualText] = useState('')
  const [gardenItems, setGardenItems] = useState<GardenItem[]>([])
  const [ritualActive, setRitualActive] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusText, setStatusText] = useState('把想扔掉的内容输入进来，然后长按底部按钮。')
  const [particleState, setParticleState] = useState<'idle' | 'burst'>('idle')
  const [effectType, setEffectType] = useState<RitualEffect>('burst')
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

  const activeEffect = useMemo(() => {
    return (
      ritualEffectOptions.find((option) => option.value === effectType) ?? ritualEffectOptions[0]
    )
  }, [effectType])

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
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.28em] text-white/30">粉碎仪式</p>
              <h2 className="text-2xl font-semibold text-white">让输入在眼前坍塌</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {ritualEffectOptions.map((option) => {
                const selected = option.value === effectType
                return (
                  <button
                    key={option.value}
                    type="button"
                    data-effect-option={option.value}
                    data-selected={selected ? 'true' : 'false'}
                    onClick={() => setEffectType(option.value)}
                    className={[
                      'ritual-effect-chip rounded-2xl border px-3 py-2 text-left transition',
                      selected
                        ? 'border-rose-300 bg-rose-400/15 text-rose-100 shadow-[2px_2px_0_rgba(251,113,133,0.2)]'
                        : 'border-white/10 bg-white/[0.03] text-white/55 hover:border-white/20 hover:text-white'
                    ].join(' ')}
                  >
                    <span className="block text-xs font-semibold tracking-[0.18em]">
                      {option.label}
                    </span>
                    <span className="mt-1 block text-[10px] text-white/45">{option.subtitle}</span>
                  </button>
                )
              })}
            </div>
            <div className="ritual-effect-panel rounded-3xl border border-white/10 bg-black/20 px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/30">当前特效</p>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold text-white">{activeEffect.label}</span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-white/45">
                      {activeEffect.subtitle}
                    </span>
                  </div>
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-rose-100/80">
                  推荐搭配
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-white/55">{activeEffect.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {activeEffect.recommendedTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-white/70"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <RitualCanvas
            text={ritualActive ? ritualText : inputValue}
            active={ritualActive}
            particleState={particleState}
            effectType={effectType}
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
