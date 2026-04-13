/**
 * Ai-Chat 根组件
 * 仿微信风格双栏布局
 */

import { useEffect } from 'react'
import { Sidebar } from '@/components/Layout/Sidebar'
import { ChatWindow } from '@/components/Layout/ChatWindow'
import { SettingsModal } from '@/components/Settings/SettingsModal'
import { useAppStore } from '@/store/useAppStore'
import { useNetwork } from '@/hooks/useNetwork'

function App() {
  // 初始化设置
  const loadSettings = useAppStore((state) => state.loadSettings)

  // 监听网络状态
  useNetwork()

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  return (
    <div className="flex h-screen w-screen bg-bg-secondary">
      {/* 左侧栏：会话列表 */}
      <Sidebar className="w-64 flex-shrink-0" />

      {/* 右侧栏：聊天窗口 */}
      <ChatWindow className="flex-1" />

      {/* 设置弹窗 */}
      <SettingsModal />
    </div>
  )
}

export default App
