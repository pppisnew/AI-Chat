/**
 * 左侧会话列表栏
 * 微信风格：顶部新建按钮 + 中间会话列表 + 底部设置
 */

import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { getAllConversations, deleteConversation } from '@/db/operations'
import type { Conversation } from '@/types'

export interface SidebarProps {
  className?: string
}

/** 会话列表项 */
interface ConversationItemProps {
  conversation: Conversation
  isActive: boolean
  onClick: () => void
  onDelete: () => void
}

function ConversationItem({ conversation, isActive, onClick, onDelete }: ConversationItemProps) {
  return (
    <div
      onClick={onClick}
      className={`group flex items-center gap-3 px-3 py-2.5 cursor-pointer
                  transition-colors duration-150
                  ${isActive
                    ? 'bg-bg-active'
                    : 'hover:bg-bg-hover'
                  }`}
    >
      {/* 头像 */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500
                      flex items-center justify-center text-white font-medium text-sm">
        AI
      </div>

      {/* 内容 */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-text-primary truncate">
          {conversation.title}
        </h3>
        <p className="text-xs text-text-secondary mt-0.5">
          {formatTime(conversation.updatedAt)}
        </p>
      </div>

      {/* 删除按钮 */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        className="flex-shrink-0 p-1.5 rounded-md opacity-0 group-hover:opacity-100
                   hover:bg-red-100 text-text-secondary hover:text-red-500
                   transition-all duration-150"
        title="删除会话"
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
            strokeWidth={1.5}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  )
}

/** 格式化时间 */
function formatTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const oneDay = 24 * 60 * 60 * 1000

  if (diff < oneDay) {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  } else if (diff < 7 * oneDay) {
    const days = Math.floor(diff / oneDay)
    return `${days}天前`
  } else {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    })
  }
}

export function Sidebar({ className = '' }: SidebarProps) {
  const setIsSettingsOpen = useAppStore((state) => state.setIsSettingsOpen)
  const activeConversationId = useAppStore((state) => state.activeConversationId)
  const setActiveConversationId = useAppStore((state) => state.setActiveConversationId)
  const conversationRefreshCounter = useAppStore((state) => state.conversationRefreshCounter)

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 加载会话列表
  const loadConversations = async () => {
    setIsLoading(true)
    try {
      const list = await getAllConversations()
      setConversations(list)
    } catch (error) {
      console.error('Failed to load conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 初始加载和刷新计数器变化时重新加载
  useEffect(() => {
    loadConversations()
  }, [conversationRefreshCounter])

  // 新建聊天
  const handleNewChat = async () => {
    // 清除当前选中，让用户开始新对话
    setActiveConversationId(null)
  }

  // 切换会话
  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id)
  }

  // 删除会话
  const handleDeleteConversation = async (id: string) => {
    if (!confirm('确定要删除这个会话吗？')) return

    try {
      await deleteConversation(id)
      setConversations(prev => prev.filter(c => c.id !== id))

      // 如果删除的是当前会话，清除选中
      if (activeConversationId === id) {
        setActiveConversationId(null)
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error)
    }
  }

  // 打开设置
  const handleOpenSettings = () => {
    setIsSettingsOpen(true)
  }

  return (
    <aside className={`flex flex-col h-full bg-bg-primary border-r border-border-light ${className}`}>
      {/* 顶部：新建按钮 */}
      <div className="flex-shrink-0 p-3">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5
                     bg-wechat-green hover:bg-wechat-greenLight
                     text-white rounded-md transition-colors duration-150
                     font-medium text-sm"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          新建聊天
        </button>
      </div>

      {/* 中间：会话列表 */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-20">
            <svg
              className="w-6 h-6 animate-spin text-text-tertiary"
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
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-tertiary">
            <svg
              className="w-16 h-16 mb-3 opacity-30"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-sm">暂无会话</p>
            <p className="text-xs mt-1">点击上方按钮开始新对话</p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isActive={conversation.id === activeConversationId}
              onClick={() => handleSelectConversation(conversation.id)}
              onDelete={() => handleDeleteConversation(conversation.id)}
            />
          ))
        )}
      </div>

      {/* 底部：设置按钮 */}
      <div className="flex-shrink-0 p-3 border-t border-border-light">
        <button
          onClick={handleOpenSettings}
          className="w-full flex items-center gap-3 px-3 py-2.5
                     hover:bg-bg-hover rounded-md transition-colors duration-150"
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
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="text-sm text-text-primary">设置</span>
        </button>
      </div>
    </aside>
  )
}
