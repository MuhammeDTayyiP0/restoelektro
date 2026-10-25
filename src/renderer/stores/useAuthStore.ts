// =====================================================
// Zustand Store — Auth (Oturum) State
// Personel giriş/çıkış ve yetkilerini yönetir
// Asıl oturum ana işlemde tutulur; buradaki token yeniden açılışta oturumu geri kurmak içindir
// =====================================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Personel } from '../../common/types/staff.types'
import { PERSONEL_KANALLARI } from '../../common/ipc-channels'

interface AuthState {
  personel: Personel | null
  token: string | null
  girisYapildi: boolean
  /** Varsayılan PIN ile girildi — yeni PIN seçilene kadar uygulama kilitli */
  pinDegistirmeli: boolean
  girisYap: (personel: Personel, token: string, pinDegistirmeli?: boolean) => void
  cikisYap: () => void
  pinDegistirildi: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      personel: null,
      token: null,
      girisYapildi: false,
      pinDegistirmeli: false,

      girisYap: (personel, token, pinDegistirmeli = false) => {
        set({ personel, token, girisYapildi: true, pinDegistirmeli })
      },

      cikisYap: () => {
        // Ana işlemdeki oturumu da kapat (yetki ve onaylar bu ekrandan silinir)
        window.api?.invoke(PERSONEL_KANALLARI.CIKIS_YAP).catch(() => {})
        set({ personel: null, token: null, girisYapildi: false, pinDegistirmeli: false })
      },

      pinDegistirildi: () => set({ pinDegistirmeli: false }),
    }),
    {
      name: 'restoelektro-auth', // localStorage'da tutulacak isim
      // Sadece bu alanları kalıcı yap (şifre vs içermemeli)
      partialize: (state) => ({
        personel: state.personel,
        token: state.token,
        girisYapildi: state.girisYapildi,
        pinDegistirmeli: state.pinDegistirmeli,
      }),
    }
  )
)
