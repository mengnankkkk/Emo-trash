import { getFlowerAssetByTag } from './flowerAssets'
import type { EmotionFeatureInput, EmotionTag } from '../types/emotion'

const ANGERS = ['恨', '滚', '怒', '气', '烦', '妈的']
const COLLAPSES = ['崩', '崩溃', '完蛋', '受不了', '炸了']
const ANXIETIES = ['怕', '焦虑', '紧张', '不安', '慌']
const FATIGUES = ['累', '麻了', '疲惫', '困', '倦']
const CALMS = ['平静', '安静', '稳定', '慢下来', '放空']
const RELIEFS = ['终于', '松了一口气', '释然', '轻松', '解脱']

function includesAny(text: string, phrases: string[]): boolean {
  return phrases.some((phrase) => text.includes(phrase))
}

function resolveEmotionTag(
  trimmedText: string,
  emphasisLevel: number,
  exclamationDensity: number
): EmotionTag {
  if (includesAny(trimmedText, RELIEFS)) {
    return 'relief'
  }

  if (includesAny(trimmedText, CALMS)) {
    return 'calm'
  }

  if (includesAny(trimmedText, COLLAPSES)) {
    return 'collapse'
  }

  if (includesAny(trimmedText, ANGERS) || exclamationDensity > 0.14) {
    return 'anger'
  }

  if (includesAny(trimmedText, ANXIETIES)) {
    return 'anxiety'
  }

  if (includesAny(trimmedText, FATIGUES) || emphasisLevel <= 2) {
    return 'fatigue'
  }

  return emphasisLevel >= 7 ? 'collapse' : 'anxiety'
}

export function extractEmotionFeatures(text: string): EmotionFeatureInput {
  const trimmedText = text.trim()
  const textLength = trimmedText.length
  const exclamationMatches = trimmedText.match(/[!！]/g) ?? []
  const exclamationDensity =
    textLength === 0 ? 0 : Math.min(1, exclamationMatches.length / textLength)

  const emphasisLevel = Math.min(12, exclamationMatches.length + Math.ceil(textLength / 18))

  const emotionTag = resolveEmotionTag(trimmedText, emphasisLevel, exclamationDensity)
  const flowerAsset = getFlowerAssetByTag(emotionTag)

  return {
    textLength,
    exclamationDensity,
    emphasisLevel,
    flowerType: flowerAsset.flowerType,
    colorHex: flowerAsset.colorHex,
    emotionTag
  }
}
