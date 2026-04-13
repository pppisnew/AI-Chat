/**
 * 设置弹窗
 * API Key、模型、System Prompt 配置
 */

import { useAppStore } from '@/store/useAppStore'
import { useCallback, useState, useEffect } from 'react'

export interface SettingsModalProps {
  className?: string
}

export function SettingsModal({ className = '' }: SettingsModalProps) {
  const { isSettingsOpen, setIsSettingsOpen, settings, setSettings, saveSettings, loadSettings } =
    useAppStore()

  // 本地表单状态
  const [localSettings, setLocalSettings] = useState(settings)

  // 打开时同步设置
  useEffect(() => {
    if (isSettingsOpen) {
      loadSettings()
      setLocalSettings(settings)
    }
  }, [isSettingsOpen, loadSettings, settings])

  const handleClose = useCallback(() => {
    setIsSettingsOpen(false)
  }, [setIsSettingsOpen])

  const handleSave = useCallback(() => {
    setSettings(localSettings)
    saveSettings()
    handleClose()
  }, [localSettings, setSettings, saveSettings, handleClose])

  const handleInputChange = useCallback(
    (field: keyof typeof localSettings) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setLocalSettings((prev) => ({
          ...prev,
          [field]: e.target.value,
        }))
      },
    []
  )

  if (!isSettingsOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={handleClose}
    >
      <div
        className={`bg-white rounded-lg shadow-xl w-full max-w-md mx-4 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-light">
          <h2 className="text-lg font-medium text-text-primary">设置</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-bg-hover rounded transition-colors"
          >
            <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 内容 */}
        <div className="px-6 py-4 space-y-4">
          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              API Key
            </label>
            <input
              type="password"
              value={localSettings.apiKey}
              onChange={handleInputChange('apiKey')}
              placeholder="输入您的 API Key"
              className="w-full px-3 py-2 border border-border-medium rounded-md
                         focus:outline-none focus:border-wechat-green
                         text-text-primary placeholder-text-tertiary"
            />
            <p className="mt-1 text-xs text-text-tertiary">
              Key 仅保存在本地浏览器，不会上传到任何服务器
            </p>
          </div>

          {/* API Base URL */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              API 地址
            </label>
            <input
              type="text"
              value={localSettings.baseUrl}
              onChange={handleInputChange('baseUrl')}
              placeholder="智谱 API 地址"
              className="w-full px-3 py-2 border border-border-medium rounded-md
                         focus:outline-none focus:border-wechat-green
                         text-text-primary placeholder-text-tertiary"
            />
          </div>

          {/* 模型选择 */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              模型
            </label>
            <input
              type="text"
              value={localSettings.model}
              onChange={handleInputChange('model')}
              placeholder="glm-4-flash"
              className="w-full px-3 py-2 border border-border-medium rounded-md
                         focus:outline-none focus:border-wechat-green
                         text-text-primary placeholder-text-tertiary"
            />
          </div>

          {/* System Prompt */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              System Prompt
            </label>
            <textarea
              value={localSettings.systemPrompt}
              onChange={handleInputChange('systemPrompt')}
              placeholder="设置 AI 的角色和行为"
              rows={3}
              className="w-full px-3 py-2 border border-border-medium rounded-md
                         focus:outline-none focus:border-wechat-green
                         text-text-primary placeholder-text-tertiary resize-none"
            />
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border-light">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary
                       hover:bg-bg-hover rounded-md transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-wechat-green hover:bg-wechat-greenLight
                       text-white rounded-md transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
