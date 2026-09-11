// =====================================================
// Terminal kimliği, ikinci kasa ve eğitim modu
// userData/terminal.json — SQLite'dan bağımsız
// =====================================================

import { app } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { randomBytes } from 'crypto'

export interface TerminalAyar {
  terminalId: string
  rol: 'ana' | 'ikinci'
  anaUrl: string
  lanToken: string
  egitim: boolean
}

function rastgeleKod(uzunluk: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const buf = randomBytes(uzunluk)
  let out = ''
  for (let i = 0; i < uzunluk; i++) {
    out += chars[buf[i] % chars.length]
  }
  return out
}

function varsayilan(): TerminalAyar {
  return {
    terminalId: 'T-' + rastgeleKod(6),
    rol: 'ana',
    anaUrl: '',
    lanToken: rastgeleKod(12),
    egitim: false,
  }
}

let onbellek: TerminalAyar | null = null

export function terminalDosyaYolu(): string {
  return join(app.getPath('userData'), 'terminal.json')
}

export function terminalOnbellegiTemizle(): void {
  onbellek = null
}

export function terminalAyarYukle(): TerminalAyar {
  if (onbellek) return onbellek
  const yol = terminalDosyaYolu()
  if (existsSync(yol)) {
    try {
      const ham = JSON.parse(readFileSync(yol, 'utf8'))
      const birlesik: TerminalAyar = { ...varsayilan(), ...ham }
      if (!birlesik.terminalId) birlesik.terminalId = 'T-' + rastgeleKod(6)
      if (!birlesik.lanToken) birlesik.lanToken = rastgeleKod(12)
      if (birlesik.rol !== 'ikinci') birlesik.rol = 'ana'
      onbellek = birlesik
      return birlesik
    } catch (err) {
      console.warn('[Terminal] terminal.json okunamadı, varsayılan yazılıyor:', err)
    }
  }
  onbellek = varsayilan()
  terminalAyarKaydet(onbellek)
  return onbellek
}

export function terminalAyarKaydet(kismi: Partial<TerminalAyar>): TerminalAyar {
  const mevcut = onbellek || varsayilan()
  if (!onbellek) {
    try {
      const yol = terminalDosyaYolu()
      if (existsSync(yol)) {
        const ham = JSON.parse(readFileSync(yol, 'utf8'))
        Object.assign(mevcut, ham)
      }
    } catch {
      // yok say
    }
  }
  onbellek = { ...mevcut, ...kismi }
  if (onbellek.rol !== 'ikinci') onbellek.rol = 'ana'
  onbellek.egitim = Boolean(onbellek.egitim)
  writeFileSync(terminalDosyaYolu(), JSON.stringify(onbellek, null, 2), 'utf8')
  return onbellek
}

export function egitimModuAktifMi(): boolean {
  return Boolean(terminalAyarYukle().egitim)
}

export function ikinciKasaMi(): boolean {
  return terminalAyarYukle().rol === 'ikinci'
}
