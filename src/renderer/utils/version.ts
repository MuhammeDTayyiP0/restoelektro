// =====================================================
// Merkezi Uygulama Sürüm Modülü (version.ts)
// Tek kaynak: package.json (Vite define / app.getVersion())
// =====================================================

/**
 * package.json'dan otomatik olarak derlenen sürüm numarası (Örn: "2.2.3")
 */
export const APP_VERSION: string =
  typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '2.2.3'

/**
 * Sürüm etiketi (Örn: "v2.2.3")
 */
export const APP_VERSION_TAG: string = `v${APP_VERSION}`

/**
 * Tam sürüm başlığı (Örn: "ETİBOL POS v2.2.3")
 */
export const APP_FULL_NAME: string = `ETİBOL POS ${APP_VERSION_TAG}`

