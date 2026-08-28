// =====================================================
// Ağ & IP Algılama Servisi
// Node.js os.networkInterfaces() ile yerel IP ve ağ kartlarını yönetir
// =====================================================

import os from 'os'

export interface AgKartiBilgisi {
  id: string // Benzersiz tanımlayıcı (örn: "Ethernet_192.168.1.123")
  ad: string // Ağ kartı arayüz adı (örn: "Wi-Fi", "Ethernet")
  ip: string // IPv4 adresi (örn: "192.168.1.123")
  aile: string // "IPv4"
  mac: string
  dahili: boolean
  oncelikli: boolean // Wi-Fi / Ethernet ve özel LAN aralığı
  tip: 'wifi' | 'ethernet' | 'diger'
  etiket: string // Arayüzde gösterilecek açıklayıcı başlık
}

export interface AgTaramaSonucu {
  kartlar: AgKartiBilgisi[]
  varsayilanIp: string
  port: number
}

/**
 * Bilgisayardaki tüm ağ arayüzlerini tarar ve geçerli IPv4 adreslerini ayıklar
 */
export function agKartlariniTara(): AgTaramaSonucu {
  const interfaces = os.networkInterfaces()
  const kartlar: AgKartiBilgisi[] = []

  for (const [ad, ifaceList] of Object.entries(interfaces)) {
    if (!ifaceList) continue

    for (const iface of ifaceList) {
      // Sadece IPv4 adreslerini değerlendir
      const isIPv4 = iface.family === 'IPv4' || (iface as any).family === 4
      if (!isIPv4) continue

      const ip = iface.address ? iface.address.trim() : ''
      if (!ip) continue

      // Loopback (127.0.0.1, 127.x.x.x, 0.0.0.0) ve dahili arayüzleri atla
      if (iface.internal || ip.startsWith('127.') || ip === '::1' || ip === '0.0.0.0') {
        continue
      }

      // APIPA (169.254.x.x - Bağlantı kurulamayan / IP alamayan cihazlar) atla
      if (ip.startsWith('169.254.')) {
        continue
      }

      // Ağ kartı türü tespiti
      const adKucuk = ad.toLowerCase()
      let tip: 'wifi' | 'ethernet' | 'diger' = 'diger'

      if (
        adKucuk.includes('wi-fi') ||
        adKucuk.includes('wifi') ||
        adKucuk.includes('wireless') ||
        adKucuk.includes('wlan') ||
        adKucuk.includes('kablosuz')
      ) {
        tip = 'wifi'
      } else if (
        adKucuk.includes('eth') ||
        adKucuk.includes('yerel') ||
        adKucuk.includes('lan') ||
        adKucuk.includes('ethernet') ||
        adKucuk.includes('kablolu')
      ) {
        tip = 'ethernet'
      }

      // Özel LAN IP aralığı kontrolü (192.168.x.x, 10.x.x.x, 172.16.x.x - 172.31.x.x)
      const isPrivateLan =
        ip.startsWith('192.168.') ||
        ip.startsWith('10.') ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(ip)

      // Sanal bağdaştırıcı (VirtualBox, VMware, Hyper-V, vEthernet) filtreleme / düşük öncelik
      const isVirtual =
        adKucuk.includes('vethernet') ||
        adKucuk.includes('virtual') ||
        adKucuk.includes('vmware') ||
        adKucuk.includes('box') ||
        adKucuk.includes('wsl') ||
        adKucuk.includes('hyper-v')

      const oncelikli = isPrivateLan && !isVirtual && (tip === 'wifi' || tip === 'ethernet')

      const tipIkonu = tip === 'wifi' ? '📶' : tip === 'ethernet' ? '🔌' : '🌐'
      const oncelikMetni = oncelikli ? ' (Önerilen)' : ''
      const etiket = `${tipIkonu} ${ad} — ${ip}${oncelikMetni}`

      kartlar.push({
        id: `${ad}_${ip}`,
        ad,
        ip,
        aile: 'IPv4',
        mac: iface.mac || '',
        dahili: Boolean(iface.internal),
        oncelikli,
        tip,
        etiket
      })
    }
  }

  // Kartları öncelik ve türe göre sırala (Önerilenler ve Wi-Fi/Ethernet en üstte)
  kartlar.sort((a, b) => {
    if (a.oncelikli && !b.oncelikli) return -1
    if (!a.oncelikli && b.oncelikli) return 1
    if (a.tip === 'wifi' && b.tip !== 'wifi') return -1
    if (b.tip === 'wifi' && a.tip !== 'wifi') return 1
    if (a.tip === 'ethernet' && b.tip === 'diger') return -1
    if (b.tip === 'ethernet' && a.tip === 'diger') return 1
    return a.ad.localeCompare(b.ad, 'tr')
  })

  // En uygun varsayılan IP seçimi
  let varsayilanIp = '127.0.0.1'
  if (kartlar.length > 0) {
    const enIyiKart = kartlar.find(k => k.oncelikli) || kartlar[0]
    varsayilanIp = enIyiKart.ip
  }

  return {
    kartlar,
    varsayilanIp,
    port: 3847
  }
}

/**
 * En uygun yerel ağ IP adresini doğrudan döndürür
 */
export function varsayilanYerelIpGetir(): string {
  const sonuc = agKartlariniTara()
  return sonuc.varsayilanIp
}
