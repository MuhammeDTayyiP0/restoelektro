import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  IslemHatasi,
  hesapAc,
  siparisleriEkle,
  siparisIptalEt,
  indirimUygula,
  odemeAl,
  hesapIptalEt,
  hesapBol,
} from '../src/main/services/siparis.service'
import { testVeritabani, bosMasa, urunEkle, adminId } from './yardimci'

async function hazirla(fiyat = 150) {
  const db = await testVeritabani()
  const personel = adminId(db)
  const masa = bosMasa(db)
  const urun = urunEkle(db, fiyat)
  const { hesap_id } = hesapAc(db, { masaId: masa, personelId: personel })
  return { db, personel, masa, urun, hesapId: hesap_id }
}

const hesap = (db: any, id: number) => db.prepare('SELECT * FROM hesap WHERE id = ?').get(id) as any

test('migration 013 sütunları eklenmiş', async () => {
  const db = await testVeritabani()
  const odeme = (db.prepare('PRAGMA table_info(odeme)').all() as any[]).map(c => c.name)
  const h = (db.prepare('PRAGMA table_info(hesap)').all() as any[]).map(c => c.name)
  assert.ok(odeme.includes('alinan_tutar') && odeme.includes('para_ustu'))
  assert.ok(h.includes('indirim_tipi') && h.includes('indirim_degeri'))
})

test('istemcinin gönderdiği fiyat yok sayılır', async () => {
  const { db, personel, urun, hesapId } = await hazirla(150)
  siparisleriEkle(db, hesapId, personel, [{ urun_id: urun, miktar: 2, birim_fiyat: 1, toplam_fiyat: 1 } as any])
  const s = db.prepare('SELECT birim_fiyat, toplam_fiyat FROM siparis WHERE hesap_id = ?').get(hesapId) as any
  assert.equal(s.birim_fiyat, 150)
  assert.equal(s.toplam_fiyat, 300)
  assert.equal(hesap(db, hesapId).net_tutar, 300)
})

test('bulunamayan ürün siparişi sessizce düşürülmez', async () => {
  const { db, personel, urun, hesapId } = await hazirla()
  assert.throws(() => siparisleriEkle(db, hesapId, personel, [{ urun_id: urun, miktar: 1 }, { urun_id: 999999, miktar: 1 }]), IslemHatasi)
  const adet = (db.prepare('SELECT COUNT(*) as n FROM siparis WHERE hesap_id = ?').get(hesapId) as any).n
  assert.equal(adet, 0, 'transaction geri alınmalı')
})

test('yetkisiz ikram reddedilir', async () => {
  const { db, personel, urun, hesapId } = await hazirla()
  assert.throws(() => siparisleriEkle(db, hesapId, personel, [{ urun_id: urun, miktar: 1, ikram: true }], { ikramIzinli: false }), /yetki/)
})

test('para üstü ciroya yazılmaz, hesap kapanır', async () => {
  const { db, personel, urun, hesapId, masa } = await hazirla(150)
  siparisleriEkle(db, hesapId, personel, [{ urun_id: urun, miktar: 1 }])
  const sonuc = odemeAl(db, [{ hesap_id: hesapId, odeme_tipi: 'nakit', tutar: 200, personel_id: personel }])
  assert.deepEqual(sonuc, { kapandi: true, para_ustu: 50 })

  const o = db.prepare('SELECT tutar, alinan_tutar, para_ustu FROM odeme WHERE hesap_id = ?').get(hesapId) as any
  assert.deepEqual({ ...o }, { tutar: 150, alinan_tutar: 200, para_ustu: 50 })
  assert.equal(hesap(db, hesapId).durum, 'odendi')
  assert.equal((db.prepare('SELECT durum FROM masa WHERE id = ?').get(masa) as any).durum, 'bos')
})

test('kapanmış hesaba ikinci ödeme (çift Enter) reddedilir', async () => {
  const { db, personel, urun, hesapId } = await hazirla(150)
  siparisleriEkle(db, hesapId, personel, [{ urun_id: urun, miktar: 1 }])
  const odeme = { hesap_id: hesapId, odeme_tipi: 'nakit', tutar: 150, personel_id: personel }
  odemeAl(db, [odeme])
  assert.throws(() => odemeAl(db, [odeme]), IslemHatasi)

  const odemeAdet = (db.prepare('SELECT COUNT(*) as n FROM odeme WHERE hesap_id = ?').get(hesapId) as any).n
  const satisAdet = (db.prepare("SELECT COUNT(*) as n FROM kasa_hareket WHERE hesap_id = ? AND islem_tipi = 'satis'").get(hesapId) as any).n
  assert.equal(odemeAdet, 1)
  assert.equal(satisAdet, 1)
})

test('kart ile fazla ödeme reddedilir', async () => {
  const { db, personel, urun, hesapId } = await hazirla(150)
  siparisleriEkle(db, hesapId, personel, [{ urun_id: urun, miktar: 1 }])
  assert.throws(() => odemeAl(db, [{ hesap_id: hesapId, odeme_tipi: 'kredi_karti', tutar: 200, personel_id: personel }]), /aşamaz/)
})

test('üçe bölünmüş ödeme kuruş artığı yüzünden açık kalmaz', async () => {
  const { db, personel, urun, hesapId } = await hazirla(100)
  siparisleriEkle(db, hesapId, personel, [{ urun_id: urun, miktar: 1 }])
  for (const tutar of [33.33, 33.33]) {
    assert.equal(odemeAl(db, [{ hesap_id: hesapId, odeme_tipi: 'nakit', tutar, personel_id: personel }]).kapandi, false)
  }
  assert.equal(odemeAl(db, [{ hesap_id: hesapId, odeme_tipi: 'nakit', tutar: 33.34, personel_id: personel }]).kapandi, true)
})

test('yüzde indirim sonradan eklenen ürünlere de uygulanır', async () => {
  const { db, personel, urun, hesapId } = await hazirla(100)
  siparisleriEkle(db, hesapId, personel, [{ urun_id: urun, miktar: 2 }])
  assert.equal(indirimUygula(db, { hesap_id: hesapId, indirim_tipi: 'yuzde', deger: 10 }).indirim_tutar, 20)

  siparisleriEkle(db, hesapId, personel, [{ urun_id: urun, miktar: 1 }])
  const h = hesap(db, hesapId)
  assert.equal(h.indirim_tutar, 30)
  assert.equal(h.net_tutar, 270)
})

test('iptal edilmiş sipariş tekrar iptal edilemez, stok bir kez iade edilir', async () => {
  const { db, personel, urun, hesapId } = await hazirla()
  const hammadde = Number(db.prepare("INSERT INTO hammadde (ad, birim, mevcut_stok) VALUES ('Et', 'kg', 10)").run().lastInsertRowid)
  db.prepare("INSERT INTO recete (urun_id, hammadde_id, miktar, birim) VALUES (?, ?, 0.2, 'kg')").run(urun, hammadde)
  const stok = () => (db.prepare('SELECT mevcut_stok FROM hammadde WHERE id = ?').get(hammadde) as any).mevcut_stok

  const [kalem] = siparisleriEkle(db, hesapId, personel, [{ urun_id: urun, miktar: 1 }])
  assert.equal(stok(), 9.8)
  siparisIptalEt(db, kalem.siparis_id, 'test', personel)
  assert.equal(stok(), 10)
  assert.throws(() => siparisIptalEt(db, kalem.siparis_id, 'test', personel), /zaten iptal/)
  assert.equal(stok(), 10)
})

test('ödeme alınmış hesap iptal edilemez', async () => {
  const { db, personel, urun, hesapId } = await hazirla(100)
  siparisleriEkle(db, hesapId, personel, [{ urun_id: urun, miktar: 2 }])
  odemeAl(db, [{ hesap_id: hesapId, odeme_tipi: 'nakit', tutar: 50, personel_id: personel }])
  assert.throws(() => hesapIptalEt(db, hesapId), /ödeme alınmış/)
})

test('Alman usulü kısmi ödeme toplamı kuruşu kuruşuna korur', async () => {
  const { db, personel, urun, hesapId } = await hazirla(100)
  const [kalem] = siparisleriEkle(db, hesapId, personel, [{ urun_id: urun, miktar: 3 }])
  const sonuc = odemeAl(db, [{
    hesap_id: hesapId, odeme_tipi: 'nakit', tutar: 100, personel_id: personel,
    odenen_siparisler: [{ id: kalem.siparis_id, miktar: 1 }],
  }])
  assert.equal(sonuc.kapandi, false)
  const toplam = (db.prepare("SELECT SUM(toplam_fiyat) as t FROM siparis WHERE hesap_id = ? AND durum != 'iptal'").get(hesapId) as any).t
  assert.equal(toplam, 300)
  assert.equal(hesap(db, hesapId).net_tutar, 300)
})

test('hesap bölme başka hesabın siparişini taşıyamaz ve hedef masayı doldurur', async () => {
  const { db, personel, urun, hesapId } = await hazirla(100)
  const [kalem] = siparisleriEkle(db, hesapId, personel, [{ urun_id: urun, miktar: 1 }])
  const digerMasa = bosMasa(db)
  const diger = hesapAc(db, { masaId: bosMasa(db), personelId: personel }).hesap_id
  const [yabanci] = siparisleriEkle(db, diger, personel, [{ urun_id: urun, miktar: 1 }])

  assert.throws(() => hesapBol(db, { kaynak_hesap_id: hesapId, siparis_idleri: [yabanci.siparis_id] }), /ait değil/)
  const { yeni_hesap_id } = hesapBol(db, { kaynak_hesap_id: hesapId, siparis_idleri: [kalem.siparis_id], yeni_masa_id: digerMasa })
  assert.equal(hesap(db, yeni_hesap_id).net_tutar, 100)
  assert.equal(hesap(db, hesapId).net_tutar, 0)
  assert.equal((db.prepare('SELECT durum FROM masa WHERE id = ?').get(digerMasa) as any).durum, 'dolu')
})
