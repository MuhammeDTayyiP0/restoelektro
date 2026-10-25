// =====================================================
// IPC handler kaydı — HTTP LAN köprüsü için handler haritası
// Mevcut ipcMain.handle çağrılarını yakalar, dönüş imzasına dokunmaz
// =====================================================

import { IpcMain, IpcMainInvokeEvent } from 'electron'

const kayitli = new Map<string, (event: IpcMainInvokeEvent, ...args: any[]) => any>()

const YEREL_KANAL_ONEKLERI = [
  'uygulama:',
  'pencere:',
  'guncelleme:',
  'ag:',
  'terminal:',
  'yazici:',
]

export function yerelKanalMi(kanal: string): boolean {
  return YEREL_KANAL_ONEKLERI.some((p) => kanal.startsWith(p))
}

/**
 * ipcMain.handle'ı sarar: handler'ı LAN köprüsü için kaydeder ve
 * kanalYetkileri'ndeki kanallarda önce yetki kontrolünü çalıştırır.
 * Yetki yoksa handler çağrılmaz; { basarili: false, yetkiGerekli } döner (arayüz yönetici onayı ister).
 */
export function ipcHandleSar(
  ipcMain: IpcMain,
  kanalYetkileri: Record<string, string> = {},
  yetkiKontrol?: (event: IpcMainInvokeEvent, yetki: string) => void
): void {
  const orijinal = ipcMain.handle.bind(ipcMain)
  ;(ipcMain as any).handle = (kanal: string, listener: any) => {
    const yetki = kanalYetkileri[kanal]
    const sarili = yetki && yetkiKontrol
      ? (event: IpcMainInvokeEvent, ...args: any[]) => {
          try {
            yetkiKontrol(event, yetki)
          } catch (hata: any) {
            if (hata?.yetki) return { basarili: false, hata: hata.message, yetkiGerekli: hata.yetki }
            throw hata
          }
          return listener(event, ...args)
        }
      : listener
    kayitli.set(kanal, sarili)
    return orijinal(kanal, sarili)
  }
}

/**
 * LAN köprüsünden gelen çağrıyı kayıtlı handler ile çalıştırır.
 * Sahte olay terminal kimliğini taşır; böylece her ikinci kasanın oturumu ayrı tutulur.
 */
export function ipcHandlerCalistir(kanal: string, args: any[], terminalId?: string): Promise<any> {
  const fn = kayitli.get(kanal)
  if (!fn) {
    return Promise.reject(new Error(`Bilinmeyen IPC kanalı: ${kanal}`))
  }
  const olay = { lanTerminal: String(terminalId || 'bilinmeyen') } as unknown as IpcMainInvokeEvent
  return Promise.resolve(fn(olay, ...(args || [])))
}

export function ipcKanalKayitliMi(kanal: string): boolean {
  return kayitli.has(kanal)
}
