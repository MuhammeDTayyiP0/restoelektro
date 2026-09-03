import React, { useState, useMemo, useCallback, useEffect } from 'react'
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
import { 
  Banknote, 
  CreditCard, 
  Tag, 
  SplitSquareHorizontal, 
  Receipt, 
  CheckCircle2, 
  Clock, 
  Coins, 
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react'
import { clsx } from 'clsx'
import { motion } from 'framer-motion'
import IndirimModal from './IndirimModal'
import MiktarModal from './MiktarModal'

// ============================================================
// Memoized Alt Bileşenler
// ============================================================

const SiparisItemRow = React.memo(({ 
  siparis, 
  secilenMiktar, 
  isIkram, 
  onMiktarDegistir, 
  onMiktarAyarla 
}: { 
  siparis: any, 
  secilenMiktar: number, 
  isIkram: boolean, 
  onMiktarDegistir: (siparis: any, degisim: number, e?: React.MouseEvent) => void,
  onMiktarAyarla: (siparis: any) => void 
}) => {
  const isSelected = secilenMiktar > 0;
  const birimFiyat = siparis.toplam_fiyat / (siparis.miktar || 1);
  const seciliTutar = birimFiyat * secilenMiktar;
  
  return (
    <div 
      onClick={() => !isIkram && onMiktarDegistir(siparis, secilenMiktar < siparis.miktar ? 1 : -secilenMiktar)}
      className={clsx(
        "flex items-center justify-between p-3 mb-1.5 rounded-xl border transition-all select-none",
        isIkram 
          ? "opacity-50 bg-[#0E131E] border-[#1C2538] grayscale cursor-default" 
          : isSelected 
            ? "bg-[#142136] border-cyan-500 ring-1 ring-cyan-400/50 cursor-pointer" 
            : "bg-[#0C1018] border-[#1A2234] hover:bg-[#111722] hover:border-[#26324A] cursor-pointer"
      )}
    >
      <div className="flex items-center gap-3">
        {/* Seçim İndikatörü */}
        <div className={clsx(
          "w-6 h-6 rounded-lg flex items-center justify-center border font-mono font-bold text-xs shrink-0 transition-colors",
          isIkram 
            ? "border-[#222C42] text-slate-400" 
            : isSelected 
              ? "bg-cyan-500 border-cyan-400 text-black shadow-sm" 
              : "border-[#25324A] text-slate-400 bg-[#090D15]"
        )}>
          {isSelected ? secilenMiktar : ''}
        </div>

        <div className="flex flex-col">
          <span className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
            <span>{siparis.miktar}x</span>
            <span>{siparis.urun_adi || 'Bilinmeyen Ürün'}</span>
            {isIkram && (
              <span className="text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 px-1.5 py-0.5 rounded uppercase">
                İkram
              </span>
            )}
          </span>
          {siparis.varyant_adi && (
            <span className="text-xs text-slate-400 font-mono">
              [{siparis.varyant_adi}]
            </span>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {!isIkram && siparis.miktar > 1 && (
          <div 
            className="flex items-center gap-0.5 border border-[#222E44] rounded-lg p-0.5 bg-[#090D15] shadow-inner" 
            onClick={e => e.stopPropagation()}
          >
             <button 
               className="w-7 h-7 flex items-center justify-center rounded-md text-slate-300 hover:bg-[#162133] disabled:opacity-25 disabled:hover:bg-transparent font-bold text-sm"
               disabled={secilenMiktar <= 0}
               onClick={(e) => onMiktarDegistir(siparis, -1, e)}
             >
               -
             </button>
             <button 
               className="w-8 h-7 text-center text-xs font-mono font-black bg-[#121A28] border border-[#202C40] rounded text-cyan-400 hover:bg-[#182337] transition-colors"
               onClick={(e) => { e.stopPropagation(); onMiktarAyarla(siparis); }}
               title="Miktarı belirlemek için dokunun"
             >
               {secilenMiktar === 0 ? '0' : secilenMiktar}
             </button>
             <button 
               className="w-7 h-7 flex items-center justify-center rounded-md text-slate-300 hover:bg-[#162133] disabled:opacity-25 disabled:hover:bg-transparent font-bold text-sm"
               disabled={secilenMiktar >= siparis.miktar}
               onClick={(e) => onMiktarDegistir(siparis, 1, e)}
             >
               +
             </button>
          </div>
        )}
        <div className="text-right shrink-0">
          <span className={clsx(
            "text-sm font-mono font-bold tabular-nums block",
            isSelected ? "text-cyan-300" : "text-slate-200"
          )}>
            {formatPara(isSelected ? seciliTutar : siparis.toplam_fiyat)}
          </span>
          {isSelected && secilenMiktar < siparis.miktar && (
            <span className="text-[10px] font-mono text-slate-400 block">
              Toplam: {formatPara(siparis.toplam_fiyat)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
});

/** Ödenen ürünlerin satırı – statik */
const OdenmisItemRow = React.memo(({ siparis }: { siparis: any }) => (
  <div className="flex items-center justify-between p-2.5 mb-1.5 rounded-xl border border-[#182030] bg-[#0A0E17]/60 opacity-60 select-none">
    <div className="flex items-center gap-2.5">
      <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
      <div className="flex flex-col">
        <span className="font-bold text-slate-400 text-xs line-through">
          {siparis.miktar}x {siparis.urun_adi || 'Ürün'}
        </span>
        {siparis.varyant_adi && <span className="text-[10px] text-slate-400 line-through">[{siparis.varyant_adi}]</span>}
      </div>
    </div>
    
    <div className="flex items-center gap-2">
      <span className="text-[9px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded uppercase">
        Ödendi
      </span>
      <div className="font-mono text-xs font-bold text-slate-400 shrink-0 line-through">
        {formatPara(siparis.toplam_fiyat)}
      </div>
    </div>
  </div>
));

/** Hızlı tutar butonları – Endüstriyel Dokunmatik Presetler */
const HizliTutarButonlari = React.memo(({ 
  odenecekHedefTutar, 
  almanUsuluAktif, 
  onHizliTutar 
}: { 
  odenecekHedefTutar: number, 
  almanUsuluAktif: boolean, 
  onHizliTutar: (miktar: number) => void 
}) => (
  <div className="grid grid-cols-4 gap-1.5 sm:gap-2 flex-shrink-0 shrink-0">
    <button 
      type="button"
      onClick={() => onHizliTutar(odenecekHedefTutar)} 
      className="col-span-2 font-mono font-bold h-9 sm:h-10 xl:h-11 rounded-lg sm:rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm text-xs hover:bg-cyan-500/30 active:scale-95 flex items-center justify-center gap-1.5 sm:gap-2 transition-all uppercase tracking-wider flex-shrink-0 shrink-0"
    >
      <Coins size={15} />
      {almanUsuluAktif ? 'Seçili Ürün Tutarı' : 'Kalanın Tamamı'}
    </button>
    {[50, 100, 200, 500, 1000, 2000].map(val => (
      <button 
        key={val}
        type="button"
        onClick={() => onHizliTutar(val)} 
        className="font-mono font-bold h-9 sm:h-10 xl:h-11 rounded-lg sm:rounded-xl bg-[#121724] border border-[#222C42] text-slate-200 shadow-sm text-xs sm:text-sm hover:bg-[#1A2236] hover:text-white active:scale-95 flex items-center justify-center transition-all flex-shrink-0 shrink-0"
      >
        {val}₺
      </button>
    ))}
  </div>
));

// ============================================================
// Ana Bileşen
// ============================================================

interface OdemeModalProps {
  isOpen: boolean
  onClose: () => void
  toplamTutar: number
}

export const OdemeModal = React.memo(function OdemeModal({ isOpen, onClose, toplamTutar }: OdemeModalProps) {
  const aktifHesap = usePosStore(s => s.aktifHesap)
  const hesapAyarla = usePosStore(s => s.hesapAyarla)
  const personel = useAuthStore(s => s.personel)
  const { success, error } = useToast()
  const navigate = useNavigate()

  // Durum Yönetimi
  const [girilenTutar, setGirilenTutar] = useState<string>('')
  const [odemeIslemi, setOdemeIslemi] = useState(false)
  const [seciliMiktarlar, setSeciliMiktarlar] = useState<Record<number, number>>({})
  const [indirimModalAcik, setIndirimModalAcik] = useState(false)
  const [aktifSiparisMiktar, setAktifSiparisMiktar] = useState<any>(null)

  // Modal açıldığında alanları sıfırla
  useEffect(() => {
    if (!isOpen) {
      setGirilenTutar('')
      setSeciliMiktarlar({})
    }
  }, [isOpen])

  // Hesaplamalar
  const gecerliTutar = parseFloat(girilenTutar) || 0
  
  const hesaplamalar = useMemo(() => {
    const toplamHesapTutar = aktifHesap?.toplam_tutar || toplamTutar
    const indirimTutar = aktifHesap?.indirim_tutar || 0
    const genelNetTutar = aktifHesap?.net_tutar || Math.max(0, toplamTutar - indirimTutar)
    const odenenTutar = aktifHesap?.odemeler?.reduce((acc: number, o: any) => acc + o.tutar, 0) || 0
    const kalanGenelNet = Math.max(0, genelNetTutar - odenenTutar)

    // Alman Usulü hesaplaması
    let seciliUrunlerToplami = 0;
    const seciliSiparisIdleri = Object.keys(seciliMiktarlar);
    
    if (seciliSiparisIdleri.length > 0 && aktifHesap?.siparisler) {
      const siparisMap = new Map<number, any>();
      for (const s of aktifHesap.siparisler) {
        siparisMap.set(s.id, s);
      }
      
      for (const idStr of seciliSiparisIdleri) {
        const id = Number(idStr);
        const siparis = siparisMap.get(id);
        const secilenMiktar = seciliMiktarlar[id] || 0;
        if (siparis && siparis.durum !== 'iptal' && siparis.durum !== 'odendi' && !siparis.ikram && secilenMiktar > 0) {
          const birimFiyat = siparis.toplam_fiyat / siparis.miktar;
          seciliUrunlerToplami += birimFiyat * secilenMiktar;
        }
      }
    }

    const seciliIdSayisi = Object.values(seciliMiktarlar).filter(m => m > 0).length;

    const odenecekHedefTutar = seciliIdSayisi > 0 
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

  // Callback'ler
  const handleTutarGirisi = useCallback((deger: string) => {
    if (deger === 'C' || deger === 'clear') {
      setGirilenTutar('')
    } else if (deger === '⌫' || deger === 'backspace') {
      setGirilenTutar(prev => prev.slice(0, -1))
    } else if (deger === '.') {
      setGirilenTutar(prev => prev.includes('.') ? prev : prev + '.')
    } else {
      setGirilenTutar(prev => prev + deger)
    }
  }, [])

  const hizliTutar = useCallback((miktar: number) => {
    setGirilenTutar(miktar.toString())
  }, [])

  const handleSiparisMiktarDegistir = useCallback((siparis: any, degisim: number, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    setSeciliMiktarlar(prev => {
      const id = siparis.id;
      const current = prev[id] || 0;
      const next = current + degisim;
      
      const updated = { ...prev };
      if (next <= 0) {
        delete updated[id];
      } else if (next <= siparis.miktar) {
        updated[id] = next;
      }
      return updated;
    })
    setGirilenTutar('')
  }, []);

  const handleSiparisMiktarAyarla = useCallback((siparis: any, miktar: number) => {
    setSeciliMiktarlar(prev => {
      const id = siparis.id;
      const updated = { ...prev };
      if (miktar <= 0) {
        delete updated[id];
      } else if (miktar <= siparis.miktar) {
        updated[id] = miktar;
      } else {
        updated[id] = siparis.miktar;
      }
      return updated;
    })
    setGirilenTutar('')
  }, [])

  const tumunuSecToggle = useCallback(() => {
    if (aktifHesap?.siparisler) {
      const gecerliSiparisler = aktifHesap.siparisler.filter((s: any) => s.durum !== 'iptal' && s.durum !== 'odendi' && !s.ikram);
      
      if (seciliIdSayisi === gecerliSiparisler.length && gecerliSiparisler.length > 0) {
        setSeciliMiktarlar({});
      } else {
        const yeniSecimler: Record<number, number> = {};
        gecerliSiparisler.forEach((s: any) => {
          yeniSecimler[s.id] = s.miktar;
        });
        setSeciliMiktarlar(yeniSecimler);
      }
    }
    setGirilenTutar('');
  }, [aktifHesap?.siparisler, seciliIdSayisi])

  // Ödeme Alma
  const odemeAl = useCallback(async (tip: 'nakit' | 'kredi_karti') => {
    if (!aktifHesap) {
      error('Hata', 'Ödeme alınacak aktif bir hesap yok!')
      return
    }

    const tutar = gecerliTutar > 0 ? gecerliTutar : odenecekHedefTutar

    if (tutar <= 0) {
      error('Uyarı', 'Geçerli bir tutar girin veya ürün seçin.')
      return
    }

    const odenenSiparisler = Object.entries(seciliMiktarlar)
      .filter(([, miktar]) => miktar > 0)
      .map(([id, miktar]) => ({ id: Number(id), miktar: Number(miktar) }));

    setOdemeIslemi(true)
    try {
      const response = await ipcInvoke<any>(HESAP_KANALLARI.ODEME_AL, [
        {
          hesap_id: aktifHesap.id,
          odeme_tipi: tip,
          tutar: tutar,
          personel_id: personel?.id || 1,
          odenen_siparisler: odenenSiparisler
        }
      ])

      if (response?.basarili) {
        if (response.kapandi) {
          success('Hesap Kapandı', `Hesap tamamen ödendi. Para üstü: ${formatPara(response.para_ustu || 0)}`)
          onClose()
          hesapAyarla(null, null)
          navigate('/tables')
        } else {
          success('Kısmi Ödeme', `Ödeme alındı. Kalan tutar: ${formatPara(response.kalan)}`)
          const guncelHesap = await ipcInvoke<any>(HESAP_KANALLARI.DETAY, aktifHesap.id)
          hesapAyarla(guncelHesap, guncelHesap.masa_id)
          setGirilenTutar('')
          setSeciliMiktarlar({})
        }
      } else {
        error('Ödeme Başarısız', response?.hata || 'Bilinmeyen bir hata oluştu')
      }
    } catch (err: any) {
      error('Hata', err.message)
    } finally {
      setOdemeIslemi(false)
    }
  }, [aktifHesap, gecerliTutar, odenecekHedefTutar, seciliMiktarlar, personel?.id, success, error, onClose, hesapAyarla, navigate])

  const handleIndirim = useCallback(() => {
    setIndirimModalAcik(true);
  }, [])

  const indirimIptal = useCallback(async () => {
    if (!aktifHesap) return;
    try {
      const response = await ipcInvoke<any>(HESAP_KANALLARI.INDIRIM_UYGULA, {
        hesap_id: aktifHesap.id,
        indirim_tipi: 'tutar',
        deger: 0,
        aciklama: 'İptal'
      })
      if (response?.basarili) {
        success('Başarılı', 'İndirim iptal edildi.');
        const guncelHesap = await ipcInvoke<any>(HESAP_KANALLARI.DETAY, aktifHesap.id)
        hesapAyarla(guncelHesap, guncelHesap.masa_id)
      }
    } catch (err: any) {
      error('Hata', err.message)
    }
  }, [aktifHesap, success, error, hesapAyarla])

  const handleIndirimKapat = useCallback(() => setIndirimModalAcik(false), [])
  const handleMiktarKapat = useCallback(() => setAktifSiparisMiktar(null), [])
  const handleMiktarConfirm = useCallback((miktar: number) => {
    if (aktifSiparisMiktar) {
      handleSiparisMiktarAyarla(aktifSiparisMiktar, miktar)
    }
  }, [aktifSiparisMiktar, handleSiparisMiktarAyarla])

  // Sipariş Listeleri
  const odenecekSiparisler = useMemo(() => {
    if (!aktifHesap?.siparisler) return [];
    return aktifHesap.siparisler.filter((s: any) => s.durum !== 'iptal' && s.durum !== 'odendi');
  }, [aktifHesap?.siparisler])

  const odenmisLerinVar = useMemo(() => {
    return aktifHesap?.siparisler?.some((s: any) => s.durum === 'odendi') || false;
  }, [aktifHesap?.siparisler])

  const odenmisSiparisler = useMemo(() => {
    if (!odenmisLerinVar || !aktifHesap?.siparisler) return [];
    return aktifHesap.siparisler.filter((s: any) => s.durum === 'odendi');
  }, [aktifHesap?.siparisler, odenmisLerinVar])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Kasa & Ödeme Konsolu"
      size="full"
    >
      <div 
        className="flex flex-col lg:flex-row h-full w-full overflow-hidden bg-[#090A0F] text-slate-100 select-none"
        style={{ transform: 'translateZ(0)' }}
      >
        
        {/* SOL KOLON: ADİSYON ÖZETİ VE ALMAN USULÜ BÖLÜMÜ */}
        <div className="flex flex-col w-full lg:w-5/12 xl:w-4/12 bg-[#0C1017] border-r border-[#1E2436] h-full flex-shrink-0 shrink-0 overflow-hidden">
          
          {/* Adisyon Başlık Bilgisi */}
          <div className="flex items-center justify-between p-3 sm:p-3.5 border-b border-[#1E2436] bg-[#0E131E] flex-shrink-0 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#141A26] border border-[#222C42] flex items-center justify-center text-cyan-400">
                <Receipt size={18} />
              </div>
              <div className="flex flex-col">
                <span className="font-mono font-black text-xs sm:text-sm text-white">
                  {aktifHesap?.masa_id ? `MASA ${aktifHesap.masa_id}` : 'HIZLI SATIŞ'}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Adisyon #{aktifHesap?.hesap_no || '---'}
                </span>
              </div>
            </div>

            <button 
              type="button"
              onClick={tumunuSecToggle} 
              className={clsx(
                "h-8 sm:h-9 px-2.5 sm:px-3 rounded-lg font-mono text-xs font-bold border transition-all active:scale-95 flex items-center gap-1.5",
                seciliIdSayisi > 0 
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" 
                  : "bg-[#141926] text-slate-300 border-[#222C42] hover:bg-[#1C2336]"
              )}
            >
              <SplitSquareHorizontal size={14} />
              {seciliIdSayisi > 0 ? 'Seçimi Temizle' : 'Tümünü Seç'}
            </button>
          </div>

          {/* Sipariş Listesi */}
          <div className="flex-1 min-h-0 overflow-y-auto p-2.5 sm:p-3 pos-scrollbar bg-[#090D15]">
            {odenecekSiparisler.length === 0 && !odenmisLerinVar ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-center">
                <p className="text-xs font-mono">Ödenecek kalem bulunamadı.</p>
              </div>
            ) : (
              <>
                {/* Ödenecek Ürünler */}
                {odenecekSiparisler.map((siparis: any) => (
                  <SiparisItemRow 
                    key={siparis.id}
                    siparis={siparis}
                    secilenMiktar={seciliMiktarlar[siparis.id] || 0}
                    isIkram={Boolean(siparis.ikram)}
                    onMiktarDegistir={handleSiparisMiktarDegistir}
                    onMiktarAyarla={setAktifSiparisMiktar}
                  />
                ))}

                {/* Ödenen Ürünler */}
                {odenmisLerinVar && (
                  <div className="mt-3 pt-2.5 border-t border-[#1C2538]">
                    <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
                      Ödenen Ürünler
                    </h4>
                    {odenmisSiparisler.map((siparis: any) => (
                      <OdenmisItemRow key={siparis.id} siparis={siparis} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Adisyon Finansal Özeti & İndirim */}
          <div className="p-3 sm:p-3.5 bg-[#0E131E] border-t border-[#1E2436] flex flex-col gap-1.5 sm:gap-2 flex-shrink-0 shrink-0">
            <div className="flex justify-between items-center text-xs font-mono text-slate-400">
              <span>Ara Toplam</span>
              <span className="font-bold text-slate-200 tabular-nums">{formatPara(aktifHesap?.toplam_tutar || 0)}</span>
            </div>
            
            {hesaplamalar.indirimTutar > 0 && (
              <div className="flex justify-between items-center text-xs font-mono text-rose-400">
                <span>Uygulanan İndirim</span>
                <span className="font-bold tabular-nums">-{formatPara(hesaplamalar.indirimTutar)}</span>
              </div>
            )}

            <div className="flex justify-between items-baseline pt-1.5 border-t border-[#1C2538]">
              <span className="text-xs font-mono font-black text-slate-300 uppercase tracking-wider">
                Genel Toplam
              </span>
              <span className="text-lg sm:text-xl font-mono font-black text-white tabular-nums">
                {formatPara(genelNetTutar)}
              </span>
            </div>
            
            <div className="flex gap-2 mt-1">
              <button 
                type="button"
                onClick={handleIndirim} 
                className="flex-1 h-9 sm:h-10 rounded-xl font-mono text-xs font-bold bg-[#141926] hover:bg-[#1C2436] border border-[#222C42] text-amber-300 active:scale-95 flex items-center justify-center gap-1.5 transition-all"
              >
                <Tag size={14} />
                {hesaplamalar.indirimTutar > 0 ? 'İndirimi Değiştir' : 'İndirim Uygula'}
              </button>
              {hesaplamalar.indirimTutar > 0 && (
                <button 
                  type="button"
                  onClick={indirimIptal}
                  className="h-9 sm:h-10 px-3 rounded-xl font-mono text-xs font-bold bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 active:scale-95 transition-all"
                >
                  İptal
                </button>
              )}
            </div>
          </div>
        </div>

        {/* SAĞ KOLON: TAHSİLAT KONSOLU, NUMPAD VE BÜYÜK ÖDEME BUTONLARI */}
        <div className="flex-1 min-w-0 h-full flex flex-col p-3 sm:p-4 lg:p-5 bg-[#090A0F] overflow-hidden gap-2.5 sm:gap-3.5">
          
          {/* 1. DİJİTAL GÖSTERGELER (DUAL LED READOUTS) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 flex-shrink-0 shrink-0">
            {/* Kalan Toplam Hesap */}
            <div className="bg-[#0C1017] rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 border border-[#1E2436] flex flex-col justify-between shadow-md">
              <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-wider mb-0.5">
                KALAN HESAP TUTARI
              </span>
              <span className="text-xl sm:text-2xl lg:text-3xl font-black font-mono text-amber-400 tabular-nums">
                {formatPara(kalanGenelNet)}
              </span>
              {odenenTutar > 0 && (
                <span className="text-[10px] font-mono font-bold text-emerald-400 mt-0.5 flex items-center gap-1">
                  <CheckCircle2 size={11} /> {formatPara(odenenTutar)} tahsil edildi
                </span>
              )}
            </div>

            {/* Tahsil Edilecek Tutar (Canlı Seçim/Giriş) */}
            <div className={clsx(
              "rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 border shadow-sm flex flex-col justify-between transition-all",
              (almanUsuluAktif || girilenTutar)
                ? "bg-[#0E1726] border-cyan-400 ring-1 ring-cyan-400/50"
                : "bg-[#0C1017] border-[#1E2436]"
            )}>
              <span className="text-[10px] font-mono font-black text-cyan-300 uppercase tracking-wider mb-0.5 flex items-center justify-between">
                <span>TAHSİL EDİLECEK TUTAR</span>
                {almanUsuluAktif && (
                  <span className="text-[9px] bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded-full border border-cyan-500/40">
                    {seciliIdSayisi} Ürün Seçili
                  </span>
                )}
              </span>
              <span className="text-2xl sm:text-3xl lg:text-4xl font-black font-mono text-cyan-400 tabular-nums tracking-tight">
                {girilenTutar ? formatPara(parseFloat(girilenTutar)) : formatPara(odenecekHedefTutar)}
              </span>
              <span className="text-[10px] font-mono text-slate-400 mt-0.5">
                {girilenTutar ? 'Manuel Tutar Girişi' : almanUsuluAktif ? 'Seçili Kalemler Toplamı' : 'Hesabın Tamamı'}
              </span>
            </div>
          </div>

          {/* 2. NUMPAD, HIZLI TUTARLAR VE BÜYÜK BUTONLAR */}
          <div className="flex-1 min-h-0 flex flex-col xl:flex-row gap-2.5 sm:gap-3.5">
            
            {/* Sol Alt: Hızlı Tutarlar ve Numpad */}
            <div className="flex-1 min-h-0 flex flex-col gap-2 sm:gap-2.5 justify-between">
              {/* Hızlı Tutar Presetleri */}
              <HizliTutarButonlari 
                odenecekHedefTutar={odenecekHedefTutar}
                almanUsuluAktif={almanUsuluAktif}
                onHizliTutar={hizliTutar}
              />

              {/* Endüstriyel Dokunmatik Numpad */}
              <div className="bg-[#0C1017] rounded-xl sm:rounded-2xl p-2 sm:p-3 border border-[#1E2436] flex items-center justify-center shadow-inner flex-shrink-0 shrink-0">
                <Numpad
                  layout={[
                    ['7', '8', '9'],
                    ['4', '5', '6'],
                    ['1', '2', '3'],
                    ['C', '0', '.'],
                    ['⌫']
                  ]}
                  onKeyPress={handleTutarGirisi}
                  onClear={() => setGirilenTutar('')}
                />
              </div>
              
              {/* Para Üstü Göstergesi */}
              {gecerliTutar > kalanGenelNet && (
                 <div className="p-2.5 sm:p-3 bg-amber-950/40 text-amber-300 rounded-xl border border-amber-500/40 flex items-center justify-between shadow-sm font-mono flex-shrink-0 shrink-0">
                   <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                     <Coins size={15} /> Para Üstü Verilecek:
                   </span>
                   <span className="text-lg sm:text-xl font-black text-amber-300 tabular-nums">
                     {formatPara(gecerliTutar - kalanGenelNet)}
                   </span>
                 </div>
              )}
            </div>

            {/* Sağ Alt: Dev Ödeme Aksiyon Butonları */}
            <div className="w-full xl:w-56 2xl:w-64 flex flex-row xl:flex-col gap-2 sm:gap-2.5 justify-end flex-shrink-0 shrink-0">
              
              {/* NAKİT ÖDEME BUTONU */}
              <button 
                type="button"
                onClick={() => odemeAl('nakit')}
                disabled={odemeIslemi}
                className={clsx(
                  "pos-action-deck-btn flex-1 xl:flex-1 h-14 sm:h-16 xl:h-auto min-h-[52px] xl:min-h-[110px] 2xl:min-h-[130px] rounded-xl sm:rounded-2xl font-mono font-black text-sm sm:text-base xl:text-lg uppercase tracking-wider flex flex-row xl:flex-col items-center justify-center gap-2 sm:gap-2.5 border transition-all active:scale-[0.97] shadow-md flex-shrink-0 shrink-0",
                  odemeIslemi
                    ? "bg-[#141A26] border-[#1E2436] text-slate-500 cursor-not-allowed opacity-50"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400/40 active:bg-emerald-700"
                )}
              >
                <Banknote size={26} className="xl:w-8 xl:h-8 stroke-[2.2]" />
                <div className="flex flex-col items-center">
                  <span className="tracking-widest">NAKİT ÖDEME</span>
                  <span className="text-[10px] sm:text-[11px] font-normal opacity-85">
                    {girilenTutar ? formatPara(parseFloat(girilenTutar)) : formatPara(odenecekHedefTutar)}
                  </span>
                </div>
              </button>

              {/* KREDİ KARTI ÖDEME BUTONU */}
              <button 
                type="button"
                onClick={() => odemeAl('kredi_karti')}
                disabled={odemeIslemi}
                className={clsx(
                  "pos-action-deck-btn flex-1 xl:flex-1 h-14 sm:h-16 xl:h-auto min-h-[52px] xl:min-h-[110px] 2xl:min-h-[130px] rounded-xl sm:rounded-2xl font-mono font-black text-sm sm:text-base xl:text-lg uppercase tracking-wider flex flex-row xl:flex-col items-center justify-center gap-2 sm:gap-2.5 border transition-all active:scale-[0.97] shadow-md flex-shrink-0 shrink-0",
                  odemeIslemi
                    ? "bg-[#141A26] border-[#1E2436] text-slate-500 cursor-not-allowed opacity-50"
                    : "bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-400/40 active:bg-cyan-700"
                )}
              >
                <CreditCard size={26} className="xl:w-8 xl:h-8 stroke-[2.2]" />
                <div className="flex flex-col items-center">
                  <span className="tracking-widest">KREDİ KARTI</span>
                  <span className="text-[10px] sm:text-[11px] font-normal opacity-85">
                    POS / Temassız
                  </span>
                </div>
              </button>

            </div>
          </div>
        </div>

      </div>
      
      {/* İndirim Modalı */}
      {indirimModalAcik && (
        <IndirimModal 
          isOpen={indirimModalAcik}
          onClose={handleIndirimKapat}
          toplamTutar={toplamTutar}
        />
      )}

      {/* Miktar Belirleme Modalı */}
      {aktifSiparisMiktar && (
        <MiktarModal 
          isOpen={!!aktifSiparisMiktar}
          onClose={handleMiktarKapat}
          onConfirm={handleMiktarConfirm}
          maxMiktar={aktifSiparisMiktar.miktar}
          urunAdi={aktifSiparisMiktar.urun_adi || 'Ürün'}
          mevcutMiktar={seciliMiktarlar[aktifSiparisMiktar.id] || 0}
        />
      )}
    </Modal>
  )
})

export default OdemeModal
