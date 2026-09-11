import React, { useCallback, useEffect, useState } from 'react'
import { Banknote, Lock, Unlock, Plus, Printer, RefreshCw, History } from 'lucide-react'
import { clsx } from 'clsx'
import { ipcInvoke } from '../../hooks/useIPC'
import { KASA_KANALLARI, AYAR_KANALLARI } from '../../../common/ipc-channels'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { formatPara } from '../../utils/formatters'
import { useToast } from '../../components/ui/Toast'
import { useAuthStore } from '../../stores/useAuthStore'
import { yazdirZRaporu } from '../../utils/print.utils'

export default function CashClosePage() {
  const { personel } = useAuthStore()
  const { success, error, info } = useToast()
  const [ozet, setOzet] = useState<any>(null)
  const [gecmis, setGecmis] = useState<any[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [acilisNakit, setAcilisNakit] = useState('0')
  const [sayim, setSayim] = useState('')
  const [giderAcik, setGiderAcik] = useState(false)
  const [giderTutar, setGiderTutar] = useState('')
  const [giderAciklama, setGiderAciklama] = useState('')
  const [kapanisNot, setKapanisNot] = useState('')
  const [islemde, setIslemde] = useState(false)

  const yukle = useCallback(async () => {
    setYukleniyor(true)
    try {
      const v = await ipcInvoke<any>(KASA_KANALLARI.VARDIYA_ACIK)
      setOzet(v)
      if (v) setSayim(String(v.beklenen_nakit ?? ''))
      const g = await ipcInvoke<any[]>(KASA_KANALLARI.VARDIYA_GECMIS, 20)
      setGecmis(Array.isArray(g) ? g : [])
    } catch (err: any) {
      error('Hata', err.message)
    } finally {
      setYukleniyor(false)
    }
  }, [error])

  useEffect(() => { yukle() }, [yukle])

  const kasaAc = async () => {
    setIslemde(true)
    try {
      const res = await ipcInvoke<any>(KASA_KANALLARI.VARDIYA_AC, {
        personel_id: personel?.id,
        acilis_nakit: Number(acilisNakit || 0),
      })
      if (!res?.basarili) throw new Error(res?.hata || 'Açılamadı')
      success('Kasa açıldı', res.vardiya?.z_no)
      await yukle()
    } catch (err: any) {
      error('Hata', err.message)
    } finally {
      setIslemde(false)
    }
  }

  const giderEkle = async () => {
    setIslemde(true)
    try {
      const res = await ipcInvoke<any>(KASA_KANALLARI.GIDER_EKLE, {
        personel_id: personel?.id,
        tutar: Number(giderTutar || 0),
        aciklama: giderAciklama,
      })
      if (!res?.basarili) throw new Error(res?.hata || 'Gider eklenemedi')
      success('Gider kaydedildi', giderAciklama)
      setGiderAcik(false)
      setGiderTutar('')
      setGiderAciklama('')
      await yukle()
    } catch (err: any) {
      error('Hata', err.message)
    } finally {
      setIslemde(false)
    }
  }

  const kasaKapat = async () => {
    if (!window.confirm('Vardiyayı kapatıp Z raporu almak istiyor musunuz? Bu işlem geri alınamaz.')) return
    setIslemde(true)
    try {
      const res = await ipcInvoke<any>(KASA_KANALLARI.VARDIYA_KAPAT, {
        personel_id: personel?.id,
        kapanis_nakit_sayim: Number(sayim || 0),
        notlar: kapanisNot,
      })
      if (!res?.basarili) throw new Error(res?.hata || 'Kapatılamadı')
      success('Z raporu', res.vardiya?.z_no + ' kapatıldı')
      try {
        const yazici = await ipcInvoke<string>(AYAR_KANALLARI.GETIR, 'kasa_yazici')
        if (yazici) await yazdirZRaporu(res.vardiya, yazici)
        else info('Yazıcı yok', 'Kasa yazıcısı ayarlı değil — ekrandan kontrol edin.')
      } catch (e) {
        console.error(e)
      }
      await yukle()
    } catch (err: any) {
      error('Hata', err.message)
    } finally {
      setIslemde(false)
    }
  }

  const yazdir = async (v: any) => {
    try {
      const yazici = await ipcInvoke<string>(AYAR_KANALLARI.GETIR, 'kasa_yazici')
      if (!yazici) {
        error('Yazıcı yok', 'Ayarlar → kasa yazıcısı seçin')
        return
      }
      await yazdirZRaporu(v, yazici)
      success('Yazdırıldı', v.z_no)
    } catch (err: any) {
      error('Yazdırma', err.message)
    }
  }

  const Kart = ({ label, value, accent }: { label: string; value: string; accent?: string }) => (
    <div className="bg-[#171410] border border-[#322C26] rounded-xl p-3.5">
      <div className="text-[10px] font-mono uppercase text-surface-400 tracking-wider">{label}</div>
      <div className={clsx('text-lg font-bold font-mono mt-1', accent || 'text-white')}>{value}</div>
    </div>
  )

  return (
    <div className="flex flex-col h-full w-full bg-[#0B0A08] text-surface-100 overflow-hidden">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#322C26] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#1e1a16] border border-brand-500/30 flex items-center justify-center text-brand-400">
            <Banknote size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Gün Sonu / Kasa Kapanış</h1>
            <p className="text-xs text-surface-400 font-mono">Z raporu, nakit sayım ve vardiya giderleri</p>
          </div>
        </div>
        <button onClick={yukle} className="p-2.5 rounded-xl bg-[#1e1a16] border border-[#322C26] text-surface-400 hover:text-white">
          <RefreshCw size={16} className={yukleniyor ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pos-scrollbar space-y-4">
        {!ozet ? (
          <div className="bg-[#171410] border border-[#322C26] rounded-2xl p-6 max-w-lg">
            <div className="flex items-center gap-2 text-amber-300 mb-3">
              <Unlock size={18} />
              <span className="font-semibold">Kasa kapalı</span>
            </div>
            <p className="text-sm text-surface-400 mb-4">Vardiya açmadan satışlar Z raporuna bağlanmaz. Açılış nakitini girin.</p>
            <label className="text-[11px] font-mono text-surface-400 uppercase">Açılış nakit (çekmece)</label>
            <input
              type="number"
              value={acilisNakit}
              onChange={(e) => setAcilisNakit(e.target.value)}
              className="mt-1 w-full h-11 px-3 rounded-xl bg-[#0B0A08] border border-[#322C26] text-white font-mono"
            />
            <Button className="mt-4" variant="success" leftIcon={<Unlock size={16} />} isLoading={islemde} onClick={kasaAc}>
              Vardiyayı Aç
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 text-emerald-300 text-sm font-mono">
              <Lock size={14} /> {ozet.z_no} — açılış {ozet.acilis_zamani}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Kart label="Toplam ciro" value={formatPara(ozet.toplam_ciro || 0)} accent="text-emerald-300" />
              <Kart label="Nakit satış" value={formatPara(ozet.nakit_satis || 0)} />
              <Kart label="Kart" value={formatPara(ozet.kart_satis || 0)} />
              <Kart label="Yemek kartı" value={formatPara(ozet.yemek_karti_satis || 0)} />
              <Kart label="Diğer" value={formatPara(ozet.diger_satis || 0)} />
              <Kart label="Gider" value={formatPara(ozet.gider || 0)} accent="text-rose-300" />
              <Kart label="İptal" value={formatPara(ozet.iptal_tutar || 0)} accent="text-rose-300" />
              <Kart label="İkram / İndirim" value={`${formatPara(ozet.ikram_tutar || 0)} / ${formatPara(ozet.indirim_tutar || 0)}`} />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-[#171410] border border-[#322C26] rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold">Nakit sayım</h2>
                  <Button size="sm" variant="outline" leftIcon={<Plus size={14} />} onClick={() => setGiderAcik(true)}>Gider</Button>
                </div>
                <div className="text-xs text-surface-400 font-mono space-y-1 mb-3">
                  <div className="flex justify-between"><span>Açılış nakit</span><span>{formatPara(ozet.acilis_nakit || 0)}</span></div>
                  <div className="flex justify-between"><span>+ Nakit satış</span><span>{formatPara(ozet.nakit_satis || 0)}</span></div>
                  <div className="flex justify-between"><span>− Gider</span><span>{formatPara(ozet.gider || 0)}</span></div>
                  <div className="flex justify-between text-white font-bold border-t border-[#322C26] pt-1"><span>Beklenen</span><span>{formatPara(ozet.beklenen_nakit || 0)}</span></div>
                </div>
                <label className="text-[11px] font-mono text-surface-400 uppercase">Çekmece sayımı</label>
                <input
                  type="number"
                  value={sayim}
                  onChange={(e) => setSayim(e.target.value)}
                  className="mt-1 w-full h-11 px-3 rounded-xl bg-[#0B0A08] border border-[#322C26] text-white font-mono"
                />
                {sayim !== '' && (
                  <div className={clsx('mt-2 text-sm font-mono', Number(sayim) - Number(ozet.beklenen_nakit || 0) === 0 ? 'text-emerald-300' : 'text-amber-300')}>
                    Fark: {formatPara(Number(sayim) - Number(ozet.beklenen_nakit || 0))}
                  </div>
                )}
                <textarea
                  value={kapanisNot}
                  onChange={(e) => setKapanisNot(e.target.value)}
                  placeholder="Kapanış notu"
                  className="mt-3 w-full h-20 px-3 py-2 rounded-xl bg-[#0B0A08] border border-[#322C26] text-sm"
                />
                <Button className="mt-3 w-full" variant="danger" leftIcon={<Lock size={16} />} isLoading={islemde} onClick={kasaKapat}>
                  Vardiyayı Kapat (Z)
                </Button>
              </div>

              <div className="bg-[#171410] border border-[#322C26] rounded-2xl p-4">
                <h2 className="font-semibold mb-3">Bu vardiya giderleri</h2>
                {(ozet.giderler || []).length === 0 ? (
                  <p className="text-sm text-surface-500">Gider yok</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pos-scrollbar">
                    {ozet.giderler.map((g: any) => (
                      <div key={g.id} className="flex justify-between text-sm border-b border-[#322C26] pb-1.5">
                        <span className="text-surface-300">{g.aciklama}</span>
                        <span className="font-mono text-rose-300">{formatPara(g.tutar)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        <div className="bg-[#171410] border border-[#322C26] rounded-2xl p-4">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><History size={16} /> Geçmiş Z raporları</h2>
          {gecmis.length === 0 ? (
            <p className="text-sm text-surface-500">Kayıt yok</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="text-[10px] font-mono uppercase text-surface-400">
                <tr>
                  <th className="py-2">Z No</th>
                  <th>Durum</th>
                  <th>Ciro (nakit/kart)</th>
                  <th>Fark</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {gecmis.map((v) => (
                  <tr key={v.id} className="border-t border-[#322C26]">
                    <td className="py-2 font-mono">{v.z_no}</td>
                    <td>{v.durum}</td>
                    <td className="font-mono">{formatPara((v.nakit_satis || 0) + (v.kart_satis || 0) + (v.yemek_karti_satis || 0) + (v.diger_satis || 0))}</td>
                    <td className={clsx('font-mono', Number(v.nakit_fark) !== 0 && 'text-amber-300')}>
                      {v.durum === 'kapali' ? formatPara(v.nakit_fark || 0) : '—'}
                    </td>
                    <td>
                      {v.durum === 'kapali' && (
                        <button onClick={() => yazdir(v)} className="p-1.5 text-surface-400 hover:text-white"><Printer size={14} /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal isOpen={giderAcik} onClose={() => setGiderAcik(false)} title="Kasa gideri">
        <div className="space-y-3">
          <input
            type="number"
            placeholder="Tutar"
            value={giderTutar}
            onChange={(e) => setGiderTutar(e.target.value)}
            className="w-full h-11 px-3 rounded-xl bg-[#0B0A08] border border-[#322C26] text-white font-mono"
          />
          <input
            placeholder="Açıklama (market, ekmek, vs.)"
            value={giderAciklama}
            onChange={(e) => setGiderAciklama(e.target.value)}
            className="w-full h-11 px-3 rounded-xl bg-[#0B0A08] border border-[#322C26] text-white"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setGiderAcik(false)}>İptal</Button>
            <Button variant="danger" isLoading={islemde} onClick={giderEkle}>Kaydet</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
