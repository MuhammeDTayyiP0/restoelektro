import React, { useCallback, useEffect, useState } from 'react'
import { Plus, Truck, FileText } from 'lucide-react'
import { ipcInvoke } from '../../hooks/useIPC'
import { STOK_KANALLARI } from '../../../common/ipc-channels'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { formatPara, formatTarih } from '../../utils/formatters'
import { useToast } from '../../components/ui/Toast'
import { useAuthStore } from '../../stores/useAuthStore'

export default function SatinalmaPanel() {
  const { personel } = useAuthStore()
  const { success, error } = useToast()
  const [tedarikciler, setTedarikciler] = useState<any[]>([])
  const [faturalar, setFaturalar] = useState<any[]>([])
  const [hammaddeler, setHammaddeler] = useState<any[]>([])
  const [tedarikciModal, setTedarikciModal] = useState(false)
  const [faturaModal, setFaturaModal] = useState(false)
  const [tForm, setTForm] = useState({ ad: '', telefon: '', yetkili: '', vergi_no: '', adres: '' })
  const [fForm, setFForm] = useState({ tedarikci_id: '', fatura_no: '', notlar: '' })
  const [kalemler, setKalemler] = useState([{ hammadde_id: '', miktar: '', birim_maliyet: '' }])

  const yukle = useCallback(async () => {
    try {
      const [t, a, h] = await Promise.all([
        ipcInvoke<any[]>(STOK_KANALLARI.TEDARIKCI_LISTELE),
        ipcInvoke<any[]>(STOK_KANALLARI.ALIS_LISTELE, 80),
        ipcInvoke<any[]>(STOK_KANALLARI.HAMMADDELER),
      ])
      setTedarikciler(Array.isArray(t) ? t : [])
      setFaturalar(Array.isArray(a) ? a : [])
      setHammaddeler(Array.isArray(h) ? h : [])
    } catch (err: any) {
      error('Hata', err.message)
    }
  }, [error])

  useEffect(() => { yukle() }, [yukle])

  const tedarikciKaydet = async () => {
    const res = await ipcInvoke<any>(STOK_KANALLARI.TEDARIKCI_EKLE, tForm)
    if (!res?.basarili) return error('Hata', res?.hata)
    success('Tedarikçi eklendi', tForm.ad)
    setTedarikciModal(false)
    setTForm({ ad: '', telefon: '', yetkili: '', vergi_no: '', adres: '' })
    yukle()
  }

  const faturaKaydet = async () => {
    const res = await ipcInvoke<any>(STOK_KANALLARI.ALIS_KAYDET, {
      tedarikci_id: fForm.tedarikci_id ? Number(fForm.tedarikci_id) : null,
      fatura_no: fForm.fatura_no,
      notlar: fForm.notlar,
      personel_id: personel?.id,
      kalemler: kalemler.map((k) => ({
        hammadde_id: Number(k.hammadde_id),
        miktar: Number(k.miktar),
        birim_maliyet: Number(k.birim_maliyet),
      })),
    })
    if (!res?.basarili) return error('Hata', res?.hata)
    success('Alış kaydedildi', 'Stok güncellendi')
    setFaturaModal(false)
    setKalemler([{ hammadde_id: '', miktar: '', birim_maliyet: '' }])
    yukle()
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-surface-400 font-mono">Tedarikçi, alış faturası, stok girişi</p>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" leftIcon={<Truck size={14} />} onClick={() => setTedarikciModal(true)}>Tedarikçi</Button>
          <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setFaturaModal(true)}>Alış faturası</Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-3">
        <div className="lg:col-span-1 bg-[#171410] border border-[#322C26] rounded-2xl p-3 max-h-72 overflow-y-auto pos-scrollbar">
          <h3 className="text-xs font-mono uppercase text-surface-400 mb-2">Tedarikçiler</h3>
          {tedarikciler.length === 0 && <p className="text-sm text-surface-500">Kayıt yok</p>}
          {tedarikciler.map((t) => (
            <div key={t.id} className="py-2 border-b border-[#322C26] last:border-0">
              <div className="font-semibold text-sm">{t.ad}</div>
              <div className="text-[11px] text-surface-400">{t.telefon || '—'} {t.yetkili ? `· ${t.yetkili}` : ''}</div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-2 bg-[#171410] border border-[#322C26] rounded-2xl p-3 overflow-auto pos-scrollbar max-h-[28rem]">
          <h3 className="text-xs font-mono uppercase text-surface-400 mb-2">Alış faturaları</h3>
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] font-mono uppercase text-surface-400">
              <tr>
                <th className="py-2">Tarih</th>
                <th>Tedarikçi</th>
                <th>Fatura</th>
                <th>Tutar</th>
              </tr>
            </thead>
            <tbody>
              {faturalar.map((f) => (
                <tr key={f.id} className="border-t border-[#322C26]">
                  <td className="py-2 font-mono text-xs">{formatTarih(f.tarih)}</td>
                  <td>{f.tedarikci_adi || '—'}</td>
                  <td className="font-mono">{f.fatura_no || `#${f.id}`}</td>
                  <td className="font-mono text-emerald-300">{formatPara(f.toplam || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={tedarikciModal} onClose={() => setTedarikciModal(false)} title="Yeni tedarikçi">
        <div className="space-y-2">
          {['ad', 'telefon', 'yetkili', 'vergi_no', 'adres'].map((k) => (
            <input
              key={k}
              placeholder={k}
              value={(tForm as any)[k]}
              onChange={(e) => setTForm({ ...tForm, [k]: e.target.value })}
              className="w-full h-10 px-3 rounded-xl bg-[#0B0A08] border border-[#322C26] text-white"
            />
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setTedarikciModal(false)}>İptal</Button>
            <Button onClick={tedarikciKaydet}>Kaydet</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={faturaModal} onClose={() => setFaturaModal(false)} title="Alış faturası" size="lg">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <select value={fForm.tedarikci_id} onChange={(e) => setFForm({ ...fForm, tedarikci_id: e.target.value })}
              className="h-10 px-3 rounded-xl bg-[#0B0A08] border border-[#322C26] text-white">
              <option value="">Tedarikçi</option>
              {tedarikciler.map((t) => <option key={t.id} value={t.id}>{t.ad}</option>)}
            </select>
            <input placeholder="Fatura no" value={fForm.fatura_no} onChange={(e) => setFForm({ ...fForm, fatura_no: e.target.value })}
              className="h-10 px-3 rounded-xl bg-[#0B0A08] border border-[#322C26] text-white" />
          </div>
          {kalemler.map((k, i) => (
            <div key={i} className="grid grid-cols-3 gap-2">
              <select value={k.hammadde_id} onChange={(e) => {
                const n = [...kalemler]; n[i] = { ...n[i], hammadde_id: e.target.value }; setKalemler(n)
              }} className="h-10 px-2 rounded-xl bg-[#0B0A08] border border-[#322C26] text-white text-sm">
                <option value="">Hammadde</option>
                {hammaddeler.map((h) => <option key={h.id} value={h.id}>{h.ad}</option>)}
              </select>
              <input placeholder="Miktar" value={k.miktar} onChange={(e) => {
                const n = [...kalemler]; n[i] = { ...n[i], miktar: e.target.value }; setKalemler(n)
              }} className="h-10 px-2 rounded-xl bg-[#0B0A08] border border-[#322C26] font-mono" />
              <input placeholder="Birim maliyet" value={k.birim_maliyet} onChange={(e) => {
                const n = [...kalemler]; n[i] = { ...n[i], birim_maliyet: e.target.value }; setKalemler(n)
              }} className="h-10 px-2 rounded-xl bg-[#0B0A08] border border-[#322C26] font-mono" />
            </div>
          ))}
          <Button size="sm" variant="ghost" leftIcon={<Plus size={14} />} onClick={() => setKalemler([...kalemler, { hammadde_id: '', miktar: '', birim_maliyet: '' }])}>
            Kalem ekle
          </Button>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setFaturaModal(false)}>İptal</Button>
            <Button leftIcon={<FileText size={14} />} onClick={faturaKaydet}>Stoka işle</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
