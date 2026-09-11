import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bike, ShoppingBag, Phone, Plus, RefreshCw, MapPin } from 'lucide-react'
import { clsx } from 'clsx'
import { ipcInvoke } from '../../hooks/useIPC'
import { HESAP_KANALLARI } from '../../../common/ipc-channels'
import { Button } from '../../components/ui/Button'
import { formatPara } from '../../utils/formatters'
import { useToast } from '../../components/ui/Toast'

const DURUMLAR = [
  { id: 'bekliyor', label: 'Bekliyor' },
  { id: 'hazirlaniyor', label: 'Hazırlanıyor' },
  { id: 'yolda', label: 'Yolda' },
  { id: 'teslim', label: 'Teslim' },
]

export default function DeliveryPage() {
  const navigate = useNavigate()
  const { success, error } = useToast()
  const [liste, setListe] = useState<any[]>([])
  const [sekme, setSekme] = useState<'acik' | 'kapali'>('acik')
  const [tip, setTip] = useState<'tumu' | 'paket' | 'gel_al'>('tumu')
  const [yukleniyor, setYukleniyor] = useState(true)

  const yukle = useCallback(async () => {
    setYukleniyor(true)
    try {
      const veri = await ipcInvoke<any[]>(HESAP_KANALLARI.PAKET_LISTELE, {
        durum: sekme,
        hesap_tipi: tip,
      })
      setListe(Array.isArray(veri) ? veri : [])
    } catch (err: any) {
      error('Hata', err.message)
    } finally {
      setYukleniyor(false)
    }
  }, [sekme, tip, error])

  useEffect(() => { yukle() }, [yukle])

  const durumDegistir = async (id: number, teslimat_durumu: string) => {
    try {
      const res = await ipcInvoke<any>(HESAP_KANALLARI.TESLIMAT_GUNCELLE, id, { teslimat_durumu })
      if (!res?.basarili) throw new Error(res?.hata)
      success('Güncellendi', teslimat_durumu)
      yukle()
    } catch (err: any) {
      error('Hata', err.message)
    }
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#0B0A08] text-surface-100 overflow-hidden">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#322C26] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#1e1a16] border border-brand-500/30 flex items-center justify-center text-brand-400">
            <Bike size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Paket / Gel-Al</h1>
            <p className="text-xs text-surface-400 font-mono">Telefon siparişi, paket servis ve gel-al hesapları</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={yukle} className="p-2.5 rounded-xl bg-[#1e1a16] border border-[#322C26] text-surface-400 hover:text-white">
            <RefreshCw size={16} className={yukleniyor ? 'animate-spin' : ''} />
          </button>
          <Button variant="secondary" leftIcon={<ShoppingBag size={16} />} onClick={() => navigate('/pos?tip=gel_al')}>
            Gel-Al
          </Button>
          <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => navigate('/pos?tip=paket')}>
            Yeni Paket
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3 shrink-0">
        {(['acik', 'kapali'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSekme(s)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-semibold border',
              sekme === s ? 'bg-brand-600 text-white border-brand-400/40' : 'bg-[#171410] text-surface-400 border-[#322C26]'
            )}
          >
            {s === 'acik' ? 'Açık' : 'Geçmiş'}
          </button>
        ))}
        <div className="w-px h-6 bg-[#322C26]" />
        {(['tumu', 'paket', 'gel_al'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTip(t)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-semibold border',
              tip === t ? 'bg-[#241F1A] text-white border-brand-500/40' : 'bg-[#171410] text-surface-400 border-[#322C26]'
            )}
          >
            {t === 'tumu' ? 'Tümü' : t === 'paket' ? 'Paket' : 'Gel-Al'}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pos-scrollbar">
        {liste.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-surface-500 border border-dashed border-[#322C26] rounded-2xl">
            <Phone size={28} className="mb-2" />
            Kayıt yok
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
            {liste.map((h) => (
              <div key={h.id} className="bg-[#171410] border border-[#322C26] rounded-2xl p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-mono text-xs text-surface-400">{h.hesap_no}</div>
                    <div className="font-semibold text-white">
                      {h.teslimat_musteri || h.musteri_adi || (h.hesap_tipi === 'paket' ? 'Paket sipariş' : 'Gel-Al')}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#1e1a16] border border-[#322C26]">
                    {h.hesap_tipi}
                  </span>
                </div>
                {(h.teslimat_telefon || h.teslimat_adres) && (
                  <div className="text-xs text-surface-400 space-y-0.5">
                    {h.teslimat_telefon && <div className="flex items-center gap-1"><Phone size={12} /> {h.teslimat_telefon}</div>}
                    {h.teslimat_adres && <div className="flex items-center gap-1"><MapPin size={12} /> {h.teslimat_adres}</div>}
                  </div>
                )}
                <div className="flex justify-between items-center font-mono text-sm">
                  <span className="text-surface-400">{h.siparis_sayisi || 0} ürün</span>
                  <span className="text-emerald-300">{formatPara(h.net_tutar || h.toplam_tutar || 0)}</span>
                </div>
                {h.durum === 'acik' && (
                  <div className="flex flex-wrap gap-1">
                    {DURUMLAR.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => durumDegistir(h.id, d.id)}
                        className={clsx(
                          'px-2 py-1 rounded-md text-[10px] font-bold uppercase border',
                          h.teslimat_durumu === d.id
                            ? 'bg-brand-600 text-white border-brand-400/40'
                            : 'bg-[#0B0A08] text-surface-400 border-[#322C26]'
                        )}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                )}
                <Button size="sm" variant="outline" onClick={() => navigate(`/pos/${h.id}`)}>
                  Adisyonu aç
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
