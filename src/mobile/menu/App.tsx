// =====================================================
// QR Dijital Menü — müşteriye açık, salt okunur
// =====================================================

import React, { useEffect, useMemo, useState } from 'react'
import { istek } from '../ortak/api'
import { getUrunSatisTurleri } from '../../common/fiyat'

const KATEGORI_IKONLARI: Array<[string, string]> = [
  ['çorba', '🍜'], ['salata', '🥗'], ['et', '🥩'], ['kebap', '🔥'],
  ['tavuk', '🍗'], ['balık', '🐟'], ['deniz', '🦐'], ['makarna', '🍝'],
  ['pizza', '🍕'], ['burger', '🍔'], ['sandviç', '🥪'], ['tatlı', '🍮'],
  ['pasta', '🎂'], ['dondurma', '🍨'], ['kahvaltı', '🍳'], ['meze', '🫒'],
  ['başlangıç', '🫒'], ['ara', '🍢'], ['ızgara', '🔥'], ['fırın', '♨️'],
  ['içecek', '🥤'], ['meşrubat', '🥤'], ['su', '💧'], ['kahve', '☕'],
  ['çay', '🍵'], ['alkol', '🍷'], ['kokteyl', '🍸'], ['bira', '🍺'],
  ['şarap', '🍷'], ['atıştırma', '🍿'], ['aperatif', '🧀'], ['ana', '🍽️'],
  ['yemek', '🍽️'], ['pilav', '🍚'], ['sebze', '🥬'], ['vegan', '🌱'],
]

const kategoriIkonu = (ad: string) => {
  const kucuk = (ad || '').toLowerCase()
  return KATEGORI_IKONLARI.find(([anahtar]) => kucuk.includes(anahtar))?.[1] || '◆'
}

function birimAdi(b: string) {
  const s = (b || '').trim().toLowerCase()
  if (s === 'kg' || s === 'kilo') return 'KG'
  if (s === 'porsiyon') return 'Porsiyon'
  if (s === 'adet') return 'Adet'
  if (s === 'gram' || s === 'gr') return 'Gram'
  return b ? b.charAt(0).toUpperCase() + b.slice(1) : 'Porsiyon'
}

const fiyatYazisi = (urun: any) =>
  getUrunSatisTurleri(urun).map((t) => `${birimAdi(t.birim)}: ${Number(t.fiyat || 0).toLocaleString('tr-TR')} ₺`).join(' | ')

const Yildiz = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l2.09 6.26L20 9.27l-5 3.87L16.18 20 12 16.77 7.82 20 9 13.14l-5-3.87 5.91-1.01L12 2z" />
  </svg>
)

export default function App() {
  const masaNo = useMemo(() => new URLSearchParams(window.location.search).get('masa'), [])
  const [veri, setVeri] = useState<{ isletme_adi: string; kategoriler: any[]; urunler: any[] } | null>(null)
  const [hata, setHata] = useState(false)
  const [aktifKategori, setAktifKategori] = useState<number | null>(null)
  const [arama, setArama] = useState('')
  const [detay, setDetay] = useState<any>(null)

  useEffect(() => {
    istek<any>('/api/qrmenu')
      .then((d) => {
        const kategoriler = [...(d.kategoriler || [])].sort((a, b) => {
          const sa = a.sira_no ?? 999, sb = b.sira_no ?? 999
          return sa !== sb ? sa - sb : String(a.ad || '').localeCompare(String(b.ad || ''), 'tr')
        })
        const isletme = d.isletme_adi || 'Restoran'
        document.title = `${isletme} — Dijital Menü`
        setVeri({ isletme_adi: isletme, kategoriler, urunler: d.urunler || [] })
      })
      .catch(() => setHata(true))
  }, [])

  useEffect(() => {
    document.body.style.overflow = detay ? 'hidden' : ''
  }, [detay])

  const q = arama.trim().toLowerCase()
  const filtreli = useMemo(() => {
    if (!veri) return []
    return veri.urunler.filter((u) =>
      (!q || String(u.ad || '').toLowerCase().includes(q) || String(u.kisaltma || '').toLowerCase().includes(q)) &&
      (aktifKategori === null || u.kategori_id === aktifKategori)
    )
  }, [veri, q, aktifKategori])

  const gosterilecekKategoriler = veri ? (aktifKategori !== null ? veri.kategoriler.filter((k) => k.id === aktifKategori) : veri.kategoriler) : []
  let sira = 0

  return (
    <>
      <div className="app-container">
        <header className="header-masthead">
          <div className="brand-ornament">
            <span className="brand-ornament-line" />
            <Yildiz />
            <span className="brand-ornament-line" />
          </div>
          <h1 className="brand-title">{veri?.isletme_adi || 'RESTORAN'}</h1>
          <div className="brand-subtitle">Dijital Menü</div>
          {masaNo ? (
            <div className="table-badge" style={{ display: 'flex' }}>
              <div className="table-badge-inner">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="3" /><line x1="3" y1="9" x2="21" y2="9" /></svg>
                <span>Masa {masaNo}</span>
              </div>
            </div>
          ) : null}
        </header>

        <nav className="sticky-nav">
          <div className="search-section">
            <div className="search-box">
              <span className="search-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              </span>
              <input type="text" className="search-input" placeholder="Menüde ara..." autoComplete="off" value={arama} onChange={(e) => setArama(e.target.value)} />
              <button className="search-clear" style={{ display: arama.trim() ? 'flex' : 'none' }} onClick={() => setArama('')}>✕</button>
            </div>
          </div>
          <div className="cat-scroll">
            {veri ? (
              <>
                <button className={'cat-pill' + (aktifKategori === null ? ' active' : '')} onClick={() => setAktifKategori(null)}>
                  <span className="cat-pill-icon">◆</span>
                  <span>Tümü</span>
                  <span className="cat-pill-count">{veri.urunler.length}</span>
                </button>
                {veri.kategoriler.map((k) => {
                  const adet = veri.urunler.filter((u) => u.kategori_id === k.id).length
                  if (!adet) return null
                  return (
                    <button
                      key={k.id}
                      className={'cat-pill' + (aktifKategori === k.id ? ' active' : '')}
                      onClick={(e) => {
                        setAktifKategori(k.id)
                        e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
                      }}
                    >
                      <span className="cat-pill-icon">{kategoriIkonu(k.ad)}</span>
                      <span>{k.ad}</span>
                      <span className="cat-pill-count">{adet}</span>
                    </button>
                  )
                })}
              </>
            ) : null}
          </div>
        </nav>

        <main className="menu-content">
          {!veri ? (
            <div className="shimmer-loader">
              {hata ? (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  </div>
                  <div className="empty-state-title">Menüye Erişilemedi</div>
                  <div className="empty-state-desc">Lütfen internet bağlantınızı kontrol edip sayfayı yenileyin.</div>
                </div>
              ) : (
                <>
                  <div className="shimmer-block w-40 h-lg" /><div className="shimmer-block w-80" /><div className="shimmer-block w-60" />
                  <div style={{ height: 16 }} />
                  <div className="shimmer-block w-80" /><div className="shimmer-block w-60" /><div className="shimmer-block w-40" />
                  <div style={{ height: 16 }} />
                  <div className="shimmer-block w-40 h-lg" /><div className="shimmer-block w-80" /><div className="shimmer-block w-60" />
                </>
              )}
            </div>
          ) : !filtreli.length ? (
            <div>
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
                </div>
                <div className="empty-state-title">Sonuç bulunamadı</div>
                <div className="empty-state-desc">Farklı bir terim deneyin veya kategorilere göz atın.</div>
              </div>
            </div>
          ) : (
            <div>
              {gosterilecekKategoriler.map((kat) => {
                const katUrunler = filtreli.filter((u) => u.kategori_id === kat.id)
                if (!katUrunler.length) return null
                const grupSira = sira
                sira += katUrunler.length
                return (
                  <div key={kat.id} className="category-group animate-in" style={{ animationDelay: grupSira * 0.06 + 's' }}>
                    <div className="category-header">
                      <div className="category-title">{kat.ad}</div>
                      <div className="category-count">{katUrunler.length} çeşit</div>
                    </div>
                    <div className="dish-list">
                      {katUrunler.map((urun, i) => {
                        const gecikme = (grupSira + i) * 0.04 + 's'
                        const aciklama = urun.kisaltma || ''
                        return urun.resim_yolu ? (
                          <div key={urun.id} className="dish-card-rich animate-in" style={{ animationDelay: gecikme }} onClick={() => setDetay(urun)}>
                            <div className="dish-thumb"><img src={urun.resim_yolu} alt={urun.ad} loading="lazy" /></div>
                            <div className="dish-card-info">
                              <div>
                                <div className="dish-card-title">{urun.ad}</div>
                                {aciklama ? <div className="dish-card-desc">{aciklama}</div> : null}
                              </div>
                              <div className="dish-card-footer"><span className="dish-card-price">{fiyatYazisi(urun)}</span></div>
                            </div>
                          </div>
                        ) : (
                          <div key={urun.id} className="dish-row animate-in" style={{ animationDelay: gecikme }} onClick={() => setDetay(urun)}>
                            <div className="dish-row-top">
                              <span className="dish-name">{urun.ad}</span>
                              <span className="dish-dots" />
                              <span className="dish-price">{fiyatYazisi(urun)}</span>
                            </div>
                            {aciklama ? <div className="dish-desc">{aciklama}</div> : null}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
              <div className="menu-footer animate-in" style={{ animationDelay: sira * 0.03 + 0.2 + 's' }}>
                <div className="footer-brand">{veri.isletme_adi}</div>
                <div className="footer-sub">Dijital Menü</div>
              </div>
            </div>
          )}
        </main>
      </div>

      <div className={'overlay' + (detay ? ' open' : '')} onClick={(e) => { if (e.target === e.currentTarget) setDetay(null) }}>
        <div className="detail-sheet">
          <div className="sheet-handle" />
          <div className="sheet-top-bar">
            <span className="sheet-title">Detay</span>
            <button className="sheet-close" onClick={() => setDetay(null)} aria-label="Kapat">✕</button>
          </div>
          {detay ? (
            <div className="sheet-body">
              {detay.resim_yolu ? <div className="detail-img-wrap" style={{ display: 'block' }}><img src={detay.resim_yolu} alt={detay.ad} /></div> : null}
              <h2 className="detail-name">{detay.ad}</h2>
              <div className="detail-price-row">
                <span className="detail-price">{fiyatYazisi(detay)}</span>
                <span className="detail-unit" />
              </div>
              {detay.kisaltma ? <p className="detail-desc" style={{ display: 'block' }}>{detay.kisaltma}</p> : null}
              {(() => {
                const kat = veri?.kategoriler.find((k) => k.id === detay.kategori_id)
                return kat ? <div className="detail-category-tag" style={{ display: 'inline-flex' }}>{kat.ad}</div> : null
              })()}
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}
