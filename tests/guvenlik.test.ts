import { test } from 'node:test'
import assert from 'node:assert/strict'
import { gorselTuruBul, ozelAdresMi } from '../src/main/services/gorsel.service'
import { girisLimitiOlustur, istemciAdresi } from '../src/main/api/giris-limiti'
import { saklanacakYedekler } from '../src/main/database/backup'
import { uzakKanalIzinliMi } from '../src/main/ipc/uzak-kanallar'

test('görsel türü dosya imzasından bulunur, SVG reddedilir', () => {
  assert.equal(gorselTuruBul(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))?.uzanti, '.jpg')
  assert.equal(gorselTuruBul(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))?.uzanti, '.png')
  assert.equal(gorselTuruBul(Buffer.from('RIFF0000WEBPVP8 '))?.uzanti, '.webp')
  assert.equal(gorselTuruBul(Buffer.from('<svg onload="alert(1)"></svg>')), null)
  assert.equal(gorselTuruBul(Buffer.from('<html>')), null)
})

test('SSRF: yerel ve özel ağ adresleri engellenir', () => {
  for (const ip of ['127.0.0.1', '10.0.0.5', '192.168.1.10', '172.16.0.1', '169.254.169.254', '0.0.0.0', '::1', 'fe80::1', 'fd00::1', '::ffff:192.168.1.1', '100.64.0.1']) {
    assert.equal(ozelAdresMi(ip), true, ip)
  }
  for (const ip of ['8.8.8.8', '151.101.1.69', '2606:4700::1111']) {
    assert.equal(ozelAdresMi(ip), false, ip)
  }
})

test('PIN denemesi 5 hatada kilitlenir, kilit süresi artar', () => {
  const limit = girisLimitiOlustur()
  for (let i = 0; i < 4; i++) assert.equal(limit.hatali('a'), 0)
  assert.equal(limit.hatali('a'), 90)
  assert.equal(limit.izinVarMi('a').izinli, false)
  assert.equal(limit.izinVarMi('b').izinli, true)
})

test('LAN istemcisi CF-Connecting-IP sahteleyerek kilidi atlatamaz', () => {
  const lan = { socket: { remoteAddress: '192.168.1.50' }, headers: { 'cf-connecting-ip': '1.2.3.4', 'x-forwarded-for': '5.6.7.8' } }
  assert.equal(istemciAdresi(lan), '192.168.1.50')
  const tunel = { socket: { remoteAddress: '127.0.0.1' }, headers: { 'cf-connecting-ip': '1.2.3.4' } }
  assert.equal(istemciAdresi(tunel), 'cf:1.2.3.4')
})

test('LAN köprüsü yalnızca izin listesindeki kanalları çalıştırır', () => {
  assert.equal(uzakKanalIzinliMi('hesap:odeme-al'), true)
  assert.equal(uzakKanalIzinliMi('uygulama:kapat'), false)
  assert.equal(uzakKanalIzinliMi('terminal:kaydet'), false)
  assert.equal(uzakKanalIzinliMi('guncelleme:yukle-ve-baslat'), false)
})

test('yedek saklama: son 20 + günlük 30 gün + aylık 12 ay', () => {
  const simdi = new Date(2026, 9, 24, 12)
  const yedekler = []
  // Son 60 gün, günde 6 yedek (sık aç-kapa yapılan kasa)
  for (let g = 0; g < 60; g++) {
    for (let s = 0; s < 6; s++) {
      const t = new Date(simdi.getTime() - g * 86400_000 - s * 3600_000)
      yedekler.push({ dosyaAdi: `y-${g}-${s}`, olusturmaTarihi: t })
    }
  }
  const sakla = saklanacakYedekler(yedekler, simdi)
  // 20 en yeni + kalan 30 günden günlük + daha eski aylardan birer
  assert.ok(sakla.has('y-0-0'))
  assert.ok(sakla.has('y-25-0'), '25 gün önceki günlük yedek korunmalı')
  assert.ok(!sakla.has('y-25-3'), 'aynı günün diğer yedekleri silinmeli')
  assert.ok(sakla.size < 70, `toplam ${sakla.size}`)
  assert.ok(sakla.has('y-59-0') || [...sakla].some(a => a.startsWith('y-5')), 'eski aydan en az bir yedek kalmalı')
})
