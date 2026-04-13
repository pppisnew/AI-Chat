/**
 * Ai-Chat 类型定义
 * 与 Dexie 数据库模型保持一致
 */

/** 消息角色 */
export type MessageRole = 'user' | 'assistant' | 'system'

/** 会话接口 */
export interface Conversation {
  id: string
  title: string
  createdAt: number
  updatedAt: number
}

/** 消息接口 */
export interface Message {
  id: string
  conversationId: string
  role: MessageRole
  content: string
  createdAt: number
}

/** 应用设置 (LocalStorage) */
export interface AppSettings {
  apiKey: string
  baseUrl: string
  model: string
  systemPrompt: string
}

/** 默认设置 */
export const DEFAULT_SETTINGS: AppSettings = {
  apiKey: '',
  baseUrl: 'https://open.bigmodel.cn/api/paas/v4/',
  model: 'glm-4-flash',
  systemPrompt: '你是一个有帮助的AI助手。',
}

/** LocalStorage Key */
export const STORAGE_KEY = 'ai_chat_settings' as const
