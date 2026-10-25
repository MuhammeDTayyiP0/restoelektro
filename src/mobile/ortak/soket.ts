// Socket.io istemcisi sunucunun /socket.io/socket.io.js betiğinden global olarak gelir
import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    io?: (secenek?: any) => any
  }
}

/**
 * Token ile canlı olaylara bağlanır; olay adı → işleyici eşlemesi verilir.
 * Token değişince bağlantı yeniden kurulur, bileşen kalkınca kapanır.
 * İşleyiciler ref'te tutulur; her render'da yeniden bağlanmadan güncel state'i görür.
 */
export function useCanliOlaylar(token: string | null, olaylar: Record<string, (...args: any[]) => void>): void {
  const ref = useRef(olaylar)
  ref.current = olaylar

  useEffect(() => {
    if (!token || !window.io) return
    const soket = window.io({ auth: { token } })
    for (const ad of Object.keys(ref.current)) {
      soket.on(ad, (...a: any[]) => ref.current[ad]?.(...a))
    }
    return () => soket.disconnect()
  }, [token])
}
