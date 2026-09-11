// =====================================================
// Node 16 / Electron 22 uyumlu HTTP JSON yardımcıları
// native fetch YOK — http/https modülleri kullanılır
// =====================================================

import http from 'http'
import https from 'https'
import { URL } from 'url'

function istek(
  method: 'GET' | 'POST',
  url: string,
  body?: unknown,
  timeoutMs = 15000
): Promise<any> {
  return new Promise((resolve, reject) => {
    let parsed: URL
    try {
      parsed = new URL(url)
    } catch {
      reject(new Error('Geçersiz adres'))
      return
    }

    const lib = parsed.protocol === 'https:' ? https : http
    const data = body !== undefined ? Buffer.from(JSON.stringify(body), 'utf8') : null
    const headers: Record<string, string | number> = {
      Accept: 'application/json',
    }
    if (data) {
      headers['Content-Type'] = 'application/json; charset=utf-8'
      headers['Content-Length'] = data.length
    }

    const req = lib.request(
      {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: parsed.pathname + parsed.search,
        method,
        headers,
        timeout: timeoutMs,
      },
      (res) => {
        const chunks: Buffer[] = []
        res.on('data', (c) => chunks.push(c as Buffer))
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8')
          if (!text) {
            resolve(null)
            return
          }
          try {
            resolve(JSON.parse(text))
          } catch {
            reject(new Error('Ana kasadan geçersiz yanıt'))
          }
        })
      }
    )

    req.on('error', (err) => reject(err))
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('LAN zaman aşımı'))
    })

    if (data) req.write(data)
    req.end()
  })
}

export function httpJson(url: string, body: unknown, timeoutMs = 15000): Promise<any> {
  return istek('POST', url, body, timeoutMs)
}

export function httpGetJson(url: string, timeoutMs = 8000): Promise<any> {
  return istek('GET', url, undefined, timeoutMs)
}
