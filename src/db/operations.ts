/**
 * 数据库操作封装
 * 提供会话和消息的增删改查
 */

import { db } from './index'
import type { Conversation, Message } from '@/types'

// ==================== 会话操作 ====================

/** 获取所有会话（按更新时间倒序） */
export async function getAllConversations(): Promise<Conversation[]> {
  return db.conversations.orderBy('updatedAt').reverse().toArray()
}

/** 创建新会话 */
export async function createConversation(title: string = '新对话'): Promise<string> {
  const now = Date.now()
  const id = crypto.randomUUID()

  await db.conversations.add({
    id,
    title,
    createdAt: now,
    updatedAt: now,
  })

  return id
}

/** 更新会话标题 */
export async function updateConversationTitle(id: string, title: string): Promise<void> {
  await db.conversations.update(id, { title })
}

/** 更新会话时间戳 */
export async function touchConversation(id: string): Promise<void> {
  await db.conversations.update(id, { updatedAt: Date.now() })
}

/** 删除会话及其所有消息 */
export async function deleteConversation(id: string): Promise<void> {
  await db.transaction('rw', [db.conversations, db.messages], async () => {
    await db.messages.where('conversationId').equals(id).delete()
    await db.conversations.delete(id)
  })
}

/** 清空所有数据 */
export async function clearAllData(): Promise<void> {
  await db.transaction('rw', [db.conversations, db.messages], async () => {
    await db.messages.clear()
    await db.conversations.clear()
  })
}

// ==================== 消息操作 ====================

/** 获取某个会话的所有消息 */
export async function getMessagesByConversation(conversationId: string): Promise<Message[]> {
  return db.messages
    .where('conversationId')
    .equals(conversationId)
    .sortBy('createdAt')
}

/** 添加单条消息 */
export async function addMessage(message: Omit<Message, 'id' | 'createdAt'>): Promise<string> {
  const id = crypto.randomUUID()
  const createdAt = Date.now()

  await db.messages.add({
    ...message,
    id,
    createdAt,
  })

  return id
}

/** 批量添加消息 */
export async function addMessages(messages: Omit<Message, 'id' | 'createdAt'>[]): Promise<void> {
  const now = Date.now()
  const messagesWithIds = messages.map((msg, index) => ({
    ...msg,
    id: crypto.randomUUID(),
    createdAt: now + index,
  }))

  await db.messages.bulkAdd(messagesWithIds)
}

/** 清空某个会话的消息 */
export async function clearConversationMessages(conversationId: string): Promise<void> {
  await db.messages.where('conversationId').equals(conversationId).delete()
}
