/**
 * 消息流列表
 * 集成 react-virtuoso 虚拟滚动
 */

import { Virtuoso } from 'react-virtuoso'
import { MessageItem } from './MessageItem'
import type { Message } from '@/types'

export interface MessageListProps {
  className?: string
}

// 空状态占位数据
const EMPTY_MESSAGES: Message[] = []

export function MessageList({ className = '' }: MessageListProps) {
  // 第二阶段：从 useChat 获取真实消息

  // 空状态
  if (EMPTY_MESSAGES.length === 0) {
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

  return (
    <div className={`relative ${className}`}>
      <Virtuoso
        data={EMPTY_MESSAGES}
        itemContent={(_index, message) => (
          <MessageItem key={message.id} message={message} />
        )}
        className="h-full"
      />

      {/* 滚动到底部按钮 - 第二阶段实现 */}
    </div>
  )
}
