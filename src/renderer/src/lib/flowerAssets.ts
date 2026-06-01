import { Texture } from 'pixi.js'
import {
  emotionDefinitions,
  getEmotionDefinitionByFlowerType,
  getEmotionDefinitionByTag,
  type EmotionTag
} from '../../../shared/emotionMeta'
import type { FlowerRarity } from '../../../shared/rarity'

export interface FlowerAsset {
  emotionTag: EmotionTag
  label: string
  displayName: string
  colorHex: string
  flowerType: number
  textureUrl: string
}

let cachedFlowerAssets: FlowerAsset[] | null = null
const dexTextureCache = new Map<string, string>()

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

/**
 * 为图鉴生成不同稀有度的像素花朵纹理（32x32）
 */
export function buildDexFlowerTexture(emotionTag: EmotionTag, rarity: FlowerRarity): string {
  const cacheKey = `${emotionTag}-${rarity}`
  if (dexTextureCache.has(cacheKey)) {
    return dexTextureCache.get(cacheKey)!
  }

  const canvas = document.createElement('canvas')
  canvas.width = 32
  canvas.height = 32
  const ctx = canvas.getContext('2d')

  if (!ctx) return ''

  ctx.clearRect(0, 0, 32, 32)
  ctx.imageSmoothingEnabled = false

  const meta = emotionDefinitions.find((d) => d.emotionTag === emotionTag) ?? emotionDefinitions[0]
  const baseColor = meta.colorHex

  // 稀有度颜色变体
  const rarityColors: Record<FlowerRarity, { highlight: string; glow: string }> = {
    common: { highlight: baseColor, glow: 'transparent' },
    shiny: { highlight: '#67e8f9', glow: '#06b6d4' },
    stellar: { highlight: '#d8b4fe', glow: '#9333ea' },
    legendary: { highlight: '#fbbf24', glow: '#f59e0b' }
  }

  const colors = rarityColors[rarity]
  const stem = '#3f6212'
  const stemLight = '#65a30d'
  const petalMain = rarity === 'common' ? baseColor : colors.highlight
  const petalDark = baseColor
  const center = rarity === 'legendary' ? '#fff' : '#fde68a'

  // 茎
  drawPixel(ctx, 15, 20, 2, stem)
  drawPixel(ctx, 15, 22, 2, stem)
  drawPixel(ctx, 15, 24, 2, stem)
  drawPixel(ctx, 15, 26, 2, stem)
  drawPixel(ctx, 15, 28, 2, stem)
  // 叶子
  drawPixel(ctx, 13, 24, 2, stemLight)
  drawPixel(ctx, 11, 25, 2, stemLight)
  drawPixel(ctx, 17, 26, 2, stemLight)
  drawPixel(ctx, 19, 27, 2, stemLight)

  // 花瓣（根据稀有度不同形状）
  if (rarity === 'common') {
    // 普通：简单五瓣花
    drawPixel(ctx, 15, 6, 2, petalDark)
    drawPixel(ctx, 11, 10, 2, petalDark)
    drawPixel(ctx, 19, 10, 2, petalDark)
    drawPixel(ctx, 13, 8, 2, petalMain)
    drawPixel(ctx, 17, 8, 2, petalMain)
    drawPixel(ctx, 11, 12, 2, petalMain)
    drawPixel(ctx, 19, 12, 2, petalMain)
    drawPixel(ctx, 13, 14, 2, petalDark)
    drawPixel(ctx, 17, 14, 2, petalDark)
    drawPixel(ctx, 15, 16, 2, petalDark)
    drawPixel(ctx, 15, 10, 2, center)
    drawPixel(ctx, 15, 12, 2, center)
  } else if (rarity === 'shiny') {
    // 闪光：更大的花瓣+闪光点
    drawPixel(ctx, 15, 4, 2, petalMain)
    drawPixel(ctx, 13, 6, 2, petalMain)
    drawPixel(ctx, 17, 6, 2, petalMain)
    drawPixel(ctx, 9, 10, 2, petalDark)
    drawPixel(ctx, 11, 8, 2, petalMain)
    drawPixel(ctx, 19, 8, 2, petalMain)
    drawPixel(ctx, 21, 10, 2, petalDark)
    drawPixel(ctx, 9, 12, 2, petalMain)
    drawPixel(ctx, 21, 12, 2, petalMain)
    drawPixel(ctx, 11, 14, 2, petalDark)
    drawPixel(ctx, 19, 14, 2, petalDark)
    drawPixel(ctx, 13, 16, 2, petalDark)
    drawPixel(ctx, 17, 16, 2, petalDark)
    drawPixel(ctx, 15, 10, 2, center)
    drawPixel(ctx, 15, 12, 2, center)
    // 闪光点
    drawPixel(ctx, 7, 6, 1, '#fff')
    drawPixel(ctx, 23, 8, 1, '#fff')
    drawPixel(ctx, 5, 14, 1, colors.glow)
  } else if (rarity === 'stellar') {
    // 星光：星形花瓣
    drawPixel(ctx, 15, 2, 2, petalMain)
    drawPixel(ctx, 15, 4, 2, petalMain)
    drawPixel(ctx, 7, 10, 2, petalMain)
    drawPixel(ctx, 9, 10, 2, petalMain)
    drawPixel(ctx, 21, 10, 2, petalMain)
    drawPixel(ctx, 23, 10, 2, petalMain)
    drawPixel(ctx, 11, 6, 2, petalDark)
    drawPixel(ctx, 19, 6, 2, petalDark)
    drawPixel(ctx, 11, 14, 2, petalDark)
    drawPixel(ctx, 19, 14, 2, petalDark)
    drawPixel(ctx, 13, 16, 2, petalMain)
    drawPixel(ctx, 17, 16, 2, petalMain)
    drawPixel(ctx, 15, 18, 2, petalMain)
    drawPixel(ctx, 13, 8, 2, petalMain)
    drawPixel(ctx, 17, 8, 2, petalMain)
    drawPixel(ctx, 13, 12, 2, petalMain)
    drawPixel(ctx, 17, 12, 2, petalMain)
    drawPixel(ctx, 15, 10, 2, center)
    // 星星粒子
    drawPixel(ctx, 5, 4, 1, colors.glow)
    drawPixel(ctx, 25, 6, 1, colors.glow)
    drawPixel(ctx, 3, 16, 1, '#fff')
    drawPixel(ctx, 27, 14, 1, '#fff')
  } else {
    // 传说：大型多层花瓣+光环
    drawPixel(ctx, 15, 2, 2, '#fbbf24')
    drawPixel(ctx, 13, 4, 2, '#f59e0b')
    drawPixel(ctx, 17, 4, 2, '#f59e0b')
    drawPixel(ctx, 7, 8, 2, petalDark)
    drawPixel(ctx, 9, 6, 2, '#fbbf24')
    drawPixel(ctx, 21, 6, 2, '#fbbf24')
    drawPixel(ctx, 23, 8, 2, petalDark)
    drawPixel(ctx, 7, 12, 2, '#f59e0b')
    drawPixel(ctx, 23, 12, 2, '#f59e0b')
    drawPixel(ctx, 9, 14, 2, petalDark)
    drawPixel(ctx, 21, 14, 2, petalDark)
    drawPixel(ctx, 11, 16, 2, '#fbbf24')
    drawPixel(ctx, 19, 16, 2, '#fbbf24')
    drawPixel(ctx, 13, 18, 2, petalDark)
    drawPixel(ctx, 17, 18, 2, petalDark)
    drawPixel(ctx, 11, 8, 2, petalMain)
    drawPixel(ctx, 19, 8, 2, petalMain)
    drawPixel(ctx, 11, 12, 2, petalMain)
    drawPixel(ctx, 19, 12, 2, petalMain)
    drawPixel(ctx, 13, 10, 2, petalMain)
    drawPixel(ctx, 17, 10, 2, petalMain)
    drawPixel(ctx, 15, 10, 2, center)
    drawPixel(ctx, 15, 12, 2, center)
    // 光环粒子
    drawPixel(ctx, 3, 2, 1, '#fbbf24')
    drawPixel(ctx, 27, 4, 1, '#f59e0b')
    drawPixel(ctx, 1, 14, 1, '#fff')
    drawPixel(ctx, 29, 16, 1, '#fff')
    drawPixel(ctx, 5, 28, 1, '#fbbf24')
    drawPixel(ctx, 25, 26, 1, '#f59e0b')
  }

  const url = canvas.toDataURL('image/png')
  dexTextureCache.set(cacheKey, url)
  return url
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
