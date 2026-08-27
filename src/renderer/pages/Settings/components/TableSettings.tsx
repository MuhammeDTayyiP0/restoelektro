import React, { useState, useEffect } from 'react'
import { useToast } from '../../../components/ui/Toast'
import { ipcInvoke, useIPC } from '../../../hooks/useIPC'
import { MASA_KANALLARI } from '../../../../common/ipc-channels'
import { Modal } from '../../../components/ui/Modal'
import { Plus, Edit2, Trash2, Save, LayoutGrid } from 'lucide-react'
import { clsx } from 'clsx'
import type { Bolum, Masa } from '../../../../common/types/table.types'
import { motion } from 'framer-motion'

export default function TableSettings() {
  const { success, error } = useToast()
  
  // Bölüm ve masalar
  const { veri: bolumler, yukleniyor: bolumlerYukleniyor, yenile: bolumleriYenile } = useIPC<Bolum[]>(MASA_KANALLARI.BOLUMLER, [])
  const { veri: masalar, yukleniyor: masalarYukleniyor, yenile: masalariYenile } = useIPC<Masa[]>(MASA_KANALLARI.MASALAR, [])

  // State
  const [seciliBolumId, setSeciliBolumId] = useState<number | null>(null)
  const [bolumModalAcik, setBolumModalAcik] = useState(false)
  const [duzenlenecekBolum, setDuzenlenecekBolum] = useState<Bolum | null>(null)
  const [masaModalAcik, setMasaModalAcik] = useState(false)
  const [duzenlenecekMasa, setDuzenlenecekMasa] = useState<Masa | null>(null)

  // Form alanları
  const [bolumForm, setBolumForm] = useState<{ad: string, sira: number | ''}>({ ad: '', sira: 0 })
  const [masaForm, setMasaForm] = useState<{numara: string, kapasite: number | '', sira: number | '', bolum_id: number}>({
    numara: '',
    kapasite: 4,
    sira: 0,
    bolum_id: 0,
  })

  // İlk bölümü seç
  useEffect(() => {
    if (bolumler.length > 0 && seciliBolumId === null) {
      setSeciliBolumId(bolumler[0].id)
    }
  }, [bolumler, seciliBolumId])

  // Bölüme göre filtrelenmiş masalar
  const filtrelenmisMasalar = seciliBolumId 
    ? masalar.filter(m => m.bolum_id === seciliBolumId)
    : masalar

  // Bölüm Ekle / Güncelle
  const bolumKaydet = async () => {
    if (!bolumForm.ad.trim()) {
      error('Hata', 'Bölüm adı boş olamaz.')
      return
    }
    try {
      if (duzenlenecekBolum) {
        // Güncelleme
        const res = await ipcInvoke<any>(MASA_KANALLARI.BOLUM_GUNCELLE, duzenlenecekBolum.id, {
          ad: bolumForm.ad.trim(),
          sira: bolumForm.sira === '' ? 0 : bolumForm.sira
        })
        if (res?.basarili) {
          success('Başarılı', `Bölüm güncellendi.`)
        } else {
          error('Hata', 'Bölüm güncellenemedi.')
        }
      } else {
        // Ekleme
        const res = await ipcInvoke<any>(MASA_KANALLARI.BOLUM_EKLE, {
          ad: bolumForm.ad.trim(),
          sira: bolumForm.sira === '' ? 0 : bolumForm.sira
        })
        if (res?.basarili) {
          success('Başarılı', `"${bolumForm.ad}" bölümü eklendi.`)
        } else {
          error('Hata', 'Bölüm eklenemedi.')
        }
      }
      setBolumForm({ ad: '', sira: 0 })
      setDuzenlenecekBolum(null)
      setBolumModalAcik(false)
      bolumleriYenile()
    } catch (err: any) {
      error('Hata', err.message)
    }
  }
  
  // Bölüm düzenleme modali aç
  const bolumDuzenlemeAc = (bolum: Bolum) => {
    setDuzenlenecekBolum(bolum)
    setBolumForm({
      ad: bolum.ad,
      sira: bolum.sira || 0
    })
    setBolumModalAcik(true)
  }

  // Yeni bölüm modali aç
  const yeniBolumAc = () => {
    setDuzenlenecekBolum(null)
    setBolumForm({ ad: '', sira: 0 })
    setBolumModalAcik(true)
  }

  // Masa Ekle / Güncelle
  const masaKaydet = async () => {
    if (!masaForm.numara.trim()) {
      error('Hata', 'Masa numarası boş olamaz.')
      return
    }
    const hedefBolumId = masaForm.bolum_id || seciliBolumId
    if (!hedefBolumId) {
      error('Hata', 'Bir bölüm seçmelisiniz.')
      return
    }
    try {
      if (duzenlenecekMasa) {
        // Güncelleme
        const res = await ipcInvoke<any>(MASA_KANALLARI.MASA_GUNCELLE, duzenlenecekMasa.id, {
          numara: masaForm.numara.trim(),
          kapasite: masaForm.kapasite === '' ? 4 : masaForm.kapasite,
          sira: masaForm.sira === '' ? 0 : masaForm.sira,
        })
        if (res?.basarili) {
          success('Başarılı', `Masa ${masaForm.numara} güncellendi.`)
        } else {
          error('Hata', 'Masa güncellenemedi.')
        }
      } else {
        // Yeni ekleme
        const res = await ipcInvoke<any>(MASA_KANALLARI.MASA_EKLE, {
          bolum_id: hedefBolumId,
          numara: masaForm.numara.trim(),
          kapasite: masaForm.kapasite === '' ? 4 : masaForm.kapasite,
          sira: masaForm.sira === '' ? 0 : masaForm.sira,
        })
        if (res?.basarili) {
          success('Başarılı', `Masa ${masaForm.numara} eklendi.`)
        } else {
          error('Hata', 'Masa eklenemedi.')
        }
      }
      setMasaModalAcik(false)
      setDuzenlenecekMasa(null)
      setMasaForm({ numara: '', kapasite: 4, sira: 0, bolum_id: 0 })
      masalariYenile()
    } catch (err: any) {
      error('Hata', err.message)
    }
  }

  // Masa düzenleme modali aç
  const masaDuzenlemeAc = (masa: Masa) => {
    setDuzenlenecekMasa(masa)
    setMasaForm({
      numara: masa.numara,
      kapasite: masa.kapasite,
      sira: masa.sira || 0,
      bolum_id: masa.bolum_id,
    })
    setMasaModalAcik(true)
  }

  // Yeni masa modali aç
  const yeniMasaAc = () => {
    setDuzenlenecekMasa(null)
    setMasaForm({ numara: '', kapasite: 4, sira: 0, bolum_id: seciliBolumId || 0 })
    setMasaModalAcik(true)
  }

  // Bölüm sil (aktif = 0 yap)
  const bolumSil = async (bolum: Bolum, e: React.MouseEvent) => {
    e.stopPropagation()
    if (bolum.masa_sayisi && bolum.masa_sayisi > 0) {
      if (!window.confirm(`"${bolum.ad}" bölümünde ${bolum.masa_sayisi} masa bulunuyor. Yine de silmek istediğinize emin misiniz?`)) return
    } else {
      if (!window.confirm(`"${bolum.ad}" bölümünü silmek istediğinize emin misiniz?`)) return
    }
    
    try {
      await ipcInvoke<any>(MASA_KANALLARI.BOLUM_GUNCELLE, bolum.id, { aktif: 0 })
      success('Başarılı', `"${bolum.ad}" bölümü kaldırıldı.`)
      if (seciliBolumId === bolum.id) setSeciliBolumId(null)
      bolumleriYenile()
    } catch (err: any) {
      error('Hata', err.message)
    }
  }

  // Masa sil (aktif = 0 yap)
  const masaSil = async (masa: Masa) => {
    if (!window.confirm(`"Masa ${masa.numara}" silmek istediğinize emin misiniz?`)) return
    try {
      await ipcInvoke<any>(MASA_KANALLARI.MASA_GUNCELLE, masa.id, { durum: 'bos', aktif: 0 })
      success('Başarılı', `Masa ${masa.numara} kaldırıldı.`)
      masalariYenile()
    } catch (err: any) {
      error('Hata', err.message)
    }
  }

  if (bolumlerYukleniyor || masalarYukleniyor) {
    return (
      <div className="flex items-center justify-center p-12 text-surface-400 font-mono text-sm">
        <span className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mr-3" />
        Masa krokisi yükleniyor...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl animate-fade-in text-surface-100 select-none pb-8">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <LayoutGrid size={22} className="text-brand-500" />
          Masa & Bölüm Yerleşimi
        </h2>
        <p className="text-xs text-surface-400 mt-1">
          Salon, Bahçe, Teras gibi bölümler oluşturun ve masaları konumlandırın.
        </p>
      </div>

      {/* Bölüm Yönetimi */}
      <div className="bg-[#0E111B] p-6 rounded-2xl border border-[#1E2436] space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#1A1F30]">
          <h3 className="text-xs font-bold text-surface-300 uppercase tracking-wider">
            Restoran Bölümleri
          </h3>
          <motion.button 
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={yeniBolumAc}
            className="h-9 px-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus size={14} />
            Yeni Bölüm
          </motion.button>
        </div>

        {bolumler.length === 0 ? (
          <p className="text-surface-400 text-center py-6 text-xs">Henüz bölüm oluşturulmamış. Yeni bölüm ekleyerek başlayın.</p>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {bolumler.map(bolum => (
              <div key={bolum.id} className="relative group">
                <button
                  type="button"
                  onClick={() => setSeciliBolumId(bolum.id)}
                  className={clsx(
                    'flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-semibold pr-9 transition-all',
                    seciliBolumId === bolum.id
                      ? 'bg-brand-950/50 border-brand-500/60 text-white shadow-md shadow-brand-950/40'
                      : 'bg-[#121624] hover:bg-[#181D2E] border-[#1E2538] text-surface-300'
                  )}
                >
                  <LayoutGrid size={15} className={seciliBolumId === bolum.id ? 'text-brand-400' : 'text-surface-400'} />
                  <span>{bolum.ad}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#181E30] text-surface-400 border border-[#252E46] ml-1">
                    {bolum.masa_sayisi || 0}
                  </span>
                </button>
                
                {/* Bölüm düzenle/sil butonu */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); bolumDuzenlemeAc(bolum); }}
                    className="p-1 text-surface-400 hover:text-white rounded transition-colors"
                    title="Düzenle"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => bolumSil(bolum, e)}
                    className="p-1 text-surface-400 hover:text-red-400 rounded transition-colors"
                    title="Sil"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Masa Listesi */}
      {seciliBolumId && (
        <div className="bg-[#0E111B] p-6 rounded-2xl border border-[#1E2436] space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#1A1F30]">
            <h3 className="text-xs font-bold text-surface-300 uppercase tracking-wider">
              {bolumler.find(b => b.id === seciliBolumId)?.ad} — Masa Listesi
            </h3>
            <motion.button 
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={yeniMasaAc}
              className="h-9 px-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus size={14} />
              Yeni Masa Ekle
            </motion.button>
          </div>

          {filtrelenmisMasalar.length === 0 ? (
            <p className="text-surface-400 text-center py-6 text-xs">Bu bölümde henüz masa tanımlanmamış.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {filtrelenmisMasalar.map(masa => (
                <div
                  key={masa.id}
                  className="relative flex flex-col items-center justify-center bg-[#121624] hover:bg-[#161B2B] border border-[#1E2538] rounded-xl p-4 h-24 shadow-md transition-colors group"
                >
                  <span className="text-xl font-bold font-mono text-white mb-0.5">
                    {masa.numara}
                  </span>
                  <span className="text-[11px] text-surface-400">
                    {masa.kapasite} Kişilik
                  </span>

                  {/* Düzenle/Sil butonları */}
                  <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => masaDuzenlemeAc(masa)}
                      className="p-1 text-surface-400 hover:text-white rounded transition-colors"
                      title="Düzenle"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => masaSil(masa)}
                      className="p-1 text-surface-400 hover:text-red-400 rounded transition-colors"
                      title="Sil"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bölüm Ekleme/Düzenleme Modalı */}
      <Modal isOpen={bolumModalAcik} onClose={() => setBolumModalAcik(false)} title={duzenlenecekBolum ? "Bölüm Düzenle" : "Yeni Bölüm Ekle"} size="sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-surface-400">Bölüm Adı</label>
            <input
              type="text"
              value={bolumForm.ad}
              onChange={e => {
                const val = e.target.value
                setBolumForm(prev => ({ ...prev, ad: val }))
              }}
              className="h-11 px-3.5 rounded-xl bg-[#090B11] border border-[#1E2436] text-white text-xs focus:outline-none focus:border-brand-500 transition-colors"
              placeholder="Örn: Salon, Bahçe, Teras..."
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') bolumKaydet() }}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-surface-400">Sıralama Önceliği</label>
            <input
              type="number"
              value={bolumForm.sira}
              onChange={e => {
                const val = e.target.value === '' ? '' : parseInt(e.target.value)
                setBolumForm(prev => ({ ...prev, sira: val }))
              }}
              className="h-11 px-3.5 rounded-xl bg-[#090B11] border border-[#1E2436] text-white text-xs font-mono focus:outline-none focus:border-brand-500 transition-colors"
              placeholder="0"
            />
          </div>
          <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-[#1A1F30]">
            <button 
              type="button" 
              onClick={() => setBolumModalAcik(false)}
              className="h-10 px-4 rounded-xl text-xs font-semibold text-surface-400 hover:text-white transition-colors"
            >
              İptal
            </button>
            <motion.button 
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={bolumKaydet}
              className="h-10 px-5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Save size={14} />
              Kaydet
            </motion.button>
          </div>
        </div>
      </Modal>

      {/* Masa Ekleme/Düzenleme Modalı */}
      <Modal
        isOpen={masaModalAcik}
        onClose={() => { setMasaModalAcik(false); setDuzenlenecekMasa(null) }}
        title={duzenlenecekMasa ? `Masa ${duzenlenecekMasa.numara} Düzenle` : 'Yeni Masa Ekle'}
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-surface-400">Masa Numarası / Kodu</label>
            <input
              type="text"
              value={masaForm.numara}
              onChange={e => {
                const val = e.target.value
                setMasaForm(prev => ({ ...prev, numara: val }))
              }}
              className="h-11 px-3.5 rounded-xl bg-[#090B11] border border-[#1E2436] text-white text-xs font-mono focus:outline-none focus:border-brand-500 transition-colors"
              placeholder="Örn: 1, A1, VIP-1..."
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-surface-400">Kapasite (Kişi Sayısı)</label>
            <input
              type="number"
              min={1}
              max={50}
              value={masaForm.kapasite}
              onChange={e => {
                const val = e.target.value === '' ? '' : parseInt(e.target.value)
                setMasaForm(prev => ({ ...prev, kapasite: val }))
              }}
              className="h-11 px-3.5 rounded-xl bg-[#090B11] border border-[#1E2436] text-white text-xs font-mono focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>
          {!duzenlenecekMasa && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-surface-400">Bölüm</label>
              <select
                value={masaForm.bolum_id || seciliBolumId || ''}
                onChange={e => {
                  const val = parseInt(e.target.value)
                  setMasaForm(prev => ({ ...prev, bolum_id: val }))
                }}
                className="h-11 px-3.5 rounded-xl bg-[#090B11] border border-[#1E2436] text-white text-xs font-semibold focus:outline-none focus:border-brand-500 transition-colors"
              >
                {bolumler.map(b => (
                  <option key={b.id} value={b.id}>{b.ad}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-[#1A1F30]">
            <button 
              type="button" 
              onClick={() => { setMasaModalAcik(false); setDuzenlenecekMasa(null) }}
              className="h-10 px-4 rounded-xl text-xs font-semibold text-surface-400 hover:text-white transition-colors"
            >
              İptal
            </button>
            <motion.button 
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={masaKaydet}
              className="h-10 px-5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Save size={14} />
              {duzenlenecekMasa ? 'Güncelle' : 'Ekle'}
            </motion.button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

