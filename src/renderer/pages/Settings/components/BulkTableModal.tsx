import React, { useState, useMemo } from 'react'
import { Modal } from '../../../components/ui/Modal'
import { useToast } from '../../../components/ui/Toast'
import { ipcInvoke } from '../../../hooks/useIPC'
import { MASA_KANALLARI } from '../../../../common/ipc-channels'
import type { Bolum, Masa } from '../../../../common/types/table.types'
import { Sparkles, Hash, Plus, RefreshCw, Layers, AlertCircle } from 'lucide-react'
import { clsx } from 'clsx'
import { motion } from 'framer-motion'

interface BulkTableModalProps {
  isOpen: boolean
  onClose: () => void
  bolumler: Bolum[]
  masalar: Masa[]
  varsayilanBolumId: number | null
  onSuccess: () => void
}

type CreationMode = 'auto_continue' | 'range'

export default function BulkTableModal({
  isOpen,
  onClose,
  bolumler,
  masalar,
  varsayilanBolumId,
  onSuccess,
}: BulkTableModalProps) {
  const { success, error, warning } = useToast()

  // Form State
  const [seciliBolumId, setSeciliBolumId] = useState<number>(() => {
    return varsayilanBolumId || (bolumler.length > 0 ? bolumler[0].id : 1)
  })
  const [mode, setMode] = useState<CreationMode>('auto_continue')
  const [onek, setOnek] = useState('S')
  const [adet, setAdet] = useState<number | ''>(10)
  const [baslangicNo, setBaslangicNo] = useState<number | ''>(10)
  const [bitisNo, setBitisNo] = useState<number | ''>(20)
  const [kapasite, setKapasite] = useState<number | ''>(4)
  const [yukleniyor, setYukleniyor] = useState(false)

  // Default bolum ID güncellendiğinde sync et
  React.useEffect(() => {
    if (varsayilanBolumId) {
      setSeciliBolumId(varsayilanBolumId)
    } else if (bolumler.length > 0 && !seciliBolumId) {
      setSeciliBolumId(bolumler[0].id)
    }
  }, [varsayilanBolumId, bolumler])

  // Hedef bölümdeki mevcut aktif masalar
  const hedefBolumMasalari = useMemo(() => {
    return masalar.filter(m => m.bolum_id === seciliBolumId && m.aktif !== false)
  }, [masalar, seciliBolumId])

  // Mod 1 için: Seçili öneke göre mevcut en yüksek masa numarasını tespit et
  const mevcutEnYuksekNo = useMemo(() => {
    const p = onek.trim()
    let max = 0

    if (p) {
      const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`^${escaped}\\s*[-_]?\\s*(\\d+)$`, 'i')
      for (const m of hedefBolumMasalari) {
        const match = m.numara.trim().match(regex)
        if (match) {
          const val = parseInt(match[1], 10)
          if (!isNaN(val) && val > max) max = val
        }
      }
    } else {
      for (const m of hedefBolumMasalari) {
        const match = m.numara.trim().match(/^(\d+)$/)
        if (match) {
          const val = parseInt(match[1], 10)
          if (!isNaN(val) && val > max) max = val
        }
      }
    }
    return max
  }, [hedefBolumMasalari, onek])

  // Oluşturulacak masa listesi ve önizleme
  const olusturulacakMasalar = useMemo(() => {
    const p = onek.trim()
    const list: string[] = []

    if (mode === 'auto_continue') {
      const sayi = typeof adet === 'number' ? adet : 0
      if (sayi > 0 && sayi <= 100) {
        const start = mevcutEnYuksekNo + 1
        for (let i = 0; i < sayi; i++) {
          const num = start + i
          list.push(p ? `${p} ${num}` : `${num}`)
        }
      }
    } else {
      const start = typeof baslangicNo === 'number' ? baslangicNo : 1
      const end = typeof bitisNo === 'number' ? bitisNo : 1
      if (start >= 1 && end >= start && (end - start + 1) <= 150) {
        for (let num = start; num <= end; num++) {
          list.push(p ? `${p} ${num}` : `${num}`)
        }
      }
    }

    return list
  }, [mode, onek, adet, baslangicNo, bitisNo, mevcutEnYuksekNo])

  // Çakışma kontrolü (oluşturulacak masalardan halihazırda var olanlar)
  const mevcutMasaAdlari = useMemo(() => {
    return new Set(hedefBolumMasalari.map(m => m.numara.trim().toLowerCase()))
  }, [hedefBolumMasalari])

  const cakisanMasaSayisi = useMemo(() => {
    return olusturulacakMasalar.filter(m => mevcutMasaAdlari.has(m.toLowerCase())).length
  }, [olusturulacakMasalar, mevcutMasaAdlari])

  // Toplu Oluşturma İşlemi
  const handleKaydet = async () => {
    if (!seciliBolumId) {
      warning('Eksik Bilgi', 'Lütfen geçerli bir bölüm seçin.')
      return
    }

    if (olusturulacakMasalar.length === 0) {
      warning('Geçersiz Değerler', 'Lütfen geçerli adet veya başlangıç-bitiş aralığı girin.')
      return
    }

    setYukleniyor(true)
    try {
      // Hedef bölümdeki son sıra numarası (sort_order / sira)
      const maxSira = hedefBolumMasalari.reduce((max, m) => Math.max(max, m.sira || 0), 0)
      const existingCount = hedefBolumMasalari.length
      const masaKapasite = typeof kapasite === 'number' && kapasite > 0 ? kapasite : 4

      // Masaları sırayla kaydet
      for (let idx = 0; idx < olusturulacakMasalar.length; idx++) {
        const numara = olusturulacakMasalar[idx]
        const sira = maxSira + idx + 1
        const x = ((existingCount + idx) % 5) * 120 + 50
        const y = Math.floor((existingCount + idx) / 5) * 120 + 50

        await ipcInvoke(MASA_KANALLARI.MASA_EKLE, {
          bolum_id: seciliBolumId,
          numara,
          kapasite: masaKapasite,
          konum_x: x,
          konum_y: y,
          sira
        })
      }

      success('Masalar Oluşturuldu', `${olusturulacakMasalar.length} adet masa başarıyla eklendi.`)
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Toplu masa ekleme hatası:', err)
      error('Hata', err.message || 'Masa oluşturulurken bir hata oluştu.')
    } finally {
      setYukleniyor(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Toplu Masa Oluştur"
      size="md"
    >
      <div className="flex flex-col gap-5 select-none">
        
        {/* Hedef Bölüm Seçimi */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-mono font-bold text-surface-300 uppercase tracking-wider">
            Hedef Bölüm
          </label>
          <select
            value={seciliBolumId}
            onChange={e => setSeciliBolumId(parseInt(e.target.value, 10))}
            className="h-11 px-3.5 rounded-xl bg-[#090B11] border border-[#1E2436] text-white text-xs font-semibold focus:outline-none focus:border-brand-500 transition-colors"
          >
            {bolumler.map(b => (
              <option key={b.id} value={b.id}>
                {b.ad} ({hedefBolumMasalari.length > 0 && b.id === seciliBolumId ? `${hedefBolumMasalari.length} Masa` : `${b.masa_sayisi || 0} Masa`})
              </option>
            ))}
          </select>
        </div>

        {/* 2 Farklı Oluşturma Modu Seçici (Tabs / Segmented Control) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-mono font-bold text-surface-300 uppercase tracking-wider">
            Oluşturma Modu
          </label>
          <div className="grid grid-cols-2 gap-2 bg-[#090B11] p-1 rounded-xl border border-[#1E2436]">
            <button
              type="button"
              onClick={() => setMode('auto_continue')}
              className={clsx(
                "flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-mono font-bold transition-all",
                mode === 'auto_continue'
                  ? "bg-[#161D2E] text-brand-400 shadow-md border border-brand-500/40"
                  : "text-surface-400 hover:text-surface-200 hover:bg-[#121622]"
              )}
            >
              <Sparkles size={14} className={mode === 'auto_continue' ? "text-brand-400" : "text-surface-500"} />
              <span>Kaldığı Yerden Devam Et</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('range')}
              className={clsx(
                "flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-mono font-bold transition-all",
                mode === 'range'
                  ? "bg-[#161D2E] text-brand-400 shadow-md border border-brand-500/40"
                  : "text-surface-400 hover:text-surface-200 hover:bg-[#121622]"
              )}
            >
              <Hash size={14} className={mode === 'range' ? "text-brand-400" : "text-surface-500"} />
              <span>Belirli Aralık İle</span>
            </button>
          </div>
        </div>

        {/* Form Alanları */}
        <div className="bg-[#0A0D15] p-4 rounded-xl border border-[#182030] space-y-4">
          
          {/* Önek Alanı (Her iki modda da ortak) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-surface-400">
                Masa Öneki (Opsiyonel)
              </label>
              <input
                type="text"
                value={onek}
                onChange={e => setOnek(e.target.value)}
                placeholder="Örn: S, A, Teras..."
                className="h-10 px-3 rounded-xl bg-[#090B11] border border-[#1E2436] text-white text-xs font-mono uppercase focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-surface-400">
                Kapasite (Kişi)
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={kapasite}
                onChange={e => setKapasite(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                className="h-10 px-3 rounded-xl bg-[#090B11] border border-[#1E2436] text-white text-xs font-mono focus:outline-none focus:border-brand-500 transition-colors"
                placeholder="4"
              />
            </div>
          </div>

          {/* MOD 1 ALANLARI: Kaldığı Yerden Devam Et */}
          {mode === 'auto_continue' && (
            <div className="space-y-3 pt-1">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-surface-400">
                    Eklenecek Masa Sayısı
                  </label>
                  {mevcutEnYuksekNo > 0 ? (
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded">
                      Son Masa: {onek.trim() ? `${onek.trim()} ${mevcutEnYuksekNo}` : mevcutEnYuksekNo}
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-surface-400 bg-[#121624] px-2 py-0.5 rounded border border-[#1E2538]">
                      Mevcut masa yok (1'den başlar)
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={adet}
                  onChange={e => setAdet(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  placeholder="10"
                  className="h-10 px-3 rounded-xl bg-[#090B11] border border-[#1E2436] text-white text-xs font-mono focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
            </div>
          )}

          {/* MOD 2 ALANLARI: Belirli Aralık İle Oluştur */}
          {mode === 'range' && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-surface-400">
                  Başlangıç No
                </label>
                <input
                  type="number"
                  min={1}
                  value={baslangicNo}
                  onChange={e => setBaslangicNo(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  placeholder="10"
                  className="h-10 px-3 rounded-xl bg-[#090B11] border border-[#1E2436] text-white text-xs font-mono focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-surface-400">
                  Bitiş No
                </label>
                <input
                  type="number"
                  min={typeof baslangicNo === 'number' ? baslangicNo : 1}
                  value={bitisNo}
                  onChange={e => setBitisNo(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  placeholder="20"
                  className="h-10 px-3 rounded-xl bg-[#090B11] border border-[#1E2436] text-white text-xs font-mono focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
            </div>
          )}
        </div>

        {/* Canlı Önizleme Kartı */}
        <div className="bg-[#090B12] p-3.5 rounded-xl border border-[#1A2030] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-surface-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers size={13} className="text-brand-400" />
              Oluşturulacak Masalar Önizlemesi
            </span>
            <span className="text-xs font-mono font-black text-brand-400">
              {olusturulacakMasalar.length} Adet Masa
            </span>
          </div>

          {olusturulacakMasalar.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pos-scrollbar p-1">
              {olusturulacakMasalar.map((no, i) => {
                const cakisma = mevcutMasaAdlari.has(no.toLowerCase())
                return (
                  <span
                    key={i}
                    className={clsx(
                      "px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-colors",
                      cakisma
                        ? "bg-amber-950/40 text-amber-300 border-amber-500/40"
                        : "bg-[#141926] text-white border-[#222C42]"
                    )}
                    title={cakisma ? "Bu masa adı zaten mevcut" : undefined}
                  >
                    {no}
                  </span>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-surface-500 font-mono italic py-1">
              Geçerli aralık veya adet girdiğinizde üretilecek masalar burada listelenecektir.
            </p>
          )}

          {cakisanMasaSayisi > 0 && (
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-400 bg-amber-950/30 border border-amber-500/30 p-2 rounded-lg mt-1">
              <AlertCircle size={13} className="shrink-0" />
              <span>{cakisanMasaSayisi} adet masa bu bölümde zaten mevcut. Yine de eklenecektir.</span>
            </div>
          )}
        </div>

        {/* Butonlar */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#1A1F30]">
          <button
            type="button"
            onClick={onClose}
            disabled={yukleniyor}
            className="h-10 px-4 rounded-xl text-xs font-semibold text-surface-400 hover:text-white transition-colors"
          >
            İptal
          </button>
          
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={handleKaydet}
            disabled={yukleniyor || olusturulacakMasalar.length === 0}
            className="h-10 px-5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:bg-[#1A2234] disabled:text-surface-500 disabled:border disabled:border-[#222C42] text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-brand-950/50 disabled:shadow-none transition-all"
          >
            {yukleniyor ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Oluşturuluyor...</span>
              </>
            ) : (
              <>
                <Plus size={14} />
                <span>{olusturulacakMasalar.length} Masayı Oluştur</span>
              </>
            )}
          </motion.button>
        </div>

      </div>
    </Modal>
  )
}
