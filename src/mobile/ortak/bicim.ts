// Ortak biçimlendirme yardımcıları

const iki = (n: number) => (n < 10 ? '0' : '') + n

export const para = (n: unknown) =>
  Number(n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺'

export const para0 = (n: unknown) => Number(n || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 }) + ' ₺'

export const yerelTarih = (d: Date) => `${d.getFullYear()}-${iki(d.getMonth() + 1)}-${iki(d.getDate())}`

/** SQLite 'YYYY-MM-DD HH:MM:SS' veya ISO zamanından HH:MM */
export function saatKisa(iso: unknown): string {
  if (!iso) return ''
  const d = new Date(String(iso).replace(' ', 'T'))
  if (isNaN(d.getTime())) {
    const t = String(iso)
    return t.length >= 16 ? t.slice(11, 16) : t
  }
  return iki(d.getHours()) + ':' + iki(d.getMinutes())
}

export { iki }
