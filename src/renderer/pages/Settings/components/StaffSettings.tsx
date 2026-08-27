import React, { useState, useEffect } from 'react'
import { Modal } from '../../../components/ui/Modal'
import { useToast } from '../../../components/ui/Toast'
import { ipcInvoke } from '../../../hooks/useIPC'
import { PERSONEL_KANALLARI } from '../../../../common/ipc-channels'
import { Edit2, Trash2, UserPlus, KeyRound, User, ShieldCheck } from 'lucide-react'
import { clsx } from 'clsx'
import { motion } from 'framer-motion'

export default function StaffSettings() {
  const [personeller, setPersoneller] = useState<any[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [modalAcik, setModalAcik] = useState(false)
  const [duzenlenenPersonel, setDuzenlenenPersonel] = useState<any>(null)
  const { success, error } = useToast()

  // Form stateleri
  const [ad, setAd] = useState('')
  const [soyad, setSoyad] = useState('')
  const [kullaniciAdi, setKullaniciAdi] = useState('')
  const [sifre, setSifre] = useState('')
  const [rol, setRol] = useState('garson')
  const [pinKodu, setPinKodu] = useState('')

  const personelleriGetir = async () => {
    try {
      setYukleniyor(true)
      const data = await ipcInvoke<any[]>(PERSONEL_KANALLARI.LISTELE)
      setPersoneller(data.filter(p => p.aktif === 1))
    } catch (err: any) {
      error('Hata', err.message || 'Personeller yüklenemedi')
    } finally {
      setYukleniyor(false)
    }
  }

  useEffect(() => {
    personelleriGetir()
  }, [])

  const modalAc = (personel?: any) => {
    if (personel) {
      setDuzenlenenPersonel(personel)
      setAd(personel.ad)
      setSoyad(personel.soyad)
      setKullaniciAdi(personel.kullanici_adi)
      setRol(personel.rol)
      setPinKodu(personel.pin_kodu || '')
      setSifre('') // Şifre düzenlemede boş gelir
    } else {
      setDuzenlenenPersonel(null)
      setAd('')
      setSoyad('')
      setKullaniciAdi('')
      setRol('garson')
      setPinKodu('')
      setSifre('')
    }
    setModalAcik(true)
  }

  const kaydet = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (duzenlenenPersonel) {
        // Güncelle
        const data: any = { ad, soyad, rol, pin_kodu: pinKodu }
        if (sifre) data.sifre = sifre // Sadece yazıldıysa güncelle
        
        await ipcInvoke(PERSONEL_KANALLARI.GUNCELLE, duzenlenenPersonel.id, data)
        success('Başarılı', 'Personel bilgileri güncellendi.')
      } else {
        // Ekle
        if (!sifre) {
          error('Uyarı', 'Yeni personel için şifre zorunludur!')
          return
        }
        await ipcInvoke(PERSONEL_KANALLARI.EKLE, {
          ad, soyad, kullanici_adi: kullaniciAdi, sifre, rol, pin_kodu: pinKodu
        })
        success('Başarılı', 'Yeni personel kaydedildi.')
      }
      setModalAcik(false)
      personelleriGetir()
    } catch (err: any) {
      error('Hata', err.message || 'Kaydetme işlemi başarısız.')
    }
  }

  const sil = async (id: number) => {
    if (!window.confirm('Bu personeli silmek istediğinize emin misiniz?')) return
    try {
      await ipcInvoke(PERSONEL_KANALLARI.SIL, id)
      success('Başarılı', 'Personel silindi.')
      personelleriGetir()
    } catch (err: any) {
      error('Hata', err.message)
    }
  }

  const getRoleBadge = (r: string) => {
    switch (r) {
      case 'admin':
        return 'bg-amber-950/40 text-amber-300 border-amber-800/40'
      case 'mudur':
        return 'bg-purple-950/40 text-purple-300 border-purple-800/40'
      case 'kasiyer':
        return 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
      case 'mutfak':
        return 'bg-amber-950/40 text-amber-300 border-amber-800/40'
      default:
        return 'bg-blue-950/40 text-blue-300 border-blue-800/40'
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl animate-fade-in text-surface-100 select-none pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <ShieldCheck size={22} className="text-brand-500" />
            Personeller & PIN Yetkilendirme
          </h2>
          <p className="text-xs text-surface-400 mt-1">
            Restoran personellerini, rol yetkilerini ve hızlı giriş PIN kodlarını yönetin.
          </p>
        </div>
        <motion.button 
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={() => modalAc()} 
          className="h-11 px-5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-brand-900/40 border border-brand-400/30 transition-colors"
        >
          <UserPlus size={16} />
          Yeni Personel Ekle
        </motion.button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {yukleniyor ? (
          <div className="col-span-full py-12 text-center text-surface-400 font-mono text-sm">
            <span className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin inline-block mr-2" />
            Personel listesi yükleniyor...
          </div>
        ) : personeller.length === 0 ? (
          <div className="col-span-full py-12 text-center text-surface-400 text-sm">
            Kayıtlı aktif personel bulunamadı.
          </div>
        ) : (
          personeller.map(p => (
            <div 
              key={p.id} 
              className="bg-[#0E111B] rounded-2xl p-5 border border-[#1E2436] flex flex-col justify-between gap-4 shadow-xl hover:border-brand-500/40 transition-colors group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#141826] border border-[#222B40] flex items-center justify-center text-brand-400 font-bold text-sm">
                    {p.ad?.charAt(0)}{p.soyad?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm">{p.ad} {p.soyad}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={clsx(
                        "text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded border",
                        getRoleBadge(p.rol)
                      )}>
                        {p.rol}
                      </span>
                      <span className="text-xs text-surface-400 font-mono">@{p.kullanici_adi}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-3 border-t border-[#1A1F30]">
                <div>
                  {p.pin_kodu ? (
                    <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 bg-emerald-950/30 px-2 py-1 rounded-lg border border-emerald-800/30">
                      <KeyRound size={12} /> PIN: {p.pin_kodu}
                    </span>
                  ) : (
                    <span className="text-xs font-mono text-surface-500 italic">PIN Tanımsız</span>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <button 
                    type="button"
                    onClick={() => modalAc(p)} 
                    className="p-2 rounded-lg bg-[#141826] hover:bg-[#1C2236] text-surface-300 hover:text-white border border-[#222B40] transition-colors"
                    title="Düzenle"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    type="button"
                    onClick={() => sil(p.id)} 
                    disabled={p.kullanici_adi === 'admin'}
                    className="p-2 rounded-lg bg-red-950/20 hover:bg-red-950/40 text-red-400 hover:text-red-300 border border-red-900/30 transition-colors disabled:opacity-30"
                    title="Sil"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        isOpen={modalAcik}
        onClose={() => setModalAcik(false)}
        title={duzenlenenPersonel ? "Personel Bilgilerini Düzenle" : "Yeni Personel Ekle"}
        size="md"
      >
        <form onSubmit={kaydet} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-surface-400">Ad</label>
              <input 
                required 
                type="text" 
                value={ad} 
                onChange={e => setAd(e.target.value)} 
                className="h-11 px-3.5 rounded-xl bg-[#090B11] border border-[#1E2436] text-white text-xs focus:outline-none focus:border-brand-500 transition-colors" 
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-surface-400">Soyad</label>
              <input 
                required 
                type="text" 
                value={soyad} 
                onChange={e => setSoyad(e.target.value)} 
                className="h-11 px-3.5 rounded-xl bg-[#090B11] border border-[#1E2436] text-white text-xs focus:outline-none focus:border-brand-500 transition-colors" 
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-surface-400">Kullanıcı Adı (Tekil)</label>
            <input 
              required 
              type="text" 
              value={kullaniciAdi} 
              onChange={e => setKullaniciAdi(e.target.value)} 
              disabled={!!duzenlenenPersonel} 
              className="h-11 px-3.5 rounded-xl bg-[#090B11] border border-[#1E2436] text-white text-xs focus:outline-none focus:border-brand-500 transition-colors disabled:opacity-50 font-mono" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-surface-400">Rol & Yetki</label>
              <select 
                value={rol} 
                onChange={e => setRol(e.target.value)} 
                className="h-11 px-3.5 rounded-xl bg-[#090B11] border border-[#1E2436] text-white text-xs font-semibold focus:outline-none focus:border-brand-500 transition-colors"
              >
                <option value="admin">Admin / Yönetici</option>
                <option value="mudur">Müdür</option>
                <option value="kasiyer">Kasiyer</option>
                <option value="garson">Garson</option>
                <option value="mutfak">Mutfak Şefi</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-surface-400">Hızlı PIN (4 Hane)</label>
              <input 
                type="text" 
                maxLength={4} 
                value={pinKodu} 
                onChange={e => setPinKodu(e.target.value.replace(/\D/g, ''))} 
                className="h-11 px-3.5 rounded-xl bg-[#090B11] border border-[#1E2436] text-white text-xs font-mono tracking-widest focus:outline-none focus:border-brand-500 transition-colors" 
                placeholder="1234" 
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 pt-2 border-t border-[#1A1F30]">
            <label className="text-xs font-semibold text-surface-400">
              Giriş Şifresi {duzenlenenPersonel && '(Değiştirmeyecekseniz boş bırakın)'}
            </label>
            <input 
              type="password" 
              value={sifre} 
              onChange={e => setSifre(e.target.value)} 
              className="h-11 px-3.5 rounded-xl bg-[#090B11] border border-[#1E2436] text-white text-xs focus:outline-none focus:border-brand-500 transition-colors" 
              placeholder="••••••••" 
            />
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[#1A1F30]">
            <button 
              type="button" 
              onClick={() => setModalAcik(false)}
              className="h-10 px-4 rounded-xl text-xs font-semibold text-surface-400 hover:text-white transition-colors"
            >
              İptal
            </button>
            <motion.button 
              type="submit" 
              whileTap={{ scale: 0.95 }}
              className="h-10 px-5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-colors"
            >
              Kaydet
            </motion.button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

