import { ipcInvoke } from '../hooks/useIPC'
import { YAZICI_KANALLARI, AYAR_KANALLARI } from '../../common/ipc-channels'
import { formatPara } from './formatters'

export interface MutfakSablonConfig {
  fontSize: 'small' | 'normal' | 'large';
  paperWidth: '58mm' | '80mm';
  showTime: boolean;
  showTable: boolean;
}

export interface KasaSablonConfig {
  fontSize: 'small' | 'normal' | 'large';
  paperWidth: '58mm' | '80mm';
  showTime: boolean;
  showOrderNo: boolean;
  showPrices: boolean;
  showRestoName: boolean;
  showRestoInfo: boolean;
  showFooter: boolean;
  footerText: string;
}

export const defaultMutfakConfig: MutfakSablonConfig = {
  fontSize: 'large',
  paperWidth: '80mm',
  showTime: true,
  showTable: true
}

export const defaultKasaConfig: KasaSablonConfig = {
  fontSize: 'normal',
  paperWidth: '80mm',
  showTime: true,
  showOrderNo: true,
  showPrices: true,
  showRestoName: true,
  showRestoInfo: true,
  showFooter: true,
  footerText: 'Mali degeri yoktur.\nBizi tercih ettiginiz icin tesekkur ederiz.'
}

const getFontSizePx = (size: 'small' | 'normal' | 'large', type: 'title' | 'base' | 'small_text') => {
  const sizes = {
    small: { title: '18px', base: '12px', small_text: '10px' },
    normal: { title: '24px', base: '16px', small_text: '12px' },
    large: { title: '32px', base: '22px', small_text: '16px' }
  };
  return sizes[size][type];
}

/**
 * Termal fiş çıktısı için miktar ve birimi biçimlendirir.
 * - KG veya gramajlı satış: '0.750 KG' veya '2x 0.750 KG'
 * - Porsiyon satışı: '1 Por', '1.5 Por', '2 Por' veya '2x 1.5 Por'
 */
export function formatMiktarBirim(item: any): string {
  const satisBirim = (
    item.secilenSatisTuru ||
    item.satisBirim ||
    item.satis_birim ||
    (item.urun?.birim?.toLowerCase() === 'kg' ? 'kg' : '') ||
    (item.urun_birim?.toLowerCase() === 'kg' ? 'kg' : '') ||
    'porsiyon'
  ).toLowerCase()

  const gramaj = item.gramaj !== undefined && Number(item.gramaj) > 0 ? Number(item.gramaj) : 0
  const isKg = satisBirim === 'kg' || satisBirim === 'kilo' || gramaj > 0
  const miktar = Number(item.miktar || 1)
  const porsiyon = Number(item.porsiyon || 1)

  if (isKg) {
    const netKg = gramaj > 0 ? gramaj : miktar
    const netKgStr = `${netKg.toFixed(3)} KG`
    if (miktar > 1 && gramaj > 0) {
      return `${miktar}x ${netKgStr}`
    }
    return netKgStr
  } else {
    if (porsiyon !== 1) {
      const porStr = porsiyon === 0.5 ? '0.5 Por' : porsiyon === 2 ? '2 Por' : `${porsiyon} Por`
      if (miktar > 1) {
        return `${miktar}x ${porStr}`
      }
      return porStr
    }
    return `${miktar} Por`
  }
}

export function generateMutfakHtml(
  siparisler: any[], 
  masaNo: string | null, 
  iptaller: any[] = [],
  config: MutfakSablonConfig = defaultMutfakConfig
): string {
  const widthStr = config.paperWidth === '58mm' ? '200px' : '300px';
  const titleSize = getFontSizePx(config.fontSize, 'title');
  const baseSize = getFontSizePx(config.fontSize, 'base');
  const smallSize = getFontSizePx(config.fontSize, 'small_text');

  const tarih = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const baslik = (masaNo && config.showTable) ? `MASA ${masaNo}` : 'YENI SIPARIS';

  let html = `
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Arial', sans-serif; margin: 0; padding: 10px; width: ${widthStr}; color: #000; }
          .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
          .title { font-size: ${titleSize}; font-weight: bold; margin: 0 0 5px 0; }
          .time { font-size: ${smallSize}; }
          .section-title { font-size: ${baseSize}; font-weight: bold; text-align: center; margin: 10px 0; border: 1px solid #000; padding: 4px; }
          .item { border-bottom: 1px dashed #ccc; padding-bottom: 8px; margin-bottom: 8px; font-size: ${baseSize}; }
          .item-name { font-weight: bold; font-size: ${baseSize}; }
          .qty { font-weight: bold; font-size: ${titleSize}; margin-right: 8px; }
          .variant { font-size: ${smallSize}; margin-left: 10px; }
          .option { font-size: ${smallSize}; margin-left: 10px; }
          .note { font-size: ${smallSize}; font-style: italic; margin-top: 4px; border: 1px solid #000; padding: 2px 4px; }
          .cancelled-item { text-decoration: line-through; opacity: 0.7; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">${baslik}</h1>
          ${config.showTime ? `<div class="time">Saat: ${tarih}</div>` : ''}
        </div>
        <div>
  `;

  if (siparisler && siparisler.length > 0) {
    html += `<div class="section-title">[ YENİ SİPARİŞLER ]</div>`;
    for (const siparis of siparisler) {
      const urunAdi = siparis.urun?.ad || siparis.urun_adi || 'Bilinmeyen Ürün';
      const miktarStr = formatMiktarBirim(siparis);
      const varyantAd = siparis.varyant?.ad || siparis.varyant_adi || '';
      
      let opsiyonHTML = '';
      const opsiyonlar = siparis.opsiyonlar || [];
      if (opsiyonlar.length > 0) {
        opsiyonHTML = opsiyonlar.map((o: any) => `<div class="option">+ ${o.ad || o.opsiyon_adi}</div>`).join('');
      }
      const not = siparis.notlar || '';

      html += `
        <div class="item">
          <div style="display: flex; align-items: baseline; gap: 8px;">
            <span class="qty" style="font-family: monospace; min-width: 80px; display: inline-block;">${miktarStr}</span>
            <span class="item-name">${urunAdi}</span>
          </div>
          ${varyantAd ? `<div class="variant">[${varyantAd}]</div>` : ''}
          ${opsiyonHTML}
          ${not ? `<div class="note">NOT: ${not}</div>` : ''}
        </div>
      `;
    }
  }

  if (iptaller && iptaller.length > 0) {
    html += `<div class="section-title" style="color: #000; background: #eee;">[ İPTAL EDİLENLER ]</div>`;
    for (const iptal of iptaller) {
      const urunAdi = iptal.urun?.ad || iptal.urun_adi || 'Bilinmeyen Ürün';
      const miktarStr = formatMiktarBirim(iptal);
      const varyantAd = iptal.varyant?.ad || iptal.varyant_adi || '';
      
      let opsiyonHTML = '';
      const opsiyonlar = iptal.opsiyonlar || [];
      if (opsiyonlar.length > 0) {
        opsiyonHTML = opsiyonlar.map((o: any) => `<div class="option cancelled-item">+ ${o.ad || o.opsiyon_adi}</div>`).join('');
      }

      html += `
        <div class="item">
          <div class="cancelled-item" style="display: flex; align-items: baseline; gap: 8px;">
            <span class="qty" style="font-family: monospace; min-width: 80px; display: inline-block;">${miktarStr}</span>
            <span class="item-name" style="flex: 1;">${urunAdi}</span>
            <strong style="font-size:${smallSize}; border:1px solid #000; padding:2px;">İPTAL</strong>
          </div>
          ${varyantAd ? `<div class="variant cancelled-item">[${varyantAd}]</div>` : ''}
          ${opsiyonHTML}
        </div>
      `;
    }
  }

  html += `
        </div>
        <div style="text-align: center; margin-top: 15px; font-size: 12px;">-- Mutfak Kopyasi --</div>
      </body>
    </html>
  `;
  return html;
}

export function generateAdisyonHtml(
  hesap: any, 
  restoranBilgileri: { ad: string; telefon: string; adres: string; altNot?: string },
  config: KasaSablonConfig = defaultKasaConfig
): string {
  const widthStr = config.paperWidth === '58mm' ? '200px' : '300px';
  const titleSize = getFontSizePx(config.fontSize, 'title');
  const baseSize = getFontSizePx(config.fontSize, 'base');
  const smallSize = getFontSizePx(config.fontSize, 'small_text');

  const tarih = new Date().toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const baslik = hesap.masa_id ? `MASA ${hesap.masa_id}` : 'PAKET / HIZLI SATIS';

  const gecerliSiparisler = (hesap.siparisler || []).filter((s: any) => s.durum !== 'iptal');

  let html = `
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Courier New', Courier, monospace; margin: 0; padding: 10px; width: ${widthStr}; color: #000; }
          .text-center { text-align: center; }
          .header { border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
          .resto-name { font-size: ${titleSize}; font-weight: bold; margin: 0 0 5px 0; }
          .resto-info { font-size: ${smallSize}; margin-bottom: 2px; }
          .table-name { font-size: ${titleSize}; font-weight: bold; margin-top: 10px; margin-bottom: 5px; }
          .meta-info { font-size: ${smallSize}; display: flex; justify-content: space-between; margin-top: 5px; }
          
          .items { margin-bottom: 10px; }
          .item { display: flex; justify-content: space-between; font-size: ${baseSize}; margin-bottom: 4px; }
          .item-details { display: flex; flex-direction: column; width: ${config.showPrices ? '70%' : '100%'}; }
          .item-name { font-weight: bold; }
          .item-sub { font-size: ${smallSize}; padding-left: 10px; }
          .item-price { width: 30%; text-align: right; font-weight: bold; }
          
          .totals { border-top: 2px dashed #000; padding-top: 10px; margin-bottom: 10px; }
          .total-line { display: flex; justify-content: space-between; font-size: ${baseSize}; margin-bottom: 4px; }
          .grand-total { font-size: ${titleSize}; font-weight: bold; margin-top: 5px; padding-top: 5px; border-top: 1px solid #000; }
          
          .footer { text-align: center; font-size: ${smallSize}; border-top: 1px dashed #000; padding-top: 10px; margin-top: 10px; white-space: pre-line; }
        </style>
      </head>
      <body>
        <div class="header text-center">
          ${config.showRestoName ? `<h1 class="resto-name">${restoranBilgileri.ad || 'ETIBOL RESTO'}</h1>` : ''}
          ${config.showRestoInfo ? `
            ${restoranBilgileri.telefon ? `<div class="resto-info">Tel: ${restoranBilgileri.telefon}</div>` : ''}
            ${restoranBilgileri.adres ? `<div class="resto-info">${restoranBilgileri.adres}</div>` : ''}
          ` : ''}
          <div class="table-name">${baslik}</div>
          ${(config.showTime || config.showOrderNo) ? `
          <div class="meta-info">
            ${config.showTime ? `<span>${tarih}</span>` : '<span></span>'}
            ${config.showOrderNo ? `<span>No: #${hesap.hesap_no || '0'}</span>` : ''}
          </div>
          ` : ''}
        </div>
        
        <div class="items">
  `;

  for (const siparis of gecerliSiparisler) {
    const isIkram = siparis.ikram === 1;
    const fiyatStr = isIkram ? 'IKRAM' : formatPara(siparis.toplam_fiyat);
    const miktarStr = formatMiktarBirim(siparis);
    const urunAdi = siparis.urun_adi || siparis.urun?.ad || 'Ürün';

    html += `
      <div class="item">
        <div class="item-details">
          <span class="item-name"><span class="qty" style="display: inline-block; min-width: 68px; font-family: monospace; font-weight: bold;">${miktarStr}</span> ${urunAdi}</span>
          ${siparis.varyant_adi ? `<span class="item-sub">[${siparis.varyant_adi}]</span>` : ''}
        </div>
        ${config.showPrices ? `
        <div class="item-price" ${isIkram ? 'style="text-decoration: line-through"' : ''}>
          ${fiyatStr}
        </div>
        ` : ''}
      </div>
    `;
  }

  // Ödemeler hesaplama
  const odenenTutar = (hesap.odemeler || []).reduce((acc: number, o: any) => acc + o.tutar, 0);
  const kalanTutar = Math.max(0, (hesap.net_tutar || 0) - odenenTutar);

  if (config.showPrices) {
    html += `
          </div>
          
          <div class="totals">
            <div class="total-line">
              <span>Ara Toplam:</span>
              <span>${formatPara(hesap.toplam_tutar || 0)}</span>
            </div>
            ${(hesap.indirim_tutari || 0) > 0 ? `
              <div class="total-line" style="color: #666;">
                <span>Indirim:</span>
                <span>-${formatPara(hesap.indirim_tutari)}</span>
              </div>
            ` : ''}
            <div class="total-line grand-total">
              <span>GENEL TOPLAM:</span>
              <span>${formatPara(hesap.net_tutar || 0)}</span>
            </div>
            
            ${odenenTutar > 0 ? `
              <div class="total-line" style="margin-top: 5px;">
                <span>Odenen:</span>
                <span>-${formatPara(odenenTutar)}</span>
              </div>
              <div class="total-line" style="font-weight: bold;">
                <span>KALAN:</span>
                <span>${formatPara(kalanTutar)}</span>
              </div>
            ` : ''}
          </div>
    `;
  } else {
    html += `</div>`; // Close items div if prices not shown
  }

  if (config.showFooter) {
    html += `
        <div class="footer">
          ${config.footerText}
        </div>
    `;
  }

  html += `
      </body>
    </html>
  `;
  return html;
}

export async function yazdirMutfak(
  siparisler: any[], 
  masaNo: string | null, 
  yaziciAdi: string,
  iptaller: any[] = [],
  config?: MutfakSablonConfig
): Promise<boolean> {
  if ((!siparisler || siparisler.length === 0) && (!iptaller || iptaller.length === 0) || !yaziciAdi) return false;
  
  let finalConfig = config;
  if (!finalConfig) {
    try {
      const data = await ipcInvoke<string>(AYAR_KANALLARI.GETIR, 'yazici_sablon_mutfak');
      if (data) finalConfig = { ...defaultMutfakConfig, ...JSON.parse(data) };
    } catch(e) {
      console.error("Mutfak şablonu getirilemedi", e);
    }
  }
  
  const html = generateMutfakHtml(siparisler, masaNo, iptaller, finalConfig || defaultMutfakConfig);

  try {
    const res = await ipcInvoke<any>(YAZICI_KANALLARI.MUTFAK_YAZDIR, html, yaziciAdi);
    return res?.basarili || false;
  } catch (e) {
    console.error('Mutfak yazdirma hatasi:', e);
    return false;
  }
}

export async function yazdirAdisyon(
  hesap: any, 
  yaziciAdi: string, 
  restoranBilgileri: { ad: string; telefon: string; adres: string; altNot?: string },
  config?: KasaSablonConfig
): Promise<boolean> {
  if (!hesap || !yaziciAdi) return false;

  let finalConfig = config;
  if (!finalConfig) {
    try {
      const data = await ipcInvoke<string>(AYAR_KANALLARI.GETIR, 'yazici_sablon_kasa');
      if (data) finalConfig = { ...defaultKasaConfig, ...JSON.parse(data) };
    } catch(e) {
      console.error("Kasa şablonu getirilemedi", e);
    }
  }

  const html = generateAdisyonHtml(hesap, restoranBilgileri, finalConfig || defaultKasaConfig);

  try {
    const res = await ipcInvoke<any>(YAZICI_KANALLARI.FISI_YAZDIR, html, yaziciAdi);
    return res?.basarili || false;
  } catch (e) {
    console.error('Adisyon yazdirma hatasi:', e);
    return false;
  }
}

// =====================================================
// QR YAZDIRMA ŞABLONLARI & FONKSİYONLARI
// Termal Fiş (58mm/80mm) ve Standart A4/Sticker Baskı Modları
// =====================================================

export interface QRPrintItem {
  id?: string | number
  title: string
  subTitle?: string
  type: 'masa' | 'garson' | 'patron' | 'genel'
  qrUrl: string
  masaNo?: string
  bolumAdi?: string
  restoName?: string
  customNote?: string
}

export interface QRPrintOptions {
  mode: 'thermal' | 'standard'
  paperWidth: '58mm' | '80mm'
  gridCols?: 1 | 2 | 3 | 4
  showRestoName?: boolean
  showGuideText?: boolean
  showCutGuides?: boolean
  restoName?: string
  guideText?: string
}

export const defaultQROptions: QRPrintOptions = {
  mode: 'thermal',
  paperWidth: '80mm',
  gridCols: 3,
  showRestoName: true,
  showGuideText: true,
  showCutGuides: true,
  restoName: 'ETİBOL RESTORAN',
  guideText: 'Menüyü İncelemek İçin Okutunuz'
}

/**
 * Termal POS Yazıcılar için Kağıt Tasarruflu Kompakt QR HTML Üretir
 */
export function generateThermalQRHtml(
  items: { item: QRPrintItem; svgHtml: string }[],
  options: QRPrintOptions = defaultQROptions
): string {
  const is58 = options.paperWidth === '58mm';
  const widthPx = is58 ? '190px' : '280px';
  const qrSize = is58 ? '110px' : '160px';
  const restoName = options.restoName || 'ETİBOL RESTORAN';

  let itemsHtml = '';

  items.forEach((entry, idx) => {
    const item = entry.item;
    const svgContent = entry.svgHtml;
    const isLast = idx === items.length - 1;
    
    let headerTag = 'DİJİTAL QR MENÜ';
    let subTag = options.guideText || 'Menüyü İncelemek İçin Okutunuz';
    if (item.type === 'garson') {
      headerTag = 'GARSON EL TERMİNALİ';
      subTag = 'Garson Girişi İçin Okutunuz';
    } else if (item.type === 'patron') {
      headerTag = 'PATRON CANLI TAKİP';
      subTag = 'Mobil Ciro & Masa Takibi';
    }

    const masaLabel = item.masaNo ? `MASA: ${item.masaNo}` : item.title;
    const bolumText = item.bolumAdi ? `(${item.bolumAdi})` : '';

    itemsHtml += `
      <div class="thermal-card" style="width: 100%; text-align: center; margin: 0 auto; padding: 4px 0 10px 0; ${!isLast ? 'page-break-after: always; border-bottom: 2px dashed #000; margin-bottom: 12px; padding-bottom: 12px;' : ''}">
        
        <!-- Restoran Adı -->
        ${options.showRestoName !== false ? `
          <div style="font-size: ${is58 ? '13px' : '16px'}; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 2px;">
            ${restoName}
          </div>
        ` : ''}

        <div style="font-size: ${is58 ? '10px' : '11px'}; font-weight: 700; color: #333; margin-bottom: 4px; letter-spacing: 0.5px;">
          ${headerTag}
        </div>

        <div style="border-top: 1px dashed #000; margin: 4px 0 6px 0;"></div>

        <!-- Masa No Etiketi (Belirgin & Okunaklı) -->
        <div style="background: #000; color: #fff; padding: 4px 8px; border-radius: 4px; display: inline-block; margin-bottom: 6px;">
          <div style="font-size: ${is58 ? '15px' : '19px'}; font-weight: 900; letter-spacing: 1px; line-height: 1.1;">
            ${masaLabel}
          </div>
          ${bolumText ? `<div style="font-size: ${is58 ? '9px' : '10px'}; font-weight: 600; opacity: 0.9;">${bolumText}</div>` : ''}
        </div>

        <!-- QR Kod Görseli -->
        <div style="display: flex; justify-content: center; align-items: center; margin: 4px 0; padding: 4px; background: #fff; border: 1px solid #000; border-radius: 6px; display: inline-block;">
          <div style="width: ${qrSize}; height: ${qrSize}; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
            ${svgContent}
          </div>
        </div>

        <!-- Yönlendirme Metni -->
        ${options.showGuideText !== false ? `
          <div style="font-size: ${is58 ? '9px' : '11px'}; font-weight: 700; color: #111; margin-top: 4px; line-height: 1.2;">
            ${subTag}
          </div>
        ` : ''}

        <!-- Web URL -->
        <div style="font-size: ${is58 ? '7px' : '9px'}; color: #555; word-break: break-all; margin-top: 3px; font-family: monospace; max-width: 95%; margin-left: auto; margin-right: auto;">
          ${item.qrUrl}
        </div>

        <!-- Kompakt Alt Çizgi -->
        <div style="border-top: 1px dashed #000; margin: 6px 0 2px 0;"></div>
        <div style="font-size: ${is58 ? '8px' : '9px'}; font-weight: 600; color: #444;">
          ★ ETİBOL POS ★
        </div>
      </div>
    `;
  });

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Termal QR Baskı</title>
        <style>
          @page { margin: 0; size: auto; }
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 4px;
            width: ${widthPx};
            color: #000;
            background: #fff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          svg { width: 100% !important; height: 100% !important; }
        </style>
      </head>
      <body>
        ${itemsHtml}
      </body>
    </html>
  `;
}

/**
 * Standart Yazıcılar (A4 / Pleksi Masa Standı / Sticker) için Optimize Edilmiş Şablon Üretir
 */
export function generateStandardQRHtml(
  items: { item: QRPrintItem; svgHtml: string }[],
  options: QRPrintOptions = defaultQROptions
): string {
  const cols = options.gridCols || 3;
  const restoName = options.restoName || 'ETİBOL RESTORAN';

  let cardsHtml = '';

  items.forEach((entry) => {
    const item = entry.item;
    const svgContent = entry.svgHtml;

    let headerTag = 'DİJİTAL MENÜ';
    let subTag = options.guideText || 'Menüyü İncelemek İçin Kameranızla Okutunuz';
    if (item.type === 'garson') {
      headerTag = 'GARSON TERMİNALİ';
      subTag = 'Garson Girişi İçin Kameranızla Okutunuz';
    } else if (item.type === 'patron') {
      headerTag = 'PATRON TAKİP';
      subTag = 'Mobil Ciro Takibi İçin Okutunuz';
    }

    const masaLabel = item.masaNo ? `MASA: ${item.masaNo}` : item.title;
    const bolumText = item.bolumAdi ? item.bolumAdi : '';

    cardsHtml += `
      <div class="qr-stand-card" style="border: 2px solid #1E2538; border-radius: 16px; padding: 18px; text-align: center; background: #ffffff; break-inside: avoid; page-break-inside: avoid; position: relative; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
        
        <!-- Kesim Kılavuzu (Köşe Çentikleri) -->
        ${options.showCutGuides !== false ? `
          <div style="position: absolute; top: 4px; left: 4px; width: 8px; height: 8px; border-top: 1px dashed #999; border-left: 1px dashed #999;"></div>
          <div style="position: absolute; top: 4px; right: 4px; width: 8px; height: 8px; border-top: 1px dashed #999; border-right: 1px dashed #999;"></div>
          <div style="position: absolute; bottom: 4px; left: 4px; width: 8px; height: 8px; border-bottom: 1px dashed #999; border-left: 1px dashed #999;"></div>
          <div style="position: absolute; bottom: 4px; right: 4px; width: 8px; height: 8px; border-bottom: 1px dashed #999; border-right: 1px dashed #999;"></div>
        ` : ''}

        <!-- Başlık & Kurumsal İsim -->
        <div style="margin-bottom: 8px;">
          <div style="font-size: 15px; font-weight: 900; color: #090A0F; letter-spacing: 0.5px; text-transform: uppercase;">
            ${restoName}
          </div>
          <div style="font-size: 11px; font-weight: 700; color: #9A5F48; letter-spacing: 1px; text-transform: uppercase; margin-top: 1px;">
            ${headerTag}
          </div>
        </div>

        <!-- Masa No Badge (Yüksek Kontrast & Belirgin) -->
        <div style="background: #090A0F; color: #FFFFFF; border-radius: 8px; padding: 6px 12px; display: inline-block; margin-bottom: 10px; border: 1px solid #1E2538;">
          <div style="font-size: 18px; font-weight: 900; letter-spacing: 1px; line-height: 1.1;">
            ${masaLabel}
          </div>
          ${bolumText ? `<div style="font-size: 10px; font-weight: 600; color: #94A3B8; text-transform: uppercase;">${bolumText}</div>` : ''}
        </div>

        <!-- QR Kod Alanı -->
        <div style="background: #FFFFFF; padding: 8px; border-radius: 12px; border: 1.5px solid #E2E8F0; display: inline-block; margin: 4px auto 8px auto; box-shadow: inset 0 0 4px rgba(0,0,0,0.03);">
          <div style="width: 140px; height: 140px; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
            ${svgContent}
          </div>
        </div>

        <!-- Yönlendirme & Açıklama -->
        <div style="font-size: 11px; font-weight: 700; color: #0F172A; margin-top: 4px; line-height: 1.3;">
          ${subTag}
        </div>

        <div style="font-size: 8px; color: #64748B; word-break: break-all; margin-top: 4px; font-family: monospace;">
          ${item.qrUrl}
        </div>
      </div>
    `;
  });

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Standart / A4 QR Menü Baskı</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
            color: #000;
            background: #fff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .grid-container {
            display: grid;
            grid-template-columns: repeat(${cols}, 1fr);
            gap: 16px;
            width: 100%;
          }
          svg { width: 100% !important; height: 100% !important; }
        </style>
      </head>
      <body>
        <div class="grid-container">
          ${cardsHtml}
        </div>
      </body>
    </html>
  `;
}

/**
 * QR Kodlarını Termal veya Standart Şablon ile Yazdırır
 */
export async function yazdirQR(
  items: { item: QRPrintItem; svgHtml: string }[],
  options: QRPrintOptions,
  printerName?: string
): Promise<boolean> {
  if (!items || items.length === 0) return false;

  const html = options.mode === 'thermal'
    ? generateThermalQRHtml(items, options)
    : generateStandardQRHtml(items, options);

  if (printerName) {
    try {
      const res = await ipcInvoke<any>(YAZICI_KANALLARI.FISI_YAZDIR, html, printerName);
      return res?.basarili || false;
    } catch (e) {
      console.error('Doğrudan QR yazdırma hatası:', e);
      return false;
    }
  } else {
    // Yeni gizli pencerede aç ve yazdır
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
      return true;
    }
    return false;
  }
}

export async function yazdirZRaporu(vardiya: any, yaziciAdi: string): Promise<boolean> {
  if (!vardiya || !yaziciAdi) return false
  const para = (n: number) => Number(n || 0).toFixed(2) + ' TL'
  const html = `
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Courier New', Courier, monospace; margin: 0; padding: 10px; width: 300px; color: #000; }
          h1 { font-size: 18px; text-align: center; margin: 0 0 8px 0; }
          .line { border-bottom: 1px dashed #000; margin: 8px 0; }
          .row { display: flex; justify-content: space-between; font-size: 13px; margin: 3px 0; }
          .center { text-align: center; font-size: 11px; }
          .big { font-size: 16px; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>Z RAPORU</h1>
        <div class="center">${vardiya.z_no || ''}</div>
        <div class="center">${vardiya.acilis_zamani || ''} — ${vardiya.kapanis_zamani || ''}</div>
        <div class="line"></div>
        <div class="row"><span>Nakit</span><span>${para(vardiya.nakit_satis)}</span></div>
        <div class="row"><span>Kart</span><span>${para(vardiya.kart_satis)}</span></div>
        <div class="row"><span>Yemek karti</span><span>${para(vardiya.yemek_karti_satis)}</span></div>
        <div class="row"><span>Diger</span><span>${para(vardiya.diger_satis)}</span></div>
        <div class="row big"><span>TOPLAM CIRO</span><span>${para(vardiya.toplam_ciro || ((vardiya.nakit_satis||0)+(vardiya.kart_satis||0)+(vardiya.yemek_karti_satis||0)+(vardiya.diger_satis||0)))}</span></div>
        <div class="line"></div>
        <div class="row"><span>Gider</span><span>${para(vardiya.gider)}</span></div>
        <div class="row"><span>Iptal</span><span>${para(vardiya.iptal_tutar)}</span></div>
        <div class="row"><span>Ikram</span><span>${para(vardiya.ikram_tutar)}</span></div>
        <div class="row"><span>Indirim</span><span>${para(vardiya.indirim_tutar)}</span></div>
        <div class="row"><span>Hesap sayisi</span><span>${vardiya.hesap_sayisi || 0}</span></div>
        <div class="line"></div>
        <div class="row"><span>Acilis nakit</span><span>${para(vardiya.acilis_nakit)}</span></div>
        <div class="row"><span>Beklenen</span><span>${para(vardiya.beklenen_nakit)}</span></div>
        <div class="row"><span>Sayim</span><span>${para(vardiya.kapanis_nakit_sayim)}</span></div>
        <div class="row big"><span>NAKIT FARK</span><span>${para(vardiya.nakit_fark)}</span></div>
        <div class="line"></div>
        <div class="center">Mali degeri yoktur</div>
      </body>
    </html>
  `
  try {
    const res = await ipcInvoke<any>(YAZICI_KANALLARI.FISI_YAZDIR, html, yaziciAdi)
    return res?.basarili || false
  } catch (e) {
    console.error('Z raporu yazdirma hatasi:', e)
    return false
  }
}


