// =====================================================
// Garson Mobil Web Arayüzü
// Telefondan ve el terminalinden hızlı sipariş alma ekranı
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
  <meta name="theme-color" content="#090A0F">
  <title>ETİBOL POS - Garson Terminali</title>
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    :root {
      /* Industrial Charcoal Base */
      --bg-base: #090A0F;
      --bg-surface: #121620;
      --bg-surface-elevated: #181E2C;
      --bg-surface-glass: rgba(18, 22, 32, 0.88);
      --border-subtle: #1E2536;
      --border-focus: #2E3B56;
      
      /* High Contrast Functional POS Accents */
      --pos-green: #10B981;
      --pos-green-deep: #064E3B;
      --pos-green-glow: rgba(16, 185, 129, 0.25);
      
      --pos-red: #EF4444;
      --pos-red-deep: #450A0A;
      --pos-red-glow: rgba(239, 68, 68, 0.25);
      
      --pos-amber: #F59E0B;
      --pos-amber-deep: #451A03;
      --pos-amber-glow: rgba(245, 158, 11, 0.25);
      
      --pos-cyan: #0EA5E9;
      --pos-cyan-deep: #0C4A6E;
      --pos-cyan-glow: rgba(14, 165, 233, 0.25);
      
      --pos-purple: #8B5CF6;
      --pos-purple-deep: #2E1065;
      
      /* Typography Colors */
      --text-primary: #F8FAFC;
      --text-secondary: #94A3B8;
      --text-muted: #64748B;
      --text-dark: #090A0F;

      /* Metrics & Geometry */
      --radius-sm: 8px;
      --radius-md: 12px;
      --radius-lg: 16px;
      --radius-xl: 22px;
      --radius-full: 9999px;
      --min-touch-target: 48px;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      -webkit-tap-highlight-color: transparent;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      touch-action: manipulation;
      user-select: none;
      -webkit-user-select: none;
    }

    body {
      background: var(--bg-base);
      color: var(--text-primary);
      min-height: 100dvh;
      overflow-x: hidden;
      display: flex;
      flex-direction: column;
      font-feature-settings: 'tnum' on, 'lnum' on;
    }

    input, button, select, textarea {
      font-family: inherit;
    }

    /* Common Button & Utility Styles */
    .icon-svg {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    /* ===== LOGIN SCREEN ===== */
    .login-screen {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100dvh;
      padding: 24px;
      background: radial-gradient(circle at 50% 15%, #182032 0%, var(--bg-base) 70%);
      position: relative;
      z-index: 10;
    }

    .pos-badge-top {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      padding: 6px 14px;
      border-radius: var(--radius-full);
      font-size: 11px;
      font-weight: 700;
      color: var(--pos-cyan);
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin-bottom: 20px;
    }

    .login-brand-icon {
      width: 72px;
      height: 72px;
      background: var(--bg-surface);
      border: 2px solid var(--border-focus);
      border-radius: var(--radius-xl);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--pos-cyan);
      margin-bottom: 16px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5), 0 0 24px var(--pos-cyan-glow);
    }

    .login-title {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin-bottom: 6px;
      color: var(--text-primary);
    }

    .login-sub {
      color: var(--text-secondary);
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 32px;
    }

    .pin-display {
      display: flex;
      gap: 16px;
      margin-bottom: 32px;
    }

    .pin-dot {
      width: 18px;
      height: 18px;
      border-radius: var(--radius-full);
      border: 2px solid var(--border-subtle);
      background: var(--bg-surface);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .pin-dot.filled {
      border-color: var(--pos-cyan);
      background: var(--pos-cyan);
      box-shadow: 0 0 14px var(--pos-cyan-glow);
      transform: scale(1.15);
    }

    .numpad {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      max-width: 320px;
      width: 100%;
    }

    .numpad button {
      height: 68px;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      font-size: 24px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.1s ease;
      touch-action: manipulation;
    }

    .numpad .num-btn {
      background: var(--bg-surface);
      color: var(--text-primary);
    }

    .numpad .num-btn:active {
      background: var(--pos-cyan);
      color: #fff;
      border-color: var(--pos-cyan);
      transform: scale(0.94);
    }

    .numpad .action-btn {
      background: transparent;
      color: var(--text-secondary);
      font-size: 16px;
      font-weight: 600;
    }

    .numpad .action-btn:active {
      background: var(--bg-surface-elevated);
      color: var(--text-primary);
      transform: scale(0.94);
    }

    .login-error {
      color: var(--pos-red);
      margin-top: 18px;
      font-size: 13px;
      font-weight: 600;
      min-height: 20px;
      text-align: center;
    }

    /* ===== MAIN APP LAYOUT ===== */
    .app-container {
      display: none;
      flex-direction: column;
      min-height: 100dvh;
      background: var(--bg-base);
    }

    .app-container.active {
      display: flex;
    }

    /* Modern Top Header */
    .app-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: max(env(safe-area-inset-top), 12px) 16px 12px;
      background: var(--bg-surface-glass);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border-subtle);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .live-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--pos-green);
      box-shadow: 0 0 8px var(--pos-green);
      position: relative;
    }

    .live-indicator::after {
      content: '';
      position: absolute;
      inset: -3px;
      border-radius: 50%;
      border: 1px solid var(--pos-green);
      animation: pulseLive 2s infinite ease-out;
    }

    @keyframes pulseLive {
      0% { transform: scale(0.9); opacity: 1; }
      100% { transform: scale(1.9); opacity: 0; }
    }

    .header-titles {
      display: flex;
      flex-direction: column;
    }

    .header-main-title {
      font-size: 17px;
      font-weight: 800;
      color: var(--text-primary);
      letter-spacing: -0.3px;
      line-height: 1.2;
    }

    .header-staff-name {
      font-size: 11px;
      font-weight: 600;
      color: var(--pos-cyan);
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-top: 1px;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-header-action {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      min-height: 38px;
      transition: all 0.15s ease;
    }

    .btn-header-action:active {
      background: var(--pos-red-deep);
      border-color: var(--pos-red);
      color: var(--pos-red);
      transform: scale(0.96);
    }

    /* Main Scrollable Pages */
    .app-page {
      display: none;
      flex: 1;
      padding: 16px;
      padding-bottom: calc(110px + env(safe-area-inset-bottom));
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }

    .app-page.active {
      display: block;
      animation: pageFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes pageFadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Section Subheadings */
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 16px 0 12px;
    }

    .section-header:first-child {
      margin-top: 0;
    }

    .section-tag {
      font-size: 12px;
      font-weight: 800;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 1.2px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .section-tag::after {
      content: '';
      width: 40px;
      height: 1px;
      background: var(--border-subtle);
    }

    .section-count {
      font-size: 11px;
      font-weight: 700;
      color: var(--text-secondary);
      background: var(--bg-surface-elevated);
      padding: 3px 8px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-subtle);
    }

    /* ===== BÖLÜM & MASA SEÇİM GRİDLERİ ===== */
    .bolum-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-top: 4px;
    }

    .bolum-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 18px 14px;
      text-align: left;
      cursor: pointer;
      position: relative;
      transition: all 0.15s ease;
      min-height: 90px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .bolum-card:active {
      transform: scale(0.96);
      border-color: var(--pos-cyan);
      background: var(--bg-surface-elevated);
    }

    .bolum-name {
      font-size: 16px;
      font-weight: 800;
      color: var(--text-primary);
      margin-bottom: 6px;
    }

    .bolum-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .bolum-tag {
      background: var(--bg-base);
      padding: 3px 8px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-subtle);
      font-size: 11px;
    }

    /* Tables Grid */
    .masa-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 16px;
    }

    .btn-back-square {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-md);
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      color: var(--text-primary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
      flex-shrink: 0;
    }

    .btn-back-square:active {
      transform: scale(0.92);
      background: var(--bg-surface-elevated);
      border-color: var(--border-focus);
    }

    .masa-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }

    .masa-card {
      background: var(--bg-surface);
      border-radius: var(--radius-lg);
      padding: 16px 14px;
      cursor: pointer;
      border: 1px solid var(--border-subtle);
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 96px;
      transition: all 0.15s ease;
      touch-action: manipulation;
    }

    .masa-card:active {
      transform: scale(0.96);
    }

    /* Free Table (Boş Masa) - Crisp Emerald Industrial */
    .masa-card.bos {
      border-color: rgba(16, 185, 129, 0.35);
      background: linear-gradient(180deg, #111a1a 0%, var(--bg-surface) 100%);
    }

    .masa-card.bos:active {
      border-color: var(--pos-green);
      background: #0d221c;
    }

    /* Occupied Table (Dolu Masa) - Crisp Crimson Industrial */
    .masa-card.dolu {
      border-color: rgba(239, 68, 68, 0.45);
      background: linear-gradient(180deg, #221217 0%, var(--bg-surface) 100%);
      box-shadow: 0 4px 16px rgba(239, 68, 68, 0.08);
    }

    .masa-card.dolu:active {
      border-color: var(--pos-red);
      background: #2b1218;
    }

    .masa-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .masa-num {
      font-size: 20px;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: var(--text-primary);
    }

    .masa-card.dolu .masa-num {
      color: #FCA5A5;
    }

    .masa-status-pill {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      padding: 3px 8px;
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .masa-card.bos .masa-status-pill {
      background: rgba(16, 185, 129, 0.15);
      color: var(--pos-green);
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .masa-card.dolu .masa-status-pill {
      background: rgba(239, 68, 68, 0.2);
      color: #F87171;
      border: 1px solid rgba(239, 68, 68, 0.4);
    }

    .masa-bottom {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
    }

    .masa-price {
      font-size: 18px;
      font-weight: 800;
      color: var(--text-primary);
      letter-spacing: -0.5px;
    }

    .masa-card.bos .masa-price {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-muted);
    }

    /* ===== MASA DETAY / HESAP ÖZETİ EKRANI ===== */
    .detay-summary-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 18px;
      margin-bottom: 16px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
    }

    .detay-summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .detay-summary-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .detay-summary-total {
      font-size: 32px;
      font-weight: 900;
      color: var(--pos-cyan);
      letter-spacing: -1px;
    }

    .btn-new-order-add {
      width: 100%;
      min-height: 52px;
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-focus);
      border-radius: var(--radius-lg);
      color: var(--text-primary);
      font-size: 15px;
      font-weight: 800;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 20px;
      transition: all 0.15s ease;
    }

    .btn-new-order-add:active {
      background: var(--pos-cyan-deep);
      border-color: var(--pos-cyan);
      color: #fff;
      transform: scale(0.97);
    }

    .siparis-items-list {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .siparis-item-row {
      display: flex;
      justify-content: space-between;
      padding: 14px 16px;
      border-bottom: 1px solid var(--border-subtle);
    }

    .siparis-item-row:last-child {
      border-bottom: none;
    }

    .siparis-item-row.iptal {
      opacity: 0.45;
      text-decoration: line-through;
    }

    .siparis-left-info {
      flex: 1;
      padding-right: 12px;
    }

    .siparis-item-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 4px;
      line-height: 1.3;
    }

    .siparis-item-qty {
      font-weight: 800;
      color: var(--pos-cyan);
      margin-right: 4px;
    }

    .siparis-item-note {
      font-size: 12px;
      font-weight: 600;
      color: var(--pos-amber);
      margin: 4px 0;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .siparis-actions-inline {
      display: flex;
      gap: 8px;
      margin-top: 8px;
    }

    .btn-table-action {
      padding: 6px 10px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-subtle);
      background: var(--bg-surface-elevated);
      color: var(--text-secondary);
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      min-height: 32px;
      transition: all 0.15s ease;
    }

    .btn-table-action:active {
      transform: scale(0.95);
    }

    .btn-table-action.ikram-on {
      background: rgba(139, 92, 246, 0.2);
      border-color: var(--pos-purple);
      color: #C4B5FD;
    }

    .btn-table-action.cancel-btn {
      color: var(--pos-red);
    }

    .btn-table-action.cancel-btn:active {
      background: var(--pos-red-deep);
    }

    .siparis-right-info {
      text-align: right;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: flex-end;
    }

    .siparis-price-text {
      font-size: 15px;
      font-weight: 800;
      color: var(--text-primary);
    }

    .siparis-status-badge {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      padding: 3px 8px;
      border-radius: var(--radius-full);
      margin-top: 6px;
    }

    .status-bekliyor { background: rgba(245, 158, 11, 0.15); color: var(--pos-amber); border: 1px solid rgba(245, 158, 11, 0.3); }
    .status-hazir { background: rgba(16, 185, 129, 0.15); color: var(--pos-green); border: 1px solid rgba(16, 185, 129, 0.3); }
    .status-diger { background: var(--bg-surface-elevated); color: var(--text-muted); border: 1px solid var(--border-subtle); }

    /* ===== SİPARİŞ GİRİŞİ (ORDER ENTRY) ===== */
    .search-filter-bar {
      margin-bottom: 12px;
      position: relative;
    }

    .search-input {
      width: 100%;
      height: 46px;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 0 16px 0 42px;
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
      outline: none;
      transition: all 0.2s ease;
    }

    .search-input:focus {
      border-color: var(--pos-cyan);
      box-shadow: 0 0 0 3px var(--pos-cyan-glow);
    }

    .search-icon-pos {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      pointer-events: none;
    }

    /* Category Horizontal Pill Scroller */
    .kategori-pills-container {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 8px;
      margin: 0 -16px 12px -16px;
      padding-left: 16px;
      padding-right: 16px;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
    }

    .kategori-pills-container::-webkit-scrollbar {
      display: none;
    }

    .kategori-pill {
      white-space: nowrap;
      padding: 10px 18px;
      border-radius: var(--radius-full);
      font-size: 13px;
      font-weight: 700;
      border: 1px solid var(--border-subtle);
      background: var(--bg-surface);
      color: var(--text-secondary);
      cursor: pointer;
      flex-shrink: 0;
      min-height: 42px;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }

    .kategori-pill.active {
      background: var(--pos-cyan);
      color: #fff;
      border-color: var(--pos-cyan);
      box-shadow: 0 4px 14px var(--pos-cyan-glow);
    }

    .kategori-pill:active {
      transform: scale(0.95);
    }

    /* Porsiyon Segment Control */
    .porsiyon-control {
      display: flex;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 4px;
      gap: 4px;
      margin-bottom: 14px;
    }

    .porsiyon-btn {
      flex: 1;
      border: none;
      border-radius: var(--radius-sm);
      min-height: 40px;
      font-weight: 800;
      font-size: 12px;
      letter-spacing: 0.4px;
      cursor: pointer;
      background: transparent;
      color: var(--text-secondary);
      transition: all 0.15s ease;
    }

    .porsiyon-btn.active {
      background: var(--bg-surface-elevated);
      color: var(--pos-cyan);
      border: 1px solid var(--border-focus);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    }

    .porsiyon-btn:active {
      transform: scale(0.96);
    }

    /* Product Grid */
    .urun-catalog-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }

    .urun-pos-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      cursor: pointer;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition: all 0.12s ease;
      position: relative;
      touch-action: manipulation;
    }

    .urun-pos-card:active {
      border-color: var(--pos-cyan);
      background: var(--bg-surface-elevated);
      transform: scale(0.95);
    }

    /* Card with image */
    .urun-pos-card.has-img .urun-thumb-wrap {
      width: 100%;
      aspect-ratio: 1 / 1;
      overflow: hidden;
      background: var(--bg-base);
      position: relative;
    }

    .urun-pos-card.has-img .urun-thumb-wrap img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      opacity: 0;
      transition: opacity 0.25s ease;
    }

    .urun-pos-card.has-img .urun-thumb-wrap img.loaded {
      display: block;
      opacity: 1;
    }

    .urun-pos-card.has-img .urun-thumb-wrap img.failed {
      display: none;
    }

    .urun-pos-card.has-img .urun-thumb-wrap:has(img.loaded) .urun-thumb-placeholder {
      display: none;
    }

    .urun-thumb-placeholder {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      background: linear-gradient(135deg, var(--bg-base) 0%, var(--bg-surface) 100%);
    }

    .urun-thumb-placeholder svg {
      opacity: 0.3;
    }

    .urun-pos-card.has-img .urun-card-body {
      padding: 8px 8px 10px;
    }

    /* Card without image — text-only clean */
    .urun-pos-card.no-img {
      justify-content: center;
      align-items: center;
      text-align: center;
      min-height: 94px;
      padding: 12px 8px;
    }

    .urun-pos-card.no-img .urun-card-body {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      width: 100%;
    }

    .urun-pos-title {
      font-size: 12.5px;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.3;
    }

    .urun-pos-card.no-img .urun-pos-title {
      font-size: 13px;
    }

    .urun-pos-bottom {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      width: 100%;
    }

    .urun-pos-card.no-img .urun-pos-bottom {
      justify-content: center;
      gap: 6px;
    }

    .urun-pos-price {
      font-size: 11px;
      font-weight: 800;
      color: var(--pos-cyan);
      letter-spacing: -0.2px;
      line-height: 1.25;
      text-align: right;
      width: 100%;
    }

    .urun-pos-unit {
      display: none;
    }

    /* Variation indicator badge */
    .urun-varyant-badge {
      position: absolute;
      top: 6px;
      right: 6px;
      width: 20px;
      height: 20px;
      border-radius: var(--radius-full);
      background: var(--pos-amber);
      color: var(--text-dark);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 900;
      z-index: 2;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    }

    .urun-pos-card.no-img .urun-varyant-badge {
      top: 4px;
      right: 4px;
    }

    /* ===== VARIATION/OPTION PICKER MODAL ===== */
    .picker-modal-bg {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.85);
      z-index: 300;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .picker-modal-bg.active {
      display: block;
      opacity: 1;
    }

    /* ===== SATIS TURU (SALE TYPE) MODAL ===== */
    .satis-turu-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
      margin-top: 8px;
    }

    .satis-turu-btn {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border-radius: var(--radius-lg);
      border: 2px solid var(--border-subtle);
      background: var(--bg-base);
      color: var(--text-primary);
      cursor: pointer;
      text-align: left;
      transition: all 0.15s ease;
    }

    .satis-turu-btn:active {
      transform: scale(0.97);
    }

    .satis-turu-btn.porsiyon {
      border-color: rgba(14, 165, 233, 0.4);
      background: rgba(14, 165, 233, 0.06);
    }

    .satis-turu-btn.porsiyon:active {
      background: rgba(14, 165, 233, 0.18);
    }

    .satis-turu-btn.kg {
      border-color: rgba(16, 185, 129, 0.4);
      background: rgba(16, 185, 129, 0.06);
    }

    .satis-turu-btn.kg:active {
      background: rgba(16, 185, 129, 0.18);
    }

    .satis-turu-btn-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .satis-turu-icon-wrap {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }

    .satis-turu-btn.porsiyon .satis-turu-icon-wrap {
      background: rgba(14, 165, 233, 0.2);
      color: var(--pos-cyan);
    }

    .satis-turu-btn.kg .satis-turu-icon-wrap {
      background: rgba(16, 185, 129, 0.2);
      color: var(--pos-green);
    }

    .satis-turu-name {
      font-size: 16px;
      font-weight: 800;
      color: #fff;
      margin-bottom: 2px;
    }

    .satis-turu-desc {
      font-size: 12px;
      color: var(--text-secondary);
    }

    .satis-turu-price {
      font-size: 17px;
      font-weight: 900;
      color: var(--pos-green);
      font-family: monospace;
      text-align: right;
    }

    /* ===== GRAMAJ MODAL ===== */
    .gramaj-display-box {
      background: var(--bg-base);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 14px;
      text-align: center;
      margin-bottom: 12px;
    }

    .gramaj-val-text {
      font-size: 32px;
      font-weight: 900;
      color: var(--pos-green);
      font-family: monospace;
      line-height: 1.1;
    }

    .gramaj-unit-tag {
      font-size: 14px;
      font-weight: 800;
      color: var(--text-secondary);
      margin-left: 6px;
    }

    .gramaj-calc-preview {
      margin-top: 8px;
      font-size: 13px;
      font-weight: 700;
      color: var(--text-secondary);
    }

    .gramaj-preset-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 12px;
    }

    .gramaj-preset-btn {
      height: 38px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-subtle);
      background: var(--bg-surface-elevated);
      color: var(--text-primary);
      font-size: 12px;
      font-weight: 800;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.1s ease;
    }

    .gramaj-preset-btn:active {
      background: var(--pos-green-deep);
      border-color: var(--pos-green);
      color: var(--pos-green);
      transform: scale(0.95);
    }

    .gramaj-numpad {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      max-width: 280px;
      margin: 0 auto 12px;
    }

    .gramaj-numpad button {
      height: 48px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-subtle);
      background: var(--bg-base);
      color: var(--text-primary);
      font-size: 18px;
      font-weight: 800;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .gramaj-numpad button:active {
      background: var(--pos-green-deep);
      border-color: var(--pos-green);
      color: #fff;
      transform: scale(0.94);
    }

    .picker-sheet {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: var(--bg-surface);
      border-top: 1px solid var(--border-focus);
      border-radius: 20px 20px 0 0;
      max-height: 70dvh;
      display: flex;
      flex-direction: column;
      z-index: 301;
      transform: translateY(100%);
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .picker-sheet.active {
      transform: translateY(0);
    }

    .picker-header {
      padding: 14px 18px;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .picker-title {
      font-size: 16px;
      font-weight: 800;
      color: var(--text-primary);
    }

    .picker-body {
      padding: 14px 18px;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }

    .picker-section-label {
      font-size: 11px;
      font-weight: 800;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
      margin-top: 10px;
    }

    .picker-section-label:first-child {
      margin-top: 0;
    }

    .picker-option-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 8px;
    }

    .picker-option-btn {
      padding: 10px 16px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-subtle);
      background: var(--bg-base);
      color: var(--text-primary);
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      min-height: 44px;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.12s ease;
    }

    .picker-option-btn:active {
      transform: scale(0.95);
    }

    .picker-option-btn.selected {
      border-color: var(--pos-cyan);
      background: var(--pos-cyan-deep);
      color: var(--pos-cyan);
      box-shadow: 0 0 12px var(--pos-cyan-glow);
    }

    .picker-option-price {
      font-size: 11px;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .picker-option-btn.selected .picker-option-price {
      color: var(--pos-cyan);
    }

    .picker-footer {
      padding: 14px 18px calc(14px + env(safe-area-inset-bottom));
      border-top: 1px solid var(--border-subtle);
    }

    .btn-picker-confirm {
      width: 100%;
      min-height: 50px;
      border: none;
      border-radius: var(--radius-md);
      background: var(--pos-green);
      color: var(--text-dark);
      font-size: 15px;
      font-weight: 900;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-shadow: 0 6px 18px var(--pos-green-glow);
      transition: all 0.15s ease;
    }

    .btn-picker-confirm:active {
      transform: scale(0.97);
      background: #059669;
    }

    /* Skip button (add without options) */
    .btn-picker-skip {
      width: 100%;
      min-height: 42px;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      background: transparent;
      color: var(--text-secondary);
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      margin-top: 8px;
      transition: all 0.15s ease;
    }

    .btn-picker-skip:active {
      background: var(--bg-surface-elevated);
      color: var(--text-primary);
      transform: scale(0.97);
    }

    /* ===== FLOATING SEPET (CART) BAR ===== */
    .sepet-floating-bar {
      position: fixed;
      bottom: calc(68px + env(safe-area-inset-bottom));
      left: 14px;
      right: 14px;
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-focus);
      border-radius: var(--radius-xl);
      padding: 12px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      z-index: 90;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.6), 0 0 20px var(--pos-cyan-glow);
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .sepet-floating-bar:active {
      transform: scale(0.97);
    }

    .sepet-floating-bar.hidden {
      opacity: 0;
      transform: translateY(60px) scale(0.9);
      pointer-events: none;
    }

    .sepet-count-pill {
      background: var(--pos-cyan);
      color: #fff;
      width: 32px;
      height: 32px;
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 14px;
    }

    .sepet-floating-label {
      font-weight: 800;
      font-size: 14px;
      color: var(--text-primary);
    }

    .sepet-floating-total {
      font-size: 18px;
      font-weight: 900;
      color: var(--pos-cyan);
      letter-spacing: -0.5px;
    }

    /* ===== SEPET BOTTOM SHEET / MODAL ===== */
    .modal-backdrop {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.82);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 200;
      opacity: 0;
      transition: opacity 0.25s ease;
    }

    .modal-backdrop.active {
      display: block;
      opacity: 1;
    }

    .modal-sheet {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: var(--bg-surface);
      border-top: 1px solid var(--border-focus);
      border-radius: 24px 24px 0 0;
      max-height: 88dvh;
      display: flex;
      flex-direction: column;
      z-index: 201;
      transform: translateY(100%);
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .modal-sheet.active {
      transform: translateY(0);
    }

    .modal-sheet-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-sheet-title {
      font-size: 17px;
      font-weight: 800;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-modal-close {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-full);
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }

    .btn-modal-close:active {
      transform: scale(0.92);
      color: var(--text-primary);
    }

    .modal-sheet-body {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      -webkit-overflow-scrolling: touch;
    }

    .sepet-cart-item {
      background: var(--bg-base);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 12px;
      margin-bottom: 10px;
    }

    .sepet-item-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 10px;
    }

    .sepet-item-name {
      font-size: 14px;
      font-weight: 700;
      color: var(--text-primary);
      flex: 1;
      padding-right: 8px;
    }

    .sepet-item-price {
      font-size: 15px;
      font-weight: 800;
      color: var(--pos-cyan);
    }

    .sepet-item-controls {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .sepet-stepper {
      display: flex;
      align-items: center;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      overflow: hidden;
    }

    .btn-stepper {
      width: 44px;
      height: 40px;
      border: none;
      background: transparent;
      color: var(--text-primary);
      font-size: 20px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      touch-action: manipulation;
    }

    .btn-stepper:active {
      background: var(--bg-surface-elevated);
      color: var(--pos-cyan);
    }

    .stepper-val {
      min-width: 44px;
      text-align: center;
      font-weight: 800;
      font-size: 14px;
      color: var(--text-primary);
      padding: 0 4px;
      cursor: pointer;
    }

    .sepet-item-note-input {
      flex: 1;
      min-width: 120px;
      height: 40px;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 0 12px;
      color: var(--text-primary);
      font-size: 12.5px;
      outline: none;
    }

    .sepet-item-note-input:focus {
      border-color: var(--pos-cyan);
    }

    .btn-cart-ikram {
      height: 40px;
      padding: 0 12px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-subtle);
      background: var(--bg-surface);
      color: var(--text-secondary);
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .btn-cart-ikram.active {
      background: rgba(139, 92, 246, 0.2);
      border-color: var(--pos-purple);
      color: #C4B5FD;
    }

    /* Quick Note Chips in Modal */
    .quick-notes-bar {
      display: flex;
      gap: 6px;
      overflow-x: auto;
      padding: 8px 0 4px;
      scrollbar-width: none;
    }
    .quick-notes-bar::-webkit-scrollbar { display: none; }

    .quick-note-chip {
      white-space: nowrap;
      padding: 6px 10px;
      border-radius: var(--radius-sm);
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      font-size: 11px;
      font-weight: 600;
      color: var(--text-secondary);
      cursor: pointer;
    }
    .quick-note-chip:active {
      background: var(--pos-cyan-deep);
      border-color: var(--pos-cyan);
      color: #fff;
    }

    .modal-sheet-footer {
      padding: 16px 20px calc(16px + env(safe-area-inset-bottom));
      border-top: 1px solid var(--border-subtle);
      background: var(--bg-surface);
    }

    .btn-kitchen-send {
      width: 100%;
      min-height: 56px;
      border: none;
      border-radius: var(--radius-lg);
      background: var(--pos-green);
      color: var(--text-dark);
      font-size: 16px;
      font-weight: 900;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-shadow: 0 8px 24px var(--pos-green-glow);
      transition: all 0.15s ease;
      touch-action: manipulation;
    }

    .btn-kitchen-send:active {
      transform: scale(0.97);
      background: #059669;
      color: #fff;
    }

    .btn-kitchen-send:disabled {
      opacity: 0.5;
      transform: none;
      pointer-events: none;
    }

    /* ===== BOTTOM NAVIGATION BAR ===== */
    .app-bottom-nav {
      display: flex;
      background: var(--bg-surface-glass);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-top: 1px solid var(--border-subtle);
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 100;
      padding-bottom: env(safe-area-inset-bottom);
      height: calc(58px + env(safe-area-inset-bottom));
    }

    .bottom-nav-btn {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      cursor: pointer;
      color: var(--text-muted);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.2px;
      transition: all 0.15s ease;
    }

    .bottom-nav-btn.active {
      color: var(--pos-cyan);
    }

    .bottom-nav-btn:active {
      transform: scale(0.94);
    }

    /* ===== TOAST NOTIFICATIONS ===== */
    .pos-toast {
      position: fixed;
      top: max(env(safe-area-inset-top), 14px);
      left: 16px;
      right: 16px;
      background: var(--bg-surface-elevated);
      color: var(--text-primary);
      border: 1px solid var(--border-focus);
      padding: 14px 18px;
      border-radius: var(--radius-md);
      font-weight: 700;
      font-size: 13.5px;
      display: flex;
      align-items: center;
      gap: 10px;
      z-index: 9999;
      transform: translateY(-120%);
      opacity: 0;
      box-shadow: 0 16px 32px rgba(0, 0, 0, 0.7);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      pointer-events: none;
    }

    .pos-toast.show {
      transform: translateY(0);
      opacity: 1;
    }

    .pos-toast.success {
      border-color: var(--pos-green);
      box-shadow: 0 16px 32px rgba(0, 0, 0, 0.7), 0 0 16px var(--pos-green-glow);
    }

    .pos-toast.error {
      border-color: var(--pos-red);
      box-shadow: 0 16px 32px rgba(0, 0, 0, 0.7), 0 0 16px var(--pos-red-glow);
    }

    /* ===== LOADING SPINNER ===== */
    .pos-spinner {
      width: 28px;
      height: 28px;
      border: 3px solid var(--border-subtle);
      border-top-color: var(--pos-cyan);
      border-radius: 50%;
      animation: spinLoader 0.7s infinite linear;
    }

    @keyframes spinLoader {
      to { transform: rotate(360deg); }
    }

    .center-spinner-box {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
    }

    /* Haptic Animation on Cart */
    @keyframes hapticBounce {
      0% { transform: scale(1); }
      40% { transform: scale(1.06); }
      100% { transform: scale(1); }
    }
    .haptic-active {
      animation: hapticBounce 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
  </style>
</head>
<body>

  <!-- 1. LOGIN SCREEN -->
  <div id="loginScreen" class="login-screen">
    <div class="pos-badge-top">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
      Mobil Garson Terminali
    </div>
    
    <div class="login-brand-icon">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
        <line x1="6" y1="1" x2="6" y2="4"></line>
        <line x1="10" y1="1" x2="10" y2="4"></line>
        <line x1="14" y1="1" x2="14" y2="4"></line>
      </svg>
    </div>

    <div class="login-title">Garson Girişi</div>
    <div class="login-sub">PIN kodunuzu tuşlayarak giriş yapın</div>

    <div class="pin-display" id="pinDots">
      <div class="pin-dot"></div>
      <div class="pin-dot"></div>
      <div class="pin-dot"></div>
      <div class="pin-dot"></div>
    </div>

    <div class="numpad" id="numpad"></div>
    <div class="login-error" id="loginError"></div>
  </div>

  <!-- 2. MAIN APP SCREEN -->
  <div id="appScreen" class="app-container">
    
    <!-- Top Fixed Header -->
    <header class="app-header">
      <div class="header-left">
        <div class="live-indicator" title="Canlı Bağlantı Aktif"></div>
        <div class="header-titles">
          <div class="header-main-title" id="headerTitle">Masalar</div>
          <div class="header-staff-name" id="headerUser">Garson</div>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn-header-action" onclick="cikisYap()">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          Çıkış
        </button>
      </div>
    </header>

    <!-- Page 1: Masalar (Bölüm & Masa Listesi) -->
    <main id="pageMasalar" class="app-page active"></main>

    <!-- Page 2: Masa Detayı & Hesap Özeti -->
    <main id="pageMasaDetay" class="app-page"></main>

    <!-- Page 3: Menü & Sipariş Ekleme -->
    <main id="pageSiparis" class="app-page"></main>

    <!-- Bottom Navigation Bar -->
    <nav class="app-bottom-nav">
      <div class="bottom-nav-btn active" onclick="sayfaGit('masalar')" id="navMasalar">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
        <span>Tüm Masalar</span>
      </div>
      <div class="bottom-nav-btn" onclick="sayfaGit('acikMasalar')" id="navAcikMasalar">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        <span>Açık Masalar</span>
      </div>
    </nav>
  </div>

  <!-- 3. FLOATING SEPET BAR -->
  <div id="sepetBar" class="sepet-floating-bar hidden" onclick="sepetModalAc()">
    <div style="display:flex; align-items:center; gap:12px;">
      <div class="sepet-count-pill" id="sepetAdet">0</div>
      <div>
        <div class="sepet-floating-label">Sipariş Sepeti</div>
        <div style="font-size:11px; color:var(--text-secondary);">Mutfak siparişi için dokunun</div>
      </div>
    </div>
    <div class="sepet-floating-total" id="sepetTutar">₺0</div>
  </div>

  <!-- 4. SEPET BOTTOM SHEET MODAL -->
  <div id="sepetModalBg" class="modal-backdrop" onclick="sepetModalKapat()"></div>
  <div id="sepetModal" class="modal-sheet">
    <div class="modal-sheet-header">
      <div class="modal-sheet-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
        Gönderilecek Kalemler
      </div>
      <button class="btn-modal-close" onclick="sepetModalKapat()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    </div>

    <div class="modal-sheet-body" id="sepetListe"></div>

    <div class="modal-sheet-footer">
      <button class="btn-kitchen-send" id="btnGonder" onclick="siparisGonder()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        Mutfağa Gönder
      </button>
    </div>
  </div>

  <!-- 5. SATIS TURU (SALE TYPE) MODAL -->
  <div id="satisTuruModalBg" class="picker-modal-bg" onclick="satisTuruKapat()"></div>
  <div id="satisTuruSheet" class="picker-sheet">
    <div class="picker-header">
      <div class="picker-title" id="satisTuruTitle">Satış Türü</div>
      <button class="btn-modal-close" onclick="satisTuruKapat()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    </div>
    <div class="picker-body">
      <div class="satis-turu-grid">
        <button class="satis-turu-btn porsiyon" onclick="satisTuruPorsiyonSec()">
          <div class="satis-turu-btn-left">
            <div class="satis-turu-icon-wrap">🍽️</div>
            <div>
              <div class="satis-turu-name">Porsiyon</div>
              <div class="satis-turu-desc" id="satisTuruPorsiyonPill">1x Porsiyon</div>
            </div>
          </div>
          <div class="satis-turu-price" id="satisTuruPorsiyonFiyat">₺0</div>
        </button>

        <button class="satis-turu-btn kg" onclick="satisTuruKgSec()">
          <div class="satis-turu-btn-left">
            <div class="satis-turu-icon-wrap">⚖️</div>
            <div>
              <div class="satis-turu-name">Kilogram (KG)</div>
              <div class="satis-turu-desc">Tartılı satış (Gramaj)</div>
            </div>
          </div>
          <div class="satis-turu-price" id="satisTuruKgFiyat">₺0 / KG</div>
        </button>
      </div>
    </div>
  </div>

  <!-- 6. GRAMAJ MODAL -->
  <div id="gramajModalBg" class="picker-modal-bg" onclick="gramajKapat()"></div>
  <div id="gramajSheet" class="picker-sheet">
    <div class="picker-header">
      <div>
        <div class="picker-title" id="gramajTitle">Gramaj Belirle</div>
        <div style="font-size:12px; color:var(--pos-green); font-weight:700; margin-top:2px;" id="gramajKiloFiyat">1 KG = ₺0</div>
      </div>
      <button class="btn-modal-close" onclick="gramajKapat()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    </div>
    <div class="picker-body">
      <div class="gramaj-display-box">
        <div>
          <span class="gramaj-val-text" id="gramajValDisplay">0.500</span>
          <span class="gramaj-unit-tag">KG</span>
        </div>
        <div class="gramaj-calc-preview" id="gramajCalcPreview"></div>
      </div>

      <div class="gramaj-preset-grid">
        <button class="gramaj-preset-btn" onclick="gramajPresetSec('0.250')">250g</button>
        <button class="gramaj-preset-btn" onclick="gramajPresetSec('0.500')">500g</button>
        <button class="gramaj-preset-btn" onclick="gramajPresetSec('0.750')">750g</button>
        <button class="gramaj-preset-btn" onclick="gramajPresetSec('1.000')">1 KG</button>
        <button class="gramaj-preset-btn" onclick="gramajPresetSec('1.500')">1.5 KG</button>
        <button class="gramaj-preset-btn" onclick="gramajPresetSec('2.000')">2 KG</button>
        <button class="gramaj-preset-btn" onclick="gramajPresetSec('2.500')">2.5 KG</button>
        <button class="gramaj-preset-btn" onclick="gramajPresetSec('3.000')">3 KG</button>
      </div>

      <div class="gramaj-numpad">
        <button onclick="gramajTus('1')">1</button>
        <button onclick="gramajTus('2')">2</button>
        <button onclick="gramajTus('3')">3</button>
        <button onclick="gramajTus('4')">4</button>
        <button onclick="gramajTus('5')">5</button>
        <button onclick="gramajTus('6')">6</button>
        <button onclick="gramajTus('7')">7</button>
        <button onclick="gramajTus('8')">8</button>
        <button onclick="gramajTus('9')">9</button>
        <button onclick="gramajTus('C')" style="color:var(--pos-red);">C</button>
        <button onclick="gramajTus('0')">0</button>
        <button onclick="gramajTus(',')">,</button>
      </div>
    </div>
    <div class="picker-footer">
      <button class="btn-picker-confirm" id="btnGramajConfirm" onclick="gramajOnayla()">Sepete Ekle</button>
    </div>
  </div>

  <!-- 7. VARIATION/OPTION PICKER MODAL -->
  <div id="pickerBg" class="picker-modal-bg" onclick="pickerKapat()"></div>
  <div id="pickerSheet" class="picker-sheet">
    <div class="picker-header">
      <div class="picker-title" id="pickerTitle">Seçenekler</div>
      <button class="btn-modal-close" onclick="pickerKapat()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    </div>
    <div class="picker-body" id="pickerBody"></div>
    <div class="picker-footer">
      <button class="btn-picker-confirm" id="btnPickerConfirm" onclick="pickerOnayla()">Sepete Ekle</button>
      <button class="btn-picker-skip" id="btnPickerSkip" onclick="pickerAtla()">Seçim Yapmadan Ekle</button>
    </div>
  </div>

  <!-- TOAST NOTIFICATION -->
  <div id="toast" class="pos-toast"></div>

<script src="/socket.io/socket.io.js"></script>
<script>
const API = location.origin;
const socket = io();

// State variables
let token = null;
let kullanici = null;
let pin = '';
let masalar = [];
let menu = { kategoriler: [], urunler: [], opsiyonlar: [], varyantlar: [] };
let aktifKategori = null;
let aktifMasa = null;
let sepet = [];
let sadeceAcik = false;
let seciliBolum = null;
let aktifPorsiyon = 1;
let urunAramaMetni = '';
let pickerUrun = null;
let pickerSecimler = { opsiyonlar: [], varyant: null };
let pickerSatisTuru = 'porsiyon';
let pickerGramaj = undefined;
let aktifSatisTuruUrun = null;
let aktifGramajUrun = null;
let girilenGramaj = '0.500';
const productImageSourceCache = new Map();
const productImageState = new Map();
const productCardCache = new Map();

// Haptic feedback helper for mobile POS terminals
function triggerHaptic(duration = 15) {
  if (navigator.vibrate) {
    try { navigator.vibrate(duration); } catch(e) {}
  }
}

// Socket event listeners
socket.on('masalar:guncellendi', () => {
  if (token) {
    const pMasalar = document.getElementById('pageMasalar');
    if (pMasalar && pMasalar.classList.contains('active')) {
      masalariYukle();
    }
  }
});

socket.on('siparis:guncellendi', (hesapId, masaId) => {
  if (token && aktifMasa) {
    if (aktifMasa.hesap_id === hesapId || aktifMasa.id === masaId) {
      const pMasaDetay = document.getElementById('pageMasaDetay');
      if (pMasaDetay && pMasaDetay.classList.contains('active')) {
        masaDetayCiz(aktifMasa.id);
      }
    }
  }
});

// ===== 1. PIN AUTHENTICATION =====
function pinPadOlustur() {
  const pad = document.getElementById('numpad');
  const tuslar = ['1','2','3','4','5','6','7','8','9','C','0','⌫'];
  pad.innerHTML = tuslar.map(t => {
    const isAction = (t === 'C' || t === '⌫');
    const cls = isAction ? 'action-btn' : 'num-btn';
    const content = t === '⌫' 
      ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0 2-2z"></path><line x1="18" y1="9" x2="12" y2="15"></line><line x1="12" y1="9" x2="18" y2="15"></line></svg>' 
      : t;
    return '<button class="'+cls+'" onclick="pinTus(\\''+t+'\\')">'+content+'</button>';
  }).join('');
}

function pinGuncelle() {
  const dots = document.querySelectorAll('.pin-dot');
  dots.forEach((d, i) => {
    d.className = 'pin-dot' + (i < pin.length ? ' filled' : '');
  });
}

async function pinTus(t) {
  triggerHaptic(10);
  document.getElementById('loginError').textContent = '';
  if (t === 'C') { pin = ''; pinGuncelle(); return; }
  if (t === '⌫') { pin = pin.slice(0, -1); pinGuncelle(); return; }
  if (pin.length >= 4) return;
  pin += t;
  pinGuncelle();
  
  if (pin.length === 4) {
    try {
      const res = await fetch(API + '/api/garson/pin-giris', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ pin_kodu: pin })
      });
      const data = await res.json();
      if (data.token) {
        token = data.token;
        kullanici = data.personel;
        triggerHaptic(30);
        girisBasarili();
      } else {
        document.getElementById('loginError').textContent = data.hata || 'Geçersiz PIN Kodu';
        triggerHaptic([40, 60, 40]);
        pin = ''; pinGuncelle();
      }
    } catch(e) {
      document.getElementById('loginError').textContent = 'Sunucu bağlantı hatası';
      pin = ''; pinGuncelle();
    }
  }
}

function girisBasarili() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('appScreen').classList.add('active');
  document.getElementById('headerUser').textContent = kullanici.ad + ' ' + (kullanici.soyad || '');
  masalariYukle();
  menuYukle();
}

function cikisYap() {
  triggerHaptic(20);
  token = null;
  kullanici = null;
  pin = '';
  sepet = [];
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('appScreen').classList.remove('active');
  document.getElementById('sepetBar').classList.add('hidden');
  pinGuncelle();
}

// ===== 2. API REQUEST HELPER =====
async function apiFetch(url, opts = {}) {
  opts.headers = { ...opts.headers, 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };
  try {
    const res = await fetch(API + url, opts);
    if (res.status === 401) {
      cikisYap();
      toast('Oturum süresi doldu, tekrar giriş yapın', true);
      return null;
    }
    return await res.json();
  } catch (err) {
    toast('Bağlantı hatası', true);
    return null;
  }
}

// ===== 3. MASALAR (TABLES) =====
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
    // 1. Bölüm Seçim Görünümü
    document.getElementById('headerTitle').textContent = 'Bölümler';
    
    html += '<div class="section-header"><div class="section-tag">Restoran Alanları</div><div class="section-count">'+Object.keys(bolumler).length+' Bölüm</div></div>';
    html += '<div class="bolum-grid">';
    
    for (const [bolum, masaList] of Object.entries(bolumler)) {
      const doluSayisi = masaList.filter(m => m.durum === 'dolu').length;
      const bosSayisi = masaList.length - doluSayisi;
      
      html += '<div class="bolum-card" onclick="bolumSec(\\''+bolum+'\\')">';
      html += '  <div>';
      html += '    <div class="bolum-name">'+bolum+'</div>';
      html += '    <div style="font-size:12px; color:var(--text-secondary);">Toplam '+masaList.length+' Masa</div>';
      html += '  </div>';
      html += '  <div class="bolum-meta">';
      html += '    <span style="color:var(--pos-green);">'+bosSayisi+' Boş</span>';
      html += '    <span style="color:'+(doluSayisi > 0 ? 'var(--pos-red)' : 'var(--text-muted)')+'; font-weight:700;">'+doluSayisi+' Dolu</span>';
      html += '  </div>';
      html += '</div>';
    }
    html += '</div>';
  } else {
    // 2. Masa Grid Görünümü
    if (!sadeceAcik) {
      document.getElementById('headerTitle').textContent = seciliBolum;
      html += '<div class="masa-toolbar">';
      html += '  <button class="btn-back-square" onclick="bolumGeri()">';
      html += '    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>';
      html += '  </button>';
      html += '  <div style="font-weight:800; font-size:17px; flex:1;">'+seciliBolum+' Masaları</div>';
      html += '</div>';
    } else {
      document.getElementById('headerTitle').textContent = 'Açık Masalar';
    }

    for (const [bolum, masaList] of Object.entries(bolumler)) {
      if (seciliBolum && bolum !== seciliBolum && !sadeceAcik) continue;

      if (sadeceAcik) {
        html += '<div class="section-header"><div class="section-tag">'+bolum+'</div><div class="section-count">'+masaList.length+' Masa</div></div>';
      }

      html += '<div class="masa-grid">';
      masaList.forEach(m => {
        const isDolu = m.durum === 'dolu';
        const cls = isDolu ? 'dolu' : 'bos';
        const statusText = isDolu ? 'DOLU' : 'BOŞ';
        const tutarMetin = isDolu && m.toplam_tutar 
          ? '₺' + Number(m.toplam_tutar).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) 
          : 'Sipariş Yok';

        html += '<div class="masa-card '+cls+'" onclick="masaSec('+m.id+',\\''+m.numara+'\\','+(m.hesap_id || 'null')+')">';
        html += '  <div class="masa-top">';
        html += '    <span class="masa-num">Masa '+m.numara+'</span>';
        html += '    <span class="masa-status-pill">'+statusText+'</span>';
        html += '  </div>';
        html += '  <div class="masa-bottom">';
        html += '    <span class="masa-price">'+tutarMetin+'</span>';
        html += '  </div>';
        html += '</div>';
      });
      html += '</div>';
    }
  }

  if (html === '') {
    html = '<div style="text-align:center; padding:60px 20px; color:var(--text-muted); font-weight:600;">Gösterilecek masa bulunamadı.</div>';
  }
  document.getElementById('pageMasalar').innerHTML = html;
}

function bolumSec(b) {
  triggerHaptic(12);
  seciliBolum = b;
  masalariCiz();
}

function bolumGeri() {
  triggerHaptic(12);
  seciliBolum = null;
  masalariCiz();
}

// ===== 4. MENÜ VERİLERİ =====
async function menuYukle() {
  const data = await apiFetch('/api/garson/menu');
  if (!data) return;
  menu = {
    kategoriler: data.kategoriler || [],
    urunler: data.urunler || [],
    opsiyonlar: data.opsiyonlar || [],
    varyantlar: data.varyantlar || []
  };
}

// Masa Seçimi
async function masaSec(masaId, masaNo, hesapId) {
  triggerHaptic(15);
  aktifMasa = { id: masaId, numara: masaNo, hesap_id: hesapId };

  if (hesapId) {
    document.getElementById('headerTitle').textContent = 'Masa ' + masaNo;
    document.getElementById('pageMasaDetay').innerHTML = '<div class="center-spinner-box"><div class="pos-spinner"></div></div>';
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

// ===== 5. MASA DETAY (HESAP ÖZETİ) =====
async function masaDetayCiz(masaId) {
  const res = await apiFetch('/api/garson/masa/' + masaId);
  if (!res || !res.hesap) {
    masalaraGeri();
    return;
  }

  const { hesap, siparisler } = res;

  let html = '<div class="masa-toolbar">';
  html += '  <button class="btn-back-square" onclick="masalaraGeri()">';
  html += '    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>';
  html += '  </button>';
  html += '  <div style="font-weight:800; font-size:17px; flex:1;">Hesap Detayı</div>';
  html += '</div>';

  html += '<div class="detay-summary-card">';
  html += '  <div class="detay-summary-row" style="margin-bottom:8px;">';
  html += '    <span class="detay-summary-title">Hesap No</span>';
  html += '    <span style="font-size:12px; font-weight:700; color:var(--text-secondary); background:var(--bg-base); padding:3px 8px; border-radius:6px; border:1px solid var(--border-subtle);">#'+hesap.hesap_no+'</span>';
  html += '  </div>';
  html += '  <div class="detay-summary-row">';
  html += '    <span class="detay-summary-title">Masa Toplamı</span>';
  html += '    <span class="detay-summary-total">₺'+Number(hesap.toplam_tutar).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })+'</span>';
  html += '  </div>';
  html += '</div>';

  html += '<button class="btn-new-order-add" onclick="siparisEkleyeGec()">';
  html += '  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>';
  html += '  Masaya Yeni Sipariş Ekle';
  html += '</button>';

  if (siparisler && siparisler.length > 0) {
    html += '<div class="section-header"><div class="section-tag">Açık Siparişler</div><div class="section-count">'+siparisler.length+' Kalem</div></div>';
    html += '<div class="siparis-items-list">';
    
    siparisler.forEach(s => {
      const isIptal = s.durum === 'iptal';
      const iptalCls = isIptal ? 'iptal' : '';
      const statusCls = s.durum === 'bekliyor' ? 'status-bekliyor' : (s.durum === 'hazir' ? 'status-hazir' : 'status-diger');
      const ikramEtiketi = s.ikram ? '<span style="background:var(--pos-purple); color:white; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:800; margin-left:6px;">İKRAM</span>' : '';
      const porsiyonMetin = (s.porsiyon && s.porsiyon !== 1) ? ((s.porsiyon === 0.5 ? '(0.5 Porsiyon) ' : (s.porsiyon === 2 ? '(Double) ' : '(' + s.porsiyon + ' Porsiyon) '))) : '';

      html += '<div class="siparis-item-row '+iptalCls+'">';
      html += '  <div class="siparis-left-info">';
      html += '    <div class="siparis-item-title"><span class="siparis-item-qty">'+s.miktar+' '+(s.urun_birim || 'Adet')+'</span> '+porsiyonMetin+s.urun_adi+ikramEtiketi+'</div>';
      if (s.notlar) {
        html += '  <div class="siparis-item-note"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg> '+s.notlar+'</div>';
      }

      if (!isIptal) {
        html += '  <div class="siparis-actions-inline">';
        html += '    <button class="btn-table-action '+(s.ikram ? 'ikram-on' : '')+'" onclick="siparisIkramDurumu('+s.id+','+(s.ikram ? 'false' : 'true')+')">';
        html += '      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line></svg>';
        html += '      '+(s.ikram ? 'İkramı Kaldır' : 'İkram');
        html += '    </button>';
        html += '    <button class="btn-table-action cancel-btn" onclick="siparisIptalEkrani('+s.id+', \\''+s.urun_adi.replace(/'/g, "\\\\'")+'\\')">';
        html += '      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
        html += '      İptal';
        html += '    </button>';
        html += '  </div>';
      }

      html += '  </div>';
      html += '  <div class="siparis-right-info">';
      html += '    <div class="siparis-price-text" '+(s.ikram ? 'style="text-decoration:line-through; color:var(--text-muted);"' : '')+'>₺'+s.toplam_fiyat+'</div>';
      html += '    <div class="siparis-status-badge '+statusCls+'">'+s.durum+'</div>';
      html += '  </div>';
      html += '</div>';
    });

    html += '</div>';
  } else {
    html += '<div style="text-align:center; padding:40px 20px; color:var(--text-muted); font-weight:600;">Bu masada henüz sipariş bulunmuyor.</div>';
  }

  document.getElementById('pageMasaDetay').innerHTML = html;
}

function siparisEkleyeGec() {
  triggerHaptic(15);
  document.getElementById('headerTitle').textContent = 'Masa ' + aktifMasa.numara;
  sepet = [];
  sepetGuncelle();
  siparisEkraniCiz();
  sayfaGit('siparis');
}

// ===== 6. SİPARİŞ GİRİŞİ (ORDER CATALOG & TABS) =====
function siparisEkraniCiz() {
  if (!menu.kategoriler.length) return;
  if (!aktifKategori) aktifKategori = menu.kategoriler[0].id;

  const geriFonksiyon = aktifMasa.hesap_id 
    ? "sayfaGit('masaDetay'); document.getElementById('headerTitle').textContent='Masa '+aktifMasa.numara;" 
    : "masalaraGeri()";

  let html = '<div class="masa-toolbar">';
  html += '  <button class="btn-back-square" onclick="'+geriFonksiyon+'">';
  html += '    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>';
  html += '  </button>';
  html += '  <div style="font-weight:800; font-size:17px; flex:1;">Sipariş Al (Masa '+aktifMasa.numara+')</div>';
  html += '</div>';

  // Hızlı Ürün Arama Çubuğu
  html += '<div class="search-filter-bar">';
  html += '  <span class="search-icon-pos"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></span>';
  html += '  <input class="search-input" id="menuSearchInput" placeholder="Menüde ürün ara..." value="'+urunAramaMetni+'" oninput="urunAra(this.value)">';
  html += '</div>';

  // Kategori Yatay Sekmeleri
  if (!urunAramaMetni.trim()) {
    html += '<div class="kategori-pills-container">';
    menu.kategoriler.forEach(k => {
      const cls = k.id === aktifKategori ? 'active' : '';
      html += '<button class="kategori-pill '+cls+'" onclick="kategoriSec('+k.id+')">'+k.ad+'</button>';
    });
    html += '</div>';
  }

  // Porsiyon Seçici Kontrolü
  html += '<div class="porsiyon-control">';
  [0.5, 1, 1.5, 2].forEach(p => {
    const label = p === 0.5 ? '0.5 (Yarım)' : (p === 1 ? '1 Porsiyon' : (p === 1.5 ? '1.5 Porsiyon' : '2 (Double)'));
    const act = aktifPorsiyon === p ? 'active' : '';
    html += '<button class="porsiyon-btn '+act+'" onclick="porsiyonSec('+p+')">'+label+'</button>';
  });
  html += '</div>';

  // Ürün Filtreleme
  let gosterilecekUrunler = menu.urunler;
  if (urunAramaMetni.trim()) {
    const q = urunAramaMetni.toLowerCase();
    gosterilecekUrunler = gosterilecekUrunler.filter(u => u.ad.toLowerCase().includes(q));
  } else {
    gosterilecekUrunler = gosterilecekUrunler.filter(u => u.kategori_id === aktifKategori);
  }

  if (gosterilecekUrunler.length > 0) {
    html += '<div id="urunCatalogGrid" class="urun-catalog-grid"></div>';
  } else {
    html += '<div style="text-align:center; padding:40px 20px; color:var(--text-muted); font-weight:600;">Eşleşen ürün bulunamadı.</div>';
  }

  document.getElementById('pageSiparis').innerHTML = html;
  if (gosterilecekUrunler.length > 0) renderProductCards(gosterilecekUrunler);
}

function urunAra(val) {
  urunAramaMetni = val;
  siparisEkraniCiz();
}

function kategoriSec(id) {
  triggerHaptic(10);
  aktifKategori = id;
  siparisEkraniCiz();
}

function porsiyonSec(p) {
  triggerHaptic(10);
  aktifPorsiyon = p;
  siparisEkraniCiz();
}

function masalaraGeri() {
  triggerHaptic(12);
  sayfaGit('masalar');
  document.getElementById('headerTitle').textContent = 'Masalar';
  aktifMasa = null;
  masalariYukle();
}

// ===== 7. ÜRÜN GÖRSELLERİ (PERSISTENT CARD & IMAGE CACHE) =====
function getProductImageSrc(urun) {
  const source = typeof urun.resim_yolu === 'string' ? urun.resim_yolu : '';
  if (!source || !source.trim()) return '';

  // QR Menü ile aynı yol formatını kullan; yalnızca aynı kaynak stringini bellekte sabitle.
  if (!productImageSourceCache.has(source)) productImageSourceCache.set(source, source);
  return productImageSourceCache.get(source);
}

function markProductImageLoaded(img, source) {
  productImageState.set(source, 'loaded');
  img.classList.remove('failed');
  img.classList.add('loaded');
  img.style.display = 'block';
  img.style.opacity = '1';
}

function handleProductImageError(img, source) {
  // Mevcut, doğrulanmış bir görsel için geç gelen/geçersiz hata olayını yok say.
  if (productImageState.get(source) === 'loaded' || img.dataset.imageSource !== source) return;

  productImageState.set(source, 'failed');
  img.classList.remove('loaded');
  img.classList.add('failed');
}

// ===== 7. ÜRÜN VE ÇOKLU SATIŞ TÜRÜ HELPERLARI =====
function getUrunSatisTurleri(urun) {
  if (!urun) return [];
  let turler = [];
  if (typeof urun.satis_turleri === 'string') {
    try { turler = JSON.parse(urun.satis_turleri); } catch(e) { turler = []; }
  } else if (Array.isArray(urun.satis_turleri)) {
    turler = urun.satis_turleri;
  }
  if ((!turler || turler.length === 0) && (urun.porsiyon_fiyati || urun.kilo_fiyati)) {
    turler = [];
    if (urun.porsiyon_fiyati) turler.push({ birim: 'porsiyon', fiyat: Number(urun.porsiyon_fiyati) });
    if (urun.kilo_fiyati) turler.push({ birim: 'kg', fiyat: Number(urun.kilo_fiyati) });
  }
  if (!turler || turler.length === 0) {
    const birim = (urun.birim || 'porsiyon').toLowerCase();
    turler = [{ birim: birim === 'kg' ? 'kg' : (birim === 'adet' ? 'adet' : 'porsiyon'), fiyat: Number(urun.fiyat) || 0 }];
  }
  return turler.filter(t => t && t.fiyat !== undefined && t.fiyat !== null);
}

function hasCokluSatisTuru(urun) {
  if (!urun) return false;
  const turler = getUrunSatisTurleri(urun);
  if (turler.length > 1) return true;
  if (urun.kilo_fiyati && urun.fiyat && Number(urun.kilo_fiyati) !== Number(urun.fiyat)) return true;
  return false;
}

function getUrunKiloFiyati(urun) {
  if (!urun) return 0;
  if (urun.kilo_fiyati) return Number(urun.kilo_fiyati);
  const turler = getUrunSatisTurleri(urun);
  const kgTur = turler.find(t => {
    const b = (t.birim || '').trim().toLowerCase();
    return b === 'kg' || b === 'kilo';
  });
  if (kgTur) return Number(kgTur.fiyat);
  if ((urun.birim || '').trim().toLowerCase() === 'kg') return Number(urun.fiyat) || 0;
  return Number(urun.fiyat) || 0;
}

function getUrunPorsiyonFiyati(urun) {
  if (!urun) return 0;
  if (urun.porsiyon_fiyati) return Number(urun.porsiyon_fiyati);
  const turler = getUrunSatisTurleri(urun);
  const porsTur = turler.find(t => {
    const b = (t.birim || '').trim().toLowerCase();
    return b === 'porsiyon' || b === 'adet';
  });
  if (porsTur) return Number(porsTur.fiyat);
  return Number(urun.fiyat) || 0;
}

function isTartiliUrun(urun) {
  const birimUpper = (urun.birim || '').toUpperCase();
  return ['KG', 'GRAM', 'GR', 'LITRE', 'LT', 'L'].includes(birimUpper);
}

function formatSatisTurleri(urun, porsiyonCarpan) {
  if (!urun) return '0 ₺';
  const p = porsiyonCarpan || 1;
  const turler = getUrunSatisTurleri(urun);
  const formatBirim = (b) => {
    const s = (b || '').trim().toLowerCase();
    if (s === 'kg' || s === 'kilo') return 'KG';
    if (s === 'porsiyon') return 'Porsiyon';
    if (s === 'adet') return 'Adet';
    if (s === 'gram' || s === 'gr') return 'Gram';
    return b ? b.charAt(0).toUpperCase() + b.slice(1) : 'Porsiyon';
  };
  return turler
    .map(t => {
      const isPors = (t.birim || '').toLowerCase() === 'porsiyon';
      const fiyat = Math.round((Number(t.fiyat) || 0) * (isPors ? p : 1));
      return formatBirim(t.birim) + ': ' + fiyat + ' ₺';
    })
    .join(' | ');
}

function onProductCardClick(urunId) {
  triggerHaptic(15);
  const urun = menu.urunler.find(u => u.id === urunId);
  if (!urun) return;

  const coklu = hasCokluSatisTuru(urun);
  const tartili = isTartiliUrun(urun);
  const urunOps = (menu.opsiyonlar || []).filter(o => o.urun_id === urunId);
  const urunVar = (menu.varyantlar || []).filter(v => v.urun_id === urunId);
  const hasExtras = urunOps.length > 0 || urunVar.length > 0;

  if (coklu) {
    satisTuruSecimAc(urunId);
  } else if (tartili) {
    gramajSecimAc(urunId);
  } else if (hasExtras) {
    urunSecimAc(urunId, 'porsiyon');
  } else {
    sepeteEkle(urunId, urun.ad, getUrunPorsiyonFiyati(urun), urun.birim || 'Porsiyon', 'porsiyon');
  }
}

function createProductCard(urun, source, signature) {
  const urunOps = (menu.opsiyonlar || []).filter(o => o.urun_id === urun.id);
  const urunVar = (menu.varyantlar || []).filter(v => v.urun_id === urun.id);
  const hasExtras = urunOps.length > 0 || urunVar.length > 0;
  const coklu = hasCokluSatisTuru(urun);

  const card = document.createElement('div');
  card.className = 'urun-pos-card ' + (source ? 'has-img' : 'no-img');
  card.dataset.signature = signature;
  card.onclick = null;
  card.setAttribute('onclick', 'onProductCardClick(' + urun.id + ')');

  let badge = '';
  if (coklu) {
    badge = '<span class="urun-varyant-badge" title="Porsiyon / KG Seçenekleri">⚖️</span>';
  } else if (hasExtras) {
    badge = '<span class="urun-varyant-badge" title="Opsiyon/Varyant mevcut">⚙</span>';
  }

  let cardHtml = badge;
  if (source) {
    cardHtml += '<div class="urun-thumb-wrap">';
    cardHtml += '<div class="urun-thumb-placeholder"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg></div>';
    cardHtml += '<img alt="'+urun.ad+'" loading="lazy" decoding="async">';
    cardHtml += '</div>';
  }
  cardHtml += '<div class="urun-card-body"><div class="urun-pos-title">'+urun.ad+'</div><div class="urun-pos-bottom"><span class="urun-pos-price"></span></div></div>';
  card.innerHTML = cardHtml;

  if (source) {
    const img = card.querySelector('img');
    img.dataset.imageSource = source;
    img.onload = () => markProductImageLoaded(img, source);
    img.onerror = () => handleProductImageError(img, source);
    if (productImageState.get(source) === 'loaded') markProductImageLoaded(img, source);
    if (productImageState.get(source) !== 'failed') img.src = source;
    else img.classList.add('failed');
  }

  return card;
}

function renderProductCards(urunler) {
  const grid = document.getElementById('urunCatalogGrid');
  if (!grid) return;

  urunler.forEach(urun => {
    const source = getProductImageSrc(urun);
    const signature = [urun.ad, urun.fiyat, urun.birim || 'Adet', urun.satis_turleri || '', source, (menu.opsiyonlar || []).filter(o => o.urun_id === urun.id).length, (menu.varyantlar || []).filter(v => v.urun_id === urun.id).length].join('|');
    let card = productCardCache.get(urun.id);
    if (!card || card.dataset.signature !== signature) {
      card = createProductCard(urun, source, signature);
      productCardCache.set(urun.id, card);
    }

    card.querySelector('.urun-pos-price').textContent = formatSatisTurleri(urun, aktifPorsiyon);
    grid.appendChild(card);
  });
}

// ===== 8. SATIS TURU SEÇİMİ (PORSIYON / KG MODALI) =====
function satisTuruSecimAc(urunId) {
  triggerHaptic(15);
  const urun = menu.urunler.find(u => u.id === urunId);
  if (!urun) return;
  aktifSatisTuruUrun = urun;

  const porsiyonFiyat = getUrunPorsiyonFiyati(urun) * aktifPorsiyon;
  const kiloFiyat = getUrunKiloFiyati(urun);

  document.getElementById('satisTuruTitle').textContent = urun.ad;
  document.getElementById('satisTuruPorsiyonFiyat').textContent = '₺' + porsiyonFiyat.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  document.getElementById('satisTuruPorsiyonPill').textContent = aktifPorsiyon !== 1 ? (aktifPorsiyon + 'x Porsiyon') : '1x Porsiyon';
  document.getElementById('satisTuruKgFiyat').textContent = '₺' + kiloFiyat.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' / KG';

  document.getElementById('satisTuruModalBg').classList.add('active');
  setTimeout(() => document.getElementById('satisTuruSheet').classList.add('active'), 10);
}

function satisTuruKapat() {
  document.getElementById('satisTuruSheet').classList.remove('active');
  setTimeout(() => document.getElementById('satisTuruModalBg').classList.remove('active'), 250);
  aktifSatisTuruUrun = null;
}

function satisTuruPorsiyonSec() {
  triggerHaptic(15);
  if (!aktifSatisTuruUrun) return;
  const u = aktifSatisTuruUrun;
  satisTuruKapat();

  const urunOps = (menu.opsiyonlar || []).filter(o => o.urun_id === u.id);
  const urunVar = (menu.varyantlar || []).filter(v => v.urun_id === u.id);
  const hasExtras = urunOps.length > 0 || urunVar.length > 0;

  if (hasExtras) {
    urunSecimAc(u.id, 'porsiyon');
  } else {
    sepeteEkle(u.id, u.ad, getUrunPorsiyonFiyati(u), u.birim || 'Porsiyon', 'porsiyon');
  }
}

function satisTuruKgSec() {
  triggerHaptic(15);
  if (!aktifSatisTuruUrun) return;
  const u = aktifSatisTuruUrun;
  satisTuruKapat();
  gramajSecimAc(u.id);
}

// ===== 9. GRAMAJ SEÇİMİ VE NUMPAD MODALI =====
function gramajSecimAc(urunId) {
  triggerHaptic(15);
  const urun = menu.urunler.find(u => u.id === urunId);
  if (!urun) return;
  aktifGramajUrun = urun;
  girilenGramaj = '0.500';

  document.getElementById('gramajTitle').textContent = urun.ad;
  document.getElementById('gramajKiloFiyat').textContent = '1 KG = ₺' + getUrunKiloFiyati(urun).toLocaleString('tr-TR');
  
  gramajGostergeGuncelle();

  document.getElementById('gramajModalBg').classList.add('active');
  setTimeout(() => document.getElementById('gramajSheet').classList.add('active'), 10);
}

function gramajKapat() {
  document.getElementById('gramajSheet').classList.remove('active');
  setTimeout(() => document.getElementById('gramajModalBg').classList.remove('active'), 250);
  aktifGramajUrun = null;
}

function gramajGostergeGuncelle() {
  const parsed = parseFloat(girilenGramaj.replace(',', '.')) || 0;
  const kiloFiyati = getUrunKiloFiyati(aktifGramajUrun);
  const total = kiloFiyati * parsed;

  document.getElementById('gramajValDisplay').textContent = girilenGramaj || '0';
  document.getElementById('gramajCalcPreview').innerHTML = parsed > 0
    ? '<span style="color:var(--text-secondary);">' + parsed + ' KG × ₺' + kiloFiyati.toLocaleString('tr-TR') + ' = </span><span style="color:var(--pos-green); font-weight:800; font-size:15px;"> ₺' + total.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + '</span>'
    : '<span style="color:var(--text-muted);">Gramaj giriniz</span>';
  
  document.getElementById('btnGramajConfirm').textContent = parsed > 0
    ? 'Sepete Ekle (₺' + total.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ')'
    : 'Sepete Ekle';
}

function gramajTus(t) {
  triggerHaptic(10);
  if (t === 'C') {
    girilenGramaj = '0';
  } else if (t === '⌫') {
    girilenGramaj = girilenGramaj.slice(0, -1);
    if (!girilenGramaj) girilenGramaj = '0';
  } else if (t === ',' || t === '.') {
    if (!girilenGramaj.includes('.')) {
      girilenGramaj = (girilenGramaj || '0') + '.';
    }
  } else {
    girilenGramaj = (girilenGramaj === '0' || girilenGramaj === '0.000') ? t : girilenGramaj + t;
  }
  gramajGostergeGuncelle();
}

function gramajPresetSec(val) {
  triggerHaptic(10);
  girilenGramaj = val;
  gramajGostergeGuncelle();
}

function gramajOnayla() {
  triggerHaptic(15);
  if (!aktifGramajUrun) return;
  const parsed = parseFloat(girilenGramaj.replace(',', '.'));
  if (isNaN(parsed) || parsed <= 0) {
    toast('Lütfen geçerli bir gramaj girin', true);
    return;
  }
  const u = aktifGramajUrun;
  gramajKapat();

  const urunOps = (menu.opsiyonlar || []).filter(o => o.urun_id === u.id);
  const urunVar = (menu.varyantlar || []).filter(v => v.urun_id === u.id);
  const hasExtras = urunOps.length > 0 || urunVar.length > 0;

  if (hasExtras) {
    urunSecimAc(u.id, 'kg', parsed);
  } else {
    sepeteEkleKg(u.id, u.ad, getUrunKiloFiyati(u), parsed);
  }
}

// ===== 10. VARYASYON / OPSİYON MODALI =====
function urunSecimAc(urunId, satisTuru = 'porsiyon', gramaj = undefined) {
  triggerHaptic(15);
  const urun = menu.urunler.find(u => u.id === urunId);
  if (!urun) return;

  pickerUrun = urun;
  pickerSatisTuru = satisTuru || 'porsiyon';
  pickerGramaj = gramaj;
  pickerSecimler = { opsiyonlar: [], varyant: null };

  const urunOps = (menu.opsiyonlar || []).filter(o => o.urun_id === urunId);
  const urunVar = (menu.varyantlar || []).filter(v => v.urun_id === urunId);

  const baslikEk = satisTuru === 'kg' && gramaj ? ' (' + gramaj + ' KG)' : '';
  document.getElementById('pickerTitle').textContent = urun.ad + baslikEk;

  let html = '';

  // Varyantlar (radio: tek seçim)
  if (urunVar.length > 0) {
    html += '<div class="picker-section-label">Varyant Seçimi</div>';
    html += '<div class="picker-option-grid">';
    urunVar.forEach(v => {
      const farkMetin = v.fiyat_farki > 0 ? '+₺'+Number(v.fiyat_farki).toFixed(0) : (v.fiyat_farki < 0 ? '-₺'+Math.abs(v.fiyat_farki).toFixed(0) : '');
      html += '<button class="picker-option-btn" data-type="varyant" data-id="'+v.id+'" data-ad="'+v.ad+'" data-fark="'+(v.fiyat_farki||0)+'" onclick="pickerVaryantSec(this)">';
      html += v.ad;
      if (farkMetin) html += ' <span class="picker-option-price">'+farkMetin+'</span>';
      html += '</button>';
    });
    html += '</div>';
  }

  // Opsiyonlar (multi-select)
  if (urunOps.length > 0) {
    html += '<div class="picker-section-label">Opsiyonlar'+(urunOps.length > 1 ? ' (birden fazla seçilebilir)' : '')+'</div>';
    html += '<div class="picker-option-grid">';
    urunOps.forEach(o => {
      const fiyatMetin = o.fiyat > 0 ? '+₺'+Number(o.fiyat).toFixed(0) : '';
      html += '<button class="picker-option-btn" data-type="opsiyon" data-id="'+o.id+'" data-ad="'+o.ad+'" data-fiyat="'+(o.fiyat||0)+'" onclick="pickerOpsiyonSec(this)">';
      html += o.ad;
      if (fiyatMetin) html += ' <span class="picker-option-price">'+fiyatMetin+'</span>';
      html += '</button>';
    });
    html += '</div>';
  }

  document.getElementById('pickerBody').innerHTML = html;

  // Show modal
  document.getElementById('pickerBg').classList.add('active');
  setTimeout(() => document.getElementById('pickerSheet').classList.add('active'), 10);
}

function pickerVaryantSec(btn) {
  triggerHaptic(10);
  document.querySelectorAll('#pickerBody .picker-option-btn[data-type="varyant"]').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  pickerSecimler.varyant = {
    id: parseInt(btn.dataset.id),
    ad: btn.dataset.ad,
    fiyat_farki: parseFloat(btn.dataset.fark || 0)
  };
}

function pickerOpsiyonSec(btn) {
  triggerHaptic(10);
  btn.classList.toggle('selected');
  const id = parseInt(btn.dataset.id);
  const idx = pickerSecimler.opsiyonlar.findIndex(o => o.id === id);
  if (idx >= 0) {
    pickerSecimler.opsiyonlar.splice(idx, 1);
  } else {
    pickerSecimler.opsiyonlar.push({
      id,
      ad: btn.dataset.ad,
      fiyat: parseFloat(btn.dataset.fiyat || 0)
    });
  }
}

function pickerOnayla() {
  triggerHaptic(15);
  if (!pickerUrun) return;

  const u = pickerUrun;
  const isKg = pickerSatisTuru === 'kg';
  let notParts = [];

  // Build note from selections
  if (pickerSecimler.varyant) {
    notParts.push(pickerSecimler.varyant.ad);
  }
  pickerSecimler.opsiyonlar.forEach(o => notParts.push(o.ad));

  // Calculate extra price
  let ekFiyat = 0;
  if (pickerSecimler.varyant) ekFiyat += pickerSecimler.varyant.fiyat_farki;
  pickerSecimler.opsiyonlar.forEach(o => { ekFiyat += o.fiyat; });

  const notStr = notParts.join(', ');

  if (isKg) {
    const kiloFiyati = getUrunKiloFiyati(u) + ekFiyat;
    sepeteEkleKg(u.id, u.ad + (notStr ? ' ('+notStr+')' : ''), kiloFiyati, pickerGramaj || 1, notStr);
  } else {
    const porsiyonFiyati = getUrunPorsiyonFiyati(u) + ekFiyat;
    sepeteEkleDetayli(u.id, u.ad + (notStr ? ' ('+notStr+')' : ''), porsiyonFiyati, u.birim || 'Porsiyon', notStr);
  }

  pickerKapat();
}

function pickerAtla() {
  triggerHaptic(10);
  if (!pickerUrun) return;
  const u = pickerUrun;
  if (pickerSatisTuru === 'kg') {
    sepeteEkleKg(u.id, u.ad, getUrunKiloFiyati(u), pickerGramaj || 1);
  } else {
    sepeteEkle(u.id, u.ad, getUrunPorsiyonFiyati(u), u.birim || 'Porsiyon', 'porsiyon');
  }
  pickerKapat();
}

function pickerKapat() {
  document.getElementById('pickerSheet').classList.remove('active');
  setTimeout(() => document.getElementById('pickerBg').classList.remove('active'), 250);
  pickerUrun = null;
  pickerSatisTuru = 'porsiyon';
  pickerGramaj = undefined;
}

// ===== 11. SEPET STATE & HESAPLAMA =====
function sepeteEkleKg(urunId, ad, kiloFiyati, gramaj, notlar) {
  triggerHaptic(15);
  const mevcut = sepet.find(s => s.urun_id === urunId && s.secilenSatisTuru === 'kg' && s.gramaj === gramaj && !s.notlar && !s.ikram);
  if (mevcut) {
    mevcut.miktar += 1;
  } else {
    sepet.push({
      id: Math.random().toString(36).substring(7),
      urun_id: urunId,
      ad: ad,
      fiyat: kiloFiyati,
      kilo_fiyati: kiloFiyati,
      birim: 'KG',
      miktar: 1,
      notlar: notlar || '',
      ikram: false,
      porsiyon: 1,
      secilenSatisTuru: 'kg',
      gramaj: gramaj
    });
  }

  sepetGuncelle();
  const bar = document.getElementById('sepetBar');
  bar.classList.remove('haptic-active');
  void bar.offsetWidth;
  bar.classList.add('haptic-active');
  toast(gramaj + ' KG ' + ad + ' eklendi');
}

function sepeteEkleDetayli(urunId, ad, fiyat, birim, notlar) {
  triggerHaptic(15);
  sepet.push({
    id: Math.random().toString(36).substring(7),
    urun_id: urunId,
    ad: ad,
    fiyat: fiyat,
    kilo_fiyati: getUrunKiloFiyati(menu.urunler.find(u => u.id === urunId)),
    birim: birim || 'Porsiyon',
    miktar: 1,
    notlar: notlar || '',
    ikram: false,
    porsiyon: aktifPorsiyon,
    secilenSatisTuru: 'porsiyon',
    gramaj: undefined
  });

  sepetGuncelle();
  const bar = document.getElementById('sepetBar');
  bar.classList.remove('haptic-active');
  void bar.offsetWidth;
  bar.classList.add('haptic-active');
  toast(ad + ' eklendi');
}

function sepeteEkle(urunId, ad, fiyat, birim, satisTuru = 'porsiyon') {
  triggerHaptic(15);
  const mevcut = sepet.find(s => s.urun_id === urunId && s.secilenSatisTuru !== 'kg' && !s.notlar && !s.ikram && s.porsiyon === aktifPorsiyon);
  if (mevcut) {
    mevcut.miktar += 1;
  } else {
    sepet.push({
      id: Math.random().toString(36).substring(7),
      urun_id: urunId,
      ad: ad,
      fiyat: fiyat,
      kilo_fiyati: getUrunKiloFiyati(menu.urunler.find(u => u.id === urunId)),
      birim: birim || 'Porsiyon',
      miktar: 1,
      notlar: '',
      ikram: false,
      porsiyon: aktifPorsiyon,
      secilenSatisTuru: satisTuru || 'porsiyon',
      gramaj: undefined
    });
  }

  sepetGuncelle();
  const bar = document.getElementById('sepetBar');
  bar.classList.remove('haptic-active');
  void bar.offsetWidth;
  bar.classList.add('haptic-active');

  toast(ad + ' eklendi');
}

function sepetGuncelle() {
  const adet = sepet.reduce((a, s) => a + s.miktar, 0);
  const tutar = sepet.reduce((a, s) => {
    if (s.ikram) return a;
    if (s.secilenSatisTuru === 'kg' || s.birim?.toLowerCase() === 'kg') {
      const kFiyat = s.kilo_fiyati || s.fiyat;
      const gr = s.gramaj || 1;
      return a + ((kFiyat * gr) * s.miktar);
    } else {
      return a + (s.fiyat * s.miktar * (s.porsiyon || 1));
    }
  }, 0);
  
  document.getElementById('sepetAdet').textContent = adet;
  document.getElementById('sepetTutar').textContent = '₺' + tutar.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  if (adet > 0) {
    document.getElementById('sepetBar').classList.remove('hidden');
  } else {
    document.getElementById('sepetBar').classList.add('hidden');
    sepetModalKapat();
  }
}

function sepetModalAc() {
  triggerHaptic(15);
  document.getElementById('sepetModalBg').classList.add('active');
  setTimeout(() => document.getElementById('sepetModal').classList.add('active'), 10);
  sepetListeCiz();
}

function sepetModalKapat() {
  triggerHaptic(12);
  document.getElementById('sepetModal').classList.remove('active');
  setTimeout(() => document.getElementById('sepetModalBg').classList.remove('active'), 250);
}

function sepetListeCiz() {
  let html = '';
  
  // Sık Kullanılan Hazır Not Çipleri
  const hazirNotlar = ['Acısız', 'Az Pişmiş', 'Çok Pişmiş', 'Buzsuz', 'Paket', 'Alerji', 'Sossuz', 'Sıcak'];

  sepet.forEach((s) => {
    const isKg = s.secilenSatisTuru === 'kg' || s.birim?.toLowerCase() === 'kg';
    const ikramEtiketi = s.ikram ? '<span style="background:var(--pos-purple); color:white; padding:2px 6px; border-radius:4px; font-size:10px; margin-left:6px; font-weight:800;">İKRAM</span>' : '';
    
    let urunBaslik = '';
    let birimFiyat = 0;
    let toplamFiyat = 0;

    if (isKg) {
      const gr = s.gramaj || 1;
      const kFiyat = s.kilo_fiyati || s.fiyat;
      birimFiyat = kFiyat * gr;
      toplamFiyat = birimFiyat * s.miktar;
      urunBaslik = '<span style="background:rgba(16, 185, 129, 0.2); color:var(--pos-green); border:1px solid rgba(16, 185, 129, 0.4); padding:2px 6px; border-radius:4px; font-size:11px; font-weight:800; margin-right:6px;">' + gr + ' KG</span>' + s.ad;
    } else {
      birimFiyat = s.fiyat * (s.porsiyon || 1);
      toplamFiyat = birimFiyat * s.miktar;
      const porsiyonMetin = (s.porsiyon && s.porsiyon !== 1) ? ((s.porsiyon === 0.5 ? '(0.5 Porsiyon) ' : (s.porsiyon === 2 ? '(Double) ' : '(' + s.porsiyon + ' Porsiyon) '))) : '';
      urunBaslik = (porsiyonMetin ? '<span style="background:rgba(14, 165, 233, 0.2); color:var(--pos-cyan); border:1px solid rgba(14, 165, 233, 0.4); padding:2px 6px; border-radius:4px; font-size:11px; font-weight:800; margin-right:6px;">' + porsiyonMetin + '</span>' : '') + s.ad;
    }

    const fiyatMetni = s.ikram 
      ? '<span style="text-decoration:line-through; color:var(--text-muted);">₺' + toplamFiyat.toFixed(0) + '</span>' 
      : '₺' + toplamFiyat.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    const birimAltMetin = isKg 
      ? (s.miktar + ' Adet × ₺' + birimFiyat.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }))
      : (s.miktar + ' ' + (s.birim || 'Porsiyon') + ' × ₺' + birimFiyat.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }));

    html += '<div class="sepet-cart-item">';
    html += '  <div class="sepet-item-head">';
    html += '    <div class="sepet-item-name">' + urunBaslik + ikramEtiketi + '</div>';
    html += '    <div style="text-align:right;">';
    html += '      <div class="sepet-item-price">' + fiyatMetni + '</div>';
    html += '      <div style="font-size:11px; color:var(--text-muted); font-weight:600;">' + birimAltMetin + '</div>';
    html += '    </div>';
    html += '  </div>';

    html += '  <div class="sepet-item-controls">';
    html += '    <div class="sepet-stepper">';
    html += '      <button class="btn-stepper" onclick="sepetMiktar(\\''+s.id+'\\', -1)">−</button>';
    html += '      <span class="stepper-val" onclick="sepetMiktarPrompt(\\''+s.id+'\\', \\''+(s.birim || 'Adet')+'\\')">'+s.miktar+'</span>';
    html += '      <button class="btn-stepper" onclick="sepetMiktar(\\''+s.id+'\\', 1)">+</button>';
    html += '    </div>';

    html += '    <input class="sepet-item-note-input" id="not_input_'+s.id+'" placeholder="Not (Örn: Az tuzlu)" value="'+(s.notlar || '')+'" onchange="sepetNotGuncelle(this, \\''+s.id+'\\')">';
    
    html += '    <button class="btn-cart-ikram '+(s.ikram ? 'active' : '')+'" onclick="sepetIkramTetikle(\\''+s.id+'\\')">';
    html += '      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line></svg>';
    html += '      İkram';
    html += '    </button>';
    html += '  </div>';

    // Hızlı Not Çipleri
    html += '  <div class="quick-notes-bar">';
    hazirNotlar.forEach(n => {
      html += '  <button class="quick-note-chip" onclick="hazirNotEkle(\\''+s.id+'\\', \\''+n+'\\')">'+n+'</button>';
    });
    html += '  </div>';

    html += '</div>';
  });

  if (!sepet.length) {
    html = '<div style="text-align:center; color:var(--text-muted); padding:40px; font-weight:600;">Sepetiniz henüz boş</div>';
  }

  document.getElementById('sepetListe').innerHTML = html;
}

function hazirNotEkle(id, notMetni) {
  triggerHaptic(10);
  const inputEl = document.getElementById('not_input_' + id);
  if (!inputEl) return;
  const mevcut = inputEl.value.trim();
  inputEl.value = mevcut ? (mevcut + ', ' + notMetni) : notMetni;
  sepetNotGuncelle(inputEl, id);
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

function sepetIkramTetikle(id) {
  triggerHaptic(15);
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
  triggerHaptic(10);
  const idx = sepet.findIndex(s => s.id === id);
  if (idx === -1) return;
  sepet[idx].miktar += delta;
  if (sepet[idx].miktar <= 0) sepet.splice(idx, 1);
  sepetGuncelle();
  sepetListeCiz();
}

function sepetMiktarPrompt(id, birim) {
  triggerHaptic(10);
  const idx = sepet.findIndex(s => s.id === id);
  if (idx === -1) return;
  const newVal = window.prompt('Yeni miktar giriniz (' + birim + '):', sepet[idx].miktar);
  if (newVal !== null) {
    const birimUpper = birim ? birim.toUpperCase() : '';
    const isKesirli = ['KG', 'GRAM', 'GR', 'LITRE', 'LT', 'L'].includes(birimUpper);
    const parsed = isKesirli ? parseFloat(newVal.replace(',', '.')) : parseInt(newVal, 10);
    if (!isNaN(parsed) && parsed > 0) {
      sepet[idx].miktar = parsed;
      sepetGuncelle();
      sepetListeCiz();
    }
  }
}

// ===== 12. MUTFAĞA SİPARİŞ GÖNDERME =====
async function siparisGonder() {
  if (!sepet.length || !aktifMasa) return;
  triggerHaptic(25);
  
  const btn = document.getElementById('btnGonder');
  btn.disabled = true;
  btn.innerHTML = '<div class="pos-spinner" style="width:20px; height:20px; border-width:2px; border-top-color:var(--text-dark);"></div> Gönderiliyor...';

  try {
    const res = await apiFetch('/api/garson/siparis', {
      method: 'POST',
      body: JSON.stringify({
        masa_id: aktifMasa.id,
        siparisler: sepet.map(s => {
          const isKg = s.secilenSatisTuru === 'kg' || s.birim?.toLowerCase() === 'kg';
          const birimFiyat = isKg ? ((s.kilo_fiyati || s.fiyat) * (s.gramaj || 1)) : s.fiyat;
          const toplamFiyat = isKg ? (birimFiyat * s.miktar) : (s.fiyat * s.miktar * (s.porsiyon || 1));
          return {
            urun_id: s.urun_id,
            miktar: s.miktar,
            notlar: s.notlar || '',
            ikram: s.ikram || false,
            porsiyon: isKg ? 1 : (s.porsiyon || 1),
            birim_fiyat: birimFiyat,
            toplam_fiyat: toplamFiyat,
            secilenSatisTuru: isKg ? 'kg' : 'porsiyon',
            gramaj: isKg ? s.gramaj : undefined
          };
        })
      })
    });

    if (res && res.basarili) {
      triggerHaptic([30, 50, 30]);
      toast('Sipariş mutfağa iletildi ✓');
      sepet = [];
      sepetGuncelle();
      sepetModalKapat();

      aktifMasa.hesap_id = res.hesap_id;
      masaSec(aktifMasa.id, aktifMasa.numara, res.hesap_id);
    } else {
      triggerHaptic([50, 50, 50]);
      toast(res?.hata || 'Sipariş gönderilemedi', true);
    }
  } catch(e) {
    toast('Bağlantı hatası oluştu', true);
  }

  btn.disabled = false;
  btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg> Mutfağa Gönder';
}

// Sipariş İptali
async function siparisIptalEkrani(siparisId, urunAdi) {
  triggerHaptic(20);
  if (!confirm(urunAdi + ' siparişini iptal etmek istediğinize emin misiniz?')) return;
  const iptalNedeni = prompt('İptal Nedeni (İsteğe Bağlı):');
  if (iptalNedeni === null) return;
  
  try {
    const res = await apiFetch('/api/garson/siparis-iptal', {
      method: 'POST',
      body: JSON.stringify({ siparis_id: siparisId, iptal_nedeni: iptalNedeni })
    });
    if (res && res.basarili) {
      toast('Sipariş kalemi iptal edildi ✓');
      masaDetayCiz(aktifMasa.id);
    } else {
      toast(res?.hata || 'İptal işlemi başarısız', true);
    }
  } catch(e) {
    toast('Bağlantı hatası', true);
  }
}

// İkram Durumu Değiştirme
async function siparisIkramDurumu(siparisId, yeniDurum) {
  triggerHaptic(15);
  try {
    const res = await apiFetch('/api/garson/siparis-ikram', {
      method: 'POST',
      body: JSON.stringify({ siparis_id: siparisId, ikram: yeniDurum })
    });
    if (res && res.basarili) {
      toast('İkram durumu güncellendi ✓');
      masaDetayCiz(aktifMasa.id);
    } else {
      toast(res?.hata || 'İşlem başarısız', true);
    }
  } catch(e) {
    toast('Bağlantı hatası', true);
  }
}

// ===== 9. NAVİGASYON =====
function sayfaGit(sayfa) {
  triggerHaptic(10);
  document.querySelectorAll('.app-page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.bottom-nav-btn').forEach(n => n.classList.remove('active'));

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

// ===== 10. TOAST BİLDİRİMİ =====
function toast(msg, isError = false) {
  const t = document.getElementById('toast');
  const icon = isError 
    ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--pos-red)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>'
    : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--pos-green)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
  
  t.innerHTML = icon + '<span>' + msg + '</span>';
  t.className = 'pos-toast show ' + (isError ? 'error' : 'success');
  
  setTimeout(() => {
    t.className = 'pos-toast';
  }, 2600);
}

// Initialization
pinPadOlustur();
</script>
</body>
</html>`;
}
