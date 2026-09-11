import { create } from 'zustand'
import { ipcInvoke } from '../hooks/useIPC'
import { TERMINAL_KANALLARI } from '../../common/ipc-channels'

export interface TerminalAyar {
  terminalId: string
  rol: 'ana' | 'ikinci'
  anaUrl: string
  lanToken: string
  egitim: boolean
  ikinci?: boolean
}

interface TerminalState {
  ayar: TerminalAyar | null
  yukle: () => Promise<void>
}

export const useTerminalStore = create<TerminalState>((set) => ({
  ayar: null,
  yukle: async () => {
    try {
      const ayar = await ipcInvoke<TerminalAyar>(TERMINAL_KANALLARI.GETIR)
      set({ ayar })
    } catch (err) {
      console.warn('Terminal ayarı alınamadı', err)
    }
  },
}))
