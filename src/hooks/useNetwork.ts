import { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'

/**
 * 监听网络状态
 * 检测在线/离线状态变化
 */
export function useNetwork() {
  const setIsOnline = useAppStore((state) => state.setIsOnline)
  const isOnline = useAppStore((state) => state.isOnline)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // 初始化时同步状态
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setIsOnline])

  return { isOnline }
}
