// =====================================================
// Zustand Store — UI State
// Tema, genel yükleniyor durumu, sidebar vs.
// =====================================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  karanlikTema: boolean
  sidebarAcik: boolean
  kioskModu: boolean // Tam ekran, çıkışa izin vermeyen mod
  
  temaDegistir: () => void
  sidebarTetikle: (acik?: boolean) => void
  kioskModuDegistir: (durum: boolean) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      karanlikTema: true, // POS sistemlerinde varsayılan olarak koyu tema iyidir (göz yormaz)
      sidebarAcik: false, // Mobilde/POS'ta kapalı başlasın
      kioskModu: false,
      
      temaDegistir: () => set((state) => {
        const yeniTema = !state.karanlikTema
        if (yeniTema) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
        return { karanlikTema: yeniTema }
      }),
      
      sidebarTetikle: (acik) => set((state) => ({ 
        sidebarAcik: acik !== undefined ? acik : !state.sidebarAcik 
      })),
      
      kioskModuDegistir: (durum) => set({ kioskModu: durum }),
    }),
    {
      name: 'restoelektro-ui',
    }
  )
)

// Uygulama başlarken temayı uygula
export const initTema = () => {
  const state = useUIStore.getState()
  if (state.karanlikTema) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}
