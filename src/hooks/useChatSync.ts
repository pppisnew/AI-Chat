/**
 * 桥接 Vercel AI SDK 与本地数据库
 * 核心数据流控制 Hook
 *
 * 数据流生命周期：
 * 1. 加载：从 Dexie 读取历史消息，作为 useChat 的 initialMessages
 * 2. 交互：用户发送消息，AI 流式回复，只更新内存和 UI
 * 3. 落盘：onFinish 回调触发时，批量写入 IndexedDB
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useChat, type Message as AiMessage } from 'ai/react'
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

/** 将数据库 Message 转换为 AI SDK Message 格式 */
function dbMessageToAiMessage(msg: Message): AiMessage {
  return {
    id: msg.id,
    role: msg.role as 'user' | 'assistant' | 'system',
    content: msg.content,
    createdAt: new Date(msg.createdAt),
  }
}

/** 将 AI Message 转换为数据库格式 */
function aiMessageToDbMessage(msg: AiMessage, conversationId: string): Omit<Message, 'id' | 'createdAt'> {
  return {
    conversationId,
    role: msg.role as 'user' | 'assistant' | 'system',
    content: msg.content,
  }
}

/**
 * 截断消息历史以符合 token 限制
 */
function truncateMessages(messages: AiMessage[], maxTokens: number): AiMessage[] {
  if (messages.length === 0) return []

  // 保留 system 消息
  const systemMessage = messages.find(m => m.role === 'system')
  const nonSystemMessages = messages.filter(m => m.role !== 'system')

  // 从最新的消息开始累加
  const reversed = [...nonSystemMessages].reverse()
  const selected: AiMessage[] = []
  let totalTokens = systemMessage ? estimateMessagesTokens([{ content: systemMessage.content }]) : 0

  for (const msg of reversed) {
    const msgTokens = estimateMessagesTokens([{ content: msg.content }])
    if (totalTokens + msgTokens > maxTokens) {
      break
    }
    selected.unshift(msg)
    totalTokens += msgTokens
  }

  // 添加 system 消息到开头
  if (systemMessage) {
    selected.unshift(systemMessage)
  }

  return selected
}

export interface UseChatSyncReturn {
  /** 发送消息 */
  sendMessage: (content: string) => Promise<void>
  /** 当前消息列表 */
  messages: AiMessage[]
  /** 是否正在加载（AI 生成中） */
  isLoading: boolean
  /** 是否正在初始化（从数据库加载） */
  isInitializing: boolean
  /** 错误信息 */
  error: Error | null
  /** 重新加载会话历史 */
  reloadConversation: () => Promise<void>
  /** 停止生成 */
  stop: () => void
  /** 输入内容 */
  input: string
  /** 设置输入内容 */
  setInput: (value: string) => void
  /** 处理输入变化 */
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
}

export function useChatSync(): UseChatSyncReturn {
  const activeConversationId = useAppStore((state) => state.activeConversationId)
  const setActiveConversationId = useAppStore((state) => state.setActiveConversationId)
  const refreshConversations = useAppStore((state) => state.refreshConversations)
  const settings = useAppStore((state) => state.settings)

  const [isInitializing, setIsInitializing] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // 用于追踪待落盘的用户消息
  const pendingUserMessageRef = useRef<AiMessage | null>(null)

  // 初始化 useChat
  const {
    messages,
    isLoading,
    append,
    setMessages,
    stop,
    input,
    setInput,
    handleInputChange,
  } = useChat({
    api: `${settings.baseUrl}chat/completions`,
    headers: {
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: {
      model: settings.model,
    },
    // 构建请求时添加系统提示词并截断上下文
    experimental_prepareRequestBody: (options) => {
      const systemPrompt = settings.systemPrompt
      const systemMessage: AiMessage = {
        id: 'system',
        role: 'system',
        content: systemPrompt,
      }

      // 过滤掉系统消息并截断
      const historyMessages = (options.messages || []).filter(m => m.role !== 'system')
      const truncated = truncateMessages(historyMessages, MAX_CONTEXT_TOKENS)

      return {
        model: settings.model,
        messages: [systemMessage, ...truncated],
        stream: true,
      }
    },
    // AI 回复完成时落盘
    onFinish: async (message) => {
      const conversationId = activeConversationId
      if (!conversationId) return

      // 落盘用户消息和 AI 回复
      const messagesToSave: Omit<Message, 'id' | 'createdAt'>[] = []

      if (pendingUserMessageRef.current) {
        messagesToSave.push(aiMessageToDbMessage(pendingUserMessageRef.current, conversationId))
      }

      messagesToSave.push(aiMessageToDbMessage(message, conversationId))

      try {
        await addMessages(messagesToSave)
        await touchConversation(conversationId)

        // 如果是首条消息，更新会话标题
        if (pendingUserMessageRef.current) {
          const title = pendingUserMessageRef.current.content.slice(0, 20)
          await updateConversationTitle(conversationId, title)
        }

        // 触发会话列表刷新
        refreshConversations()
      } catch (err) {
        console.error('Failed to save messages:', err)
        setError(err instanceof Error ? err : new Error('Failed to save messages'))
      }

      pendingUserMessageRef.current = null
    },
    onError: (err) => {
      console.error('Chat error:', err)
      setError(err)
      pendingUserMessageRef.current = null
    },
  })

  // 加载会话历史
  const loadConversationHistory = useCallback(async (conversationId: string) => {
    setIsInitializing(true)
    setError(null)

    try {
      const dbMessages = await getMessagesByConversation(conversationId)
      const aiMessages = dbMessages.map(dbMessageToAiMessage)
      setMessages(aiMessages)
    } catch (err) {
      console.error('Failed to load conversation:', err)
      setError(err instanceof Error ? err : new Error('Failed to load conversation'))
    } finally {
      setIsInitializing(false)
    }
  }, [setMessages])

  // 切换会话时加载历史
  useEffect(() => {
    if (activeConversationId) {
      loadConversationHistory(activeConversationId)
    } else {
      setMessages([])
    }
  }, [activeConversationId, loadConversationHistory, setMessages])

  // 发送消息
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return

    setError(null)

    // 如果没有活动会话，先创建
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
    const userMessage: AiMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      createdAt: new Date(),
    }

    // 保存引用用于 onFinish 落盘
    pendingUserMessageRef.current = userMessage

    try {
      await append(userMessage)
    } catch (err) {
      console.error('Failed to send message:', err)
      setError(err instanceof Error ? err : new Error('Failed to send message'))
      pendingUserMessageRef.current = null
    }
  }, [activeConversationId, setActiveConversationId, append])

  // 重新加载会话
  const reloadConversation = useCallback(async () => {
    if (activeConversationId) {
      await loadConversationHistory(activeConversationId)
    }
  }, [activeConversationId, loadConversationHistory])

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
