import React, { useState, useEffect } from 'react'
import { Button } from '../../../components/ui/Button'
import { Modal } from '../../../components/ui/Modal'
import { useToast } from '../../../components/ui/Toast'
import { ipcInvoke } from '../../../hooks/useIPC'
import { PERSONEL_KANALLARI } from '../../../../common/ipc-channels'
import { Edit2, Trash2, UserPlus, KeyRound, User } from 'lucide-react'
import { clsx } from 'clsx'

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
        success('Başarılı', 'Personel güncellendi.')
      } else {
        // Ekle
        if (!sifre) {
          error('Uyarı', 'Yeni personel için şifre zorunludur!')
          return
        }
        await ipcInvoke(PERSONEL_KANALLARI.EKLE, {
          ad, soyad, kullanici_adi: kullaniciAdi, sifre, rol, pin_kodu: pinKodu
        })
        success('Başarılı', 'Yeni personel eklendi.')
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

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-pos-lg font-bold text-surface-900 dark:text-white">Sistem Kullanıcıları</h2>
          <p className="text-sm text-surface-500 mt-1">Personellerinizi ve giriş şifrelerini / PIN kodlarını yönetin.</p>
        </div>
        <Button onClick={() => modalAc()} variant="primary" leftIcon={<UserPlus size={20} />}>
          Yeni Personel Ekle
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {yukleniyor ? (
          <div className="col-span-full py-10 text-center text-surface-500">Yükleniyor...</div>
        ) : personeller.length === 0 ? (
          <div className="col-span-full py-10 text-center text-surface-500">Hiç personel bulunamadı.</div>
        ) : (
          personeller.map(p => (
            <div key={p.id} className="bg-surface-50 dark:bg-surface-800 rounded-pos-lg p-5 border border-surface-200 dark:border-surface-700 flex flex-col gap-4 transition-transform hover:-translate-y-1">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-surface-900 dark:text-white">{p.ad} {p.soyad}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={clsx(
                        "text-[10px] uppercase font-bold px-2 py-0.5 rounded tracking-wide",
                        p.rol === 'admin' ? "bg-red-100 text-red-700" :
                        p.rol === 'garson' ? "bg-blue-100 text-blue-700" :
                        p.rol === 'mutfak' ? "bg-amber-100 text-amber-700" :
                        "bg-green-100 text-green-700"
                      )}>
                        {p.rol}
                      </span>
                      <span className="text-xs text-surface-500">@{p.kullanici_adi}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-end mt-auto pt-4 border-t border-surface-200 dark:border-surface-700">
                <div className="flex flex-col gap-1">
                  {p.pin_kodu ? (
                    <span className="text-xs font-medium text-surface-500 flex items-center gap-1">
                      <KeyRound size={14} /> PIN Aktif ({p.pin_kodu})
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-surface-400 italic">PIN Yok</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => modalAc(p)} className="px-3">
                    <Edit2 size={16} />
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => sil(p.id)} className="px-3" disabled={p.kullanici_adi === 'admin'}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        isOpen={modalAcik}
        onClose={() => setModalAcik(false)}
        title={duzenlenenPersonel ? "Personel Düzenle" : "Yeni Personel Ekle"}
        size="md"
      >
        <form onSubmit={kaydet} className="p-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Ad</label>
              <input required type="text" value={ad} onChange={e => setAd(e.target.value)} className="w-full px-3 py-2 border rounded-pos dark:bg-surface-900 dark:border-surface-700" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Soyad</label>
              <input required type="text" value={soyad} onChange={e => setSoyad(e.target.value)} className="w-full px-3 py-2 border rounded-pos dark:bg-surface-900 dark:border-surface-700" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Kullanıcı Adı</label>
            <input required type="text" value={kullaniciAdi} onChange={e => setKullaniciAdi(e.target.value)} disabled={!!duzenlenenPersonel} className="w-full px-3 py-2 border rounded-pos dark:bg-surface-900 dark:border-surface-700 disabled:opacity-50" />
            {!duzenlenenPersonel && <span className="text-xs text-surface-500">Giriş yaparken kullanılacak benzersiz isim.</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Rol / Yetki</label>
              <select value={rol} onChange={e => setRol(e.target.value)} className="w-full px-3 py-2 border rounded-pos dark:bg-surface-900 dark:border-surface-700">
                <option value="admin">Admin</option>
                <option value="mudur">Müdür</option>
                <option value="kasiyer">Kasiyer</option>
                <option value="garson">Garson</option>
                <option value="mutfak">Mutfak</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Hızlı PIN (Opsiyonel)</label>
              <input type="text" maxLength={4} value={pinKodu} onChange={e => setPinKodu(e.target.value.replace(/\D/g, ''))} className="w-full px-3 py-2 border rounded-pos dark:bg-surface-900 dark:border-surface-700" placeholder="Örn: 1234" />
              <span className="text-xs text-surface-500">Giriş ekranında şifre girmeden hızlı giriş sağlar.</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 pt-2 border-t border-surface-200 dark:border-surface-800">
            <label className="text-sm font-medium">Şifre {duzenlenenPersonel && '(Değiştirmeyecekseniz boş bırakın)'}</label>
            <input type="password" value={sifre} onChange={e => setSifre(e.target.value)} className="w-full px-3 py-2 border rounded-pos dark:bg-surface-900 dark:border-surface-700" />
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button type="button" variant="ghost" onClick={() => setModalAcik(false)}>İptal</Button>
            <Button type="submit" variant="primary">Kaydet</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
