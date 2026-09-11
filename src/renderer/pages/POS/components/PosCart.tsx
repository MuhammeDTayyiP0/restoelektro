import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { usePosStore, type SepetKalemi } from '../../../stores/usePosStore'
import { formatPara, hesaplaKalemTutari } from '../../../utils/formatters'
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
  ShoppingBag,
  Tag
} from 'lucide-react'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../../../stores/useAuthStore'
import { ipcInvoke } from '../../../hooks/useIPC'
import { HESAP_KANALLARI, AYAR_KANALLARI } from '../../../../common/ipc-channels'
import { useToast } from '../../../components/ui/Toast'
import { useNavigate, useSearchParams } from 'react-router-dom'
import OdemeModal from './OdemeModal'
import IndirimModal from './IndirimModal'
import { yazdirMutfak, yazdirAdisyon } from '../../../utils/print.utils'

// =====================================================
// 1. MUTFAKTAKİ SİPARİŞ KALEMİ (MEMOIZED)
// =====================================================
interface MutfakSiparisItemProps {
  siparis: any
  isSelected: boolean
  isIptalBekliyor: boolean
  onSelect: (id: string) => void
  onIkramToggle: (siparisId: number) => void
  onIptalToggle: (siparisId: number) => void
}

const MutfakSiparisItem = React.memo(function MutfakSiparisItem({
  siparis,
  isSelected,
  isIptalBekliyor,
  onSelect,
  onIkramToggle,
  onIptalToggle,
}: MutfakSiparisItemProps) {
  const isIptal = siparis.durum === 'iptal' || isIptalBekliyor
  const isKgSiparis = (
    siparis.satis_birim?.toLowerCase() === 'kg' ||
    siparis.satis_birim?.toLowerCase() === 'kilo' ||
    (siparis as any).satisBirim?.toLowerCase() === 'kg' ||
    (siparis as any).secilenSatisTuru?.toLowerCase() === 'kg' ||
    (siparis.urun_birim?.toLowerCase() === 'kg') ||
    (siparis.gramaj !== undefined && Number(siparis.gramaj) > 0)
  )

  return (
    <div 
      onClick={() => onSelect('siparis-' + siparis.id)}
      className={clsx(
        'flex gap-2.5 px-3 py-2.5 transition-all cursor-pointer select-none',
        isSelected ? 'bg-[#241F1A]' : 'hover:bg-[#1e1a16]/80',
        isIptal && 'opacity-50'
      )}
    >
      <div className="w-8 h-8 rounded-full bg-[#1A1612] border border-[#322C26] flex items-center justify-center font-mono text-[13px] font-semibold tabular-nums text-surface-300 shrink-0 mt-0.5">
        {siparis.miktar}
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <div className="flex flex-col flex-1 min-w-0">
            <span className={clsx(
              "text-sm font-medium tracking-tight truncate",
              isIptal ? "line-through text-surface-400" : "text-surface-50"
            )} title={siparis.urun_adi}>
              {siparis.urun_adi}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              {isKgSiparis ? (
                <span className="text-[11px] font-mono text-surface-400">
                  {siparis.gramaj ? `${siparis.gramaj} kg` : 'kg'}
                </span>
              ) : (
                siparis.porsiyon && siparis.porsiyon !== 1 && (
                  <span className="text-[11px] text-surface-400">
                    {siparis.porsiyon === 2 ? 'duble' : `${siparis.porsiyon}p`}
                  </span>
                )
              )}
              {isIptalBekliyor && <span className="text-[11px] text-rose-300">iptal bekliyor</span>}
              {!isIptalBekliyor && siparis.durum === 'bekliyor' && <span className="text-[11px] text-amber-300/90">bekliyor</span>}
              {!isIptalBekliyor && siparis.durum === 'hazirlaniyor' && <span className="text-[11px] text-brand-300">hazırlanıyor</span>}
              {!isIptalBekliyor && siparis.durum === 'hazir' && <span className="text-[11px] text-emerald-400">hazır</span>}
              {siparis.durum === 'iptal' && <span className="text-[11px] text-surface-500">iptal</span>}
              {siparis.ikram === 1 && <span className="text-[11px] text-brand-300">ikram</span>}
            </div>
            {siparis.varyant_adi && (
              <span className={clsx("text-[11px] text-surface-400 mt-0.5 truncate", isIptal && "line-through")}>
                {siparis.varyant_adi}
              </span>
            )}
            {siparis.notlar && (
              <span className={clsx("text-[11px] italic mt-0.5 flex items-center gap-1 truncate", isIptal ? "text-surface-500 line-through" : "text-amber-400")}>
                <AlertCircle size={9} className="shrink-0" /> {siparis.notlar}
              </span>
            )}
          </div>
          <span className={clsx(
            "text-sm font-mono font-semibold tabular-nums shrink-0",
            (isIptal || siparis.ikram === 1) ? "text-surface-500 line-through" : "text-surface-50"
          )}>
            {formatPara(siparis.toplam_fiyat)}
          </span>
        </div>

      {/* Sipariş Aksiyon Çekmecesi */}
      <AnimatePresence>
        {isSelected && siparis.durum !== 'iptal' && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-end mt-2.5 pt-2.5 border-t border-[#322C26] gap-2"
          >
            <motion.button 
              whileTap={{ scale: 0.95 }}
              className={clsx(
                "h-9 px-3 rounded-lg font-mono text-xs font-bold border flex items-center gap-1.5 transition-colors",
                siparis.ikram === 1 
                  ? "bg-purple-500/20 text-purple-300 border-purple-500/40 hover:bg-purple-500/30" 
                  : "bg-[#1E1A16] text-slate-300 border-[#403830] hover:border-purple-500/40 hover:text-purple-300"
              )}
              onClick={(e) => {
                e.stopPropagation()
                onIkramToggle(siparis.id)
              }}
            >
              <Gift size={14} />
              {siparis.ikram === 1 ? 'İkramı Kaldır' : 'İkram Yap'}
            </motion.button>

            <motion.button 
              whileTap={{ scale: 0.95 }}
              className={clsx(
                "h-9 px-3 rounded-lg font-mono text-xs font-bold border flex items-center gap-1.5 transition-colors",
                isIptalBekliyor 
                  ? "bg-[#1E1A16] text-amber-300 border-amber-500/40 hover:bg-amber-500/10" 
                  : "bg-rose-500/15 text-rose-300 border-rose-500/40 hover:bg-rose-500/25"
              )}
              onClick={(e) => { 
                e.stopPropagation()
                onIptalToggle(siparis.id)
              }}
            >
              <Trash2 size={14} />
              {isIptalBekliyor ? "İptali Geri Al" : "Siparişi İptal Et"}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </div>
  )
})
// =====================================================
interface SepetItemProps {
  kalem: SepetKalemi
  isSelected: boolean
  isEditingNote: boolean
  onSelect: (id: string) => void
  onMiktarDegistir: (id: string, miktar: number) => void
  onOpenMiktarModal: (kalem: SepetKalemi) => void
  onToggleNoteEdit: (id: string) => void
  onSaveNote: (id: string, notlar: string) => void
  onIkramToggle: (id: string) => void
  onDelete: (id: string) => void
}

const SepetItem = React.memo(function SepetItem({
  kalem,
  isSelected,
  isEditingNote,
  onSelect,
  onMiktarDegistir,
  onOpenMiktarModal,
  onToggleNoteEdit,
  onSaveNote,
  onIkramToggle,
  onDelete,
}: SepetItemProps) {
  const [localNote, setLocalNote] = useState(kalem.notlar || '')

  useEffect(() => {
    setLocalNote(kalem.notlar || '')
  }, [kalem.notlar])

  const { toplamKalemFiyat, isKg } = hesaplaKalemTutari(kalem)

  return (
    <div 
      onClick={() => onSelect(kalem.id)}
      className={clsx(
        'flex flex-col px-3 py-2.5 transition-all cursor-pointer select-none border-l-[3px] border-l-brand-500/80',
        isSelected ? 'bg-[#241F1A]' : 'bg-[#1A1612] hover:bg-[#1e1a16]'
      )}
    >
      <div className="flex gap-2.5">
        <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/40 flex items-center justify-center font-mono text-[13px] font-semibold tabular-nums text-brand-200 shrink-0 mt-0.5">
          {kalem.miktar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-medium tracking-tight text-surface-50 truncate" title={kalem.urun.ad}>
                {isKg && kalem.gramaj ? `${kalem.gramaj} kg ` : ''}{kalem.urun.ad}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                {isKg ? (
                  <span className="text-[11px] font-mono text-surface-400">{kalem.gramaj ? `${kalem.gramaj} kg` : 'kg'}</span>
                ) : (
                  kalem.porsiyon && kalem.porsiyon !== 1 && (
                    <span className="text-[11px] text-surface-400">{kalem.porsiyon === 2 ? 'duble' : `${kalem.porsiyon}p`}</span>
                  )
                )}
                {kalem.ikram && <span className="text-[11px] text-brand-300">ikram</span>}
              </div>
              {kalem.varyant && (
                <span className="text-[11px] text-surface-400 mt-0.5 truncate">{kalem.varyant.ad}</span>
              )}
              {kalem.opsiyonlar.map(opt => (
                <span key={opt.id} className="text-[11px] text-surface-400 truncate">+ {opt.ad}</span>
              ))}
              {kalem.notlar && (
                <span className="text-[11px] italic text-amber-400 mt-0.5 flex items-center gap-1 truncate">
                  <AlertCircle size={9} className="shrink-0" /> {kalem.notlar}
                </span>
              )}
            </div>
            <span className={clsx(
              "text-sm font-mono font-semibold tabular-nums shrink-0",
              kalem.ikram ? "line-through text-surface-500" : "text-brand-200"
            )}>
              {formatPara(toplamKalemFiyat)}
            </span>
          </div>
        </div>
      </div>

      {/* Seçili Kalem İşlem Çubuğu */}
      <AnimatePresence>
        {isSelected && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#3A342C] gap-2"
          >
            {/* Miktar Arttır / Azalt / Doğrudan Gir Butonları */}
            <div className="flex items-center bg-[#171410] border border-[#403830] rounded-lg p-0.5 shadow-inner">
              <motion.button 
                whileTap={{ scale: 0.9 }}
                className="w-9 h-9 flex items-center justify-center rounded-md bg-[#241f1a] hover:bg-[#3A342C] text-slate-200"
                onClick={(e) => { e.stopPropagation(); onMiktarDegistir(kalem.id, kalem.miktar - 1) }}
              >
                <Minus size={16} />
              </motion.button>

              <button 
                className="w-12 h-9 text-center font-mono font-bold text-brand-300 text-sm hover:bg-[#241f1a] rounded px-1 transition-colors"
                onClick={(e) => { 
                  e.stopPropagation(); 
                  onOpenMiktarModal(kalem)
                }}
                title="Miktarı klavyeden girmek için dokunun"
              >
                {kalem.miktar}
              </button>

              <motion.button 
                whileTap={{ scale: 0.9 }}
                className="w-9 h-9 flex items-center justify-center rounded-md bg-[#241f1a] hover:bg-[#3A342C] text-brand-300"
                onClick={(e) => { e.stopPropagation(); onMiktarDegistir(kalem.id, kalem.miktar + 1) }}
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
                  isEditingNote 
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/50" 
                    : "bg-[#1E1A16] text-slate-300 border-[#403830] hover:border-amber-500/40 hover:text-amber-300"
                )}
                onClick={(e) => { 
                  e.stopPropagation()
                  onToggleNoteEdit(kalem.id)
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
                    : "bg-[#1E1A16] text-slate-300 border-[#403830] hover:border-purple-500/40 hover:text-purple-300"
                )}
                onClick={(e) => { e.stopPropagation(); onIkramToggle(kalem.id) }}
                title="İkram Olarak İşaretle"
              >
                <Gift size={16} />
              </motion.button>

              {/* Sil Butonu */}
              <motion.button 
                whileTap={{ scale: 0.95 }}
                className="w-9 h-9 rounded-lg bg-rose-500/15 border border-rose-500/40 hover:bg-rose-500/25 text-rose-300 flex items-center justify-center transition-colors"
                onClick={(e) => { e.stopPropagation(); onDelete(kalem.id) }}
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
        {isSelected && isEditingNote && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2.5 flex gap-2 pt-2 border-t border-[#3A342C]" 
            onClick={e => e.stopPropagation()}
          >
            <input 
              type="text" 
              className="h-8 px-2.5 rounded-lg bg-[#0B0A08] border border-[#322C26] text-xs text-surface-50 placeholder:text-surface-500 focus:outline-none focus:border-brand-500/60"
              placeholder="Sipariş notu (ör: Az pişmiş, buzsuz)..."
              value={localNote}
              onChange={e => setLocalNote(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  onSaveNote(kalem.id, localNote)
                }
              }}
              autoFocus
            />
            <Button 
              variant="primary" 
              size="sm"
              className="h-8 text-xs font-mono font-bold px-3 rounded-lg"
              onClick={() => {
                onSaveNote(kalem.id, localNote)
              }}
            >
              Kaydet
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}, (prevProps, nextProps) => {
  return (
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isEditingNote === nextProps.isEditingNote &&
    prevProps.kalem.id === nextProps.kalem.id &&
    prevProps.kalem.miktar === nextProps.kalem.miktar &&
    prevProps.kalem.notlar === nextProps.kalem.notlar &&
    prevProps.kalem.porsiyon === nextProps.kalem.porsiyon &&
    prevProps.kalem.secilenSatisTuru === nextProps.kalem.secilenSatisTuru &&
    prevProps.kalem.gramaj === nextProps.kalem.gramaj &&
    prevProps.kalem.satisBirim === nextProps.kalem.satisBirim &&
    prevProps.kalem.ikram === nextProps.kalem.ikram &&
    prevProps.kalem.urun === nextProps.kalem.urun &&
    prevProps.kalem.varyant === nextProps.kalem.varyant &&
    prevProps.kalem.opsiyonlar === nextProps.kalem.opsiyonlar &&
    prevProps.onSelect === nextProps.onSelect &&
    prevProps.onMiktarDegistir === nextProps.onMiktarDegistir &&
    prevProps.onOpenMiktarModal === nextProps.onOpenMiktarModal &&
    prevProps.onToggleNoteEdit === nextProps.onToggleNoteEdit &&
    prevProps.onSaveNote === nextProps.onSaveNote &&
    prevProps.onIkramToggle === nextProps.onIkramToggle &&
    prevProps.onDelete === nextProps.onDelete
  )
})

// =====================================================
// 3. İZOLE EDİLMİŞ MİKTAR MODALI (NUMPAD)
// =====================================================
interface QuantityModalProps {
  kalem: SepetKalemi | null
  onClose: () => void
  onApply: (kalemId: string, miktar: number) => void
}

const QuantityModal = React.memo(function QuantityModal({ kalem, onClose, onApply }: QuantityModalProps) {
  const [girilenMiktar, setGirilenMiktar] = useState('')

  useEffect(() => {
    if (kalem) {
      setGirilenMiktar(kalem.miktar.toString())
    }
  }, [kalem])

  if (!kalem) return null

  const isKesirli = ['KG', 'GRAM', 'GR', 'LITRE', 'LT', 'L'].includes((kalem.urun?.birim || '').toUpperCase())

  const handleApply = () => {
    const parsed = isKesirli ? parseFloat(girilenMiktar) : parseInt(girilenMiktar, 10)
    if (!isNaN(parsed) && parsed > 0) {
      onApply(kalem.id, parsed)
      onClose()
    }
  }

  return (
    <Modal 
      isOpen={!!kalem} 
      onClose={onClose} 
      title="Miktar Belirle"
    >
      <div 
        className="relative z-50 isolate flex flex-col gap-2 sm:gap-3 bg-[#171410] text-slate-100 select-none overflow-y-auto pos-scrollbar max-h-[85vh] p-1"
        style={{ transform: 'translateZ(0)' }}
      >
        <div className="flex items-center justify-between p-2 sm:p-2.5 rounded-xl bg-[#1e1a16] border border-[#3A342C] flex-shrink-0 shrink-0">
          <span className="font-mono text-xs sm:text-sm font-bold text-slate-300 truncate max-w-[200px]">
            {kalem.urun.ad}
          </span>
          <span className="font-mono text-[10px] sm:text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded uppercase shrink-0">
            Birim: {kalem.urun.birim || 'Adet'}
          </span>
        </div>

        {/* Digital Quantity Display */}
        <input 
          key={kalem?.id || 'quantity-input'}
          type="text" 
          inputMode="decimal"
          autoComplete="off"
          autoFocus
          placeholder="0"
          value={girilenMiktar} 
          onChange={e => {
            let val = e.target.value.replace(/,/g, '.').replace(/[^0-9.]/g, '')
            const parts = val.split('.')
            if (parts.length > 2) {
              val = parts[0] + '.' + parts.slice(1).join('')
            }
            setGirilenMiktar(val)
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              handleApply()
            }
          }}
          className="px-4 py-1.5 sm:py-2 border rounded-xl bg-[#110F0C] border-[#3A342C] focus:border-cyan-400 text-xl sm:text-2xl font-black font-mono text-cyan-400 text-center outline-none shadow-inner flex-shrink-0 shrink-0 h-10 sm:h-12" 
        />

        <div className="flex justify-center w-full my-0.5 flex-shrink-0 shrink-0">
          <Numpad
            layout={[
              ['1', '2', '3'],
              ['4', '5', '6'],
              ['7', '8', '9'],
              ['C', '0', isKesirli ? ',' : ''],
              ['⌫']
            ]}
            onKeyPress={(key) => {
              if (key === '⌫') {
                setGirilenMiktar(prev => prev.slice(0, -1))
              } else if (key === ',' || key === '.') {
                if (isKesirli && !girilenMiktar.includes('.')) {
                  setGirilenMiktar(prev => (prev || '0') + '.')
                }
              } else if (key !== 'C' && key !== '') {
                setGirilenMiktar(prev => (!prev || prev === '0') ? key : prev + key)
              }
            }}
            onClear={() => setGirilenMiktar('')}
          />
        </div>

        <div className="flex gap-2 justify-end mt-0.5 pt-2 sm:pt-2.5 border-t border-[#322C26] flex-shrink-0 shrink-0">
          <Button 
            variant="ghost" 
            size="md" 
            onClick={onClose}
            className="font-mono text-xs h-9 sm:h-10"
          >
            İptal
          </Button>
          <Button 
            variant="primary" 
            size="md" 
            className="font-mono font-bold text-xs px-5 sm:px-6 h-9 sm:h-10"
            onClick={handleApply}
          >
            Uygula
          </Button>
        </div>
      </div>
    </Modal>
  )
})

// =====================================================
// 4. ANA POS CART BİLEŞENİ
// =====================================================
export const PosCart = React.memo(function PosCart() {
  const sepet = usePosStore(state => state.sepet)
  const sepettenCikar = usePosStore(state => state.sepettenCikar)
  const sepetMiktarGuncelle = usePosStore(state => state.sepetMiktarGuncelle)
  const sepetNotGuncelle = usePosStore(state => state.sepetNotGuncelle)
  const sepetIkramTogle = usePosStore(state => state.sepetIkramTogle)
  const sepetiTemizle = usePosStore(state => state.sepetiTemizle)
  const aktifMasaId = usePosStore(state => state.aktifMasaId)
  const aktifHesap = usePosStore(state => state.aktifHesap)
  const hesapAyarla = usePosStore(state => state.hesapAyarla)
  const iptalEdilecekSiparisler = usePosStore(state => state.iptalEdilecekSiparisler)
  const siparisIptalEkle = usePosStore(state => state.siparisIptalEkle)
  const siparisIptalGeriAl = usePosStore(state => state.siparisIptalGeriAl)
  const iptalleriTemizle = usePosStore(state => state.iptalleriTemizle)

  const { personel } = useAuthStore()
  const { success, error } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const siparisTipi = (aktifHesap?.hesap_tipi || searchParams.get('tip') || (aktifMasaId ? 'masa' : 'gel_al')) as string

  const [seciliKalemId, setSeciliKalemId] = useState<string | null>(null)
  const [odemeModalAcik, setOdemeModalAcik] = useState(false)
  const [indirimModalAcik, setIndirimModalAcik] = useState(false)
  const [miktarSoranKalem, setMiktarSoranKalem] = useState<SepetKalemi | null>(null)
  const [siparisGonderiliyor, setSiparisGonderiliyor] = useState(false)
  const [notDuzenlenenKalemId, setNotDuzenlenenKalemId] = useState<string | null>(null)
  const [teslimat, setTeslimat] = useState({
    teslimat_musteri: '',
    teslimat_telefon: '',
    teslimat_adres: '',
    kurye: '',
  })

  useEffect(() => {
    if (!aktifHesap) return
    setTeslimat({
      teslimat_musteri: (aktifHesap as any).teslimat_musteri || '',
      teslimat_telefon: (aktifHesap as any).teslimat_telefon || '',
      teslimat_adres: (aktifHesap as any).teslimat_adres || '',
      kurye: (aktifHesap as any).kurye || '',
    })
  }, [aktifHesap?.id])

  const handleAdisyonYazdir = useCallback(async () => {
    if (!aktifHesap) return
    try {
      const kasaYazici = await ipcInvoke<string>(AYAR_KANALLARI.GETIR, 'kasa_yazici')
      if (!kasaYazici) {
        error('Hata', 'Kasa yazıcısı ayarlanmamış.')
        return
      }
      const ayarlar = await ipcInvoke<Record<string, string>>(AYAR_KANALLARI.TUMU)
      const restoranBilgileri = {
        ad: ayarlar['restoran_adi'] || '',
        telefon: ayarlar['restoran_telefon'] || '',
        adres: ayarlar['restoran_adres'] || '',
        altNot: ayarlar['fis_alt_not'] || ''
      }
      const basarili = await yazdirAdisyon(aktifHesap, kasaYazici, restoranBilgileri)
      if (basarili) success('Başarılı', 'Adisyon yazdırıldı.')
      else error('Hata', 'Yazdırma işlemi başarısız.')
    } catch (e: any) {
      error('Hata', e.message)
    }
  }, [aktifHesap, error, success])

  // Toplam Tutar Hesaplama (useMemo)
  const toplamTutar = useMemo(() => {
    return sepet.reduce((toplam, kalem) => {
      if (kalem.ikram) return toplam
      const { toplamKalemFiyat } = hesaplaKalemTutari(kalem)
      return toplam + toplamKalemFiyat
    }, 0)
  }, [sepet])

  // Genel Toplam (Önceki siparişler + yeni eklenecekler)
  const genelToplamTutar = useMemo(() => {
    return (aktifHesap?.toplam_tutar || 0) + toplamTutar
  }, [aktifHesap?.toplam_tutar, toplamTutar])

  const handleMiktarDegistir = useCallback((id: string, miktar: number) => {
    if (miktar <= 0) {
      sepettenCikar(id)
    } else {
      sepetMiktarGuncelle(id, miktar)
    }
  }, [sepettenCikar, sepetMiktarGuncelle])

  const handleToggleSelect = useCallback((id: string) => {
    setSeciliKalemId(prev => prev === id ? null : id)
  }, [])

  const handleToggleNoteEdit = useCallback((id: string) => {
    setNotDuzenlenenKalemId(prev => prev === id ? null : id)
  }, [])

  const handleSaveNote = useCallback((id: string, note: string) => {
    sepetNotGuncelle(id, note)
    setNotDuzenlenenKalemId(null)
  }, [sepetNotGuncelle])

  const handleMutfakIkramToggle = useCallback(async (siparisId: number) => {
    try {
      const res = await ipcInvoke<any>(HESAP_KANALLARI.SIPARIS_IKRAM_TOGGLE, siparisId, personel?.id || 1)
      if (res && res.basarili) {
        if (res.yeniIkram === 1) success('İkram Uygulandı', 'Sipariş ikram olarak işaretlendi.')
        else success('İkram Kaldırıldı', 'Siparişin ikram durumu kaldırıldı.')
        if (aktifHesap?.id) {
          const guncelHesap = await ipcInvoke<any>(HESAP_KANALLARI.DETAY, aktifHesap.id)
          hesapAyarla(guncelHesap, aktifMasaId)
        }
      } else {
        error('Hata', res.hata || 'İkram işlemi başarısız.')
      }
    } catch(err: any) {
      error('Hata', err.message)
    }
  }, [personel?.id, aktifHesap?.id, aktifMasaId, hesapAyarla, success, error])

  const handleMutfakIptalToggle = useCallback((siparisId: number) => {
    if (iptalEdilecekSiparisler.includes(siparisId)) {
      siparisIptalGeriAl(siparisId)
    } else {
      siparisIptalEkle(siparisId)
    }
  }, [iptalEdilecekSiparisler, siparisIptalGeriAl, siparisIptalEkle])

  const handleSiparisGonder = useCallback(async () => {
    if (sepet.length === 0 && iptalEdilecekSiparisler.length === 0) return
    setSiparisGonderiliyor(true)

    try {
      let mevcutHesapId = aktifHesap?.id

      if (!mevcutHesapId) {
        const tip = siparisTipi === 'masa' && !aktifMasaId ? 'gel_al' : siparisTipi
        const ekstra = (tip === 'paket' || tip === 'gel_al') ? teslimat : null
        const hesapAcRes = await ipcInvoke<any>(
          HESAP_KANALLARI.AC,
          aktifMasaId || null,
          personel?.id || 1,
          tip,
          1,
          ekstra
        )
        if (hesapAcRes && hesapAcRes.basarili) {
          mevcutHesapId = hesapAcRes.hesap_id
          window.history.replaceState(null, '', `#/pos/${mevcutHesapId}`)
        } else {
          throw new Error(hesapAcRes?.hata || 'Hesap açılamadı')
        }
      }

      // 1. İptalleri Gönder
      const iptalEdilenSiparislerDetay = []
      if (iptalEdilecekSiparisler.length > 0 && aktifHesap?.siparisler) {
        for (const iptalId of iptalEdilecekSiparisler) {
          const detay = aktifHesap.siparisler.find((s: any) => s.id === iptalId)
          if (detay) iptalEdilenSiparislerDetay.push(detay)
          
          await ipcInvoke<any>(HESAP_KANALLARI.SIPARIS_IPTAL, iptalId, 'Müşteri İsteği', personel?.id || 1)
        }
      }

      // 2. Yeni Siparişleri Gönder
      let siparisRes = null
      if (sepet.length > 0) {
        const yeniSiparisler = sepet.map(k => {
          const { birimHesapliFiyat, toplamKalemFiyat, isKg } = hesaplaKalemTutari(k)
          return {
            urun_id: k.urun.id,
            varyant_id: k.varyant?.id,
            opsiyon_idleri: k.opsiyonlar.map(o => o.id),
            miktar: k.miktar,
            notlar: k.notlar,
            ikram: k.ikram,
            porsiyon: isKg ? 1 : k.porsiyon,
            birim_fiyat: birimHesapliFiyat,
            toplam_fiyat: toplamKalemFiyat,
            secilenSatisTuru: isKg ? 'kg' : 'porsiyon',
            satisBirim: isKg ? 'kg' : 'porsiyon',
            gramaj: isKg ? k.gramaj : undefined
          }
        })
        siparisRes = await ipcInvoke<any>(HESAP_KANALLARI.SIPARIS_EKLE, mevcutHesapId, personel?.id || 1, yeniSiparisler)
        if (!siparisRes || !siparisRes.basarili) {
          throw new Error(siparisRes?.hata || 'Sipariş gönderilemedi')
        }
      }

      success('İşlem Başarılı', 'Değişiklikler mutfağa iletildi.')
      
      // Mutfak yazıcısı ayarlıysa yazdır
      try {
        const mutfakYazici = await ipcInvoke<string>(AYAR_KANALLARI.GETIR, 'mutfak_yazici')
        if (mutfakYazici && (sepet.length > 0 || iptalEdilenSiparislerDetay.length > 0)) {
          yazdirMutfak(sepet, aktifMasaId ? aktifMasaId.toString() : (siparisTipi === 'paket' ? 'PAKET' : 'GEL-AL'), mutfakYazici, iptalEdilenSiparislerDetay)
        }
      } catch (printErr) {
        console.error("Mutfak yazdırma hatası:", printErr)
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
  }, [
    sepet, 
    iptalEdilecekSiparisler, 
    aktifHesap, 
    aktifMasaId, 
    personel?.id, 
    siparisTipi,
    teslimat,
    success, 
    error, 
    sepetiTemizle, 
    iptalleriTemizle, 
    hesapAyarla
  ])

  // Mutfaktaki siparişlerin sıralanmış listesi
  const siraliMutfakSiparisleri = useMemo(() => {
    if (!aktifHesap?.siparisler) return []
    return [...aktifHesap.siparisler].sort((a, b) => b.id - a.id)
  }, [aktifHesap?.siparisler])

  return (
    <div className="flex flex-col h-full w-full bg-[#171410] text-surface-100 relative overflow-hidden select-none">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#322C26] shrink-0">
        <div className="min-w-0">
          <div className="text-lg font-semibold tracking-tight text-surface-50 leading-tight truncate">
            {aktifMasaId
              ? `Masa ${aktifMasaId}`
              : siparisTipi === 'paket'
                ? 'Paket'
                : siparisTipi === 'gel_al'
                  ? 'Gel-al'
                  : 'Hızlı satış'}
          </div>
          <div className="text-[12px] text-surface-400 mt-0.5">
            {aktifHesap ? aktifHesap.hesap_no : 'Yeni adisyon'}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {aktifHesap && (
            <button
              type="button"
              className="w-10 h-10 rounded-xl bg-[#1e1a16] border border-[#322C26] text-surface-300 hover:text-surface-50 flex items-center justify-center"
              title="Adisyon yazdır"
              onClick={handleAdisyonYazdir}
            >
              <Printer size={16} />
            </button>
          )}
          {aktifHesap && (
            <button
              type="button"
              className="w-10 h-10 rounded-xl bg-[#1e1a16] border border-[#322C26] text-surface-300 hover:text-rose-300 flex items-center justify-center"
              title="Hesabı iptal et"
              onClick={async () => {
                if (window.confirm('Bu hesabı tamamen iptal edip masayı boşaltmak istediğinize emin misiniz?')) {
                  try {
                    const res = await ipcInvoke<any>(HESAP_KANALLARI.IPTAL, aktifHesap.id)
                    if (res && res.basarili) {
                      success('Hesap İptal Edildi', 'Masa boşaltıldı.')
                      hesapAyarla(null, null)
                      navigate(siparisTipi === 'paket' || siparisTipi === 'gel_al' ? '/delivery' : '/tables')
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
            </button>
          )}
          {sepet.length > 0 && (
            <button
              type="button"
              className="w-10 h-10 rounded-xl bg-[#1e1a16] border border-[#322C26] text-surface-300 hover:text-amber-300 flex items-center justify-center"
              title="Taslağı temizle"
              onClick={() => {
                if (window.confirm('Taslaktaki tüm ürünleri silmek istiyor musunuz?')) {
                  sepetiTemizle()
                }
              }}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {(siparisTipi === 'paket' || siparisTipi === 'gel_al') && (
        <div className="px-3 py-2 border-b border-[#322C26] bg-[#110F0C] space-y-1.5 shrink-0">
          <input
            placeholder="Müşteri adı"
            value={teslimat.teslimat_musteri}
            onChange={(e) => setTeslimat({ ...teslimat, teslimat_musteri: e.target.value })}
            onBlur={() => aktifHesap?.id && ipcInvoke(HESAP_KANALLARI.TESLIMAT_GUNCELLE, aktifHesap.id, teslimat)}
            className="w-full h-9 px-2.5 rounded-lg bg-[#0B0A08] border border-[#322C26] text-sm text-surface-50"
          />
          <div className="grid grid-cols-2 gap-1.5">
            <input
              placeholder="Telefon"
              value={teslimat.teslimat_telefon}
              onChange={(e) => setTeslimat({ ...teslimat, teslimat_telefon: e.target.value })}
              onBlur={() => aktifHesap?.id && ipcInvoke(HESAP_KANALLARI.TESLIMAT_GUNCELLE, aktifHesap.id, teslimat)}
              className="h-9 px-2.5 rounded-lg bg-[#0B0A08] border border-[#322C26] text-sm text-surface-50"
            />
            {siparisTipi === 'paket' && (
              <input
                placeholder="Kurye"
                value={teslimat.kurye}
                onChange={(e) => setTeslimat({ ...teslimat, kurye: e.target.value })}
                onBlur={() => aktifHesap?.id && ipcInvoke(HESAP_KANALLARI.TESLIMAT_GUNCELLE, aktifHesap.id, teslimat)}
                className="h-9 px-2.5 rounded-lg bg-[#0B0A08] border border-[#322C26] text-sm text-surface-50"
              />
            )}
          </div>
          {siparisTipi === 'paket' && (
            <input
              placeholder="Teslimat adresi"
              value={teslimat.teslimat_adres}
              onChange={(e) => setTeslimat({ ...teslimat, teslimat_adres: e.target.value })}
              onBlur={() => aktifHesap?.id && ipcInvoke(HESAP_KANALLARI.TESLIMAT_GUNCELLE, aktifHesap.id, teslimat)}
              className="w-full h-9 px-2.5 rounded-lg bg-[#0B0A08] border border-[#322C26] text-sm text-surface-50"
            />
          )}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto pos-scrollbar bg-[#110F0C]">
        {sepet.length === 0 && (!aktifHesap?.siparisler || aktifHesap.siparisler.length === 0) ? (
          <div className="flex flex-col items-center justify-center h-full text-surface-400 p-8 text-center">
            <ShoppingBag size={28} className="text-surface-600 mb-3" />
            <p className="text-sm text-surface-300">Adisyon boş</p>
            <p className="text-xs text-surface-500 mt-1 max-w-[220px]">
              Sağdaki menüden ürün ekleyin.
            </p>
          </div>
        ) : (
          <div className="py-1">
            {sepet.length > 0 && (
              <div className="px-3 pt-2 pb-1 text-[11px] text-brand-300">
                Gönderilmedi · {sepet.length}
              </div>
            )}
            {sepet.map((kalem) => (
              <SepetItem
                key={kalem.id}
                kalem={kalem}
                isSelected={seciliKalemId === kalem.id}
                isEditingNote={notDuzenlenenKalemId === kalem.id}
                onSelect={handleToggleSelect}
                onMiktarDegistir={handleMiktarDegistir}
                onOpenMiktarModal={setMiktarSoranKalem}
                onToggleNoteEdit={handleToggleNoteEdit}
                onSaveNote={handleSaveNote}
                onIkramToggle={sepetIkramTogle}
                onDelete={sepettenCikar}
              />
            ))}

            {sepet.length > 0 && siraliMutfakSiparisleri.length > 0 && (
              <div className="mx-3 my-2 border-t border-dashed border-[#322C26]" />
            )}

            {siraliMutfakSiparisleri.length > 0 && (
              <div className="px-3 pt-1 pb-1 text-[11px] text-surface-500">
                Mutfağa gitti · {siraliMutfakSiparisleri.length}
              </div>
            )}
            {siraliMutfakSiparisleri.map((siparis: any) => (
              <MutfakSiparisItem
                key={siparis.id}
                siparis={siparis}
                isSelected={seciliKalemId === 'siparis-' + siparis.id}
                isIptalBekliyor={iptalEdilecekSiparisler.includes(siparis.id)}
                onSelect={handleToggleSelect}
                onIkramToggle={handleMutfakIkramToggle}
                onIptalToggle={handleMutfakIptalToggle}
              />
            ))}
          </div>
        )}
      </div>

      <div className="p-3 bg-[#171410] border-t border-[#322C26] shrink-0 flex flex-col gap-2">
        <div className="flex items-end justify-between px-0.5">
          <div className="text-[13px] text-surface-400">
            {(sepet.length + (aktifHesap?.siparisler?.filter((s: any) => s.durum !== 'iptal').length || 0))} kalem
            {aktifHesap?.indirim_tutar ? ` · indirim ${formatPara(aktifHesap.indirim_tutar)}` : ''}
          </div>
          <div className="font-mono text-2xl font-bold tabular-nums text-surface-50 leading-none">
            {formatPara(genelToplamTutar)}
          </div>
        </div>

        {aktifHesap && (
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={handleAdisyonYazdir}
              className="h-10 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 bg-[#1e1a16] text-surface-200 border border-[#322C26] active:scale-[0.98]"
            >
              <Printer size={14} /> Yazdır
            </button>
            <button
              type="button"
              onClick={() => setIndirimModalAcik(true)}
              className="h-10 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 bg-[#1e1a16] text-surface-200 border border-[#322C26] active:scale-[0.98]"
            >
              <Tag size={14} /> İndirim
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={(sepet.length === 0 && iptalEdilecekSiparisler.length === 0) || siparisGonderiliyor}
            onClick={handleSiparisGonder}
            className={clsx(
              "h-14 rounded-2xl text-[15px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-colors",
              ((sepet.length === 0 && iptalEdilecekSiparisler.length === 0) || siparisGonderiliyor)
                ? "bg-[#1E1A16] border border-[#322C26] text-surface-600 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-500 text-white"
            )}
          >
            <Send size={18} className={clsx(siparisGonderiliyor && "animate-spin")} />
            {siparisGonderiliyor ? 'İletiliyor' : 'İlet'}
          </button>
          <button
            type="button"
            disabled={(!aktifHesap || aktifHesap.toplam_tutar === 0) && sepet.length === 0}
            onClick={() => setOdemeModalAcik(true)}
            className={clsx(
              "h-14 rounded-2xl text-[15px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-colors",
              ((!aktifHesap || aktifHesap.toplam_tutar === 0) && sepet.length === 0)
                ? "bg-[#1E1A16] border border-[#322C26] text-surface-600 cursor-not-allowed"
                : "bg-brand-500 hover:bg-brand-400 text-white"
            )}
          >
            <CreditCard size={18} />
            Öde
          </button>
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

      {/* İndirim Modalı */}
      {indirimModalAcik && aktifHesap && (
        <IndirimModal 
          isOpen={indirimModalAcik} 
          onClose={() => setIndirimModalAcik(false)} 
          toplamTutar={aktifHesap.toplam_tutar} 
        />
      )}

      {/* Miktar Modalı (Numpad - İzole State) */}
      <QuantityModal
        kalem={miktarSoranKalem}
        onClose={() => setMiktarSoranKalem(null)}
        onApply={handleMiktarDegistir}
      />
    </div>
  )
})

export default PosCart
