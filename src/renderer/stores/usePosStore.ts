// =====================================================
// Zustand Store — POS State
// Aktif POS ekranının durumunu yönetir (seçili hesap, sepet vb.)
// =====================================================

import { create } from 'zustand'
import type { Urun, UrunVaryant, UrunOpsiyonu } from '../../common/types/menu.types'
import type { Hesap, Siparis } from '../../common/types/pos.types'

export interface SepetKalemi {
  id: string // UUID (geçici)
  urun: Urun
  varyant?: UrunVaryant
  opsiyonlar: UrunOpsiyonu[]
  miktar: number
  notlar: string
  ikram: boolean
}

interface PosState {
  aktifHesap: Hesap | null
  aktifMasaId: number | null
  sepet: SepetKalemi[]
  iptalEdilecekSiparisler: number[]
  
  // Kategori seçimi
  seciliKategoriId: number | null
  kategoriSec: (id: number | null) => void
  
  // Sepet İşlemleri
  sepeteEkle: (urun: Urun, miktar?: number, varyant?: UrunVaryant, opsiyonlar?: UrunOpsiyonu[], notlar?: string) => void
  sepettenCikar: (id: string) => void
  sepetMiktarGuncelle: (id: string, miktar: number) => void
  sepetNotGuncelle: (id: string, notlar: string) => void
  sepetIkramTogle: (id: string) => void
  sepetiTemizle: () => void
  
  // İptal İşlemleri
  siparisIptalEkle: (siparisId: number) => void
  siparisIptalGeriAl: (siparisId: number) => void
  iptalleriTemizle: () => void
  
  // Hesap İşlemleri
  hesapAyarla: (hesap: Hesap | null, masaId?: number | null) => void
}

export const usePosStore = create<PosState>((set, get) => ({
  aktifHesap: null,
  aktifMasaId: null,
  sepet: [],
  iptalEdilecekSiparisler: [],
  seciliKategoriId: null,
  
  kategoriSec: (id) => set({ seciliKategoriId: id }),
  
  sepeteEkle: (urun, miktar = 1, varyant, opsiyonlar = [], notlar = '') => set((state) => {
    // Aynı ürün (ve varyant/opsiyon) var mı kontrol et
    const varolanIndeks = state.sepet.findIndex(k => 
      k.urun.id === urun.id && 
      k.varyant?.id === varyant?.id && 
      JSON.stringify(k.opsiyonlar) === JSON.stringify(opsiyonlar) &&
      k.notlar === notlar
    )

    if (varolanIndeks >= 0) {
      // Varsa miktarını artır
      const yeniSepet = [...state.sepet]
      yeniSepet[varolanIndeks].miktar += miktar
      return { sepet: yeniSepet }
    }

    // Yoksa yeni kalem ekle
    return {
      sepet: [
        ...state.sepet,
        {
          id: Math.random().toString(36).substring(7), // Geçici ID
          urun,
          varyant,
          opsiyonlar,
          miktar,
          notlar,
          ikram: false
        }
      ]
    }
  }),
  
  sepettenCikar: (id) => set((state) => ({
    sepet: state.sepet.filter(k => k.id !== id)
  })),
  
  sepetMiktarGuncelle: (id, miktar) => set((state) => ({
    sepet: state.sepet.map(k => k.id === id ? { ...k, miktar } : k)
  })),
  
  sepetNotGuncelle: (id, notlar) => set((state) => {
    const kalemIndex = state.sepet.findIndex(k => k.id === id)
    if (kalemIndex === -1) return state

    const kalem = state.sepet[kalemIndex]
    
    // Eğer miktar 1'den büyükse ve not değişiyorsa (genelde yeni not ekleniyorsa), 1 tanesini ayır
    if (kalem.miktar > 1 && notlar.trim() !== (kalem.notlar || '').trim()) {
      const guncellenmisKalem = { ...kalem, id: Math.random().toString(36).substring(7), miktar: 1, notlar }
      const kalanKalem = { ...kalem, miktar: kalem.miktar - 1 }
      
      const yeniSepet = [...state.sepet]
      yeniSepet.splice(kalemIndex, 1, kalanKalem, guncellenmisKalem)
      
      return { sepet: yeniSepet }
    }
    
    // Miktar 1 ise veya not değişmiyorsa normal güncelle
    return {
      sepet: state.sepet.map(k => k.id === id ? { ...k, notlar } : k)
    }
  }),

  sepetIkramTogle: (id) => set((state) => ({
    sepet: state.sepet.map(k => k.id === id ? { ...k, ikram: !k.ikram } : k)
  })),
  
  sepetiTemizle: () => set({ sepet: [] }),
  
  siparisIptalEkle: (id) => set((state) => ({
    iptalEdilecekSiparisler: state.iptalEdilecekSiparisler.includes(id) 
      ? state.iptalEdilecekSiparisler 
      : [...state.iptalEdilecekSiparisler, id]
  })),
  
  siparisIptalGeriAl: (id) => set((state) => ({
    iptalEdilecekSiparisler: state.iptalEdilecekSiparisler.filter(i => i !== id)
  })),
  
  iptalleriTemizle: () => set({ iptalEdilecekSiparisler: [] }),
  
  hesapAyarla: (hesap, masaId = null) => set({ 
    aktifHesap: hesap, 
    aktifMasaId: masaId || hesap?.masa_id || null,
    sepet: [], // Farklı hesaba geçildiğinde sepeti temizle
    iptalEdilecekSiparisler: [] // Hesaba geçildiğinde iptalleri de temizle
  })
}))
