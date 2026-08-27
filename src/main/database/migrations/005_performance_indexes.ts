// =====================================================
// Migration 005: Kritik Tablo Performans İndeksleri
// hesap (orders), siparis (order_items), masa ve ürün ilişkileri için
// =====================================================

import type Database from 'better-sqlite3'
import type { Migration } from './index'
import { indeksYoksaEkle } from '../migration-runner'

export const migration005: Migration = {
  version: 5,
  name: 'add_performance_indexes',
  up: (db: Database.Database) => {
    // 1. HESAP (ORDERS) İNDEKSLERİ
    // Masaya göre açık hesap sorguları (Masa durumu ve POS açılışında en çok kullanılan sorgu)
    indeksYoksaEkle(db, 'idx_hesap_masa_durum', 'CREATE INDEX IF NOT EXISTS idx_hesap_masa_durum ON hesap(masa_id, durum);')
    // Açık hesaplar ve kronolojik sıralama
    indeksYoksaEkle(db, 'idx_hesap_durum_acilis', 'CREATE INDEX IF NOT EXISTS idx_hesap_durum_acilis ON hesap(durum, acilis_zamani);')
    // Kapanış zamanına göre ciro ve raporlama
    indeksYoksaEkle(db, 'idx_hesap_kapanis', 'CREATE INDEX IF NOT EXISTS idx_hesap_kapanis ON hesap(kapanis_zamani);')
    // Garson bazlı hesap dökümü
    indeksYoksaEkle(db, 'idx_hesap_personel', 'CREATE INDEX IF NOT EXISTS idx_hesap_personel ON hesap(personel_id);')
    // Müşteri bazlı geçmiş hesaplar
    indeksYoksaEkle(db, 'idx_hesap_musteri', 'CREATE INDEX IF NOT EXISTS idx_hesap_musteri ON hesap(musteri_id);')

    // 2. SİPARİŞ (ORDER ITEMS) İNDEKSLERİ
    // Adisyona ait iptal edilmemiş kalemleri hızlı getirme
    indeksYoksaEkle(db, 'idx_siparis_hesap_durum', 'CREATE INDEX IF NOT EXISTS idx_siparis_hesap_durum ON siparis(hesap_id, durum);')
    // Ürün bazlı satış, reçete maliyet ve popülerlik raporları
    indeksYoksaEkle(db, 'idx_siparis_urun', 'CREATE INDEX IF NOT EXISTS idx_siparis_urun ON siparis(urun_id);')
    // Personel sipariş performans raporları
    indeksYoksaEkle(db, 'idx_siparis_personel', 'CREATE INDEX IF NOT EXISTS idx_siparis_personel ON siparis(personel_id);')
    // Tarih aralıklı sipariş filtreleri
    indeksYoksaEkle(db, 'idx_siparis_zamani', 'CREATE INDEX IF NOT EXISTS idx_siparis_zamani ON siparis(siparis_zamani);')

    // 3. SİPARİŞ OPSİYONLARI İNDEKSLERİ
    indeksYoksaEkle(db, 'idx_siparis_opsiyon_siparis', 'CREATE INDEX IF NOT EXISTS idx_siparis_opsiyon_siparis ON siparis_opsiyonlari(siparis_id);')
    indeksYoksaEkle(db, 'idx_siparis_opsiyon_opsiyon', 'CREATE INDEX IF NOT EXISTS idx_siparis_opsiyon_opsiyon ON siparis_opsiyonlari(opsiyon_id);')

    // 4. MASA İNDEKSLERİ
    indeksYoksaEkle(db, 'idx_masa_bolum', 'CREATE INDEX IF NOT EXISTS idx_masa_bolum ON masa(bolum_id);')
    indeksYoksaEkle(db, 'idx_masa_durum', 'CREATE INDEX IF NOT EXISTS idx_masa_durum ON masa(durum);')

    // 5. ÜRÜN VARYANT & OPSİYON İNDEKSLERİ
    indeksYoksaEkle(db, 'idx_urun_varyant_urun', 'CREATE INDEX IF NOT EXISTS idx_urun_varyant_urun ON urun_varyant(urun_id);')
    indeksYoksaEkle(db, 'idx_urun_opsiyonu_urun', 'CREATE INDEX IF NOT EXISTS idx_urun_opsiyonu_urun ON urun_opsiyonu(urun_id);')
  },
}
