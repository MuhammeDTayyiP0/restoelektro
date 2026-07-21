import React, { useState, useEffect } from 'react'
import { Button } from '../../../components/ui/Button'
import { useToast } from '../../../components/ui/Toast'
import { ipcInvoke } from '../../../hooks/useIPC'
import { useIPC } from '../../../hooks/useIPC'
import { MASA_KANALLARI } from '../../../../common/ipc-channels'
import { Modal } from '../../../components/ui/Modal'
import { Plus, Edit2, Trash2, Save, LayoutGrid } from 'lucide-react'
import { clsx } from 'clsx'
import type { Bolum, Masa } from '../../../../common/types/table.types'

export default function TableSettings() {
  console.log("RENDER TableSettings")
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
      <div className="flex items-center justify-center p-12">
        <p className="text-surface-500 animate-pulse text-lg">Masa ayarları yükleniyor...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-pos-lg font-bold text-surface-900 dark:text-white">Masa Düzeni & Ayarları</h2>
          <p className="text-sm text-surface-500 mt-1">Bölümler oluşturun, masalar ekleyin ve düzenleyin.</p>
        </div>
      </div>

      {/* Bölüm Yönetimi */}
      <div className="flex flex-col gap-4 bg-surface-50 dark:bg-surface-800/50 p-6 rounded-pos-lg border border-surface-200 dark:border-surface-700">
        <div className="flex justify-between items-center pb-2 border-b border-surface-200 dark:border-surface-700">
          <h3 className="font-bold text-surface-900 dark:text-white">Bölümler</h3>
          <Button variant="primary" size="sm" leftIcon={<Plus size={16} />} onClick={yeniBolumAc}>
            Yeni Bölüm
          </Button>
        </div>

        {bolumler.length === 0 ? (
          <p className="text-surface-400 text-center py-6">Henüz bölüm oluşturulmamış. Yeni bölüm ekleyerek başlayın.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {bolumler.map(bolum => (
              <div key={bolum.id} className="relative group">
                <button
                  onClick={() => setSeciliBolumId(bolum.id)}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-3 rounded-pos-lg border-2 transition-all font-medium pr-10',
                    seciliBolumId === bolum.id
                      ? 'bg-brand-50 dark:bg-brand-900/30 border-brand-500 text-brand-700 dark:text-brand-300 shadow-sm'
                      : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 hover:border-brand-300'
                  )}
                >
                  <LayoutGrid size={18} />
                  <span>{bolum.ad}</span>
                  <span className="text-xs bg-surface-200 dark:bg-surface-700 px-2 py-0.5 rounded-full ml-1">
                    {bolum.masa_sayisi || 0} masa
                  </span>
                </button>
                
                {/* Bölüm düzenle/sil butonu */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); bolumDuzenlemeAc(bolum); }}
                    className="p-1.5 text-surface-400 hover:text-brand-500 hover:bg-brand-100 dark:hover:bg-brand-900/50 rounded-full transition-colors"
                    title="Düzenle"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={(e) => bolumSil(bolum, e)}
                    className="p-1.5 text-surface-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full transition-colors"
                    title="Sil"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Masa Listesi */}
      {seciliBolumId && (
        <div className="flex flex-col gap-4 bg-surface-50 dark:bg-surface-800/50 p-6 rounded-pos-lg border border-surface-200 dark:border-surface-700">
          <div className="flex justify-between items-center pb-2 border-b border-surface-200 dark:border-surface-700">
            <h3 className="font-bold text-surface-900 dark:text-white">
              {bolumler.find(b => b.id === seciliBolumId)?.ad} — Masalar
            </h3>
            <Button variant="primary" size="sm" leftIcon={<Plus size={16} />} onClick={yeniMasaAc}>
              Yeni Masa Ekle
            </Button>
          </div>

          {filtrelenmisMasalar.length === 0 ? (
            <p className="text-surface-400 text-center py-6">Bu bölümde henüz masa yok.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filtrelenmisMasalar.map(masa => (
                <div
                  key={masa.id}
                  className="relative flex flex-col items-center justify-center bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-pos-lg p-4 h-28 shadow-sm hover:shadow-md transition-shadow group"
                >
                  <span className="text-pos-2xl font-bold text-surface-900 dark:text-white mb-1">
                    {masa.numara}
                  </span>
                  <span className="text-xs text-surface-500">
                    Kapasite: {masa.kapasite}
                  </span>

                  {/* Düzenle/Sil butonları */}
                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => masaDuzenlemeAc(masa)}
                      className="p-1.5 text-surface-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/30 rounded-pos transition-colors"
                      title="Düzenle"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => masaSil(masa)}
                      className="p-1.5 text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-pos transition-colors"
                      title="Sil"
                    >
                      <Trash2 size={14} />
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
        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Bölüm Adı</label>
            <input
              type="text"
              value={bolumForm.ad}
              onChange={e => {
                const val = e.target.value;
                setBolumForm(prev => ({ ...prev, ad: val }))
              }}
              className="w-full px-4 py-2.5 border rounded-pos dark:bg-surface-900 dark:border-surface-700 focus:outline-none focus:border-brand-500"
              placeholder="Örn: Salon, Bahçe, Teras..."
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') bolumKaydet() }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Sıra Numarası</label>
            <input
              type="number"
              value={bolumForm.sira}
              onChange={e => {
                const val = e.target.value === '' ? '' : parseInt(e.target.value);
                setBolumForm(prev => ({ ...prev, sira: val }))
              }}
              className="w-full px-4 py-2.5 border rounded-pos dark:bg-surface-900 dark:border-surface-700 focus:outline-none focus:border-brand-500"
              placeholder="0"
            />
            <span className="text-xs text-surface-500">Küçük olanlar önce listelenir.</span>
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <Button variant="ghost" onClick={() => setBolumModalAcik(false)}>İptal</Button>
            <Button variant="primary" leftIcon={<Save size={18} />} onClick={bolumKaydet}>Kaydet</Button>
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
        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Masa Numarası</label>
            <input
              type="text"
              value={masaForm.numara}
              onChange={e => {
                const val = e.target.value;
                setMasaForm(prev => ({ ...prev, numara: val }))
              }}
              className="w-full px-4 py-2.5 border rounded-pos dark:bg-surface-900 dark:border-surface-700 focus:outline-none focus:border-brand-500"
              placeholder="Örn: 1, A1, VIP-1..."
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Kapasite (Kişi Sayısı)</label>
            <input
              type="number"
              min={1}
              max={50}
              value={masaForm.kapasite}
              onChange={e => {
                const val = e.target.value === '' ? '' : parseInt(e.target.value);
                setMasaForm(prev => ({ ...prev, kapasite: val }))
              }}
              className="w-full px-4 py-2.5 border rounded-pos dark:bg-surface-900 dark:border-surface-700 focus:outline-none focus:border-brand-500"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Sıra Numarası</label>
            <input
              type="number"
              value={masaForm.sira}
              onChange={e => {
                const val = e.target.value === '' ? '' : parseInt(e.target.value);
                setMasaForm(prev => ({ ...prev, sira: val }))
              }}
              className="w-full px-4 py-2.5 border rounded-pos dark:bg-surface-900 dark:border-surface-700 focus:outline-none focus:border-brand-500"
              placeholder="0"
            />
          </div>
          {!duzenlenecekMasa && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Bölüm</label>
              <select
                value={masaForm.bolum_id || seciliBolumId || ''}
                onChange={e => {
                  const val = parseInt(e.target.value);
                  setMasaForm(prev => ({ ...prev, bolum_id: val }))
                }}
                className="w-full px-4 py-2.5 border rounded-pos dark:bg-surface-900 dark:border-surface-700 focus:outline-none focus:border-brand-500"
              >
                {bolumler.map(b => (
                  <option key={b.id} value={b.id}>{b.ad}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex justify-end gap-3 mt-2">
            <Button variant="ghost" onClick={() => { setMasaModalAcik(false); setDuzenlenecekMasa(null) }}>İptal</Button>
            <Button variant="primary" leftIcon={<Save size={18} />} onClick={masaKaydet}>
              {duzenlenecekMasa ? 'Güncelle' : 'Ekle'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
