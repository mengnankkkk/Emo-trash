import 'pixi.js/unsafe-eval'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Application, Container, Rectangle, Sprite, Text, TextStyle, Texture } from 'pixi.js'
import type { RitualEffect } from '../../types/emotion'

interface RitualCanvasProps {
  text: string
  active: boolean
  particleState: 'idle' | 'burst'
  effectType: RitualEffect
}

interface Shard {
  sprite: Sprite
  velocityX: number
  velocityY: number
  rotationSpeed: number
  jitterX: number
  jitterY: number
  fadeRate: number
  scaleDecay: number
  age: number
  originX: number
  originY: number
}

interface AlphaBounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

interface TileContent {
  coverage: number
  rect: Rectangle
}

const previewTextStyle = new TextStyle({
  fill: '#f8fafc',
  fontFamily: 'monospace',
  fontSize: 22,
  lineHeight: 34,
  wordWrap: true,
  dropShadow: {
    color: '#fb7185',
    alpha: 0.2,
    blur: 10,
    distance: 0,
    angle: 0
  }
})

const alphaThreshold = 10

function destroyContainerChildren(container: Container): void {
  const children = [...container.children]
  children.forEach((child) => {
    container.removeChild(child)
    if ('texture' in child && child.texture instanceof Texture && child.texture !== Texture.EMPTY) {
      child.texture.destroy(false)
    }
    child.destroy()
  })
}

function findAlphaBounds(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  threshold: number
): AlphaBounds | null {
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = pixels[(y * width + x) * 4 + 3]
      if (alpha <= threshold) {
        continue
      }

      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    }
  }

  if (maxX < 0 || maxY < 0) {
    return null
  }

  return { minX, minY, maxX, maxY }
}

function clampRect(
  x: number,
  y: number,
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): Rectangle {
  const nextX = Math.max(0, Math.floor(x))
  const nextY = Math.max(0, Math.floor(y))
  const nextWidth = Math.max(1, Math.min(Math.ceil(width), maxWidth - nextX))
  const nextHeight = Math.max(1, Math.min(Math.ceil(height), maxHeight - nextY))

  return new Rectangle(nextX, nextY, nextWidth, nextHeight)
}

function analyzeTile(
  pixels: Uint8ClampedArray,
  textureWidth: number,
  tileRect: Rectangle,
  threshold: number
): TileContent | null {
  let solidPixels = 0
  let minX = tileRect.width
  let minY = tileRect.height
  let maxX = -1
  let maxY = -1

  for (let localY = 0; localY < tileRect.height; localY += 1) {
    for (let localX = 0; localX < tileRect.width; localX += 1) {
      const textureX = tileRect.x + localX
      const textureY = tileRect.y + localY
      const alpha = pixels[(textureY * textureWidth + textureX) * 4 + 3]

      if (alpha <= threshold) {
        continue
      }

      solidPixels += 1
      minX = Math.min(minX, localX)
      minY = Math.min(minY, localY)
      maxX = Math.max(maxX, localX)
      maxY = Math.max(maxY, localY)
    }
  }

  if (solidPixels === 0 || maxX < 0 || maxY < 0) {
    return null
  }

  const coverage = solidPixels / (tileRect.width * tileRect.height)
  const padding = 1
  const contentRect = new Rectangle(
    tileRect.x + minX - padding,
    tileRect.y + minY - padding,
    maxX - minX + 1 + padding * 2,
    maxY - minY + 1 + padding * 2
  )

  return {
    coverage,
    rect: contentRect
  }
}

function mergeHorizontalTiles(tiles: TileContent[], maxGap = 1): Rectangle[] {
  const rows = new Map<number, TileContent[]>()

  tiles.forEach((tile) => {
    const key = tile.rect.y
    const group = rows.get(key)
    if (group) {
      group.push(tile)
    } else {
      rows.set(key, [tile])
    }
  })

  const merged: Rectangle[] = []

  rows.forEach((group) => {
    group.sort((a, b) => a.rect.x - b.rect.x)

    let current = group[0]?.rect
    if (!current) {
      return
    }

    for (let index = 1; index < group.length; index += 1) {
      const next = group[index].rect
      const currentRight = current.x + current.width

      const verticalNear = Math.abs(next.y - current.y) <= 2
      const horizontalNear = next.x - currentRight <= maxGap
      const sameHeight = Math.abs(next.height - current.height) <= 4

      if (verticalNear && horizontalNear && sameHeight) {
        const right = Math.max(currentRight, next.x + next.width)
        const top = Math.min(current.y, next.y)
        const bottom = Math.max(current.y + current.height, next.y + next.height)
        current = new Rectangle(current.x, top, right - current.x, bottom - top)
      } else {
        merged.push(current)
        current = next
      }
    }

    merged.push(current)
  })

  return merged
}

function createShardMotion(
  effectType: RitualEffect,
  normalizedX: number,
  normalizedY: number,
  densityFactor: number
): Omit<Shard, 'sprite'> {
  const scatterGain = 1 + densityFactor * 0.18

  switch (effectType) {
    case 'fall':
      return {
        velocityX: normalizedX * 0.018 * scatterGain + (Math.random() - 0.5) * 0.45,
        velocityY: Math.abs(normalizedY) * 0.01 - Math.random() * 0.8,
        rotationSpeed: (Math.random() - 0.5) * 0.04,
        jitterX: 0,
        jitterY: 0,
        fadeRate: 0.0018,
        scaleDecay: 0.003,
        age: 0,
        originX: 0,
        originY: 0
      }
    case 'glitch':
      return {
        velocityX: normalizedX * 0.012 + (Math.random() - 0.5) * 0.3,
        velocityY: normalizedY * 0.004 - Math.random() * 0.15,
        rotationSpeed: (Math.random() - 0.5) * 0.01,
        jitterX: 1.8 + Math.random() * 2.4,
        jitterY: 0.4,
        fadeRate: 0.0038,
        scaleDecay: 0.001,
        age: 0,
        originX: 0,
        originY: 0
      }
    case 'ash':
      return {
        velocityX: normalizedX * 0.01 + (Math.random() - 0.5) * 0.25,
        velocityY: -0.6 - Math.random() * 0.7,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        jitterX: 0.15,
        jitterY: 0.1,
        fadeRate: 0.004,
        scaleDecay: 0.004,
        age: 0,
        originX: 0,
        originY: 0
      }
    case 'vortex':
      return {
        velocityX: normalizedX * 0.008,
        velocityY: normalizedY * 0.008,
        rotationSpeed: (Math.random() > 0.5 ? 1 : -1) * (0.06 + Math.random() * 0.04),
        jitterX: 0,
        jitterY: 0,
        fadeRate: 0.003,
        scaleDecay: 0.002,
        age: 0,
        originX: 0,
        originY: 0
      }
    case 'dissolve':
      return {
        velocityX: (Math.random() - 0.5) * 0.3,
        velocityY: 0.2 + Math.random() * 0.4,
        rotationSpeed: (Math.random() - 0.5) * 0.015,
        jitterX: 0.8 + Math.random() * 0.6,
        jitterY: 0,
        fadeRate: 0.006,
        scaleDecay: 0.008,
        age: 0,
        originX: 0,
        originY: 0
      }
    case 'burst':
    default:
      return {
        velocityX:
          normalizedX * 0.035 * scatterGain + (Math.random() - 0.5) * (1.3 + densityFactor * 0.45),
        velocityY: normalizedY * 0.014 * scatterGain - Math.random() * (2 + densityFactor * 0.5),
        rotationSpeed: (Math.random() - 0.5) * (0.07 + densityFactor * 0.02),
        jitterX: 0,
        jitterY: 0,
        fadeRate: 0.0028,
        scaleDecay: 0.005,
        age: 0,
        originX: 0,
        originY: 0
      }
  }
}

function RitualCanvas({
  text,
  active,
  particleState,
  effectType
}: RitualCanvasProps): React.JSX.Element {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const appRef = useRef<Application | null>(null)
  const previewLayerRef = useRef<Container | null>(null)
  const shatterLayerRef = useRef<Container | null>(null)
  const generatedTextureRef = useRef<Texture | null>(null)
  const shardsRef = useRef<Shard[]>([])
  const [isCanvasReady, setIsCanvasReady] = useState(false)
  const [shardCount, setShardCount] = useState(0)

  const pixelConfig = useMemo(() => {
    const baseCell = 16
    const strokeDensityBias = Math.max(0.55, Math.min(1.35, 0.85 + text.trim().length / 120))
    return {
      cellSize: Math.max(7, Math.min(18, Math.round(baseCell / strokeDensityBias))),
      minCoverage: Math.max(0.01, Math.min(0.035, 0.022 - text.trim().length / 12000))
    }
  }, [text])

  useEffect(() => {
    let mounted = true

    async function setup(): Promise<void> {
      if (!hostRef.current || appRef.current) {
        return
      }

      const app = new Application()
      await app.init({
        width: hostRef.current.clientWidth || 920,
        height: hostRef.current.clientHeight || 260,
        backgroundAlpha: 0,
        antialias: true,
        resizeTo: hostRef.current
      })

      app.renderer.resolution = 1

      if (!mounted) {
        app.destroy(true)
        return
      }

      const previewLayer = new Container()
      const shatterLayer = new Container()

      app.stage.addChild(previewLayer)
      app.stage.addChild(shatterLayer)

      previewLayerRef.current = previewLayer
      shatterLayerRef.current = shatterLayer

      hostRef.current.appendChild(app.canvas)
      appRef.current = app
      setIsCanvasReady(true)
    }

    void setup()

    return () => {
      mounted = false
      previewLayerRef.current?.removeChildren()
      shatterLayerRef.current?.removeChildren()
      generatedTextureRef.current?.destroy(true)
      generatedTextureRef.current = null
      appRef.current?.destroy(true)
      appRef.current = null
      previewLayerRef.current = null
      shatterLayerRef.current = null
      shardsRef.current = []
      setShardCount(0)
      setIsCanvasReady(false)
    }
  }, [])

  useEffect(() => {
    const app = appRef.current
    const previewLayer = previewLayerRef.current
    const shatterLayer = shatterLayerRef.current

    if (!app || !previewLayer || !shatterLayer || !isCanvasReady) {
      return
    }

    destroyContainerChildren(previewLayer)
    destroyContainerChildren(shatterLayer)
    generatedTextureRef.current?.destroy(true)
    generatedTextureRef.current = null
    shardsRef.current = []
    setShardCount(0)

    if (!text.trim()) {
      return
    }

    const previewText = new Text({
      text,
      style: new TextStyle({
        ...previewTextStyle,
        wordWrapWidth: Math.max(240, app.screen.width - 48)
      })
    })

    previewText.x = 16
    previewText.y = 18

    if (!active) {
      previewLayer.addChild(previewText)
      return
    }

    const renderer = app.renderer
    const bounds = previewText.getLocalBounds()
    const generatedTexture = renderer.textureGenerator.generateTexture({
      target: previewText,
      frame: new Rectangle(0, 0, Math.ceil(bounds.width), Math.ceil(bounds.height)),
      resolution: 1,
      antialias: true
    })

    generatedTexture.source.scaleMode = 'nearest'
    generatedTextureRef.current = generatedTexture

    const extraction = renderer.extract.pixels(generatedTexture)
    const textureWidth = extraction.width
    const textureHeight = extraction.height
    const pixels = extraction.pixels
    const alphaBounds = findAlphaBounds(pixels, textureWidth, textureHeight, alphaThreshold)

    previewText.destroy()

    if (!alphaBounds) {
      return
    }

    const cropPadding = 2
    const cropRect = clampRect(
      alphaBounds.minX - cropPadding,
      alphaBounds.minY - cropPadding,
      alphaBounds.maxX - alphaBounds.minX + 1 + cropPadding * 2,
      alphaBounds.maxY - alphaBounds.minY + 1 + cropPadding * 2,
      textureWidth,
      textureHeight
    )

    let solidPixelCount = 0
    for (let y = cropRect.y; y < cropRect.y + cropRect.height; y += 1) {
      for (let x = cropRect.x; x < cropRect.x + cropRect.width; x += 1) {
        const alpha = pixels[(y * textureWidth + x) * 4 + 3]
        if (alpha > alphaThreshold) {
          solidPixelCount += 1
        }
      }
    }

    const density = solidPixelCount / (cropRect.width * cropRect.height)
    const densityFactor = Math.max(0.55, Math.min(1.35, 0.65 + density * 2.4))
    const cellSize = Math.max(7, Math.min(18, Math.round(pixelConfig.cellSize / densityFactor)))
    const dynamicCoverage = Math.max(
      0.012,
      Math.min(0.04, pixelConfig.minCoverage + density * 0.004)
    )

    const columns = Math.max(1, Math.ceil(cropRect.width / cellSize))
    const rows = Math.max(1, Math.ceil(cropRect.height / cellSize))
    const centerX = cropRect.x + cropRect.width / 2
    const centerY = cropRect.y + cropRect.height / 2

    const tileContents: TileContent[] = []

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < columns; col += 1) {
        const tileRect = clampRect(
          cropRect.x + col * cellSize,
          cropRect.y + row * cellSize,
          Math.min(cellSize, cropRect.width - col * cellSize),
          Math.min(cellSize, cropRect.height - row * cellSize),
          textureWidth,
          textureHeight
        )

        if (tileRect.width <= 0 || tileRect.height <= 0) {
          continue
        }

        const tile = analyzeTile(pixels, textureWidth, tileRect, alphaThreshold)
        if (!tile || tile.coverage < dynamicCoverage) {
          continue
        }

        const safeRect = clampRect(
          tile.rect.x,
          tile.rect.y,
          tile.rect.width,
          tile.rect.height,
          textureWidth,
          textureHeight
        )

        tileContents.push({
          coverage: tile.coverage,
          rect: safeRect
        })
      }
    }

    const mergedRects = mergeHorizontalTiles(tileContents)

    mergedRects.forEach((contentRect) => {
      const safeRect = clampRect(
        contentRect.x,
        contentRect.y,
        contentRect.width,
        contentRect.height,
        textureWidth,
        textureHeight
      )

      const shardTexture = new Texture({
        source: generatedTexture.source,
        frame: safeRect,
        orig: safeRect,
        trim: safeRect,
        dynamic: false
      })
      shardTexture.source.scaleMode = 'nearest'

      const shardSprite = new Sprite(shardTexture)
      shardSprite.x = Math.round(16 + safeRect.x)
      shardSprite.y = Math.round(18 + safeRect.y)
      shardSprite.scale.set(1)

      const normalizedX = safeRect.x + safeRect.width / 2 - centerX
      const normalizedY = safeRect.y + safeRect.height / 2 - centerY
      const motion = createShardMotion(effectType, normalizedX, normalizedY, densityFactor)
      motion.originX = shardSprite.x
      motion.originY = shardSprite.y

      if (effectType === 'ash') {
        shardSprite.tint = 0xd6a46b
      } else if (effectType === 'dissolve') {
        shardSprite.tint = 0xaabbcc
      }

      shardsRef.current.push({
        sprite: shardSprite,
        ...motion
      })

      shatterLayer.addChild(shardSprite)
    })

    setShardCount(shardsRef.current.length)

    const ticker = (time: { deltaTime: number }): void => {
      shardsRef.current.forEach((shard, index) => {
        shard.age += time.deltaTime

        switch (effectType) {
          case 'fall':
            shard.velocityY += 0.32 * time.deltaTime
            shard.rotationSpeed += 0.001 * time.deltaTime
            shard.sprite.x = Math.round(shard.sprite.x + shard.velocityX * time.deltaTime)
            shard.sprite.y = Math.round(shard.sprite.y + shard.velocityY * time.deltaTime)
            shard.sprite.rotation += shard.rotationSpeed * time.deltaTime
            shard.sprite.scale.set(
              Math.max(0.2, shard.sprite.scale.x - shard.scaleDecay * time.deltaTime)
            )
            break
          case 'glitch':
            shard.sprite.x = Math.round(
              shard.sprite.x +
                shard.velocityX * time.deltaTime +
                Math.sin(shard.age * 0.3 + index) * shard.jitterX
            )
            shard.sprite.y = Math.round(
              shard.sprite.y +
                shard.velocityY * time.deltaTime +
                Math.cos(shard.age * 0.5 + index * 0.7) * shard.jitterY
            )
            if (Math.random() > 0.6) {
              shard.sprite.alpha = Math.max(
                0.15,
                shard.sprite.alpha - shard.fadeRate * 4 * time.deltaTime
              )
              const tints = [0xff3366, 0x33ffcc, 0x3366ff, 0xffff33]
              shard.sprite.tint = tints[Math.floor(Math.random() * tints.length)]
            }
            if (Math.random() > 0.85) {
              shard.sprite.x += (Math.random() - 0.5) * 8
            }
            break
          case 'ash':
            shard.velocityY -= 0.025 * time.deltaTime
            shard.velocityX += Math.sin(shard.age * 0.05 + index) * 0.01
            shard.sprite.x = Math.round(shard.sprite.x + shard.velocityX * time.deltaTime)
            shard.sprite.y = Math.round(shard.sprite.y + shard.velocityY * time.deltaTime)
            shard.sprite.rotation += shard.rotationSpeed * time.deltaTime
            shard.sprite.scale.set(
              Math.max(0.1, shard.sprite.scale.x - shard.scaleDecay * time.deltaTime)
            )
            if (shard.age > 15) {
              shard.sprite.tint = 0x888888
            }
            break
          case 'vortex': {
            const phase1Duration = 28
            if (shard.age < phase1Duration) {
              const progress = shard.age / phase1Duration
              const angle = progress * Math.PI * 3 + index * 0.4
              const radius = (1 - progress) * 60
              shard.sprite.x = Math.round(shard.originX + Math.cos(angle) * radius * (1 - progress))
              shard.sprite.y = Math.round(shard.originY + Math.sin(angle) * radius * (1 - progress))
              shard.sprite.rotation += shard.rotationSpeed * time.deltaTime * 2
              shard.sprite.scale.set(Math.max(0.4, 1 - progress * 0.5))
            } else {
              const burstAge = shard.age - phase1Duration
              const burstAngle = index * 0.618 * Math.PI * 2
              const burstSpeed = 2.5 + Math.random() * 1.5
              shard.sprite.x = Math.round(
                shard.sprite.x + Math.cos(burstAngle) * burstSpeed * time.deltaTime
              )
              shard.sprite.y = Math.round(
                shard.sprite.y +
                  Math.sin(burstAngle) * burstSpeed * time.deltaTime +
                  burstAge * 0.08
              )
              shard.sprite.rotation += shard.rotationSpeed * time.deltaTime * 3
              shard.sprite.scale.set(Math.max(0, shard.sprite.scale.x - 0.012 * time.deltaTime))
            }
            break
          }
          case 'dissolve':
            shard.velocityY += 0.06 * time.deltaTime
            shard.sprite.x = Math.round(
              shard.sprite.x +
                shard.velocityX * time.deltaTime +
                Math.sin(shard.age * 0.08 + index * 1.2) * shard.jitterX * 0.5
            )
            shard.sprite.y = Math.round(shard.sprite.y + shard.velocityY * time.deltaTime)
            shard.sprite.rotation += shard.rotationSpeed * time.deltaTime
            shard.sprite.scale.set(
              Math.max(0, shard.sprite.scale.x - shard.scaleDecay * time.deltaTime)
            )
            if (shard.age > 10) {
              shard.sprite.tint = 0x667788
            }
            break
          case 'burst':
          default:
            shard.velocityY += 0.24 * time.deltaTime
            shard.sprite.x = Math.round(shard.sprite.x + shard.velocityX * time.deltaTime)
            shard.sprite.y = Math.round(shard.sprite.y + shard.velocityY * time.deltaTime)
            shard.sprite.rotation += shard.rotationSpeed * time.deltaTime
            shard.sprite.scale.set(
              Math.max(0.3, shard.sprite.scale.x - shard.scaleDecay * time.deltaTime)
            )
            break
        }

        shard.sprite.alpha = Math.max(0, shard.sprite.alpha - shard.fadeRate * time.deltaTime)
      })
    }

    app.ticker.add(ticker)

    return () => {
      app.ticker.remove(ticker)
      destroyContainerChildren(previewLayer)
      destroyContainerChildren(shatterLayer)
      generatedTextureRef.current?.destroy(true)
      generatedTextureRef.current = null
      shardsRef.current = []
      setShardCount(0)
    }
  }, [
    active,
    effectType,
    isCanvasReady,
    particleState,
    pixelConfig.cellSize,
    pixelConfig.minCoverage,
    text
  ])

  return (
    <div
      ref={hostRef}
      className={`ritual-canvas h-64 w-full rounded-3xl border bg-black/20 ${active ? 'ritual-canvas--active border-[var(--accent-rose)]/40' : 'border-white/10'}`}
      data-effect-type={effectType}
      data-particle-state={particleState}
      data-shard-count={active ? String(shardCount) : '0'}
    />
  )
}

export default RitualCanvas
