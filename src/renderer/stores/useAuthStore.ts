// =====================================================
// Zustand Store — Auth (Oturum) State
// Personel giriş/çıkış ve yetkilerini yönetir
// =====================================================

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Personel } from '../../common/types/staff.types'

interface AuthState {
  personel: Personel | null
  token: string | null
  girisYapildi: boolean
  girisYap: (personel: Personel, token: string) => void
  cikisYap: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      personel: null,
      token: null,
      girisYapildi: false,
      
      girisYap: (personel, token) => {
        set({ personel, token, girisYapildi: true })
      },
      
      cikisYap: () => {
        set({ personel: null, token: null, girisYapildi: false })
      }
    }),
    {
      name: 'restoelektro-auth', // localStorage'da tutulacak isim
      // Sadece bu alanları kalıcı yap (şifre vs içermemeli)
      partialize: (state) => ({ 
        personel: state.personel, 
        token: state.token, 
        girisYapildi: state.girisYapildi 
      }),
    }
  )
)
