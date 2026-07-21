import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Users, Clock } from 'lucide-react'
import { useIPC, useIPCListener } from '../../hooks/useIPC'
import { MASA_KANALLARI } from '../../../common/ipc-channels'
import type { Masa, Bolum } from '../../../common/types/table.types'
import { Button } from '../../components/ui/Button'
import { Tabs } from '../../components/ui/Tabs'
import { formatPara, gecenDakikaHesapla } from '../../utils/formatters'
import { DURUM_RENKLERI } from '../../utils/constants'
import { clsx } from 'clsx'

export default function TablesPage() {
  const navigate = useNavigate()
  const [seciliBolum, setSeciliBolum] = useState<string>(() => sessionStorage.getItem('seciliBolum') || '')

  useEffect(() => {
    sessionStorage.setItem('seciliBolum', seciliBolum)
  }, [seciliBolum])

  const { veri: bolumler, yukleniyor: bolumlerYukleniyor } = useIPC<Bolum[]>(MASA_KANALLARI.BOLUMLER, [])
  const { veri: masalar, yukleniyor: masalarYukleniyor, yenile: masalariYenile } = useIPC<Masa[]>(MASA_KANALLARI.MASALAR, [])

  // Anlık güncellemeleri dinle (Garson vs)
  useIPCListener('masalar:guncellendi', () => {
    masalariYenile()
  })

  // 1 dakikada bir masaları yenile (süreyi güncellemek için)
  useEffect(() => {
    const timer = setInterval(() => {
      masalariYenile()
    }, 60000)
    return () => clearInterval(timer)
  }, [masalariYenile])

  // Seçili bölüme göre filtrele
  const filtrelenmisMasalar = seciliBolum 
    ? masalar.filter(m => m.bolum_id === parseInt(seciliBolum))
    : []

  const secilenBolumDetayi = bolumler.find(b => b.id.toString() === seciliBolum)

  const masaTikla = (masa: Masa) => {
    if (masa.aktif_hesap_id) {
      navigate(`/pos/${masa.aktif_hesap_id}`)
    } else {
      // Yeni hesap açmak üzere POS'a git
      navigate(`/pos?masa=${masa.id}`)
    }
  }

  if (bolumlerYukleniyor && masalarYukleniyor) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-surface-500 animate-pulse text-xl">Masalar yükleniyor...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {seciliBolum !== '' && (
            <Button variant="secondary" onClick={() => setSeciliBolum('')}>
              Geri
            </Button>
          )}
          <h2 className="text-pos-2xl font-bold text-surface-900 dark:text-white">
            {secilenBolumDetayi ? secilenBolumDetayi.ad : 'Bölüm Seçiniz'}
          </h2>
        </div>
        
        {/* Hızlı İşlemler (Paket Sipariş, vb. eklenebilir) */}
        <div className="flex gap-3">
          <Button variant="secondary" leftIcon={<Users size={20} />}>
            Müşteriler
          </Button>
          <Button variant="primary" leftIcon={<Plus size={20} />}>
            Yeni Paket Sipariş
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pos-scrollbar pr-2">
        {seciliBolum === '' ? (
          /* Bölüm Seçim Ekranı */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {bolumler.map(bolum => (
              <button
                key={bolum.id}
                onClick={() => setSeciliBolum(bolum.id.toString())}
                className="flex flex-col items-center justify-center h-32 rounded-pos-lg shadow-pos bg-white dark:bg-surface-800 border-2 border-transparent hover:border-brand-500 transition-all touch-feedback group"
              >
                <span className="text-pos-xl font-bold text-surface-800 dark:text-white mb-2 group-hover:text-brand-600 dark:group-hover:text-brand-400">
                  {bolum.ad}
                </span>
                <span className="text-sm text-surface-500 bg-surface-100 dark:bg-surface-700 px-3 py-1 rounded-full">
                  {bolum.masa_sayisi || 0} Masa
                </span>
              </button>
            ))}
          </div>
        ) : (
          /* Masa Grid Ekranı */
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filtrelenmisMasalar.map(masa => {
                const doluMu = masa.durum === 'dolu' || !!masa.aktif_hesap_id
                const rezerveMi = masa.durum === 'rezerve'
                const arkaPlan = doluMu 
                  ? DURUM_RENKLERI.MASA.dolu 
                  : rezerveMi 
                    ? DURUM_RENKLERI.MASA.rezerve 
                    : DURUM_RENKLERI.MASA.bos

                const gecenSure = doluMu && masa.acilis_zamani 
                  ? gecenDakikaHesapla(masa.acilis_zamani) 
                  : 0

                return (
                  <button
                    key={masa.id}
                    onClick={() => masaTikla(masa)}
                    className={clsx(
                      'relative flex flex-col items-center justify-center h-32 rounded-pos-lg shadow-pos p-3 transition-all touch-feedback',
                      arkaPlan,
                      doluMu ? 'hover:brightness-110' : 'hover:bg-surface-300 dark:hover:bg-surface-600'
                    )}
                  >
                    {/* Masa Numarası */}
                    <span className="text-pos-3xl font-bold mb-1">
                      {masa.numara}
                    </span>

                    {/* Alt Bilgiler */}
                    {doluMu ? (
                      <>
                        <span className="text-sm font-semibold opacity-90 truncate w-full text-center">
                          {formatPara(masa.aktif_hesap_tutari)}
                        </span>
                        <div className="absolute top-2 right-2 flex items-center gap-1 text-xs opacity-75 bg-black/20 px-1.5 py-0.5 rounded-full">
                          <Clock size={12} />
                          <span>{gecenSure}d</span>
                        </div>
                      </>
                    ) : (
                      <span className="text-sm opacity-70">
                        Kapasite: {masa.kapasite}
                      </span>
                    )}
                    
                    {/* Masa Birleşti İkonu */}
                    {masa.durum === 'birlesti' && (
                      <div className="absolute bottom-2 right-2 bg-yellow-500 rounded-full w-3 h-3 shadow-md" />
                    )}
                  </button>
                )
              })}
            </div>

            {filtrelenmisMasalar.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-surface-400">
                <p className="text-xl">Bu bölümde masa bulunmuyor.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
