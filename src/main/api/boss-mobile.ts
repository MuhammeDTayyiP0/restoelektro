// =====================================================
// Patron (Boss) Mobil + Masaüstü İzleme Paneli
// Salt okunur komuta merkezi — PIN yakınlaşması kapalı
// =====================================================

export function bossMobilHTML(): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="format-detection" content="telephone=no">
  <meta name="theme-color" content="#0B0A08">
  <title>ETİBOL POS — Patron Paneli</title>
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <style>
    :root {
      --bg: #0B0A08;
      --surf: #171410;
      --elev: #1E1A16;
      --ink: #241F1A;
      --line: #322C26;
      --line2: #4A433A;
      --clay: #9A5F48;
      --clay2: #C08F7A;
      --green: #10B981;
      --amber: #F59E0B;
      --red: #EF4444;
      --text: #F4EFE8;
      --mute: #9C9284;
      --dim: #7A7166;
      --side: 232px;
      --navh: 62px;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    html, body {
      height: 100%;
      background: var(--bg);
      color: var(--text);
      font-family: "Segoe UI", Tahoma, Arial, sans-serif;
      -webkit-text-size-adjust: 100%;
      text-size-adjust: 100%;
      touch-action: manipulation;
      -ms-touch-action: manipulation;
      overscroll-behavior: none;
      user-select: none;
      -webkit-user-select: none;
    }
    button, input, select { font-family: inherit; font-size: 16px; }
    button { cursor: pointer; color: inherit; }
    .hidden { display: none !important; }

    /* ===== LOGIN / PIN — yakınlaşma yok ===== */
    #login {
      min-height: 100dvh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px 16px calc(24px + env(safe-area-inset-bottom));
      background:
        radial-gradient(900px 420px at 50% -10%, rgba(154,95,72,.18), transparent 60%),
        var(--bg);
    }
    .login-card {
      width: 100%;
      max-width: 380px;
      background: var(--surf);
      border: 1px solid var(--line);
      border-radius: 24px;
      padding: 28px 24px 22px;
      text-align: center;
    }
    .login-kicker {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 11px; font-weight: 700; letter-spacing: .7px; text-transform: uppercase;
      color: var(--clay2); margin-bottom: 14px;
    }
    .login-title { font-size: 24px; font-weight: 700; letter-spacing: -.4px; }
    .login-sub { color: var(--mute); font-size: 13px; margin: 8px 0 22px; line-height: 1.45; }
    .pin-dots { display: flex; justify-content: center; gap: 14px; margin-bottom: 22px; }
    .pin-dot {
      width: 14px; height: 14px; border-radius: 50%;
      border: 2px solid var(--line2); background: transparent; transition: .12s;
    }
    .pin-dot.on { background: var(--clay); border-color: var(--clay); transform: scale(1.08); }
    #numpad {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      touch-action: none !important;
      -ms-touch-action: none !important;
    }
    #numpad * { touch-action: none !important; }
    #numpad button {
      height: 68px;
      border-radius: 16px;
      border: 1px solid var(--line);
      background: var(--elev);
      color: var(--text);
      font-size: 22px;
      font-weight: 700;
      touch-action: none !important;
    }
    #numpad button.down, #numpad button:active { background: var(--clay); color: #fff; border-color: var(--clay); }
    #numpad button.fn { font-size: 15px; font-weight: 600; color: var(--mute); background: transparent; }
    .login-err { min-height: 20px; margin-top: 14px; color: var(--red); font-size: 13px; font-weight: 600; }
    .login-hint { margin-top: 14px; font-size: 12px; color: var(--dim); }
    @media (max-width: 959px) { .login-hint { display: none; } }

    /* ===== APP SHELL ===== */
    #app { display: none; height: 100dvh; }
    #app.on { display: flex; }
    .sidebar {
      display: none;
      width: var(--side);
      background: #12110E;
      border-right: 1px solid var(--line);
      flex-direction: column;
      padding: 18px 12px 12px;
    }
    .brand { display: flex; align-items: center; gap: 10px; padding: 4px 8px 18px; }
    .brand-mark {
      width: 38px; height: 38px; border-radius: 12px;
      background: var(--clay); color: #fff; font-weight: 800;
      display: flex; align-items: center; justify-content: center; font-size: 13px;
    }
    .brand b { display: block; font-size: 13px; }
    .brand span { font-size: 11px; color: var(--dim); }
    .side-nav { display: flex; flex-direction: column; gap: 4px; flex: 1; }
    .side-nav button, .nav button {
      display: flex; align-items: center; gap: 10px;
      background: none; border: 0; color: var(--dim);
      padding: 11px 12px; border-radius: 12px; font-size: 13px; font-weight: 700; text-align: left;
    }
    .side-nav button.on, .nav button.on { background: var(--ink); color: var(--text); }
    .side-nav button.on { border: 1px solid rgba(154,95,72,.35); color: #fff; }
    .side-foot { border-top: 1px solid var(--line); padding-top: 12px; }
    .side-foot .who { font-size: 12px; color: var(--mute); padding: 0 8px 8px; }
    .side-foot .who b { display: block; color: var(--text); font-size: 13px; }
    .btn-out {
      width: 100%; height: 40px; border-radius: 10px; border: 1px solid #4A2222;
      background: #2A1414; color: #FCA5A5; font-size: 13px; font-weight: 700;
    }
    .col { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .top {
      display: flex; align-items: center; justify-content: space-between; gap: 10px 14px;
      flex-wrap: wrap;
      padding: max(env(safe-area-inset-top), 10px) 16px 10px;
      background: rgba(18,17,14,.94);
      border-bottom: 1px solid var(--line);
    }
    .top-left { min-width: 0; flex: 1; }
    .top h1 { font-size: 17px; font-weight: 800; letter-spacing: -.2px; }
    .top .meta { display: flex; align-items: center; gap: 10px; font-size: 12px; color: var(--mute); }
    .top-tools { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .seg {
      display: inline-flex; align-items: stretch;
      background: var(--elev); border: 1px solid var(--line);
      border-radius: 11px; padding: 3px; gap: 2px;
    }
    .seg button {
      height: 32px; padding: 0 11px; border: 0; background: transparent;
      border-radius: 8px; font-size: 12px; font-weight: 700; color: var(--mute);
      white-space: nowrap;
    }
    .seg button.on { background: var(--clay); color: #fff; }
    .donem-yazi { font-size: 11px; color: var(--dim); font-variant-numeric: tabular-nums; white-space: nowrap; }
    .donem-ozel {
      display: none; width: 100%; gap: 8px;
      padding: 0 0 4px;
    }
    .donem-ozel.on { display: grid; grid-template-columns: 1fr 1fr; }
    .donem-ozel label { display: block; font-size: 11px; color: var(--mute); margin-bottom: 4px; font-weight: 700; }
    .donem-ozel input {
      width: 100%; height: 40px; border-radius: 10px; border: 1px solid var(--line);
      background: var(--elev); color: var(--text); padding: 0 10px; font-size: 16px;
    }
    .live { width: 8px; height: 8px; border-radius: 50%; background: var(--green); box-shadow: 0 0 8px var(--green); }
    .live.off { background: var(--dim); box-shadow: none; }
    .icon-btn {
      width: 40px; height: 40px; border-radius: 12px; border: 1px solid var(--line);
      background: var(--elev); color: var(--mute);
    }
    .scroll {
      flex: 1; overflow: auto; -webkit-overflow-scrolling: touch;
      padding: 14px 14px calc(18px + var(--navh) + env(safe-area-inset-bottom));
    }
    .nav {
      position: fixed; left: 0; right: 0; bottom: 0; z-index: 40;
      display: grid; grid-template-columns: repeat(5, 1fr);
      background: #12110E; border-top: 1px solid var(--line);
      padding: 4px 2px calc(4px + env(safe-area-inset-bottom));
    }
    .nav button { flex-direction: column; gap: 2px; font-size: 10px; padding: 6px 0; min-height: 52px; justify-content: center; }
    .nav button.on { background: none; color: var(--text); }
    .nav button.on svg { color: var(--clay2); }

    @media (min-width: 960px) {
      .sidebar { display: flex; }
      .nav { display: none; }
      .scroll { padding: 20px 22px 28px; }
      .top h1 { font-size: 20px; }
      .donem-ozel { max-width: 420px; margin-left: auto; }
    }
    @media (max-width: 959px) {
      .top-tools { width: 100%; }
      .seg { flex: 1; width: 100%; }
      .seg button { flex: 1; padding: 0 6px; }
      .donem-yazi { display: none; }
    }

    /* chips / cards */
    .chips { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px; }
    .chip {
      height: 34px; padding: 0 12px; border-radius: 999px; border: 1px solid var(--line);
      background: var(--surf); color: var(--mute); font-size: 12px; font-weight: 700;
    }
    .chip.on { background: #3D261F; border-color: var(--clay); color: #fff; }
    .dash { display: grid; gap: 12px; grid-template-columns: 1fr; }
    .kpis { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .card {
      background: var(--surf); border: 1px solid var(--line); border-radius: 16px; padding: 14px;
      min-width: 0;
    }
    .card h3 {
      font-size: 11px; font-weight: 800; letter-spacing: .55px; text-transform: uppercase;
      color: var(--mute); margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; gap: 8px;
    }
    .card h3 em { font-style: normal; color: var(--dim); font-weight: 600; text-transform: none; letter-spacing: 0; }
    .kpi .lbl { font-size: 11px; color: var(--mute); font-weight: 700; text-transform: uppercase; letter-spacing: .4px; }
    .kpi .val { font-size: 22px; font-weight: 800; font-variant-numeric: tabular-nums; margin-top: 4px; letter-spacing: -.4px; }
    .kpi .sub { font-size: 12px; color: var(--dim); margin-top: 3px; }
    .kpi.hero { grid-column: span 2; background: linear-gradient(165deg, #2A201C, #171410); border-color: #3D322C; }
    .kpi.hero .val { font-size: 30px; color: var(--green); }
    .warn { font-size: 12px; color: var(--amber); background: #2A1C0C; border: 1px solid #5C3D12; border-radius: 10px; padding: 8px 10px; margin-bottom: 10px; }

    .masa-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(76px, 1fr)); gap: 8px; }
    .tile {
      aspect-ratio: 1; border-radius: 12px; border: 1px solid var(--line); background: var(--elev);
      display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 6px; text-align: center;
    }
    .tile b { font-size: 13px; }
    .tile span { font-size: 10px; color: var(--dim); margin-top: 2px; font-variant-numeric: tabular-nums; }
    .tile.dolu { border-color: rgba(245,158,11,.55); background: #2A1F12; }
    .tile.dolu span { color: var(--amber); font-weight: 700; }
    .tile.rez { border-color: #5A5248; }
    .tile.bos { opacity: .7; }

    .row {
      display: flex; align-items: center; justify-content: space-between; gap: 10px;
      padding: 9px 0; border-bottom: 1px solid #2A2420;
    }
    .row:last-child { border-bottom: 0; }
    .row .ad { font-size: 13px; font-weight: 700; }
    .row .alt { font-size: 11px; color: var(--dim); margin-top: 2px; }
    .row .amt { font-variant-numeric: tabular-nums; font-size: 13px; font-weight: 800; white-space: nowrap; }
    .empty { color: var(--dim); font-size: 13px; padding: 18px 6px; text-align: center; }
    .barline { display: flex; align-items: center; gap: 8px; font-size: 12px; margin: 6px 0; }
    .barline .nm { width: 92px; color: var(--mute); flex-shrink: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .track { flex: 1; height: 8px; background: #221C18; border-radius: 99px; overflow: hidden; }
    .fill { height: 100%; border-radius: 99px; background: var(--clay); }
    .barline b { width: 72px; text-align: right; font-variant-numeric: tabular-nums; }

    .chart { width: 100%; height: 168px; display: block; }
    .search {
      width: 100%; height: 42px; border-radius: 12px; border: 1px solid var(--line);
      background: var(--elev); color: var(--text); padding: 0 12px; font-size: 16px; margin-bottom: 10px;
    }
    table.grid { width: 100%; border-collapse: collapse; font-size: 13px; }
    table.grid th { text-align: left; color: var(--dim); font-size: 11px; text-transform: uppercase; letter-spacing: .4px; padding: 8px 6px; border-bottom: 1px solid var(--line); }
    table.grid td { padding: 9px 6px; border-bottom: 1px solid #2A2420; font-variant-numeric: tabular-nums; }
    table.grid tr:last-child td { border-bottom: 0; }
    table.grid td.r, table.grid th.r { text-align: right; }

    @media (min-width: 960px) {
      .dash { grid-template-columns: repeat(12, 1fr); align-items: start; }
      .kpis { grid-column: span 12; grid-template-columns: 1.4fr repeat(5, 1fr); }
      .kpi.hero { grid-column: auto; }
      .kpi.hero .val { font-size: 26px; }
      .span-12 { grid-column: span 12; }
      .span-8 { grid-column: span 8; }
      .span-7 { grid-column: span 7; }
      .span-6 { grid-column: span 6; }
      .span-5 { grid-column: span 5; }
      .span-4 { grid-column: span 4; }
      .span-3 { grid-column: span 3; }
      .masa-grid { grid-template-columns: repeat(auto-fill, minmax(92px, 1fr)); }
    }
    @media (min-width: 1280px) {
      .kpis { grid-template-columns: 1.6fr repeat(5, 1fr); }
    }

    /* drawer */
    #drawer { display: none; }
    #drawer.on { display: block; }
    .drawer-bg { position: fixed; inset: 0; background: rgba(0,0,0,.55); z-index: 80; }
    .drawer-panel {
      position: fixed; z-index: 81; background: var(--surf); overflow: auto;
      left: 0; right: 0; bottom: 0; max-height: 88dvh;
      border-radius: 20px 20px 0 0; border-top: 1px solid var(--line);
      padding: 12px 16px calc(20px + env(safe-area-inset-bottom));
    }
    .grab { width: 42px; height: 4px; background: var(--line2); border-radius: 99px; margin: 4px auto 12px; }
    @media (min-width: 960px) {
      .drawer-panel {
        top: 0; right: 0; left: auto; bottom: 0; width: 440px; max-height: none;
        border-radius: 0; border-top: 0; border-left: 1px solid var(--line);
        padding: 22px 22px 28px;
      }
      .grab { display: none; }
    }
    .tag { display: inline-block; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 6px; margin-left: 6px; }
    .tag.ikram { background: #3D261F; color: #E8C4B4; }
    .toast {
      position: fixed; left: 50%; bottom: calc(78px + env(safe-area-inset-bottom));
      transform: translateX(-50%) translateY(16px); opacity: 0;
      background: #241F1A; border: 1px solid var(--line); padding: 10px 16px; border-radius: 12px;
      font-size: 13px; font-weight: 600; z-index: 90; pointer-events: none; transition: .2s;
    }
    .toast.on { opacity: 1; transform: translateX(-50%) translateY(0); }
    @media (min-width: 960px) { .toast { bottom: 24px; } }
  </style>
</head>
<body>
  <div id="login">
    <div class="login-card">
      <div class="login-kicker">Salt okunur · Yönetici</div>
      <div class="login-title">Patron paneli</div>
      <div class="login-sub">Yalnızca yönetici veya müdür PIN kodu. Çift dokunuş yakınlaştırmaz.</div>
      <div class="pin-dots">
        <div class="pin-dot" id="d1"></div>
        <div class="pin-dot" id="d2"></div>
        <div class="pin-dot" id="d3"></div>
        <div class="pin-dot" id="d4"></div>
      </div>
      <div id="numpad">
        <button type="button" data-k="1">1</button>
        <button type="button" data-k="2">2</button>
        <button type="button" data-k="3">3</button>
        <button type="button" data-k="4">4</button>
        <button type="button" data-k="5">5</button>
        <button type="button" data-k="6">6</button>
        <button type="button" data-k="7">7</button>
        <button type="button" data-k="8">8</button>
        <button type="button" data-k="9">9</button>
        <button type="button" class="fn" data-k="C">Temizle</button>
        <button type="button" data-k="0">0</button>
        <button type="button" class="fn" data-k="B">Sil</button>
      </div>
      <div class="login-err" id="loginErr"></div>
      <div class="login-hint">Bilgisayarda rakam tuşlarıyla da yazabilirsiniz</div>
    </div>
  </div>

  <div id="app">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">ER</div>
        <div><b>ETİBOL POS</b><span>Patron · v2.5.4</span></div>
      </div>
      <nav class="side-nav" id="sideNav"></nav>
      <div class="side-foot">
        <div class="who"><b id="whoAd">—</b><span id="whoRol">Yönetici</span></div>
        <button type="button" class="btn-out" data-act="cikis">Çıkış</button>
      </div>
    </aside>
    <div class="col">
      <header class="top">
        <div class="top-left">
          <h1 id="hdrTitle">Canlı özet</h1>
          <div class="meta"><span class="live" id="liveDot"></span><span id="hdrSub">—</span></div>
        </div>
        <div class="top-tools">
          <div class="seg" id="donemSeg" role="tablist" aria-label="Dönem">
            <button type="button" data-act="tarih" data-id="bugun">Bugün</button>
            <button type="button" data-act="tarih" data-id="dun">Dün</button>
            <button type="button" data-act="tarih" data-id="hafta">Hafta</button>
            <button type="button" data-act="tarih" data-id="ay">Ay</button>
            <button type="button" data-act="tarih" data-id="ozel">Özel</button>
          </div>
          <span class="donem-yazi" id="donemYazi"></span>
          <span id="saat">--:--</span>
          <button type="button" class="icon-btn" data-act="yenile" title="Yenile">↻</button>
        </div>
        <div class="donem-ozel" id="donemOzel">
          <div><label>Başlangıç</label><input type="date" id="d1in"></div>
          <div><label>Bitiş</label><input type="date" id="d2in"></div>
        </div>
      </header>
      <main class="scroll" id="main"></main>
    </div>
    <nav class="nav" id="botNav"></nav>
  </div>

  <div id="drawer">
    <div class="drawer-bg" data-act="kapat"></div>
    <aside class="drawer-panel" id="drawerBody"></aside>
  </div>
  <div class="toast" id="toast"></div>

<script src="/socket.io/socket.io.js"></script>
<script>
(function(){
  var API = location.origin;
  var token = localStorage.getItem('etibol_boss_token') || '';
  var kullanici = null;
  var isletme = 'ETİBOL POS';
  var pin = '';
  var pinKilit = false;
  var aktif = 'ozet';
  var tarihMod = 'bugun';
  var ozelBas = '';
  var ozelBit = '';
  var dahaSekme = 'stok';
  var paketDurum = 'acik';
  var stokFiltre = 'uyari';
  var urunArama = '';
  var raporSekme = 'urun';
  var masaBolum = '';
  var sadeceDolu = false;
  var timer = null;
  var sonCekim = '';

  var NAV = [
    { id: 'ozet', ad: 'Özet' },
    { id: 'masalar', ad: 'Masalar' },
    { id: 'rapor', ad: 'Rapor' },
    { id: 'kasa', ad: 'Kasa' },
    { id: 'daha', ad: 'Operasyon' }
  ];
  var ODEME = { nakit:'Nakit', kredi_karti:'Kart', yemek_karti:'Yemek kartı', acik_hesap:'Veresiye', veresiye:'Veresiye', cari:'Cari' };
  var ROL = { admin:'Yönetici', mudur:'Müdür', kasiyer:'Kasiyer', garson:'Garson', mutfak:'Mutfak' };
  var STOK = { tukendi:'Tükendi', kritik:'Kritik', dusuk:'Düşük', normal:'Normal' };
  var ICO = {
    ozet: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>',
    masalar: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 21h8M12 18v3"/></svg>',
    rapor: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19V5M4 19h16"/><path d="M8 16l3-5 3 3 5-8"/></svg>',
    kasa: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h.01M12 12h.01M18 12h.01"/></svg>',
    daha: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>'
  };

  function pad(n){ return (n<10?'0':'')+n; }
  function bugun(){ var d=new Date(); return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
  function dun(){ var d=new Date(); d.setDate(d.getDate()-1); return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
  function hafta(){ var d=new Date(); var day=d.getDay()||7; d.setDate(d.getDate()-day+1); return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
  function ay(){ var d=new Date(); return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-01'; }
  function aralik(){
    var b = bugun();
    if (tarihMod==='dun') return { baslangic: dun(), bitis: dun() };
    if (tarihMod==='hafta') return { baslangic: hafta(), bitis: b };
    if (tarihMod==='ay') return { baslangic: ay(), bitis: b };
    if (tarihMod==='ozel') return { baslangic: ozelBas||b, bitis: ozelBit||b };
    return { baslangic: b, bitis: b };
  }
  function qs(){ var a=aralik(); return '?baslangic='+encodeURIComponent(a.baslangic)+'&bitis='+encodeURIComponent(a.bitis); }
  function para(n){ return Number(n||0).toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2})+' ₺'; }
  function para0(n){ return Number(n||0).toLocaleString('tr-TR',{maximumFractionDigits:0})+' ₺'; }
  function esc(s){ return String(s==null?'':s).replace(/&/g,'&').replace(/</g,'<').replace(/>/g,'>').replace(/"/g,'"'); }
  function saatKisa(iso){
    if (!iso) return '';
    var d = new Date(String(iso).replace(' ','T'));
    if (isNaN(d.getTime())) { var t=String(iso); return t.length>=16?t.slice(11,16):t; }
    return pad(d.getHours())+':'+pad(d.getMinutes());
  }
  function toast(m){
    var el=document.getElementById('toast');
    el.textContent=m; el.classList.add('on');
    setTimeout(function(){ el.classList.remove('on'); }, 2200);
  }

  /* PIN — pointerdown, zoom yok, çift basışta çift karakter yok */
  function pinCiz(){
    for (var i=1;i<=4;i++) document.getElementById('d'+i).className='pin-dot'+(i<=pin.length?' on':'');
  }
  function pinTus(k){
    if (pinKilit) return;
    document.getElementById('loginErr').textContent='';
    if (k==='C'){ pin=''; pinCiz(); return; }
    if (k==='B'){ pin=pin.slice(0,-1); pinCiz(); return; }
    if (!k || pin.length>=4) return;
    pin += k;
    pinCiz();
    if (pin.length===4) pinGonder();
  }
  function numpadKur(){
    var pad = document.getElementById('numpad');
    function durdur(e){ e.preventDefault(); e.stopPropagation(); }
    pad.addEventListener('pointerdown', function(e){
      var b = e.target.closest ? e.target.closest('button') : null;
      if (!b) return;
      durdur(e);
      if (e.pointerType==='mouse' && e.button!==0) return;
      b.classList.add('down');
      try { if (b.setPointerCapture) b.setPointerCapture(e.pointerId); } catch(err){}
      pinTus(b.getAttribute('data-k'));
    }, { passive: false });
    function birak(e){
      var b = e.target.closest ? e.target.closest('button') : null;
      if (b) b.classList.remove('down');
    }
    pad.addEventListener('pointerup', birak);
    pad.addEventListener('pointercancel', function(){
      var list=pad.querySelectorAll('.down');
      for (var i=0;i<list.length;i++) list[i].classList.remove('down');
    });
    pad.addEventListener('click', durdur, true);
    pad.addEventListener('dblclick', durdur, true);
    pad.addEventListener('touchstart', durdur, { passive: false });
    pad.addEventListener('touchend', durdur, { passive: false });
    pad.addEventListener('gesturestart', durdur, { passive: false });
    if (!window.PointerEvent) {
      pad.addEventListener('touchstart', function(e){
        var b = e.target && e.target.closest ? e.target.closest('button') : e.target;
        if (!b || !b.getAttribute) return;
        durdur(e);
        pinTus(b.getAttribute('data-k'));
      }, { passive: false });
    }
    document.addEventListener('gesturestart', durdur, { passive: false });
    document.addEventListener('keydown', function(e){
      if (document.getElementById('app').classList.contains('on')) return;
      if (e.key>='0' && e.key<='9') { e.preventDefault(); pinTus(e.key); }
      else if (e.key==='Backspace') { e.preventDefault(); pinTus('B'); }
      else if (e.key==='Escape') { pinTus('C'); }
    });
  }

  async function pinGonder(){
    pinKilit = true;
    try {
      var res = await fetch(API+'/api/boss/pin-giris', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ pin_kodu: pin })
      });
      var data = await res.json();
      if (res.ok && data.token) {
        token = data.token;
        kullanici = data.personel;
        localStorage.setItem('etibol_boss_token', token);
        girisOk();
      } else {
        document.getElementById('loginErr').textContent = data.hata || 'Geçersiz PIN';
        pin=''; pinCiz();
      }
    } catch(e) {
      document.getElementById('loginErr').textContent = 'Bağlantı yok — POS açık mı?';
      pin=''; pinCiz();
    }
    pinKilit = false;
  }

  function girisOk(){
    document.getElementById('login').style.display='none';
    document.getElementById('app').classList.add('on');
    whoCiz();
    navCiz();
    donemCiz();
    bindDates();
    sayfa(aktif);
    if (timer) clearInterval(timer);
    timer = setInterval(function(){ if (aktif==='ozet' || aktif==='masalar') yenile(false); }, 12000);
  }
  function cikis(){
    token=''; kullanici=null; pin='';
    localStorage.removeItem('etibol_boss_token');
    document.getElementById('app').classList.remove('on');
    document.getElementById('login').style.display='flex';
    pinCiz();
    if (timer) { clearInterval(timer); timer=null; }
  }
  function whoCiz(){
    var ad = kullanici ? ((kullanici.ad||'')+' '+(kullanici.soyad||'')).trim() : '';
    document.getElementById('whoAd').textContent = ad || 'Yönetici';
    document.getElementById('whoRol').textContent = (kullanici && ROL[kullanici.rol]) ? ROL[kullanici.rol] : 'Oturum';
  }
  function navCiz(){
    var side='', bot='';
    NAV.forEach(function(n){
      var on = n.id===aktif ? ' on' : '';
      side += '<button type="button" class="'+on.trim()+'" data-act="sayfa" data-id="'+n.id+'">'+ICO[n.id]+' '+n.ad+'</button>';
      bot += '<button type="button" class="'+on.trim()+'" data-act="sayfa" data-id="'+n.id+'">'+ICO[n.id]+n.ad+'</button>';
    });
    document.getElementById('sideNav').innerHTML = side;
    document.getElementById('botNav').innerHTML = bot;
  }
  function sayfa(id){
    aktif = id;
    var bas = { ozet:'Canlı özet', masalar:'Masalar', rapor:'Raporlar', kasa:'Kasa vardiyası', daha:'Operasyon' };
    document.getElementById('hdrTitle').textContent = bas[id]||id;
    navCiz();
    yenile(true);
  }

  async function api(path){
    try {
      var res = await fetch(API+path, { headers: { Authorization: 'Bearer '+token } });
      if (res.status===401 || res.status===403) { cikis(); toast('Oturum kapandı'); return null; }
      document.getElementById('liveDot').classList.remove('off');
      return await res.json();
    } catch(e) {
      document.getElementById('liveDot').classList.add('off');
      toast('Bağlantı koptu');
      return null;
    }
  }

  function donemYaziFn(){
    var a = aralik();
    var aylar = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
    function tr(s){
      var p = String(s).split('-');
      if (p.length < 3) return s;
      return Number(p[2]) + ' ' + aylar[Number(p[1])-1];
    }
    if (a.baslangic === a.bitis) return tr(a.baslangic);
    return tr(a.baslangic) + ' – ' + tr(a.bitis);
  }
  function donemCiz(){
    var seg = document.getElementById('donemSeg');
    if (seg) {
      var btns = seg.querySelectorAll('button');
      for (var i=0;i<btns.length;i++) {
        btns[i].className = btns[i].getAttribute('data-id')===tarihMod ? 'on' : '';
      }
    }
    var ozel = document.getElementById('donemOzel');
    if (ozel) ozel.className = 'donem-ozel'+(tarihMod==='ozel'?' on':'');
    var y = document.getElementById('donemYazi');
    if (y) y.textContent = donemYaziFn();
    var a = document.getElementById('d1in'), b = document.getElementById('d2in');
    if (a) a.value = ozelBas || bugun();
    if (b) b.value = ozelBit || bugun();
  }

  function alanGrafik(satirlar){
    var w=640, h=168, l=8, r=8, t=12, b=28;
    var iw=w-l-r, ih=h-t-b;
    if (!satirlar || !satirlar.length) return '<div class="empty">Bu aralıkta ödenen hesap yok</div>';
    var max=1;
    satirlar.forEach(function(s){ var v=Number(s.tutar||0); if (v>max) max=v; });
    var pts=[], area=[];
    satirlar.forEach(function(s,i){
      var x = l + (satirlar.length===1 ? iw/2 : i*(iw/(satirlar.length-1)));
      var y = t + ih - (Number(s.tutar||0)/max)*ih;
      pts.push(x.toFixed(1)+','+y.toFixed(1));
      area.push(x.toFixed(1)+','+y.toFixed(1));
    });
    var first = l, last = l + iw;
    if (satirlar.length===1) { first = l+iw/2; last = first; }
    var d = 'M '+first+','+(t+ih)+' L '+area.join(' L ')+' L '+last+','+(t+ih)+' Z';
    var labels='';
    var step = satirlar.length>10 ? Math.ceil(satirlar.length/8) : 1;
    satirlar.forEach(function(s,i){
      if (i%step && i!==satirlar.length-1) return;
      var x = l + (satirlar.length===1 ? iw/2 : i*(iw/(satirlar.length-1)));
      var lbl = (typeof s.saat==='number') ? pad(s.saat) : String(s.saat||'');
      if (lbl.length>=10) lbl = lbl.slice(8,10)+'.'+lbl.slice(5,7);
      labels += '<text x="'+x.toFixed(1)+'" y="'+(h-8)+'" text-anchor="middle" fill="#7A7166" font-size="11">'+esc(lbl)+'</text>';
    });
    return '<svg class="chart" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none">'
      + '<defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#9A5F48" stop-opacity=".45"/><stop offset="100%" stop-color="#9A5F48" stop-opacity="0"/></linearGradient></defs>'
      + '<path d="'+d+'" fill="url(#g1)"/>'
      + '<polyline fill="none" stroke="#C08F7A" stroke-width="2.2" points="'+pts.join(' ')+'"/>'
      + labels + '</svg>';
  }

  async function cizOzet(){
    var p = await api('/api/boss/panel'+qs());
    if (!p) return;
    sonCekim = new Date().toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
    document.getElementById('hdrSub').textContent = (isletme||'ETİBOL POS')+' · '+sonCekim+' güncellendi';
    var o = p.ozet || {};
    var masalar = p.masalar || [];
    var dolu = masalar.filter(function(m){ return m.hesap_id; });

    var html = '<div class="dash">';
    html += '<div class="kpis">';
    html += kpi('Ciro','hero', para(o.toplam_ciro), 'Net kâr '+para(o.net_kar)+' · %'+(o.kar_marji||0));
    html += kpi('Açık masa','', String(o.acik_hesap||0), para0(o.acik_tutar)+' adisyon');
    html += kpi('Kapanan','', String(o.kapanan_hesap||0), 'Ort. '+para0(o.ortalama_hesap));
    html += kpi('Nakit','', para0(o.nakit_toplam), '');
    html += kpi('Kart','', para0(o.kart_toplam), '');
    html += kpi('İkram / iptal','', para0(o.ikram_tutar), 'İptal '+para0(o.iptal_tutar));
    html += '</div>';

    html += '<div class="card span-8"><h3>Satış akışı <em>'+(aralik().baslangic===aralik().bitis?'saatlik':'günlük')+'</em></h3>'+alanGrafik(p.saatlik)+'</div>';
    html += '<div class="card span-4"><h3>Ödeme</h3>';
    var od = p.odeme||[];
    if (!od.length) html += '<div class="empty">Ödeme yok</div>';
    od.forEach(function(x){
      html += bar(ODEME[x.odeme_tipi]||x.odeme_tipi, x.toplam_tutar, o.toplam_ciro, x.oran);
    });
    var v = p.kasa && p.kasa.vardiya;
    html += '<div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--line)">';
    if (v) html += '<div class="alt">Kasa '+esc(v.z_no||'açık')+' · beklenen nakit <b>'+para0(v.beklenen_nakit)+'</b></div>';
    else html += '<div class="alt">Açık vardiya yok</div>';
    html += '</div></div>';

    html += '<div class="card span-7"><h3>Açık masalar <em>'+dolu.length+' dolu / '+masalar.length+'</em></h3>';
    html += masaIzgara(masalar, true);
    html += '</div>';

    html += '<div class="card span-5"><h3>En çok satanlar</h3>';
    (p.urunler||[]).slice(0,8).forEach(function(u){
      html += '<div class="row"><div><div class="ad">'+esc(u.urun_adi)+'</div><div class="alt">'+esc(u.kategori_adi)+' · '+esc(u.satis_adedi)+' adet</div></div><div class="amt">'+para0(u.toplam_ciro)+'</div></div>';
    });
    if (!(p.urunler||[]).length) html += '<div class="empty">Satış yok</div>';
    html += '</div>';

    html += '<div class="card span-4"><h3>Kategori</h3>';
    (p.kategoriler||[]).forEach(function(k){ html += bar(k.kategori_adi, k.tutar, o.toplam_ciro); });
    if (!(p.kategoriler||[]).length) html += '<div class="empty">—</div>';
    html += '</div>';

    html += '<div class="card span-4"><h3>Personel</h3>';
    (p.personel||[]).forEach(function(x){
      if (!Number(x.toplam_satis) && !Number(x.hesap_sayisi)) return;
      html += '<div class="row"><div><div class="ad">'+esc(x.personel_adi)+'</div><div class="alt">'+(ROL[x.rol]||x.rol)+' · '+esc(x.hesap_sayisi)+' hesap</div></div><div class="amt">'+para0(x.toplam_satis)+'</div></div>';
    });
    html += '</div>';

    html += '<div class="card span-4"><h3>Stok uyarısı <em>'+(p.stokUyari||[]).length+'</em></h3>';
    (p.stokUyari||[]).forEach(function(s){
      html += '<div class="row"><div><div class="ad">'+esc(s.hammadde_adi)+'</div><div class="alt">'+(STOK[s.stok_durumu]||s.stok_durumu)+' · '+esc(s.mevcut_stok)+' '+esc(s.birim)+'</div></div></div>';
    });
    if (!(p.stokUyari||[]).length) html += '<div class="empty">Kritik stok yok</div>';
    html += '</div>';

    html += '<div class="card span-4"><h3>Paket / gel-al <em>'+(p.paket||[]).length+' açık</em></h3>';
    (p.paket||[]).forEach(function(x){
      html += '<div class="row"><div><div class="ad">'+esc(x.teslimat_musteri||x.hesap_no||x.hesap_tipi)+'</div><div class="alt">'+esc(x.teslimat_durumu||x.hesap_tipi)+' · '+saatKisa(x.acilis_zamani)+'</div></div><div class="amt">'+para0(x.net_tutar)+'</div></div>';
    });
    if (!(p.paket||[]).length) html += '<div class="empty">Açık paket yok</div>';
    html += '</div>';

    html += '<div class="card span-4"><h3>Bugünkü rezervasyon</h3>';
    (p.rezervasyon||[]).forEach(function(r){
      html += '<div class="row"><div><div class="ad">'+esc(r.saat)+' · '+esc(r.musteri_ad)+'</div><div class="alt">'+esc(r.kisi_sayisi)+' kişi'+(r.masa_numara?' · Masa '+esc(r.masa_numara):'')+' · '+esc(r.durum)+'</div></div></div>';
    });
    if (!(p.rezervasyon||[]).length) html += '<div class="empty">Rezervasyon yok</div>';
    html += '</div>';

    html += '<div class="card span-4"><h3>Son hareketler</h3>';
    (p.denetim||[]).forEach(function(l){
      html += '<div class="row"><div><div class="ad">'+esc(l.islem)+'</div><div class="alt">'+esc(l.personel_adi||'')+' · '+saatKisa(l.zaman)+'<br>'+esc(l.ozet||'')+'</div></div></div>';
    });
    if (!(p.denetim||[]).length) html += '<div class="empty">Kayıt yok</div>';
    html += '</div>';

    html += '</div>';
    document.getElementById('main').innerHTML = html;
  }

  function kpi(lbl, extra, val, sub){
    return '<div class="card kpi '+extra+'"><div class="lbl">'+lbl+'</div><div class="val">'+val+'</div>'+(sub?'<div class="sub">'+sub+'</div>':'')+'</div>';
  }
  function bar(ad, tutar, toplam, oran){
    var pct = toplam>0 ? Math.min(100,(Number(tutar||0)/Number(toplam))*100) : 0;
    return '<div class="barline"><span class="nm">'+esc(ad)+'</span><div class="track"><div class="fill" style="width:'+pct+'%"></div></div><b>'+para0(tutar)+(oran!=null?' · %'+oran:'')+'</b></div>';
  }
  function masaIzgara(liste, sadeceAcik){
    if (!liste.length) return '<div class="empty">Masa yok</div>';
    var bolumler={}, html='';
    liste.forEach(function(m){
      if (sadeceAcik && !m.hesap_id && m.durum!=='rezerve') return;
      var b=m.bolum_adi||'Salon';
      if (!bolumler[b]) bolumler[b]=[];
      bolumler[b].push(m);
    });
    var keys=Object.keys(bolumler);
    if (!keys.length) return '<div class="empty">Açık masa yok</div>';
    keys.forEach(function(b){
      html += '<div class="alt" style="margin:8px 0 6px;font-weight:700">'+esc(b)+'</div><div class="masa-grid">';
      bolumler[b].forEach(function(m){
        var cls = m.hesap_id ? 'dolu' : (m.durum==='rezerve'?'rez':'bos');
        var alt = m.hesap_id ? para0(m.net_tutar||m.toplam_tutar) : (m.durum==='rezerve'?'Rez.':'Boş');
        html += '<button type="button" class="tile '+cls+'" data-act="masa" data-id="'+m.id+'"><b>'+esc(m.numara)+'</b><span>'+alt+'</span></button>';
      });
      html += '</div>';
    });
    return html;
  }

  async function cizMasalar(){
    var liste = await api('/api/boss/masalar');
    if (!liste) return;
    if (!Array.isArray(liste)) liste=[];
    var bolumler={};
    liste.forEach(function(m){ var b=m.bolum_adi||'Salon'; if(!bolumler[b]) bolumler[b]=[]; bolumler[b].push(m); });
    var html = '<div class="chips">';
    html += '<button type="button" class="chip'+(masaBolum===''?' on':'')+'" data-act="bolum" data-id="">Tümü</button>';
    Object.keys(bolumler).forEach(function(b){
      html += '<button type="button" class="chip'+(masaBolum===b?' on':'')+'" data-act="bolum" data-id="'+esc(b)+'">'+esc(b)+'</button>';
    });
    html += '<button type="button" class="chip'+(sadeceDolu?' on':'')+'" data-act="sadece-dolu">'+(sadeceDolu?'Dolu masalar':'Hepsi')+'</button>';
    html += '</div>';
    var acik=liste.filter(function(m){return m.hesap_id;});
    var tutar=0; acik.forEach(function(m){ tutar+=Number(m.net_tutar||m.toplam_tutar||0); });
    html += '<div class="kpis" style="grid-template-columns:1fr 1fr 1fr;margin-bottom:12px">';
    html += kpi('Dolu','', String(acik.length), '');
    html += kpi('Boş','', String(liste.length-acik.length), '');
    html += kpi('Açık tutar','', para0(tutar), '');
    html += '</div>';
    var goster = liste.filter(function(m){
      if (masaBolum && m.bolum_adi!==masaBolum) return false;
      if (sadeceDolu && !m.hesap_id) return false;
      return true;
    });
    html += '<div class="card">'+masaIzgara(goster, false)+'</div>';
    document.getElementById('main').innerHTML = html;
  }

  async function masaDetay(id){
    var data = await api('/api/boss/masa/'+id);
    if (!data) return;
    var masa=data.masa||{}, hesap=data.hesap, sips=data.siparisler||[];
    var h = '<div class="grab"></div><h2 style="font-size:20px;margin-bottom:4px">'+(esc(masa.bolum_adi)||'')+' · Masa '+esc(masa.numara)+'</h2>';
    if (!hesap) {
      h += '<div class="empty">Bu masa boş</div>';
    } else {
      h += '<div class="alt" style="margin-bottom:12px">'+esc(hesap.hesap_no||'')+' · açılış '+saatKisa(hesap.acilis_zamani)+(hesap.kisi_sayisi?' · '+hesap.kisi_sayisi+' kişi':'')+'</div>';
      sips.forEach(function(s){
        h += '<div class="row"><div><div class="ad">'+esc(s.miktar)+'× '+esc(s.urun_adi);
        if (s.ikram) h += '<span class="tag ikram">İKRAM</span>';
        h += '</div>'+(s.notlar?'<div class="alt">'+esc(s.notlar)+'</div>':'')+'</div>';
        h += '<div class="amt">'+(s.ikram?'0,00 ₺':para(s.toplam_fiyat))+'</div></div>';
      });
      h += '<div class="row" style="margin-top:8px"><div class="ad">Net</div><div class="amt" style="color:var(--green);font-size:18px">'+para(hesap.net_tutar)+'</div></div>';
      if (Number(hesap.indirim_tutar)) h += '<div class="alt">İndirim '+para(hesap.indirim_tutar)+'</div>';
    }
    h += '<p class="alt" style="margin-top:16px">Salt izleme. Sipariş ve ödeme POS / garsondadır.</p>';
    document.getElementById('drawerBody').innerHTML = h;
    document.getElementById('drawer').classList.add('on');
  }

  async function cizRapor(){
    var html = '<div class="chips">';
    [['urun','Ürünler'],['kategori','Kategori'],['personel','Personel'],['odeme','Ödeme']].forEach(function(s){
      html += '<button type="button" class="chip'+(raporSekme===s[0]?' on':'')+'" data-act="rsekme" data-id="'+s[0]+'">'+s[1]+'</button>';
    });
    html += '</div>';
    if (raporSekme==='urun') {
      var urunler = await api('/api/boss/rapor/urun'+qs());
      if (!urunler) return;
      html += '<input class="search" id="urunQ" placeholder="Ürün veya kategori ara" value="'+esc(urunArama)+'">';
      html += '<div class="card" id="urunKutu"></div>';
      document.getElementById('main').innerHTML = html;
      window._urunler = urunler;
      urunTablo();
      var inp=document.getElementById('urunQ');
      if (inp) inp.addEventListener('input', function(){ urunArama=this.value; urunTablo(); });
      return;
    }
    if (raporSekme==='kategori') {
      var kat = await api('/api/boss/rapor/kategori'+qs());
      if (!kat) return;
      html += '<div class="card"><table class="grid"><thead><tr><th>Kategori</th><th class="r">Adet</th><th class="r">Ciro</th><th class="r">Kâr</th></tr></thead><tbody>';
      (kat||[]).forEach(function(k){
        if (!Number(k.tutar)) return;
        html += '<tr><td>'+esc(k.kategori_adi||k.kategori)+'</td><td class="r">'+esc(k.adet||0)+'</td><td class="r">'+para(k.tutar)+'</td><td class="r">'+para(k.net_kar)+'</td></tr>';
      });
      html += '</tbody></table></div>';
    } else if (raporSekme==='personel') {
      var per = await api('/api/boss/rapor/personel'+qs());
      if (!per) return;
      html += '<div class="card"><table class="grid"><thead><tr><th>Personel</th><th>Rol</th><th class="r">Hesap</th><th class="r">Ciro</th><th class="r">İptal</th><th class="r">İkram</th></tr></thead><tbody>';
      (per||[]).forEach(function(p){
        html += '<tr><td>'+esc(p.personel_adi)+'</td><td>'+esc(ROL[p.rol]||p.rol)+'</td><td class="r">'+esc(p.hesap_sayisi)+'</td><td class="r">'+para(p.toplam_satis)+'</td><td class="r">'+esc(p.iptal_sayisi)+'</td><td class="r">'+para0(p.ikram_tutari)+'</td></tr>';
      });
      html += '</tbody></table></div>';
    } else {
      var od = await api('/api/boss/rapor/odeme'+qs());
      var oz = await api('/api/boss/ozet'+qs());
      if (!od) return;
      html += '<div class="card">';
      (od||[]).forEach(function(x){ html += bar(ODEME[x.odeme_tipi]||x.odeme_tipi, x.toplam_tutar, (oz&&oz.ozet&&oz.ozet.toplam_ciro)||1, x.oran); });
      if (!(od||[]).length) html += '<div class="empty">Ödeme yok</div>';
      html += '</div>';
    }
    document.getElementById('main').innerHTML = html;
  }
  function urunTablo(){
    var q=(urunArama||'').toLowerCase();
    var list=(window._urunler||[]).filter(function(u){
      if (!q) return true;
      return String(u.urun_adi||'').toLowerCase().indexOf(q)>=0 || String(u.kategori_adi||'').toLowerCase().indexOf(q)>=0;
    });
    var h='<table class="grid"><thead><tr><th>Ürün</th><th>Kategori</th><th class="r">Adet</th><th class="r">Ciro</th><th class="r">Kâr</th><th class="r">Marj</th></tr></thead><tbody>';
    list.forEach(function(u){
      h += '<tr><td>'+esc(u.urun_adi)+'</td><td>'+esc(u.kategori_adi)+'</td><td class="r">'+esc(u.satis_adedi)+'</td><td class="r">'+para(u.toplam_ciro)+'</td><td class="r">'+para(u.net_kar)+'</td><td class="r">%'+esc(u.kar_marji)+'</td></tr>';
    });
    h += '</tbody></table>';
    if (!list.length) h='<div class="empty">Kayıt yok</div>';
    var el=document.getElementById('urunKutu'); if (el) el.innerHTML=h;
  }

  async function cizKasa(){
    var data=await api('/api/boss/kasa');
    var gecmis=await api('/api/boss/kasa/gecmis?limit=12');
    if (!data) return;
    var html='<div class="warn">Kasa açma / kapama yalnızca POS üzerindendir.</div><div class="dash">';
    if (!data.acik || !data.vardiya) {
      html += '<div class="card span-12"><div class="empty">Açık vardiya yok</div></div>';
    } else {
      var v=data.vardiya;
      html += '<div class="card span-8"><h3>'+esc(v.z_no||'Açık vardiya')+'</h3>';
      html += '<div class="kpis" style="grid-template-columns:repeat(3,1fr)">';
      html += kpi('Vardiya ciro','hero', para(v.toplam_ciro), 'Açılış '+saatKisa(v.acilis_zamani));
      html += kpi('Nakit', '', para0(v.nakit_satis), '');
      html += kpi('Kart', '', para0(v.kart_satis), '');
      html += kpi('Yemek kartı','', para0(v.yemek_karti_satis), '');
      html += kpi('Gider','', para0(v.gider), '');
      html += kpi('Beklenen nakit','', para0(v.beklenen_nakit), 'Açılış '+para0(v.acilis_nakit));
      html += '</div></div>';
      html += '<div class="card span-4"><h3>Giderler</h3>';
      (v.giderler||[]).forEach(function(g){
        html += '<div class="row"><div><div class="ad">'+esc(g.aciklama||'Gider')+'</div><div class="alt">'+esc(g.personel_adi||'')+' · '+saatKisa(g.created_at)+'</div></div><div class="amt" style="color:var(--red)">-'+para(g.tutar)+'</div></div>';
      });
      if (!(v.giderler||[]).length) html += '<div class="empty">Gider yok</div>';
      html += '</div>';
    }
    html += '<div class="card span-12"><h3>Son Z raporları</h3><table class="grid"><thead><tr><th>Z</th><th>Durum</th><th>Açan</th><th class="r">Nakit</th><th class="r">Kart</th><th class="r">Ciro</th></tr></thead><tbody>';
    (gecmis||[]).forEach(function(z){
      var ciro=Number(z.nakit_satis||0)+Number(z.kart_satis||0)+Number(z.yemek_karti_satis||0)+Number(z.diger_satis||0);
      html += '<tr><td>'+esc(z.z_no||('#'+z.id))+'</td><td>'+(z.durum==='acik'?'Açık':'Kapalı')+'</td><td>'+esc(z.acan_adi||'')+'</td><td class="r">'+para0(z.nakit_satis)+'</td><td class="r">'+para0(z.kart_satis)+'</td><td class="r">'+para(ciro)+'</td></tr>';
    });
    html += '</tbody></table></div></div>';
    document.getElementById('main').innerHTML = html;
  }

  async function cizDaha(){
    var html='<div class="chips">';
    [['stok','Stok'],['paket','Paket'],['rez','Rezervasyon'],['denetim','Denetim']].forEach(function(s){
      html += '<button type="button" class="chip'+(dahaSekme===s[0]?' on':'')+'" data-act="dsekme" data-id="'+s[0]+'">'+s[1]+'</button>';
    });
    html += '</div>';
    if (dahaSekme==='stok') {
      var stok=await api('/api/boss/stok'); if (!stok) return;
      html += '<div class="chips">';
      [['uyari','Uyarılar'],['tukendi','Tükendi'],['kritik','Kritik'],['tumu','Tümü']].forEach(function(s){
        html += '<button type="button" class="chip'+(stokFiltre===s[0]?' on':'')+'" data-act="stokf" data-id="'+s[0]+'">'+s[1]+'</button>';
      });
      html += '</div><div class="card"><table class="grid"><thead><tr><th>Hammadde</th><th>Durum</th><th class="r">Stok</th><th class="r">Min</th><th>Tedarikçi</th></tr></thead><tbody>';
      (stok||[]).filter(function(s){
        if (stokFiltre==='tumu') return true;
        if (stokFiltre==='uyari') return s.stok_durumu!=='normal';
        return s.stok_durumu===stokFiltre;
      }).forEach(function(s){
        html += '<tr><td>'+esc(s.hammadde_adi)+'</td><td>'+(STOK[s.stok_durumu]||s.stok_durumu)+'</td><td class="r">'+esc(s.mevcut_stok)+' '+esc(s.birim)+'</td><td class="r">'+esc(s.min_stok)+'</td><td>'+esc(s.tedarikci||'—')+'</td></tr>';
      });
      html += '</tbody></table></div>';
    } else if (dahaSekme==='paket') {
      html += '<div class="chips">';
      [['acik','Açık'],['kapali','Kapalı']].forEach(function(s){
        html += '<button type="button" class="chip'+(paketDurum===s[0]?' on':'')+'" data-act="paketd" data-id="'+s[0]+'">'+s[1]+'</button>';
      });
      html += '</div>';
      var paket=await api('/api/boss/paket?durum='+paketDurum); if (!paket) return;
      html += '<div class="card">';
      (paket||[]).forEach(function(p){
        var tip=p.hesap_tipi==='gel_al'?'Gel al':(p.hesap_tipi==='bar'?'Bar':'Paket');
        html += '<div class="row"><div><div class="ad">'+esc(p.teslimat_musteri||p.hesap_no||tip)+'</div><div class="alt">'+tip+' · '+(p.teslimat_durumu||p.durum)+' · '+saatKisa(p.acilis_zamani)+(p.teslimat_telefon?' · '+esc(p.teslimat_telefon):'')+'</div></div><div class="amt">'+para(p.net_tutar)+'</div></div>';
      });
      if (!(paket||[]).length) html += '<div class="empty">Kayıt yok</div>';
      html += '</div>';
    } else if (dahaSekme==='rez') {
      var rez=await api('/api/boss/rezervasyonlar'); if (!rez) return;
      html += '<div class="card"><h3>Bugün · '+esc(rez.tarih||'')+'</h3>';
      (rez.liste||[]).forEach(function(r){
        html += '<div class="row"><div><div class="ad">'+esc(r.saat)+' · '+esc(r.musteri_ad)+'</div><div class="alt">'+esc(r.kisi_sayisi)+' kişi'+(r.masa_numara?' · Masa '+esc(r.masa_numara):'')+(r.telefon?' · '+esc(r.telefon):'')+' · '+esc(r.durum)+'</div></div></div>';
      });
      if (!(rez.liste||[]).length) html += '<div class="empty">Rezervasyon yok</div>';
      html += '</div>';
    } else {
      var log=await api('/api/boss/denetim'); if (!log) return;
      html += '<div class="card">';
      (log||[]).forEach(function(l){
        html += '<div class="row"><div><div class="ad">'+esc(l.islem)+'</div><div class="alt">'+esc(l.personel_adi||'')+' · '+saatKisa(l.zaman)+'<br>'+esc(l.ozet||'')+'</div></div></div>';
      });
      if (!(log||[]).length) html += '<div class="empty">Denetim kaydı yok</div>';
      html += '</div>';
    }
    document.getElementById('main').innerHTML = html;
  }

  var datesBound = false;
  function bindDates(){
    if (datesBound) return;
    var a=document.getElementById('d1in'), b=document.getElementById('d2in');
    if (!a || !b) return;
    datesBound = true;
    a.addEventListener('change', function(){ ozelBas=this.value; tarihMod='ozel'; donemCiz(); yenile(true); });
    b.addEventListener('change', function(){ ozelBit=this.value; tarihMod='ozel'; donemCiz(); yenile(true); });
  }

  async function yenile(){
    if (aktif==='ozet') await cizOzet();
    else if (aktif==='masalar') await cizMasalar();
    else if (aktif==='rapor') await cizRapor();
    else if (aktif==='kasa') await cizKasa();
    else await cizDaha();
  }

  document.addEventListener('click', function(e){
    var t = e.target.closest ? e.target.closest('[data-act]') : null;
    if (!t) return;
    var act = t.getAttribute('data-act');
    var id = t.getAttribute('data-id');
    if (act==='sayfa') sayfa(id);
    else if (act==='yenile') yenile(true);
    else if (act==='cikis') cikis();
    else if (act==='kapat') document.getElementById('drawer').classList.remove('on');
    else if (act==='tarih') { tarihMod=id; if (id==='ozel' && !ozelBas){ ozelBas=bugun(); ozelBit=bugun(); } donemCiz(); yenile(true); }
    else if (act==='masa') masaDetay(id);
    else if (act==='bolum') { masaBolum=id; cizMasalar(); }
    else if (act==='sadece-dolu') { sadeceDolu=!sadeceDolu; cizMasalar(); }
    else if (act==='rsekme') { raporSekme=id; cizRapor(); }
    else if (act==='dsekme') { dahaSekme=id; cizDaha(); }
    else if (act==='stokf') { stokFiltre=id; cizDaha(); }
    else if (act==='paketd') { paketDurum=id; cizDaha(); }
  });

  setInterval(function(){
    var el=document.getElementById('saat');
    if (el) el.textContent = new Date().toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  }, 1000);

  try {
    var socket = io();
    socket.on('masalar:guncellendi', function(){ if (aktif==='ozet'||aktif==='masalar') yenile(false); });
    socket.on('siparis:guncellendi', function(){ if (aktif==='ozet'||aktif==='masalar') yenile(false); });
  } catch(e) {}

  numpadKur();
  ozelBas = bugun(); ozelBit = bugun();
  (async function(){
    if (!token) return;
    var ben = await api('/api/boss/ben');
    if (!ben) return;
    kullanici = ben.personel;
    if (ben.isletme_adi) isletme = ben.isletme_adi;
    girisOk();
  })();
})();
</script>
</body>
</html>`;
}
