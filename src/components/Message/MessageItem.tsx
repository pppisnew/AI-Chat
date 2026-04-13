/**
 * 单条消息气泡
 * 用户消息：绿色气泡，靠右
 * AI 消息：白色气泡，靠左，带头像
 */

import type { Message } from '@/types'
import { MarkdownRenderer } from './MarkdownRenderer'

export interface MessageItemProps {
  message: Message
  className?: string
}

export function MessageItem({ message, className = '' }: MessageItemProps) {
  const isUser = message.role === 'user'

  return (
    <div
      className={`flex gap-3 px-4 py-3 ${isUser ? 'flex-row-reverse' : ''} ${className}`}
    >
      {/* 头像 */}
      {isUser ? (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-wechat-green
                        flex items-center justify-center text-white font-medium text-sm">
          我
        </div>
      ) : (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500
                        flex items-center justify-center text-white font-medium text-sm">
          AI
        </div>
      )}

      {/* 消息气泡 */}
      <div
        className={`max-w-[70%] rounded-bubble px-4 py-2.5 shadow-wechat
                    ${isUser
                      ? 'bg-bubble-user text-bubble-userText'
                      : 'bg-bubble-assistant text-bubble-assistantText'
                    }`}
      >
        {/* 用户消息直接显示文本 */}
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <MarkdownRenderer content={message.content} />
        )}

        {/* 时间戳 - 第二阶段实现 */}
      </div>
    </div>
  )
}
