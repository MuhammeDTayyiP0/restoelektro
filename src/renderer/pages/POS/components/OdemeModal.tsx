import React, { useState, useMemo } from 'react'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { formatPara } from '../../../utils/formatters'
import { usePosStore } from '../../../stores/usePosStore'
import { useAuthStore } from '../../../stores/useAuthStore'
import { ipcInvoke } from '../../../hooks/useIPC'
import { HESAP_KANALLARI } from '../../../../common/ipc-channels'
import { useToast } from '../../../components/ui/Toast'
import { useNavigate } from 'react-router-dom'
import { Numpad } from '../../../components/ui/Numpad'
import { Banknote, CreditCard, Users, CheckSquare, Square, Utensils } from 'lucide-react'
import { clsx } from 'clsx'

interface OdemeModalProps {
  isOpen: boolean
  onClose: () => void
  toplamTutar: number
}

type OdemeModu = 'tumu' | 'kisi' | 'secili' | 'manuel'

export default function OdemeModal({ isOpen, onClose, toplamTutar }: OdemeModalProps) {
  const { aktifHesap, hesapAyarla } = usePosStore()
  const { personel } = useAuthStore()
  const { success, error } = useToast()
  const navigate = useNavigate()

  const [odemeIslemi, setOdemeIslemi] = useState(false)
  const [odemeModu, setOdemeModu] = useState<OdemeModu>('tumu')
  const [kisiSayisi, setKisiSayisi] = useState(2)
  const [seciliKalemler, setSeciliKalemler] = useState<Set<number>>(new Set())
  const [girilenTutar, setGirilenTutar] = useState<string>('')

  // Siparişleri filtrele (iptal olmayanlar ve ikram olmayanlar tahsilata dahil edilir)
  const gecerliSiparisler = useMemo(() => {
    return aktifHesap?.siparisler?.filter((s: any) => s.ikram === 0 && s.durum !== 'iptal') || []
  }, [aktifHesap])

  const toplamHesapTutar = aktifHesap?.net_tutar || toplamTutar
  const odenenTutar = aktifHesap?.odemeler?.reduce((acc: number, o: any) => acc + o.tutar, 0) || 0
  const odenecekNet = Math.max(0, toplamHesapTutar - odenenTutar)

  // Alınacak Tutarı Hesapla
  const hesaplananTutar = useMemo(() => {
    if (odemeModu === 'manuel') return parseFloat(girilenTutar) || 0
    if (odemeModu === 'tumu') return odenecekNet
    if (odemeModu === 'kisi') return odenecekNet / kisiSayisi
    if (odemeModu === 'secili') {
      let tot = 0
      gecerliSiparisler.forEach((s: any) => {
        if (seciliKalemler.has(s.id)) tot += s.toplam_fiyat
      })
      return tot
    }
    return odenecekNet
  }, [odemeModu, girilenTutar, odenecekNet, kisiSayisi, seciliKalemler, gecerliSiparisler])

  const gecerliTutar = hesaplananTutar

  const handleTutarGirisi = (deger: string) => {
    setOdemeModu('manuel')
    if (deger === 'C' || deger === 'clear') {
      setGirilenTutar('')
      setOdemeModu('tumu')
    } else if (deger === '⌫' || deger === 'backspace') {
      setGirilenTutar(prev => {
        const yeni = prev.slice(0, -1)
        if (!yeni) setOdemeModu('tumu')
        return yeni
      })
    } else if (deger === '.') {
      if (!girilenTutar.includes('.')) setGirilenTutar(prev => prev + '.')
    } else {
      setGirilenTutar(prev => prev + deger)
    }
  }

  const toggleKalem = (id: number) => {
    setOdemeModu('secili')
    setGirilenTutar('')
    setSeciliKalemler(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      
      // Eğer hepsi seçildiyse Tümü moduna geç
      if (next.size === gecerliSiparisler.length) {
        setOdemeModu('tumu')
        return new Set()
      }
      return next
    })
  }

  const setTumu = () => {
    setOdemeModu('tumu')
    setGirilenTutar('')
    setSeciliKalemler(new Set())
  }

  const odemeAl = async (tip: string) => {
    if (!aktifHesap) {
      error('Hata', 'Ödeme alınacak aktif bir hesap yok!')
      return
    }

    if (gecerliTutar <= 0) {
      error('Uyarı', 'Lütfen 0\'dan büyük bir tutar girin.')
      return
    }

    setOdemeIslemi(true)
    try {
      const response = await ipcInvoke<any>(HESAP_KANALLARI.ODEME_AL, [
        {
          hesap_id: aktifHesap.id,
          odeme_tipi: tip,
          tutar: gecerliTutar,
          personel_id: personel?.id || 1
        }
      ])

      if (response && response.basarili) {
        if (response.kapandi) {
          success('Hesap Kapandı', `Hesap tamamen ödendi. Para üstü: ${formatPara(response.para_ustu || 0)}`)
          onClose()
          hesapAyarla(null, null)
          navigate('/tables')
        } else {
          success('Kısmi Ödeme', `Ödeme alındı. Kalan tutar: ${formatPara(response.kalan)}`)
          // Hesabı güncel tutarla tekrar çekmek lazım
          const guncelHesap = await ipcInvoke<any>(HESAP_KANALLARI.DETAY, aktifHesap.id)
          hesapAyarla(guncelHesap, guncelHesap.masa_id)
          // UI reset
          setGirilenTutar('')
          setOdemeModu('tumu')
          setSeciliKalemler(new Set())
        }
      } else {
        error('Ödeme Başarısız', response.hata || 'Bilinmeyen bir hata oluştu')
      }
    } catch (err: any) {
      error('Hata', err.message)
    } finally {
      setOdemeIslemi(false)
    }
  }

  // Dinamik Hızlı Tutar Seçenekleri (Toplam bakiyeye göre akıllı öneriler)
  const hizliTutarlar = useMemo(() => {
    const defaultVals = [50, 100, 200, 500]
    if (odenecekNet > 0) {
      const usteYuvarla = Math.ceil(odenecekNet / 50) * 50
      let dinamik = [odenecekNet] // Tümü
      if (usteYuvarla > odenecekNet) dinamik.push(usteYuvarla)
      if (usteYuvarla + 50 > odenecekNet) dinamik.push(usteYuvarla + 50)
      if (usteYuvarla + 100 > odenecekNet) dinamik.push(usteYuvarla + 100)
      return Array.from(new Set([...dinamik, ...defaultVals])).sort((a,b) => a-b).filter(v => v >= odenecekNet).slice(0, 4)
    }
    return defaultVals
  }, [odenecekNet])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ödeme Tahsilatı"
      size="full"
    >
      <div className="flex h-full -m-6 overflow-hidden bg-surface-50 dark:bg-surface-950 rounded-b-pos-lg">
        
        {/* SOL PANEL: Adisyon Özeti */}
        <div className="w-1/3 flex flex-col border-r border-surface-200 dark:border-surface-800 bg-white/50 dark:bg-surface-900/50">
           <div className="p-4 border-b border-surface-200 dark:border-surface-800 flex justify-between items-center shadow-sm z-10 bg-white dark:bg-surface-900">
             <h3 className="font-bold text-surface-700 dark:text-surface-300">Sipariş Özeti</h3>
             <Button variant="ghost" size="sm" onClick={() => {
                if (seciliKalemler.size === gecerliSiparisler.length) {
                   setTumu()
                } else {
                   setSeciliKalemler(new Set(gecerliSiparisler.map((s: any) => s.id)))
                   setOdemeModu('secili')
                   setGirilenTutar('')
                }
             }}>
               Tümünü Seç
             </Button>
           </div>
           <div className="flex-1 overflow-y-auto pos-scrollbar p-3">
             {gecerliSiparisler.map((s: any) => {
               const secili = seciliKalemler.has(s.id)
               return (
                 <div 
                   key={s.id} 
                   onClick={() => toggleKalem(s.id)} 
                   className={clsx(
                     "flex items-center p-4 mb-3 rounded-2xl cursor-pointer border-2 transition-all hover:shadow-md", 
                     secili ? "bg-brand-50 border-brand-400 dark:bg-brand-900/30 dark:border-brand-600 shadow-sm" : "bg-white border-transparent shadow-sm hover:border-surface-300 dark:bg-surface-800 dark:hover:border-surface-600"
                   )}
                 >
                    <div className={clsx("mr-4 transition-colors", secili ? "text-brand-500" : "text-surface-300")}>
                      {secili ? <CheckSquare size={28} /> : <Square size={28} />}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-pos-base text-surface-900 dark:text-white">
                        {s.porsiyon && s.porsiyon !== 1 ? `${s.porsiyon === 2 ? 'Duble (2)' : s.porsiyon} ` : ''}{s.urun_adi}
                      </div>
                      <div className="text-sm text-surface-500 font-medium">
                        {s.miktar} {s.urun_birim || 'Adet'} x {formatPara(s.birim_fiyat)}
                      </div>
                    </div>
                    <div className="font-black text-pos-lg text-surface-900 dark:text-white">
                      {formatPara(s.toplam_fiyat)}
                    </div>
                 </div>
               )
             })}
           </div>
           
           {/* Ödenenler Listesi */}
           {aktifHesap?.odemeler && aktifHesap.odemeler.length > 0 && (
             <div className="p-4 border-t border-surface-200 dark:border-surface-800 bg-surface-100 dark:bg-surface-950 z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
               <h4 className="text-xs font-black text-surface-500 uppercase mb-3 tracking-wider">Geçmiş Tahsilatlar</h4>
               <div className="max-h-32 overflow-y-auto pos-scrollbar pr-2">
                 {aktifHesap.odemeler.map((o: any) => (
                   <div key={o.id} className="flex justify-between items-center text-sm mb-2 bg-white dark:bg-surface-900 p-2 rounded-lg border border-surface-200 dark:border-surface-800">
                     <div className="flex flex-col">
                       <span className="font-bold text-surface-700 dark:text-surface-300 capitalize">{o.odeme_tipi.replace('_', ' ')}</span>
                       <span className="text-xs text-surface-400">{new Date(o.odeme_zamani).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}</span>
                     </div>
                     <span className="font-black text-green-600 dark:text-green-400">{formatPara(o.tutar)}</span>
                   </div>
                 ))}
               </div>
             </div>
           )}
        </div>

        {/* ORTA PANEL: Kalan / Parçalı Ödeme İşlemleri */}
        <div className="flex-1 flex flex-col border-r border-surface-200 dark:border-surface-800 p-8 bg-white dark:bg-surface-950">
           <div className="bg-gradient-to-br from-brand-500 to-brand-700 p-8 rounded-3xl text-center mb-8 shadow-lg shadow-brand-500/20 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-black opacity-10 rounded-full blur-xl"></div>
              
              <div className="text-brand-100 font-semibold mb-1 relative z-10 text-lg uppercase tracking-wider">Kalan Bakiye</div>
              <div className="text-6xl font-black relative z-10 drop-shadow-sm">
                 {formatPara(odenecekNet)}
              </div>
           </div>

           <h3 className="font-bold text-pos-xl text-surface-800 dark:text-surface-200 mb-6">Tahsilat Yöntemi</h3>
           <div className="grid grid-cols-2 gap-4 mb-8">
              <Button 
                variant={odemeModu === 'tumu' ? 'primary' : 'outline'} 
                className={clsx("h-20 text-xl font-bold rounded-2xl border-2 transition-all", odemeModu === 'tumu' ? "shadow-md shadow-brand-500/20" : "hover:border-brand-300")}
                onClick={setTumu}
              >
                 Tümünü Öde
              </Button>
              <Button 
                variant={odemeModu === 'kisi' ? 'primary' : 'outline'} 
                className={clsx("h-20 text-xl font-bold rounded-2xl border-2 transition-all", odemeModu === 'kisi' ? "shadow-md shadow-brand-500/20" : "hover:border-brand-300")}
                leftIcon={<Users size={24} />}
                onClick={() => {
                   setOdemeModu('kisi')
                   setGirilenTutar('')
                }}
              >
                 Alman Usulü
              </Button>
           </div>

           {odemeModu === 'kisi' && (
              <div className="bg-surface-50 dark:bg-surface-900 p-8 rounded-3xl border border-surface-200 dark:border-surface-800 mb-8 flex flex-col items-center animate-scale-in">
                 <span className="text-surface-500 font-bold mb-6 text-lg uppercase tracking-wider">Kişi Sayısı</span>
                 <div className="flex items-center gap-6">
                    <Button variant="outline" className="w-20 h-20 rounded-full text-4xl font-bold shadow-sm" onClick={() => setKisiSayisi(Math.max(2, kisiSayisi - 1))}>-</Button>
                    <span className="text-6xl font-black w-24 text-center text-brand-600 dark:text-brand-400">{kisiSayisi}</span>
                    <Button variant="outline" className="w-20 h-20 rounded-full text-4xl font-bold shadow-sm" onClick={() => setKisiSayisi(kisiSayisi + 1)}>+</Button>
                 </div>
              </div>
           )}

           <div className="mt-auto bg-surface-100 dark:bg-surface-800/50 p-8 rounded-3xl border-2 border-surface-200 dark:border-surface-700 text-center relative overflow-hidden">
              <div className="text-surface-500 font-bold mb-2 text-lg uppercase tracking-wider">Tahsil Edilecek Tutar</div>
              <div className={clsx("text-5xl font-black transition-colors", gecerliTutar > 0 ? "text-brand-600 dark:text-brand-400" : "text-surface-900 dark:text-white")}>
                 {formatPara(gecerliTutar)}
              </div>
           </div>
        </div>

        {/* SAĞ PANEL: Numpad ve Ödeme Tipleri */}
        <div className="w-[420px] p-8 bg-surface-50 dark:bg-surface-900 flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.02)] z-10 relative">
           
           {/* Hızlı Tutar Butonları (Dinamik) */}
           <div className="grid grid-cols-4 gap-3 mb-8">
              {hizliTutarlar.map((hizli, index) => (
                 <Button 
                   key={index} 
                   variant="outline" 
                   className={clsx("font-black text-lg h-16 rounded-xl border-2 transition-all hover:bg-brand-50 hover:border-brand-300 hover:text-brand-700", hizli === gecerliTutar && "bg-brand-100 border-brand-400 text-brand-800")}
                   onClick={() => {
                     setOdemeModu('manuel')
                     setGirilenTutar(hizli.toString())
                   }}
                 >
                    {hizli === odenecekNet ? 'TÜMÜ' : hizli}
                 </Button>
              ))}
           </div>

           {/* Numpad */}
           <div className="bg-white dark:bg-surface-950 p-6 rounded-[2rem] border border-surface-200 dark:border-surface-800 shadow-sm mb-6">
             <Numpad onKeyPress={handleTutarGirisi} />
           </div>

           {/* Para Üstü Uyarı */}
           {gecerliTutar > odenecekNet && (
             <div className="mb-6 p-5 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 rounded-2xl border-2 border-amber-200 dark:border-amber-800/50 flex items-center justify-between animate-scale-in shadow-sm">
               <span className="font-bold text-lg uppercase tracking-wide">Para Üstü</span>
               <span className="text-3xl font-black">{formatPara(gecerliTutar - odenecekNet)}</span>
             </div>
           )}

           {/* Ödeme Tipleri */}
           <div className="grid grid-cols-2 gap-4 mt-auto">
             <Button 
               variant="success" 
               className="h-24 flex-col gap-2 text-pos-base font-black shadow-lg shadow-green-500/20 rounded-2xl"
               onClick={() => odemeAl('nakit')}
               disabled={odemeIslemi || gecerliTutar <= 0}
             >
               <Banknote size={32} />
               NAKİT
             </Button>
             <Button 
               variant="primary" 
               className="h-24 flex-col gap-2 text-pos-base font-black shadow-lg shadow-brand-500/20 rounded-2xl"
               onClick={() => odemeAl('kredi_karti')}
               disabled={odemeIslemi || gecerliTutar <= 0}
             >
               <CreditCard size={32} />
               KREDİ KARTI
             </Button>
             <Button 
               variant="outline" 
               className="h-16 flex-col gap-1 text-sm font-bold col-span-2 text-orange-600 border-orange-200 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-800 dark:hover:bg-orange-900/30 rounded-2xl border-2"
               onClick={() => odemeAl('yemek_karti')}
               disabled={odemeIslemi || gecerliTutar <= 0}
             >
               <div className="flex items-center gap-2">
                 <Utensils size={20} />
                 <span>YEMEK KARTI (Sodexo vb.)</span>
               </div>
             </Button>
           </div>
        </div>

      </div>
    </Modal>
  )
}
