// =====================================================
// Zustand Store — Yönetici Onayı İsteği
// Ana işlem "yetkiGerekli" döndürdüğünde ipcInvoke burada PIN ister ve bekler
// =====================================================

import { create } from 'zustand'

interface OnayIstegi {
  yetki: string
  mesaj: string
  coz: (onaylandi: boolean) => void
}

interface OnayState {
  istek: OnayIstegi | null
}

export const useOnayStore = create<OnayState>(() => ({ istek: null }))

let bekleyen: { yetki: string; vaat: Promise<boolean> } | null = null

/**
 * Yönetici PIN penceresini açar; onaylanırsa true döner.
 * Aynı yetki için art arda gelen istekler (örn. birden çok kalem iptali) tek pencereyi paylaşır.
 */
export function yoneticiOnayiIste(yetki: string, mesaj: string): Promise<boolean> {
  if (bekleyen && bekleyen.yetki === yetki) return bekleyen.vaat
  const vaat = new Promise<boolean>((resolve) => {
    useOnayStore.setState({
      istek: {
        yetki,
        mesaj,
        coz: (onaylandi) => {
          useOnayStore.setState({ istek: null })
          bekleyen = null
          resolve(onaylandi)
        },
      },
    })
  })
  bekleyen = { yetki, vaat }
  return vaat
}
