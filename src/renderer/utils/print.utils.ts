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
      const miktar = siparis.miktar || 1;
      const varyantAd = siparis.varyant?.ad || siparis.varyant_adi || '';
      
      let opsiyonHTML = '';
      const opsiyonlar = siparis.opsiyonlar || [];
      if (opsiyonlar.length > 0) {
        opsiyonHTML = opsiyonlar.map((o: any) => `<div class="option">+ ${o.ad || o.opsiyon_adi}</div>`).join('');
      }
      const not = siparis.notlar || '';

      html += `
        <div class="item">
          <div><span class="qty">${miktar}x</span><span class="item-name">${urunAdi}</span></div>
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
      const miktar = iptal.miktar || 1;
      const varyantAd = iptal.varyant?.ad || iptal.varyant_adi || '';
      
      let opsiyonHTML = '';
      const opsiyonlar = iptal.opsiyonlar || [];
      if (opsiyonlar.length > 0) {
        opsiyonHTML = opsiyonlar.map((o: any) => `<div class="option cancelled-item">+ ${o.ad || o.opsiyon_adi}</div>`).join('');
      }

      html += `
        <div class="item">
          <div class="cancelled-item">
            <span class="qty">${miktar}x</span><span class="item-name">${urunAdi}</span>
            <strong style="float:right; font-size:${smallSize}; border:1px solid #000; padding:2px;">İPTAL</strong>
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
    
    html += `
      <div class="item">
        <div class="item-details">
          <span class="item-name">${siparis.miktar}x ${siparis.urun_adi}</span>
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
