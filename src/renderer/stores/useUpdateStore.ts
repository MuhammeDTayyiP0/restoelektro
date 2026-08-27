// =====================================================
// Güncelleme Yönetimi Zustand Store (useUpdateStore)
// electron-updater olayları, indirme ilerlemesi ve kontrol akışı
// =====================================================

import { create } from 'zustand'
import { GUNCELLEME_KANALLARI } from '../../common/ipc-channels'
import { APP_VERSION_TAG } from '../utils/version'

export interface GuncellemeIlerleme {
  percent: number
  bytesPerSecond: number
  transferred: number
  total: number
}

export type GuncellemeDurum =
  | 'idle'
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'error'

export interface GuncellemeDurumBilgisi {
  status: GuncellemeDurum
  currentVersion: string
  newVersion?: string
  releaseDate?: string
  releaseNotes?: string
  progress?: GuncellemeIlerleme
  error?: string
  lastChecked?: string
}

interface UpdateState extends GuncellemeDurumBilgisi {
  isPopoverOpen: boolean
  isInitialized: boolean
  setPopoverOpen: (open: boolean) => void
  togglePopover: () => void
  initUpdater: () => Promise<void>
  kontrolEt: () => Promise<void>
  indir: () => Promise<void>
  yukleVeYenidenBaslat: () => Promise<void>
  temizleHata: () => void
}

export const useUpdateStore = create<UpdateState>((set, get) => ({
  status: 'idle',
  currentVersion: APP_VERSION_TAG,
  newVersion: undefined,
  releaseDate: undefined,
  releaseNotes: undefined,
  progress: undefined,
  error: undefined,
  lastChecked: undefined,
  isPopoverOpen: false,
  isInitialized: false,

  setPopoverOpen: (open: boolean) => set({ isPopoverOpen: open }),
  togglePopover: () => set((state) => ({ isPopoverOpen: !state.isPopoverOpen })),

  initUpdater: async () => {
    if (get().isInitialized) return
    set({ isInitialized: true })

    if (typeof window !== 'undefined' && window.api) {
      // IPC olay dinleyicilerini kaydet
      window.api.on(GUNCELLEME_KANALLARI.DURUM_BILDIRIMI, (data: any) => {
        if (data && typeof data === 'object') {
          set({
            status: data.status || 'idle',
            currentVersion: data.currentVersion ? (data.currentVersion.startsWith('v') ? data.currentVersion : `v${data.currentVersion}`) : get().currentVersion,
            newVersion: data.newVersion ? (data.newVersion.startsWith('v') ? data.newVersion : `v${data.newVersion}`) : undefined,
            releaseDate: data.releaseDate,
            releaseNotes: data.releaseNotes,
            progress: data.progress,
            error: data.error,
            lastChecked: data.lastChecked,
          })
        }
      })

      window.api.on(GUNCELLEME_KANALLARI.ILERLEME_BILDIRIMI, (progress: any) => {
        if (progress) {
          set({
            status: 'downloading',
            progress: {
              percent: progress.percent || 0,
              bytesPerSecond: progress.bytesPerSecond || 0,
              transferred: progress.transferred || 0,
              total: progress.total || 0,
            },
          })
        }
      })

      // İlk durumu çek
      try {
        const durum = (await window.api.invoke(GUNCELLEME_KANALLARI.DURUM_GETIR)) as GuncellemeDurumBilgisi
        if (durum) {
          set({
            status: durum.status || 'idle',
            currentVersion: durum.currentVersion ? (durum.currentVersion.startsWith('v') ? durum.currentVersion : `v${durum.currentVersion}`) : APP_VERSION_TAG,
            newVersion: durum.newVersion ? (durum.newVersion.startsWith('v') ? durum.newVersion : `v${durum.newVersion}`) : undefined,
            releaseDate: durum.releaseDate,
            releaseNotes: durum.releaseNotes,
            progress: durum.progress,
            error: durum.error,
            lastChecked: durum.lastChecked,
          })
        }
      } catch (err) {
        console.error('Güncelleme durumu alınamadı:', err)
      }
    }
  },

  kontrolEt: async () => {
    set({ status: 'checking', error: undefined })
    if (typeof window !== 'undefined' && window.api) {
      try {
        const res = (await window.api.invoke(GUNCELLEME_KANALLARI.KONTROL_ET)) as any
        if (!res?.basarili && res?.hata) {
          set({ status: 'error', error: res.hata })
        }
      } catch (err: any) {
        set({ status: 'error', error: err?.message || 'Kontrol başarısız oldu' })
      }
    }
  },

  indir: async () => {
    set({
      status: 'downloading',
      progress: { percent: 0, bytesPerSecond: 0, transferred: 0, total: 0 },
      error: undefined,
    })
    if (typeof window !== 'undefined' && window.api) {
      try {
        const res = (await window.api.invoke(GUNCELLEME_KANALLARI.INDIR)) as any
        if (!res?.basarili && res?.hata) {
          set({ status: 'error', error: res.hata })
        }
      } catch (err: any) {
        set({ status: 'error', error: err?.message || 'İndirme başlatılamadı' })
      }
    }
  },

  yukleVeYenidenBaslat: async () => {
    if (typeof window !== 'undefined' && window.api) {
      try {
        await window.api.invoke(GUNCELLEME_KANALLARI.YUKLE_VE_BASLAT)
      } catch (err: any) {
        set({ status: 'error', error: err?.message || 'Yeniden başlatılamadı' })
      }
    }
  },

  temizleHata: () => {
    set({ status: 'idle', error: undefined })
  },
}))
