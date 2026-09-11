// =====================================================
// Patron (Boss) Mobil Web Arayüzü
// Restoran sahibinin telefondan anlık ciro ve masaları takip ekranı
// =====================================================

export function bossMobilHTML(): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="theme-color" content="#0B0A08">
  <title>ETİBOL POS - Patron Takip Paneli</title>
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-base: #0B0A08;
      --bg-surface: #171410;
      --bg-surface-elevated: #1E1A16;
      --border-subtle: #322C26;
      --border-focus: #4A433A;
      --brand-primary: #9A5F48;
      --pos-green: #10B981;
      --pos-amber: #F59E0B;
      --pos-red: #EF4444;
      --text-main: #F4EFE8;
      --text-muted: #9C9284;
      --text-dim: #7A7166;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    body {
      background-color: var(--bg-base);
      color: var(--text-main);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      min-height: 100vh;
      padding-bottom: 40px;
    }
    .header {
      background: #12110E;
      border-bottom: 1px solid var(--border-subtle);
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 50;
    }
    .logo-area { display: flex; align-items: center; gap: 10px; }
    .logo-badge {
      width: 36px; height: 36px; border-radius: 10px;
      background: #9A5F48; border: 1px solid rgba(192, 143, 122, 0.35);
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; color: #FFF; font-size: 15px;
    }
    .logo-title { font-size: 15px; font-weight: 800; color: #FFF; letter-spacing: -0.3px; }
    .logo-sub { font-size: 11px; color: var(--text-dim); font-family: 'JetBrains Mono', monospace; }
    
    .container { max-width: 600px; margin: 0 auto; padding: 16px; }
    
    /* PIN Screen */
    #pin-screen {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      min-height: 80vh; text-align: center;
    }
    .pin-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: 20px;
      padding: 28px 24px;
      width: 100%;
      max-width: 340px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }
    .pin-title { font-size: 17px; font-weight: 700; margin-bottom: 6px; }
    .pin-desc { font-size: 12px; color: var(--text-muted); margin-bottom: 20px; }
    .pin-dots { display: flex; justify-content: center; gap: 12px; margin-bottom: 24px; }
    .pin-dot {
      width: 14px; height: 14px; border-radius: 50%;
      background: #1E2538; border: 1px solid #334155;
      transition: all 0.15s ease;
    }
    .pin-dot.filled { background: var(--brand-primary); border-color: #60A5FA; transform: scale(1.15); box-shadow: 0 0 10px rgba(59,130,246,0.5); }
    .numpad { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .num-btn {
      height: 54px; border-radius: 14px; background: #141926; border: 1px solid var(--border-subtle);
      color: #FFF; font-size: 20px; font-weight: 700; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.1s, transform 0.05s;
    }
    .num-btn:active { background: #1E2538; transform: scale(0.96); }
    .num-btn.fn { font-size: 13px; color: var(--text-muted); }

    /* Dashboard */
    #dashboard-screen { display: none; }
    .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px; }
    .stat-card {
      background: var(--bg-surface); border: 1px solid var(--border-subtle);
      border-radius: 16px; padding: 16px; position: relative; overflow: hidden;
    }
    .stat-card.main { grid-column: span 2; background: linear-gradient(135deg, #101524 0%, #0E121E 100%); border-color: #263352; }
    .stat-label { font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
    .stat-value { font-size: 24px; font-weight: 900; font-family: 'JetBrains Mono', monospace; color: #FFF; }
    .stat-value.hero { font-size: 32px; color: var(--pos-green); }
    
    .section-head {
      display: flex; align-items: center; justify-content: space-between;
      margin: 24px 0 12px 0; font-size: 13px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;
    }
    .table-list { display: flex; flex-direction: column; gap: 8px; }
    .table-row {
      background: var(--bg-surface); border: 1px solid var(--border-subtle);
      border-radius: 14px; padding: 14px 16px; display: flex; align-items: center; justify-content: space-between;
    }
    .table-row.dolu { border-left: 4px solid var(--pos-amber); }
    .table-row.bos { border-left: 4px solid var(--pos-green); opacity: 0.7; }
    .table-info { display: flex; flex-direction: column; }
    .table-no { font-size: 14px; font-weight: 700; color: #FFF; }
    .table-sub { font-size: 11px; color: var(--text-dim); }
    .table-amount { font-family: 'JetBrains Mono', monospace; font-size: 15px; font-weight: 700; color: #F8FAFC; }
    
    .btn-refresh {
      background: #141926; border: 1px solid var(--border-subtle);
      color: #94A3B8; padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 600; cursor: pointer;
    }
  </style>
</head>
<body>

  <header class="header">
    <div class="logo-area">
      <div class="logo-badge">👑</div>
      <div>
        <div class="logo-title">ETİBOL POS</div>
        <div class="logo-sub">PATRON CANLI TAKİP</div>
      </div>
    </div>
    <div id="header-right" style="display:none;">
      <button class="btn-refresh" onclick="verileriGetir()">Yenile ↻</button>
    </div>
  </header>

  <div class="container">
    
    <!-- PIN Ekranı -->
    <div id="pin-screen">
      <div class="pin-card">
        <div class="pin-title">Patron / Yönetici Girişi</div>
        <div class="pin-desc">Lütfen yönetici veya garson PIN kodunuzu girin</div>
        <div class="pin-dots">
          <div class="pin-dot" id="dot-1"></div>
          <div class="pin-dot" id="dot-2"></div>
          <div class="pin-dot" id="dot-3"></div>
          <div class="pin-dot" id="dot-4"></div>
        </div>
        <div class="numpad">
          <button class="num-btn" onclick="pinEkle('1')">1</button>
          <button class="num-btn" onclick="pinEkle('2')">2</button>
          <button class="num-btn" onclick="pinEkle('3')">3</button>
          <button class="num-btn" onclick="pinEkle('4')">4</button>
          <button class="num-btn" onclick="pinEkle('5')">5</button>
          <button class="num-btn" onclick="pinEkle('6')">6</button>
          <button class="num-btn" onclick="pinEkle('7')">7</button>
          <button class="num-btn" onclick="pinEkle('8')">8</button>
          <button class="num-btn" onclick="pinEkle('9')">9</button>
          <button class="num-btn fn" onclick="pinTemizle()">C</button>
          <button class="num-btn" onclick="pinEkle('0')">0</button>
          <button class="num-btn fn" onclick="pinSil()">⌫</button>
        </div>
        <div id="pin-error" style="color:var(--pos-red); font-size:12px; margin-top:14px; min-height:16px;"></div>
      </div>
    </div>

    <!-- Dashboard Ekranı -->
    <div id="dashboard-screen">
      <div class="stats-grid">
        <div class="stat-card main">
          <div class="stat-label">Bugünkü Toplam Ciro</div>
          <div class="stat-value hero" id="stat-ciro">0.00 ₺</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Kapanan Masa</div>
          <div class="stat-value" id="stat-kapanan">0</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Açık Masa</div>
          <div class="stat-value" id="stat-acik" style="color:var(--pos-amber);">0</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Ort. Adisyon</div>
          <div class="stat-value" id="stat-ortalama">0 ₺</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Tarih</div>
          <div class="stat-value" id="stat-tarih" style="font-size:14px; padding-top:6px;">-</div>
        </div>
      </div>

      <div class="section-head">
        <span>Canlı Masalar</span>
        <span id="masa-sayac" style="font-family:'JetBrains Mono'; font-size:11px;">0 Masa</span>
      </div>

      <div class="table-list" id="table-list">
        <!-- Dinamik masalar -->
      </div>
    </div>

  </div>

  <script>
    let currentPin = '';
    let authToken = localStorage.getItem('etibol_boss_token') || '';

    function guncelleDots() {
      for (let i = 1; i <= 4; i++) {
        const dot = document.getElementById('dot-' + i);
        if (dot) {
          dot.className = i <= currentPin.length ? 'pin-dot filled' : 'pin-dot';
        }
      }
    }

    function pinEkle(num) {
      if (currentPin.length < 6) {
        currentPin += num;
        guncelleDots();
        if (currentPin.length >= 4) {
          pinGonder();
        }
      }
    }

    function pinSil() {
      currentPin = currentPin.slice(0, -1);
      guncelleDots();
    }

    function pinTemizle() {
      currentPin = '';
      guncelleDots();
      document.getElementById('pin-error').innerText = '';
    }

    async function pinGonder() {
      try {
        const res = await fetch('/api/garson/pin-giris', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin_kodu: currentPin })
        });
        const data = await res.json();
        if (res.ok && data.token) {
          authToken = data.token;
          localStorage.setItem('etibol_boss_token', authToken);
          girisBasarili();
        } else {
          document.getElementById('pin-error').innerText = data.hata || 'Geçersiz PIN';
          setTimeout(pinTemizle, 800);
        }
      } catch (e) {
        document.getElementById('pin-error').innerText = 'Bağlantı hatası!';
        setTimeout(pinTemizle, 800);
      }
    }

    function girisBasarili() {
      document.getElementById('pin-screen').style.display = 'none';
      document.getElementById('dashboard-screen').style.display = 'block';
      document.getElementById('header-right').style.display = 'block';
      verileriGetir();
    }

    async function verileriGetir() {
      if (!authToken) return;
      try {
        const headers = { 'Authorization': 'Bearer ' + authToken };
        const [ozetRes, masalarRes] = await Promise.all([
          fetch('/api/boss/ozet', { headers }),
          fetch('/api/boss/masalar', { headers })
        ]);

        if (ozetRes.status === 401 || masalarRes.status === 401) {
          localStorage.removeItem('etibol_boss_token');
          authToken = '';
          document.getElementById('pin-screen').style.display = 'flex';
          document.getElementById('dashboard-screen').style.display = 'none';
          document.getElementById('header-right').style.display = 'none';
          return;
        }

        const ozetData = await ozetRes.json();
        const masalarData = await masalarRes.json();

        // Ozet
        if (ozetData.ozet) {
          const ciro = (ozetData.ozet.toplam_ciro || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          const ort = (ozetData.ozet.ortalama_hesap || 0).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
          document.getElementById('stat-ciro').innerText = ciro + ' ₺';
          document.getElementById('stat-kapanan').innerText = ozetData.ozet.kapanan_hesap || 0;
          document.getElementById('stat-acik').innerText = ozetData.ozet.acik_hesap || 0;
          document.getElementById('stat-ortalama').innerText = ort + ' ₺';
          document.getElementById('stat-tarih').innerText = ozetData.tarih || new Date().toISOString().slice(0, 10);
        }

        // Masalar
        const tableListEl = document.getElementById('table-list');
        tableListEl.innerHTML = '';
        if (Array.isArray(masalarData)) {
          document.getElementById('masa-sayac').innerText = masalarData.length + ' Masa';
          masalarData.forEach(m => {
            const isDolu = m.toplam_tutar && m.toplam_tutar > 0;
            const row = document.createElement('div');
            row.className = 'table-row ' + (isDolu ? 'dolu' : 'bos');
            const tutarFormatted = isDolu ? (m.toplam_tutar).toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' ₺' : 'Boş';
            row.innerHTML = \`
              <div class="table-info">
                <div class="table-no">\${m.bolum_adi} - \${m.numara}</div>
                <div class="table-sub">\${isDolu ? (m.garson_adi ? 'Garson: ' + m.garson_adi : 'Açık Masa') : 'Masa Boş'}</div>
              </div>
              <div class="table-amount" style="color:\${isDolu ? 'var(--pos-amber)' : 'var(--pos-green)'};">\${tutarFormatted}</div>
            \`;
            tableListEl.appendChild(row);
          });
        }
      } catch (err) {
        console.error(err);
      }
    }

    // Auto load if token exists
    if (authToken) {
      girisBasarili();
    }
  </script>
</body>
</html>`;
}
