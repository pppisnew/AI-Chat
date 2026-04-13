/**
 * 右侧聊天窗口栏
 * 微信风格：顶部标题栏 + 中间消息区 + 底部输入框
 */

import { ChatInput } from '@/components/Input/ChatInput'
import { MessageList } from '@/components/Message/MessageList'

export interface ChatWindowProps {
  className?: string
}

export function ChatWindow({ className = '' }: ChatWindowProps) {
  const handleSend = (content: string) => {
    // 第二阶段实现
    console.log('发送消息:', content)
  }

  return (
    <main className={`flex flex-col h-full bg-bg-secondary ${className}`}>
      {/* 顶部：标题栏 */}
      <header className="flex-shrink-0 flex items-center justify-between
                         h-14 px-6 border-b border-border-light bg-bg-tertiary">
        <h1 className="text-lg font-medium text-text-primary truncate">
          Ai-Chat
        </h1>
        <div className="flex items-center gap-2">
          {/* 清空当前会话按钮 */}
          <button
            className="p-2 hover:bg-bg-hover rounded-md transition-colors duration-150"
            title="清空当前会话"
          >
            <svg
              className="w-5 h-5 text-text-secondary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* 中间：消息列表 */}
      <MessageList className="flex-1 overflow-hidden" />

      {/* 底部：输入框 */}
      <ChatInput onSend={handleSend} className="flex-shrink-0" />
    </main>
  )
}
