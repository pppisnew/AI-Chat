/**
 * 桥接 Vercel AI SDK 与本地数据库
 * 核心数据流控制 Hook
 *
 * TODO: 第二阶段实现完整逻辑
 */

import { useCallback } from 'react'
import { useAppStore } from '@/store/useAppStore'

export function useChatSync() {
  const activeConversationId = useAppStore((state) => state.activeConversationId)

  // 第二阶段实现
  const sendMessage = useCallback(async (content: string) => {
    console.log('sendMessage:', content, 'conversation:', activeConversationId)
  }, [activeConversationId])

  return {
    sendMessage,
    isLoading: false,
  }
}
