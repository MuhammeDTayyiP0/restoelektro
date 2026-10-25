import { test } from 'node:test'
import assert from 'node:assert/strict'
import { kalemFiyatiHesapla, indirimTutariHesapla, odemeyiAyir, paraYuvarla } from '../src/common/fiyat'

test('paraYuvarla kayan nokta artıklarını temizler', () => {
  assert.equal(paraYuvarla(0.1 + 0.2), 0.3)
  assert.equal(paraYuvarla(33.33 + 33.33 + 33.34), 100)
  assert.equal(paraYuvarla(1.005), 1.01)
  assert.equal(paraYuvarla(NaN), 0)
})

test('porsiyon fiyatı: (porsiyon_fiyati + ek) × porsiyon × adet', () => {
  const urun = { fiyat: 100, porsiyon_fiyati: 120 }
  const s = kalemFiyatiHesapla(urun, { isKg: false, miktar: 2, porsiyon: 1.5, ekFiyat: 10 })
  assert.equal(s.birimFiyat, 195)
  assert.equal(s.toplamFiyat, 390)
})

test('kg fiyatı: (kilo_fiyati + ek) × gramaj × adet', () => {
  const urun = { fiyat: 350, satis_turleri: JSON.stringify([{ birim: 'porsiyon', fiyat: 350 }, { birim: 'kg', fiyat: 1400 }]) }
  const s = kalemFiyatiHesapla(urun, { isKg: true, miktar: 1, gramaj: 0.35 })
  assert.equal(s.birimFiyat, 490)
  assert.equal(s.toplamFiyat, 490)
})

test('yüzde indirim güncel toplam üzerinden, tutar indirimi toplamı aşamaz', () => {
  assert.equal(indirimTutariHesapla(200, 'yuzde', 10), 20)
  assert.equal(indirimTutariHesapla(300, 'yuzde', 10), 30)
  assert.equal(indirimTutariHesapla(50, 'tutar', 80), 50)
  assert.equal(indirimTutariHesapla(50, 'yuzde', 250), 50)
  assert.equal(indirimTutariHesapla(0, 'yuzde', 10), 0)
})

test('para üstü hesaba yazılmaz', () => {
  assert.deepEqual(odemeyiAyir(200, 150), { tutar: 150, paraUstu: 50 })
  assert.deepEqual(odemeyiAyir(100, 150), { tutar: 100, paraUstu: 0 })
  assert.deepEqual(odemeyiAyir(150, 150), { tutar: 150, paraUstu: 0 })
})
