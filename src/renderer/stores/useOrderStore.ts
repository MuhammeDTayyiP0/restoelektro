// =====================================================
// Zustand Store — Sipariş State (Mutfak & Garson)
// =====================================================

import { create } from 'zustand'

export const useOrderStore = create((set) => ({
  aktifSiparisler: [],
  yukleniyor: false,
  hata: null,

  siparisleriGetir: async () => {
    // Phase 4'te Mutfak ve Garson entegrasyonunda doldurulacak
  }
}))
