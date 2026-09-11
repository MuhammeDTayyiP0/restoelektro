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

export function ipcHandleSar(ipcMain: IpcMain): void {
  const orijinal = ipcMain.handle.bind(ipcMain)
  ;(ipcMain as any).handle = (kanal: string, listener: any) => {
    kayitli.set(kanal, listener)
    return orijinal(kanal, listener)
  }
}

export function ipcHandlerCalistir(kanal: string, args: any[]): Promise<any> {
  const fn = kayitli.get(kanal)
  if (!fn) {
    return Promise.reject(new Error(`Bilinmeyen IPC kanalı: ${kanal}`))
  }
  return Promise.resolve(fn({} as IpcMainInvokeEvent, ...(args || [])))
}

export function ipcKanalKayitliMi(kanal: string): boolean {
  return kayitli.has(kanal)
}
