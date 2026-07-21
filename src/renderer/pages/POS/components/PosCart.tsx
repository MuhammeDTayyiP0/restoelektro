import React, { useState } from 'react'
import { usePosStore } from '../../../stores/usePosStore'
import { formatPara } from '../../../utils/formatters'
import { Button } from '../../../components/ui/Button'
import { Numpad } from '../../../components/ui/Numpad'
import { Modal } from '../../../components/ui/Modal'
import { Edit2, Minus, Plus, Trash2, UserPlus, FileText, Send, CreditCard, Ban, Gift, Printer } from 'lucide-react'
import { clsx } from 'clsx'
import { useAuthStore } from '../../../stores/useAuthStore'
import { useIPC, ipcInvoke } from '../../../hooks/useIPC'
import { HESAP_KANALLARI, AYAR_KANALLARI } from '../../../../common/ipc-channels'
import { useToast } from '../../../components/ui/Toast'
import { useNavigate } from 'react-router-dom'
import OdemeModal from './OdemeModal'
import { yazdirMutfak, yazdirAdisyon } from '../../../utils/print.utils'

export default function PosCart() {
  const { sepet, sepettenCikar, sepetMiktarGuncelle, sepetNotGuncelle, sepetIkramTogle, sepetiTemizle, aktifMasaId, aktifHesap, hesapAyarla, iptalEdilecekSiparisler, siparisIptalEkle, siparisIptalGeriAl, iptalleriTemizle } = usePosStore()
  const { personel } = useAuthStore()
  const { success, error } = useToast()
  const navigate = useNavigate()
  
  const [seciliKalemId, setSeciliKalemId] = useState<string | null>(null)
  const [miktarModalAcik, setMiktarModalAcik] = useState(false)
  const [odemeModalAcik, setOdemeModalAcik] = useState(false)
  const [siparisGonderiliyor, setSiparisGonderiliyor] = useState(false)
  const [notDuzenlenenKalemId, setNotDuzenlenenKalemId] = useState<string | null>(null)
  const [geciciNot, setGeciciNot] = useState('')

  // Toplam Tutar Hesaplama
  const toplamTutar = sepet.reduce((toplam, kalem) => {
    if (kalem.ikram) return toplam
    let kalemFiyati = kalem.urun.fiyat
    if (kalem.varyant) kalemFiyati += kalem.varyant.ek_fiyat
    kalem.opsiyonlar.forEach(opt => { kalemFiyati += opt.ek_fiyat })
    return toplam + (kalemFiyati * kalem.miktar)
  }, 0)

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
          ikram: k.ikram
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
    <div className="flex flex-col h-full w-full bg-white dark:bg-surface-900 relative">
      
      {/* Sepet Header */}
      <div className="flex items-center justify-between p-4 border-b border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-950 shrink-0">
        <div>
          <h2 className="text-pos-xl font-bold text-surface-900 dark:text-white leading-tight">
            {aktifMasaId ? `Masa ${aktifMasaId}` : 'Yeni Sipariş'}
          </h2>
          {aktifHesap && (
            <p className="text-sm text-surface-500">Hesap No: {aktifHesap.hesap_no}</p>
          )}
        </div>
        <div className="flex gap-2">
          {aktifHesap && (
            <Button 
              variant="outline" 
              className="rounded-full w-12 h-12 p-0 text-brand-600 border-brand-200 hover:bg-brand-50" 
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
              <Printer size={24} />
            </Button>
          )}
          {aktifHesap && (
            <Button 
              variant="danger" 
              className="rounded-full w-12 h-12 p-0" 
              title="Hesabı İptal Et"
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
              <Ban size={24} />
            </Button>
          )}
          <Button variant="ghost" className="rounded-full w-12 h-12 p-0" title="Müşteri Ekle">
            <UserPlus size={24} />
          </Button>
          <Button variant="ghost" className="rounded-full w-12 h-12 p-0" title="Hesap Notu">
            <FileText size={24} />
          </Button>
        </div>
      </div>

      {/* Sepet Listesi */}
      <div className="flex-1 overflow-y-auto pos-scrollbar bg-surface-50/50 dark:bg-surface-900/50">
        {sepet.length === 0 && (!aktifHesap?.siparisler || aktifHesap.siparisler.length === 0) ? (
          <div className="flex flex-col items-center justify-center h-full text-surface-400 p-6 text-center">
            <div className="w-24 h-24 mb-4 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
              <span className="text-4xl opacity-50">🛒</span>
            </div>
            <p className="text-pos-lg font-medium">Sepetiniz boş</p>
            <p className="text-sm mt-2">Sağ taraftaki menüden ürün seçerek sepete ekleyebilirsiniz.</p>
          </div>
        ) : null}
        
        <div className="flex flex-col pb-4">
          {/* Gönderilmiş Siparişler */}
          {aktifHesap?.siparisler && aktifHesap.siparisler.length > 0 && (
            <div className="flex flex-col mb-4">
              <div className="bg-surface-200 dark:bg-surface-800 px-4 py-2 text-xs font-bold text-surface-500 uppercase tracking-wider sticky top-0 z-10 shadow-sm border-b border-surface-300 dark:border-surface-700">
                Gönderilen Siparişler
              </div>
              {[...(aktifHesap.siparisler || [])].sort((a, b) => b.id - a.id).map((siparis: any) => (
                <div 
                  key={siparis.id} 
                  onClick={() => setSeciliKalemId(seciliKalemId === 'siparis-' + siparis.id ? null : 'siparis-' + siparis.id)}
                  className={clsx(
                    'flex flex-col p-4 border-b border-surface-200 dark:border-surface-800 transition-colors touch-feedback cursor-pointer',
                    seciliKalemId === 'siparis-' + siparis.id ? 'bg-surface-50 dark:bg-surface-800/80' : 'bg-white dark:bg-surface-900 hover:bg-surface-50 dark:hover:bg-surface-800'
                  )}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className={clsx("text-pos-base font-bold text-surface-900 dark:text-white", iptalEdilecekSiparisler.includes(siparis.id) && "line-through opacity-70")}>
                          {siparis.urun_adi}
                        </span>
                        {iptalEdilecekSiparisler.includes(siparis.id) && <span className="text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded uppercase tracking-wide">İptal Bekliyor</span>}
                        {!iptalEdilecekSiparisler.includes(siparis.id) && siparis.durum === 'bekliyor' && <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase tracking-wide">Bekliyor</span>}
                        {!iptalEdilecekSiparisler.includes(siparis.id) && siparis.durum === 'hazirlaniyor' && <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase tracking-wide">Hazırlanıyor</span>}
                        {!iptalEdilecekSiparisler.includes(siparis.id) && siparis.durum === 'hazir' && <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded uppercase tracking-wide">Hazır</span>}
                        {siparis.durum === 'iptal' && <span className="text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded uppercase tracking-wide">İptal</span>}
                        {siparis.ikram === 1 && <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded uppercase tracking-wide flex items-center gap-1"><Gift size={10} /> İkram</span>}
                      </div>
                      {siparis.varyant_adi && <span className={clsx("text-sm text-surface-500", iptalEdilecekSiparisler.includes(siparis.id) && "line-through opacity-70")}>[{siparis.varyant_adi}]</span>}
                      {siparis.notlar && <span className={clsx("text-sm italic mt-1", iptalEdilecekSiparisler.includes(siparis.id) ? "text-surface-400 line-through" : "text-amber-600 dark:text-amber-400")}>Not: {siparis.notlar}</span>}
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={clsx("text-pos-base font-bold", (siparis.durum === 'iptal' || iptalEdilecekSiparisler.includes(siparis.id)) ? "text-surface-400 line-through" : "text-surface-900 dark:text-white")}>
                        {formatPara(siparis.toplam_fiyat)}
                      </span>
                      <span className={clsx("text-sm text-surface-500", iptalEdilecekSiparisler.includes(siparis.id) && "line-through opacity-70")}>
                        {siparis.miktar} x {formatPara(siparis.birim_fiyat)}
                      </span>
                    </div>
                  </div>

                  {/* Sipariş İşlemleri */}
                  {seciliKalemId === 'siparis-' + siparis.id && siparis.durum !== 'iptal' && (
                    <div className="flex items-center justify-end mt-3 pt-3 border-t border-surface-200 dark:border-surface-700 animate-slide-down gap-2">
                      <Button 
                        variant={siparis.ikram === 1 ? "primary" : "outline"} 
                        size="sm"
                        className={clsx("w-10 h-10 p-0 rounded-pos", siparis.ikram === 1 && "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800")}
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
                        title="İkram Olarak İşaretle"
                      >
                        <Gift size={18} />
                      </Button>
                      <Button 
                        variant={iptalEdilecekSiparisler.includes(siparis.id) ? "outline" : "danger"} 
                        size="sm"
                        className="px-3"
                        leftIcon={iptalEdilecekSiparisler.includes(siparis.id) ? undefined : <Trash2 size={16} />}
                        onClick={async (e) => { 
                          e.stopPropagation()
                          if (iptalEdilecekSiparisler.includes(siparis.id)) {
                            siparisIptalGeriAl(siparis.id)
                          } else {
                            siparisIptalEkle(siparis.id)
                          }
                        }}
                      >
                        {iptalEdilecekSiparisler.includes(siparis.id) ? "Geri Al" : "İptal Et"}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Yeni Sepet */}
          {sepet.length > 0 && (
            <div className="flex flex-col">
              {aktifHesap?.siparisler && aktifHesap.siparisler.length > 0 && (
                <div className="bg-brand-100 dark:bg-brand-900/40 px-4 py-2 text-xs font-bold text-brand-700 dark:text-brand-300 uppercase tracking-wider sticky top-0 z-10 shadow-sm border-b border-brand-200 dark:border-brand-800">
                  Yeni Eklenecekler
                </div>
              )}
              {sepet.map((kalem) => (
              <div 
                key={kalem.id}
                onClick={() => setSeciliKalemId(seciliKalemId === kalem.id ? null : kalem.id)}
                className={clsx(
                  'flex flex-col p-4 border-b border-surface-200 dark:border-surface-800 transition-colors touch-feedback cursor-pointer',
                  seciliKalemId === kalem.id ? 'bg-brand-50 dark:bg-brand-900/20' : 'bg-white dark:bg-surface-900 hover:bg-surface-50 dark:hover:bg-surface-800'
                )}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-pos-base font-bold text-surface-900 dark:text-white">
                        {kalem.urun.ad}
                      </span>
                      {kalem.ikram && (
                        <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded uppercase tracking-wide flex items-center gap-1">
                          <Gift size={10} /> İkram
                        </span>
                      )}
                    </div>
                    {kalem.varyant && (
                      <span className="text-sm text-surface-500">[{kalem.varyant.ad}]</span>
                    )}
                    {kalem.opsiyonlar.map(opt => (
                      <span key={opt.id} className="text-xs text-surface-400">+ {opt.ad}</span>
                    ))}
                    {kalem.notlar && (
                      <span className="text-sm italic text-amber-600 dark:text-amber-400 mt-1">Not: {kalem.notlar}</span>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <span className={clsx("text-pos-base font-bold text-surface-900 dark:text-white", kalem.ikram && "line-through text-surface-400")}>
                      {formatPara((kalem.urun.fiyat + (kalem.varyant?.ek_fiyat || 0)) * kalem.miktar)}
                    </span>
                    <span className="text-sm text-surface-500">
                      {kalem.miktar} x {formatPara(kalem.urun.fiyat + (kalem.varyant?.ek_fiyat || 0))}
                    </span>
                  </div>
                </div>

                {/* Seçili Kalem İşlemleri */}
                {seciliKalemId === kalem.id && (
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-200 dark:border-surface-700 animate-slide-down">
                    <div className="flex items-center gap-1 bg-surface-100 dark:bg-surface-800 rounded-pos p-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="w-10 h-10 p-0 text-surface-700 dark:text-surface-300"
                        onClick={(e) => { e.stopPropagation(); handleMiktarDegistir(kalem.id, kalem.miktar - 1) }}
                      >
                        <Minus size={20} />
                      </Button>
                      <button 
                        className="w-12 text-center text-lg font-bold"
                        onClick={(e) => { e.stopPropagation(); setMiktarModalAcik(true) }}
                      >
                        {kalem.miktar}
                      </button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="w-10 h-10 p-0 text-brand-600 dark:text-brand-400"
                        onClick={(e) => { e.stopPropagation(); handleMiktarDegistir(kalem.id, kalem.miktar + 1) }}
                      >
                        <Plus size={20} />
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant={notDuzenlenenKalemId === kalem.id ? "primary" : "outline"} 
                        size="sm"
                        className="w-10 h-10 p-0 rounded-pos"
                        onClick={(e) => { 
                          e.stopPropagation()
                          if (notDuzenlenenKalemId === kalem.id) {
                            setNotDuzenlenenKalemId(null)
                          } else {
                            setNotDuzenlenenKalemId(kalem.id)
                            setGeciciNot(kalem.notlar)
                          }
                        }}
                      >
                        <FileText size={18} />
                      </Button>
                      <Button 
                        variant={kalem.ikram ? "primary" : "outline"} 
                        size="sm"
                        className={clsx("w-10 h-10 p-0 rounded-pos", kalem.ikram && "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800")}
                        onClick={(e) => { e.stopPropagation(); sepetIkramTogle(kalem.id) }}
                        title="İkram Olarak İşaretle"
                      >
                        <Gift size={18} />
                      </Button>
                      <Button 
                        variant="danger" 
                        size="sm"
                        className="w-10 h-10 p-0 rounded-pos"
                        onClick={(e) => { e.stopPropagation(); sepettenCikar(kalem.id) }}
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Not Düzenleme Alanı */}
                {seciliKalemId === kalem.id && notDuzenlenenKalemId === kalem.id && (
                  <div className="mt-3 flex gap-2 animate-slide-down" onClick={e => e.stopPropagation()}>
                    <input 
                      type="text" 
                      className="flex-1 bg-surface-100 dark:bg-surface-900 border border-surface-300 dark:border-surface-700 rounded-pos px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
                      placeholder="Sipariş notu girin..."
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
                      onClick={() => {
                        sepetNotGuncelle(kalem.id, geciciNot)
                        setNotDuzenlenenKalemId(null)
                      }}
                    >
                      Kaydet
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
          )}

        </div>
      </div>

      {/* Toplam ve Ödeme Alanı */}
      <div className="p-4 bg-white dark:bg-surface-900 border-t border-surface-200 dark:border-surface-800 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] shrink-0">
        
        {/* Varsa Aktif Hesap Özeti */}
        {aktifHesap && aktifHesap.toplam_tutar > 0 && (
          <div className="flex justify-between items-center mb-3 text-surface-600 dark:text-surface-400 px-1">
            <span className="font-medium">Önceki Siparişler</span>
            <span className="font-bold">{formatPara(aktifHesap.toplam_tutar)}</span>
          </div>
        )}

        {/* Sepet Toplamı */}
        <div className="flex justify-between items-end mb-4 px-1">
          <span className="text-pos-lg font-bold text-surface-900 dark:text-surface-100">Yeni Eklenecek</span>
          <span className="text-pos-3xl font-black text-brand-500 leading-none">
            {formatPara(toplamTutar)}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="primary" 
            size="pos" 
            leftIcon={<Send size={28} />}
            disabled={(sepet.length === 0 && iptalEdilecekSiparisler.length === 0) || siparisGonderiliyor}
            onClick={handleSiparisGonder}
          >
            {siparisGonderiliyor ? 'Gönderiliyor...' : 'Sipariş'}
          </Button>
          <Button 
            variant="success" 
            size="pos" 
            leftIcon={<CreditCard size={28} />}
            disabled={(!aktifHesap || aktifHesap.toplam_tutar === 0) && sepet.length === 0}
            onClick={() => setOdemeModalAcik(true)}
          >
            Ödeme Al
          </Button>
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
    </div>
  )
}
