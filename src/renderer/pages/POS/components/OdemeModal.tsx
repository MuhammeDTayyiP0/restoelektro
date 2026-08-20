import React, { useState, useMemo } from 'react'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { formatPara } from '../../../utils/formatters'
import { usePosStore } from '../../../stores/usePosStore'
import { useAuthStore } from '../../../stores/useAuthStore'
import { useIPC, ipcInvoke } from '../../../hooks/useIPC'
import { HESAP_KANALLARI } from '../../../../common/ipc-channels'
import { useToast } from '../../../components/ui/Toast'
import { useNavigate } from 'react-router-dom'
import { Numpad } from '../../../components/ui/Numpad'
import { Banknote, CreditCard, Percent, Tag, CheckCircle2, SplitSquareHorizontal } from 'lucide-react'
import { clsx } from 'clsx'
import IndirimModal from './IndirimModal'

interface OdemeModalProps {
  isOpen: boolean
  onClose: () => void
  toplamTutar: number
}

export default function OdemeModal({ isOpen, onClose, toplamTutar }: OdemeModalProps) {
  const { aktifHesap, hesapAyarla } = usePosStore()
  const { personel } = useAuthStore()
  const { success, error } = useToast()
  const navigate = useNavigate()

  // Durum Yönetimi
  const [girilenTutar, setGirilenTutar] = useState<string>('')
  const [odemeIslemi, setOdemeIslemi] = useState(false)
  const [seciliMiktarlar, setSeciliMiktarlar] = useState<Record<number, number>>({})
  const [indirimModalAcik, setIndirimModalAcik] = useState(false)

  // Hesaplamalar
  const gecerliTutar = parseFloat(girilenTutar) || 0
  
  const hesaplamalar = useMemo(() => {
    // Toplam, İndirim, Net ve Ödenen
    const toplamHesapTutar = aktifHesap?.toplam_tutar || toplamTutar
    const indirimTutar = aktifHesap?.indirim_tutar || 0
    const genelNetTutar = aktifHesap?.net_tutar || Math.max(0, toplamTutar - indirimTutar)
    
    // Geçmiş ödemelerin toplamı
    const odenenTutar = aktifHesap?.odemeler?.reduce((acc: number, o: any) => acc + o.tutar, 0) || 0
    
    // Toplam kalan net tutar
    const kalanGenelNet = Math.max(0, genelNetTutar - odenenTutar)

    // Alman Usulü (Seçili Ürünler) hesaplaması
    let seciliUrunlerToplami = 0;
    const seciliSiparisIdleri = Object.keys(seciliMiktarlar).map(Number);
    
    if (seciliSiparisIdleri.length > 0 && aktifHesap && aktifHesap.siparisler) {
      const siparisler = aktifHesap.siparisler;
      seciliSiparisIdleri.forEach(id => {
        const siparis = siparisler.find((s) => s.id === id);
        const secilenMiktar = seciliMiktarlar[id] || 0;
        if (siparis && siparis.durum !== 'iptal' && !siparis.ikram && secilenMiktar > 0) {
          const birimFiyat = siparis.toplam_fiyat / siparis.miktar;
          seciliUrunlerToplami += birimFiyat * secilenMiktar;
        }
      });
    }

    const seciliIdSayisi = Object.values(seciliMiktarlar).filter(m => m > 0).length;

    let odenecekHedefTutar = seciliIdSayisi > 0 
      ? Math.min(seciliUrunlerToplami, kalanGenelNet) 
      : kalanGenelNet;

    return {
      toplamHesapTutar,
      indirimTutar,
      genelNetTutar,
      odenenTutar,
      kalanGenelNet,
      odenecekHedefTutar,
      almanUsuluAktif: seciliIdSayisi > 0,
      seciliIdSayisi
    }
  }, [aktifHesap, toplamTutar, seciliMiktarlar])

  const { genelNetTutar, odenenTutar, kalanGenelNet, odenecekHedefTutar, almanUsuluAktif, seciliIdSayisi } = hesaplamalar

  // Tutar Giriş İşleyicisi
  const handleTutarGirisi = (deger: string) => {
    if (deger === 'C' || deger === 'clear') {
      setGirilenTutar('')
    } else if (deger === '⌫' || deger === 'backspace') {
      setGirilenTutar(prev => prev.slice(0, -1))
    } else if (deger === '.') {
      if (!girilenTutar.includes('.')) setGirilenTutar(prev => prev + '.')
    } else {
      setGirilenTutar(prev => prev + deger)
    }
  }

  const hizliTutar = (miktar: number) => {
    setGirilenTutar(miktar.toString())
  }

  const handleSiparisSec = (siparis: any) => {
    setSeciliMiktarlar(prev => {
      const id = siparis.id;
      const current = prev[id] || 0;
      const next = current + 1;
      
      const updated = { ...prev };
      if (next > siparis.miktar) {
        delete updated[id];
      } else {
        updated[id] = next;
      }
      return updated;
    })
    setGirilenTutar('') // Ürün seçimi değiştiğinde girilen tutarı sıfırla
  }

  const tumunuSecToggle = () => {
    if (aktifHesap && aktifHesap.siparisler) {
      const gecerliSiparisler = aktifHesap.siparisler.filter((s) => s.durum !== 'iptal' && !s.ikram);
      
      if (seciliIdSayisi === gecerliSiparisler.length && gecerliSiparisler.length > 0) {
        setSeciliMiktarlar({});
      } else {
        const yeniSecimler: Record<number, number> = {};
        gecerliSiparisler.forEach(s => {
          yeniSecimler[s.id] = s.miktar;
        });
        setSeciliMiktarlar(yeniSecimler);
      }
    }
    setGirilenTutar('');
  }

  // Ödeme Alma
  const odemeAl = async (tip: 'nakit' | 'kredi_karti') => {
    if (!aktifHesap) {
      error('Hata', 'Ödeme alınacak aktif bir hesap yok!')
      return
    }

    // Alınacak tutarı belirle (Girilen varsa o, yoksa hedef tutar)
    const tutar = gecerliTutar > 0 ? gecerliTutar : odenecekHedefTutar

    if (tutar <= 0) {
      error('Uyarı', 'Geçerli bir tutar girin veya ürün seçin.')
      return
    }

    setOdemeIslemi(true)
    try {
      const response = await ipcInvoke<any>(HESAP_KANALLARI.ODEME_AL, [
        {
          hesap_id: aktifHesap.id,
          odeme_tipi: tip,
          tutar: tutar,
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
          setGirilenTutar('')
          setSeciliMiktarlar({}) // Kısmi ödeme sonrası seçimleri sıfırla
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

  const handleIndirim = () => {
    setIndirimModalAcik(true);
  }

  const indirimIptal = async () => {
    if (!aktifHesap) return;
    try {
      const response = await ipcInvoke<any>(HESAP_KANALLARI.INDIRIM_UYGULA, {
        hesap_id: aktifHesap.id,
        indirim_tipi: 'tutar',
        deger: 0,
        aciklama: 'İptal'
      })
      if (response && response.basarili) {
        success('Başarılı', 'İndirim iptal edildi.');
        const guncelHesap = await ipcInvoke<any>(HESAP_KANALLARI.DETAY, aktifHesap.id)
        hesapAyarla(guncelHesap, guncelHesap.masa_id)
      }
    } catch (err: any) {
      error('Hata', err.message)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ödeme Paneli"
      size="full" // Genişletilmiş ekran
    >
      <div className="flex flex-col lg:flex-row h-full max-h-[85vh] overflow-hidden bg-surface-50 dark:bg-surface-950 -m-4">
        
        {/* SOL KOLON: ADİSYON ÖZETİ VE ALMAN USULÜ */}
        <div className="flex flex-col w-full lg:w-5/12 xl:w-1/3 bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800">
          
          <div className="flex items-center justify-between p-4 border-b border-surface-200 dark:border-surface-800 bg-surface-100/50 dark:bg-surface-800/50">
            <div>
              <h3 className="font-bold text-surface-900 dark:text-white text-lg">Adisyon Özeti</h3>
              <p className="text-xs text-surface-500">Masa {aktifHesap?.masa_id || 'Yok'} • Hesap No: {aktifHesap?.hesap_no}</p>
            </div>
            <Button variant="outline" size="sm" onClick={tumunuSecToggle} className="text-xs">
              {seciliIdSayisi > 0 ? 'Seçimleri Temizle' : 'Tümünü Seç'}
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 pos-scrollbar">
            {aktifHesap?.siparisler?.filter((s) => s.durum !== 'iptal').map((siparis) => {
              const secilenMiktar = seciliMiktarlar[siparis.id] || 0;
              const isSelected = secilenMiktar > 0;
              const isIkram = Boolean(siparis.ikram);
              return (
                <div 
                  key={siparis.id}
                  onClick={() => !isIkram && handleSiparisSec(siparis)}
                  className={clsx(
                    "flex items-center justify-between p-3 mb-2 rounded-xl border transition-all cursor-pointer select-none",
                    isIkram ? "opacity-60 bg-surface-100 border-transparent grayscale" : 
                    isSelected ? "bg-brand-50 border-brand-300 dark:bg-brand-900/30 dark:border-brand-700 ring-1 ring-brand-400" : "bg-white border-surface-200 dark:bg-surface-800 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-700"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={clsx("w-6 h-6 rounded flex items-center justify-center border font-bold text-xs", isSelected ? "bg-brand-500 border-brand-500 text-white" : "border-surface-300 dark:border-surface-600")}>
                      {isSelected ? secilenMiktar : ''}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-surface-900 dark:text-white text-sm">
                        {siparis.miktar}x {siparis.urun_adi}
                      </span>
                      {siparis.varyant_adi && <span className="text-xs text-surface-500">{siparis.varyant_adi}</span>}
                      {isIkram && <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded inline-block w-max mt-1">İkram</span>}
                    </div>
                  </div>
                  <div className="font-bold text-surface-900 dark:text-white">
                    {formatPara(siparis.toplam_fiyat)}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Adisyon Genel Toplamları */}
          <div className="p-4 bg-surface-50 dark:bg-surface-900 border-t border-surface-200 dark:border-surface-800">
            <div className="flex justify-between items-center text-sm text-surface-600 dark:text-surface-400 mb-1">
              <span>Ara Toplam</span>
              <span>{formatPara(aktifHesap?.toplam_tutar || 0)}</span>
            </div>
            {hesaplamalar.indirimTutar > 0 && (
              <div className="flex justify-between items-center text-sm text-red-500 mb-1 font-medium">
                <span>İndirim</span>
                <span>-{formatPara(hesaplamalar.indirimTutar)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-pos-lg font-bold text-surface-900 dark:text-white mb-2 pt-2 border-t border-surface-200 dark:border-surface-700">
              <span>Genel Toplam</span>
              <span>{formatPara(genelNetTutar)}</span>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button variant="outline" className="flex-1 font-semibold" onClick={handleIndirim} leftIcon={<Tag size={16}/>}>
                {hesaplamalar.indirimTutar > 0 ? 'İndirimi Değiştir' : 'İndirim Uygula'}
              </Button>
              {hesaplamalar.indirimTutar > 0 && (
                <Button variant="danger" className="font-semibold px-4" onClick={indirimIptal}>
                  İptal Et
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* SAĞ KOLON: ÖDEME İŞLEMLERİ */}
        <div className="flex flex-col flex-1 p-6 lg:p-8 bg-surface-50 dark:bg-surface-950">
          
          {/* Tutar Panoları */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white dark:bg-surface-900 rounded-2xl p-5 border border-surface-200 dark:border-surface-800 shadow-sm flex flex-col justify-center">
              <span className="text-surface-500 font-medium text-sm mb-1 uppercase tracking-wider">Kalan Toplam Hesap</span>
              <span className="text-3xl lg:text-4xl font-black text-brand-600 dark:text-brand-400">
                {formatPara(kalanGenelNet)}
              </span>
              {odenenTutar > 0 && (
                <span className="text-xs text-green-600 font-medium mt-2 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded w-max">
                  {formatPara(odenenTutar)} ödendi
                </span>
              )}
            </div>

            <div className={clsx(
              "rounded-2xl p-5 border shadow-sm flex flex-col justify-center transition-colors",
              almanUsuluAktif || girilenTutar
                ? "bg-brand-50 dark:bg-brand-900/20 border-brand-300 dark:border-brand-700 ring-2 ring-brand-500"
                : "bg-surface-100 dark:bg-surface-800 border-surface-200 dark:border-surface-700"
            )}>
              <span className="text-surface-500 font-medium text-sm mb-1 uppercase tracking-wider">
                Tahsil Edilecek
              </span>
              <span className="text-3xl lg:text-5xl font-black text-surface-900 dark:text-white">
                {girilenTutar ? formatPara(parseFloat(girilenTutar)) : formatPara(odenecekHedefTutar)}
              </span>
              {almanUsuluAktif && !girilenTutar && (
                <span className="text-xs text-brand-600 font-medium mt-2 flex items-center gap-1">
                  <SplitSquareHorizontal size={12}/> {seciliIdSayisi} ürün seçili
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col xl:flex-row gap-6 flex-1">
            {/* Numpad ve Hızlı Tutarlar */}
            <div className="flex-1 flex flex-col gap-4">
              <div className="grid grid-cols-4 gap-2">
                <Button variant="outline" onClick={() => hizliTutar(odenecekHedefTutar)} className="col-span-2 font-bold h-14 bg-white dark:bg-surface-900 border-surface-300 shadow-sm text-lg hover:bg-surface-50 dark:hover:bg-surface-800">
                  {almanUsuluAktif ? 'Seçili Tutar' : 'Kalanın Tamamı'}
                </Button>
                <Button variant="outline" onClick={() => hizliTutar(50)} className="font-bold h-14 bg-white dark:bg-surface-900 border-surface-300 shadow-sm text-lg hover:bg-surface-50 dark:hover:bg-surface-800">50₺</Button>
                <Button variant="outline" onClick={() => hizliTutar(100)} className="font-bold h-14 bg-white dark:bg-surface-900 border-surface-300 shadow-sm text-lg hover:bg-surface-50 dark:hover:bg-surface-800">100₺</Button>
                <Button variant="outline" onClick={() => hizliTutar(200)} className="font-bold h-14 bg-white dark:bg-surface-900 border-surface-300 shadow-sm text-lg hover:bg-surface-50 dark:hover:bg-surface-800">200₺</Button>
                <Button variant="outline" onClick={() => hizliTutar(500)} className="font-bold h-14 bg-white dark:bg-surface-900 border-surface-300 shadow-sm text-lg hover:bg-surface-50 dark:hover:bg-surface-800">500₺</Button>
                <Button variant="outline" onClick={() => hizliTutar(1000)} className="font-bold h-14 bg-white dark:bg-surface-900 border-surface-300 shadow-sm text-lg hover:bg-surface-50 dark:hover:bg-surface-800">1000₺</Button>
                <Button variant="outline" onClick={() => hizliTutar(2000)} className="font-bold h-14 bg-white dark:bg-surface-900 border-surface-300 shadow-sm text-lg hover:bg-surface-50 dark:hover:bg-surface-800">2000₺</Button>
              </div>

              <div className="flex-1 bg-white dark:bg-surface-900 rounded-3xl p-4 border border-surface-200 dark:border-surface-800 flex items-center justify-center">
                <Numpad onKeyPress={handleTutarGirisi} />
              </div>
              
              {gecerliTutar > kalanGenelNet && (
                 <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-2xl border border-amber-200 dark:border-amber-800 flex items-center justify-between shadow-sm animate-fade-in">
                   <span className="font-medium text-lg">Para Üstü:</span>
                   <span className="text-2xl font-black">{formatPara(gecerliTutar - kalanGenelNet)}</span>
                 </div>
              )}
            </div>

            {/* Ödeme Tipleri */}
            <div className="w-full xl:w-56 flex flex-col gap-3 justify-end shrink-0">
              <Button 
                variant="success" 
                size="lg" 
                className="h-24 xl:h-32 text-2xl font-bold rounded-2xl shadow-md flex-col gap-2"
                onClick={() => odemeAl('nakit')}
                disabled={odemeIslemi}
              >
                <Banknote size={36} />
                Nakit
              </Button>
              <Button 
                variant="primary" 
                size="lg" 
                className="h-24 xl:h-32 text-2xl font-bold rounded-2xl shadow-md flex-col gap-2"
                onClick={() => odemeAl('kredi_karti')}
                disabled={odemeIslemi}
              >
                <CreditCard size={36} />
                Kredi Kartı
              </Button>
            </div>
          </div>
        </div>

      </div>
      
      {indirimModalAcik && (
        <IndirimModal 
          isOpen={indirimModalAcik}
          onClose={() => setIndirimModalAcik(false)}
          toplamTutar={toplamTutar}
        />
      )}
    </Modal>
  )
}
