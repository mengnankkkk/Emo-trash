export const emotionTagValues = [
  'anger',
  'collapse',
  'anxiety',
  'fatigue',
  'calm',
  'relief'
] as const

export const ritualEffectValues = ['burst', 'fall', 'glitch', 'ash', 'vortex', 'dissolve'] as const

export type EmotionTag = (typeof emotionTagValues)[number]
export type RitualEffect = (typeof ritualEffectValues)[number]

export interface EmotionDefinition {
  emotionTag: EmotionTag
  label: string
  displayName: string
  colorHex: string
  flowerType: number
}

export interface RitualEffectDefinition {
  value: RitualEffect
  label: string
}

export const emotionDefinitions: EmotionDefinition[] = [
  {
    emotionTag: 'anger',
    label: 'red',
    displayName: '愤怒',
    colorHex: '#f87171',
    flowerType: 1
  },
  {
    emotionTag: 'collapse',
    label: 'purple',
    displayName: '崩溃',
    colorHex: '#c084fc',
    flowerType: 2
  },
  {
    emotionTag: 'anxiety',
    label: 'yellow',
    displayName: '焦虑',
    colorHex: '#fbbf24',
    flowerType: 3
  },
  {
    emotionTag: 'fatigue',
    label: 'blue',
    displayName: '疲惫',
    colorHex: '#60a5fa',
    flowerType: 4
  },
  {
    emotionTag: 'calm',
    label: 'green',
    displayName: '平静',
    colorHex: '#34d399',
    flowerType: 5
  },
  {
    emotionTag: 'relief',
    label: 'pink',
    displayName: '释然',
    colorHex: '#fb7185',
    flowerType: 6
  }
]

export const ritualEffectDefinitions: RitualEffectDefinition[] = [
  { value: 'burst', label: '爆散' },
  { value: 'fall', label: '坠落' },
  { value: 'glitch', label: '故障' },
  { value: 'ash', label: '灰化' },
  { value: 'vortex', label: '漩涡' },
  { value: 'dissolve', label: '溶解' }
]

export function getEmotionDefinitionByTag(emotionTag: EmotionTag): EmotionDefinition {
  return emotionDefinitions.find((item) => item.emotionTag === emotionTag) ?? emotionDefinitions[0]
}

export function getEmotionDefinitionByFlowerType(flowerType: number): EmotionDefinition {
  const index =
    (((flowerType - 1) % emotionDefinitions.length) + emotionDefinitions.length) %
    emotionDefinitions.length
  return emotionDefinitions[index]
}

export function getRitualEffectDefinition(effect: RitualEffect): RitualEffectDefinition {
  return ritualEffectDefinitions.find((item) => item.value === effect) ?? ritualEffectDefinitions[0]
}
