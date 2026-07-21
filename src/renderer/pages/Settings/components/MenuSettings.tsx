import React, { useState, useEffect } from 'react'
import { Button } from '../../../components/ui/Button'
import { Modal } from '../../../components/ui/Modal'
import { useToast } from '../../../components/ui/Toast'
import { ipcInvoke } from '../../../hooks/useIPC'
import { MENU_KANALLARI } from '../../../../common/ipc-channels'
import { Edit2, Trash2, Plus, LayoutGrid, Package } from 'lucide-react'
import { clsx } from 'clsx'

export default function MenuSettings() {
  const [kategoriler, setKategoriler] = useState<any[]>([])
  const [urunler, setUrunler] = useState<any[]>([])
  const [seciliKategoriId, setSeciliKategoriId] = useState<number | null>(null)
  const { success, error } = useToast()

  // Modals
  const [katModalAcik, setKatModalAcik] = useState(false)
  const [urunModalAcik, setUrunModalAcik] = useState(false)
  const [duzenlenenKat, setDuzenlenenKat] = useState<any>(null)
  const [duzenlenenUrun, setDuzenlenenUrun] = useState<any>(null)

  // Form (Kat)
  const [katAd, setKatAd] = useState('')
  const [katRenk, setKatRenk] = useState('#3B82F6')

  // Form (Ürün)
  const [urunAd, setUrunAd] = useState('')
  const [urunFiyat, setUrunFiyat] = useState('')
  const [urunKategoriId, setUrunKategoriId] = useState('')
  const [urunBarkod, setUrunBarkod] = useState('')

  const verileriGetir = async () => {
    try {
      const katData = await ipcInvoke<any[]>(MENU_KANALLARI.KATEGORILER)
      setKategoriler(katData || [])
      
      const urunData = await ipcInvoke<any[]>(MENU_KANALLARI.URUNLER)
      setUrunler(urunData || [])
    } catch (err: any) {
      error('Hata', err.message || 'Veriler yüklenemedi')
    }
  }

  useEffect(() => {
    verileriGetir()
  }, [])

  // Kategori işlemleri
  const katKaydet = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (duzenlenenKat) {
        await ipcInvoke(MENU_KANALLARI.KATEGORI_GUNCELLE, duzenlenenKat.id, { ad: katAd, renk: katRenk })
        success('Başarılı', 'Kategori güncellendi.')
      } else {
        await ipcInvoke(MENU_KANALLARI.KATEGORI_EKLE, { ad: katAd, renk: katRenk })
        success('Başarılı', 'Yeni kategori eklendi.')
      }
      setKatModalAcik(false)
      verileriGetir()
    } catch (err: any) {
      error('Hata', err.message)
    }
  }

  const katSil = async (id: number) => {
    if (!window.confirm('Kategoriyi silmek istediğinize emin misiniz?')) return
    try {
      await ipcInvoke(MENU_KANALLARI.KATEGORI_SIL, id)
      success('Başarılı', 'Kategori silindi.')
      if (seciliKategoriId === id) setSeciliKategoriId(null)
      verileriGetir()
    } catch (err: any) {
      error('Hata', err.message)
    }
  }

  // Ürün işlemleri
  const urunKaydet = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (duzenlenenUrun) {
        await ipcInvoke(MENU_KANALLARI.URUN_GUNCELLE, duzenlenenUrun.id, { 
          ad: urunAd, fiyat: Number(urunFiyat), kategori_id: Number(urunKategoriId), barkod: urunBarkod 
        })
        success('Başarılı', 'Ürün güncellendi.')
      } else {
        await ipcInvoke(MENU_KANALLARI.URUN_EKLE, { 
          ad: urunAd, fiyat: Number(urunFiyat), kategori_id: Number(urunKategoriId), barkod: urunBarkod 
        })
        success('Başarılı', 'Yeni ürün eklendi.')
      }
      setUrunModalAcik(false)
      verileriGetir()
    } catch (err: any) {
      error('Hata', err.message)
    }
  }

  const urunSil = async (id: number) => {
    if (!window.confirm('Ürünü silmek istediğinize emin misiniz?')) return
    try {
      await ipcInvoke(MENU_KANALLARI.URUN_SIL, id)
      success('Başarılı', 'Ürün silindi.')
      verileriGetir()
    } catch (err: any) {
      error('Hata', err.message)
    }
  }

  const gosterilenUrunler = seciliKategoriId 
    ? urunler.filter(u => u.kategori_id === seciliKategoriId)
    : urunler

  return (
    <div className="flex gap-6 h-full animate-fade-in pb-8">
      {/* Kategoriler Sütunu */}
      <div className="w-1/3 flex flex-col gap-4 border-r border-surface-200 dark:border-surface-800 pr-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center gap-2"><LayoutGrid size={20} /> Kategoriler</h2>
          <Button size="sm" onClick={() => { setDuzenlenenKat(null); setKatAd(''); setKatRenk('#3B82F6'); setKatModalAcik(true) }}>
            <Plus size={16} /> Ekle
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto flex flex-col gap-2 pos-scrollbar pr-2 pb-10">
          <div 
            onClick={() => setSeciliKategoriId(null)}
            className={clsx(
              "p-3 rounded-pos cursor-pointer transition-colors border",
              seciliKategoriId === null ? "bg-brand-50 border-brand-200 dark:bg-brand-900/30 dark:border-brand-800" : "bg-white border-surface-200 dark:bg-surface-900 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800"
            )}
          >
            Tüm Ürünler
          </div>
          {kategoriler.map(kat => (
            <div 
              key={kat.id}
              onClick={() => setSeciliKategoriId(kat.id)}
              className={clsx(
                "p-3 rounded-pos cursor-pointer transition-colors border flex justify-between items-center group",
                seciliKategoriId === kat.id ? "bg-brand-50 border-brand-200 dark:bg-brand-900/30 dark:border-brand-800" : "bg-white border-surface-200 dark:bg-surface-900 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: kat.renk }}></div>
                <span className="font-medium">{kat.ad}</span>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); setDuzenlenenKat(kat); setKatAd(kat.ad); setKatRenk(kat.renk); setKatModalAcik(true) }}>
                  <Edit2 size={14} />
                </Button>
                <Button variant="danger" size="sm" className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-700" onClick={(e) => { e.stopPropagation(); katSil(kat.id) }}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ürünler Sütunu */}
      <div className="w-2/3 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center gap-2"><Package size={20} /> Ürünler</h2>
          <Button size="sm" onClick={() => { 
            setDuzenlenenUrun(null); 
            setUrunAd(''); 
            setUrunFiyat(''); 
            setUrunBarkod('');
            setUrunKategoriId(seciliKategoriId ? String(seciliKategoriId) : (kategoriler.length > 0 ? String(kategoriler[0].id) : ''));
            setUrunModalAcik(true) 
          }}>
            <Plus size={16} /> Ekle
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 lg:grid-cols-3 gap-3 pos-scrollbar pr-2 pb-10 content-start">
          {gosterilenUrunler.map(urun => (
            <div key={urun.id} className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 p-4 rounded-pos flex flex-col gap-2 relative group hover:border-brand-300 transition-colors">
              <div className="font-bold text-surface-900 dark:text-white truncate" title={urun.ad}>{urun.ad}</div>
              <div className="text-brand-600 dark:text-brand-400 font-bold text-lg">{urun.fiyat} ₺</div>
              <div className="text-xs text-surface-500 truncate">{urun.kategori_adi}</div>
              
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-surface-900/90 rounded-md shadow-sm">
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { 
                  setDuzenlenenUrun(urun); setUrunAd(urun.ad); setUrunFiyat(urun.fiyat.toString()); setUrunBarkod(urun.barkod || ''); setUrunKategoriId(urun.kategori_id.toString()); setUrunModalAcik(true) 
                }}>
                  <Edit2 size={14} />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700" onClick={() => urunSil(urun.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
          {gosterilenUrunler.length === 0 && (
            <div className="col-span-full text-center text-surface-400 py-10 bg-surface-50 dark:bg-surface-800/30 rounded-pos border border-dashed border-surface-300 dark:border-surface-700">
              Bu kategoride ürün bulunmuyor.
            </div>
          )}
        </div>
      </div>

      {/* Kategori Modal */}
      <Modal isOpen={katModalAcik} onClose={() => setKatModalAcik(false)} title={duzenlenenKat ? 'Kategori Düzenle' : 'Yeni Kategori'}>
        <form onSubmit={katKaydet} className="flex flex-col gap-5 py-2">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-surface-700 dark:text-surface-300">Kategori Adı</label>
            <input required type="text" placeholder="Örn: İçecekler" value={katAd} onChange={e => setKatAd(e.target.value)} className="px-4 py-2.5 border rounded-pos bg-white dark:bg-surface-950 dark:border-surface-700 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-surface-700 dark:text-surface-300">Menü Rengi</label>
            <div className="flex items-center gap-3">
              <input type="color" value={katRenk} onChange={e => setKatRenk(e.target.value)} className="h-10 w-16 border rounded-pos cursor-pointer p-0" />
              <span className="text-sm text-surface-500 uppercase font-mono">{katRenk}</span>
            </div>
          </div>
          <Button type="submit" variant="primary" className="mt-4 py-3 text-lg font-bold">
            {duzenlenenKat ? 'Değişiklikleri Kaydet' : 'Kategori Ekle'}
          </Button>
        </form>
      </Modal>

      {/* Ürün Modal */}
      <Modal isOpen={urunModalAcik} onClose={() => setUrunModalAcik(false)} title={duzenlenenUrun ? 'Ürün Düzenle' : 'Yeni Ürün'}>
        <form onSubmit={urunKaydet} className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-surface-700 dark:text-surface-300">Ürün Adı</label>
            <input required type="text" placeholder="Örn: Ayran 330ml" value={urunAd} onChange={e => setUrunAd(e.target.value)} className="px-4 py-2.5 border rounded-pos bg-white dark:bg-surface-950 dark:border-surface-700 focus:border-brand-500 outline-none" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-surface-700 dark:text-surface-300">Fiyat (₺)</label>
            <input 
              required 
              type="text" 
              inputMode="decimal"
              placeholder="0.00" 
              value={urunFiyat} 
              onChange={e => {
                // Sadece rakam, nokta ve virgüle izin ver
                const val = e.target.value.replace(/[^0-9.,]/g, '')
                setUrunFiyat(val.replace(',', '.'))
              }} 
              className="px-4 py-2.5 border rounded-pos bg-white dark:bg-surface-950 dark:border-surface-700 focus:border-brand-500 outline-none" 
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-surface-700 dark:text-surface-300">Kategori</label>
            <select required value={urunKategoriId} onChange={e => setUrunKategoriId(e.target.value)} className="px-4 py-2.5 border rounded-pos bg-white dark:bg-surface-950 dark:border-surface-700 focus:border-brand-500 outline-none cursor-pointer">
              <option value="" disabled>Seçiniz...</option>
              {kategoriler.map(k => <option key={k.id} value={k.id}>{k.ad}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-surface-700 dark:text-surface-300">Barkod (Opsiyonel)</label>
            <input type="text" placeholder="Okutun veya yazın..." value={urunBarkod} onChange={e => setUrunBarkod(e.target.value)} className="px-4 py-2.5 border rounded-pos bg-white dark:bg-surface-950 dark:border-surface-700 focus:border-brand-500 outline-none" />
          </div>
          <Button type="submit" variant="primary" className="mt-4 py-3 text-lg font-bold">
            {duzenlenenUrun ? 'Değişiklikleri Kaydet' : 'Ürün Ekle'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
