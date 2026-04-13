/**
 * Vercel AI SDK 客户端配置
 * 智谱 GLM API 兼容 OpenAI 协议
 */

import { createOpenAI } from '@ai-sdk/openai'
import { getSettings } from '@/store/useAppStore'

/**
 * 获取 AI 客户端实例
 * 每次调用时读取最新的设置
 */
export function getAIClient() {
  const settings = getSettings()

  return createOpenAI({
    apiKey: settings.apiKey,
    baseURL: settings.baseUrl,
  })
}

/**
 * 获取当前配置的模型
 */
export function getModel() {
  const settings = getSettings()
  const client = getAIClient()

  return client(settings.model)
}

/**
 * 获取 System Prompt
 */
export function getSystemPrompt(): string {
  const settings = getSettings()
  return settings.systemPrompt
}
