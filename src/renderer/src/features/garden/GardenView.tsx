import { useEffect, useMemo, useRef, useState } from 'react'
import type { GardenItem } from '../../types/emotion'
import {
  createPlaceholderFlowerAssets,
  getFlowerAssetByType,
  getFlowerAssets
} from '../../lib/flowerAssets'

interface GardenViewProps {
  items: GardenItem[]
}

function GardenView({ items }: GardenViewProps): React.JSX.Element {
  const previousIdsRef = useRef<Set<number>>(new Set())
  const hydratedRef = useRef(false)
  const [sproutingIds, setSproutingIds] = useState<Set<number>>(new Set())
  const [swayingIds, setSwayingIds] = useState<Set<number>>(new Set())
  const flowerAssets = useMemo(() => {
    const assets = getFlowerAssets()
    return assets.every((asset) => asset.textureUrl.startsWith('/flowers/'))
      ? createPlaceholderFlowerAssets()
      : assets
  }, [])

  useEffect(() => {
    const nextIds = new Set(items.map((item) => item.id))

    if (!hydratedRef.current) {
      hydratedRef.current = true
      previousIdsRef.current = nextIds
      return
    }

    const newIds = [...nextIds].filter((id) => !previousIdsRef.current.has(id))
    previousIdsRef.current = nextIds

    if (newIds.length === 0) {
      return
    }

    setSproutingIds((current) => {
      const next = new Set(current)
      newIds.forEach((id) => next.add(id))
      return next
    })

    setSwayingIds((current) => {
      const next = new Set(current)
      newIds.forEach((id) => next.delete(id))
      return next
    })

    const sproutTimer = window.setTimeout(() => {
      setSproutingIds((current) => {
        const next = new Set(current)
        newIds.forEach((id) => next.delete(id))
        return next
      })

      setSwayingIds((current) => {
        const next = new Set(current)
        newIds.forEach((id) => next.add(id))
        return next
      })
    }, 1100)

    const swayTimer = window.setTimeout(() => {
      setSwayingIds((current) => {
        const next = new Set(current)
        newIds.forEach((id) => next.delete(id))
        return next
      })
    }, 3600)

    return () => {
      window.clearTimeout(sproutTimer)
      window.clearTimeout(swayTimer)
    }
  }, [items])

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.28em] text-white/35">像素花园</span>
        <span className="text-xs text-white/35">保留的是结果，不是原文</span>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-black/15 p-3">
        {flowerAssets.map((asset) => (
          <div
            key={asset.emotionTag}
            className="emotion-chip flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2"
          >
            <img alt={asset.displayName} className="garden-sprite h-5 w-5" src={asset.textureUrl} />
            <span className="text-xs font-medium text-white/75">{asset.displayName}</span>
          </div>
        ))}
      </div>

      <div className="grid min-h-36 grid-cols-3 gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-6">
        {items.length === 0 ? (
          <div className="col-span-full flex items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/10 px-4 py-8 text-center text-sm text-white/30">
            这里还没有长出任何花。
          </div>
        ) : (
          items.map((item) => {
            const isSprouting = sproutingIds.has(item.id)
            const isSwaying = swayingIds.has(item.id)
            const flowerAsset = getFlowerAssetByType(item.flowerType)

            return (
              <article
                key={item.id}
                data-garden-item-id={item.id}
                data-emotion-tag={flowerAsset.emotionTag}
                data-sprouting={isSprouting ? 'true' : 'false'}
                data-swaying={isSwaying ? 'true' : 'false'}
                data-flower-skin={flowerAsset.label}
                className={`garden-card flex min-h-28 flex-col items-center justify-between gap-2 rounded-2xl border border-white/10 bg-black/25 px-3 py-3 ${
                  isSprouting ? 'garden-card--sprouting' : ''
                } ${isSwaying ? 'garden-card--swaying' : ''}`}
              >
                <div className="garden-flower relative h-10 w-10">
                  <span className="garden-glow absolute inset-x-1 bottom-0 h-3 rounded-full bg-emerald-400/30 blur-sm" />
                  <img
                    alt={`${flowerAsset.label} flower`}
                    className="garden-sprite garden-bloom absolute left-1/2 top-0 h-8 w-8 -translate-x-1/2"
                    src={flowerAsset.textureUrl}
                  />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="emotion-chip rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold tracking-[0.16em] text-white/75">
                    {flowerAsset.displayName}
                  </span>
                  <span className="text-[11px] text-white/45">#{item.id}</span>
                </div>
              </article>
            )
          })
        )}
      </div>
    </section>
  )
}

export default GardenView
