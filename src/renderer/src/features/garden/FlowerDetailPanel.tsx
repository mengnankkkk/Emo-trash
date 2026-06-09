import type { EmotionIntensity, GardenItem } from '../../types/emotion'
import { getFlowerAssetByType } from '../../lib/flowerAssets'
import { getEmotionDefinitionByTag } from '../../../../shared/emotionMeta'
import { getGrowthStageLabel, isFlowerMature } from '../../../../shared/emotionInsights'
import { getRarityDefinition } from '../../../../shared/rarity'

export function FlowerDetailPanel({
  flower,
  onClose,
  onWater,
  onPick,
  wateringDisabled
}: {
  flower: GardenItem
  onClose: () => void
  onWater: (flowerId: number) => void
  onPick: (flowerId: number) => void
  wateringDisabled: boolean
}): React.JSX.Element {
  const emotion = getEmotionDefinitionByTag(flower.emotionTag)
  const rarity = getRarityDefinition(flower.rarity)
  const flowerAsset = getFlowerAssetByType(flower.flowerType)
  const analysis = flower.analysis
  const mature = isFlowerMature(flower)
  const withered = flower.growthStage === 0
  const stageLabel = getGrowthStageLabel(flower.growthStage)
  const sourceLabel =
    analysis?.source === 'ai'
      ? `AI${analysis.sourceModel ? ` / ${analysis.sourceModel}` : ''}`
      : analysis?.source === 'browser-preview'
        ? '浏览器预览'
        : '规则引擎'
  const intensityLabelMap: Record<EmotionIntensity, string> = {
    mild: '轻微',
    moderate: '中等',
    strong: '强烈'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-overlay)] px-4 backdrop-blur-sm">
      <section className="max-h-[88vh] w-full max-w-2xl overflow-auto rounded-[4px] border-3 border-[var(--border-primary)] bg-[var(--bg-panel)] p-5 shadow-[4px_4px_0_var(--pixel-shadow)]">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b-3 border-dashed border-[var(--border-primary)] pb-4">
          <div className="flex items-center gap-4">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-[4px] border-2 bg-[var(--bg-surface)]"
              style={{ borderColor: rarity.color }}
            >
              <img
                alt={flowerAsset.displayName}
                className="garden-sprite h-11 w-11"
                src={flowerAsset.textureUrl}
              />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--text-muted)]">
                花朵详情
              </p>
              <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">
                {emotion.displayName} / {rarity.label}
              </h2>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                {rarity.description}
              </p>
            </div>
          </div>
          <button type="button" className="pixel-btn text-[11px]" onClick={onClose}>
            关闭
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <div className="rounded-[4px] border-2 border-[var(--border-primary)] bg-[var(--bg-surface)] p-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
              阶段
            </p>
            <p className="mt-2 text-sm font-bold text-[var(--text-primary)]">{stageLabel}</p>
          </div>
          <div className="rounded-[4px] border-2 border-[var(--border-primary)] bg-[var(--bg-surface)] p-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
              浇水
            </p>
            <p className="mt-2 text-sm font-bold text-[var(--text-primary)]">
              {flower.totalWaterings} 次
            </p>
          </div>
          <div className="rounded-[4px] border-2 border-[var(--border-primary)] bg-[var(--bg-surface)] p-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
              日期
            </p>
            <p className="mt-2 text-sm font-bold text-[var(--text-primary)]">
              {flower.releasedOn}
            </p>
          </div>
          <div className="rounded-[4px] border-2 border-[var(--border-primary)] bg-[var(--bg-surface)] p-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
              位置
            </p>
            <p className="mt-2 text-sm font-bold text-[var(--text-primary)]">
              {flower.gridX + 1}, {flower.gridY + 1}
            </p>
          </div>
        </div>

        <div
          className="mt-4 rounded-[4px] border-2 p-3 text-sm leading-6"
          style={{
            borderColor: withered
              ? 'var(--accent-rose)'
              : mature
                ? 'var(--accent-emerald)'
                : 'var(--accent-sky)',
            background: withered
              ? 'color-mix(in srgb, var(--accent-rose) 10%, var(--bg-surface))'
              : mature
                ? 'color-mix(in srgb, var(--accent-emerald) 10%, var(--bg-surface))'
                : 'color-mix(in srgb, var(--accent-sky) 10%, var(--bg-surface))'
          }}
        >
          {withered
            ? '这朵花已经枯萎，只留下曾经释放过的情绪痕迹。'
            : mature
              ? '这朵花已经成熟，可以采摘换取金币，也可以继续留在花园里。'
              : '这朵花还在成长，继续浇水会让它更快开花。'}
        </div>

        <div className="mt-5 rounded-[4px] border-2 border-[var(--border-primary)] bg-[var(--bg-surface)] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">
              情绪分析
            </p>
            <span className="rounded-[2px] border-2 border-[var(--border-primary)] bg-[var(--bg-panel)] px-2 py-0.5 text-[10px] text-[var(--text-secondary)]">
              {sourceLabel}
            </span>
          </div>
          {analysis ? (
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-[10px] text-[var(--text-muted)]">强度</p>
                <p className="mt-1 text-sm text-[var(--text-primary)]">
                  {intensityLabelMap[analysis.emotionIntensity]}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-[var(--text-muted)]">触发场景</p>
                <p className="mt-1 text-sm text-[var(--text-primary)]">
                  {analysis.triggerScene}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-[10px] text-[var(--text-muted)]">引导问题</p>
                <p className="mt-1 text-sm leading-6 text-[var(--text-primary)]">
                  {analysis.guidanceQuestion}
                </p>
              </div>
              <div className="md:col-span-2 flex flex-wrap gap-2">
                {analysis.suggestedLabels.map((label) => (
                  <span
                    key={label}
                    className="rounded-[2px] border-2 border-[var(--border-primary)] bg-[var(--bg-panel)] px-2 py-0.5 text-[10px] text-[var(--text-secondary)]"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">这朵花没有额外分析记录。</p>
          )}
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            disabled={wateringDisabled || withered}
            className="pixel-btn text-[11px] disabled:opacity-40"
            onClick={() => onWater(flower.id)}
          >
            浇水
          </button>
          <button
            type="button"
            className="pixel-btn text-[11px]"
            onClick={() => onPick(flower.id)}
          >
            采摘
          </button>
        </div>
      </section>
    </div>
  )
}
