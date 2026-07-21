import React, { useState, useEffect } from 'react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts'
import { Download, Calendar, TrendingUp, Users, DollarSign, Package } from 'lucide-react'
import { clsx } from 'clsx'
import { useIPC, ipcInvoke } from '../../hooks/useIPC'
import { RAPOR_KANALLARI, MASA_KANALLARI } from '../../../common/ipc-channels'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Tabs } from '../../components/ui/Tabs'
import { formatPara } from '../../utils/formatters'
import { useToast } from '../../components/ui/Toast'

// Sabit Renkler (Marka renkleri)
const RENKLER = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function ReportsPage() {
  const [zamanAraligi, setZamanAraligi] = useState('bugun')
  const { success, error } = useToast()

  const [istatistikler, setIstatistikler] = useState({
    toplamSatis: 0,
    toplamSiparis: 0,
    ortalamaSepet: 0,
    aktifMasalar: 0
  })

  const [satisGrafigi, setSatisGrafigi] = useState<{saat: string, satis: number}[]>([])
  const [kategoriDagilimi, setKategoriDagilimi] = useState<{name: string, value: number}[]>([])
  const [personelSatis, setPersonelSatis] = useState<{ad: string, satis: number}[]>([])

  // Tarih aralığını hesapla
  const getTarihAraligi = (aralik: string) => {
    const bugun = new Date()
    const bitis = new Date(bugun.getTime() - (bugun.getTimezoneOffset() * 60000)).toISOString().slice(0, 10)
    let baslangic = bitis

    if (aralik === 'buhafta') {
      const haftaninBaslangici = new Date(bugun)
      const day = haftaninBaslangici.getDay() || 7 // Pazartesi 1, Pazar 7
      haftaninBaslangici.setDate(bugun.getDate() - day + 1)
      baslangic = new Date(haftaninBaslangici.getTime() - (haftaninBaslangici.getTimezoneOffset() * 60000)).toISOString().slice(0, 10)
    } else if (aralik === 'buay') {
      const ayinBaslangici = new Date(bugun.getFullYear(), bugun.getMonth(), 1)
      baslangic = new Date(ayinBaslangici.getTime() - (ayinBaslangici.getTimezoneOffset() * 60000)).toISOString().slice(0, 10)
    }

    return { baslangic, bitis }
  }

  // Verileri ana işlemden (veritabanından) çek
  const verileriGetir = async () => {
    const { baslangic, bitis } = getTarihAraligi(zamanAraligi)

    try {
      // 1. Günlük/Genel Özet
      const ozet = await ipcInvoke(RAPOR_KANALLARI.GUNLUK_OZET, baslangic, bitis)
      
      // 2. Aktif Masalar (Mevcut anlık durum)
      const masalar = await ipcInvoke(MASA_KANALLARI.MASALAR)
      const aktifMasaSayisi = masalar ? masalar.filter((m: any) => m.durum === 'dolu').length : 0

      if (ozet) {
        setIstatistikler({
          toplamSatis: ozet.toplam_ciro || 0,
          toplamSiparis: ozet.toplam_hesap || 0,
          ortalamaSepet: ozet.ortalama_hesap || 0,
          aktifMasalar: aktifMasaSayisi
        })
      }

      // 3. Saatlik/Günlük Satış Dağılımı
      const dagilim = await ipcInvoke(RAPOR_KANALLARI.SAATLIK_DAGILIM, baslangic, bitis)
      if (dagilim && Array.isArray(dagilim)) {
        setSatisGrafigi(dagilim.map(d => ({
          saat: d.zaman_etiketi,
          satis: d.toplam_tutar
        })))
      }

      // 4. Kategori Satış Dağılımı
      const kategoriler = await ipcInvoke(RAPOR_KANALLARI.KATEGORI_RAPORU, baslangic, bitis)
      if (kategoriler && Array.isArray(kategoriler)) {
        setKategoriDagilimi(kategoriler.map(k => ({
          name: k.kategori_adi,
          value: k.toplam_tutar // Tutar bazlı dağılım
        })))
      }

      // 5. Personel Performansı
      const personel = await ipcInvoke(RAPOR_KANALLARI.PERSONEL_RAPORU, baslangic, bitis)
      if (personel && Array.isArray(personel)) {
        setPersonelSatis(personel.map(p => ({
          ad: p.personel_adi,
          satis: p.toplam_satis
        })))
      }

    } catch (err) {
      console.error("Rapor verileri çekilemedi:", err)
      error("Hata", "Rapor verileri yüklenirken bir sorun oluştu.")
    }
  }

  // zamanAraligi değiştiğinde verileri güncelle
  useEffect(() => {
    verileriGetir()
  }, [zamanAraligi])

  // Gerçek Dışa Aktarım (Excel/CSV Export)
  const handleExport = async (format: 'excel' | 'csv') => {
    try {
      const { baslangic, bitis } = getTarihAraligi(zamanAraligi)
      const response = await ipcInvoke(RAPOR_KANALLARI.DISA_AKTAR, 'satis', format, baslangic, bitis)
      
      if (response && response.basarili) {
        success('Dışa Aktarım Başarılı', `Rapor ${format.toUpperCase()} formatında kaydedildi:\n${response.dosya_yolu}`)
      } else {
        error('Dışa Aktarım Hatası', response?.hata || 'Bilinmeyen bir hata oluştu.')
      }
    } catch (err) {
      error('Hata', 'Dışa aktarma işlemi sırasında bir hata oluştu.')
    }
  }

  // Özet Kartı Bileşeni
  const OzetKarti = ({ baslik, deger, icon, trend }: any) => (
    <Card className="flex items-center p-6 bg-white dark:bg-surface-900 shadow-sm border border-surface-200 dark:border-surface-800">
      <div className="w-14 h-14 rounded-full bg-brand-500/10 text-brand-600 flex items-center justify-center mr-4">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-surface-500">{baslik}</p>
        <h3 className="text-pos-2xl font-bold text-surface-900 dark:text-white mt-1">{deger}</h3>
      </div>
      {trend && (
        <div className="ml-auto flex flex-col items-end">
          <span className={clsx("text-sm font-bold flex items-center", trend > 0 ? "text-green-500" : "text-red-500")}>
            <TrendingUp size={16} className={clsx("mr-1", trend < 0 && "rotate-180")} />
            {trend > 0 ? '+' : ''}{trend}%
          </span>
          <span className="text-xs text-surface-400">düne göre</span>
        </div>
      )}
    </Card>
  )

  return (
    <div className="flex flex-col h-full bg-surface-100 dark:bg-surface-950 p-4 lg:p-6 overflow-hidden animate-fade-in">
      
      {/* Header & Filtreler */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0">
        <div>
          <h2 className="text-pos-2xl font-bold text-surface-900 dark:text-white">
            İşletme Raporları
          </h2>
          <p className="text-surface-500">Satış, gelir ve personel analizi</p>
        </div>

        <div className="flex items-center gap-4">
          <Tabs 
            variant="pills"
            activeTabId={zamanAraligi}
            onChange={setZamanAraligi}
            tabs={[
              { id: 'bugun', label: 'Bugün' },
              { id: 'buhafta', label: 'Bu Hafta' },
              { id: 'buay', label: 'Bu Ay' },
            ]}
          />
          
          <div className="flex gap-2 border-l border-surface-300 dark:border-surface-700 pl-4">
            <Button variant="outline" leftIcon={<Download size={18} />} onClick={() => handleExport('excel')}>
              Excel
            </Button>
            <Button variant="outline" onClick={() => handleExport('csv')}>
              CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Rapor İçeriği (Kaydırılabilir alan) */}
      <div className="flex-1 overflow-y-auto pos-scrollbar pb-10">
        
        {/* KPI (Özet) Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <OzetKarti 
            baslik="Ciro (Toplam Satış)" 
            deger={formatPara(istatistikler.toplamSatis)} 
            icon={<DollarSign size={28} />} 
            trend={12.5}
          />
          <OzetKarti 
            baslik="Tamamlanan Sipariş" 
            deger={istatistikler.toplamSiparis} 
            icon={<Package size={28} />} 
            trend={5.2}
          />
          <OzetKarti 
            baslik="Ortalama Sepet Tutarı" 
            deger={formatPara(istatistikler.ortalamaSepet)} 
            icon={<TrendingUp size={28} />} 
            trend={-1.4}
          />
          <OzetKarti 
            baslik="Aktif Masa / Müşteri" 
            deger={istatistikler.aktifMasalar} 
            icon={<Users size={28} />} 
          />
        </div>

        {/* Grafikler Alanı */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Ana Satış Grafiği (Çizgi Grafik) */}
          <Card className="lg:col-span-2 p-4 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800">
            <h3 className="font-bold text-lg mb-4 text-surface-700 dark:text-surface-300">Zamana Göre Satış Hacmi</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={satisGrafigi} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="saat" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} tickFormatter={(val) => `₺${val}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    formatter={(value: any) => [formatPara(value), 'Satış']}
                  />
                  <Line type="monotone" dataKey="satis" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Kategori Dağılımı (Pasta Grafik) */}
          <Card className="p-4 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 flex flex-col">
            <h3 className="font-bold text-lg mb-4 text-surface-700 dark:text-surface-300">Kategori Satış Dağılımı</h3>
            <div className="flex-1 w-full min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={kategoriDagilimi}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {kategoriDagilimi.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={RENKLER[index % RENKLER.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    formatter={(value: any) => [`%${value}`, 'Oran']}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Personel Performansı (Sütun Grafik) */}
          <Card className="lg:col-span-3 p-4 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800">
            <h3 className="font-bold text-lg mb-4 text-surface-700 dark:text-surface-300">Personel Satış Performansı</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={personelSatis} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="ad" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} tickFormatter={(val) => `₺${val}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                    formatter={(value: any) => [formatPara(value), 'Ciro']}
                  />
                  <Bar dataKey="satis" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40}>
                    {personelSatis.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={RENKLER[(index + 1) % RENKLER.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

        </div>
      </div>
    </div>
  )
}
