// =====================================================
// Zustand Store — Menü State
// Kategoriler ve ürünleri önbelleğe alır (Performans için)
// =====================================================

import { create } from 'zustand'
import type { Kategori, Urun } from '../../common/types/menu.types'
import { ipcInvoke } from '../hooks/useIPC'
import { MENU_KANALLARI } from '../../common/ipc-channels'

interface MenuState {
  kategoriler: Kategori[]
  urunler: Urun[]
  yukleniyor: boolean
  hata: string | null
  
  // Fonksiyonlar
  menuyuGetir: () => Promise<void>
  urunleriKategoriyeGoreFiltrele: (kategoriId: number) => Urun[]
}

export const useMenuStore = create<MenuState>((set, get) => ({
  kategoriler: [],
  urunler: [],
  yukleniyor: false,
  hata: null,

  menuyuGetir: async () => {
    set({ yukleniyor: true, hata: null })
    try {
      // Paralel olarak kategori ve ürünleri çek
      const [kategoriler, urunler] = await Promise.all([
        ipcInvoke<Kategori[]>(MENU_KANALLARI.KATEGORILER),
        ipcInvoke<Urun[]>(MENU_KANALLARI.URUNLER)
      ])
      
      const siraliKategoriler = (kategoriler || []).sort((a, b) => {
        const orderA = a.sira_no !== undefined && a.sira_no !== null ? a.sira_no : 999
        const orderB = b.sira_no !== undefined && b.sira_no !== null ? b.sira_no : 999
        if (orderA !== orderB) return orderA - orderB
        return (a.ad || '').localeCompare(b.ad || '', 'tr')
      })
      
      set({ kategoriler: siraliKategoriler, urunler, yukleniyor: false })
    } catch (err: any) {
      set({ hata: err.message, yukleniyor: false })
    }
  },

  urunleriKategoriyeGoreFiltrele: (kategoriId) => {
    return get().urunler.filter(urun => urun.kategori_id === kategoriId)
  }
}))
