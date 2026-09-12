# ETİBOL POS — Patron Paneli 2.5.4

Bu paket, mevcut restoran POS’una **salt okunur patron (boss) mobil paneli** ekler.
Garson, QR menü, kasa, stok ve Windows 7 POS’una dokunulmaz.

Sürüm: **2.5.4**

## Hangi dosyalar?

| Dosya | İşlem |
|---|---|
| `src/main/api/boss-api.ts` | **Yeni** — patron API (sadece okuma) |
| `src/main/api/boss-mobile.ts` | **Değiştir** — telefon + masaüstü arayüz |
| `src/main/api/server.ts` | **Değiştir** — `/boss` rotası aynı, API bağlandı |
| `package.json` | Sürüm **2.5.4** |
| `package-lock.json` | Sürüm **2.5.4** |
| `src/renderer/utils/version.ts` | Yedek sürüm **2.5.4** |

## Nasıl kurulur?

1. POS uygulamasını kapatın.
2. Bu dosyaları `restoran/` klasörünüzdeki aynı yollara kopyalayın.
3. Kaynak koddan çalışıyorsanız: `npm run dev` veya mevcut derleme komutunuz.
4. Kurulu `.exe` kullanıyorsanız: `npm run dist` ile yeniden paketleyin.
5. POS açılınca telefon / Cloudflare tüneli:

   `http://KASA-IP:3847/boss`  
   veya  
   `http://KASA-IP:3847/patron`

Ayarlar → QR → **Patron** sekmesindeki özel bulut linki (Cloudflare Tunnel) aynı kalır.

## Giriş

- Yalnızca **yönetici** ve **müdür** PIN’i kabul edilir.
- Garson / kasiyer PIN’i reddedilir.
- 5 hatalı denemede 90 saniye kilit.
- PIN tuşlarında çift dokunuş yakınlaştırması kapalıdır.
- Oturum 12 saat.

Varsayılan yönetici PIN (ilk kurulumdaysa): `0000`

## Üst dönem menüsü

Bugün / Dün / Hafta / Ay / Özel seçimi **üst çubukta sabittir** (sayfa sayfa tekrarlanmaz).
Özet ve raporlar bu döneme göre dolar. Masalar, kasa ve operasyon canlı kalır.

## Panelde ne var? (hepsi izleme)

- Özet: ciro, kâr, açık masa, nakit/kart, ikram/iptal, saatlik grafik
- Masalar: canlı kat, adisyon kalemleri
- Rapor: ürün, kategori, personel, ödeme
- Kasa: açık vardiya, beklenen nakit, giderler, son Z
- Stok uyarıları, paket kuyruğu, rezervasyon, denetim izi

Telefondan sipariş, ödeme, kasa kapatma, stok düşme **yok**.

## Cloudflare

Mevcut tünelinizi değiştirmeyin. `/boss` yolu zaten POS API’sinden yayınlanır.
QR ayarındaki “Özel Bulut Linki” alanına tünel URL’nizin sonuna `/boss` ekleyerek kaydedin.
