import { IpcMain, BrowserWindow, WebContents } from 'electron'
import { YAZICI_KANALLARI } from '../../common/ipc-channels'

/**
 * Yazdırılacak HTML'i gizli bir pencerede açar ve sessizce yazdırır.
 */
async function printHtml(htmlContent: string, printerName?: string): Promise<boolean> {
  return new Promise((resolve) => {
    let win = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

    win.webContents.on('did-finish-load', () => {
      const options: any = {
        silent: true,
        printBackground: true,
        margins: { marginType: 'none' } // Termal yazıcılar için sıfır kenar boşluğu
      };
      
      if (printerName) {
        options.deviceName = printerName;
      }

      win.webContents.print(options, (success: boolean, failureReason: string) => {
        if (!success) {
          console.error('[Printer] Yazdırma başarısız:', failureReason);
        }
        win.close();
        resolve(success);
      });
    });
  });
}

export function yaziciIPCKaydet(ipcMain: IpcMain): void {
  // Sistemdeki yazıcıları getir
  ipcMain.handle(YAZICI_KANALLARI.AYARLAR, async (event) => {
    try {
      const printers = await event.sender.getPrintersAsync();
      return { basarili: true, yazicilar: printers };
    } catch (err: any) {
      console.error('[Printer] Yazıcılar alınamadı:', err);
      return { basarili: false, hata: err.message };
    }
  });

  // Müşteri Fişi Yazdır
  ipcMain.handle(YAZICI_KANALLARI.FISI_YAZDIR, async (_event, html: string, printerName?: string) => {
    try {
      const basarili = await printHtml(html, printerName);
      return { basarili };
    } catch (err: any) {
      console.error('[Printer] Fiş yazdırma hatası:', err);
      return { basarili: false, hata: err.message };
    }
  });

  // Mutfak Fişi Yazdır
  ipcMain.handle(YAZICI_KANALLARI.MUTFAK_YAZDIR, async (_event, html: string, printerName?: string) => {
    try {
      const basarili = await printHtml(html, printerName);
      return { basarili };
    } catch (err: any) {
      console.error('[Printer] Mutfak yazdırma hatası:', err);
      return { basarili: false, hata: err.message };
    }
  });

  // Test Yazdırması
  ipcMain.handle(YAZICI_KANALLARI.TEST_YAZDIR, async (_event, printerName: string) => {
    const testHtml = `
      <html>
        <body style="font-family: sans-serif; text-align: center; width: 300px; padding: 20px;">
          <h2>ETIBOL RESTO</h2>
          <h3>TEST YAZDIRMASI</h3>
          <p>Tarih: ${new Date().toLocaleString()}</p>
          <p>Yazıcı: ${printerName}</p>
          <hr>
          <p>Bu bir test fişidir.</p>
          <p>Yazıcı bağlantınız başarılı.</p>
        </body>
      </html>
    `;
    try {
      const basarili = await printHtml(testHtml, printerName);
      return { basarili };
    } catch (err: any) {
      return { basarili: false, hata: err.message };
    }
  });
}
