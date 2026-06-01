import { z } from 'zod'
import { emotionTagValues, getEmotionDefinitionByTag, type EmotionTag } from './emotionMeta'

export const emotionIntensityValues = ['mild', 'moderate', 'strong'] as const
export const analysisSourceValues = ['ai', 'rule-fallback', 'browser-preview'] as const

export const emotionIntensitySchema = z.enum(emotionIntensityValues)
export const analysisSourceSchema = z.enum(analysisSourceValues)

export const aiEmotionModelOutputSchema = z.object({
  emotionTag: z.enum(emotionTagValues),
  emotionIntensity: emotionIntensitySchema,
  triggerScene: z.string().trim().min(1).max(40),
  guidanceQuestion: z.string().trim().min(1).max(120),
  suggestedLabels: z.array(z.string().trim().min(1).max(24)).max(6).default([]),
  confidence: z.number().min(0).max(1)
})

export const emotionAnalysisMetadataSchema = z.object({
  emotionIntensity: emotionIntensitySchema,
  triggerScene: z.string().trim().min(1).max(40),
  guidanceQuestion: z.string().trim().min(1).max(120),
  suggestedLabels: z.array(z.string().trim().min(1).max(24)).max(6),
  confidence: z.number().min(0).max(1),
  timeContextHour: z.number().int().min(0).max(23),
  timeContextLabel: z.string().trim().min(1).max(32),
  source: analysisSourceSchema,
  sourceModel: z.string().trim().min(1).max(120)
})

export const emotionAnalysisSchema = z.object({
  textLength: z.number().int().nonnegative(),
  exclamationDensity: z.number().min(0).max(1),
  emphasisLevel: z.number().int().min(0).max(12),
  flowerType: z.number().int().min(1).max(6),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  emotionTag: z.enum(emotionTagValues),
  analysis: emotionAnalysisMetadataSchema
})

export type EmotionIntensity = z.infer<typeof emotionIntensitySchema>
export type AnalysisSource = z.infer<typeof analysisSourceSchema>
export type EmotionAnalysisMetadata = z.infer<typeof emotionAnalysisMetadataSchema>
export type EmotionAnalysisResult = z.infer<typeof emotionAnalysisSchema>
export type AiEmotionModelOutput = z.infer<typeof aiEmotionModelOutputSchema>

const ANGER_KEYWORDS = ['气死', '烦死', '生气', '愤怒', '火大', '忍不了', '气炸']
const COLLAPSE_KEYWORDS = ['崩溃', '完蛋', '受不了', '撑不住', '炸了', '绝望']
const ANXIETY_KEYWORDS = ['焦虑', '紧张', '不安', '担心', '害怕', '慌']
const FATIGUE_KEYWORDS = ['好累', '累死', '疲惫', '麻了', '困', '倦']
const CALM_KEYWORDS = ['平静', '安静', '稳定', '慢下来', '放空', '沉住气']
const RELIEF_KEYWORDS = ['终于', '松一口气', '释然', '轻松', '解脱', '缓过来']

const SCENE_KEYWORDS: Array<{ scene: string; keywords: string[] }> = [
  { scene: '工作压力', keywords: ['工作', '同事', '开会', '老板', '加班', '汇报', '项目', '客户'] },
  { scene: '学业任务', keywords: ['考试', '作业', '论文', '老师', '上课', '学习', '答辩'] },
  { scene: '关系互动', keywords: ['朋友', '对象', '恋爱', '分手', '聊天', '冷战'] },
  { scene: '家庭相处', keywords: ['家里', '父母', '妈妈', '爸爸', '家人'] },
  { scene: '身体状态', keywords: ['失眠', '身体', '生病', '头疼', '胃疼', '痛'] },
  { scene: '社交压力', keywords: ['社交', '尴尬', '人群', '发言', '评价'] }
]

const DEFAULT_LABELS: Record<EmotionTag, string[]> = {
  anger: ['生气', '委屈', '压抑'],
  collapse: ['崩溃', '失控', '撑不住'],
  anxiety: ['焦虑', '紧张', '不安'],
  fatigue: ['疲惫', '麻木', '透支'],
  calm: ['平静', '缓和', '整理中'],
  relief: ['释然', '松一口气', '放下']
}

const DEFAULT_GUIDANCE: Record<EmotionTag, Record<EmotionIntensity, string>> = {
  anger: {
    mild: '这股不舒服更像是被打断、被误解，还是被冒犯了？',
    moderate: '这件事里，最让你生气的瞬间是什么？',
    strong: '先别急着压住它，发生了什么让你这么生气？'
  },
  collapse: {
    mild: '是突然的一件事压到了你，还是累积到现在的结果？',
    moderate: '现在最让你撑不住的点，具体是什么？',
    strong: '先陪自己停一下，哪一部分最让你有要崩掉的感觉？'
  },
  anxiety: {
    mild: '你现在担心的，是还没发生的结果，还是正在逼近的任务？',
    moderate: '如果把焦虑拆开，最卡住你的是哪一件事？',
    strong: '此刻最让你紧绷的念头是什么？我们先只看这一件。'
  },
  fatigue: {
    mild: '这更像身体累，还是心里累？',
    moderate: '最近是哪件事最持续地消耗你？',
    strong: '你已经扛了多久？最想先放下的是什么？'
  },
  calm: {
    mild: '这份平静更像休息后的缓和，还是终于想明白了？',
    moderate: '是什么让你慢慢稳定下来了？',
    strong: '你是怎么把自己重新安顿下来的？'
  },
  relief: {
    mild: '你刚刚放下的是哪件小事？',
    moderate: '是什么终于让你松了一口气？',
    strong: '这次真正让你轻下来的关键转折是什么？'
  }
}

function includesAny(text: string, phrases: string[]): boolean {
  return phrases.some((phrase) => text.includes(phrase))
}

function dedupeLabels(labels: string[]): string[] {
  return [...new Set(labels.map((item) => item.trim()).filter(Boolean))].slice(0, 6)
}

export function getTimeContextLabel(hour: number): string {
  if (hour <= 5) {
    return '凌晨 00:00 - 05:59'
  }

  if (hour <= 8) {
    return '清晨 06:00 - 08:59'
  }

  if (hour <= 11) {
    return '上午 09:00 - 11:59'
  }

  if (hour <= 13) {
    return '中午 12:00 - 13:59'
  }

  if (hour <= 17) {
    return '下午 14:00 - 17:59'
  }

  if (hour <= 22) {
    return '晚上 18:00 - 22:59'
  }

  return '深夜 23:00 - 23:59'
}

export function detectEmotionIntensity(
  textLength: number,
  emphasisLevel: number,
  exclamationDensity: number
): EmotionIntensity {
  if (emphasisLevel >= 8 || exclamationDensity >= 0.12 || textLength >= 80) {
    return 'strong'
  }

  if (emphasisLevel >= 4 || exclamationDensity >= 0.05 || textLength >= 24) {
    return 'moderate'
  }

  return 'mild'
}

function resolveEmotionTag(
  trimmedText: string,
  emphasisLevel: number,
  exclamationDensity: number
): EmotionTag {
  if (includesAny(trimmedText, RELIEF_KEYWORDS)) {
    return 'relief'
  }

  if (includesAny(trimmedText, CALM_KEYWORDS)) {
    return 'calm'
  }

  if (includesAny(trimmedText, COLLAPSE_KEYWORDS)) {
    return 'collapse'
  }

  if (includesAny(trimmedText, ANGER_KEYWORDS) || exclamationDensity > 0.14) {
    return 'anger'
  }

  if (includesAny(trimmedText, ANXIETY_KEYWORDS)) {
    return 'anxiety'
  }

  if (includesAny(trimmedText, FATIGUE_KEYWORDS) || emphasisLevel <= 2) {
    return 'fatigue'
  }

  return emphasisLevel >= 7 ? 'collapse' : 'anxiety'
}

export function detectTriggerScene(text: string): string {
  const trimmed = text.trim()
  const matched = SCENE_KEYWORDS.find((entry) => includesAny(trimmed, entry.keywords))
  return matched?.scene ?? '日常情绪波动'
}

export function extractEmotionTextFeatures(text: string): {
  trimmedText: string
  textLength: number
  exclamationDensity: number
  emphasisLevel: number
  emotionTag: EmotionTag
} {
  const trimmedText = text.trim()
  const textLength = trimmedText.length
  const exclamationMatches = trimmedText.match(/[!！?？]+/g) ?? []
  const punctuationWeight = exclamationMatches.reduce((sum, token) => sum + token.length, 0)
  const exclamationDensity = textLength === 0 ? 0 : Math.min(1, punctuationWeight / textLength)
  const emphasisLevel = Math.min(12, punctuationWeight + Math.ceil(textLength / 18))
  const emotionTag = resolveEmotionTag(trimmedText, emphasisLevel, exclamationDensity)

  return {
    trimmedText,
    textLength,
    exclamationDensity,
    emphasisLevel,
    emotionTag
  }
}

export function buildEmotionAnalysisMetadata(input: {
  emotionTag: EmotionTag
  hour: number
  source: AnalysisSource
  sourceModel: string
  emotionIntensity?: EmotionIntensity
  triggerScene?: string
  guidanceQuestion?: string
  suggestedLabels?: string[]
  confidence?: number
}): EmotionAnalysisMetadata {
  const intensity = input.emotionIntensity ?? 'moderate'

  return {
    emotionIntensity: intensity,
    triggerScene: input.triggerScene?.trim() || '日常情绪波动',
    guidanceQuestion:
      input.guidanceQuestion?.trim() || DEFAULT_GUIDANCE[input.emotionTag][intensity],
    suggestedLabels: dedupeLabels(input.suggestedLabels ?? DEFAULT_LABELS[input.emotionTag]),
    confidence: Math.max(0, Math.min(1, input.confidence ?? 0.6)),
    timeContextHour: input.hour,
    timeContextLabel: getTimeContextLabel(input.hour),
    source: input.source,
    sourceModel: input.sourceModel.trim() || 'built-in-rules'
  }
}

export function buildEmotionAnalysisResult(input: {
  text: string
  hour: number
  emotionTag: EmotionTag
  source: AnalysisSource
  sourceModel: string
  emotionIntensity?: EmotionIntensity
  triggerScene?: string
  guidanceQuestion?: string
  suggestedLabels?: string[]
  confidence?: number
}): EmotionAnalysisResult {
  const features = extractEmotionTextFeatures(input.text)
  const definition = getEmotionDefinitionByTag(input.emotionTag)

  return {
    textLength: features.textLength,
    exclamationDensity: features.exclamationDensity,
    emphasisLevel: features.emphasisLevel,
    flowerType: definition.flowerType,
    colorHex: definition.colorHex,
    emotionTag: input.emotionTag,
    analysis: buildEmotionAnalysisMetadata({
      emotionTag: input.emotionTag,
      hour: input.hour,
      source: input.source,
      sourceModel: input.sourceModel,
      emotionIntensity: input.emotionIntensity,
      triggerScene: input.triggerScene,
      guidanceQuestion: input.guidanceQuestion,
      suggestedLabels: input.suggestedLabels,
      confidence: input.confidence
    })
  }
}

export function buildRuleBasedEmotionAnalysis(
  text: string,
  options: {
    now?: Date
    source?: AnalysisSource
    sourceModel?: string
  } = {}
): EmotionAnalysisResult {
  const now = options.now ?? new Date()
  const features = extractEmotionTextFeatures(text)
  const intensity = detectEmotionIntensity(
    features.textLength,
    features.emphasisLevel,
    features.exclamationDensity
  )

  return buildEmotionAnalysisResult({
    text,
    hour: now.getHours(),
    emotionTag: features.emotionTag,
    source: options.source ?? 'rule-fallback',
    sourceModel: options.sourceModel ?? 'built-in-rules',
    emotionIntensity: intensity,
    triggerScene: detectTriggerScene(features.trimmedText),
    guidanceQuestion: DEFAULT_GUIDANCE[features.emotionTag][intensity],
    suggestedLabels: DEFAULT_LABELS[features.emotionTag],
    confidence: intensity === 'strong' ? 0.7 : 0.58
  })
}
