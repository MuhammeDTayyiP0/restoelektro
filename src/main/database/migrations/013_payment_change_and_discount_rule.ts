// =====================================================
// Migration 013: Para üstü, indirim kuralı ve dağınık sütunların toplanması
// - odeme.alinan_tutar / para_ustu: müşteriden alınan nakit ile hesaba yazılan tutar ayrılır
// - hesap.indirim_tipi / indirim_degeri: yüzde indirim toplam değiştikçe yeniden hesaplanır
// - Daha önce IPC kaydı sırasında eklenen sütunlar artık migration ile eklenir
// Not: 12 numarası eski bir sürümde 'operations_z_denetim_paket_satin' adıyla kullanıldı;
// sahadaki veritabanlarında kayıtlı olduğundan tekrar kullanılmaz.
// =====================================================

import type Database from 'better-sqlite3'
import type { Migration } from './index'
import { sutunYoksaEkle } from '../migration-runner'

export const migration013: Migration = {
  version: 13,
  name: 'payment_change_and_discount_rule',
  up: (db: Database.Database) => {
    // Eskiden pos.ipc.ts / menu.ipc.ts açılışta ekliyordu
    sutunYoksaEkle(db, 'siparis', 'satis_birim', "TEXT DEFAULT 'porsiyon'")
    sutunYoksaEkle(db, 'siparis', 'gramaj', 'REAL DEFAULT NULL')
    sutunYoksaEkle(db, 'hesap', 'teslimat_durumu', 'TEXT')
    sutunYoksaEkle(db, 'hesap', 'teslimat_telefon', 'TEXT')
    sutunYoksaEkle(db, 'hesap', 'teslimat_adres', 'TEXT')
    sutunYoksaEkle(db, 'hesap', 'teslimat_musteri', 'TEXT')
    sutunYoksaEkle(db, 'hesap', 'kurye', 'TEXT')
    sutunYoksaEkle(db, 'urun', 'porsiyon_fiyati', 'REAL DEFAULT NULL')
    sutunYoksaEkle(db, 'urun', 'kilo_fiyati', 'REAL DEFAULT NULL')
    sutunYoksaEkle(db, 'kategori', 'sira_no', 'INTEGER DEFAULT 999')

    // Para üstü ayrımı
    sutunYoksaEkle(db, 'odeme', 'alinan_tutar', 'REAL')
    sutunYoksaEkle(db, 'odeme', 'para_ustu', 'REAL DEFAULT 0')
    db.prepare('UPDATE odeme SET alinan_tutar = tutar WHERE alinan_tutar IS NULL').run()

    // İndirim kuralı (tip + değer); eski kayıtlarda NULL kalır ve sabit tutar olarak davranır
    sutunYoksaEkle(db, 'hesap', 'indirim_tipi', 'TEXT')
    sutunYoksaEkle(db, 'hesap', 'indirim_degeri', 'REAL')
  },
}
