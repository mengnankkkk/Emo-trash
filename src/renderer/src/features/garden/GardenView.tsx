import { useEffect, useMemo, useRef, useState } from 'react'
import type { GardenItem } from '../../types/emotion'
import { createPlaceholderFlowerAssets, getFlowerAssets } from '../../lib/flowerAssets'

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
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.28em] text-white/35">像素花园</span>
        <span className="text-xs text-white/35">保留的是结果，不是原文</span>
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
            const flowerAsset = flowerAssets[(item.flowerType - 1) % flowerAssets.length]

            return (
              <article
                key={item.id}
                data-garden-item-id={item.id}
                data-sprouting={isSprouting ? 'true' : 'false'}
                data-swaying={isSwaying ? 'true' : 'false'}
                data-flower-skin={flowerAsset.label}
                className={`garden-card flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-2 py-3 ${
                  isSprouting ? 'garden-card--sprouting' : ''
                } ${isSwaying ? 'garden-card--swaying' : ''}`}
              >
                <div className="garden-flower relative h-8 w-8">
                  <span className="garden-glow absolute inset-x-1 bottom-0 h-3 rounded-full bg-emerald-400/30 blur-sm" />
                  <img
                    alt={`${flowerAsset.label} flower`}
                    className="garden-sprite absolute left-1/2 top-0 h-6 w-6 -translate-x-1/2"
                    src={flowerAsset.textureUrl}
                  />
                </div>
                <div className="text-[11px] text-white/65">#{item.id}</div>
              </article>
            )
          })
        )}
      </div>
    </section>
  )
}

export default GardenView
