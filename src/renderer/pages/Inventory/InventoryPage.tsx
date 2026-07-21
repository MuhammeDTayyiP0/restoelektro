import React, { useState, useEffect } from 'react'
import { Plus, AlertTriangle, ArrowUpRight, ArrowDownRight, RefreshCw, Calculator } from 'lucide-react'
import { clsx } from 'clsx'
import { useIPC, ipcInvoke } from '../../hooks/useIPC'
import { STOK_KANALLARI } from '../../../common/ipc-channels'
import { Button } from '../../components/ui/Button'
import { Tabs } from '../../components/ui/Tabs'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { formatPara, formatTarih } from '../../utils/formatters'
import { useToast } from '../../components/ui/Toast'

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState('hammaddeler')
  const { success, error } = useToast()

  // Veriler
  const { veri: hammaddeler, yukleniyor: hamYukleniyor, yenile: hamYenile } = useIPC<any[]>(STOK_KANALLARI.HAMMADDELER, [])
  const { veri: receteler, yukleniyor: recYukleniyor, yenile: recYenile } = useIPC<any[]>(STOK_KANALLARI.RECETELER, [])
  const { veri: maliyetler, yukleniyor: malYukleniyor, yenile: malYenile } = useIPC<any[]>(STOK_KANALLARI.MALIYET_ANALIZI, [])

  const [stokIslemModal, setStokIslemModal] = useState<{ acik: boolean, hammadde: any | null, islemTipi: string }>({
    acik: false, hammadde: null, islemTipi: 'giris'
  })

  // Tab değiştirildiğinde ilgili verileri yenile
  useEffect(() => {
    if (activeTab === 'hammaddeler') hamYenile()
    else if (activeTab === 'receteler') recYenile()
    else if (activeTab === 'maliyet') malYenile()
  }, [activeTab, hamYenile, recYenile, malYenile])

  // Hammadde Tablosu
  const renderHammaddeler = () => (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-pos-xl font-bold">Hammaddeler & Stok</h3>
        <Button variant="primary" leftIcon={<Plus size={18} />}>
          Yeni Hammadde
        </Button>
      </div>

      <div className="bg-white dark:bg-surface-900 rounded-pos-lg shadow-sm border border-surface-200 dark:border-surface-800 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto pos-scrollbar flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-50 dark:bg-surface-950 text-surface-600 dark:text-surface-400 sticky top-0 z-10">
              <tr>
                <th className="p-4 font-medium border-b border-surface-200 dark:border-surface-700">Ad</th>
                <th className="p-4 font-medium border-b border-surface-200 dark:border-surface-700">Mevcut Stok</th>
                <th className="p-4 font-medium border-b border-surface-200 dark:border-surface-700">Birim Maliyet</th>
                <th className="p-4 font-medium border-b border-surface-200 dark:border-surface-700">Durum</th>
                <th className="p-4 font-medium border-b border-surface-200 dark:border-surface-700">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200 dark:divide-surface-800">
              {hamYukleniyor ? (
                <tr><td colSpan={5} className="p-8 text-center text-surface-500">Yükleniyor...</td></tr>
              ) : hammaddeler.map((ham) => (
                <tr key={ham.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                  <td className="p-4 font-medium">{ham.ad}</td>
                  <td className="p-4">
                    <span className="text-pos-lg font-bold">{ham.mevcut_stok}</span> <span className="text-surface-500">{ham.birim}</span>
                  </td>
                  <td className="p-4">{formatPara(ham.maliyet_birim)}</td>
                  <td className="p-4">
                    <Badge 
                      variant={
                        ham.stok_durumu === 'normal' ? 'success' :
                        ham.stok_durumu === 'dusuk' ? 'warning' : 'danger'
                      }
                    >
                      {ham.stok_durumu.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="h-8 border-green-500 text-green-600 hover:bg-green-50" onClick={() => setStokIslemModal({ acik: true, hammadde: ham, islemTipi: 'giris' })}>
                        <ArrowUpRight size={16} /> Giriş
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 border-red-500 text-red-600 hover:bg-red-50" onClick={() => setStokIslemModal({ acik: true, hammadde: ham, islemTipi: 'cikis' })}>
                        <ArrowDownRight size={16} /> Çıkış
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  // Reçeteler
  const renderReceteler = () => (
    <div className="flex flex-col h-full animate-fade-in">
       <div className="flex justify-between items-center mb-4">
        <h3 className="text-pos-xl font-bold">Ürün Reçeteleri (BOM)</h3>
        <p className="text-surface-500 text-sm">Ürünlerin hangi hammaddelerden oluştuğunu belirleyin.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pos-scrollbar pb-10">
        {recYukleniyor ? (
          <p>Yükleniyor...</p>
        ) : receteler.map((recete) => (
          <div key={recete.urun_id} className="bg-white dark:bg-surface-900 p-4 rounded-pos-lg border border-surface-200 dark:border-surface-700 shadow-sm">
             <div className="flex justify-between items-start mb-3 border-b border-surface-100 dark:border-surface-800 pb-2">
               <div>
                 <h4 className="font-bold text-lg">{recete.urun_adi}</h4>
                 <span className="text-sm text-surface-500">{recete.kategori_adi}</span>
               </div>
               <div className="text-right">
                 <p className="text-xs text-surface-500">Birim Maliyet</p>
                 <p className="font-bold text-brand-600">{formatPara(recete.toplam_maliyet)}</p>
               </div>
             </div>
             
             <div className="flex justify-between items-center mt-4">
               <span className={clsx("text-sm font-semibold", recete.kar_marji < 30 ? 'text-red-500' : 'text-green-500')}>
                 Kar Marjı: %{recete.kar_marji}
               </span>
               <Button size="sm" variant="secondary">Reçeteyi Düzenle</Button>
             </div>
          </div>
        ))}
      </div>
    </div>
  )

  // Maliyet Analizi
  const renderMaliyet = () => (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-pos-xl font-bold">Kâr/Zarar ve Maliyet Analizi</h3>
        <Button variant="outline" leftIcon={<RefreshCw size={18} />} onClick={() => malYenile()}>
          Yenile
        </Button>
      </div>

      <div className="bg-white dark:bg-surface-900 rounded-pos-lg shadow-sm border border-surface-200 dark:border-surface-800 overflow-hidden flex-1 flex flex-col">
         <div className="overflow-x-auto pos-scrollbar flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-50 dark:bg-surface-950 text-surface-600 dark:text-surface-400 sticky top-0 z-10">
              <tr>
                <th className="p-4 font-medium border-b border-surface-200 dark:border-surface-700">Ürün</th>
                <th className="p-4 font-medium border-b border-surface-200 dark:border-surface-700 text-right">Satış Fiyatı</th>
                <th className="p-4 font-medium border-b border-surface-200 dark:border-surface-700 text-right">Hammadde Maliyeti</th>
                <th className="p-4 font-medium border-b border-surface-200 dark:border-surface-700 text-center">Kâr Marjı</th>
                <th className="p-4 font-medium border-b border-surface-200 dark:border-surface-700 text-right">Satış (Adet)</th>
                <th className="p-4 font-medium border-b border-surface-200 dark:border-surface-700 text-right text-brand-600">Toplam Kâr</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200 dark:divide-surface-800">
              {malYukleniyor ? (
                <tr><td colSpan={6} className="p-8 text-center text-surface-500">Yükleniyor...</td></tr>
              ) : maliyetler.map((mal) => (
                <tr key={mal.urun_id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                  <td className="p-4 font-medium">
                    {mal.urun_adi}
                    <span className="block text-xs text-surface-400">{mal.kategori_adi}</span>
                  </td>
                  <td className="p-4 text-right font-semibold">{formatPara(mal.satis_fiyati)}</td>
                  <td className="p-4 text-right text-red-500">{formatPara(mal.hammadde_maliyeti)}</td>
                  <td className="p-4 text-center">
                    <Badge variant={mal.kar_marji >= 50 ? 'success' : mal.kar_marji >= 30 ? 'warning' : 'danger'}>
                      %{mal.kar_marji}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">{mal.satis_adedi}</td>
                  <td className="p-4 text-right font-bold text-brand-600">{formatPara(mal.toplam_kar)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full bg-surface-100 dark:bg-surface-950 p-4 lg:p-6 overflow-hidden">
      
      {/* Header Tabs */}
      <div className="mb-6 shrink-0">
        <Tabs 
          activeTabId={activeTab} 
          onChange={setActiveTab}
          variant="pills"
          tabs={[
            { id: 'hammaddeler', label: 'Hammaddeler & Stok' },
            { id: 'receteler', label: 'Reçeteler (BOM)' },
            { id: 'maliyet', label: 'Maliyet Analizi', icon: <Calculator size={18} /> },
          ]}
        />
      </div>

      {/* İçerik */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'hammaddeler' && renderHammaddeler()}
        {activeTab === 'receteler' && renderReceteler()}
        {activeTab === 'maliyet' && renderMaliyet()}
      </div>

      {/* Stok Giriş/Çıkış Modalı */}
      <StokIslemModal 
        isOpen={stokIslemModal.acik} 
        hammadde={stokIslemModal.hammadde} 
        islemTipi={stokIslemModal.islemTipi}
        onClose={() => setStokIslemModal({ acik: false, hammadde: null, islemTipi: 'giris' })}
        onSuccess={() => {
          hamYenile()
          success('İşlem Başarılı', 'Stok hareketi kaydedildi.')
          setStokIslemModal({ acik: false, hammadde: null, islemTipi: 'giris' })
        }}
      />
    </div>
  )
}

function StokIslemModal({ isOpen, hammadde, islemTipi, onClose, onSuccess }: any) {
  const [miktar, setMiktar] = useState('')
  const [birimMaliyet, setBirimMaliyet] = useState('')
  const [aciklama, setAciklama] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)
  const { error } = useToast()

  const handleKaydet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!miktar || Number(miktar) <= 0) return
    
    setYukleniyor(true)
    try {
      const islem = await ipcInvoke(STOK_KANALLARI.STOK_GIRIS, {
        hammadde_id: hammadde.id,
        islem_tipi: islemTipi,
        miktar: Number(miktar),
        birim_maliyet: islemTipi === 'giris' && birimMaliyet ? Number(birimMaliyet) : 0,
        aciklama,
        personel_id: 1 // TODO: auth store'dan alınacak
      })
      if (islem.basarili) {
        onSuccess()
      } else {
        error('Hata', islem.hata)
      }
    } catch (err: any) {
      error('Hata', err.message)
    } finally {
      setYukleniyor(false)
    }
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title={`Stok ${islemTipi === 'giris' ? 'Girişi' : 'Çıkışı'} - ${hammadde?.ad}`}
    >
      <form onSubmit={handleKaydet} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Miktar ({hammadde?.birim})</label>
          <input 
            type="number" step="0.01" required
            value={miktar} onChange={e => setMiktar(e.target.value)}
            className="h-12 px-4 rounded-pos border border-surface-300 dark:border-surface-700 bg-surface-50 dark:bg-surface-950 focus:ring-2 focus:ring-brand-500 outline-none"
          />
        </div>
        
        {islemTipi === 'giris' && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Yeni Birim Maliyet (Opsiyonel)</label>
            <input 
              type="number" step="0.01" 
              value={birimMaliyet} onChange={e => setBirimMaliyet(e.target.value)}
              placeholder={`Mevcut: ${hammadde?.maliyet_birim} TL`}
              className="h-12 px-4 rounded-pos border border-surface-300 dark:border-surface-700 bg-surface-50 dark:bg-surface-950 focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Açıklama</label>
          <input 
            type="text" 
            value={aciklama} onChange={e => setAciklama(e.target.value)}
            className="h-12 px-4 rounded-pos border border-surface-300 dark:border-surface-700 bg-surface-50 dark:bg-surface-950 focus:ring-2 focus:ring-brand-500 outline-none"
          />
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button type="button" variant="ghost" onClick={onClose}>İptal</Button>
          <Button type="submit" variant={islemTipi === 'giris' ? 'success' : 'danger'} isLoading={yukleniyor}>
            Kaydet
          </Button>
        </div>
      </form>
    </Modal>
  )
}
