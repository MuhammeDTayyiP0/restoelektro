import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useMenuStore } from '../../stores/useMenuStore'
import { usePosStore } from '../../stores/usePosStore'
import { useIPC, ipcInvoke, useIPCListener } from '../../hooks/useIPC'
import { HESAP_KANALLARI } from '../../../common/ipc-channels'
import type { Hesap } from '../../../common/types/pos.types'
import { useToast } from '../../components/ui/Toast'

// Alt Bileşenler
import PosMenu from './components/PosMenu'
import PosCart from './components/PosCart'

export default function PosPage() {
  const { hesapId } = useParams<{ hesapId?: string }>()
  const [searchParams] = useSearchParams()
  const masaIdParam = searchParams.get('masa')
  const masaId = masaIdParam ? parseInt(masaIdParam) : null

  const navigate = useNavigate()
  const { error } = useToast()
  
  const { menuyuGetir, yukleniyor: menuYukleniyor } = useMenuStore()
  const { hesapAyarla, sepet, aktifHesap, sepetiTemizle } = usePosStore()
  const [hesapYukleniyor, setHesapYukleniyor] = useState(true)

  // Sayfa yüklendiğinde menüyü getir
  useEffect(() => {
    menuyuGetir()
  }, [menuyuGetir])

  const hesabiYukle = useCallback(async () => {
    setHesapYukleniyor(true)
    try {
      if (hesapId) {
        const hesap = await ipcInvoke<Hesap>(HESAP_KANALLARI.DETAY, parseInt(hesapId))
        if (hesap) {
          hesapAyarla(hesap, hesap.masa_id)
        } else {
          error('Hesap Bulunamadı', 'İstenen hesap veritabanında yok.')
          navigate('/tables')
        }
      } else if (masaId) {
        // Yeni veya varolan açık hesap için
        hesapAyarla(null, masaId)
      } else {
        hesapAyarla(null, null)
      }
    } catch (err: any) {
      error('Hata', err.message)
    } finally {
      setHesapYukleniyor(false)
    }
  }, [hesapId, masaId, hesapAyarla, navigate, error])

  // URL'deki parametrelere göre hesap verilerini çek
  useEffect(() => {
    hesabiYukle()
  }, [hesabiYukle])

  // Anlık güncellemeleri dinle
  useIPCListener('siparis:guncellendi', (guncellenenHesapId: number, guncellenenMasaId?: number) => {
    if (aktifHesap && aktifHesap.id === guncellenenHesapId) {
      // Eğer ekranda o hesaba bakıyorsak, yeniden yükle
      hesabiYukle()
    } else if (!aktifHesap && masaId && masaId === guncellenenMasaId) {
      // Eğer boş bir masaya bakıyorsak ve garson telefondan sipariş göndererek bu masaya hesap açtıysa
      navigate(`/pos/${guncellenenHesapId}`)
    }
  })

  if (menuYukleniyor || hesapYukleniyor) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-500"></div>
      </div>
    )
  }

  return (
    <div className="flex w-full h-full overflow-hidden bg-surface-100 dark:bg-surface-950">
      
      {/* Sol Taraf: Sepet ve Hesap Özeti (Hesap ID veya Masa varsa) */}
      <div className="w-[380px] lg:w-[420px] flex-shrink-0 bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800 flex flex-col h-full shadow-pos-lg z-10">
        <PosCart />
      </div>

      {/* Sağ Taraf: Menü ve Kategoriler */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <PosMenu />
      </div>

    </div>
  )
}
