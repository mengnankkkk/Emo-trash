import { Texture } from 'pixi.js'
import type { EmotionTag } from '../types/emotion'

export interface FlowerAsset {
  emotionTag: EmotionTag
  label: string
  displayName: string
  colorHex: string
  flowerType: number
  textureUrl: string
}

const FLOWER_ASSET_DEFINITIONS: Array<{
  emotionTag: EmotionTag
  label: string
  displayName: string
  colorHex: string
}> = [
  { emotionTag: 'anger', label: 'red', displayName: '愤怒', colorHex: '#f87171' },
  { emotionTag: 'collapse', label: 'purple', displayName: '崩溃', colorHex: '#c084fc' },
  { emotionTag: 'anxiety', label: 'yellow', displayName: '焦虑', colorHex: '#fbbf24' },
  { emotionTag: 'fatigue', label: 'blue', displayName: '疲惫', colorHex: '#60a5fa' },
  { emotionTag: 'calm', label: 'green', displayName: '平静', colorHex: '#34d399' },
  { emotionTag: 'relief', label: 'pink', displayName: '释然', colorHex: '#fb7185' }
]

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
  const meta = FLOWER_ASSET_DEFINITIONS[index]
  if (!ctx) {
    return {
      ...meta,
      flowerType: index + 1,
      textureUrl: ''
    }
  }

  ctx.clearRect(0, 0, 16, 16)
  ctx.imageSmoothingEnabled = false

  const stem = '#3f6212'
  const petalDark = meta.colorHex
  const petalLight = meta.colorHex.replace('f8', 'fd')
  const center = '#fde68a'

  drawPixel(ctx, 7, 10, 2, stem)
  drawPixel(ctx, 7, 11, 2, stem)
  drawPixel(ctx, 7, 12, 2, stem)
  drawPixel(ctx, 8, 13, 2, stem)
  drawPixel(ctx, 8, 14, 2, stem)
  drawPixel(ctx, 5, 11, 2, stem)
  drawPixel(ctx, 4, 12, 2, stem)
  drawPixel(ctx, 10, 12, 2, stem)
  drawPixel(ctx, 11, 13, 2, stem)

  drawPixel(ctx, 7, 3, 2, petalDark)
  drawPixel(ctx, 5, 5, 2, petalDark)
  drawPixel(ctx, 9, 5, 2, petalDark)
  drawPixel(ctx, 4, 7, 2, petalLight)
  drawPixel(ctx, 6, 7, 2, petalLight)
  drawPixel(ctx, 8, 7, 2, petalLight)
  drawPixel(ctx, 10, 7, 2, petalLight)
  drawPixel(ctx, 5, 9, 2, petalDark)
  drawPixel(ctx, 9, 9, 2, petalDark)
  drawPixel(ctx, 6, 5, 2, petalLight)
  drawPixel(ctx, 8, 5, 2, petalLight)
  drawPixel(ctx, 7, 8, 2, center)

  return {
    ...meta,
    flowerType: index + 1,
    textureUrl: canvas.toDataURL('image/png')
  }
}

export function getFlowerAssets(): FlowerAsset[] {
  return FLOWER_ASSET_DEFINITIONS.map((meta, index) => ({
    ...meta,
    flowerType: index + 1,
    textureUrl: `/flowers/flower-${index + 1}.png`
  }))
}

export function createPlaceholderFlowerAssets(): FlowerAsset[] {
  return FLOWER_ASSET_DEFINITIONS.map((_, index) => buildPlaceholderFlowerTexture(index))
}

export function getFlowerAssetByType(flowerType: number): FlowerAsset {
  const assets = createPlaceholderFlowerAssets()
  return assets[(flowerType - 1 + assets.length) % assets.length]
}

export function getFlowerAssetByTag(emotionTag: EmotionTag): FlowerAsset {
  const assets = createPlaceholderFlowerAssets()
  const found = assets.find((asset) => asset.emotionTag === emotionTag)
  return found ?? assets[0]
}

export function ensureNearestTexture(texture: Texture): Texture {
  texture.source.scaleMode = 'nearest'
  texture.source.autoGenerateMipmaps = false
  return texture
}
