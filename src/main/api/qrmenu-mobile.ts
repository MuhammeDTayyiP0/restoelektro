// =====================================================
// QR Menü Mobil Web Arayüzü
// Müşterilerin QR okutarak eriştikleri dijital menü
// Express sunucusu üzerinden serve edilir
// =====================================================

export function qrMenuHTML(): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <title>QR Menü</title>
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; -webkit-tap-highlight-color:transparent; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
    :root {
      --brand: #4f46e5; --brand-light: #818cf8; --brand-glow: rgba(79, 70, 229, 0.4);
      --bg: #0b0f19; --surface: #151b2b; --surface-glass: rgba(21, 27, 43, 0.85);
      --surface2: #1e293b; --surface3: #334155;
      --text: #f8fafc; --text2: #94a3b8; --text3: #64748b;
      --radius: 16px; --radius-sm: 10px;
    }
    body { background: var(--bg); color: var(--text); min-height: 100dvh; overflow-x: hidden; }
    
    /* Header */
    .header { 
      padding: env(safe-area-inset-top, 20px) 20px 20px; 
      background: var(--surface); 
      position: sticky; top: 0; z-index: 100;
      border-bottom: 1px solid var(--surface2);
      text-align: center;
    }
    .header-title { font-size: 22px; font-weight: 800; background: linear-gradient(135deg, #fff, var(--brand-light)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .header-subtitle { font-size: 13px; color: var(--text2); font-weight: 500; margin-top: 4px; }
    
    /* Masa Bilgisi */
    .masa-info {
      background: var(--brand-glow);
      color: var(--brand-light);
      padding: 6px 16px;
      border-radius: 20px;
      display: inline-block;
      font-size: 13px;
      font-weight: 700;
      margin-top: 12px;
    }

    /* Kategori Tabs */
    .kat-tabs-container {
      position: sticky; top: 80px; z-index: 99;
      background: var(--surface-glass);
      backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      padding: 16px 20px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .kat-tabs { 
      display: flex; gap: 10px; overflow-x: auto; 
      -webkit-overflow-scrolling: touch; scrollbar-width: none; 
    }
    .kat-tabs::-webkit-scrollbar { display: none; }
    .kat-tab { 
      white-space: nowrap; padding: 10px 20px; border-radius: 24px; 
      font-size: 14px; font-weight: 700; border: none; cursor: pointer; 
      transition: all .2s; background: var(--surface2); color: var(--text2); 
    }
    .kat-tab.active { background: var(--brand); color: #fff; box-shadow: 0 4px 12px var(--brand-glow); transform: translateY(-1px); }
    
    /* Ürün Listesi */
    .menu-container { padding: 20px; padding-bottom: 60px; }
    .kategori-section { margin-bottom: 40px; }
    .kategori-baslik { font-size: 18px; font-weight: 800; color: var(--text); margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    
    .urun-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
    .urun-card { 
      background: var(--surface); border-radius: var(--radius); 
      border: 1px solid var(--surface2); display: flex; overflow: hidden;
      transition: all .2s;
    }
    .urun-resim {
      width: 110px; height: 110px; flex-shrink: 0;
      background: var(--surface2); object-fit: cover;
    }
    .urun-resim-placeholder {
      width: 110px; height: 110px; flex-shrink: 0;
      background: var(--surface2); display: flex; align-items: center; justify-content: center;
      color: var(--text3); font-size: 32px; font-weight: 800;
    }
    .urun-detay { padding: 12px 16px; display: flex; flex-direction: column; justify-content: space-between; flex: 1; }
    .urun-ad { font-size: 16px; font-weight: 700; line-height: 1.3; color: var(--text); margin-bottom: 6px; }
    .urun-fiyat { font-size: 17px; font-weight: 800; color: var(--success); }
    
    /* Loader */
    .loader-container { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 50vh; color: var(--text2); }
    .spinner { width: 40px; height: 40px; border: 4px solid var(--surface3); border-top-color: var(--brand); border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>

  <!-- Header -->
  <header class="header">
    <div id="isletmeAdi" class="header-title">RESTO</div>
    <div class="header-subtitle">Dijital Menü</div>
    <div id="masaInfo" class="masa-info" style="display:none;"></div>
  </header>

  <!-- Loader -->
  <div id="loader" class="loader-container">
    <div class="spinner"></div>
    <div style="font-weight:600;">Menü Yükleniyor...</div>
  </div>

  <div id="menuContent" style="display:none;">
    <!-- Kategori Tabs -->
    <div class="kat-tabs-container">
      <div id="katTabs" class="kat-tabs"></div>
    </div>

    <!-- Ürün Listesi -->
    <div id="urunListesi" class="menu-container"></div>
  </div>

<script>
let veri = { kategoriler: [], urunler: [], isletme_adi: '' };
let aktifKategoriId = null;

// Masa bilgisini URL'den al
const urlParams = new URLSearchParams(window.location.search);
const masaAdi = urlParams.get('masa');

if (masaAdi) {
  const mInfo = document.getElementById('masaInfo');
  mInfo.textContent = 'Masa: ' + masaAdi;
  mInfo.style.display = 'inline-block';
}

async function menuYukle() {
  try {
    const res = await fetch('/api/qrmenu');
    if (!res.ok) throw new Error('API Hatası');
    veri = await res.json();
    
    document.getElementById('isletmeAdi').textContent = veri.isletme_adi || 'Restoran';
    document.title = (veri.isletme_adi || 'Restoran') + ' - QR Menü';
    
    if (veri.kategoriler.length > 0) {
      aktifKategoriId = veri.kategoriler[0].id;
    }
    
    arayuzCiz();
    
    document.getElementById('loader').style.display = 'none';
    document.getElementById('menuContent').style.display = 'block';
  } catch(e) {
    document.getElementById('loader').innerHTML = '<div style="color:var(--danger);font-weight:700;">Menü yüklenemedi. Lütfen tekrar deneyin.</div>';
    console.error(e);
  }
}

function arayuzCiz() {
  // Kategorileri çiz
  const tabs = document.getElementById('katTabs');
  tabs.innerHTML = '';
  
  veri.kategoriler.forEach(k => {
    const btn = document.createElement('button');
    btn.className = 'kat-tab' + (k.id === aktifKategoriId ? ' active' : '');
    btn.textContent = k.ad;
    btn.onclick = () => {
      aktifKategoriId = k.id;
      arayuzCiz();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    tabs.appendChild(btn);
  });
  
  // Ürünleri çiz
  const liste = document.getElementById('urunListesi');
  liste.innerHTML = '';
  
  const seciliKategori = veri.kategoriler.find(k => k.id === aktifKategoriId);
  const urunler = veri.urunler.filter(u => u.kategori_id === aktifKategoriId);
  
  if (seciliKategori) {
    const baslik = document.createElement('div');
    baslik.className = 'kategori-baslik';
    baslik.textContent = seciliKategori.ad;
    liste.appendChild(baslik);
  }
  
  const grid = document.createElement('div');
  grid.className = 'urun-grid';
  
  if (urunler.length === 0) {
    grid.innerHTML = '<div style="color:var(--text3); font-size:14px;">Bu kategoride ürün bulunmuyor.</div>';
  } else {
    urunler.forEach(u => {
      let resimHtml = '';
      if (u.resim_yolu) {
        // base64 verisi zaten db'de olabilir veya dosya yolu.
        resimHtml = \`<img src="\${u.resim_yolu}" class="urun-resim" alt="\${u.ad}">\`;
      } else {
        resimHtml = \`<div class="urun-resim-placeholder">\${u.ad.charAt(0)}</div>\`;
      }
      
      grid.innerHTML += \`
        <div class="urun-card">
          \${resimHtml}
          <div class="urun-detay">
            <div class="urun-ad">\${u.ad}</div>
            <div class="urun-fiyat">₺\${Number(u.fiyat).toFixed(2)} / \${u.birim || 'Adet'}</div>
          </div>
        </div>
      \`;
    });
  }
  
  liste.appendChild(grid);
}

// INIT
menuYukle();
</script>
</body>
</html>`;
}
