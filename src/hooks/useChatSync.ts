/**
 * 聊天同步 Hook
 * 直接调用智谱 API，手动处理流式响应
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import {
  createConversation,
  getMessagesByConversation,
  addMessages,
  touchConversation,
  updateConversationTitle,
} from '@/db/operations'
import { estimateMessagesTokens, MAX_CONTEXT_TOKENS } from '@/utils/token'
import type { Message } from '@/types'

/** 消息类型 */
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: number
}

/** 将数据库 Message 转换为 ChatMessage */
function dbToChatMessage(msg: Message): ChatMessage {
  return {
    id: msg.id,
    role: msg.role,
    content: msg.content,
    createdAt: msg.createdAt,
  }
}

/** 将 ChatMessage 转换为数据库格式 */
function chatToDbMessage(msg: ChatMessage, conversationId: string): Omit<Message, 'id' | 'createdAt'> {
  return {
    conversationId,
    role: msg.role,
    content: msg.content,
  }
}

/** 截断消息历史 */
function truncateMessages(messages: ChatMessage[], maxTokens: number): ChatMessage[] {
  if (messages.length === 0) return []

  const systemMessage = messages.find(m => m.role === 'system')
  const nonSystemMessages = messages.filter(m => m.role !== 'system')

  const reversed = [...nonSystemMessages].reverse()
  const selected: ChatMessage[] = []
  let totalTokens = systemMessage ? estimateMessagesTokens([{ content: systemMessage.content }]) : 0

  for (const msg of reversed) {
    const msgTokens = estimateMessagesTokens([{ content: msg.content }])
    if (totalTokens + msgTokens > maxTokens) {
      break
    }
    selected.unshift(msg)
    totalTokens += msgTokens
  }

  if (systemMessage) {
    selected.unshift(systemMessage)
  }

  return selected
}

/** 解析 SSE 流 */
async function* parseSSEStream(stream: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.startsWith('data:')) {
          const data = trimmed.slice(5).trim()
          if (data === '[DONE]') return
          yield data
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

export interface UseChatSyncReturn {
  sendMessage: (content: string) => Promise<void>
  messages: ChatMessage[]
  isLoading: boolean
  isInitializing: boolean
  error: Error | null
  reloadConversation: () => Promise<void>
  stop: () => void
  input: string
  setInput: (value: string) => void
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
}

export function useChatSync(): UseChatSyncReturn {
  const activeConversationId = useAppStore((state) => state.activeConversationId)
  const setActiveConversationId = useAppStore((state) => state.setActiveConversationId)
  const refreshConversations = useAppStore((state) => state.refreshConversations)
  const settings = useAppStore((state) => state.settings)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [input, setInput] = useState('')

  const abortControllerRef = useRef<AbortController | null>(null)
  const pendingUserMessageRef = useRef<ChatMessage | null>(null)

  // 加载会话历史
  const loadConversationHistory = useCallback(async (conversationId: string) => {
    setIsInitializing(true)
    setError(null)

    try {
      const dbMessages = await getMessagesByConversation(conversationId)
      const chatMessages = dbMessages.map(dbToChatMessage)
      setMessages(chatMessages)
    } catch (err) {
      console.error('Failed to load conversation:', err)
      setError(err instanceof Error ? err : new Error('Failed to load conversation'))
    } finally {
      setIsInitializing(false)
    }
  }, [])

  // 切换会话时加载历史
  useEffect(() => {
    if (activeConversationId) {
      loadConversationHistory(activeConversationId)
    } else {
      setMessages([])
    }
  }, [activeConversationId, loadConversationHistory])

  // 发送消息
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return

    setError(null)

    // 创建或获取会话 ID
    let conversationId = activeConversationId
    if (!conversationId) {
      try {
        conversationId = await createConversation('新对话')
        setActiveConversationId(conversationId)
      } catch (err) {
        console.error('Failed to create conversation:', err)
        setError(err instanceof Error ? err : new Error('Failed to create conversation'))
        return
      }
    }

    // 创建用户消息
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      createdAt: Date.now(),
    }

    // 立即显示用户消息
    setMessages(prev => [...prev, userMessage])
    pendingUserMessageRef.current = userMessage

    // 创建 AI 消息占位
    const aiMessageId = crypto.randomUUID()
    setMessages(prev => [...prev, {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
    }])

    setIsLoading(true)

    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    try {
      // 构建消息列表
      const systemPrompt = settings.systemPrompt
      const historyMessages = messages.filter(m => m.role !== 'system')
      const truncated = truncateMessages(historyMessages, MAX_CONTEXT_TOKENS)

      const apiMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...truncated.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user' as const, content: content.trim() },
      ]

      // 调用 API
      const response = await fetch(`${settings.baseUrl}chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.apiKey}`,
        },
        body: JSON.stringify({
          model: settings.model,
          messages: apiMessages,
          stream: true,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API 错误 (${response.status}): ${errorText}`)
      }

      // 处理流式响应
      let fullContent = ''
      for await (const data of parseSSEStream(response.body!)) {
        try {
          const parsed = JSON.parse(data)
          const delta = parsed.choices?.[0]?.delta?.content
          if (delta) {
            fullContent += delta
            // 更新 AI 消息内容
            setMessages(prev => prev.map(m =>
              m.id === aiMessageId
                ? { ...m, content: fullContent }
                : m
            ))
          }
        } catch {
          // 忽略解析错误
        }
      }

      // 保存到数据库
      const aiMessage: ChatMessage = {
        id: aiMessageId,
        role: 'assistant',
        content: fullContent,
        createdAt: Date.now(),
      }

      await addMessages([
        chatToDbMessage(userMessage, conversationId),
        chatToDbMessage(aiMessage, conversationId),
      ])
      await touchConversation(conversationId)

      // 更新会话标题
      const title = userMessage.content.slice(0, 20)
      await updateConversationTitle(conversationId, title)

      refreshConversations()
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // 用户取消，不报错
        return
      }
      console.error('Chat error:', err)
      setError(err instanceof Error ? err : new Error('发送消息失败'))
      // 移除失败的消息
      setMessages(prev => prev.filter(m => m.id !== aiMessageId))
    } finally {
      setIsLoading(false)
      pendingUserMessageRef.current = null
      abortControllerRef.current = null
    }
  }, [
    activeConversationId,
    setActiveConversationId,
    refreshConversations,
    settings,
    messages,
    isLoading,
  ])

  // 停止生成
  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])

  // 重新加载会话
  const reloadConversation = useCallback(async () => {
    if (activeConversationId) {
      await loadConversationHistory(activeConversationId)
    }
  }, [activeConversationId, loadConversationHistory])

  // 处理输入变化
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }, [])

  return {
    sendMessage,
    messages,
    isLoading,
    isInitializing,
    error,
    reloadConversation,
    stop,
    input,
    setInput,
    handleInputChange,
  }
}
