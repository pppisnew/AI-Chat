/**
 * 右侧聊天窗口栏
 * 微信风格：顶部标题栏 + 中间消息区 + 底部输入框
 */

import { useCallback } from 'react'
import { ChatInput } from '@/components/Input/ChatInput'
import { MessageList } from '@/components/Message/MessageList'
import { useChatSync } from '@/hooks/useChatSync'
import { useAppStore } from '@/store/useAppStore'
import { clearConversationMessages } from '@/db/operations'

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

  const handleSend = useCallback((content: string) => {
    if (!isOnline) return
    sendMessage(content)
  }, [isOnline, sendMessage])

  // 清空当前会话
  const handleClearConversation = useCallback(async () => {
    if (!activeConversationId) return

    const confirmed = window.confirm('确定要清空当前会话的所有消息吗？')
    if (!confirmed) return

    try {
      await clearConversationMessages(activeConversationId)
      // 刷新会话数据
      window.location.reload()
    } catch (err) {
      console.error('Failed to clear conversation:', err)
    }
  }, [activeConversationId])

  return (
    <main className={`flex flex-col h-full bg-bg-secondary ${className}`}>
      {/* 顶部：导航栏 */}
      <header className="flex-shrink-0 flex items-center justify-between
                         h-[50px] px-5 border-b border-border-light bg-bg-tertiary">
        {/* 左侧：会话标题 */}
        <h1 className="text-base font-medium text-text-primary truncate">
          {activeConversationId ? '对话' : 'Ai-Chat'}
        </h1>

        {/* 右侧：操作按钮 */}
        <div className="flex items-center gap-1">
          {/* 停止生成按钮 */}
          {isLoading && (
            <button
              onClick={stop}
              className="flex items-center gap-1.5 px-3 py-1.5
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
                <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
              </svg>
              停止
            </button>
          )}

          {/* 清空会话按钮 */}
          {activeConversationId ? (
            <button
              onClick={handleClearConversation}
              className="p-2 hover:bg-bg-lightHover rounded-md transition-colors duration-150"
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
          ) : (
            <button
              disabled
              className="p-2 cursor-not-allowed opacity-40"
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
          <div className="flex items-start gap-2">
            <svg
              className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-800">请求失败</p>
              <p className="text-sm text-red-600 mt-0.5">{error.message}</p>
            </div>
          </div>
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
        disabled={isLoading}
        isOnline={isOnline}
        className="flex-shrink-0"
      />
    </main>
  )
}
