import React, { useState } from 'react'
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
import { Banknote, CreditCard, CheckCircle2 } from 'lucide-react'

interface OdemeModalProps {
  isOpen: boolean
  onClose: () => void
  toplamTutar: number
}

export default function OdemeModal({ isOpen, onClose, toplamTutar }: OdemeModalProps) {
  const { aktifHesap, sepet, hesapAyarla } = usePosStore()
  const { personel } = useAuthStore()
  const { success, error } = useToast()
  const navigate = useNavigate()

  // Eğer hesap açıksa kalan tutar, yoksa sepetteki tutar (aslında sepetteyken ödeme yapılıyorsa önce sipariş edilmeli)
  // Bu yüzden ödeme sadece açık hesap varken yapılmalı (ya da önce hesabı açıp siparişi kaydetmeliyiz).
  // Tasarım gereği PosCart ödeme butonunu sadece aktif hesap varsa gösteriyor.
  // Kalan tutarı hesaplarken yapılan ödemeleri düşmemiz gerekiyor
  const toplamHesapTutar = aktifHesap?.net_tutar || toplamTutar
  const odenenTutar = aktifHesap?.odemeler?.reduce((acc: number, o: any) => acc + o.tutar, 0) || 0
  const odenecekNet = Math.max(0, toplamHesapTutar - odenenTutar)

  const [girilenTutar, setGirilenTutar] = useState<string>('')
  const [odemeIslemi, setOdemeIslemi] = useState(false)

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

  const gecerliTutar = parseFloat(girilenTutar) || 0

  const hizliTutar = (miktar: number) => {
    setGirilenTutar(miktar.toString())
  }

  const odemeAl = async (tip: 'nakit' | 'kredi_karti') => {
    if (!aktifHesap) {
      error('Hata', 'Ödeme alınacak aktif bir hesap yok!')
      return
    }

    const tutar = gecerliTutar > 0 ? gecerliTutar : odenecekNet

    if (tutar <= 0) {
      error('Uyarı', 'Geçerli bir tutar girin.')
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ödeme Al"
      size="xl"
    >
      <div className="flex flex-col md:flex-row gap-6 p-4">
        {/* Sol Taraf: Tutar Bilgileri ve Hızlı Butonlar */}
        <div className="flex-1 flex flex-col">
          
          <div className="bg-brand-50 dark:bg-brand-900/20 p-4 rounded-2xl mb-4 text-center border border-brand-200 dark:border-brand-800">
            <div className="flex justify-between items-center mb-2 px-2 text-surface-600 dark:text-surface-400">
              <span className="font-medium">Genel Toplam:</span>
              <span className="font-bold">{formatPara(toplamHesapTutar)}</span>
            </div>
            {odenenTutar > 0 && (
              <div className="flex justify-between items-center mb-3 px-2 text-green-600 dark:text-green-400 border-b border-brand-200 dark:border-brand-800/50 pb-2">
                <span className="font-medium">Ödenen:</span>
                <span className="font-bold">-{formatPara(odenenTutar)}</span>
              </div>
            )}
            <span className="text-surface-500 font-medium block mt-2">Kalan Tutar</span>
            <h2 className="text-pos-4xl font-black text-brand-600 dark:text-brand-400 leading-none mt-1">
              {formatPara(odenecekNet)}
            </h2>
          </div>

          <div className="bg-surface-100 dark:bg-surface-800 p-4 rounded-2xl mb-6 text-center flex-1 flex flex-col justify-center border border-surface-200 dark:border-surface-700">
            <span className="text-surface-500 font-medium">Alınacak Tutar</span>
            <h2 className="text-pos-3xl font-bold text-surface-900 dark:text-white mt-1">
              {girilenTutar ? formatPara(parseFloat(girilenTutar)) : 'Tümü'}
            </h2>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-6">
            <Button variant="outline" onClick={() => hizliTutar(odenecekNet)} className="col-span-2 font-bold bg-surface-50">Tümü</Button>
            <Button variant="outline" onClick={() => hizliTutar(50)} className="font-bold">50₺</Button>
            <Button variant="outline" onClick={() => hizliTutar(100)} className="font-bold">100₺</Button>
            <Button variant="outline" onClick={() => hizliTutar(200)} className="font-bold">200₺</Button>
            <Button variant="outline" onClick={() => hizliTutar(500)} className="font-bold">500₺</Button>
            <Button variant="outline" onClick={() => hizliTutar(1000)} className="font-bold">1000₺</Button>
            <Button variant="outline" onClick={() => hizliTutar(2000)} className="font-bold">2000₺</Button>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-auto">
            <Button 
              variant="success" 
              size="lg" 
              className="h-20 text-xl font-bold"
              leftIcon={<Banknote size={28} />}
              onClick={() => odemeAl('nakit')}
              disabled={odemeIslemi}
            >
              Nakit
            </Button>
            <Button 
              variant="primary" 
              size="lg" 
              className="h-20 text-xl font-bold"
              leftIcon={<CreditCard size={28} />}
              onClick={() => odemeAl('kredi_karti')}
              disabled={odemeIslemi}
            >
              Kredi Kartı
            </Button>
          </div>
        </div>

        {/* Sağ Taraf: Numpad */}
        <div className="w-full md:w-80 flex-shrink-0 bg-surface-50 dark:bg-surface-900 p-4 rounded-3xl border border-surface-200 dark:border-surface-800">
          <Numpad onKeyPress={handleTutarGirisi} />
          {gecerliTutar > odenecekNet && (
             <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-xl border border-amber-200 dark:border-amber-800 flex items-center justify-between">
               <span className="font-medium">Para Üstü:</span>
               <span className="text-xl font-bold">{formatPara(gecerliTutar - odenecekNet)}</span>
             </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
