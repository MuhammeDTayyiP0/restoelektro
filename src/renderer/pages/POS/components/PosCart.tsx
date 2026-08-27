import React, { useState } from 'react'
import { usePosStore } from '../../../stores/usePosStore'
import { formatPara } from '../../../utils/formatters'
import { Button } from '../../../components/ui/Button'
import { Numpad } from '../../../components/ui/Numpad'
import { Modal } from '../../../components/ui/Modal'
import { 
  Minus, 
  Plus, 
  Trash2, 
  FileText, 
  Send, 
  CreditCard, 
  Ban, 
  Gift, 
  Printer, 
  Check, 
  Clock, 
  Flame, 
  AlertCircle,
  Hash,
  ShoppingBag
} from 'lucide-react'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../../../stores/useAuthStore'
import { ipcInvoke } from '../../../hooks/useIPC'
import { HESAP_KANALLARI, AYAR_KANALLARI } from '../../../../common/ipc-channels'
import { useToast } from '../../../components/ui/Toast'
import { useNavigate } from 'react-router-dom'
import OdemeModal from './OdemeModal'
import { yazdirMutfak, yazdirAdisyon } from '../../../utils/print.utils'

export default function PosCart() {
  const { 
    sepet, 
    sepettenCikar, 
    sepetMiktarGuncelle, 
    sepetNotGuncelle, 
    sepetIkramTogle, 
    sepetiTemizle, 
    aktifMasaId, 
    aktifHesap, 
    hesapAyarla, 
    iptalEdilecekSiparisler, 
    siparisIptalEkle, 
    siparisIptalGeriAl, 
    iptalleriTemizle 
  } = usePosStore()

  const { personel } = useAuthStore()
  const { success, error } = useToast()
  const navigate = useNavigate()
  
  const [seciliKalemId, setSeciliKalemId] = useState<string | null>(null)
  const [odemeModalAcik, setOdemeModalAcik] = useState(false)
  const [miktarSoranKalem, setMiktarSoranKalem] = useState<any>(null)
  const [girilenMiktar, setGirilenMiktar] = useState('')
  const [siparisGonderiliyor, setSiparisGonderiliyor] = useState(false)
  const [notDuzenlenenKalemId, setNotDuzenlenenKalemId] = useState<string | null>(null)
  const [geciciNot, setGeciciNot] = useState('')

  // Toplam Tutar Hesaplama
  const toplamTutar = sepet.reduce((toplam, kalem) => {
    if (kalem.ikram) return toplam
    let kalemFiyati = kalem.urun.fiyat
    if (kalem.varyant) kalemFiyati += (kalem.varyant.fiyat_farki ?? (kalem.varyant as any).ek_fiyat ?? 0)
    kalem.opsiyonlar.forEach(opt => { kalemFiyati += (opt.fiyat ?? (opt as any).ek_fiyat ?? 0) })
    return toplam + (kalemFiyati * kalem.miktar * (kalem.porsiyon || 1))
  }, 0)

  // Genel Toplam (Önceki siparişler + yeni eklenecekler)
  const genelToplamTutar = (aktifHesap?.toplam_tutar || 0) + toplamTutar

  const handleMiktarDegistir = (id: string, miktar: number) => {
    if (miktar <= 0) {
      sepettenCikar(id)
    } else {
      sepetMiktarGuncelle(id, miktar)
    }
  }

  const handleSiparisGonder = async () => {
    if (sepet.length === 0 && iptalEdilecekSiparisler.length === 0) return
    setSiparisGonderiliyor(true)

    try {
      let mevcutHesapId = aktifHesap?.id

      if (!mevcutHesapId && aktifMasaId) {
        const hesapAcRes = await ipcInvoke<any>(HESAP_KANALLARI.AC, aktifMasaId, personel?.id || 1)
        if (hesapAcRes && hesapAcRes.basarili) {
          mevcutHesapId = hesapAcRes.hesap_id
        } else {
          throw new Error(hesapAcRes?.hata || 'Hesap açılamadı')
        }
      }

      if (!mevcutHesapId) {
        throw new Error('Sipariş göndermek için masa veya açık hesap gerekli.')
      }

      // 1. İptalleri Gönder
      const iptalEdilenSiparislerDetay = [];
      if (iptalEdilecekSiparisler.length > 0 && aktifHesap?.siparisler) {
        for (const iptalId of iptalEdilecekSiparisler) {
          const detay = aktifHesap.siparisler.find((s: any) => s.id === iptalId);
          if (detay) iptalEdilenSiparislerDetay.push(detay);
          
          await ipcInvoke<any>(HESAP_KANALLARI.SIPARIS_IPTAL, iptalId, 'Müşteri İsteği', personel?.id || 1)
        }
      }

      // 2. Yeni Siparişleri Gönder
      let siparisRes = null;
      let yeniSiparisler = [];
      if (sepet.length > 0) {
        yeniSiparisler = sepet.map(k => ({
          urun_id: k.urun.id,
          varyant_id: k.varyant?.id,
          opsiyon_idleri: k.opsiyonlar.map(o => o.id),
          miktar: k.miktar,
          notlar: k.notlar,
          ikram: k.ikram,
          porsiyon: k.porsiyon
        }))
        siparisRes = await ipcInvoke<any>(HESAP_KANALLARI.SIPARIS_EKLE, mevcutHesapId, personel?.id || 1, yeniSiparisler)
        if (!siparisRes || !siparisRes.basarili) {
           throw new Error(siparisRes?.hata || 'Sipariş gönderilemedi')
        }
      }

      success('İşlem Başarılı', 'Değişiklikler mutfağa iletildi.')
      
      // Mutfak yazıcısı ayarlıysa yazdır
      try {
        const mutfakYazici = await ipcInvoke<string>(AYAR_KANALLARI.GETIR, 'mutfak_yazici');
        if (mutfakYazici && (sepet.length > 0 || iptalEdilenSiparislerDetay.length > 0)) {
          yazdirMutfak(sepet, aktifMasaId ? aktifMasaId.toString() : null, mutfakYazici, iptalEdilenSiparislerDetay);
        }
      } catch (printErr) {
        console.error("Mutfak yazdırma hatası:", printErr);
      }

      sepetiTemizle()
      iptalleriTemizle()
      // Hesabı güncelle
      const guncelHesap = await ipcInvoke<any>(HESAP_KANALLARI.DETAY, mevcutHesapId)
      hesapAyarla(guncelHesap, aktifMasaId)
      
    } catch (err: any) {
      error('Hata', err.message)
    } finally {
      setSiparisGonderiliyor(false)
    }
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#0C1017] text-slate-100 relative overflow-hidden select-none">
      
      {/* Industrial Sepet Header */}
      <div className="flex items-center justify-between p-2.5 sm:p-3 2xl:p-3.5 border-b border-[#1E2436] bg-[#0E131E] flex-shrink-0 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          {/* Active Status Badge */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#141926] border border-[#222C42]">
            <span className={clsx(
              "h-2.5 w-2.5 rounded-full shrink-0",
              aktifHesap ? "bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.6)]" : "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
            )} />
            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-black tracking-tight text-white font-mono leading-none">
                {aktifMasaId ? `MASA ${aktifMasaId}` : 'HIZLI SATIŞ'}
              </span>
              <span className="text-[10px] font-mono text-slate-400 tracking-tight mt-0.5">
                {aktifHesap ? `ADİSYON #${aktifHesap.hesap_no}` : 'YENİ HESAP'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Action Tools */}
        <div className="flex items-center gap-1.5">
          {aktifHesap && (
            <motion.button 
              whileTap={{ scale: 0.95 }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#141926] border border-[#222C42] hover:border-blue-500/50 hover:bg-blue-500/10 text-slate-300 hover:text-blue-400 flex items-center justify-center transition-colors" 
              title="Adisyon Yazdır"
              onClick={async () => {
                try {
                  const kasaYazici = await ipcInvoke<string>(AYAR_KANALLARI.GETIR, 'kasa_yazici');
                  if (!kasaYazici) {
                    error('Hata', 'Kasa yazıcısı ayarlanmamış.');
                    return;
                  }
                  
                  const ayarlar = await ipcInvoke<Record<string, string>>(AYAR_KANALLARI.TUMU);
                  const restoranBilgileri = {
                    ad: ayarlar['restoran_adi'] || '',
                    telefon: ayarlar['restoran_telefon'] || '',
                    adres: ayarlar['restoran_adres'] || '',
                    altNot: ayarlar['fis_alt_not'] || ''
                  };
                  
                  const basarili = await yazdirAdisyon(aktifHesap, kasaYazici, restoranBilgileri);
                  if (basarili) success('Başarılı', 'Adisyon yazdırıldı.');
                  else error('Hata', 'Yazdırma işlemi başarısız.');
                } catch (e: any) {
                  error('Hata', e.message);
                }
              }}
            >
              <Printer size={16} />
            </motion.button>
          )}

          {aktifHesap && (
            <motion.button 
              whileTap={{ scale: 0.95 }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#141926] border border-[#222C42] hover:border-rose-500/50 hover:bg-rose-500/10 text-slate-300 hover:text-rose-400 flex items-center justify-center transition-colors" 
              title="Hesabı İptal Et / Masayı Boşalt"
              onClick={async () => {
                if (window.confirm('Bu hesabı tamamen iptal edip masayı boşaltmak istediğinize emin misiniz?')) {
                  try {
                    const res = await ipcInvoke<any>(HESAP_KANALLARI.IPTAL, aktifHesap.id)
                    if (res && res.basarili) {
                      success('Hesap İptal Edildi', 'Masa boşaltıldı.')
                      hesapAyarla(null, null)
                      navigate('/tables')
                    } else {
                      error('Hata', 'Hesap iptal edilemedi.')
                    }
                  } catch (err: any) {
                    error('Hata', err.message)
                  }
                }
              }}
            >
              <Ban size={16} />
            </motion.button>
          )}

          {sepet.length > 0 && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#141926] border border-[#222C42] hover:border-amber-500/50 hover:bg-amber-500/10 text-slate-300 hover:text-amber-400 flex items-center justify-center transition-colors"
              title="Taslak Sepeti Temizle"
              onClick={() => {
                if (window.confirm('Taslaktaki tüm ürünleri silmek istiyor musunuz?')) {
                  sepetiTemizle()
                }
              }}
            >
              <Trash2 size={16} />
            </motion.button>
          )}
        </div>
      </div>

      {/* Sepet Listesi — High Contrast Terminal List */}
      <div className="flex-1 min-h-0 overflow-y-auto pos-scrollbar bg-[#090A0F] p-2 space-y-2">
        {sepet.length === 0 && (!aktifHesap?.siparisler || aktifHesap.siparisler.length === 0) ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8 text-center">
            <div className="w-16 h-16 mb-3 rounded-2xl bg-[#0E121B] border border-[#1E2436] flex items-center justify-center text-slate-600">
              <ShoppingBag size={28} />
            </div>
            <p className="text-sm font-mono font-bold text-slate-400 uppercase tracking-wider">Adisyon Boş</p>
            <p className="text-xs text-slate-400 mt-1 font-mono max-w-xs">
              Sağ taraftaki menüden ürün seçerek siparişe başlayabilirsiniz.
            </p>
          </div>
        ) : null}
        
        {/* 1. GÖNDERİLMİŞ SİPARİŞLER (MUTFAK İLETİLDİ) */}
        {aktifHesap?.siparisler && aktifHesap.siparisler.length > 0 && (
          <div className="flex flex-col rounded-xl overflow-hidden border border-[#1E2436] bg-[#0C1017]">
            {/* Section Banner */}
            <div className="bg-[#121724] px-3.5 py-2 border-b border-[#1E2436] flex items-center justify-between text-[11px] font-mono font-bold tracking-wider text-slate-400 uppercase">
              <span className="flex items-center gap-1.5">
                <Check size={12} className="text-emerald-400" />
                Mutfaktaki Siparişler
              </span>
              <span className="bg-[#1A2133] text-slate-300 px-2 py-0.5 rounded text-[10px]">
                {aktifHesap.siparisler.length} KALEM
              </span>
            </div>

            {/* List */}
            <div className="divide-y divide-[#161D2B]">
              {[...(aktifHesap.siparisler || [])].sort((a, b) => b.id - a.id).map((siparis: any) => {
                const isSelected = seciliKalemId === 'siparis-' + siparis.id
                const isIptal = siparis.durum === 'iptal' || iptalEdilecekSiparisler.includes(siparis.id)

                return (
                  <div 
                    key={siparis.id} 
                    onClick={() => setSeciliKalemId(isSelected ? null : 'siparis-' + siparis.id)}
                    className={clsx(
                      'flex flex-col p-3 transition-all cursor-pointer select-none',
                      isSelected ? 'bg-[#151C2C] border-l-2 border-l-amber-400' : 'bg-[#0E121B] hover:bg-[#121724]'
                    )}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={clsx(
                            "text-sm font-bold tracking-tight",
                            isIptal ? "line-through text-slate-400" : "text-white"
                          )}>
                            {siparis.porsiyon && siparis.porsiyon !== 1 ? `${siparis.porsiyon === 2 ? 'Duble (2)' : siparis.porsiyon} Porsiyon ` : ''}{siparis.urun_adi}
                          </span>

                          {/* Status Badge */}
                          {iptalEdilecekSiparisler.includes(siparis.id) && (
                            <span className="text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1.5 py-0.5 rounded uppercase">
                              İptal Bekliyor
                            </span>
                          )}
                          {!iptalEdilecekSiparisler.includes(siparis.id) && siparis.durum === 'bekliyor' && (
                            <span className="text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                              <Clock size={10} /> Bekliyor
                            </span>
                          )}
                          {!iptalEdilecekSiparisler.includes(siparis.id) && siparis.durum === 'hazirlaniyor' && (
                            <span className="text-[10px] font-mono font-bold bg-blue-500/15 text-blue-300 border border-blue-500/40 px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                              <Flame size={10} /> Hazırlanıyor
                            </span>
                          )}
                          {!iptalEdilecekSiparisler.includes(siparis.id) && siparis.durum === 'hazir' && (
                            <span className="text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                              <Check size={10} /> Hazır
                            </span>
                          )}
                          {siparis.durum === 'iptal' && (
                            <span className="text-[10px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded uppercase">
                              İptal Edildi
                            </span>
                          )}
                          {siparis.ikram === 1 && (
                            <span className="text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                              <Gift size={10} /> İkram
                            </span>
                          )}
                        </div>

                        {siparis.varyant_adi && (
                          <span className={clsx("text-xs text-slate-400 font-mono mt-0.5", isIptal && "line-through")}>
                            [{siparis.varyant_adi}]
                          </span>
                        )}
                        {siparis.notlar && (
                          <span className={clsx("text-xs italic mt-1 font-mono flex items-center gap-1", isIptal ? "text-slate-400 line-through" : "text-amber-400")}>
                            <AlertCircle size={10} /> Not: {siparis.notlar}
                          </span>
                        )}
                      </div>

                      {/* Fiyat ve Miktar */}
                      <div className="flex flex-col items-end shrink-0">
                        <span className={clsx(
                          "text-sm font-mono font-black tabular-nums",
                          (isIptal || siparis.ikram === 1) ? "text-slate-400 line-through" : "text-white"
                        )}>
                          {formatPara(siparis.toplam_fiyat)}
                        </span>
                        <span className={clsx("text-xs font-mono text-slate-400 tabular-nums", isIptal && "line-through")}>
                          {siparis.miktar} {siparis.urun_birim || 'Adet'} × {formatPara(siparis.birim_fiyat)}
                        </span>
                      </div>
                    </div>

                    {/* Sipariş Aksiyon Çekmecesi */}
                    <AnimatePresence>
                      {isSelected && siparis.durum !== 'iptal' && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-center justify-end mt-2.5 pt-2.5 border-t border-[#1E273A] gap-2"
                        >
                          <motion.button 
                            whileTap={{ scale: 0.95 }}
                            className={clsx(
                              "h-9 px-3 rounded-lg font-mono text-xs font-bold border flex items-center gap-1.5 transition-colors",
                              siparis.ikram === 1 
                                ? "bg-purple-500/20 text-purple-300 border-purple-500/40 hover:bg-purple-500/30" 
                                : "bg-[#161D2B] text-slate-300 border-[#25324A] hover:border-purple-500/40 hover:text-purple-300"
                            )}
                            onClick={async (e) => {
                              e.stopPropagation()
                              try {
                                const res = await ipcInvoke<any>(HESAP_KANALLARI.SIPARIS_IKRAM_TOGGLE, siparis.id, personel?.id || 1)
                                if (res && res.basarili) {
                                  if (res.yeniIkram === 1) success('İkram Uygulandı', 'Sipariş ikram olarak işaretlendi.')
                                  else success('İkram Kaldırıldı', 'Siparişin ikram durumu kaldırıldı.')
                                  const guncelHesap = await ipcInvoke<any>(HESAP_KANALLARI.DETAY, aktifHesap.id)
                                  hesapAyarla(guncelHesap, aktifMasaId)
                                } else {
                                  error('Hata', res.hata || 'İkram işlemi başarısız.')
                                }
                              } catch(err: any) {
                                error('Hata', err.message)
                              }
                            }}
                          >
                            <Gift size={14} />
                            {siparis.ikram === 1 ? 'İkramı Kaldır' : 'İkram Yap'}
                          </motion.button>

                          <motion.button 
                            whileTap={{ scale: 0.95 }}
                            className={clsx(
                              "h-9 px-3 rounded-lg font-mono text-xs font-bold border flex items-center gap-1.5 transition-colors",
                              iptalEdilecekSiparisler.includes(siparis.id) 
                                ? "bg-[#161D2B] text-amber-300 border-amber-500/40 hover:bg-amber-500/10" 
                                : "bg-rose-500/15 text-rose-300 border-rose-500/40 hover:bg-rose-500/25"
                            )}
                            onClick={async (e) => { 
                              e.stopPropagation()
                              if (iptalEdilecekSiparisler.includes(siparis.id)) {
                                siparisIptalGeriAl(siparis.id)
                              } else {
                                siparisIptalEkle(siparis.id)
                              }
                            }}
                          >
                            <Trash2 size={14} />
                            {iptalEdilecekSiparisler.includes(siparis.id) ? "İptali Geri Al" : "Siparişi İptal Et"}
                          </motion.button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 2. YENİ EKLENECEK SİPARİŞLER (TASLAK SEPET) */}
        {sepet.length > 0 && (
          <div className="flex flex-col rounded-xl overflow-hidden border border-[#1D324E] bg-[#0B111A]">
            {/* Section Banner */}
            <div className="bg-[#0E1A2C] px-3.5 py-2 border-b border-[#1D324E] flex items-center justify-between text-[11px] font-mono font-bold tracking-wider text-cyan-400 uppercase">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                Yeni Eklenecekler
              </span>
              <span className="bg-[#152740] text-cyan-300 px-2 py-0.5 rounded text-[10px]">
                {sepet.length} ÜRÜN
              </span>
            </div>

            {/* Cart List */}
            <div className="divide-y divide-[#152338]">
              {sepet.map((kalem) => {
                const isSelected = seciliKalemId === kalem.id
                const birimHesapliFiyat = (kalem.urun.fiyat + (kalem.varyant?.fiyat_farki ?? (kalem.varyant as any)?.ek_fiyat ?? 0)) * (kalem.porsiyon || 1)
                const toplamKalemFiyat = birimHesapliFiyat * kalem.miktar

                return (
                  <div 
                    key={kalem.id}
                    onClick={() => setSeciliKalemId(isSelected ? null : kalem.id)}
                    className={clsx(
                      'flex flex-col p-3 transition-all cursor-pointer select-none',
                      isSelected ? 'bg-[#142136] border-l-2 border-l-cyan-400 shadow-[inset_0_0_12px_rgba(6,182,212,0.06)]' : 'bg-[#0E1522] hover:bg-[#111B2C]'
                    )}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold tracking-tight text-white">
                            {kalem.porsiyon && kalem.porsiyon !== 1 ? `${kalem.porsiyon === 2 ? 'Duble (2)' : kalem.porsiyon} Porsiyon ` : ''}{kalem.urun.ad}
                          </span>

                          {kalem.ikram && (
                            <span className="text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                              <Gift size={10} /> İkram
                            </span>
                          )}
                        </div>

                        {kalem.varyant && (
                          <span className="text-xs text-slate-400 font-mono mt-0.5">[{kalem.varyant.ad}]</span>
                        )}
                        {kalem.opsiyonlar.map(opt => (
                          <span key={opt.id} className="text-xs text-slate-400 font-mono">+ {opt.ad}</span>
                        ))}
                        {kalem.notlar && (
                          <span className="text-xs italic text-amber-400 font-mono mt-1 flex items-center gap-1">
                            <AlertCircle size={10} /> Not: {kalem.notlar}
                          </span>
                        )}
                      </div>
                      
                      {/* Fiyat ve Miktar */}
                      <div className="flex flex-col items-end shrink-0">
                        <span className={clsx(
                          "text-sm font-mono font-black tabular-nums",
                          kalem.ikram ? "line-through text-slate-400" : "text-cyan-300"
                        )}>
                          {formatPara(toplamKalemFiyat)}
                        </span>
                        <span className="text-xs font-mono text-slate-400 tabular-nums">
                          {kalem.miktar} {kalem.urun.birim || 'Adet'} × {formatPara(birimHesapliFiyat)}
                        </span>
                      </div>
                    </div>

                    {/* Seçili Kalem İşlem Çubuğu */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#1C2C45] gap-2"
                        >
                          {/* Miktar Arttır / Azalt / Doğrudan Gir Butonları */}
                          <div className="flex items-center bg-[#0C121D] border border-[#22334F] rounded-lg p-0.5 shadow-inner">
                            <motion.button 
                              whileTap={{ scale: 0.9 }}
                              className="w-9 h-9 flex items-center justify-center rounded-md bg-[#162133] hover:bg-[#1E2E47] text-slate-200"
                              onClick={(e) => { e.stopPropagation(); handleMiktarDegistir(kalem.id, kalem.miktar - 1) }}
                            >
                              <Minus size={16} />
                            </motion.button>

                            <button 
                              className="w-12 h-9 text-center font-mono font-black text-cyan-400 text-sm hover:bg-[#162133] rounded px-1 transition-colors"
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setGirilenMiktar(kalem.miktar.toString())
                                setMiktarSoranKalem(kalem)
                              }}
                              title="Miktarı klavyeden girmek için dokunun"
                            >
                              {kalem.miktar}
                            </button>

                            <motion.button 
                              whileTap={{ scale: 0.9 }}
                              className="w-9 h-9 flex items-center justify-center rounded-md bg-[#162133] hover:bg-[#1E2E47] text-cyan-400"
                              onClick={(e) => { e.stopPropagation(); handleMiktarDegistir(kalem.id, kalem.miktar + 1) }}
                            >
                              <Plus size={16} />
                            </motion.button>
                          </div>

                          {/* Yan Hızlı İşlemler */}
                          <div className="flex items-center gap-1.5">
                            {/* Not Butonu */}
                            <motion.button 
                              whileTap={{ scale: 0.95 }}
                              className={clsx(
                                "w-9 h-9 rounded-lg border flex items-center justify-center transition-colors",
                                notDuzenlenenKalemId === kalem.id 
                                  ? "bg-amber-500/20 text-amber-300 border-amber-500/50" 
                                  : "bg-[#121B2A] text-slate-300 border-[#22334F] hover:border-amber-500/40 hover:text-amber-300"
                              )}
                              onClick={(e) => { 
                                e.stopPropagation()
                                if (notDuzenlenenKalemId === kalem.id) {
                                  setNotDuzenlenenKalemId(null)
                                } else {
                                  setNotDuzenlenenKalemId(kalem.id)
                                  setGeciciNot(kalem.notlar)
                                }
                              }}
                              title="Sipariş Notu Ekle"
                            >
                              <FileText size={16} />
                            </motion.button>

                            {/* İkram Butonu */}
                            <motion.button 
                              whileTap={{ scale: 0.95 }}
                              className={clsx(
                                "w-9 h-9 rounded-lg border flex items-center justify-center transition-colors",
                                kalem.ikram 
                                  ? "bg-purple-500/20 text-purple-300 border-purple-500/50" 
                                  : "bg-[#121B2A] text-slate-300 border-[#22334F] hover:border-purple-500/40 hover:text-purple-300"
                              )}
                              onClick={(e) => { e.stopPropagation(); sepetIkramTogle(kalem.id) }}
                              title="İkram Olarak İşaretle"
                            >
                              <Gift size={16} />
                            </motion.button>

                            {/* Sil Butonu */}
                            <motion.button 
                              whileTap={{ scale: 0.95 }}
                              className="w-9 h-9 rounded-lg bg-rose-500/15 border border-rose-500/40 hover:bg-rose-500/25 text-rose-300 flex items-center justify-center transition-colors"
                              onClick={(e) => { e.stopPropagation(); sepettenCikar(kalem.id) }}
                              title="Sepetten Sil"
                            >
                              <Trash2 size={16} />
                            </motion.button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    {/* Hızlı Not Düzenleme Formu */}
                    <AnimatePresence>
                      {isSelected && notDuzenlenenKalemId === kalem.id && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2.5 flex gap-2 pt-2 border-t border-[#1C2C45]" 
                          onClick={e => e.stopPropagation()}
                        >
                          <input 
                            type="text" 
                            className="flex-1 bg-[#090E17] border border-[#243754] rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-400 placeholder:text-slate-400"
                            placeholder="Sipariş notu (ör: Az pişmiş, buzsuz)..."
                            value={geciciNot}
                            onChange={e => setGeciciNot(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                sepetNotGuncelle(kalem.id, geciciNot)
                                setNotDuzenlenenKalemId(null)
                              }
                            }}
                            autoFocus
                          />
                          <Button 
                            variant="primary" 
                            size="sm"
                            className="h-8 text-xs font-mono font-bold px-3 rounded-lg"
                            onClick={() => {
                              sepetNotGuncelle(kalem.id, geciciNot)
                              setNotDuzenlenenKalemId(null)
                            }}
                          >
                            Kaydet
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>

      {/* POS CASHIER COMMAND DECK (ALT HESAP & AKSİYON PANELİ) */}
      <div className="p-2.5 sm:p-3 2xl:p-3.5 bg-[#0E131F] border-t border-[#1E2436] shadow-[0_-8px_24px_rgba(0,0,0,0.4)] flex-shrink-0 shrink-0 flex flex-col gap-2 2xl:gap-3">
        
        {/* Finansal Ledger Dökümü */}
        <div className="bg-[#090D15] rounded-xl p-2 sm:p-2.5 2xl:p-3 border border-[#1A2234] flex flex-col gap-1 2xl:gap-1.5 flex-shrink-0 shrink-0">
          {aktifHesap && aktifHesap.toplam_tutar > 0 && (
            <div className="flex justify-between items-center text-xs font-mono text-slate-400">
              <span>Mevcut Adisyon Tutarı</span>
              <span className="font-bold text-slate-200 tabular-nums">{formatPara(aktifHesap.toplam_tutar)}</span>
            </div>
          )}

          {sepet.length > 0 && (
            <div className="flex justify-between items-center text-xs font-mono text-cyan-400">
              <span>Yeni Eklenecek Sepet</span>
              <span className="font-bold tabular-nums">+{formatPara(toplamTutar)}</span>
            </div>
          )}

          {aktifHesap?.indirim_tutar ? (
            <div className="flex justify-between items-center text-xs font-mono text-rose-400">
              <span>Uygulanan İndirim</span>
              <span className="font-bold tabular-nums">-{formatPara(aktifHesap.indirim_tutar)}</span>
            </div>
          ) : null}

          {/* Genel Toplam Digital Readout */}
          <div className="pt-1.5 sm:pt-2 mt-0.5 sm:mt-1 border-t border-[#1A2234] flex justify-between items-baseline">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono font-black tracking-widest text-slate-400 uppercase">
                GENEL TOPLAM
              </span>
              <span className="text-[10px] sm:text-[11px] font-mono text-slate-400">
                {sepet.length + (aktifHesap?.siparisler?.length || 0)} Kalem Sipariş
              </span>
            </div>
            
            <span className="text-xl sm:text-2xl 2xl:text-3xl font-black font-mono text-emerald-400 tabular-nums tracking-tight">
              {formatPara(genelToplamTutar)}
            </span>
          </div>
        </div>
        
        {/* Büyük Endüstriyel Dokunmatik Butonlar */}
        <div className="grid grid-cols-2 gap-2 2xl:gap-2.5 flex-shrink-0 shrink-0">
          {/* Sipariş Gönder (Mutfak) */}
          <motion.button 
            whileTap={{ scale: 0.97 }}
            disabled={(sepet.length === 0 && iptalEdilecekSiparisler.length === 0) || siparisGonderiliyor}
            onClick={handleSiparisGonder}
            className={clsx(
              "pos-action-deck-btn h-12 sm:h-14 rounded-xl font-mono font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 border transition-all shadow-md flex-shrink-0 shrink-0",
              ((sepet.length === 0 && iptalEdilecekSiparisler.length === 0) || siparisGonderiliyor)
                ? "bg-[#141A26] border-[#1E2638] text-slate-600 opacity-60 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400/40 shadow-[0_0_16px_rgba(16,185,129,0.3)] active:bg-emerald-700"
            )}
          >
            <Send size={18} className={clsx(siparisGonderiliyor && "animate-spin")} />
            {siparisGonderiliyor ? 'Gönderiliyor...' : 'Siparişi İlet'}
          </motion.button>

          {/* Ödeme Al (Kasa) */}
          <motion.button 
            whileTap={{ scale: 0.97 }}
            disabled={(!aktifHesap || aktifHesap.toplam_tutar === 0) && sepet.length === 0}
            onClick={() => setOdemeModalAcik(true)}
            className={clsx(
              "pos-action-deck-btn h-12 sm:h-14 rounded-xl font-mono font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 border transition-all shadow-md flex-shrink-0 shrink-0",
              ((!aktifHesap || aktifHesap.toplam_tutar === 0) && sepet.length === 0)
                ? "bg-[#141A26] border-[#1E2638] text-slate-600 opacity-60 cursor-not-allowed"
                : "bg-amber-500 hover:bg-amber-400 text-black border-amber-300/40 shadow-[0_0_16px_rgba(245,158,11,0.3)] active:bg-amber-600"
            )}
          >
            <CreditCard size={18} />
            Ödeme Al
          </motion.button>
        </div>
      </div>

      {/* Ödeme Modalı */}
      {odemeModalAcik && (
        <OdemeModal 
          isOpen={odemeModalAcik} 
          onClose={() => setOdemeModalAcik(false)} 
          toplamTutar={toplamTutar} 
        />
      )}

      {/* Miktar Modalı (Numpad) */}
      {miktarSoranKalem && (
        <Modal 
          isOpen={!!miktarSoranKalem} 
          onClose={() => setMiktarSoranKalem(null)} 
          title="Miktar Belirle"
        >
          <div className="flex flex-col gap-3 sm:gap-3.5 bg-[#0E121B] text-slate-100 select-none overflow-hidden">
            <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-[#141926] border border-[#222C42] flex-shrink-0 shrink-0">
              <span className="font-mono text-xs sm:text-sm font-bold text-slate-300">
                {miktarSoranKalem.urun.ad}
              </span>
              <span className="font-mono text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded uppercase">
                Birim: {miktarSoranKalem.urun.birim || 'Adet'}
              </span>
            </div>

            {/* Digital Quantity Display */}
            <input 
              type="text" 
              inputMode="decimal"
              autoFocus
              value={girilenMiktar} 
              onChange={e => {
                const val = e.target.value.replace(/[^0-9.,]/g, '')
                setGirilenMiktar(val.replace(',', '.'))
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const isKesirli = ['KG', 'GRAM', 'GR', 'LITRE', 'LT', 'L'].includes((miktarSoranKalem.urun.birim || '').toUpperCase());
                  const parsed = isKesirli ? parseFloat(girilenMiktar) : parseInt(girilenMiktar, 10);
                  if (!isNaN(parsed) && parsed > 0) {
                    handleMiktarDegistir(miktarSoranKalem.id, parsed)
                    setMiktarSoranKalem(null)
                  }
                }
              }}
              className="px-4 py-2.5 sm:py-3 border rounded-xl bg-[#090D15] border-[#222C42] focus:border-cyan-400 text-2xl sm:text-3xl font-black font-mono text-cyan-400 text-center outline-none shadow-inner flex-shrink-0 shrink-0" 
            />

            <div className="flex justify-center w-full my-0.5 flex-shrink-0 shrink-0">
              <Numpad
                layout={[
                  ['1', '2', '3'],
                  ['4', '5', '6'],
                  ['7', '8', '9'],
                  ['C', '0', ['KG', 'GRAM', 'GR', 'LITRE', 'LT', 'L'].includes((miktarSoranKalem?.urun?.birim || '').toUpperCase()) ? ',' : ''],
                  ['⌫']
                ]}
                onKeyPress={(key) => {
                  if (key === '⌫') {
                    setGirilenMiktar(prev => prev.slice(0, -1))
                  } else if (key === ',') {
                    if (['KG', 'GRAM', 'GR', 'LITRE', 'LT', 'L'].includes((miktarSoranKalem?.urun?.birim || '').toUpperCase()) && !girilenMiktar.includes('.')) {
                      setGirilenMiktar(prev => prev + '.')
                    }
                  } else if (key !== 'C' && key !== '') {
                    setGirilenMiktar(prev => prev === '0' ? key : prev + key)
                  }
                }}
                onClear={() => setGirilenMiktar('0')}
              />
            </div>

            <div className="flex gap-2.5 justify-end mt-1 pt-2.5 sm:pt-3 border-t border-[#1E2436] flex-shrink-0 shrink-0">
              <Button 
                variant="ghost" 
                size="md"
                onClick={() => setMiktarSoranKalem(null)}
                className="font-mono text-xs h-10"
              >
                İptal
              </Button>
              <Button 
                variant="primary" 
                size="md"
                className="font-mono font-bold text-xs px-6 h-10"
                onClick={() => {
                  const isKesirli = ['KG', 'GRAM', 'GR', 'LITRE', 'LT', 'L'].includes((miktarSoranKalem?.urun?.birim || '').toUpperCase());
                  const parsed = isKesirli ? parseFloat(girilenMiktar) : parseInt(girilenMiktar, 10);
                  if (!isNaN(parsed) && parsed > 0) {
                    handleMiktarDegistir(miktarSoranKalem.id, parsed)
                    setMiktarSoranKalem(null)
                  }
                }}
              >
                Uygula
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
