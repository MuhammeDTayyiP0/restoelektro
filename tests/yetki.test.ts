import { test } from 'node:test'
import assert from 'node:assert/strict'
import { pinOzetiHesapla } from '../src/main/services/guvenlik.service'
import { duzPinleriDonustur, pinIlePersonelBul, pinHatasi, personelGuvenli } from '../src/main/services/pin.service'
import { oturumAc, oturumKapat, onayEkle, yetkiIste, YetkiHatasi, oturumlariSifirla, ONAY_SURESI_MS } from '../src/main/services/yetki.service'
import { testVeritabani } from './yardimci'

const ozet = (pin: string) => pinOzetiHesapla('test-anahtari-test-anahtari-test-anahtari', pin)
const personel = (db: any, rol: string) => (db.prepare('SELECT * FROM personel WHERE rol = ? LIMIT 1').get(rol) as any)

async function hazirla() {
  const db = await testVeritabani()
  duzPinleriDonustur(db, ozet)
  oturumlariSifirla()
  return db
}

test('düz PIN\'ler özete çevrilir, varsayılanlar değiştirilmeye işaretlenir', async () => {
  const db = await hazirla()
  const satirlar = db.prepare('SELECT pin_kodu, pin_hash, pin_degismeli FROM personel').all() as any[]
  assert.ok(satirlar.length >= 3)
  for (const s of satirlar) {
    assert.equal(s.pin_kodu, null, 'düz PIN kalmamalı')
    assert.match(s.pin_hash, /^h1:[0-9a-f]{64}$/)
    assert.equal(s.pin_degismeli, 1, 'tohum PIN\'leri (0000/1234/5678) varsayılandır')
  }
  assert.equal(pinIlePersonelBul(db, '0000', ozet)?.rol, 'admin')
  assert.equal(pinIlePersonelBul(db, '9999', ozet), null)
})

test('yeni PIN: varsayılan ve başkasının PIN\'i reddedilir', async () => {
  const db = await hazirla()
  const garson = personel(db, 'garson')
  db.prepare('UPDATE personel SET pin_hash = ? WHERE id = ?').run(ozet('4821'), garson.id)
  assert.match(pinHatasi(db, '1234', ozet) || '', /varsayılan/)
  assert.match(pinHatasi(db, '4821', ozet) || '', /başka bir personel/)
  assert.equal(pinHatasi(db, '4821', ozet, garson.id), null, 'kendi PIN\'ini tekrar seçebilir')
  assert.match(pinHatasi(db, '12a4', ozet) || '', /4 haneli/)
})

test('yanıtlarda PIN özeti ve şifre özeti yer almaz', async () => {
  const db = await hazirla()
  const guvenli = personelGuvenli(personel(db, 'admin'))
  assert.equal('pin_hash' in guvenli || 'sifre_hash' in guvenli || 'pin_kodu' in guvenli, false)
  assert.equal(guvenli.pin_tanimli, true)
})

test('garson iptal yetkisi yok; yönetici onayıyla geçer, onay süresi dolunca biter', async () => {
  const db = await hazirla()
  const ekran = { sender: { id: 7 } }
  const garson = personel(db, 'garson')
  const admin = personel(db, 'admin')
  oturumAc(ekran, garson.id)

  assert.throws(() => yetkiIste(db, ekran, 'pos/iptal'), YetkiHatasi)

  onayEkle(ekran, admin.id, 'pos/iptal')
  assert.deepEqual(yetkiIste(db, ekran, 'pos/iptal'), { personelId: garson.id, onaylayanId: admin.id })
  assert.throws(() => yetkiIste(db, ekran, 'pos/ikram'), YetkiHatasi, 'onay yalnızca istenen işlem için geçerli')

  const simdi = Date.now
  Date.now = () => simdi() + ONAY_SURESI_MS + 1
  try {
    assert.throws(() => yetkiIste(db, ekran, 'pos/iptal'), YetkiHatasi)
  } finally {
    Date.now = simdi
  }
})

test('kasiyer indirim yapabilir; oturum kapanınca yetki düşer', async () => {
  const db = await hazirla()
  const ekran = { sender: { id: 9 } }
  const kasiyer = personel(db, 'kasiyer')
  oturumAc(ekran, kasiyer.id)
  assert.equal(yetkiIste(db, ekran, 'pos/indirim').onaylayanId, kasiyer.id)
  oturumKapat(ekran)
  assert.throws(() => yetkiIste(db, ekran, 'pos/indirim'), YetkiHatasi)
})

test('ikinci kasa oturumları terminal kimliğiyle ayrılır', async () => {
  const db = await hazirla()
  const admin = personel(db, 'admin')
  oturumAc({ lanTerminal: 'T-AAAAAA' }, admin.id)
  assert.equal(yetkiIste(db, { lanTerminal: 'T-AAAAAA' }, 'personel/yazma').onaylayanId, admin.id)
  assert.throws(() => yetkiIste(db, { lanTerminal: 'T-BBBBBB' }, 'personel/yazma'), YetkiHatasi)
  assert.throws(() => yetkiIste(db, { sender: { id: 1 } }, 'personel/yazma'), YetkiHatasi)
})

test('pasifleştirilen yöneticinin onayı geçersiz olur', async () => {
  const db = await hazirla()
  const ekran = { sender: { id: 11 } }
  const admin = personel(db, 'admin')
  onayEkle(ekran, admin.id, 'pos/ikram')
  db.prepare('UPDATE personel SET aktif = 0 WHERE id = ?').run(admin.id)
  assert.throws(() => yetkiIste(db, ekran, 'pos/ikram'), YetkiHatasi)
})
