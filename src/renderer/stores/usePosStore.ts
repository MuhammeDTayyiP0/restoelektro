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
  porsiyon: number
  secilenSatisTuru?: 'porsiyon' | 'kg' | string
  gramaj?: number
  satisBirim?: 'porsiyon' | 'kilo' | string
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
  sepeteEkle: (
    urun: Urun,
    miktar?: number,
    porsiyon?: number,
    varyant?: UrunVaryant,
    opsiyonlar?: UrunOpsiyonu[],
    notlar?: string,
    secilenSatisTuru?: 'porsiyon' | 'kg' | string,
    gramaj?: number
  ) => void
  sepettenCikar: (id: string) => void
  sepetMiktarGuncelle: (id: string, miktar: number) => void
  sepetGramajGuncelle: (id: string, gramaj: number) => void
  sepetNotGuncelle: (id: string, notlar: string) => void
  sepetIkramTogle: (id: string) => void
  sepetiTemizle: () => void
  
  // İptal İşlemleri
  siparisIptalEkle: (siparisId: number) => void
  siparisIptalGeriAl: (siparisId: number) => void
  iptalleriTemizle: () => void
  
  // Hesap İşlemleri
  hesapAyarla: (hesap: Hesap | null, masaId?: number | null) => void
  hesapGuncelle: (hesap: Hesap) => void
}

export const usePosStore = create<PosState>((set) => ({
  aktifHesap: null,
  aktifMasaId: null,
  sepet: [],
  iptalEdilecekSiparisler: [],
  seciliKategoriId: null,
  
  kategoriSec: (id) => set({ seciliKategoriId: id }),
  
  sepeteEkle: (urun, miktar = 1, porsiyon = 1, varyant, opsiyonlar = [], notlar = '', secilenSatisTuru, gramaj) => set((state) => {
    const normSatisTuru = (secilenSatisTuru || (urun.birim?.toLowerCase() === 'kg' ? 'kg' : 'porsiyon')).toLowerCase()
    const isKg = normSatisTuru === 'kg' || normSatisTuru === 'kilo'
    const normGramaj = isKg ? (gramaj || 1) : undefined

    // Aynı ürün, varyant, opsiyon, porsiyon, satis turu var mı (KG satırları gramaj birleştirilir)
    const varolanIndeks = state.sepet.findIndex(k => {
      const kSatisTuru = (k.secilenSatisTuru || k.satisBirim || (k.urun.birim?.toLowerCase() === 'kg' ? 'kg' : 'porsiyon')).toLowerCase()
      const kIsKg = kSatisTuru === 'kg' || kSatisTuru === 'kilo'

      if (k.urun.id !== urun.id || k.varyant?.id !== varyant?.id) return false
      if (JSON.stringify(k.opsiyonlar) !== JSON.stringify(opsiyonlar)) return false
      if (k.notlar !== notlar) return false
      if (kIsKg !== isKg) return false
      if (isKg) return true
      return k.porsiyon === porsiyon
    })

    if (varolanIndeks >= 0) {
      const varOlanItem = state.sepet[varolanIndeks]
      return {
        sepet: state.sepet.map(item => {
          if (item.id !== varOlanItem.id) return item
          if (isKg) {
            const yeniGramaj = Math.round(((item.gramaj || 0) + (normGramaj || 0)) * 1000) / 1000
            return { ...item, gramaj: yeniGramaj, miktar: 1, secilenSatisTuru: 'kg', satisBirim: 'kilo' }
          }
          return { ...item, miktar: item.miktar + miktar }
        })
      }
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
          ikram: false,
          porsiyon,
          secilenSatisTuru: isKg ? 'kg' : 'porsiyon',
          gramaj: normGramaj,
          satisBirim: isKg ? 'kilo' : 'porsiyon'
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

  sepetGramajGuncelle: (id, gramaj) => set((state) => ({
    sepet: state.sepet.map(k => k.id === id ? {
      ...k,
      gramaj,
      miktar: k.miktar && k.miktar > 0 ? k.miktar : 1,
      secilenSatisTuru: 'kg',
      satisBirim: 'kilo'
    } : k)
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
  
  hesapAyarla: (hesap, masaId = null) => set((state) => {
    const hedefMasaId = masaId || hesap?.masa_id || null
    // Aynı hesap veya aynı masa açılıyorsa taslak sepeti koru
    const ayniHesap = !!(state.aktifHesap?.id && hesap?.id && state.aktifHesap.id === hesap.id)
    const ayniMasa = !!(!hesap?.id && !state.aktifHesap?.id && state.aktifMasaId === hedefMasaId)

    return {
      aktifHesap: hesap, 
      aktifMasaId: hedefMasaId,
      sepet: (ayniHesap || ayniMasa) ? state.sepet : [], // Farklı hesaba/masaya geçilirse sepeti temizle
      iptalEdilecekSiparisler: (ayniHesap || ayniMasa) ? state.iptalEdilecekSiparisler : []
    }
  }),

  // Arka plandan (Garson vs.) gelen sipariş güncellemesi: Taslak sepeti ASLA sıfırlamaz
  hesapGuncelle: (hesap) => set((state) => ({
    aktifHesap: hesap,
    aktifMasaId: hesap.masa_id || state.aktifMasaId,
  }))
}))
