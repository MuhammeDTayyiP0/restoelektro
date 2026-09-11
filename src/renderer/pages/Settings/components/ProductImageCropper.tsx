import React, { useEffect, useRef, useState } from 'react'
import { Crop, Move, RotateCcw, ZoomIn } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Modal } from '../../../components/ui/Modal'

const ORAN = 16 / 9
const CIKTI_GENISLIK = 1280
const CIKTI_YUKSEKLIK = 720
const GORSEL_HAZIRLAMA_ZAMAN_ASIMI = 10_000
const PROXY_ISTEK_ZAMAN_ASIMI = 12_000
const DESTEKLENEN_GORSEL_TIPLERI = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'])

type Boyut = { width: number; height: number }
type Konum = { x: number; y: number }

interface ProductImageCropperProps {
  kaynak: string | null
  yukleniyor?: boolean
  onIptal: () => void
  onKaydet: (gorsel: Blob) => Promise<void> | void
}

const sinirla = (deger: number, min: number, max: number) => Math.min(Math.max(deger, min), max)

const veriUrlGecerliMi = (kaynak: string) => {
  const eslesme = kaynak.match(/^data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/]+={0,2})$/i)
  return Boolean(eslesme && DESTEKLENEN_GORSEL_TIPLERI.has(eslesme[1].toLowerCase()) && eslesme[2].length > 0)
}

const kaynakDogrula = (kaynak: string) => {
  if (veriUrlGecerliMi(kaynak)) return 'veri' as const
  if (kaynak.startsWith('blob:')) {
    new URL(kaynak)
    return 'blob' as const
  }

  const url = new URL(kaynak)
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Görsel adresi geçersiz.')
  return 'uzak' as const
}

const proxyIleGorselHazirla = async (kaynak: string, signal: AbortSignal): Promise<string> => {
  const cevap = await fetch('http://localhost:3847/api/upload/from-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: kaynak }),
    signal
  })
  const veri = await cevap.json().catch(() => null)
  if (!cevap.ok || !veri?.basarili || typeof veri.image !== 'string' || !veriUrlGecerliMi(veri.image)) {
    throw new Error(veri?.hata || 'Görsel sunucuda hazırlanamadı.')
  }
  return veri.image
}

const canvasBlobAl = (canvas: HTMLCanvasElement): Promise<Blob> => new Promise((resolve, reject) => {
  const zamanAsimi = window.setTimeout(
    () => reject(new Error('Görsel hazırlanırken zaman aşımı oluştu. Lütfen tekrar deneyin.')),
    GORSEL_HAZIRLAMA_ZAMAN_ASIMI
  )

  try {
    canvas.toBlob((blob) => {
      window.clearTimeout(zamanAsimi)
      if (!blob) return reject(new Error('Görsel hazırlanamadı. Lütfen farklı bir görsel deneyin.'))
      resolve(blob)
    }, 'image/jpeg', 0.84)
  } catch (err) {
    window.clearTimeout(zamanAsimi)
    reject(err instanceof Error ? err : new Error('Görsel hazırlanamadı.'))
  }
})

export function ProductImageCropper({ kaynak, yukleniyor = false, onIptal, onKaydet }: ProductImageCropperProps) {
  const cerceveRef = useRef<HTMLDivElement>(null)
  const gorselRef = useRef<HTMLImageElement>(null)
  const [gorselBoyutu, setGorselBoyutu] = useState<Boyut | null>(null)
  const [hazirKaynak, setHazirKaynak] = useState<string | null>(null)
  const [kaynakHazirlaniyor, setKaynakHazirlaniyor] = useState(false)
  const [cerceveBoyutu, setCerceveBoyutu] = useState<Boyut>({ width: 640, height: 360 })
  const [zoom, setZoom] = useState(1)
  const [konum, setKonum] = useState<Konum>({ x: 0, y: 0 })
  const [hazirlamaHatasi, setHazirlamaHatasi] = useState<string | null>(null)
  const [kirpiliyor, setKirpiliyor] = useState(false)
  const suruklemeRef = useRef<{ baslangicX: number; baslangicY: number; konum: Konum } | null>(null)

  useEffect(() => {
    setGorselBoyutu(null)
    setHazirKaynak(null)
    setZoom(1)
    setKonum({ x: 0, y: 0 })
    setHazirlamaHatasi(null)

    if (!kaynak) {
      setKaynakHazirlaniyor(false)
      return
    }

    const controller = new AbortController()
    const zamanAsimi = window.setTimeout(() => controller.abort(), PROXY_ISTEK_ZAMAN_ASIMI)
    let aktif = true
    setKaynakHazirlaniyor(true)

    void (async () => {
      try {
        const tur = kaynakDogrula(kaynak)
        const cozulmusKaynak = tur === 'uzak' ? await proxyIleGorselHazirla(kaynak, controller.signal) : kaynak
        if (aktif) setHazirKaynak(cozulmusKaynak)
      } catch (err) {
        if (!aktif) return
        setHazirlamaHatasi(
          controller.signal.aborted
            ? 'Görsel hazırlanırken zaman aşımı oluştu. Lütfen tekrar deneyin.'
            : err instanceof Error ? err.message : 'Görsel hazırlanamadı. Lütfen farklı bir görsel deneyin.'
        )
      } finally {
        if (aktif) setKaynakHazirlaniyor(false)
      }
    })()

    return () => {
      aktif = false
      window.clearTimeout(zamanAsimi)
      controller.abort()
    }
  }, [kaynak])

  useEffect(() => {
    if (!hazirKaynak || kaynakHazirlaniyor || gorselBoyutu) return
    const zamanAsimi = window.setTimeout(() => {
      setHazirlamaHatasi('Görsel hazırlanamadı. Lütfen farklı bir görsel deneyin.')
    }, GORSEL_HAZIRLAMA_ZAMAN_ASIMI)
    return () => window.clearTimeout(zamanAsimi)
  }, [hazirKaynak, kaynakHazirlaniyor, gorselBoyutu])

  useEffect(() => {
    const cerceve = cerceveRef.current
    if (!cerceve) return
    const guncelle = () => {
      const { width } = cerceve.getBoundingClientRect()
      if (width > 0) setCerceveBoyutu({ width, height: width / ORAN })
    }
    guncelle()
    const observer = new ResizeObserver(guncelle)
    observer.observe(cerceve)
    return () => observer.disconnect()
  }, [kaynak])

  const tabanOlcek = gorselBoyutu
    ? Math.max(cerceveBoyutu.width / gorselBoyutu.width, cerceveBoyutu.height / gorselBoyutu.height)
    : 1
  const renderBoyutu = gorselBoyutu
    ? { width: gorselBoyutu.width * tabanOlcek * zoom, height: gorselBoyutu.height * tabanOlcek * zoom }
    : { width: 0, height: 0 }

  const konumuSinirla = (yeniKonum: Konum, yeniZoom = zoom): Konum => {
    if (!gorselBoyutu) return { x: 0, y: 0 }
    const width = gorselBoyutu.width * tabanOlcek * yeniZoom
    const height = gorselBoyutu.height * tabanOlcek * yeniZoom
    return {
      x: sinirla(yeniKonum.x, -(width - cerceveBoyutu.width) / 2, (width - cerceveBoyutu.width) / 2),
      y: sinirla(yeniKonum.y, -(height - cerceveBoyutu.height) / 2, (height - cerceveBoyutu.height) / 2)
    }
  }

  const zoomDegistir = (yeniZoom: number) => {
    const sinirliZoom = sinirla(yeniZoom, 1, 3)
    setZoom(sinirliZoom)
    setKonum(onceki => konumuSinirla(onceki, sinirliZoom))
  }

  const suruklemeyiBaslat = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!gorselBoyutu) return
    event.currentTarget.setPointerCapture(event.pointerId)
    suruklemeRef.current = { baslangicX: event.clientX, baslangicY: event.clientY, konum }
  }

  const surukle = (event: React.PointerEvent<HTMLDivElement>) => {
    const baslangic = suruklemeRef.current
    if (!baslangic) return
    setKonum(konumuSinirla({
      x: baslangic.konum.x + event.clientX - baslangic.baslangicX,
      y: baslangic.konum.y + event.clientY - baslangic.baslangicY
    }))
  }

  const kirpVeKaydet = async () => {
    const gorsel = gorselRef.current
    if (!gorsel || !gorselBoyutu || kaynakHazirlaniyor) {
      setHazirlamaHatasi('Görsel henüz hazır değil. Lütfen tekrar deneyin.')
      return
    }

    setKirpiliyor(true)
    setHazirlamaHatasi(null)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = CIKTI_GENISLIK
      canvas.height = CIKTI_YUKSEKLIK
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Görsel işleme alanı oluşturulamadı.')

      const oran = CIKTI_GENISLIK / cerceveBoyutu.width
      const x = ((cerceveBoyutu.width - renderBoyutu.width) / 2 + konum.x) * oran
      const y = ((cerceveBoyutu.height - renderBoyutu.height) / 2 + konum.y) * oran
      context.fillStyle = '#1e1a16'
      context.fillRect(0, 0, CIKTI_GENISLIK, CIKTI_YUKSEKLIK)
      context.drawImage(gorsel, x, y, renderBoyutu.width * oran, renderBoyutu.height * oran)

      await onKaydet(await canvasBlobAl(canvas))
    } catch (err) {
      setHazirlamaHatasi(err instanceof Error ? err.message : 'Görsel hazırlanamadı. Lütfen tekrar deneyin.')
    } finally {
      setKirpiliyor(false)
    }
  }

  return (
    <Modal isOpen={Boolean(kaynak)} onClose={yukleniyor ? () => undefined : onIptal} title="Fotoğrafı Kart İçin Kırp" size="lg" closeOnOverlayClick={!yukleniyor}>
      <div className="flex flex-col gap-4">
        <p className="text-xs text-surface-400">Fotoğrafı sürükleyin ve yakınlaştırın. Çıktı, POS, garson ve QR kartları için 16:9 olarak kaydedilir.</p>

        <div
          ref={cerceveRef}
          className="relative w-full aspect-video overflow-hidden rounded-xl border border-[#403830] bg-[#0B0A08] touch-none cursor-grab active:cursor-grabbing"
          onPointerDown={suruklemeyiBaslat}
          onPointerMove={surukle}
          onPointerUp={() => { suruklemeRef.current = null }}
          onPointerCancel={() => { suruklemeRef.current = null }}
          aria-label="Fotoğraf kırpma alanı"
        >
          {hazirKaynak && (
            <img
              ref={gorselRef}
              src={hazirKaynak}
              crossOrigin="anonymous"
              alt="Kırpılacak ürün görseli"
              draggable={false}
              onLoad={(event) => {
                if (!event.currentTarget.naturalWidth || !event.currentTarget.naturalHeight) {
                  setHazirlamaHatasi('Görsel okunamadı. Lütfen farklı bir görsel deneyin.')
                  return
                }
                setHazirlamaHatasi(null)
                setGorselBoyutu({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })
              }}
              onError={() => setHazirlamaHatasi('Görsel yüklenemedi. Lütfen farklı bir görsel deneyin.')}
              className="absolute left-1/2 top-1/2 max-w-none select-none pointer-events-none"
              style={{ width: renderBoyutu.width, height: renderBoyutu.height, transform: `translate(calc(-50% + ${konum.x}px), calc(-50% + ${konum.y}px))` }}
            />
          )}
          {!gorselBoyutu && !hazirlamaHatasi && <div className="absolute inset-0 grid place-items-center text-xs font-mono text-surface-400">Görsel hazırlanıyor…</div>}
          {hazirlamaHatasi && <div role="alert" className="absolute inset-0 grid place-items-center bg-[#0B0A08]/90 px-6 text-center text-xs font-medium text-rose-300">{hazirlamaHatasi}</div>}
          <div className="pointer-events-none absolute inset-0 border-[10px] border-black/25" />
          <div className="pointer-events-none absolute inset-4 border border-white/70 shadow-[0_0_0_1px_rgba(0,0,0,.45)]" />
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-[#322C26] bg-[#110F0C] px-3 py-2.5">
          <ZoomIn size={16} className="shrink-0 text-brand-400" aria-hidden="true" />
          <label htmlFor="urun-gorsel-zoom" className="shrink-0 text-xs font-semibold text-surface-300">Yakınlaştır</label>
          <input
            id="urun-gorsel-zoom"
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={zoom}
            onChange={event => zoomDegistir(Number(event.target.value))}
            disabled={!gorselBoyutu || kaynakHazirlaniyor || yukleniyor || kirpiliyor}
            className="min-w-0 flex-1 accent-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded"
          />
          <button type="button" onClick={() => { setZoom(1); setKonum({ x: 0, y: 0 }) }} disabled={yukleniyor || kirpiliyor} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs text-surface-400 hover:bg-[#1e1a16] hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50">
            <RotateCcw size={14} /> Sıfırla
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#322C26] pt-4">
          <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-surface-500"><Move size={13} /> Sürükle ve ölçekle</span>
          <div className="ml-auto flex gap-2">
            <Button type="button" variant="ghost" onClick={onIptal} disabled={yukleniyor || kirpiliyor}>İptal</Button>
            <Button type="button" variant="primary" onClick={kirpVeKaydet} disabled={!gorselBoyutu || kaynakHazirlaniyor || yukleniyor || kirpiliyor} className="font-bold">
              <Crop size={15} className="mr-1.5" /> {yukleniyor ? 'Kaydediliyor…' : kirpiliyor ? 'Hazırlanıyor…' : 'Kırp ve Kullan'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
