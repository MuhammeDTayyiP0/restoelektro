// =====================================================
// Terminal ayarları (ana / ikinci kasa, eğitim modu)
// Yerel dosya — LAN üzerinden proxy edilmez
// =====================================================

import { IpcMain, app } from 'electron'
import { TERMINAL_KANALLARI } from '../../common/ipc-channels'
import {
  terminalAyarYukle,
  terminalAyarKaydet,
  ikinciKasaMi,
} from '../services/terminal.service'
import { httpGetJson } from '../services/http-json'
import { tamamenCikisYap } from '../index'

export function terminalIPCKaydet(ipcMain: IpcMain): void {
  ipcMain.handle(TERMINAL_KANALLARI.GETIR, async () => {
    const ayar = terminalAyarYukle()
    return {
      ...ayar,
      egitimDosyasi: ayar.egitim,
      ikinci: ayar.rol === 'ikinci',
    }
  })

  ipcMain.handle(TERMINAL_KANALLARI.BAGLANTI_TEST, async (_e, anaUrl?: string, lanToken?: string) => {
    const ayar = terminalAyarYukle()
    const url = String(anaUrl || ayar.anaUrl || '').replace(/\/$/, '')
    const token = lanToken || ayar.lanToken
    if (!url) return { basarili: false, hata: 'Ana kasa adresi boş' }
    try {
      const ping = await httpGetJson(`${url}/api/kasa/ping`, 6000)
      if (!ping || ping.basarili === false) {
        return { basarili: false, hata: ping?.hata || 'Ana kasa yanıt vermedi' }
      }
      if (ping.egitim) {
        return { basarili: false, hata: 'Ana kasa eğitim modunda — ikinci kasa bağlanamaz' }
      }
      // Jetonu doğrulamak için zararsız bir IPC dene (ayar:tumu)
      try {
        const { httpJson } = await import('../services/http-json')
        const deneme = await httpJson(`${url}/api/ipc`, {
          kanal: 'ayar:tumu',
          args: [],
          token,
          terminalId: ayar.terminalId,
        }, 6000)
        if (deneme && deneme.hata && /jeton|401|yetki/i.test(String(deneme.hata))) {
          return { basarili: false, hata: 'LAN jetonu hatalı' }
        }
      } catch (err: any) {
        const msg = err?.message || ''
        if (/401|jeton/i.test(msg)) return { basarili: false, hata: 'LAN jetonu hatalı' }
        // ping olduysa adres doğrudur; jeton ayrı kaydedilir
      }
      return { basarili: true, ping }
    } catch (err: any) {
      return { basarili: false, hata: err?.message || 'Ana kasaya ulaşılamadı' }
    }
  })

  ipcMain.handle(TERMINAL_KANALLARI.KAYDET, async (_e, veri: any) => {
    const mevcut = terminalAyarYukle()
    const guncelle: any = {}

    if (veri?.rol === 'ana' || veri?.rol === 'ikinci') guncelle.rol = veri.rol
    if (veri?.anaUrl !== undefined) guncelle.anaUrl = String(veri.anaUrl || '').trim()
    if (veri?.lanToken !== undefined) guncelle.lanToken = String(veri.lanToken || '').trim()
    if (veri?.egitim !== undefined) {
      if (mevcut.rol === 'ikinci' && veri.egitim) {
        return { basarili: false, hata: 'İkinci kasada eğitim modu açılamaz' }
      }
      guncelle.egitim = Boolean(veri.egitim)
    }

    const kayit = terminalAyarKaydet(guncelle)
    const yenidenBaslat = Boolean(veri?.yenidenBaslat)

    if (yenidenBaslat) {
      setTimeout(() => {
        app.relaunch()
        tamamenCikisYap()
      }, 400)
    }

    return { basarili: true, ayar: kayit, yenidenBaslat }
  })
}
