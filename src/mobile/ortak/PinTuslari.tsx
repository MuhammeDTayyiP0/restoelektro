import React, { useEffect, useRef } from 'react'

const TUSLAR: Array<{ k: string; etiket: string; fn?: boolean }> = [
  { k: '1', etiket: '1' }, { k: '2', etiket: '2' }, { k: '3', etiket: '3' },
  { k: '4', etiket: '4' }, { k: '5', etiket: '5' }, { k: '6', etiket: '6' },
  { k: '7', etiket: '7' }, { k: '8', etiket: '8' }, { k: '9', etiket: '9' },
  { k: 'C', etiket: 'Temizle', fn: true }, { k: '0', etiket: '0' }, { k: 'B', etiket: 'Sil', fn: true },
]

/**
 * Telefon PIN tuş takımı: pointerdown ile basılır, çift dokunuş yakınlaştırmaz,
 * hızlı çift basışta karakter iki kez girilmez. Klavyeden rakam / Backspace / Escape de çalışır.
 * React'in touch dinleyicileri pasif olduğundan preventDefault için yerel dinleyiciler kullanılır.
 */
export function PinTuslari({
  id,
  className,
  onTus,
  klavye = true,
  tusSinifi,
  etiketler,
}: {
  id?: string
  className?: string
  onTus: (k: string) => void
  klavye?: boolean
  tusSinifi?: (fn: boolean) => string | undefined
  /** 'C' (temizle) ve 'B' (sil) tuşlarının görünümü */
  etiketler?: Partial<Record<'C' | 'B', React.ReactNode>>
}) {
  const ref = useRef<HTMLDivElement>(null)
  const onTusRef = useRef(onTus)
  onTusRef.current = onTus

  useEffect(() => {
    const pad = ref.current
    if (!pad) return
    const durdur = (e: Event) => { e.preventDefault(); e.stopPropagation() }
    const bas = (e: PointerEvent) => {
      const b = (e.target as HTMLElement).closest?.('button')
      if (!b) return
      durdur(e)
      if (e.pointerType === 'mouse' && e.button !== 0) return
      b.classList.add('down')
      try { b.setPointerCapture?.(e.pointerId) } catch { /* yok say */ }
      onTusRef.current(b.getAttribute('data-k') || '')
    }
    const birak = (e: PointerEvent) => (e.target as HTMLElement).closest?.('button')?.classList.remove('down')
    const iptal = () => pad.querySelectorAll('.down').forEach((b) => b.classList.remove('down'))
    const dokunmaYedek = (e: TouchEvent) => {
      const b = (e.target as HTMLElement).closest?.('button')
      if (!b) return
      durdur(e)
      onTusRef.current(b.getAttribute('data-k') || '')
    }

    pad.addEventListener('pointerdown', bas, { passive: false })
    pad.addEventListener('pointerup', birak)
    pad.addEventListener('pointercancel', iptal)
    pad.addEventListener('click', durdur, true)
    pad.addEventListener('dblclick', durdur, true)
    pad.addEventListener('touchstart', window.PointerEvent ? durdur : dokunmaYedek, { passive: false })
    pad.addEventListener('touchend', durdur, { passive: false })
    pad.addEventListener('gesturestart', durdur as any, { passive: false } as any)
    return () => {
      pad.removeEventListener('pointerdown', bas)
      pad.removeEventListener('pointerup', birak)
      pad.removeEventListener('pointercancel', iptal)
      pad.removeEventListener('click', durdur, true)
      pad.removeEventListener('dblclick', durdur, true)
      pad.removeEventListener('touchstart', window.PointerEvent ? durdur : dokunmaYedek)
      pad.removeEventListener('touchend', durdur)
      pad.removeEventListener('gesturestart', durdur as any)
    }
  }, [])

  useEffect(() => {
    if (!klavye) return
    const tus = (e: KeyboardEvent) => {
      const hedef = e.target as HTMLElement | null
      if (hedef && ['INPUT', 'TEXTAREA', 'SELECT'].includes(hedef.tagName)) return
      if (e.key >= '0' && e.key <= '9') { e.preventDefault(); onTusRef.current(e.key) }
      else if (e.key === 'Backspace') { e.preventDefault(); onTusRef.current('B') }
      else if (e.key === 'Escape') onTusRef.current('C')
    }
    document.addEventListener('keydown', tus)
    return () => document.removeEventListener('keydown', tus)
  }, [klavye])

  return (
    <div id={id} className={className} ref={ref}>
      {TUSLAR.map((t) => (
        <button key={t.k} type="button" data-k={t.k} className={tusSinifi ? tusSinifi(Boolean(t.fn)) : (t.fn ? 'fn' : undefined)}>
          {(t.k === 'C' || t.k === 'B') && etiketler?.[t.k] !== undefined ? etiketler[t.k] : t.etiket}
        </button>
      ))}
    </div>
  )
}
