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
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }

    .urun-pos-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 14px 12px;
      min-height: 94px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: all 0.12s ease;
      position: relative;
      touch-action: manipulation;
    }

    .urun-pos-card:active {
      border-color: var(--pos-cyan);
      background: var(--bg-surface-elevated);
      transform: scale(0.95);
    }

    .urun-pos-title {
      font-size: 13.5px;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.35;
      margin-bottom: 8px;
    }

    .urun-pos-bottom {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
    }

    .urun-pos-price {
      font-size: 15px;
      font-weight: 900;
      color: var(--pos-cyan);
      letter-spacing: -0.3px;
    }

    .urun-pos-unit {
      font-size: 11px;
      font-weight: 600;
      color: var(--text-muted);
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
let menu = { kategoriler: [], urunler: [] };
let aktifKategori = null;
let aktifMasa = null;
let sepet = [];
let sadeceAcik = false;
let seciliBolum = null;
let aktifPorsiyon = 1;
let urunAramaMetni = '';

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
  menu = data;
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
    html += '<div class="urun-catalog-grid">';
    gosterilecekUrunler.forEach(u => {
      const birim = u.birim || 'Adet';
      const fiyat = Number(u.fiyat * aktifPorsiyon).toFixed(0);
      html += '<div class="urun-pos-card" onclick="sepeteEkle('+u.id+', \\''+u.ad.replace(/'/g, "\\\\'")+'\\', '+u.fiyat+', \\''+birim+'\\')">';
      html += '  <div class="urun-pos-title">'+u.ad+'</div>';
      html += '  <div class="urun-pos-bottom">';
      html += '    <span class="urun-pos-price">₺'+fiyat+'</span>';
      html += '    <span class="urun-pos-unit">'+birim+'</span>';
      html += '  </div>';
      html += '</div>';
    });
    html += '</div>';
  } else {
    html += '<div style="text-align:center; padding:40px 20px; color:var(--text-muted); font-weight:600;">Eşleşen ürün bulunamadı.</div>';
  }

  document.getElementById('pageSiparis').innerHTML = html;
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

// ===== 7. SEPET & KALEM YÖNETİMİ =====
function sepeteEkle(urunId, ad, fiyat, birim) {
  triggerHaptic(15);
  let baslangicMiktari = 1;
  const birimUpper = birim ? birim.toUpperCase() : '';
  
  if (['KG', 'GRAM', 'GR', 'LITRE', 'LT', 'L'].includes(birimUpper)) {
    const newVal = window.prompt('Miktar giriniz (' + (birim || 'KG') + '):', '1');
    if (newVal === null) return;
    const parsed = parseFloat(newVal.replace(',', '.'));
    if (isNaN(parsed) || parsed <= 0) return;
    baslangicMiktari = parsed;
  }

  const mevcut = sepet.find(s => s.urun_id === urunId && !s.notlar && !s.ikram && s.porsiyon === aktifPorsiyon);
  if (mevcut) {
    mevcut.miktar += baslangicMiktari;
  } else {
    sepet.push({
      id: Math.random().toString(36).substring(7),
      urun_id: urunId,
      ad,
      fiyat,
      birim,
      miktar: baslangicMiktari,
      notlar: '',
      ikram: false,
      porsiyon: aktifPorsiyon
    });
  }

  sepetGuncelle();
  
  // Floating bar animation
  const bar = document.getElementById('sepetBar');
  bar.classList.remove('haptic-active');
  void bar.offsetWidth;
  bar.classList.add('haptic-active');

  toast(ad + ' eklendi');
}

function sepetGuncelle() {
  const adet = sepet.reduce((a, s) => a + s.miktar, 0);
  const tutar = sepet.reduce((a, s) => a + (s.ikram ? 0 : s.fiyat * s.miktar * (s.porsiyon || 1)), 0);
  
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
    const ikramEtiketi = s.ikram ? '<span style="background:var(--pos-purple); color:white; padding:2px 6px; border-radius:4px; font-size:10px; margin-left:6px; font-weight:800;">İKRAM</span>' : '';
    const porsiyonMetin = (s.porsiyon && s.porsiyon !== 1) ? ((s.porsiyon === 0.5 ? '(0.5 Porsiyon) ' : (s.porsiyon === 2 ? '(Double) ' : '(' + s.porsiyon + ' Porsiyon) '))) : '';
    const toplamFiyat = (s.fiyat * s.miktar * (s.porsiyon || 1)).toFixed(0);
    const fiyatMetni = s.ikram 
      ? '<span style="text-decoration:line-through; color:var(--text-muted);">₺'+toplamFiyat+'</span>' 
      : '₺'+toplamFiyat;

    html += '<div class="sepet-cart-item">';
    html += '  <div class="sepet-item-head">';
    html += '    <div class="sepet-item-name">'+porsiyonMetin+s.ad+ikramEtiketi+'</div>';
    html += '    <div class="sepet-item-price">'+fiyatMetni+'</div>';
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

// ===== 8. MUTFAĞA SİPARİŞ GÖNDERME =====
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
        siparisler: sepet.map(s => ({
          urun_id: s.urun_id,
          miktar: s.miktar,
          notlar: s.notlar,
          ikram: s.ikram,
          porsiyon: s.porsiyon
        }))
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
