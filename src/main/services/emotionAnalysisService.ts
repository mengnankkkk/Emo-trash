import OpenAI from 'openai'
import {
  aiEmotionModelOutputSchema,
  buildEmotionAnalysisResult,
  buildRuleBasedEmotionAnalysis,
  detectEmotionIntensity,
  detectTriggerScene,
  extractEmotionTextFeatures,
  type EmotionAnalysisResult
} from '../../shared/emotionAnalysis'

interface EmotionAiConfig {
  apiKey: string
  baseURL?: string
  model: string
}

function readConfig(): EmotionAiConfig | null {
  const apiKey = process.env.EMO_TRASH_OPENAI_API_KEY?.trim()
  const model = process.env.EMO_TRASH_OPENAI_MODEL?.trim()

  if (!apiKey || !model) {
    return null
  }

  return {
    apiKey,
    model,
    baseURL: process.env.EMO_TRASH_OPENAI_BASE_URL?.trim() || undefined
  }
}

function buildJsonSchema(): {
  name: string
  strict: boolean
  schema: {
    type: 'object'
    additionalProperties: false
    properties: Record<string, unknown>
    required: string[]
  }
} {
  return {
    name: 'emotion_analysis',
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        emotionTag: {
          type: 'string',
          enum: ['anger', 'collapse', 'anxiety', 'fatigue', 'calm', 'relief']
        },
        emotionIntensity: {
          type: 'string',
          enum: ['mild', 'moderate', 'strong']
        },
        triggerScene: {
          type: 'string'
        },
        guidanceQuestion: {
          type: 'string'
        },
        suggestedLabels: {
          type: 'array',
          items: { type: 'string' },
          maxItems: 6
        },
        confidence: {
          type: 'number',
          minimum: 0,
          maximum: 1
        }
      },
      required: [
        'emotionTag',
        'emotionIntensity',
        'triggerScene',
        'guidanceQuestion',
        'suggestedLabels',
        'confidence'
      ]
    },
    strict: true
  }
}

function buildSystemPrompt(hour: number): string {
  return [
    '你是一个中文情绪识别助手。',
    '你的任务是把用户输入识别为一个最主要的情绪标签，并输出严格 JSON。',
    'emotionTag 只能是 anger, collapse, anxiety, fatigue, calm, relief 之一。',
    'emotionIntensity 只能是 mild, moderate, strong 之一。',
    'triggerScene 要概括触发场景，限制在 12 个汉字以内。',
    'guidanceQuestion 要温和、具体、帮助继续表达，限制在 40 个汉字以内。',
    'suggestedLabels 返回 2 到 4 个中文短标签。',
    'confidence 返回 0 到 1 之间的小数。',
    `当前是 24 小时制 ${hour} 点，请结合这个时间语境理解用户处境，但不要编造事实。`
  ].join('\n')
}

function buildUserPrompt(text: string): string {
  return [
    '请分析下面这段情绪文本，并给出结构化结果。',
    '不要解释，不要添加多余字段。',
    '',
    text.trim()
  ].join('\n')
}

export class EmotionAnalysisService {
  private readonly config = readConfig()
  private readonly client = this.config
    ? new OpenAI({
        apiKey: this.config.apiKey,
        baseURL: this.config.baseURL
      })
    : null

  async analyze(text: string, now = new Date()): Promise<EmotionAnalysisResult> {
    const trimmedText = text.trim()
    const ruleBased = buildRuleBasedEmotionAnalysis(trimmedText, { now })

    if (!trimmedText) {
      return ruleBased
    }

    if (!this.client || !this.config) {
      return ruleBased
    }

    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content: buildSystemPrompt(now.getHours())
          },
          {
            role: 'user',
            content: buildUserPrompt(trimmedText)
          }
        ],
        response_format: {
          type: 'json_schema',
          json_schema: buildJsonSchema()
        }
      })

      const content = response.choices[0]?.message?.content?.trim()
      if (!content) {
        return ruleBased
      }

      const parsed = aiEmotionModelOutputSchema.parse(JSON.parse(content))
      const textFeatures = extractEmotionTextFeatures(trimmedText)

      return buildEmotionAnalysisResult({
        text: trimmedText,
        hour: now.getHours(),
        emotionTag: parsed.emotionTag,
        source: 'ai',
        sourceModel: this.config.model,
        emotionIntensity:
          parsed.emotionIntensity ||
          detectEmotionIntensity(
            textFeatures.textLength,
            textFeatures.emphasisLevel,
            textFeatures.exclamationDensity
          ),
        triggerScene: parsed.triggerScene || detectTriggerScene(trimmedText),
        guidanceQuestion: parsed.guidanceQuestion,
        suggestedLabels: parsed.suggestedLabels,
        confidence: parsed.confidence
      })
    } catch (error) {
      console.warn('emotion ai analysis failed, fallback to rules', error)
      return ruleBased
    }
  }
}
