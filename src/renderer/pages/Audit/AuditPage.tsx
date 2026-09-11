import React, { useCallback, useEffect, useState } from 'react'
import { Shield, RefreshCw, Search } from 'lucide-react'
import { ipcInvoke } from '../../hooks/useIPC'
import { DENETIM_KANALLARI, PERSONEL_KANALLARI } from '../../../common/ipc-channels'
import { formatTarih } from '../../utils/formatters'

const ISLEMLER = [
  'tumu', 'giris', 'pin_giris', 'siparis_iptal', 'ikram', 'ikram_kaldir',
  'indirim', 'odeme', 'odeme_kapat', 'hesap_iptal', 'kasa_ac', 'kasa_kapat', 'kasa_gider',
]

export default function AuditPage() {
  const [liste, setListe] = useState<any[]>([])
  const [personeller, setPersoneller] = useState<any[]>([])
  const [islem, setIslem] = useState('tumu')
  const [personelId, setPersonelId] = useState('')
  const [arama, setArama] = useState('')
  const [yukleniyor, setYukleniyor] = useState(true)

  const yukle = useCallback(async () => {
    setYukleniyor(true)
    try {
      const veri = await ipcInvoke<any[]>(DENETIM_KANALLARI.LISTELE, {
        islem,
        personel_id: personelId ? Number(personelId) : undefined,
        arama: arama || undefined,
        limit: 300,
      })
      setListe(Array.isArray(veri) ? veri : [])
    } finally {
      setYukleniyor(false)
    }
  }, [islem, personelId, arama])

  useEffect(() => {
    yukle()
  }, [yukle])

  useEffect(() => {
    ipcInvoke<any[]>(PERSONEL_KANALLARI.LISTELE).then((p) => setPersoneller(Array.isArray(p) ? p : [])).catch(() => {})
  }, [])

  return (
    <div className="flex flex-col h-full w-full bg-[#0B0A08] text-surface-100 overflow-hidden">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#322C26] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#1e1a16] border border-brand-500/30 flex items-center justify-center text-brand-400">
            <Shield size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Denetim İzi</h1>
            <p className="text-xs text-surface-400 font-mono">İptal, ikram, indirim, ödeme ve giriş kayıtları</p>
          </div>
        </div>
        <button onClick={yukle} className="p-2.5 rounded-xl bg-[#1e1a16] border border-[#322C26] text-surface-400 hover:text-white">
          <RefreshCw size={16} className={yukleniyor ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3 shrink-0">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
          <input
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            placeholder="Ara…"
            className="h-10 pl-8 pr-3 w-52 rounded-xl bg-[#171410] border border-[#322C26] text-sm"
          />
        </div>
        <select value={islem} onChange={(e) => setIslem(e.target.value)} className="h-10 px-3 rounded-xl bg-[#171410] border border-[#322C26] text-sm">
          {ISLEMLER.map((i) => <option key={i} value={i}>{i}</option>)}
        </select>
        <select value={personelId} onChange={(e) => setPersonelId(e.target.value)} className="h-10 px-3 rounded-xl bg-[#171410] border border-[#322C26] text-sm">
          <option value="">Tüm personel</option>
          {personeller.map((p) => (
            <option key={p.id} value={p.id}>{p.ad} {p.soyad}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 min-h-0 overflow-auto pos-scrollbar bg-[#171410] border border-[#322C26] rounded-2xl">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-[#110F0C] text-[10px] font-mono uppercase text-surface-400">
            <tr>
              <th className="py-2.5 px-3">Zaman</th>
              <th>Personel</th>
              <th>İşlem</th>
              <th>Özet</th>
            </tr>
          </thead>
          <tbody>
            {liste.map((k) => (
              <tr key={k.id} className="border-t border-[#322C26]">
                <td className="py-2 px-3 font-mono text-xs text-surface-400 whitespace-nowrap">{formatTarih(k.zaman)}</td>
                <td>{k.personel_adi || '—'}</td>
                <td className="font-mono text-xs text-brand-300">{k.islem}</td>
                <td className="text-surface-300">{k.ozet}</td>
              </tr>
            ))}
            {liste.length === 0 && (
              <tr><td colSpan={4} className="py-10 text-center text-surface-500">Kayıt yok</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
