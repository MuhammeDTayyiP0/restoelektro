import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ShieldCheck } from 'lucide-react'
import { clsx } from 'clsx'
import { Numpad } from '../ui/Numpad'
import { useToast } from '../ui/Toast'
import { ipcInvoke } from '../../hooks/useIPC'
import { useOnayStore } from '../../stores/useOnayStore'
import { PERSONEL_KANALLARI } from '../../../common/ipc-channels'

const PIN_TUSLARI = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['C', '0', '⌫'],
]

/**
 * Yönetici Onayı — yetkisi olmayan personel iptal / ikram / indirim gibi işlemleri
 * yetkili birinin PIN'iyle yapar. Onay kısa süreli ve denetim kaydına yazılır.
 * Diğer modalların üstünde açıldığı için kendi portalını kullanır (arka planın kilidine dokunmaz).
 */
export default function YoneticiOnayiModal() {
  const istek = useOnayStore((s) => s.istek)
  const { success } = useToast()
  const [pin, setPin] = useState('')
  const [hata, setHata] = useState('')
  const [gonderiliyor, setGonderiliyor] = useState(false)

  useEffect(() => {
    setPin('')
    setHata('')
  }, [istek])

  useEffect(() => {
    if (!istek || pin.length !== 4 || gonderiliyor) return
    setGonderiliyor(true)
    ipcInvoke<any>(PERSONEL_KANALLARI.YONETICI_ONAYI, pin, istek.yetki)
      .then((res) => {
        if (res?.basarili) {
          success('Onaylandı', `${res.onaylayan} onay verdi`)
          istek.coz(true)
        } else {
          setHata(res?.hata || 'Geçersiz PIN')
          setPin('')
        }
      })
      .catch((err: any) => {
        setHata(err?.message || 'Onay alınamadı')
        setPin('')
      })
      .finally(() => setGonderiliyor(false))
  }, [pin, istek, gonderiliyor, success])

  useEffect(() => {
    if (!istek) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') setPin((p) => (p.length < 4 ? p + e.key : p))
      else if (e.key === 'Backspace') setPin((p) => p.slice(0, -1))
      else if (e.key === 'Escape') istek.coz(false)
      else return
      e.preventDefault()
      e.stopPropagation()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [istek])

  if (!istek) return null

  const tus = (k: string) => {
    setHata('')
    if (k === 'C') setPin('')
    else if (k === '⌫') setPin((p) => p.slice(0, -1))
    else setPin((p) => (p.length < 4 ? p + k : p))
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4" style={{ pointerEvents: 'auto' }}>
      <div className="w-full max-w-sm rounded-2xl border border-[#322C26] bg-[#171410] p-5 shadow-2xl">
        <div className="flex items-center gap-2.5">
          <ShieldCheck size={20} className="text-amber-400" />
          <h2 className="text-base font-bold text-white">Yönetici Onayı</h2>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-surface-300">{istek.mesaj}</p>
        <p className="mt-1 text-[11px] text-surface-500">Yetkili bir personel PIN'ini girsin.</p>

        <div className="my-4 flex justify-center gap-3">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={clsx(
                'h-3.5 w-3.5 rounded-full border',
                i < pin.length ? 'border-amber-400 bg-amber-400' : 'border-[#4A4238] bg-transparent',
                hata && 'border-rose-500'
              )}
            />
          ))}
        </div>
        <div className="mb-3 h-4 text-center text-xs font-semibold text-rose-400">{hata}</div>

        <Numpad onKeyPress={tus} layout={PIN_TUSLARI} className="mx-auto" />

        <button
          type="button"
          onClick={() => istek.coz(false)}
          className="mt-4 h-11 w-full rounded-xl border border-[#3A342C] bg-[#1e1a16] text-sm font-semibold text-surface-200 hover:bg-[#322C26]"
        >
          Vazgeç
        </button>
      </div>
    </div>,
    document.body
  )
}
