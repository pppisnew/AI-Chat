/**
 * 消息流列表
 * 集成 react-virtuoso 虚拟滚动
 */

import { useRef, useEffect } from 'react'
import { Virtuoso } from 'react-virtuoso'
import { type Message as AiMessage } from 'ai/react'
import { MessageItem } from './MessageItem'
import type { Message } from '@/types'

export interface MessageListProps {
  className?: string
  messages: AiMessage[]
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
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-typing" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-typing" style={{ animationDelay: '200ms' }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-typing" style={{ animationDelay: '400ms' }} />
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
  const virtuosoRef = useRef<React.ComponentRef<typeof Virtuoso>>(null)

  // 消息更新时自动滚动到底部
  useEffect(() => {
    if (messages.length > 0 && virtuosoRef.current) {
      virtuosoRef.current.scrollToIndex({
        index: messages.length - 1,
        behavior: 'smooth',
        align: 'end',
      })
    }
  }, [messages.length, messages[messages.length - 1]?.content])

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
        <div className="text-center text-text-tertiary">
          <svg
            className="w-20 h-20 mx-auto mb-4 opacity-20"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          <p className="text-base mb-1">开始新对话</p>
          <p className="text-sm opacity-70">输入消息与 AI 开始聊天</p>
        </div>
      </div>
    )
  }

  // 将 UIMessage 转换为 Message 格式用于显示
  const formattedMessages: Message[] = messages.map((msg) => ({
    id: msg.id,
    conversationId: '',
    role: msg.role as 'user' | 'assistant' | 'system',
    content: msg.content,
    createdAt: msg.createdAt ? new Date(msg.createdAt).getTime() : Date.now(),
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
        followOutput="smooth"
      />

      {/* AI 正在输入指示器 */}
      {isLoading && <TypingIndicator />}
    </div>
  )
}
