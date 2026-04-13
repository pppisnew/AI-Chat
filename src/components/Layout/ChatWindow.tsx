/**
 * 右侧聊天窗口栏
 * 微信风格：顶部标题栏 + 中间消息区 + 底部输入框
 */

import { ChatInput } from '@/components/Input/ChatInput'
import { MessageList } from '@/components/Message/MessageList'
import { useChatSync } from '@/hooks/useChatSync'
import { useAppStore } from '@/store/useAppStore'

export interface ChatWindowProps {
  className?: string
}

export function ChatWindow({ className = '' }: ChatWindowProps) {
  const activeConversationId = useAppStore((state) => state.activeConversationId)
  const isOnline = useAppStore((state) => state.isOnline)

  const {
    sendMessage,
    messages,
    isLoading,
    isInitializing,
    error,
    stop,
  } = useChatSync()

  const handleSend = (content: string) => {
    if (!isOnline) return
    sendMessage(content)
  }

  return (
    <main className={`flex flex-col h-full bg-bg-secondary ${className}`}>
      {/* 顶部：标题栏 */}
      <header className="flex-shrink-0 flex items-center justify-between
                         h-14 px-6 border-b border-border-light bg-bg-tertiary">
        <h1 className="text-lg font-medium text-text-primary truncate">
          {activeConversationId ? '对话' : 'Ai-Chat'}
        </h1>
        <div className="flex items-center gap-2">
          {/* 停止生成按钮 */}
          {isLoading && (
            <button
              onClick={stop}
              className="flex items-center gap-1 px-3 py-1.5
                         bg-red-500 hover:bg-red-600
                         text-white rounded-md text-sm
                         transition-colors duration-150"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                />
              </svg>
              停止
            </button>
          )}

          {/* 清空当前会话按钮 */}
          {activeConversationId && (
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
          )}
        </div>
      </header>

      {/* 错误提示 */}
      {error && (
        <div className="flex-shrink-0 mx-4 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error.message}</p>
        </div>
      )}

      {/* 离线提示 */}
      {!isOnline && (
        <div className="flex-shrink-0 mx-4 mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-600">网络已断开，请检查网络连接</p>
        </div>
      )}

      {/* 中间：消息列表 */}
      <MessageList
        className="flex-1 overflow-hidden"
        messages={messages}
        isLoading={isLoading}
        isInitializing={isInitializing}
      />

      {/* 底部：输入框 */}
      <ChatInput
        onSend={handleSend}
        disabled={!isOnline || isLoading}
        className="flex-shrink-0"
      />
    </main>
  )
}
