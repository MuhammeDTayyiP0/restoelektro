// =====================================================
// Patron (Boss) paneli — salt okunur
// Ciro, masalar, rapor, kasa, stok, paket, rezervasyon, denetim
// =====================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { istek, ApiHatasi } from '../ortak/api'
import { para, para0, saatKisa, yerelTarih, iki } from '../ortak/bicim'
import { useCanliOlaylar } from '../ortak/soket'
import { PinTuslari } from '../ortak/PinTuslari'

declare const __APP_VERSION__: string

type Sayfa = 'ozet' | 'masalar' | 'rapor' | 'kasa' | 'daha'
type TarihMod = 'bugun' | 'dun' | 'hafta' | 'ay' | 'ozel'
type Api = <T = any>(yol: string) => Promise<T | null>

const TOKEN_ANAHTARI = 'etibol_boss_token'
const ODEME: Record<string, string> = { nakit: 'Nakit', kredi_karti: 'Kart', yemek_karti: 'Yemek kartı', acik_hesap: 'Veresiye', veresiye: 'Veresiye', cari: 'Cari' }
const ROL: Record<string, string> = { admin: 'Yönetici', mudur: 'Müdür', kasiyer: 'Kasiyer', garson: 'Garson', mutfak: 'Mutfak' }
const STOK: Record<string, string> = { tukendi: 'Tükendi', kritik: 'Kritik', dusuk: 'Düşük', normal: 'Normal' }
const BASLIK: Record<Sayfa, string> = { ozet: 'Canlı özet', masalar: 'Masalar', rapor: 'Raporlar', kasa: 'Kasa vardiyası', daha: 'Operasyon' }
const AYLAR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']

const ikon = (cocuk: React.ReactNode) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{cocuk}</svg>
)
const NAV: Array<{ id: Sayfa; ad: string; ikon: React.ReactNode }> = [
  { id: 'ozet', ad: 'Özet', ikon: ikon(<><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></>) },
  { id: 'masalar', ad: 'Masalar', ikon: ikon(<><rect x="3" y="4" width="18" height="14" rx="2" /><path d="M8 21h8M12 18v3" /></>) },
  { id: 'rapor', ad: 'Rapor', ikon: ikon(<><path d="M4 19V5M4 19h16" /><path d="M8 16l3-5 3 3 5-8" /></>) },
  { id: 'kasa', ad: 'Kasa', ikon: ikon(<><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M6 12h.01M12 12h.01M18 12h.01" /></>) },
  { id: 'daha', ad: 'Operasyon', ikon: ikon(<><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>) },
]

function aralikHesapla(mod: TarihMod, ozelBas: string, ozelBit: string) {
  const simdi = new Date()
  const b = yerelTarih(simdi)
  if (mod === 'dun') {
    const d = new Date(); d.setDate(d.getDate() - 1)
    return { baslangic: yerelTarih(d), bitis: yerelTarih(d) }
  }
  if (mod === 'hafta') {
    const d = new Date(); d.setDate(d.getDate() - (d.getDay() || 7) + 1)
    return { baslangic: yerelTarih(d), bitis: b }
  }
  if (mod === 'ay') return { baslangic: `${simdi.getFullYear()}-${iki(simdi.getMonth() + 1)}-01`, bitis: b }
  if (mod === 'ozel') return { baslangic: ozelBas || b, bitis: ozelBit || b }
  return { baslangic: b, bitis: b }
}

function donemYazisi(a: { baslangic: string; bitis: string }) {
  const tr = (s: string) => {
    const p = s.split('-')
    return p.length < 3 ? s : `${Number(p[2])} ${AYLAR[Number(p[1]) - 1]}`
  }
  return a.baslangic === a.bitis ? tr(a.baslangic) : `${tr(a.baslangic)} – ${tr(a.bitis)}`
}

/** Veriyi yükler; yenilenirken eski veri ekranda kalır */
function useVeri<T>(yukle: () => Promise<T | null>, bagimliliklar: unknown[]): T | null {
  const [veri, setVeri] = useState<T | null>(null)
  useEffect(() => {
    let iptal = false
    yukle().then((v) => { if (!iptal && v !== null) setVeri(v) })
    return () => { iptal = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, bagimliliklar)
  return veri
}

// ===== Küçük yapı taşları =====

function Kpi({ lbl, val, sub, hero }: { lbl: string; val: string; sub?: string; hero?: boolean }) {
  return (
    <div className={'card kpi' + (hero ? ' hero' : '')}>
      <div className="lbl">{lbl}</div>
      <div className="val">{val}</div>
      {sub ? <div className="sub">{sub}</div> : null}
    </div>
  )
}

function Cubuk({ ad, tutar, toplam, oran }: { ad: string; tutar: unknown; toplam: unknown; oran?: unknown }) {
  const pct = Number(toplam) > 0 ? Math.min(100, (Number(tutar || 0) / Number(toplam)) * 100) : 0
  return (
    <div className="barline">
      <span className="nm">{ad}</span>
      <div className="track"><div className="fill" style={{ width: pct + '%' }} /></div>
      <b>{para0(tutar)}{oran != null ? ` · %${oran}` : ''}</b>
    </div>
  )
}

function Satir({ ad, alt, tutar, tutarRenk }: { ad: React.ReactNode; alt?: React.ReactNode; tutar?: string; tutarRenk?: string }) {
  return (
    <div className="row">
      <div>
        <div className="ad">{ad}</div>
        {alt ? <div className="alt">{alt}</div> : null}
      </div>
      {tutar !== undefined ? <div className="amt" style={tutarRenk ? { color: tutarRenk } : undefined}>{tutar}</div> : null}
    </div>
  )
}

const Bos = ({ children }: { children: React.ReactNode }) => <div className="empty">{children}</div>

function Cipler<T extends string>({ secenekler, deger, onSec }: { secenekler: Array<[T, string]>; deger: T; onSec: (v: T) => void }) {
  return (
    <div className="chips">
      {secenekler.map(([id, ad]) => (
        <button key={id} type="button" className={'chip' + (deger === id ? ' on' : '')} onClick={() => onSec(id)}>{ad}</button>
      ))}
    </div>
  )
}

function AlanGrafik({ satirlar }: { satirlar: any[] }) {
  if (!satirlar || !satirlar.length) return <Bos>Bu aralıkta ödenen hesap yok</Bos>
  const w = 640, h = 168, l = 8, r = 8, t = 12, b = 28
  const iw = w - l - r, ih = h - t - b
  const max = Math.max(1, ...satirlar.map((s) => Number(s.tutar || 0)))
  const x = (i: number) => l + (satirlar.length === 1 ? iw / 2 : i * (iw / (satirlar.length - 1)))
  const noktalar = satirlar.map((s, i) => `${x(i).toFixed(1)},${(t + ih - (Number(s.tutar || 0) / max) * ih).toFixed(1)}`)
  const ilk = satirlar.length === 1 ? l + iw / 2 : l
  const son = satirlar.length === 1 ? ilk : l + iw
  const alan = `M ${ilk},${t + ih} L ${noktalar.join(' L ')} L ${son},${t + ih} Z`
  const adim = satirlar.length > 10 ? Math.ceil(satirlar.length / 8) : 1
  return (
    <svg className="chart" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9A5F48" stopOpacity=".45" />
          <stop offset="100%" stopColor="#9A5F48" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={alan} fill="url(#g1)" />
      <polyline fill="none" stroke="#C08F7A" strokeWidth="2.2" points={noktalar.join(' ')} />
      {satirlar.map((s, i) => {
        if (i % adim && i !== satirlar.length - 1) return null
        let etiket = typeof s.saat === 'number' ? iki(s.saat) : String(s.saat || '')
        if (etiket.length >= 10) etiket = etiket.slice(8, 10) + '.' + etiket.slice(5, 7)
        return <text key={i} x={x(i).toFixed(1)} y={h - 8} textAnchor="middle" fill="#7A7166" fontSize="11">{etiket}</text>
      })}
    </svg>
  )
}

function MasaIzgara({ liste, sadeceAcik, onMasa }: { liste: any[]; sadeceAcik: boolean; onMasa: (id: number) => void }) {
  if (!liste.length) return <Bos>Masa yok</Bos>
  const bolumler: Record<string, any[]> = {}
  for (const m of liste) {
    if (sadeceAcik && !m.hesap_id && m.durum !== 'rezerve') continue
    ;(bolumler[m.bolum_adi || 'Salon'] ||= []).push(m)
  }
  const anahtarlar = Object.keys(bolumler)
  if (!anahtarlar.length) return <Bos>Açık masa yok</Bos>
  return (
    <>
      {anahtarlar.map((b) => (
        <React.Fragment key={b}>
          <div className="alt" style={{ margin: '8px 0 6px', fontWeight: 700 }}>{b}</div>
          <div className="masa-grid">
            {bolumler[b].map((m) => (
              <button key={m.id} type="button" className={'tile ' + (m.hesap_id ? 'dolu' : m.durum === 'rezerve' ? 'rez' : 'bos')} onClick={() => onMasa(m.id)}>
                <b>{m.numara}</b>
                <span>{m.hesap_id ? para0(m.net_tutar || m.toplam_tutar) : m.durum === 'rezerve' ? 'Rez.' : 'Boş'}</span>
              </button>
            ))}
          </div>
        </React.Fragment>
      ))}
    </>
  )
}

// ===== Sayfalar =====

function Ozet({ api, qs, tik, gunluk, isletme, onCekim, onMasa }: { api: Api; qs: string; tik: number; gunluk: boolean; isletme: string; onCekim: (s: string) => void; onMasa: (id: number) => void }) {
  const p = useVeri<any>(async () => {
    const v = await api('/api/boss/panel' + qs)
    if (v) onCekim(`${isletme || 'ETİBOL POS'} · ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} güncellendi`)
    return v
  }, [qs, tik])
  if (!p) return null

  const o = p.ozet || {}
  const masalar: any[] = p.masalar || []
  const dolu = masalar.filter((m) => m.hesap_id)
  const v = p.kasa?.vardiya

  return (
    <div className="dash">
      <div className="kpis">
        <Kpi lbl="Ciro" hero val={para(o.toplam_ciro)} sub={`Net kâr ${para(o.net_kar)} · %${o.kar_marji || 0}`} />
        <Kpi lbl="Açık masa" val={String(o.acik_hesap || 0)} sub={`${para0(o.acik_tutar)} adisyon`} />
        <Kpi lbl="Kapanan" val={String(o.kapanan_hesap || 0)} sub={`Ort. ${para0(o.ortalama_hesap)}`} />
        <Kpi lbl="Nakit" val={para0(o.nakit_toplam)} />
        <Kpi lbl="Kart" val={para0(o.kart_toplam)} />
        <Kpi lbl="İkram / iptal" val={para0(o.ikram_tutar)} sub={`İptal ${para0(o.iptal_tutar)}`} />
      </div>

      <div className="card span-8"><h3>Satış akışı <em>{gunluk ? 'günlük' : 'saatlik'}</em></h3><AlanGrafik satirlar={p.saatlik} /></div>
      <div className="card span-4">
        <h3>Ödeme</h3>
        {(p.odeme || []).length ? (p.odeme as any[]).map((x, i) => <Cubuk key={i} ad={ODEME[x.odeme_tipi] || x.odeme_tipi} tutar={x.toplam_tutar} toplam={o.toplam_ciro} oran={x.oran} />) : <Bos>Ödeme yok</Bos>}
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--line)' }}>
          {v ? <div className="alt">Kasa {v.z_no || 'açık'} · beklenen nakit <b>{para0(v.beklenen_nakit)}</b></div> : <div className="alt">Açık vardiya yok</div>}
        </div>
      </div>

      <div className="card span-7"><h3>Açık masalar <em>{dolu.length} dolu / {masalar.length}</em></h3><MasaIzgara liste={masalar} sadeceAcik onMasa={onMasa} /></div>
      <div className="card span-5">
        <h3>En çok satanlar</h3>
        {(p.urunler || []).length ? (p.urunler as any[]).slice(0, 8).map((u, i) => <Satir key={i} ad={u.urun_adi} alt={`${u.kategori_adi} · ${u.satis_adedi} adet`} tutar={para0(u.toplam_ciro)} />) : <Bos>Satış yok</Bos>}
      </div>

      <div className="card span-4">
        <h3>Kategori</h3>
        {(p.kategoriler || []).length ? (p.kategoriler as any[]).map((k, i) => <Cubuk key={i} ad={k.kategori_adi} tutar={k.tutar} toplam={o.toplam_ciro} />) : <Bos>—</Bos>}
      </div>
      <div className="card span-4">
        <h3>Personel</h3>
        {(p.personel || []).filter((x: any) => Number(x.toplam_satis) || Number(x.hesap_sayisi)).map((x: any, i: number) => (
          <Satir key={i} ad={x.personel_adi} alt={`${ROL[x.rol] || x.rol} · ${x.hesap_sayisi} hesap`} tutar={para0(x.toplam_satis)} />
        ))}
      </div>
      <div className="card span-4">
        <h3>Stok uyarısı <em>{(p.stokUyari || []).length}</em></h3>
        {(p.stokUyari || []).length ? (p.stokUyari as any[]).map((s, i) => <Satir key={i} ad={s.hammadde_adi} alt={`${STOK[s.stok_durumu] || s.stok_durumu} · ${s.mevcut_stok} ${s.birim}`} />) : <Bos>Kritik stok yok</Bos>}
      </div>
      <div className="card span-4">
        <h3>Paket / gel-al <em>{(p.paket || []).length} açık</em></h3>
        {(p.paket || []).length ? (p.paket as any[]).map((x, i) => <Satir key={i} ad={x.teslimat_musteri || x.hesap_no || x.hesap_tipi} alt={`${x.teslimat_durumu || x.hesap_tipi} · ${saatKisa(x.acilis_zamani)}`} tutar={para0(x.net_tutar)} />) : <Bos>Açık paket yok</Bos>}
      </div>
      <div className="card span-4">
        <h3>Bugünkü rezervasyon</h3>
        {(p.rezervasyon || []).length ? (p.rezervasyon as any[]).map((r, i) => <Satir key={i} ad={`${r.saat} · ${r.musteri_ad}`} alt={`${r.kisi_sayisi} kişi${r.masa_numara ? ' · Masa ' + r.masa_numara : ''} · ${r.durum}`} />) : <Bos>Rezervasyon yok</Bos>}
      </div>
      <div className="card span-4">
        <h3>Son hareketler</h3>
        {(p.denetim || []).length ? (p.denetim as any[]).map((l, i) => <Satir key={i} ad={l.islem} alt={<>{l.personel_adi || ''} · {saatKisa(l.zaman)}<br />{l.ozet || ''}</>} />) : <Bos>Kayıt yok</Bos>}
      </div>
    </div>
  )
}

function Masalar({ api, tik, bolum, setBolum, sadeceDolu, setSadeceDolu, onMasa }: { api: Api; tik: number; bolum: string; setBolum: (b: string) => void; sadeceDolu: boolean; setSadeceDolu: (v: boolean) => void; onMasa: (id: number) => void }) {
  const liste = useVeri<any[]>(async () => {
    const v = await api<any[]>('/api/boss/masalar')
    return v ? (Array.isArray(v) ? v : []) : null
  }, [tik])
  if (!liste) return null

  const bolumler = [...new Set(liste.map((m) => m.bolum_adi || 'Salon'))]
  const acik = liste.filter((m) => m.hesap_id)
  const tutar = acik.reduce((a, m) => a + Number(m.net_tutar || m.toplam_tutar || 0), 0)
  const goster = liste.filter((m) => (!bolum || m.bolum_adi === bolum) && (!sadeceDolu || m.hesap_id))

  return (
    <>
      <div className="chips">
        <button type="button" className={'chip' + (bolum === '' ? ' on' : '')} onClick={() => setBolum('')}>Tümü</button>
        {bolumler.map((b) => <button key={b} type="button" className={'chip' + (bolum === b ? ' on' : '')} onClick={() => setBolum(b)}>{b}</button>)}
        <button type="button" className={'chip' + (sadeceDolu ? ' on' : '')} onClick={() => setSadeceDolu(!sadeceDolu)}>{sadeceDolu ? 'Dolu masalar' : 'Hepsi'}</button>
      </div>
      <div className="kpis" style={{ gridTemplateColumns: '1fr 1fr 1fr', marginBottom: 12 }}>
        <Kpi lbl="Dolu" val={String(acik.length)} />
        <Kpi lbl="Boş" val={String(liste.length - acik.length)} />
        <Kpi lbl="Açık tutar" val={para0(tutar)} />
      </div>
      <div className="card"><MasaIzgara liste={goster} sadeceAcik={false} onMasa={onMasa} /></div>
    </>
  )
}

function Rapor({ api, qs, sekme, setSekme, arama, setArama }: { api: Api; qs: string; sekme: string; setSekme: (s: string) => void; arama: string; setArama: (s: string) => void }) {
  const veri = useVeri<any>(async () => {
    if (sekme === 'odeme') {
      const od = await api<any[]>('/api/boss/rapor/odeme' + qs)
      const oz = await api<any>('/api/boss/ozet' + qs)
      return od ? { od, toplam: oz?.ozet?.toplam_ciro || 1 } : null
    }
    return api(`/api/boss/rapor/${sekme}${qs}`)
  }, [sekme, qs])

  const q = arama.toLowerCase()
  return (
    <>
      <Cipler secenekler={[['urun', 'Ürünler'], ['kategori', 'Kategori'], ['personel', 'Personel'], ['odeme', 'Ödeme']]} deger={sekme} onSec={setSekme} />
      {!veri ? null : sekme === 'urun' ? (
        <>
          <input className="search" placeholder="Ürün veya kategori ara" value={arama} onChange={(e) => setArama(e.target.value)} />
          <div className="card">
            {(() => {
              const liste = (veri as any[]).filter((u) => !q || String(u.urun_adi || '').toLowerCase().includes(q) || String(u.kategori_adi || '').toLowerCase().includes(q))
              if (!liste.length) return <Bos>Kayıt yok</Bos>
              return (
                <table className="grid">
                  <thead><tr><th>Ürün</th><th>Kategori</th><th className="r">Adet</th><th className="r">Ciro</th><th className="r">Kâr</th><th className="r">Marj</th></tr></thead>
                  <tbody>
                    {liste.map((u, i) => <tr key={i}><td>{u.urun_adi}</td><td>{u.kategori_adi}</td><td className="r">{u.satis_adedi}</td><td className="r">{para(u.toplam_ciro)}</td><td className="r">{para(u.net_kar)}</td><td className="r">%{u.kar_marji}</td></tr>)}
                  </tbody>
                </table>
              )
            })()}
          </div>
        </>
      ) : sekme === 'kategori' ? (
        <div className="card">
          <table className="grid">
            <thead><tr><th>Kategori</th><th className="r">Adet</th><th className="r">Ciro</th><th className="r">Kâr</th></tr></thead>
            <tbody>
              {(veri as any[]).filter((k) => Number(k.tutar)).map((k, i) => <tr key={i}><td>{k.kategori_adi || k.kategori}</td><td className="r">{k.adet || 0}</td><td className="r">{para(k.tutar)}</td><td className="r">{para(k.net_kar)}</td></tr>)}
            </tbody>
          </table>
        </div>
      ) : sekme === 'personel' ? (
        <div className="card">
          <table className="grid">
            <thead><tr><th>Personel</th><th>Rol</th><th className="r">Hesap</th><th className="r">Ciro</th><th className="r">İptal</th><th className="r">İkram</th></tr></thead>
            <tbody>
              {(veri as any[]).map((p, i) => <tr key={i}><td>{p.personel_adi}</td><td>{ROL[p.rol] || p.rol}</td><td className="r">{p.hesap_sayisi}</td><td className="r">{para(p.toplam_satis)}</td><td className="r">{p.iptal_sayisi}</td><td className="r">{para0(p.ikram_tutari)}</td></tr>)}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card">
          {veri.od.length ? veri.od.map((x: any, i: number) => <Cubuk key={i} ad={ODEME[x.odeme_tipi] || x.odeme_tipi} tutar={x.toplam_tutar} toplam={veri.toplam} oran={x.oran} />) : <Bos>Ödeme yok</Bos>}
        </div>
      )}
    </>
  )
}

function Kasa({ api, tik }: { api: Api; tik: number }) {
  const veri = useVeri<any>(async () => {
    const data = await api<any>('/api/boss/kasa')
    const gecmis = await api<any[]>('/api/boss/kasa/gecmis?limit=12')
    return data ? { data, gecmis: gecmis || [] } : null
  }, [tik])
  if (!veri) return null
  const v = veri.data.acik ? veri.data.vardiya : null

  return (
    <>
      <div className="warn">Kasa açma / kapama yalnızca POS üzerindendir.</div>
      <div className="dash">
        {!v ? (
          <div className="card span-12"><Bos>Açık vardiya yok</Bos></div>
        ) : (
          <>
            <div className="card span-8">
              <h3>{v.z_no || 'Açık vardiya'}</h3>
              <div className="kpis" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
                <Kpi lbl="Vardiya ciro" hero val={para(v.toplam_ciro)} sub={`Açılış ${saatKisa(v.acilis_zamani)}`} />
                <Kpi lbl="Nakit" val={para0(v.nakit_satis)} />
                <Kpi lbl="Kart" val={para0(v.kart_satis)} />
                <Kpi lbl="Yemek kartı" val={para0(v.yemek_karti_satis)} />
                <Kpi lbl="Gider" val={para0(v.gider)} />
                <Kpi lbl="Beklenen nakit" val={para0(v.beklenen_nakit)} sub={`Açılış ${para0(v.acilis_nakit)}`} />
              </div>
            </div>
            <div className="card span-4">
              <h3>Giderler</h3>
              {(v.giderler || []).length ? (v.giderler as any[]).map((g, i) => <Satir key={i} ad={g.aciklama || 'Gider'} alt={`${g.personel_adi || ''} · ${saatKisa(g.created_at)}`} tutar={'-' + para(g.tutar)} tutarRenk="var(--red)" />) : <Bos>Gider yok</Bos>}
            </div>
          </>
        )}
        <div className="card span-12">
          <h3>Son Z raporları</h3>
          <table className="grid">
            <thead><tr><th>Z</th><th>Durum</th><th>Açan</th><th className="r">Nakit</th><th className="r">Kart</th><th className="r">Ciro</th></tr></thead>
            <tbody>
              {veri.gecmis.map((z: any, i: number) => {
                const ciro = Number(z.nakit_satis || 0) + Number(z.kart_satis || 0) + Number(z.yemek_karti_satis || 0) + Number(z.diger_satis || 0)
                return <tr key={i}><td>{z.z_no || '#' + z.id}</td><td>{z.durum === 'acik' ? 'Açık' : 'Kapalı'}</td><td>{z.acan_adi || ''}</td><td className="r">{para0(z.nakit_satis)}</td><td className="r">{para0(z.kart_satis)}</td><td className="r">{para(ciro)}</td></tr>
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function Operasyon({ api, tik, sekme, setSekme, stokFiltre, setStokFiltre, paketDurum, setPaketDurum }: { api: Api; tik: number; sekme: string; setSekme: (s: string) => void; stokFiltre: string; setStokFiltre: (s: string) => void; paketDurum: string; setPaketDurum: (s: string) => void }) {
  const veri = useVeri<any>(() => {
    if (sekme === 'stok') return api('/api/boss/stok')
    if (sekme === 'paket') return api('/api/boss/paket?durum=' + encodeURIComponent(paketDurum))
    if (sekme === 'rez') return api('/api/boss/rezervasyonlar')
    return api('/api/boss/denetim')
  }, [sekme, paketDurum, tik])

  return (
    <>
      <Cipler secenekler={[['stok', 'Stok'], ['paket', 'Paket'], ['rez', 'Rezervasyon'], ['denetim', 'Denetim']]} deger={sekme} onSec={setSekme} />
      {sekme === 'stok' ? (
        <>
          <Cipler secenekler={[['uyari', 'Uyarılar'], ['tukendi', 'Tükendi'], ['kritik', 'Kritik'], ['tumu', 'Tümü']]} deger={stokFiltre} onSec={setStokFiltre} />
          {veri && Array.isArray(veri) ? (
            <div className="card">
              <table className="grid">
                <thead><tr><th>Hammadde</th><th>Durum</th><th className="r">Stok</th><th className="r">Min</th><th>Tedarikçi</th></tr></thead>
                <tbody>
                  {(veri as any[]).filter((s) => stokFiltre === 'tumu' || (stokFiltre === 'uyari' ? s.stok_durumu !== 'normal' : s.stok_durumu === stokFiltre)).map((s, i) => (
                    <tr key={i}><td>{s.hammadde_adi}</td><td>{STOK[s.stok_durumu] || s.stok_durumu}</td><td className="r">{s.mevcut_stok} {s.birim}</td><td className="r">{s.min_stok}</td><td>{s.tedarikci || '—'}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </>
      ) : sekme === 'paket' ? (
        <>
          <Cipler secenekler={[['acik', 'Açık'], ['kapali', 'Kapalı']]} deger={paketDurum} onSec={setPaketDurum} />
          {veri && Array.isArray(veri) ? (
            <div className="card">
              {(veri as any[]).length ? (veri as any[]).map((p, i) => {
                const tip = p.hesap_tipi === 'gel_al' ? 'Gel al' : p.hesap_tipi === 'bar' ? 'Bar' : 'Paket'
                return <Satir key={i} ad={p.teslimat_musteri || p.hesap_no || tip} alt={`${tip} · ${p.teslimat_durumu || p.durum} · ${saatKisa(p.acilis_zamani)}${p.teslimat_telefon ? ' · ' + p.teslimat_telefon : ''}`} tutar={para(p.net_tutar)} />
              }) : <Bos>Kayıt yok</Bos>}
            </div>
          ) : null}
        </>
      ) : sekme === 'rez' ? (
        veri && !Array.isArray(veri) ? (
          <div className="card">
            <h3>Bugün · {veri.tarih || ''}</h3>
            {(veri.liste || []).length ? (veri.liste as any[]).map((r, i) => <Satir key={i} ad={`${r.saat} · ${r.musteri_ad}`} alt={`${r.kisi_sayisi} kişi${r.masa_numara ? ' · Masa ' + r.masa_numara : ''}${r.telefon ? ' · ' + r.telefon : ''} · ${r.durum}`} />) : <Bos>Rezervasyon yok</Bos>}
          </div>
        ) : null
      ) : veri && Array.isArray(veri) ? (
        <div className="card">
          {(veri as any[]).length ? (veri as any[]).map((l, i) => <Satir key={i} ad={l.islem} alt={<>{l.personel_adi || ''} · {saatKisa(l.zaman)}<br />{l.ozet || ''}</>} />) : <Bos>Denetim kaydı yok</Bos>}
        </div>
      ) : null}
    </>
  )
}

function MasaDetay({ api, id }: { api: Api; id: number }) {
  const veri = useVeri<any>(() => api('/api/boss/masa/' + id), [id])
  if (!veri) return <div className="grab" />
  const masa = veri.masa || {}
  const hesap = veri.hesap
  return (
    <>
      <div className="grab" />
      <h2 style={{ fontSize: 20, marginBottom: 4 }}>{masa.bolum_adi || ''} · Masa {masa.numara}</h2>
      {!hesap ? (
        <Bos>Bu masa boş</Bos>
      ) : (
        <>
          <div className="alt" style={{ marginBottom: 12 }}>
            {hesap.hesap_no || ''} · açılış {saatKisa(hesap.acilis_zamani)}{hesap.kisi_sayisi ? ` · ${hesap.kisi_sayisi} kişi` : ''}
          </div>
          {(veri.siparisler || []).map((s: any, i: number) => (
            <Satir
              key={i}
              ad={<>{s.miktar}× {s.urun_adi}{s.ikram ? <span className="tag ikram">İKRAM</span> : null}</>}
              alt={s.notlar || undefined}
              tutar={s.ikram ? '0,00 ₺' : para(s.toplam_fiyat)}
            />
          ))}
          <div className="row" style={{ marginTop: 8 }}>
            <div className="ad">Net</div>
            <div className="amt" style={{ color: 'var(--green)', fontSize: 18 }}>{para(hesap.net_tutar)}</div>
          </div>
          {Number(hesap.indirim_tutar) ? <div className="alt">İndirim {para(hesap.indirim_tutar)}</div> : null}
        </>
      )}
      <p className="alt" style={{ marginTop: 16 }}>Salt izleme. Sipariş ve ödeme POS / garsondadır.</p>
    </>
  )
}

function Saat() {
  const [simdi, setSimdi] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setSimdi(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return <span id="saat">{simdi.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
}

// ===== Giriş =====

function Giris({ onGiris }: { onGiris: (token: string, personel: any) => void }) {
  const [pin, setPin] = useState('')
  const [hata, setHata] = useState('')
  const [kilit, setKilit] = useState(false)

  const gonder = async (deger: string) => {
    setKilit(true)
    try {
      const data = await istek<any>('/api/boss/pin-giris', { govde: { pin_kodu: deger } })
      onGiris(data.token, data.personel)
    } catch (e: any) {
      setHata(e instanceof ApiHatasi ? e.message : 'Bağlantı yok — POS açık mı?')
      setPin('')
    } finally {
      setKilit(false)
    }
  }

  const tus = (k: string) => {
    if (kilit) return
    setHata('')
    if (k === 'C') return setPin('')
    if (k === 'B') return setPin((p) => p.slice(0, -1))
    if (!k || pin.length >= 4) return
    const yeni = pin + k
    setPin(yeni)
    if (yeni.length === 4) void gonder(yeni)
  }

  return (
    <div id="login">
      <div className="login-card">
        <div className="login-kicker">Salt okunur · Yönetici</div>
        <div className="login-title">Patron paneli</div>
        <div className="login-sub">Yalnızca yönetici veya müdür PIN kodu. Çift dokunuş yakınlaştırmaz.</div>
        <div className="pin-dots">
          {[1, 2, 3, 4].map((i) => <div key={i} className={'pin-dot' + (i <= pin.length ? ' on' : '')} />)}
        </div>
        <PinTuslari id="numpad" onTus={tus} />
        <div className="login-err">{hata}</div>
        <div className="login-hint">Bilgisayarda rakam tuşlarıyla da yazabilirsiniz</div>
      </div>
    </div>
  )
}

// ===== Panel =====

function Panel({ token, kullanici, isletme, cikis, toast }: { token: string; kullanici: any; isletme: string; cikis: () => void; toast: (m: string) => void }) {
  const [aktif, setAktif] = useState<Sayfa>('ozet')
  const [tarihMod, setTarihMod] = useState<TarihMod>('bugun')
  const [ozelBas, setOzelBas] = useState(() => yerelTarih(new Date()))
  const [ozelBit, setOzelBit] = useState(() => yerelTarih(new Date()))
  const [tik, setTik] = useState(0)
  const [canli, setCanli] = useState(true)
  const [altBaslik, setAltBaslik] = useState('—')
  const [masaId, setMasaId] = useState<number | null>(null)
  // Sayfa geçişlerinde korunan seçimler
  const [masaBolum, setMasaBolum] = useState('')
  const [sadeceDolu, setSadeceDolu] = useState(false)
  const [raporSekme, setRaporSekme] = useState('urun')
  const [urunArama, setUrunArama] = useState('')
  const [dahaSekme, setDahaSekme] = useState('stok')
  const [stokFiltre, setStokFiltre] = useState('uyari')
  const [paketDurum, setPaketDurum] = useState('acik')

  const aralik = useMemo(() => aralikHesapla(tarihMod, ozelBas, ozelBit), [tarihMod, ozelBas, ozelBit, tik])
  const qs = `?baslangic=${encodeURIComponent(aralik.baslangic)}&bitis=${encodeURIComponent(aralik.bitis)}`

  const api: Api = useCallback(async (yol) => {
    try {
      const v = await istek(yol, { token })
      setCanli(true)
      return v
    } catch (e: any) {
      if (e instanceof ApiHatasi && (e.durum === 401 || e.durum === 403)) {
        cikis()
        toast('Oturum kapandı')
      } else {
        setCanli(false)
        toast('Bağlantı koptu')
      }
      return null
    }
  }, [token, cikis, toast])

  const canliSayfa = aktif === 'ozet' || aktif === 'masalar'
  useEffect(() => {
    const t = setInterval(() => { if (canliSayfa) setTik((n) => n + 1) }, 12000)
    return () => clearInterval(t)
  }, [canliSayfa])
  useCanliOlaylar(token, {
    'masalar:guncellendi': () => { if (canliSayfa) setTik((n) => n + 1) },
    'siparis:guncellendi': () => { if (canliSayfa) setTik((n) => n + 1) },
  })

  const ad = kullanici ? `${kullanici.ad || ''} ${kullanici.soyad || ''}`.trim() : ''

  return (
    <>
      <div id="app" className="on">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-mark">ER</div>
            <div><b>ETİBOL POS</b><span>Patron · v{__APP_VERSION__}</span></div>
          </div>
          <nav className="side-nav">
            {NAV.map((n) => <button key={n.id} type="button" className={n.id === aktif ? 'on' : ''} onClick={() => setAktif(n.id)}>{n.ikon} {n.ad}</button>)}
          </nav>
          <div className="side-foot">
            <div className="who"><b>{ad || 'Yönetici'}</b><span>{ROL[kullanici?.rol] || 'Oturum'}</span></div>
            <button type="button" className="btn-out" onClick={cikis}>Çıkış</button>
          </div>
        </aside>
        <div className="col">
          <header className="top">
            <div className="top-left">
              <h1>{BASLIK[aktif]}</h1>
              <div className="meta"><span className={'live' + (canli ? '' : ' off')} /><span>{altBaslik}</span></div>
            </div>
            <div className="top-tools">
              <div className="seg" role="tablist" aria-label="Dönem">
                {([['bugun', 'Bugün'], ['dun', 'Dün'], ['hafta', 'Hafta'], ['ay', 'Ay'], ['ozel', 'Özel']] as Array<[TarihMod, string]>).map(([id, etiket]) => (
                  <button key={id} type="button" className={tarihMod === id ? 'on' : ''} onClick={() => setTarihMod(id)}>{etiket}</button>
                ))}
              </div>
              <span className="donem-yazi">{donemYazisi(aralik)}</span>
              <Saat />
              <button type="button" className="icon-btn" title="Yenile" onClick={() => setTik((n) => n + 1)}>↻</button>
            </div>
            <div className={'donem-ozel' + (tarihMod === 'ozel' ? ' on' : '')}>
              <div><label>Başlangıç</label><input type="date" value={ozelBas} onChange={(e) => { setOzelBas(e.target.value); setTarihMod('ozel') }} /></div>
              <div><label>Bitiş</label><input type="date" value={ozelBit} onChange={(e) => { setOzelBit(e.target.value); setTarihMod('ozel') }} /></div>
            </div>
          </header>
          <main className="scroll">
            {aktif === 'ozet' && <Ozet api={api} qs={qs} tik={tik} gunluk={aralik.baslangic !== aralik.bitis} isletme={isletme} onCekim={setAltBaslik} onMasa={setMasaId} />}
            {aktif === 'masalar' && <Masalar api={api} tik={tik} bolum={masaBolum} setBolum={setMasaBolum} sadeceDolu={sadeceDolu} setSadeceDolu={setSadeceDolu} onMasa={setMasaId} />}
            {aktif === 'rapor' && <Rapor api={api} qs={qs} sekme={raporSekme} setSekme={setRaporSekme} arama={urunArama} setArama={setUrunArama} />}
            {aktif === 'kasa' && <Kasa api={api} tik={tik} />}
            {aktif === 'daha' && <Operasyon api={api} tik={tik} sekme={dahaSekme} setSekme={setDahaSekme} stokFiltre={stokFiltre} setStokFiltre={setStokFiltre} paketDurum={paketDurum} setPaketDurum={setPaketDurum} />}
          </main>
        </div>
        <nav className="nav">
          {NAV.map((n) => <button key={n.id} type="button" className={n.id === aktif ? 'on' : ''} onClick={() => setAktif(n.id)}>{n.ikon}{n.ad}</button>)}
        </nav>
      </div>

      <div id="drawer" className={masaId !== null ? 'on' : ''}>
        <div className="drawer-bg" onClick={() => setMasaId(null)} />
        <aside className="drawer-panel">{masaId !== null ? <MasaDetay api={api} id={masaId} /> : null}</aside>
      </div>
    </>
  )
}

// ===== Kök =====

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_ANAHTARI) || '')
  const [kullanici, setKullanici] = useState<any>(null)
  const [isletme, setIsletme] = useState('ETİBOL POS')
  const [dogrulandi, setDogrulandi] = useState(false)
  const [toastMetni, setToastMetni] = useState('')
  const [toastAcik, setToastAcik] = useState(false)

  const toast = useCallback((m: string) => {
    setToastMetni(m)
    setToastAcik(true)
    window.setTimeout(() => setToastAcik(false), 2200)
  }, [])

  const cikis = useCallback(() => {
    localStorage.removeItem(TOKEN_ANAHTARI)
    setToken('')
    setKullanici(null)
    setDogrulandi(false)
  }, [])

  // Kayıtlı token varsa oturumu doğrula
  useEffect(() => {
    if (!token || dogrulandi) return
    istek<any>('/api/boss/ben', { token })
      .then((ben) => {
        setKullanici(ben.personel)
        if (ben.isletme_adi) setIsletme(ben.isletme_adi)
        setDogrulandi(true)
      })
      .catch((e) => {
        if (e instanceof ApiHatasi && (e.durum === 401 || e.durum === 403)) cikis()
      })
  }, [token, dogrulandi, cikis])

  const girisYap = (yeniToken: string, personel: any) => {
    localStorage.setItem(TOKEN_ANAHTARI, yeniToken)
    setToken(yeniToken)
    setKullanici(personel)
    setDogrulandi(false)
  }

  return (
    <>
      {token && dogrulandi ? (
        <Panel token={token} kullanici={kullanici} isletme={isletme} cikis={cikis} toast={toast} />
      ) : (
        <Giris onGiris={girisYap} />
      )}
      <div className={'toast' + (toastAcik ? ' on' : '')}>{toastMetni}</div>
    </>
  )
}
