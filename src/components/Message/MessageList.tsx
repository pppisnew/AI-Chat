/**
 * 消息流列表
 * 集成 react-virtuoso 虚拟滚动
 * 优化流式输出时的自动滚动
 */

import { useRef, useEffect, useCallback } from 'react'
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso'
import { MessageItem } from './MessageItem'
import type { Message } from '@/types'

/** 消息类型 */
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: number
}

export interface MessageListProps {
  className?: string
  messages: ChatMessage[]
  isLoading?: boolean
  isInitializing?: boolean
}

/** 打字机动画组件 */
function TypingIndicator() {
  return (
    <div className="flex gap-3 px-4 py-3">
      {/* AI 头像 */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500
                      flex items-center justify-center text-white font-medium text-sm">
        AI
      </div>

      {/* 打字动画 */}
      <div className="bg-bubble-assistant rounded-bubble px-4 py-2.5 shadow-wechat">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-text-secondary rounded-full animate-typing" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-text-secondary rounded-full animate-typing" style={{ animationDelay: '200ms' }} />
          <span className="w-2 h-2 bg-text-secondary rounded-full animate-typing" style={{ animationDelay: '400ms' }} />
        </div>
      </div>
    </div>
  )
}

export function MessageList({
  className = '',
  messages,
  isLoading = false,
  isInitializing = false,
}: MessageListProps) {
  const virtuosoRef = useRef<VirtuosoHandle>(null)
  // 追踪是否应该自动滚动（用户在底部时）
  const shouldAutoScrollRef = useRef(true)

  // 滚动到底部
  const scrollToBottom = useCallback((behavior: 'smooth' | 'auto' = 'smooth') => {
    if (virtuosoRef.current && messages.length > 0) {
      virtuosoRef.current.scrollToIndex({
        index: messages.length - 1,
        behavior,
        align: 'end',
      })
    }
  }, [messages.length])

  // 消息更新时自动滚动（仅当用户在底部时）
  useEffect(() => {
    if (shouldAutoScrollRef.current && messages.length > 0) {
      // 检查最后一条消息是否是 assistant 且正在生成
      const lastMessage = messages[messages.length - 1]
      if (lastMessage?.role === 'assistant') {
        scrollToBottom('auto') // 流式输出时使用 instant 滚动
      } else {
        scrollToBottom('smooth')
      }
    }
  }, [messages, scrollToBottom])

  // 新消息时滚动到底部
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom('smooth')
    }
  }, [messages.length, scrollToBottom])

  // 加载状态
  if (isInitializing) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="flex flex-col items-center text-text-tertiary">
          <svg
            className="w-8 h-8 animate-spin mb-2"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-sm">加载中...</p>
        </div>
      </div>
    )
  }

  // 空状态
  if (messages.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="text-center" style={{ marginTop: '-10%' }}>
          {/* AI Logo */}
          <div className="w-24 h-24 mx-auto mb-6 rounded-full
                          bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400
                          flex items-center justify-center
                          shadow-lg shadow-purple-200/50">
            <span className="text-4xl font-bold text-white tracking-tight">AI</span>
          </div>

          {/* 主标题 */}
          <h2 className="text-xl font-medium text-text-primary mb-2">
            开始新对话
          </h2>

          {/* 副标题 */}
          <p className="text-sm text-text-secondary">
            输入消息与 AI 开始聊天
          </p>
        </div>
      </div>
    )
  }

  // 将 ChatMessage 转换为 Message 格式用于显示
  const formattedMessages: Message[] = messages.map((msg) => ({
    id: msg.id,
    conversationId: '',
    role: msg.role,
    content: msg.content,
    createdAt: msg.createdAt,
  }))

  return (
    <div className={`relative ${className}`}>
      <Virtuoso
        ref={virtuosoRef}
        data={formattedMessages}
        itemContent={(_index, message) => (
          <MessageItem key={message.id} message={message} />
        )}
        className="h-full"
        followOutput={isLoading ? 'auto' : 'smooth'}
        atBottomStateChange={(atBottom) => {
          shouldAutoScrollRef.current = atBottom
        }}
        components={{
          Footer: () => isLoading ? <TypingIndicator /> : null,
        }}
      />
    </div>
  )
}
