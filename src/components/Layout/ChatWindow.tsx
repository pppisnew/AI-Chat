/**
 * 右侧聊天窗口栏
 * 微信风格：顶部标题栏 + 中间消息区 + 底部输入框
 */

import { useCallback } from 'react'
import { ChatInput } from '@/components/Input/ChatInput'
import { MessageList } from '@/components/Message/MessageList'
import { useChatSync } from '@/hooks/useChatSync'
import { useAppStore } from '@/store/useAppStore'
import { clearConversationMessages, deleteConversation } from '@/db/operations'

export interface ChatWindowProps {
  className?: string
}

export function ChatWindow({ className = '' }: ChatWindowProps) {
  const activeConversationId = useAppStore((state) => state.activeConversationId)
  const setActiveConversationId = useAppStore((state) => state.setActiveConversationId)
  const refreshConversations = useAppStore((state) => state.refreshConversations)
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

  // 删除当前会话
  const handleDeleteConversation = useCallback(async () => {
    if (!activeConversationId) return

    const confirmed = window.confirm('确定要删除当前会话吗？')
    if (!confirmed) return

    try {
      await deleteConversation(activeConversationId)
      setActiveConversationId(null)
      refreshConversations()
    } catch (err) {
      console.error('Failed to delete conversation:', err)
    }
  }, [activeConversationId, setActiveConversationId, refreshConversations])

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

          {/* 会话操作按钮 */}
          {activeConversationId && (
            <>
              {/* 清空会话按钮 */}
              <button
                onClick={handleClearConversation}
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

              {/* 删除会话按钮 */}
              <button
                onClick={handleDeleteConversation}
                className="p-2 hover:bg-red-50 rounded-md transition-colors duration-150"
                title="删除当前会话"
              >
                <svg
                  className="w-5 h-5 text-text-secondary hover:text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </>
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
