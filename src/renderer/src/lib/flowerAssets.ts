import { Texture } from 'pixi.js'

export interface FlowerAsset {
  label: string
  textureUrl: string
}

const FLOWER_PALETTES = [
  ['#4b5563', '#ef4444', '#fca5a5', '#fee2e2'],
  ['#4338ca', '#a855f7', '#c4b5fd', '#ede9fe'],
  ['#ca8a04', '#f59e0b', '#fde68a', '#fef3c7'],
  ['#0f766e', '#06b6d4', '#67e8f9', '#cffafe'],
  ['#166534', '#22c55e', '#86efac', '#dcfce7'],
  ['#7c2d12', '#fb7185', '#fda4af', '#ffe4e6']
]

const FLOWER_LABELS = ['red', 'purple', 'yellow', 'blue', 'green', 'pink']

function drawPixel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string
): void {
  ctx.fillStyle = color
  ctx.fillRect(x, y, size, size)
}

function buildPlaceholderFlowerTexture(index: number): FlowerAsset {
  const canvas = document.createElement('canvas')
  canvas.width = 16
  canvas.height = 16

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return { label: FLOWER_LABELS[index], textureUrl: '' }
  }

  ctx.clearRect(0, 0, 16, 16)
  ctx.imageSmoothingEnabled = false

  const palette = FLOWER_PALETTES[index % FLOWER_PALETTES.length]
  const stem = palette[0]
  const petalDark = palette[1]
  const petalLight = palette[2]
  const center = palette[3]

  // stem
  drawPixel(ctx, 7, 10, 2, stem)
  drawPixel(ctx, 7, 11, 2, stem)
  drawPixel(ctx, 7, 12, 2, stem)
  drawPixel(ctx, 8, 13, 2, stem)
  drawPixel(ctx, 8, 14, 2, stem)

  // leaves
  drawPixel(ctx, 5, 11, 2, stem)
  drawPixel(ctx, 4, 12, 2, stem)
  drawPixel(ctx, 10, 12, 2, stem)
  drawPixel(ctx, 11, 13, 2, stem)

  // petals
  drawPixel(ctx, 7, 4, 2, petalDark)
  drawPixel(ctx, 5, 5, 2, petalDark)
  drawPixel(ctx, 9, 5, 2, petalDark)
  drawPixel(ctx, 4, 7, 2, petalLight)
  drawPixel(ctx, 6, 7, 2, petalLight)
  drawPixel(ctx, 8, 7, 2, petalLight)
  drawPixel(ctx, 10, 7, 2, petalLight)
  drawPixel(ctx, 5, 9, 2, petalDark)
  drawPixel(ctx, 9, 9, 2, petalDark)
  drawPixel(ctx, 7, 8, 2, petalLight)
  drawPixel(ctx, 6, 6, 2, petalLight)
  drawPixel(ctx, 8, 6, 2, petalLight)

  // center
  drawPixel(ctx, 7, 7, 2, center)

  return {
    label: FLOWER_LABELS[index],
    textureUrl: canvas.toDataURL('image/png')
  }
}

export function getFlowerAssets(): FlowerAsset[] {
  return FLOWER_LABELS.map((label, index) => {
    const normalizedPath = `/flowers/flower-${index + 1}.png`
    return {
      label,
      textureUrl: normalizedPath
    }
  })
}

export function createPlaceholderFlowerAssets(): FlowerAsset[] {
  return FLOWER_LABELS.map((_, index) => buildPlaceholderFlowerTexture(index))
}

export function ensureNearestTexture(texture: Texture): Texture {
  texture.source.scaleMode = 'nearest'
  texture.source.autoGenerateMipmaps = false
  return texture
}
