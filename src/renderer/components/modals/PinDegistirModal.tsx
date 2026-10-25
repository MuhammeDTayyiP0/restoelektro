import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { KeyRound } from 'lucide-react'
import { clsx } from 'clsx'
import { Numpad } from '../ui/Numpad'
import { useToast } from '../ui/Toast'
import { ipcInvoke } from '../../hooks/useIPC'
import { useAuthStore } from '../../stores/useAuthStore'
import { PERSONEL_KANALLARI } from '../../../common/ipc-channels'

const PIN_TUSLARI = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['C', '0', '⌫'],
]

/**
 * Varsayılan (herkesçe bilinen) PIN ile giriş yapıldığında açılır ve yeni PIN seçilene kadar kapanmaz.
 * Varsayılan PIN'ler telefondan / Cloudflare tünelinden girişte zaten reddedilir.
 */
export default function PinDegistirModal() {
  const { pinDegistirmeli, girisYapildi, personel, pinDegistirildi, cikisYap } = useAuthStore()
  const { success } = useToast()
  const [ilk, setIlk] = useState('')
  const [tekrar, setTekrar] = useState('')
  const [hata, setHata] = useState('')

  if (!girisYapildi || !pinDegistirmeli) return null

  const asama = ilk.length < 4 ? 'ilk' : 'tekrar'
  const deger = asama === 'ilk' ? ilk : tekrar

  const kaydet = async (yeni: string) => {
    const res = await ipcInvoke<any>(PERSONEL_KANALLARI.PIN_DEGISTIR, yeni)
    if (res?.basarili) {
      success('PIN Değiştirildi', 'Yeni PIN\'iniz kaydedildi.')
      pinDegistirildi()
    } else {
      setHata(res?.hata || 'PIN kaydedilemedi')
      setIlk('')
      setTekrar('')
    }
  }

  const tus = (k: string) => {
    setHata('')
    const ayarla = asama === 'ilk' ? setIlk : setTekrar
    if (k === 'C') return ayarla('')
    if (k === '⌫') return ayarla((p) => p.slice(0, -1))
    if (deger.length >= 4) return
    const yeni = deger + k
    ayarla(yeni)
    if (asama === 'tekrar' && yeni.length === 4) {
      if (yeni !== ilk) {
        setHata('PIN\'ler eşleşmedi, tekrar deneyin')
        setIlk('')
        setTekrar('')
      } else {
        void kaydet(yeni)
      }
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[190] flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-[#322C26] bg-[#171410] p-5 shadow-2xl">
        <div className="flex items-center gap-2.5">
          <KeyRound size={20} className="text-brand-400" />
          <h2 className="text-base font-bold text-white">Yeni PIN Belirleyin</h2>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-surface-300">
          {personel?.ad}, varsayılan PIN herkes tarafından bilinir. Devam etmek için kendinize özel 4 haneli bir PIN seçin.
        </p>
        <p className="mt-3 text-center text-xs font-semibold text-surface-400">
          {asama === 'ilk' ? 'Yeni PIN' : 'Yeni PIN (tekrar)'}
        </p>

        <div className="my-3 flex justify-center gap-3">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={clsx(
                'h-3.5 w-3.5 rounded-full border',
                i < deger.length ? 'border-brand-400 bg-brand-400' : 'border-[#4A4238]',
                hata && 'border-rose-500'
              )}
            />
          ))}
        </div>
        <div className="mb-3 h-4 text-center text-xs font-semibold text-rose-400">{hata}</div>

        <Numpad onKeyPress={tus} layout={PIN_TUSLARI} className="mx-auto" />

        <button
          type="button"
          onClick={cikisYap}
          className="mt-4 h-10 w-full rounded-xl text-xs font-semibold text-surface-400 hover:text-surface-200"
        >
          Çıkış yap
        </button>
      </div>
    </div>,
    document.body
  )
}
