/**
 * 文本输入框与发送按钮
 */

import { useState, useCallback, useRef } from 'react'

export interface ChatInputProps {
  onSend: (content: string) => void
  disabled?: boolean
  isOnline?: boolean
  className?: string
}

export function ChatInput({
  onSend,
  disabled = false,
  isOnline = true,
  className = ''
}: ChatInputProps) {
  const [content, setContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 自动调整高度
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      // 最大高度为屏幕的一半
      const maxHeight = window.innerHeight * 0.5
      textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`
    }
  }, [])

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    adjustHeight()
  }, [adjustHeight])

  const handleSend = useCallback(() => {
    const trimmed = content.trim()
    if (trimmed && !disabled) {
      onSend(trimmed)
      setContent('')
      // 重置高度
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }, [content, disabled, onSend])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter 发送，Shift+Enter 换行
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  const canSend = content.trim().length > 0 && !disabled && isOnline
  const isDisabled = disabled || !isOnline

  return (
    <div className={`bg-bg-secondary border-t border-border-light ${className}`}>
      {/* 离线提示 */}
      {!isOnline && (
        <div className="px-4 pt-3">
          <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
            <svg
              className="w-4 h-4 text-yellow-600 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-sm text-yellow-700">网络已断开，请检查网络连接</p>
          </div>
        </div>
      )}

      {/* 输入区域容器 - 白色背景 */}
      <div className="p-4">
        {/* 输入框外层 - 白色背景卡片 */}
        <div className="flex items-end gap-3 p-3 bg-bg-tertiary rounded-xl border border-border-light shadow-sm focus-within:border-wechat-green focus-within:ring-1 focus-within:ring-wechat-green transition-all duration-150">
          {/* 文本域 */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="输入消息，Enter 发送，Shift + Enter 换行"
            disabled={isDisabled}
            rows={1}
            className="flex-1 resize-none px-3 py-2
                       bg-gray-50 rounded-lg
                       text-text-primary text-sm leading-relaxed
                       placeholder:text-xs placeholder:text-[#B2B2B2]
                       focus:outline-none focus:bg-gray-100
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors duration-150"
            style={{ minHeight: '40px', maxHeight: '50vh' }}
          />

          {/* 发送按钮 */}
          <button
            onClick={handleSend}
            disabled={!canSend}
            className={`flex-shrink-0 px-5 py-2.5 rounded-lg font-medium text-sm
                        transition-colors duration-150
                        ${canSend
                          ? 'bg-wechat-green hover:bg-wechat-greenDark text-white'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
          >
            发送
          </button>
        </div>
      </div>
    </div>
  )
}
