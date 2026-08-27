// =====================================================
// Migration 003: Varsayılan Verilerin Güvenli & İdempotent Eklenmesi
// İlk kurulumda temel verileri ekler; mevcut verileri asla ezmez
// =====================================================

import type Database from 'better-sqlite3'
import type { Migration } from './index'

export const migration003: Migration = {
  version: 3,
  name: 'seed_defaults_and_permissions',
  up: (db: Database.Database) => {
    // 1. PERSONEL KONTROLÜ
    const adminVar = db.prepare('SELECT COUNT(*) as sayi FROM personel WHERE rol = ?').get('admin') as any
    if (!adminVar || adminVar.sayi === 0) {
      console.log('🌱 [Migration 003] Varsayılan personel ve yönetici kayıtları oluşturuluyor...')

      // Varsayılan admin (kullanıcı: admin, şifre: admin123, pin: 0000)
      db.prepare(`
        INSERT INTO personel (ad, soyad, kullanici_adi, sifre_hash, rol, pin_kodu)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('Sistem', 'Yöneticisi', 'admin', '$2a$10$8K1p/a0dL1LXMIgoEDFrwOfMQkf9xP6h.k2HEQKAOI8k3x5HYlIjW', 'admin', '0000')

      // Varsayılan garson (kullanıcı: garson1, pin: 1234)
      db.prepare(`
        INSERT INTO personel (ad, soyad, kullanici_adi, sifre_hash, rol, pin_kodu)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('Ahmet', 'Garson', 'garson1', '$2a$10$8K1p/a0dL1LXMIgoEDFrwOfMQkf9xP6h.k2HEQKAOI8k3x5HYlIjW', 'garson', '1234')

      // Varsayılan kasiyer (kullanıcı: kasiyer1, pin: 5678)
      db.prepare(`
        INSERT INTO personel (ad, soyad, kullanici_adi, sifre_hash, rol, pin_kodu)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('Ayşe', 'Kasiyer', 'kasiyer1', '$2a$10$8K1p/a0dL1LXMIgoEDFrwOfMQkf9xP6h.k2HEQKAOI8k3x5HYlIjW', 'kasiyer', '5678')
    }

    // 2. KASALAR KONTROLÜ
    const kasaSayisi = db.prepare('SELECT COUNT(*) as sayi FROM kasa').get() as any
    if (!kasaSayisi || kasaSayisi.sayi === 0) {
      db.prepare('INSERT INTO kasa (ad) VALUES (?)').run('Ana Kasa')
      db.prepare('INSERT INTO kasa (ad) VALUES (?)').run('Bar Kasası')
    }

    // 3. BÖLÜMLER KONTROLÜ
    const bolumSayisi = db.prepare('SELECT COUNT(*) as sayi FROM bolum').get() as any
    if (!bolumSayisi || bolumSayisi.sayi === 0) {
      db.prepare('INSERT INTO bolum (ad, sira) VALUES (?, ?)').run('Ana Salon', 1)
    }

    // 4. KATEGORİ & ÜRÜNLER KONTROLÜ
    const kategoriSayisi = db.prepare('SELECT COUNT(*) as sayi FROM kategori').get() as any
    if (!kategoriSayisi || kategoriSayisi.sayi === 0) {
      const kategoriler = [
        { ad: 'Başlangıçlar', renk: '#10b981' },
        { ad: 'Ana Yemekler', renk: '#f59e0b' },
        { ad: 'Izgara', renk: '#ef4444' },
        { ad: 'Salatalar', renk: '#22c55e' },
        { ad: 'Pizzalar', renk: '#f97316' },
        { ad: 'Tatlılar', renk: '#ec4899' },
        { ad: 'Soğuk İçecekler', renk: '#06b6d4' },
        { ad: 'Sıcak İçecekler', renk: '#8b5cf6' },
        { ad: 'Alkollü İçecekler', renk: '#6366f1' },
      ]
      for (let i = 0; i < kategoriler.length; i++) {
        db.prepare('INSERT INTO kategori (ad, renk, sira) VALUES (?, ?, ?)').run(
          kategoriler[i].ad,
          kategoriler[i].renk,
          i + 1
        )
      }

      // Örnek ürünler
      const urunler = [
        // Başlangıçlar (kategori 1)
        { kategori_id: 1, ad: 'Mercimek Çorbası', fiyat: 75, yazici_grup: 'mutfak' },
        { kategori_id: 1, ad: 'Ezogelin Çorbası', fiyat: 75, yazici_grup: 'mutfak' },
        { kategori_id: 1, ad: 'Humus', fiyat: 95, yazici_grup: 'mutfak' },
        { kategori_id: 1, ad: 'Sigara Böreği (4 adet)', fiyat: 110, yazici_grup: 'mutfak' },
        { kategori_id: 1, ad: 'Patates Kızartması', fiyat: 85, yazici_grup: 'mutfak' },
        // Ana Yemekler (kategori 2)
        { kategori_id: 2, ad: 'İskender', fiyat: 280, yazici_grup: 'mutfak' },
        { kategori_id: 2, ad: 'Mantı', fiyat: 190, yazici_grup: 'mutfak' },
        { kategori_id: 2, ad: 'Karnıyarık', fiyat: 195, yazici_grup: 'mutfak' },
        { kategori_id: 2, ad: 'Ali Nazik Kebabı', fiyat: 310, yazici_grup: 'mutfak' },
        // Izgara (kategori 3)
        { kategori_id: 3, ad: 'Adana Kebap', fiyat: 320, yazici_grup: 'mutfak' },
        { kategori_id: 3, ad: 'Urfa Kebap', fiyat: 320, yazici_grup: 'mutfak' },
        { kategori_id: 3, ad: 'Tavuk Şiş', fiyat: 240, yazici_grup: 'mutfak' },
        { kategori_id: 3, ad: 'Kuzu Pirzola', fiyat: 450, yazici_grup: 'mutfak' },
        { kategori_id: 3, ad: 'Karışık Izgara', fiyat: 520, yazici_grup: 'mutfak' },
        // Soğuk İçecekler (kategori 7)
        { kategori_id: 7, ad: 'Ayran', fiyat: 35, yazici_grup: 'bar' },
        { kategori_id: 7, ad: 'Kola', fiyat: 50, yazici_grup: 'bar' },
        { kategori_id: 7, ad: 'Fanta', fiyat: 50, yazici_grup: 'bar' },
        { kategori_id: 7, ad: 'Soda', fiyat: 30, yazici_grup: 'bar' },
        { kategori_id: 7, ad: 'Taze Portakal Suyu', fiyat: 75, yazici_grup: 'bar' },
        // Sıcak İçecekler (kategori 8)
        { kategori_id: 8, ad: 'Türk Kahvesi', fiyat: 60, yazici_grup: 'bar' },
        { kategori_id: 8, ad: 'Çay', fiyat: 25, yazici_grup: 'bar' },
        { kategori_id: 8, ad: 'Espresso', fiyat: 70, yazici_grup: 'bar' },
        { kategori_id: 8, ad: 'Latte', fiyat: 85, yazici_grup: 'bar' },
        { kategori_id: 8, ad: 'Cappuccino', fiyat: 85, yazici_grup: 'bar' },
      ]
      for (const u of urunler) {
        db.prepare(`
          INSERT INTO urun (kategori_id, ad, fiyat, yazici_grup, kdv_orani)
          VALUES (?, ?, ?, ?, ?)
        `).run(u.kategori_id, u.ad, u.fiyat, u.yazici_grup, 10)
      }
    }

    // 5. SİSTEM AYARLARI
    const ayarlar = [
      { anahtar: 'isletme_adi', deger: 'ETİBOL POS', aciklama: 'İşletme adı' },
      { anahtar: 'vergi_no', deger: '', aciklama: 'Vergi numarası' },
      { anahtar: 'adres', deger: '', aciklama: 'İşletme adresi' },
      { anahtar: 'telefon', deger: '', aciklama: 'İşletme telefonu' },
      { anahtar: 'para_birimi', deger: '₺', aciklama: 'Para birimi sembolü' },
      { anahtar: 'kdv_orani_varsayilan', deger: '10', aciklama: 'Varsayılan KDV oranı (%)' },
      { anahtar: 'yazici_mutfak', deger: '', aciklama: 'Mutfak yazıcısı adresi' },
      { anahtar: 'yazici_bar', deger: '', aciklama: 'Bar yazıcısı adresi' },
      { anahtar: 'yazici_kasa', deger: '', aciklama: 'Kasa fişi yazıcısı' },
      { anahtar: 'api_port', deger: '3847', aciklama: 'REST API port numarası' },
      { anahtar: 'sadakat_puan_oran', deger: '1', aciklama: 'Her 1 TL için kazanılan puan' },
    ]
    for (const a of ayarlar) {
      db.prepare('INSERT OR IGNORE INTO ayar (anahtar, deger, aciklama) VALUES (?, ?, ?)').run(
        a.anahtar,
        a.deger,
        a.aciklama
      )
    }

    // 6. ROL VE YETKİLENDİRMELER
    const yetkiSayisi = db.prepare('SELECT COUNT(*) as sayi FROM yetki').get() as any
    if (!yetkiSayisi || yetkiSayisi.sayi === 0) {
      const moduller = ['pos', 'rapor', 'stok', 'menu', 'personel', 'ayar', 'musteri', 'kasa']
      const islemler = ['okuma', 'yazma', 'silme', 'iptal', 'ikram', 'indirim']
      const roller: Array<{ rol: string; izinler: Record<string, string[]> }> = [
        {
          rol: 'admin',
          izinler: Object.fromEntries(moduller.map(m => [m, islemler])),
        },
        {
          rol: 'mudur',
          izinler: {
            pos: islemler,
            rapor: ['okuma'],
            stok: ['okuma', 'yazma'],
            menu: ['okuma', 'yazma'],
            personel: ['okuma'],
            musteri: ['okuma', 'yazma'],
            kasa: ['okuma', 'yazma'],
            ayar: ['okuma'],
          },
        },
        {
          rol: 'kasiyer',
          izinler: {
            pos: ['okuma', 'yazma', 'indirim'],
            rapor: ['okuma'],
            musteri: ['okuma'],
            kasa: ['okuma', 'yazma'],
          },
        },
        {
          rol: 'garson',
          izinler: {
            pos: ['okuma', 'yazma'],
            musteri: ['okuma'],
          },
        },
        {
          rol: 'mutfak',
          izinler: {
            pos: ['okuma'],
            stok: ['okuma'],
          },
        },
      ]

      for (const { rol, izinler } of roller) {
        for (const modul of moduller) {
          for (const islem of islemler) {
            const izin = izinler[modul]?.includes(islem) ? 1 : 0
            db.prepare('INSERT INTO yetki (rol, modul, islem, izin) VALUES (?, ?, ?, ?)').run(
              rol,
              modul,
              islem,
              izin
            )
          }
        }
      }
    }
  },
}
