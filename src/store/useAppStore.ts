import { create } from 'zustand'
import type { AppSettings } from '@/types'
import { DEFAULT_SETTINGS, STORAGE_KEY } from '@/types'

interface AppState {
  /** 当前激活的会话 ID */
  activeConversationId: string | null
  /** 设置弹窗开关 */
  isSettingsOpen: boolean
  /** 全局设置 */
  settings: AppSettings
  /** 是否正在加载 */
  isLoading: boolean
  /** 网络状态 */
  isOnline: boolean
  /** 会话列表刷新计数器 */
  conversationRefreshCounter: number

  // Actions
  setActiveConversationId: (id: string | null) => void
  setIsSettingsOpen: (open: boolean) => void
  setSettings: (settings: Partial<AppSettings>) => void
  setIsLoading: (loading: boolean) => void
  setIsOnline: (online: boolean) => void
  loadSettings: () => void
  saveSettings: () => void
  refreshConversations: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  activeConversationId: null,
  isSettingsOpen: false,
  settings: DEFAULT_SETTINGS,
  isLoading: false,
  isOnline: navigator.onLine,
  conversationRefreshCounter: 0,

  setActiveConversationId: (id) => set({ activeConversationId: id }),
  setIsSettingsOpen: (open) => set({ isSettingsOpen: open }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsOnline: (online) => set({ isOnline: online }),
  refreshConversations: () => set((state) => ({ conversationRefreshCounter: state.conversationRefreshCounter + 1 })),

  setSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),

  loadSettings: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<AppSettings>
        set({ settings: { ...DEFAULT_SETTINGS, ...parsed } })
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  },

  saveSettings: () => {
    try {
      const { settings } = get()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  },
}))

/** 获取当前设置（用于非 Hook 场景，如 ai.ts） */
export function getSettings(): AppSettings {
  return useAppStore.getState().settings
}
