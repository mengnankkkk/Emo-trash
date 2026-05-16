import { Texture } from 'pixi.js'
import {
  emotionDefinitions,
  getEmotionDefinitionByFlowerType,
  getEmotionDefinitionByTag,
  type EmotionTag
} from '../../../shared/emotionMeta'

export interface FlowerAsset {
  emotionTag: EmotionTag
  label: string
  displayName: string
  colorHex: string
  flowerType: number
  textureUrl: string
}

let cachedFlowerAssets: FlowerAsset[] | null = null

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
  const meta = emotionDefinitions[index]
  if (!ctx) {
    return {
      ...meta,
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
    textureUrl: canvas.toDataURL('image/png')
  }
}

export function getFlowerAssets(): FlowerAsset[] {
  if (!cachedFlowerAssets) {
    cachedFlowerAssets = emotionDefinitions.map((_, index) => buildPlaceholderFlowerTexture(index))
  }

  return cachedFlowerAssets
}

export function createPlaceholderFlowerAssets(): FlowerAsset[] {
  return getFlowerAssets()
}

export function getFlowerAssetByType(flowerType: number): FlowerAsset {
  const meta = getEmotionDefinitionByFlowerType(flowerType)
  const assets = getFlowerAssets()
  return assets.find((asset) => asset.flowerType === meta.flowerType) ?? assets[0]
}

export function getFlowerAssetByTag(emotionTag: EmotionTag): FlowerAsset {
  const meta = getEmotionDefinitionByTag(emotionTag)
  const assets = getFlowerAssets()
  return assets.find((asset) => asset.emotionTag === meta.emotionTag) ?? assets[0]
}

export function ensureNearestTexture(texture: Texture): Texture {
  texture.source.scaleMode = 'nearest'
  texture.source.autoGenerateMipmaps = false
  return texture
}
