// =====================================================
// Garson Mobil Web Arayüzü
// Telefondan erişilebilen sipariş alma ekranı
// Express sunucusu üzerinden serve edilir
// =====================================================

export function garsonMobilHTML(): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="mobile-web-app-capable" content="yes">
  <title>ETİBOL RESTO - Garson</title>
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; -webkit-tap-highlight-color:transparent; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
    :root {
      --brand: #4f46e5; --brand-dark: #3730a3; --brand-light: #818cf8; --brand-glow: rgba(79, 70, 229, 0.4);
      --bg: #0b0f19; --surface: #151b2b; --surface-glass: rgba(21, 27, 43, 0.7);
      --surface2: #1e293b; --surface3: #334155;
      --text: #f8fafc; --text2: #94a3b8; --text3: #64748b;
      --success: #10b981; --success-glass: rgba(16, 185, 129, 0.15);
      --danger: #f43f5e; --danger-glass: rgba(244, 63, 94, 0.15);
      --warning: #f59e0b;
      --radius: 16px; --radius-sm: 10px;
    }
    body { background: var(--bg); color: var(--text); min-height: 100dvh; overflow-x: hidden; }
    
    /* Login Screen */
    .login-screen { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100dvh; padding:24px; background: radial-gradient(circle at top, var(--surface) 0%, var(--bg) 100%); }
    .login-logo { width:80px; height:80px; background: linear-gradient(135deg, var(--brand-light), var(--brand)); border-radius:24px; display:flex; align-items:center; justify-content:center; font-size:32px; font-weight:800; color:white; margin-bottom:24px; box-shadow: 0 10px 25px var(--brand-glow); }
    .login-title { font-size:24px; font-weight:800; margin-bottom:8px; letter-spacing:-0.5px; }
    .login-sub { color:var(--text2); margin-bottom:40px; font-size:15px; }
    .pin-dots { display:flex; gap:16px; margin-bottom:40px; }
    .pin-dot { width:20px; height:20px; border-radius:50%; border:2px solid var(--surface3); display:flex; align-items:center; justify-content:center; transition:all .3s cubic-bezier(0.4, 0, 0.2, 1); }
    .pin-dot.filled { border-color:var(--brand-light); background:var(--brand-light); box-shadow: 0 0 15px var(--brand-glow); transform: scale(1.1); }
    .numpad { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; max-width:320px; width:100%; }
    .numpad button { height:64px; border:none; border-radius:50px; font-size:24px; font-weight:600; cursor:pointer; transition:all .1s; display:flex; align-items:center; justify-content:center; }
    .numpad .num { background:var(--surface2); color:var(--text); }
    .numpad .num:active { background:var(--brand); transform:scale(.92); }
    .numpad .action { background:transparent; color:var(--text2); font-size:20px; }
    .numpad .action:active { color:var(--text); transform:scale(.92); }
    .login-error { color:var(--danger); margin-top:24px; font-size:14px; font-weight:600; height:20px; }
    
    /* App Screen */
    .app { display:none; flex-direction:column; min-height:100dvh; }
    .app.active { display:flex; }
    
    /* Header */
    .header { display:flex; align-items:center; justify-content:space-between; padding:env(safe-area-inset-top, 16px) 20px 16px; background:var(--surface-glass); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); border-bottom:1px solid rgba(255,255,255,0.05); position:sticky; top:0; z-index:100; }
    .header-info { display:flex; flex-direction:column; gap:2px; }
    .header-title { font-size:18px; font-weight:800; letter-spacing:-0.5px; }
    .header-user { font-size:12px; font-weight:500; color:var(--brand-light); text-transform:uppercase; letter-spacing:1px; }
    .btn-sm { padding:8px 16px; border:none; border-radius:20px; font-size:13px; font-weight:700; cursor:pointer; transition:all 0.2s; }
    .btn-danger { background:var(--danger-glass); color:var(--danger); }
    .btn-danger:active { background:var(--danger); color:white; transform:scale(0.95); }
    
    /* Bottom Nav */
    .bottom-nav { display:flex; background:var(--surface-glass); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); border-top:1px solid rgba(255,255,255,0.05); position:fixed; bottom:0; left:0; right:0; z-index:100; padding-bottom:env(safe-area-inset-bottom); }
    .nav-item { flex:1; display:flex; flex-direction:column; align-items:center; gap:6px; padding:12px 0; cursor:pointer; color:var(--text3); font-size:12px; font-weight:600; transition:all .3s cubic-bezier(0.4, 0, 0.2, 1); }
    .nav-item.active { color:var(--brand-light); }
    .nav-item.active .nav-icon { transform:translateY(-2px) scale(1.1); color:var(--brand-light); }
    .nav-icon { font-size:22px; transition:all .3s; }
    
    /* Pages */
    .page { display:none; flex:1; padding:20px; padding-bottom:120px; overflow-y:auto; -webkit-overflow-scrolling:touch; }
    .page.active { display:block; animation:fadeIn 0.3s ease; }
    @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
    
    /* Masa Grid */
    .section-title { font-size:13px; font-weight:800; color:var(--text3); text-transform:uppercase; letter-spacing:1.5px; margin:24px 0 12px; display:flex; align-items:center; gap:8px; }
    .section-title::after { content:''; flex:1; height:1px; background:var(--surface2); }
    .section-title:first-child { margin-top:0; }
    .masa-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; margin-bottom:24px; }
    .masa-card { background:var(--surface); padding:16px; border-radius:var(--radius); cursor:pointer; border:1px solid var(--surface2); transition:all .2s; position:relative; overflow:hidden; }
    .masa-card.bos { border-color:var(--success-glass); }
    .masa-card.dolu { background:linear-gradient(to bottom right, var(--surface), #1e111a); border-color:var(--danger-glass); }
    .masa-card:active { transform:scale(.96); }
    .masa-no { font-size:18px; font-weight:800; margin-bottom:4px; }
    .masa-card.bos .masa-no { color:var(--text); }
    .masa-card.dolu .masa-no { color:var(--danger); }
    .masa-tutar { font-size:14px; color:var(--text2); font-weight:600; }
    .masa-badge { position:absolute; top:12px; right:12px; width:8px; height:8px; border-radius:50%; }
    .masa-card.bos .masa-badge { background:var(--success); box-shadow: 0 0 8px var(--success); }
    .masa-card.dolu .masa-badge { background:var(--danger); box-shadow: 0 0 8px var(--danger); }
    
    /* Sipariş Page */
    .siparis-header { display:flex; align-items:center; gap:12px; margin-bottom:20px; }
    .siparis-header .back { width:40px; height:40px; border-radius:var(--radius-sm); background:var(--surface2); border:none; color:var(--text); font-size:20px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.2s; }
    .siparis-header .back:active { transform:scale(0.9); background:var(--surface3); }
    
    /* Kategori Tabs */
    .kat-tabs { display:flex; gap:8px; overflow-x:auto; padding-bottom:12px; margin-bottom:16px; -webkit-overflow-scrolling:touch; scrollbar-width:none; margin-left:-20px; margin-right:-20px; padding-left:20px; padding-right:20px; }
    .kat-tabs::-webkit-scrollbar { display:none; }
    .kat-tab { white-space:nowrap; padding:10px 20px; border-radius:24px; font-size:14px; font-weight:700; border:none; cursor:pointer; flex-shrink:0; transition:all .2s; background:var(--surface2); color:var(--text2); border:1px solid transparent; }
    .kat-tab.active { background:var(--brand-glow); color:var(--brand-light); border-color:var(--brand); }
    .kat-tab:active { transform:scale(.95); }
    
    /* Ürün Grid */
    .urun-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }
    .urun-card { background:var(--surface); border-radius:var(--radius); padding:16px; cursor:pointer; transition:all .2s; border:1px solid var(--surface2); display:flex; flex-direction:column; justify-content:space-between; min-height:100px; }
    .urun-card:active { border-color:var(--brand); transform:scale(.95); background:var(--surface2); }
    .urun-ad { font-size:14px; font-weight:700; margin-bottom:8px; line-height:1.4; }
    .urun-fiyat { font-size:15px; font-weight:800; color:var(--brand-light); }
    
    /* Masa Detay Listesi */
    .detay-kart { background:var(--surface); border-radius:var(--radius); padding:20px; margin-bottom:20px; border: 1px solid var(--surface2); box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
    .detay-row { display:flex; justify-content:space-between; align-items:center; }
    
    .acik-siparisler { background:var(--surface); border-radius:var(--radius); padding:4px 16px; border: 1px solid var(--surface2); }
    .siparis-row { display:flex; justify-content:space-between; padding:16px 0; border-bottom:1px solid var(--surface2); }
    .siparis-row:last-child { border-bottom:none; }
    
    /* Sepet FAB */
    .sepet-bar { position:fixed; bottom:calc(env(safe-area-inset-bottom) + 80px); left:20px; right:20px; background:linear-gradient(135deg, var(--brand-light), var(--brand)); border-radius:24px; padding:16px 20px; display:flex; align-items:center; justify-content:space-between; cursor:pointer; z-index:90; box-shadow:0 10px 25px var(--brand-glow); transition:all .3s cubic-bezier(0.4, 0, 0.2, 1); }
    .sepet-bar:active { transform:scale(.96) translateY(4px); }
    .sepet-bar.hidden { opacity:0; transform:translateY(50px) scale(0.9); pointer-events:none; }
    .sepet-adet { background:white; color:var(--brand); width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:15px; }
    .sepet-tutar { font-size:18px; font-weight:800; color:white; }
    
    /* Sepet Modal */
    .modal-bg { display:none; position:fixed; inset:0; background:rgba(0,0,0,.8); backdrop-filter:blur(4px); -webkit-backdrop-filter:blur(4px); z-index:200; opacity:0; transition:opacity .3s; }
    .modal-bg.active { display:block; opacity:1; }
    .modal { position:fixed; bottom:0; left:0; right:0; background:var(--bg); border-radius:24px 24px 0 0; max-height:85dvh; display:flex; flex-direction:column; z-index:201; transform:translateY(100%); transition:transform .3s cubic-bezier(0.4, 0, 0.2, 1); }
    .modal.active { transform:translateY(0); }
    .modal-header { padding:20px; border-bottom:1px solid var(--surface2); display:flex; justify-content:space-between; align-items:center; }
    .modal-title { font-size:18px; font-weight:800; }
    .modal-close { width:32px; height:32px; border-radius:50%; background:var(--surface2); color:var(--text); border:none; font-size:16px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-weight:bold; }
    .modal-body { flex:1; overflow-y:auto; padding:20px; -webkit-overflow-scrolling:touch; }
    
    .sepet-item { padding:16px; background:var(--surface); border:1px solid var(--surface2); border-radius:var(--radius); margin-bottom:12px; }
    .sepet-item-header { display:flex; justify-content:space-between; margin-bottom:12px; }
    .sepet-item-ad { font-size:15px; font-weight:700; }
    .sepet-item-fiyat { font-size:15px; font-weight:800; color:var(--brand-light); }
    .sepet-actions { display:flex; justify-content:space-between; align-items:center; gap:12px; }
    .not-input { flex:1; padding:10px 12px; border-radius:var(--radius-sm); border:1px solid var(--surface3); background:var(--bg); color:var(--text); font-size:13px; transition:border .2s; }
    .not-input:focus { border-color:var(--brand); outline:none; }
    
    .sepet-miktar { display:flex; align-items:center; background:var(--bg); border-radius:var(--radius-sm); border:1px solid var(--surface3); padding:2px; }
    .sepet-miktar button { width:36px; height:32px; border:none; background:transparent; font-size:18px; font-weight:400; cursor:pointer; color:var(--text); display:flex; align-items:center; justify-content:center; border-radius:8px; }
    .sepet-miktar button:active { background:var(--surface2); }
    .sepet-miktar span { font-weight:700; min-width:32px; text-align:center; font-size:15px; }
    
    .modal-footer { padding:20px; padding-bottom:calc(20px + env(safe-area-inset-bottom)); border-top:1px solid var(--surface2); background:var(--surface); }
    .btn-gonder { width:100%; padding:18px; border:none; border-radius:var(--radius); background:linear-gradient(135deg, #10b981, #059669); color:white; font-size:16px; font-weight:800; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 8px 20px rgba(16, 185, 129, 0.3); transition:all .2s; }
    .btn-gonder:active { transform:scale(.97); box-shadow:0 4px 10px rgba(16, 185, 129, 0.2); }
    .btn-gonder:disabled { opacity:.5; transform:none; box-shadow:none; }
    
    /* Haptic Animation */
    @keyframes haptic { 0% {transform:scale(1);} 50% {transform:scale(1.05);} 100% {transform:scale(1);} }
    .haptic-anim { animation: haptic 0.2s ease; }
    
    /* Toast */
    .toast { position:fixed; top:env(safe-area-inset-top, 20px); left:20px; right:20px; background:var(--success); color:white; padding:16px; border-radius:var(--radius-sm); font-weight:600; font-size:14px; text-align:center; z-index:999; transform:translateY(-100px); opacity:0; transition:all .4s cubic-bezier(0.4, 0, 0.2, 1); box-shadow:0 10px 20px rgba(0,0,0,0.3); }
    .toast.show { transform:translateY(0); opacity:1; }
    .toast.error { background:var(--danger); }
    
    /* Loaders */
    .spinner { width:32px; height:32px; border:3px solid var(--surface3); border-top-color:var(--brand-light); border-radius:50%; animation:spin .8s ease infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .center-loader { display:flex; align-items:center; justify-content:center; padding:60px; }
    
    .btn-ikram { padding:8px 12px; border:none; border-radius:var(--radius-sm); font-weight:700; font-size:12px; background:var(--surface2); color:var(--text); margin-left:8px; transition:all .2s; }
    .btn-ikram.aktif { background:var(--brand-glow); color:var(--brand-light); border:1px solid var(--brand); }
  </style>
</head>
<body>

  <!-- LOGIN -->
  <div id="loginScreen" class="login-screen">
    <div class="login-logo">RE</div>
    <div class="login-title">Garson Girişi</div>
    <div class="login-sub">Devam etmek için PIN girin</div>
    <div class="pin-dots" id="pinDots">
      <div class="pin-dot"></div><div class="pin-dot"></div><div class="pin-dot"></div><div class="pin-dot"></div>
    </div>
    <div class="numpad" id="numpad"></div>
    <div class="login-error" id="loginError"></div>
  </div>

  <!-- APP -->
  <div id="appScreen" class="app">
    <div class="header">
      <div class="header-info">
        <div class="header-title" id="headerTitle">Masalar</div>
        <div class="header-user" id="headerUser"></div>
      </div>
      <button class="btn-sm btn-danger" onclick="cikisYap()">Çıkış</button>
    </div>

    <div id="pageMasalar" class="page active"></div>
    <div id="pageMasaDetay" class="page"></div>
    <div id="pageSiparis" class="page"></div>

    <div class="bottom-nav">
      <div class="nav-item active" onclick="sayfaGit('masalar')" id="navMasalar">
        <span class="nav-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
        </span>
        Tümü
      </div>
      <div class="nav-item" onclick="sayfaGit('acikMasalar')" id="navAcikMasalar">
        <span class="nav-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        </span>
        Açık Masalar
      </div>
    </div>
  </div>

  <!-- Sepet Bar -->
  <div id="sepetBar" class="sepet-bar hidden" onclick="sepetModalAc()">
    <div style="display:flex;align-items:center;gap:12px">
      <div class="sepet-adet" id="sepetAdet">0</div>
      <span style="font-weight:700; font-size:15px; color:rgba(255,255,255,0.9);">Sepeti Gör</span>
    </div>
    <div class="sepet-tutar" id="sepetTutar">₺0</div>
  </div>

  <!-- Sepet Modal -->
  <div id="sepetModalBg" class="modal-bg" onclick="sepetModalKapat()"></div>
  <div id="sepetModal" class="modal">
    <div class="modal-header">
      <div class="modal-title">Gönderilecekler</div>
      <button class="modal-close" onclick="sepetModalKapat()">✕</button>
    </div>
    <div class="modal-body" id="sepetListe"></div>
    <div class="modal-footer">
      <button class="btn-gonder" id="btnGonder" onclick="siparisGonder()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        Mutfağa Gönder
      </button>
    </div>
  </div>

  <div id="toast" class="toast"></div>

<script src="/socket.io/socket.io.js"></script>
<script>
const API = location.origin;
const socket = io();

socket.on('masalar:guncellendi', () => {
  if (token) {
    // Sadece eğer ekranda masa listesine bakıyorsak
    const pMasalar = document.getElementById('pageMasalar');
    if (pMasalar && pMasalar.classList.contains('active') && pMasalar.style.display !== 'none') {
      masalariYukle();
    }
  }
});

socket.on('siparis:guncellendi', (hesapId, masaId) => {
  if (token && aktifMasa) {
    // Eğer garson açık olan masanın detayındaysa yenile
    if (aktifMasa.hesap_id === hesapId || aktifMasa.id === masaId) {
      const pMasaDetay = document.getElementById('pageMasaDetay');
      if (pMasaDetay && pMasaDetay.classList.contains('active') && pMasaDetay.style.display !== 'none') {
        masaDetayCiz(aktifMasa.id);
      }
    }
  }
});
let token = null;
let kullanici = null;
let pin = '';
let masalar = [];
let menu = { kategoriler: [], urunler: [] };
let aktifKategori = null;
let aktifMasa = null;
let sepet = [];
let sadeceAcik = false;
let seciliBolum = null;

// ===== LOGIN =====
function pinPadOlustur() {
  const pad = document.getElementById('numpad');
  const tuslar = ['1','2','3','4','5','6','7','8','9','C','0','⌫'];
  pad.innerHTML = tuslar.map(t => {
    const cls = (t === 'C' || t === '⌫') ? 'action' : 'num';
    return '<button class="'+cls+'" onclick="pinTus(\\''+t+'\\')">'+t+'</button>';
  }).join('');
}

function pinGuncelle() {
  const dots = document.querySelectorAll('.pin-dot');
  dots.forEach((d, i) => {
    d.className = 'pin-dot' + (i < pin.length ? ' filled' : '');
  });
}

async function pinTus(t) {
  document.getElementById('loginError').textContent = '';
  if (t === 'C') { pin = ''; pinGuncelle(); return; }
  if (t === '⌫') { pin = pin.slice(0,-1); pinGuncelle(); return; }
  if (pin.length >= 4) return;
  pin += t;
  pinGuncelle();
  if (pin.length === 4) {
    try {
      const res = await fetch(API + '/api/garson/pin-giris', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({pin_kodu: pin})
      });
      const data = await res.json();
      if (data.token) {
        token = data.token;
        kullanici = data.personel;
        girisBasarili();
      } else {
        document.getElementById('loginError').textContent = data.hata || 'Geçersiz PIN';
        pin = ''; pinGuncelle();
      }
    } catch(e) {
      document.getElementById('loginError').textContent = 'Bağlantı hatası';
      pin = ''; pinGuncelle();
    }
  }
}

function girisBasarili() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('appScreen').classList.add('active');
  document.getElementById('headerUser').textContent = kullanici.ad + ' ' + kullanici.soyad;
  masalariYukle();
  menuYukle();
}

function cikisYap() {
  token = null; kullanici = null; pin = ''; sepet = [];
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('appScreen').classList.remove('active');
  document.getElementById('sepetBar').classList.add('hidden');
  pinGuncelle();
}

// ===== API =====
async function apiFetch(url, opts = {}) {
  opts.headers = { ...opts.headers, 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };
  const res = await fetch(API + url, opts);
  if (res.status === 401) { cikisYap(); toast('Oturum süresi doldu', true); return null; }
  return res.json();
}

// ===== MASALAR =====
async function masalariYukle() {
  const data = await apiFetch('/api/garson/masalar');
  if (!data) return;
  masalar = data;
  masalariCiz();
}

function masalariCiz() {
  const bolumler = {};
  masalar.forEach(m => {
    if (sadeceAcik && m.durum !== 'dolu') return;
    if (!bolumler[m.bolum_adi]) bolumler[m.bolum_adi] = [];
    bolumler[m.bolum_adi].push(m);
  });
  
  let html = '';

  if (!seciliBolum && !sadeceAcik) {
    // Bölüm Seçim Ekranı
    document.getElementById('headerTitle').textContent = 'Bölüm Seçiniz';
    html += '<div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:10px;">';
    for (const [bolum, masaList] of Object.entries(bolumler)) {
      html += '<div style="background:var(--surface); padding:24px 16px; border-radius:var(--radius); text-align:center; border:1px solid var(--surface2); cursor:pointer; transition:all .2s;" onclick="bolumSec(\\''+bolum+'\\')" onactive="this.style.transform=\\'scale(0.95)\\'">';
      html += '<div style="font-size:18px; font-weight:800; margin-bottom:8px;">'+bolum+'</div>';
      html += '<div style="font-size:13px; color:var(--text3); background:var(--bg); padding:4px 8px; border-radius:20px; display:inline-block;">'+masaList.length+' Masa</div>';
      html += '</div>';
    }
    html += '</div>';
  } else {
    // Masa Grid Ekranı
    if (!sadeceAcik) {
      document.getElementById('headerTitle').textContent = seciliBolum;
      html += '<div style="display:flex; align-items:center; margin-bottom:16px; gap:12px;">';
      html += '<button onclick="bolumGeri()" style="width:40px; height:40px; border-radius:var(--radius-sm); background:var(--surface2); border:none; color:var(--text); font-size:20px; cursor:pointer; display:flex; align-items:center; justify-content:center;">←</button>';
      html += '<span style="font-weight:800;font-size:18px;">'+seciliBolum+'</span>';
      html += '</div>';
    } else {
      document.getElementById('headerTitle').textContent = 'Açık Masalar';
    }
    
    for (const [bolum, masaList] of Object.entries(bolumler)) {
      if (seciliBolum && bolum !== seciliBolum && !sadeceAcik) continue;
      
      if (sadeceAcik) html += '<div class="section-title">' + bolum + '</div>';
      
      html += '<div class="masa-grid">';
      masaList.forEach(m => {
        const cls = m.durum === 'dolu' ? 'dolu' : 'bos';
        const tutar = m.toplam_tutar ? '<div class="masa-tutar">₺' + Number(m.toplam_tutar).toFixed(0) + '</div>' : '<div class="masa-tutar">Boş</div>';
        html += '<div class="masa-card '+cls+'" onclick="masaSec('+m.id+',\\''+m.numara+'\\','+(m.hesap_id||'null')+')"><div class="masa-badge"></div><div class="masa-no">'+m.numara+'</div>'+tutar+'</div>';
      });
      html += '</div>';
    }
  }

  if (html === '') html = '<div style="text-align:center; padding:40px; color:var(--text3); font-weight:500;">Gösterilecek masa yok.</div>';
  document.getElementById('pageMasalar').innerHTML = html;
}

function bolumSec(b) {
  seciliBolum = b;
  masalariCiz();
}

function bolumGeri() {
  seciliBolum = null;
  masalariCiz();
}

// ===== MENÜ =====
async function menuYukle() {
  const data = await apiFetch('/api/garson/menu');
  if (!data) return;
  menu = data;
}

async function masaSec(masaId, masaNo, hesapId) {
  aktifMasa = { id: masaId, numara: masaNo, hesap_id: hesapId };
  
  if (hesapId) {
    document.getElementById('headerTitle').textContent = 'Masa ' + masaNo;
    document.getElementById('pageMasaDetay').innerHTML = '<div class="center-loader"><div class="spinner"></div></div>';
    sayfaGit('masaDetay');
    await masaDetayCiz(masaId);
  } else {
    document.getElementById('headerTitle').textContent = 'Masa ' + masaNo;
    sepet = [];
    sepetGuncelle();
    siparisEkraniCiz();
    sayfaGit('siparis');
  }
}

async function masaDetayCiz(masaId) {
  const res = await apiFetch('/api/garson/masa/' + masaId);
  if (!res || !res.hesap) {
    masalaraGeri();
    return;
  }
  
  const { hesap, siparisler } = res;
  
  let html = '<div class="siparis-header"><button class="back" onclick="masalaraGeri()">←</button><span style="font-weight:800;font-size:18px">Hesap Özeti</span></div>';
  
  html += '<div class="detay-kart">';
  html += '<div class="detay-row" style="margin-bottom:12px;"><span style="color:var(--text2); font-weight:600; font-size:14px;">Hesap No</span><span style="font-weight:700; font-size:14px;">#'+hesap.hesap_no+'</span></div>';
  html += '<div class="detay-row"><span style="color:var(--text2); font-weight:600;">Toplam Tutar</span><span style="font-weight:800; color:var(--brand-light); font-size:28px; letter-spacing:-1px;">₺'+Number(hesap.toplam_tutar).toFixed(0)+'</span></div>';
  html += '</div>';

  html += '<button class="btn-gonder" style="margin-bottom:24px; padding:16px; background:var(--surface2); color:var(--text); box-shadow:none; border:1px solid var(--surface3);" onclick="siparisEkleyeGec()">+ Yeni Sipariş Ekle</button>';

  if (siparisler && siparisler.length > 0) {
    html += '<div class="section-title" style="margin-bottom:16px;">AÇIK SİPARİŞLER</div>';
    html += '<div class="acik-siparisler">';
    siparisler.forEach(s => {
      let iptalClass = s.durum === 'iptal' ? 'text-decoration: line-through; opacity: 0.4;' : '';
      let durumRenk = s.durum === 'bekliyor' ? 'var(--warning)' : (s.durum === 'hazir' ? 'var(--success)' : 'var(--text3)');
      let ikramEtiketi = s.ikram ? '<span style="background:var(--brand); color:white; padding:2px 6px; border-radius:6px; font-size:10px; font-weight:800; margin-left:8px;">İKRAM</span>' : '';
      
      html += '<div class="siparis-row" style="'+iptalClass+'">';
      html += '<div style="flex:1">';
      html += '<div style="font-weight:700; font-size:15px; margin-bottom:4px;">'+s.miktar+'<span style="color:var(--text3)">x</span> '+s.urun_adi+ikramEtiketi+'</div>';
      if (s.notlar) html += '<div style="font-size:12px; font-weight:600; color:var(--warning); margin-bottom:8px;">Not: '+s.notlar+'</div>';
      
      if (s.durum !== 'iptal') {
         html += '<div style="display:flex; gap:8px; margin-top:8px;">';
         html += '<button class="btn-ikram '+(s.ikram?'aktif':'')+'" onclick="siparisIkramDurumu('+s.id+', '+(s.ikram?'false':'true')+')">🎁 İkram</button>';
         html += '<button class="btn-ikram" style="color:var(--danger);" onclick="siparisIptalEkrani('+s.id+', \\''+s.urun_adi.replace(/'/g,"\\\\'")+'\\')">İptal</button>';
         html += '</div>';
      }
      
      html += '</div>';
      html += '<div style="text-align:right;">';
      html += '<div style="font-weight:800; font-size:15px; '+(s.ikram?'text-decoration:line-through;color:var(--text3)':'color:var(--text)')+'">₺'+s.toplam_fiyat+'</div>';
      html += '<div style="font-size:11px; color:'+durumRenk+'; text-transform:uppercase; font-weight:800; letter-spacing:1px; margin-top:6px;">'+s.durum+'</div>';
      html += '</div>';
      html += '</div>';
    });
    html += '</div>';
  } else {
    html += '<div style="text-align:center; padding:30px; color:var(--text3); font-weight:500;">Açık sipariş kalemi yok</div>';
  }
  
  document.getElementById('pageMasaDetay').innerHTML = html;
}

function siparisEkleyeGec() {
  document.getElementById('headerTitle').textContent = 'Masa ' + aktifMasa.numara;
  sepet = [];
  sepetGuncelle();
  siparisEkraniCiz();
  sayfaGit('siparis');
}

function siparisEkraniCiz() {
  if (!menu.kategoriler.length) return;
  if (!aktifKategori) aktifKategori = menu.kategoriler[0].id;
  
  const geriFonksiyon = aktifMasa.hesap_id ? "sayfaGit('masaDetay'); document.getElementById('headerTitle').textContent='Masa '+aktifMasa.numara;" : "masalaraGeri()";
  
  let html = '<div class="siparis-header"><button class="back" onclick="'+geriFonksiyon+'">←</button><span style="font-weight:800;font-size:18px">Kategoriler</span></div>';
  
  html += '<div class="kat-tabs">';
  menu.kategoriler.forEach(k => {
    const cls = k.id === aktifKategori ? 'active' : '';
    html += '<button class="kat-tab '+cls+'" onclick="kategoriSec('+k.id+')">'+k.ad+'</button>';
  });
  html += '</div>';
  
  const urunler = menu.urunler.filter(u => u.kategori_id === aktifKategori);
  html += '<div class="urun-grid">';
  urunler.forEach(u => {
    html += '<div class="urun-card" onclick="sepeteEkle('+u.id+',\\''+u.ad.replace(/'/g,"\\\\'")+'\\',' +u.fiyat+')"><div class="urun-ad">'+u.ad+'</div><div class="urun-fiyat">₺'+Number(u.fiyat).toFixed(0)+'</div></div>';
  });
  html += '</div>';
  
  document.getElementById('pageSiparis').innerHTML = html;
}

function kategoriSec(id) {
  aktifKategori = id;
  siparisEkraniCiz();
}

function masalaraGeri() {
  sayfaGit('masalar');
  document.getElementById('headerTitle').textContent = 'Masalar';
  aktifMasa = null;
  masalariYukle();
}

// ===== SEPET & NOTLAR =====
function sepeteEkle(urunId, ad, fiyat) {
  const mevcut = sepet.find(s => s.urun_id === urunId && !s.notlar && !s.ikram);
  if (mevcut) { 
    mevcut.miktar++; 
  } else { 
    sepet.push({ id: Math.random().toString(36).substring(7), urun_id: urunId, ad, fiyat, miktar: 1, notlar: '', ikram: false }); 
  }
  sepetGuncelle();
  
  const bar = document.getElementById('sepetBar');
  bar.classList.remove('haptic-anim');
  void bar.offsetWidth; // trigger reflow
  bar.classList.add('haptic-anim');
  
  toast(ad + ' eklendi');
}

function sepetGuncelle() {
  const adet = sepet.reduce((a,s) => a + s.miktar, 0);
  const tutar = sepet.reduce((a,s) => a + (s.ikram ? 0 : s.fiyat * s.miktar), 0);
  document.getElementById('sepetAdet').textContent = adet;
  document.getElementById('sepetTutar').textContent = '₺' + tutar.toFixed(0);
  if (adet > 0) {
    document.getElementById('sepetBar').classList.remove('hidden');
  } else {
    document.getElementById('sepetBar').classList.add('hidden');
    sepetModalKapat();
  }
}

function sepetNotGuncelle(inputEl, id) {
  const notlar = inputEl.value;
  const idx = sepet.findIndex(s => s.id === id);
  if (idx === -1) return;
  const kalem = sepet[idx];
  if (kalem.miktar > 1 && notlar.trim() !== (kalem.notlar || '').trim()) {
    kalem.miktar--;
    const yeniKalem = { ...kalem, id: Math.random().toString(36).substring(7), miktar: 1, notlar };
    sepet.splice(idx + 1, 0, yeniKalem);
    sepetGuncelle();
    sepetListeCiz();
    return;
  }
  kalem.notlar = notlar;
}

function sepetModalAc() {
  document.getElementById('sepetModalBg').classList.add('active');
  setTimeout(() => document.getElementById('sepetModal').classList.add('active'), 10);
  sepetListeCiz();
}

function sepetModalKapat() {
  document.getElementById('sepetModal').classList.remove('active');
  setTimeout(() => document.getElementById('sepetModalBg').classList.remove('active'), 300);
}

function sepetListeCiz() {
  let html = '';
  sepet.forEach((s) => {
    let ikramEtiketi = s.ikram ? '<span style="background:var(--brand); color:white; padding:2px 6px; border-radius:6px; font-size:10px; margin-left:8px; font-weight:800;">İKRAM</span>' : '';
    let fiyatMetni = s.ikram ? '<span style="text-decoration:line-through;color:var(--text3)">₺'+(s.fiyat*s.miktar).toFixed(0)+'</span>' : '₺'+(s.fiyat*s.miktar).toFixed(0);
    
    html += '<div class="sepet-item">';
    html += '  <div class="sepet-item-header">';
    html += '    <div class="sepet-item-ad">'+s.ad+ikramEtiketi+'</div>';
    html += '    <div class="sepet-item-fiyat">'+fiyatMetni+'</div>';
    html += '  </div>';
    html += '  <div class="sepet-actions">';
    html += '    <div class="sepet-miktar">';
    html += '      <button onclick="sepetMiktar(\\''+s.id+'\\',-1)">−</button>';
    html += '      <span>'+s.miktar+'</span>';
    html += '      <button onclick="sepetMiktar(\\''+s.id+'\\',1)">+</button>';
    html += '    </div>';
    html += '    <input class="not-input" id="not_input_'+s.id+'" placeholder="Örn: Acısız" value="'+(s.notlar||'')+'" onchange="sepetNotGuncelle(this, \\''+s.id+'\\')">';
    html += '    <button class="btn-ikram '+(s.ikram?'aktif':'')+'" style="margin-left:0;" onclick="sepetIkramTetikle(\\''+s.id+'\\')">🎁</button>';
    html += '  </div>';
    html += '</div>';
  });
  if (!sepet.length) html = '<div style="text-align:center;color:var(--text3);padding:40px;font-weight:600;">Sepet boş</div>';
  document.getElementById('sepetListe').innerHTML = html;
}

function sepetIkramTetikle(id) {
  const idx = sepet.findIndex(s => s.id === id);
  if (idx === -1) return;
  const kalem = sepet[idx];
  if (kalem.miktar > 1) {
    kalem.miktar--;
    const yeniKalem = { ...kalem, id: Math.random().toString(36).substring(7), miktar: 1, ikram: !kalem.ikram };
    sepet.splice(idx + 1, 0, yeniKalem);
  } else {
    kalem.ikram = !kalem.ikram;
  }
  sepetGuncelle();
  sepetListeCiz();
}

function sepetMiktar(id, delta) {
  const idx = sepet.findIndex(s => s.id === id);
  if (idx === -1) return;
  sepet[idx].miktar += delta;
  if (sepet[idx].miktar <= 0) sepet.splice(idx, 1);
  sepetGuncelle();
  sepetListeCiz();
}

async function siparisGonder() {
  if (!sepet.length || !aktifMasa) return;
  const btn = document.getElementById('btnGonder');
  btn.disabled = true; btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;border-top-color:white;"></div> Gönderiliyor...';
  try {
    const res = await apiFetch('/api/garson/siparis', {
      method: 'POST',
      body: JSON.stringify({ masa_id: aktifMasa.id, siparisler: sepet.map(s => ({ urun_id: s.urun_id, miktar: s.miktar, notlar: s.notlar, ikram: s.ikram })) })
    });
    if (res && res.basarili) {
      toast('Sipariş mutfağa gönderildi! ✓');
      sepet = [];
      sepetGuncelle();
      
      aktifMasa.hesap_id = res.hesap_id;
      masaSec(aktifMasa.id, aktifMasa.numara, res.hesap_id);
    } else {
      toast(res?.hata || 'Hata oluştu', true);
    }
  } catch(e) {
    toast('Bağlantı hatası', true);
  }
  btn.disabled = false; btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg> Mutfağa Gönder';
}

async function siparisIptalEkrani(siparisId, urunAdi) {
  if (!confirm(urunAdi + ' siparişini iptal etmek istediğinize emin misiniz?')) return;
  const iptalNedeni = prompt('İptal Nedeni (İsteğe Bağlı):');
  if (iptalNedeni === null) return;
  try {
    const res = await apiFetch('/api/garson/siparis-iptal', {
      method: 'POST',
      body: JSON.stringify({ siparis_id: siparisId, iptal_nedeni: iptalNedeni })
    });
    if (res && res.basarili) {
      toast('Sipariş iptal edildi ✓');
      masaDetayCiz(aktifMasa.id);
    } else {
      toast(res?.hata || 'İptal edilemedi', true);
    }
  } catch(e) {
    toast('Bağlantı hatası', true);
  }
}

async function siparisIkramDurumu(siparisId, yeniDurum) {
  try {
    const res = await apiFetch('/api/garson/siparis-ikram', {
      method: 'POST',
      body: JSON.stringify({ siparis_id: siparisId, ikram: yeniDurum })
    });
    if (res && res.basarili) {
      toast('İkram durumu güncellendi ✓');
      masaDetayCiz(aktifMasa.id);
    } else {
      toast(res?.hata || 'Güncellenemedi', true);
    }
  } catch(e) {
    toast('Bağlantı hatası', true);
  }
}

// ===== NAVİGASYON =====
function sayfaGit(sayfa) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  
  if (sayfa === 'masalar' || sayfa === 'acikMasalar') {
    sadeceAcik = (sayfa === 'acikMasalar');
    if (sadeceAcik) seciliBolum = null;
    document.getElementById('pageMasalar').classList.add('active');
    document.getElementById(sayfa === 'masalar' ? 'navMasalar' : 'navAcikMasalar').classList.add('active');
    masalariCiz();
  } else if (sayfa === 'siparis') {
    document.getElementById('pageSiparis').classList.add('active');
  } else if (sayfa === 'masaDetay') {
    document.getElementById('pageMasaDetay').classList.add('active');
  }
}

// ===== TOAST =====
function toast(msg, isError) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (isError ? ' error' : '');
  setTimeout(() => t.className = 'toast', 2500);
}

// INIT
pinPadOlustur();
</script>
</body>
</html>`;
}
