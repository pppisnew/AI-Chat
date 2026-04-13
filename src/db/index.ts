import Dexie, { type Table } from 'dexie'
import type { Conversation, Message } from '@/types'

/**
 * Dexie 数据库定义
 * 使用 IndexedDB 存储聊天数据
 */
export class AiChatDB extends Dexie {
  conversations!: Table<Conversation, string>
  messages!: Table<Message, string>

  constructor() {
    super('AiChatDB')

    this.version(1).stores({
      conversations: 'id, title, createdAt, updatedAt',
      messages: 'id, conversationId, role, createdAt, [conversationId+createdAt]',
    })
  }
}

export const db = new AiChatDB()
