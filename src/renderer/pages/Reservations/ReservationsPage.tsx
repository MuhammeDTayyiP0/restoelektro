import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Plus, RefreshCw, Phone, Users, Trash2 } from 'lucide-react'
import { clsx } from 'clsx'
import { ipcInvoke } from '../../hooks/useIPC'
import { REZERVASYON_KANALLARI, MASA_KANALLARI } from '../../../common/ipc-channels'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { useToast } from '../../components/ui/Toast'
import { useAuthStore } from '../../stores/useAuthStore'

function bugunStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function ReservationsPage() {
  const navigate = useNavigate()
  const { personel } = useAuthStore()
  const { success, error } = useToast()
  const [tarih, setTarih] = useState(bugunStr())
  const [liste, setListe] = useState<any[]>([])
  const [masalar, setMasalar] = useState<any[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ musteri_ad: '', telefon: '', kisi_sayisi: '2', saat: '19:00', masa_id: '', notlar: '' })

  const yukle = useCallback(async () => {
    setYukleniyor(true)
    try {
      const veri = await ipcInvoke<any[]>(REZERVASYON_KANALLARI.LISTELE, { tarih })
      setListe(Array.isArray(veri) ? veri : [])
      const m = await ipcInvoke<any[]>(MASA_KANALLARI.MASALAR)
      setMasalar(Array.isArray(m) ? m : [])
    } catch (err: any) {
      error('Hata', err.message)
    } finally {
      setYukleniyor(false)
    }
  }, [tarih, error])

  useEffect(() => { yukle() }, [yukle])

  const kaydet = async () => {
    if (!form.musteri_ad.trim()) {
      error('Eksik', 'Misafir adı gerekli')
      return
    }
    try {
      const res = await ipcInvoke<any>(REZERVASYON_KANALLARI.EKLE, {
        ...form,
        kisi_sayisi: Number(form.kisi_sayisi || 2),
        masa_id: form.masa_id ? Number(form.masa_id) : null,
        tarih,
        personel_id: personel?.id,
      })
      if (!res?.basarili) throw new Error(res?.hata)
      success('Kaydedildi', form.musteri_ad)
      setModal(false)
      setForm({ musteri_ad: '', telefon: '', kisi_sayisi: '2', saat: '19:00', masa_id: '', notlar: '' })
      yukle()
    } catch (err: any) {
      error('Hata', err.message)
    }
  }

  const durum = async (id: number, d: string, masaId?: number) => {
    try {
      const res = await ipcInvoke<any>(REZERVASYON_KANALLARI.DURUM, id, d, personel?.id)
      if (!res?.basarili) throw new Error(res?.hata)
      if (d === 'geldi' && masaId) {
        navigate(`/pos?masa=${masaId}`)
        return
      }
      yukle()
    } catch (err: any) {
      error('Hata', err.message)
    }
  }

  const sil = async (id: number) => {
    if (!window.confirm('Rezervasyon silinsin mi?')) return
    await ipcInvoke(REZERVASYON_KANALLARI.SIL, id, personel?.id)
    yukle()
  }

  const ozet = useMemo(() => ({
    bekliyor: liste.filter((r) => r.durum === 'bekliyor').length,
    kisi: liste.filter((r) => r.durum !== 'iptal').reduce((a, r) => a + Number(r.kisi_sayisi || 0), 0),
  }), [liste])

  return (
    <div className="flex flex-col h-full w-full bg-[#0B0A08] text-surface-100 overflow-hidden">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#322C26] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#1e1a16] border border-brand-500/30 flex items-center justify-center text-brand-400">
            <CalendarDays size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Rezervasyon Defteri</h1>
            <p className="text-xs text-surface-400 font-mono">{ozet.bekliyor} bekleyen · {ozet.kisi} kişi</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={tarih}
            onChange={(e) => setTarih(e.target.value)}
            className="h-10 px-3 rounded-xl bg-[#171410] border border-[#322C26] text-sm font-mono"
          />
          <button onClick={yukle} className="p-2.5 rounded-xl bg-[#1e1a16] border border-[#322C26] text-surface-400 hover:text-white">
            <RefreshCw size={16} className={yukleniyor ? 'animate-spin' : ''} />
          </button>
          <Button leftIcon={<Plus size={16} />} onClick={() => setModal(true)}>Yeni rezervasyon</Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pos-scrollbar">
        {liste.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-surface-500 border border-dashed border-[#322C26] rounded-2xl">
            Bu tarihte rezervasyon yok
          </div>
        ) : (
          <div className="space-y-2">
            {liste.map((r) => (
              <div key={r.id} className="bg-[#171410] border border-[#322C26] rounded-xl p-3.5 flex flex-wrap items-center gap-3">
                <div className="w-16 text-center font-mono text-lg font-bold text-brand-300">{r.saat}</div>
                <div className="flex-1 min-w-[180px]">
                  <div className="font-semibold text-white">{r.musteri_ad}</div>
                  <div className="text-xs text-surface-400 flex items-center gap-3 mt-0.5">
                    {r.telefon && <span className="flex items-center gap-1"><Phone size={11} />{r.telefon}</span>}
                    <span className="flex items-center gap-1"><Users size={11} />{r.kisi_sayisi}</span>
                    {r.masa_numara && <span>Masa {r.masa_numara}</span>}
                    {r.notlar && <span className="truncate max-w-[200px]">{r.notlar}</span>}
                  </div>
                </div>
                <span className={clsx(
                  'text-[10px] font-mono uppercase px-2 py-0.5 rounded border',
                  r.durum === 'bekliyor' && 'text-amber-300 border-amber-700/50',
                  r.durum === 'geldi' && 'text-emerald-300 border-emerald-700/50',
                  r.durum === 'iptal' && 'text-rose-300 border-rose-700/50',
                  r.durum === 'no_show' && 'text-surface-400 border-[#322C26]'
                )}>{r.durum}</span>
                {r.durum === 'bekliyor' && (
                  <div className="flex items-center gap-1.5">
                    <Button size="sm" variant="success" onClick={() => durum(r.id, 'geldi', r.masa_id)}>Geldi</Button>
                    <Button size="sm" variant="ghost" onClick={() => durum(r.id, 'no_show')}>Gelmedi</Button>
                    <Button size="sm" variant="ghost" onClick={() => durum(r.id, 'iptal')}>İptal</Button>
                  </div>
                )}
                <button onClick={() => sil(r.id)} className="p-1.5 text-surface-500 hover:text-rose-400"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Yeni rezervasyon">
        <div className="space-y-3">
          <input placeholder="Misafir adı" value={form.musteri_ad} onChange={(e) => setForm({ ...form, musteri_ad: e.target.value })}
            className="w-full h-11 px-3 rounded-xl bg-[#0B0A08] border border-[#322C26] text-white" />
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Telefon" value={form.telefon} onChange={(e) => setForm({ ...form, telefon: e.target.value })}
              className="h-11 px-3 rounded-xl bg-[#0B0A08] border border-[#322C26] text-white" />
            <input type="number" placeholder="Kişi" value={form.kisi_sayisi} onChange={(e) => setForm({ ...form, kisi_sayisi: e.target.value })}
              className="h-11 px-3 rounded-xl bg-[#0B0A08] border border-[#322C26] text-white font-mono" />
            <input type="time" value={form.saat} onChange={(e) => setForm({ ...form, saat: e.target.value })}
              className="h-11 px-3 rounded-xl bg-[#0B0A08] border border-[#322C26] text-white font-mono" />
            <select value={form.masa_id} onChange={(e) => setForm({ ...form, masa_id: e.target.value })}
              className="h-11 px-3 rounded-xl bg-[#0B0A08] border border-[#322C26] text-white">
              <option value="">Masa (opsiyonel)</option>
              {masalar.map((m) => (
                <option key={m.id} value={m.id}>{m.bolum_adi} / {m.numara}</option>
              ))}
            </select>
          </div>
          <input placeholder="Not" value={form.notlar} onChange={(e) => setForm({ ...form, notlar: e.target.value })}
            className="w-full h-11 px-3 rounded-xl bg-[#0B0A08] border border-[#322C26] text-white" />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModal(false)}>Vazgeç</Button>
            <Button onClick={kaydet}>Kaydet</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
