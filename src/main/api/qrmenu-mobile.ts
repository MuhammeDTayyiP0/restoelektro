// =====================================================
// ETİBOL POS - Müşteri QR Menü Mobil Web Arayüzü
// Lüks gastronomi, iştah kabartan modern dijital menü
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
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="theme-color" content="#080A10">
  <title>Dijital Menü</title>
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  
  <!-- Premium Typography -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">

  <style>
    :root {
      /* Warm Gourmet Obsidian Palette */
      --bg-base: #080A10;
      --bg-surface: #10131E;
      --bg-surface-elevated: #161B2B;
      --bg-surface-card: #131724;
      --bg-glass: rgba(16, 19, 30, 0.86);
      --bg-glass-heavy: rgba(8, 10, 16, 0.94);
      
      --border-subtle: rgba(255, 255, 255, 0.07);
      --border-card: rgba(255, 255, 255, 0.10);
      --border-focus: rgba(245, 158, 11, 0.45);
      
      /* Culinary Accents */
      --amber-500: #F59E0B;
      --amber-400: #FBBF24;
      --amber-600: #D97706;
      --amber-glow: rgba(245, 158, 11, 0.28);
      --amber-glass: rgba(245, 158, 11, 0.12);
      
      --flame-500: #EF4444;
      --flame-glow: rgba(239, 68, 68, 0.25);
      
      --emerald-500: #10B981;
      --emerald-glow: rgba(16, 185, 129, 0.25);
      
      /* Typography Colors */
      --text-primary: #FAFDFE;
      --text-secondary: #9BA3B8;
      --text-muted: #647087;
      --text-gold: #FCD34D;
      
      /* Geometry */
      --radius-sm: 8px;
      --radius-md: 14px;
      --radius-lg: 20px;
      --radius-xl: 28px;
      --radius-full: 9999px;
      
      /* Spring Motion & Easing */
      --ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
      --ease-smooth: cubic-bezier(0.16, 1, 0.3, 1);
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
    }

    body {
      background-color: var(--bg-base);
      background-image: 
        radial-gradient(circle at 50% 0%, rgba(245, 158, 11, 0.08) 0%, transparent 50%),
        radial-gradient(circle at 100% 40%, rgba(239, 68, 68, 0.04) 0%, transparent 40%),
        radial-gradient(circle at 0% 80%, rgba(16, 185, 129, 0.03) 0%, transparent 40%);
      background-attachment: fixed;
      color: var(--text-primary);
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      min-height: 100dvh;
      overflow-x: hidden;
      display: flex;
      flex-direction: column;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* Container */
    .app-container {
      max-width: 640px;
      width: 100%;
      margin: 0 auto;
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      position: relative;
      padding-bottom: 120px;
    }

    /* ==========================================================================
       HERO & BRAND HEADER
       ========================================================================== */
    .header-hero {
      position: relative;
      padding: calc(env(safe-area-inset-top, 16px) + 16px) 20px 20px;
      background: linear-gradient(180deg, rgba(22, 27, 43, 0.85) 0%, rgba(13, 16, 26, 0.95) 100%);
      border-bottom: 1px solid var(--border-subtle);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
    }

    .brand-top-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 12px;
    }

    .brand-identity {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-emblem {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, #2A2F45 0%, #151928 100%);
      border: 1px solid rgba(245, 158, 11, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--amber-400);
      box-shadow: 0 4px 16px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.15);
      flex-shrink: 0;
    }

    .brand-text {
      display: flex;
      flex-direction: column;
    }

    .brand-title {
      font-family: 'Outfit', 'Playfair Display', serif;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.02em;
      background: linear-gradient(135deg, #FFFFFF 30%, #FDE68A 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      line-height: 1.15;
    }

    .brand-tagline {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 2px;
    }

    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--emerald-500);
      box-shadow: 0 0 8px var(--emerald-glow);
      display: inline-block;
    }

    /* Table Badge */
    .table-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--amber-glass);
      border: 1px solid rgba(245, 158, 11, 0.35);
      color: var(--amber-400);
      padding: 6px 12px;
      border-radius: var(--radius-full);
      font-size: 13px;
      font-weight: 700;
      box-shadow: 0 2px 10px rgba(0,0,0,0.25);
    }

    /* Quick Action Chips */
    .quick-service-bar {
      display: flex;
      gap: 8px;
      margin-top: 14px;
    }

    .service-btn {
      flex: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border-subtle);
      color: var(--text-primary);
      padding: 9px 12px;
      border-radius: var(--radius-md);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s var(--ease-smooth);
    }

    .service-btn:active {
      transform: scale(0.96);
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.2);
    }

    .service-btn.waiter:active {
      border-color: var(--amber-500);
      color: var(--amber-400);
    }

    .service-btn.bill:active {
      border-color: var(--emerald-500);
      color: var(--emerald-500);
    }

    /* ==========================================================================
       STICKY SEARCH & CATEGORY BAR
       ========================================================================== */
    .sticky-nav-wrapper {
      position: sticky;
      top: 0;
      z-index: 50;
      background: var(--bg-glass-heavy);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--border-subtle);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    }

    /* Search Box */
    .search-section {
      padding: 12px 18px 8px;
    }

    .search-input-box {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 14px;
      color: var(--text-muted);
      pointer-events: none;
      display: flex;
      align-items: center;
    }

    .search-input {
      width: 100%;
      height: 42px;
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-full);
      padding: 0 40px 0 42px;
      color: var(--text-primary);
      font-size: 14px;
      font-weight: 500;
      outline: none;
      transition: all 0.2s ease;
    }

    .search-input::placeholder {
      color: var(--text-muted);
    }

    .search-input:focus {
      border-color: var(--amber-500);
      background: var(--bg-surface);
      box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15);
    }

    .search-clear-btn {
      position: absolute;
      right: 12px;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: var(--text-secondary);
      display: none;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 14px;
    }

    /* Category Tabs */
    .cat-scroll-container {
      padding: 6px 16px 12px;
      overflow-x: auto;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
      display: flex;
      gap: 8px;
    }

    .cat-scroll-container::-webkit-scrollbar {
      display: none;
    }

    .cat-pill {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 8px 16px;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-full);
      color: var(--text-secondary);
      font-size: 13px;
      font-weight: 600;
      white-space: nowrap;
      cursor: pointer;
      transition: all 0.2s var(--ease-smooth);
      flex-shrink: 0;
    }

    .cat-pill:active {
      transform: scale(0.95);
    }

    .cat-pill.active {
      background: linear-gradient(135deg, #241D14 0%, #171A24 100%);
      border-color: var(--amber-500);
      color: var(--amber-400);
      box-shadow: 0 4px 16px var(--amber-glow);
    }

    .cat-pill-count {
      font-size: 11px;
      padding: 1px 6px;
      border-radius: var(--radius-full);
      background: rgba(255, 255, 255, 0.08);
      color: var(--text-muted);
      font-weight: 700;
    }

    .cat-pill.active .cat-pill-count {
      background: rgba(245, 158, 11, 0.2);
      color: var(--amber-400);
    }

    /* ==========================================================================
       MENU ITEMS & SECTION
       ========================================================================= */
    .menu-main-content {
      padding: 18px 16px;
      flex: 1;
    }

    .category-group {
      margin-bottom: 28px;
    }

    .category-group-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .category-group-title {
      font-family: 'Outfit', sans-serif;
      font-size: 18px;
      font-weight: 800;
      letter-spacing: -0.01em;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .category-group-title::before {
      content: '';
      display: inline-block;
      width: 4px;
      height: 16px;
      border-radius: 2px;
      background: var(--amber-500);
    }

    .category-group-count {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
    }

    /* Grid of Dishes */
    .dish-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 14px;
    }

    @media (min-width: 520px) {
      .dish-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    /* Dish Card */
    .dish-card {
      background: var(--bg-surface-card);
      border: 1px solid var(--border-card);
      border-radius: var(--radius-lg);
      padding: 12px;
      display: flex;
      gap: 14px;
      position: relative;
      cursor: pointer;
      transition: transform 0.2s var(--ease-smooth), border-color 0.2s, box-shadow 0.2s;
      overflow: hidden;
    }

    .dish-card:active {
      transform: scale(0.98);
      border-color: rgba(245, 158, 11, 0.3);
    }

    /* Thumbnail Box */
    .dish-thumb-wrapper {
      width: 104px;
      height: 104px;
      border-radius: var(--radius-md);
      overflow: hidden;
      position: relative;
      flex-shrink: 0;
      background: #191E2E;
      border: 1px solid var(--border-subtle);
    }

    .dish-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .dish-card:hover .dish-img {
      transform: scale(1.06);
    }

    .dish-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at 50% 40%, #252D42 0%, #121624 100%);
      color: var(--amber-400);
      position: relative;
    }

    .dish-placeholder svg {
      opacity: 0.85;
    }

    .dish-placeholder-tag {
      position: absolute;
      bottom: 4px;
      font-size: 9px;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* Dish Info */
    .dish-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-width: 0;
    }

    .dish-title-row {
      margin-bottom: 4px;
    }

    .dish-title {
      font-size: 15px;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.25;
      margin-bottom: 4px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .dish-desc {
      font-size: 12px;
      color: var(--text-secondary);
      line-height: 1.35;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .dish-footer {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      margin-top: 8px;
    }

    .dish-price-group {
      display: flex;
      flex-direction: column;
    }

    .dish-portion-label {
      font-size: 10px;
      color: var(--text-muted);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .dish-price {
      font-family: 'Outfit', sans-serif;
      font-size: 17px;
      font-weight: 800;
      color: var(--amber-400);
      letter-spacing: -0.01em;
    }

    /* Add Button */
    .dish-add-btn {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-full);
      background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
      border: none;
      color: #080A10;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(245, 158, 11, 0.35);
      transition: all 0.2s var(--ease-spring);
      flex-shrink: 0;
    }

    .dish-add-btn:active {
      transform: scale(0.88);
      box-shadow: 0 2px 6px rgba(245, 158, 11, 0.2);
    }

    /* ==========================================================================
       FLOATING CART / TRAY SUMMARY BAR
       ========================================================================== */
    .floating-tray-bar {
      position: fixed;
      bottom: calc(env(safe-area-inset-bottom, 16px) + 16px);
      left: 50%;
      transform: translateX(-50%) translateY(120px);
      width: calc(100% - 32px);
      max-width: 600px;
      background: linear-gradient(135deg, rgba(26, 32, 50, 0.96) 0%, rgba(16, 20, 32, 0.98) 100%);
      border: 1px solid rgba(245, 158, 11, 0.35);
      border-radius: var(--radius-full);
      padding: 10px 14px 10px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.6), 0 0 20px rgba(245, 158, 11, 0.2);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      z-index: 80;
      transition: transform 0.4s var(--ease-spring);
      cursor: pointer;
    }

    .floating-tray-bar.visible {
      transform: translateX(-50%) translateY(0);
    }

    .tray-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .tray-badge-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--amber-500);
      color: #080A10;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      font-weight: 800;
    }

    .tray-item-counter {
      position: absolute;
      top: -4px;
      right: -4px;
      background: var(--flame-500);
      color: #fff;
      font-size: 11px;
      font-weight: 800;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid var(--bg-surface);
      animation: bounceCounter 0.3s var(--ease-spring);
    }

    @keyframes bounceCounter {
      0% { transform: scale(0.6); }
      70% { transform: scale(1.25); }
      100% { transform: scale(1); }
    }

    .tray-info {
      display: flex;
      flex-direction: column;
    }

    .tray-title {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .tray-total-price {
      font-family: 'Outfit', sans-serif;
      font-size: 18px;
      font-weight: 800;
      color: var(--text-primary);
    }

    .tray-action-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
      color: #080A10;
      padding: 10px 18px;
      border-radius: var(--radius-full);
      font-size: 13px;
      font-weight: 700;
      border: none;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
    }

    /* ==========================================================================
       MODALS & BOTTOM SHEETS
       ========================================================================== */
    .sheet-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 100;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
      display: flex;
      align-items: flex-end;
      justify-content: center;
    }

    .sheet-overlay.open {
      opacity: 1;
      pointer-events: auto;
    }

    .bottom-sheet {
      width: 100%;
      max-width: 600px;
      max-height: 88vh;
      background: var(--bg-surface-elevated);
      border-top: 1px solid var(--border-card);
      border-radius: 28px 28px 0 0;
      display: flex;
      flex-direction: column;
      transform: translateY(100%);
      transition: transform 0.35s var(--ease-spring);
      overflow: hidden;
      box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.7);
    }

    .sheet-overlay.open .bottom-sheet {
      transform: translateY(0);
    }

    .sheet-handle-bar {
      width: 44px;
      height: 5px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
      margin: 12px auto 6px;
      cursor: grab;
    }

    .sheet-header {
      padding: 12px 20px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border-subtle);
    }

    .sheet-title {
      font-family: 'Outfit', sans-serif;
      font-size: 19px;
      font-weight: 800;
      color: var(--text-primary);
    }

    .sheet-close-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.08);
      border: none;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.2s;
    }

    .sheet-close-btn:active {
      background: rgba(255, 255, 255, 0.16);
    }

    .sheet-body {
      padding: 20px;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      flex: 1;
    }

    .sheet-footer {
      padding: 16px 20px calc(env(safe-area-inset-bottom, 16px) + 16px);
      border-top: 1px solid var(--border-subtle);
      background: var(--bg-surface);
    }

    /* Product Detail Sheet Details */
    .detail-img-container {
      width: 100%;
      height: 220px;
      border-radius: var(--radius-lg);
      overflow: hidden;
      margin-bottom: 18px;
      background: #1C2234;
      border: 1px solid var(--border-subtle);
      position: relative;
    }

    .detail-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .detail-tag {
      position: absolute;
      top: 12px;
      left: 12px;
      background: rgba(8, 10, 16, 0.75);
      backdrop-filter: blur(8px);
      color: var(--amber-400);
      padding: 5px 12px;
      border-radius: var(--radius-full);
      font-size: 11px;
      font-weight: 700;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }

    .detail-name {
      font-family: 'Outfit', sans-serif;
      font-size: 22px;
      font-weight: 800;
      color: var(--text-primary);
      margin-bottom: 8px;
      line-height: 1.2;
    }

    .detail-price-row {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 16px;
    }

    .detail-price {
      font-family: 'Outfit', sans-serif;
      font-size: 26px;
      font-weight: 800;
      color: var(--amber-400);
    }

    .detail-unit {
      font-size: 13px;
      color: var(--text-muted);
      font-weight: 600;
    }

    .detail-desc-box {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 14px;
      font-size: 14px;
      color: var(--text-secondary);
      line-height: 1.5;
      margin-bottom: 20px;
    }

    /* Quantity Stepper */
    .stepper-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 10px 16px;
      margin-bottom: 16px;
    }

    .stepper-label {
      font-size: 14px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .stepper-controls {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .stepper-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid var(--border-subtle);
      color: var(--text-primary);
      font-size: 18px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s;
    }

    .stepper-btn:active {
      transform: scale(0.9);
      background: var(--amber-500);
      color: #080A10;
    }

    .stepper-count {
      font-family: 'Outfit', sans-serif;
      font-size: 18px;
      font-weight: 800;
      min-width: 24px;
      text-align: center;
      color: var(--text-primary);
    }

    /* Note Input */
    .note-input-box {
      margin-bottom: 10px;
    }

    .note-label {
      display: block;
      font-size: 12px;
      font-weight: 700;
      color: var(--text-secondary);
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .note-textarea {
      width: 100%;
      height: 72px;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 10px 14px;
      color: var(--text-primary);
      font-size: 13px;
      resize: none;
      outline: none;
      transition: border-color 0.2s;
    }

    .note-textarea:focus {
      border-color: var(--amber-500);
    }

    .cta-button {
      width: 100%;
      height: 52px;
      border-radius: var(--radius-full);
      background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
      border: none;
      color: #080A10;
      font-size: 16px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      cursor: pointer;
      box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
      transition: transform 0.15s var(--ease-spring);
    }

    .cta-button:active {
      transform: scale(0.97);
    }

    /* Tray List Items */
    .tray-item-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid var(--border-subtle);
    }

    .tray-item-info {
      flex: 1;
      min-width: 0;
    }

    .tray-item-name {
      font-size: 14px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .tray-item-notes {
      font-size: 11px;
      color: var(--amber-400);
      font-style: italic;
      margin-bottom: 2px;
    }

    .tray-item-price {
      font-family: 'Outfit', sans-serif;
      font-size: 14px;
      font-weight: 800;
      color: var(--text-secondary);
    }

    .tray-stepper {
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-full);
      padding: 4px 8px;
    }

    .tray-stepper-btn {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.08);
      border: none;
      color: var(--text-primary);
      font-size: 14px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .tray-stepper-btn.danger {
      color: var(--flame-500);
    }

    .tray-stepper-val {
      font-family: 'Outfit', sans-serif;
      font-size: 14px;
      font-weight: 800;
      min-width: 18px;
      text-align: center;
    }

    /* Bill Summary Breakdown */
    .bill-calc-box {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 16px;
      margin-top: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .bill-calc-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      color: var(--text-secondary);
    }

    .bill-calc-row.total {
      font-size: 17px;
      font-weight: 800;
      color: var(--text-primary);
      border-top: 1px dashed var(--border-subtle);
      padding-top: 10px;
      margin-top: 4px;
    }

    .bill-calc-row.total span:last-child {
      color: var(--amber-400);
      font-family: 'Outfit', sans-serif;
      font-size: 20px;
    }

    /* ==========================================================================
       TOAST NOTIFICATIONS
       ========================================================================== */
    .toast-pill {
      position: fixed;
      top: calc(env(safe-area-inset-top, 16px) + 16px);
      left: 50%;
      transform: translateX(-50%) translateY(-100px);
      background: rgba(22, 27, 43, 0.95);
      border: 1px solid var(--amber-500);
      color: var(--text-primary);
      padding: 10px 20px;
      border-radius: var(--radius-full);
      font-size: 13px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.6), 0 0 16px var(--amber-glow);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      z-index: 200;
      transition: transform 0.35s var(--ease-spring);
      pointer-events: none;
    }

    .toast-pill.show {
      transform: translateX(-50%) translateY(0);
    }

    /* ==========================================================================
       EMPTY & LOADING STATES
       ========================================================================== */
    .shimmer-loader {
      padding: 30px 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .shimmer-card {
      height: 110px;
      background: linear-gradient(90deg, #131724 0%, #1E2538 50%, #131724 100%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: var(--radius-lg);
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .empty-state {
      text-align: center;
      padding: 48px 20px;
      color: var(--text-muted);
    }

    .empty-icon {
      font-size: 40px;
      margin-bottom: 12px;
      opacity: 0.6;
    }
  </style>
</head>
<body>

  <div class="app-container">
    
    <!-- Top Hero Header -->
    <header class="header-hero">
      <div class="brand-top-row">
        <div class="brand-identity">
          <div class="brand-emblem">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
              <line x1="6" y1="1" x2="6" y2="4"></line>
              <line x1="10" y1="1" x2="10" y2="4"></line>
              <line x1="14" y1="1" x2="14" y2="4"></line>
            </svg>
          </div>
          <div class="brand-text">
            <h1 id="isletmeAdi" class="brand-title">RESTO GOURMET</h1>
            <div class="brand-tagline">
              <span class="status-dot"></span>
              <span>Canlı Dijital Menü</span>
            </div>
          </div>
        </div>

        <div id="masaBadge" class="table-badge" style="display:none;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
          <span id="masaNoText">Masa: 1</span>
        </div>
      </div>

      <!-- Quick Service Actions -->
      <div class="quick-service-bar">
        <button class="service-btn waiter" onclick="openServiceModal('garson')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          Garson Çağır
        </button>

        <button class="service-btn bill" onclick="openServiceModal('hesap')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2"></rect>
            <line x1="2" y1="10" x2="22" y2="10"></line>
          </svg>
          Hesap İste
        </button>
      </div>
    </header>

    <!-- Sticky Navigation (Search & Categories) -->
    <div class="sticky-nav-wrapper">
      <!-- Search -->
      <div class="search-section">
        <div class="search-input-box">
          <span class="search-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </span>
          <input 
            type="text" 
            id="searchInput" 
            class="search-input" 
            placeholder="Menüde yemek veya içecek ara..."
            autocomplete="off"
            oninput="handleSearch(this.value)"
          >
          <button id="searchClearBtn" class="search-clear-btn" onclick="clearSearch()">✕</button>
        </div>
      </div>

      <!-- Categories Scroll -->
      <div id="catTabs" class="cat-scroll-container">
        <!-- Injected via JS -->
      </div>
    </div>

    <!-- Main Content -->
    <main class="menu-main-content">
      <!-- Loading Skeleton -->
      <div id="loader" class="shimmer-loader">
        <div class="shimmer-card"></div>
        <div class="shimmer-card"></div>
        <div class="shimmer-card"></div>
      </div>

      <!-- Menu Items Container -->
      <div id="menuContainer" style="display:none;"></div>
    </main>

    <!-- Floating Tray Bar (Bottom Bar) -->
    <div id="floatingTray" class="floating-tray-bar" onclick="openTraySheet()">
      <div class="tray-left">
        <div class="tray-badge-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          <span id="trayCountBadge" class="tray-item-counter">0</span>
        </div>
        <div class="tray-info">
          <span class="tray-title">Seçilen Ürünler</span>
          <span id="trayTotalPrice" class="tray-total-price">₺ 0,00</span>
        </div>
      </div>

      <button class="tray-action-btn">
        <span>Siparişi İncele</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
    </div>

  </div>

  <!-- ==========================================================================
       PRODUCT DETAIL BOTTOM SHEET
       ========================================================================== -->
  <div id="detailSheet" class="sheet-overlay" onclick="closeOnBackdrop(event, 'detailSheet')">
    <div class="bottom-sheet">
      <div class="sheet-handle-bar"></div>
      <div class="sheet-header">
        <div class="sheet-title">Ürün Detayı</div>
        <button class="sheet-close-btn" onclick="closeSheet('detailSheet')">✕</button>
      </div>

      <div class="sheet-body">
        <div id="detailImgContainer" class="detail-img-container">
          <!-- Injected via JS -->
        </div>

        <h2 id="detailTitle" class="detail-name">-</h2>
        <div class="detail-price-row">
          <span id="detailPrice" class="detail-price">₺ 0,00</span>
          <span id="detailUnit" class="detail-unit">/ Porsiyon</span>
        </div>

        <div id="detailDescBox" class="detail-desc-box">
          Geleneksel tarifle özenle hazırlanmış enfes lezzet.
        </div>

        <!-- Quantity Stepper -->
        <div class="stepper-row">
          <span class="stepper-label">Porsiyon Adedi</span>
          <div class="stepper-controls">
            <button class="stepper-btn" onclick="detailAdetDegistir(-1)">-</button>
            <span id="detailAdet" class="stepper-count">1</span>
            <button class="stepper-btn" onclick="detailAdetDegistir(1)">+</button>
          </div>
        </div>

        <!-- Special Note -->
        <div class="note-input-box">
          <label class="note-label">Sipariş Notunuz</label>
          <textarea 
            id="detailNote" 
            class="note-textarea" 
            placeholder="Örn: Az pişmiş, acısız, sosu ayrı olsun..."
          ></textarea>
        </div>
      </div>

      <div class="sheet-footer">
        <button id="detailAddCta" class="cta-button" onclick="detailSepeteEkle()">
          <span>Listeme Ekle</span>
          <span id="detailCtaTotal">₺ 0,00</span>
        </button>
      </div>
    </div>
  </div>

  <!-- ==========================================================================
       CART / TRAY BOTTOM SHEET
       ========================================================================== -->
  <div id="traySheet" class="sheet-overlay" onclick="closeOnBackdrop(event, 'traySheet')">
    <div class="bottom-sheet">
      <div class="sheet-handle-bar"></div>
      <div class="sheet-header">
        <div class="sheet-title">Masa Sipariş Listesi</div>
        <button class="sheet-close-btn" onclick="closeSheet('traySheet')">✕</button>
      </div>

      <div class="sheet-body">
        <div id="trayItemsList">
          <!-- Injected via JS -->
        </div>

        <div class="bill-calc-box">
          <div class="bill-calc-row">
            <span>Ara Toplam</span>
            <span id="calcSubtotal">₺ 0,00</span>
          </div>
          <div class="bill-calc-row">
            <span>KDV (Dahil)</span>
            <span id="calcVat">₺ 0,00</span>
          </div>
          <div class="bill-calc-row total">
            <span>Genel Toplam</span>
            <span id="calcGrandTotal">₺ 0,00</span>
          </div>
        </div>
      </div>

      <div class="sheet-footer" style="display: flex; gap: 10px;">
        <button class="service-btn" style="flex: 1; padding: 14px;" onclick="sepetiTemizle()">
          Temizle
        </button>
        <button class="cta-button" style="flex: 2;" onclick="siparisOzetiGoster()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>Garsona Bildir</span>
        </button>
      </div>
    </div>
  </div>

  <!-- ==========================================================================
       SERVICE ACTION MODAL (Garson Çağır / Hesap İste)
       ========================================================================== -->
  <div id="serviceSheet" class="sheet-overlay" onclick="closeOnBackdrop(event, 'serviceSheet')">
    <div class="bottom-sheet">
      <div class="sheet-handle-bar"></div>
      <div class="sheet-header">
        <div id="serviceSheetTitle" class="sheet-title">Hizmet Talebi</div>
        <button class="sheet-close-btn" onclick="closeSheet('serviceSheet')">✕</button>
      </div>

      <div class="sheet-body" id="serviceSheetBody">
        <!-- Injected via JS -->
      </div>
    </div>
  </div>

  <!-- Toast Notification Pill -->
  <div id="toastPill" class="toast-pill">
    <span id="toastIcon">✨</span>
    <span id="toastMsg">İşlem tamamlandı</span>
  </div>

  <!-- ==========================================================================
       CLIENT APPLICATION LOGIC
       ========================================================================== -->
  <script>
    // State Store
    let menuState = {
      isletme_adi: 'Restoran',
      kategoriler: [],
      urunler: [],
      aktifKategoriId: null,
      aramaMetni: '',
      sepet: [] // Array of { urun, miktar, notlar, id }
    };

    let aktifDetayUrun = null;
    let aktifDetayMiktar = 1;

    // Masa Bilgisini Oku
    const urlParams = new URLSearchParams(window.location.search);
    const masaParam = urlParams.get('masa');

    if (masaParam) {
      const mb = document.getElementById('masaBadge');
      const mText = document.getElementById('masaNoText');
      mText.textContent = 'Masa ' + masaParam;
      mb.style.display = 'inline-flex';
    }

    // Helper: Fiyat Formatla
    function formatFiyat(tutar) {
      return '₺ ' + Number(tutar || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    // Toast Göster
    function showToast(msg, icon = '✨') {
      const toast = document.getElementById('toastPill');
      document.getElementById('toastIcon').textContent = icon;
      document.getElementById('toastMsg').textContent = msg;
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 2600);
    }

    // Menü Verisini Yükle
    async function menuYukle() {
      try {
        const res = await fetch('/api/qrmenu');
        if (!res.ok) throw new Error('API Hatası');
        const data = await res.json();

        menuState.isletme_adi = data.isletme_adi || 'Restoran';
        menuState.kategoriler = data.kategoriler || [];
        menuState.urunler = data.urunler || [];

        document.getElementById('isletmeAdi').textContent = menuState.isletme_adi;
        document.title = menuState.isletme_adi + ' - Dijital Menü';

        renderKategoriTabs();
        renderUrunler();

        document.getElementById('loader').style.display = 'none';
        document.getElementById('menuContainer').style.display = 'block';
      } catch (err) {
        console.error(err);
        document.getElementById('loader').innerHTML = \`
          <div class="empty-state">
            <div class="empty-icon">⚠️</div>
            <div style="font-weight:700; color:var(--flame-500); margin-bottom:6px;">Menüye Erişilemedi</div>
            <div style="font-size:13px;">Lütfen internet bağlantınızı kontrol edip sayfayı yenileyin.</div>
          </div>
        \`;
      }
    }

    // Kategori Tabs Çiz
    function renderKategoriTabs() {
      const container = document.getElementById('catTabs');
      container.innerHTML = '';

      // Tümü Butonu
      const tumuBtn = document.createElement('button');
      tumuBtn.className = 'cat-pill' + (menuState.aktifKategoriId === null ? ' active' : '');
      tumuBtn.innerHTML = \`
        <span>✨ Tümü</span>
        <span class="cat-pill-count">\${menuState.urunler.length}</span>
      \`;
      tumuBtn.onclick = () => {
        menuState.aktifKategoriId = null;
        renderKategoriTabs();
        renderUrunler();
      };
      container.appendChild(tumuBtn);

      // Kategoriler
      menuState.kategoriler.forEach(k => {
        const urunSayisi = menuState.urunler.filter(u => u.kategori_id === k.id).length;
        const btn = document.createElement('button');
        btn.className = 'cat-pill' + (menuState.aktifKategoriId === k.id ? ' active' : '');
        btn.innerHTML = \`
          <span>\${k.ad}</span>
          <span class="cat-pill-count">\${urunSayisi}</span>
        \`;
        btn.onclick = () => {
          menuState.aktifKategoriId = k.id;
          renderKategoriTabs();
          renderUrunler();
          btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        };
        container.appendChild(btn);
      });
    }

    // Kategori İkonu / Placeholder SVG Üretici
    function getCulinaryIconSvg() {
      return \`
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
          <line x1="6" y1="1" x2="6" y2="4"></line>
          <line x1="10" y1="1" x2="10" y2="4"></line>
          <line x1="14" y1="1" x2="14" y2="4"></line>
        </svg>
      \`;
    }

    // Ürünleri Çiz
    function renderUrunler() {
      const container = document.getElementById('menuContainer');
      container.innerHTML = '';

      let filtrelenmis = menuState.urunler;

      // Arama filtresi
      if (menuState.aramaMetni.trim()) {
        const q = menuState.aramaMetni.toLowerCase();
        filtrelenmis = filtrelenmis.filter(u => 
          u.ad.toLowerCase().includes(q) || 
          (u.kisaltma && u.kisaltma.toLowerCase().includes(q))
        );
      }

      // Kategori filtresi
      if (menuState.aktifKategoriId !== null) {
        filtrelenmis = filtrelenmis.filter(u => u.kategori_id === menuState.aktifKategoriId);
      }

      if (filtrelenmis.length === 0) {
        container.innerHTML = \`
          <div class="empty-state">
            <div class="empty-icon">🍽️</div>
            <div style="font-weight:700; margin-bottom:4px; font-size:16px;">Aradığınız ürün bulunamadı</div>
            <div style="font-size:13px;">Lütfen farklı bir arama terimi deneyin veya diğer kategorilere göz atın.</div>
          </div>
        \`;
        return;
      }

      // Kategoriye Göre Grupla
      const kategorilerListesi = menuState.aktifKategoriId !== null 
        ? menuState.kategoriler.filter(k => k.id === menuState.aktifKategoriId)
        : menuState.kategoriler;

      kategorilerListesi.forEach(kat => {
        const katUrunler = filtrelenmis.filter(u => u.kategori_id === kat.id);
        if (katUrunler.length === 0) return;

        const groupDiv = document.createElement('div');
        groupDiv.className = 'category-group';

        const headerDiv = document.createElement('div');
        headerDiv.className = 'category-group-header';
        headerDiv.innerHTML = \`
          <div class="category-group-title">\${kat.ad}</div>
          <div class="category-group-count">\${katUrunler.length} Çeşit</div>
        \`;
        groupDiv.appendChild(headerDiv);

        const gridDiv = document.createElement('div');
        gridDiv.className = 'dish-grid';

        katUrunler.forEach(urun => {
          const card = document.createElement('div');
          card.className = 'dish-card';
          card.onclick = (e) => {
            // Butona tıklanmadıysa modalı aç
            if (!e.target.closest('.dish-add-btn')) {
              openDetailSheet(urun);
            }
          };

          // Resim HTML
          let imgHtml = '';
          if (urun.resim_yolu) {
            imgHtml = \`<img src="\${urun.resim_yolu}" class="dish-img" alt="\${urun.ad}" loading="lazy">\`;
          } else {
            imgHtml = \`
              <div class="dish-placeholder">
                \${getCulinaryIconSvg()}
                <span class="dish-placeholder-tag">\${kat.ad}</span>
              </div>
            \`;
          }

          const descText = urun.kisaltma ? urun.kisaltma : 'Taze malzemelerle hazırlanan özel lezzet.';

          card.innerHTML = \`
            <div class="dish-thumb-wrapper">
              \${imgHtml}
            </div>
            <div class="dish-info">
              <div class="dish-title-row">
                <div class="dish-title">\${urun.ad}</div>
                <div class="dish-desc">\${descText}</div>
              </div>
              <div class="dish-footer">
                <div class="dish-price-group">
                  <span class="dish-portion-label">\${urun.birim || 'Porsiyon'}</span>
                  <span class="dish-price">\${formatFiyat(urun.fiyat)}</span>
                </div>
                <button class="dish-add-btn" title="Hızlı Ekle" onclick="hizliEkle(event, \${urun.id})">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
              </div>
            </div>
          \`;

          gridDiv.appendChild(card);
        });

        groupDiv.appendChild(gridDiv);
        container.appendChild(groupDiv);
      });
    }

    // Arama İşlemi
    function handleSearch(val) {
      menuState.aramaMetni = val;
      const clearBtn = document.getElementById('searchClearBtn');
      if (val.trim()) {
        clearBtn.style.display = 'flex';
      } else {
        clearBtn.style.display = 'none';
      }
      renderUrunler();
    }

    function clearSearch() {
      const input = document.getElementById('searchInput');
      input.value = '';
      menuState.aramaMetni = '';
      document.getElementById('searchClearBtn').style.display = 'none';
      renderUrunler();
    }

    // Hızlı Sepete Ekle (+) Butonu
    function hizliEkle(event, urunId) {
      event.stopPropagation();
      const urun = menuState.urunler.find(u => u.id === urunId);
      if (!urun) return;

      const varMi = menuState.sepet.find(item => item.urun.id === urunId && !item.notlar);
      if (varMi) {
        varMi.miktar += 1;
      } else {
        menuState.sepet.push({
          id: Date.now() + Math.random(),
          urun: urun,
          miktar: 1,
          notlar: ''
        });
      }

      updateTrayUI();
      showToast(\`\${urun.ad} listeye eklendi\`, '🛒');
    }

    // Ürün Detay Modalı
    function openDetailSheet(urun) {
      aktifDetayUrun = urun;
      aktifDetayMiktar = 1;

      document.getElementById('detailTitle').textContent = urun.ad;
      document.getElementById('detailPrice').textContent = formatFiyat(urun.fiyat);
      document.getElementById('detailUnit').textContent = '/ ' + (urun.birim || 'Porsiyon');
      document.getElementById('detailDescBox').textContent = urun.kisaltma || 'Taze ve kaliteli malzemelerle şeflerimiz tarafından özenle hazırlanmıştır.';
      document.getElementById('detailAdet').textContent = '1';
      document.getElementById('detailNote').value = '';
      document.getElementById('detailCtaTotal').textContent = formatFiyat(urun.fiyat);

      // Resim
      const imgCont = document.getElementById('detailImgContainer');
      if (urun.resim_yolu) {
        imgCont.innerHTML = \`<img src="\${urun.resim_yolu}" class="detail-img" alt="\${urun.ad}">\`;
      } else {
        const kat = menuState.kategoriler.find(k => k.id === urun.kategori_id);
        imgCont.innerHTML = \`
          <div class="dish-placeholder">
            \${getCulinaryIconSvg()}
            <span class="detail-tag">\${kat ? kat.ad : 'Gurme Lezzet'}</span>
          </div>
        \`;
      }

      openSheet('detailSheet');
    }

    function detailAdetDegistir(delta) {
      const yeni = aktifDetayMiktar + delta;
      if (yeni < 1) return;
      aktifDetayMiktar = yeni;
      document.getElementById('detailAdet').textContent = aktifDetayMiktar;
      if (aktifDetayUrun) {
        document.getElementById('detailCtaTotal').textContent = formatFiyat(aktifDetayUrun.fiyat * aktifDetayMiktar);
      }
    }

    function detailSepeteEkle() {
      if (!aktifDetayUrun) return;
      const note = document.getElementById('detailNote').value.trim();

      menuState.sepet.push({
        id: Date.now() + Math.random(),
        urun: aktifDetayUrun,
        miktar: aktifDetayMiktar,
        notlar: note
      });

      closeSheet('detailSheet');
      updateTrayUI();
      showToast(\`\${aktifDetayUrun.ad} (\${aktifDetayMiktar} adet) eklendi\`, '🛒');
    }

    // Sepet / Tepsi UI Güncelleme
    function updateTrayUI() {
      const totalCount = menuState.sepet.reduce((sum, i) => sum + i.miktar, 0);
      const totalPrice = menuState.sepet.reduce((sum, i) => sum + (i.urun.fiyat * i.miktar), 0);

      const tray = document.getElementById('floatingTray');
      const badge = document.getElementById('trayCountBadge');
      const priceEl = document.getElementById('trayTotalPrice');

      badge.textContent = totalCount;
      priceEl.textContent = formatFiyat(totalPrice);

      if (totalCount > 0) {
        tray.classList.add('visible');
      } else {
        tray.classList.remove('visible');
        closeSheet('traySheet');
      }

      renderTrayList();
    }

    // Sepet Listesini Çiz
    function renderTrayList() {
      const list = document.getElementById('trayItemsList');
      list.innerHTML = '';

      if (menuState.sepet.length === 0) {
        list.innerHTML = '<div class="empty-state"><div class="empty-icon">🛒</div><div>Sipariş listeniz henüz boş.</div></div>';
      } else {
        menuState.sepet.forEach(item => {
          const row = document.createElement('div');
          row.className = 'tray-item-row';

          const noteHtml = item.notlar ? \`<div class="tray-item-notes">Not: \${item.notlar}</div>\` : '';

          row.innerHTML = \`
            <div class="tray-item-info">
              <div class="tray-item-name">\${item.urun.ad}</div>
              \${noteHtml}
              <div class="tray-item-price">\${formatFiyat(item.urun.fiyat * item.miktar)}</div>
            </div>
            <div class="tray-stepper">
              <button class="tray-stepper-btn \${item.miktar === 1 ? 'danger' : ''}" onclick="trayAdetDegistir('\${item.id}', -1)">
                \${item.miktar === 1 ? '🗑' : '-'}
              </button>
              <span class="tray-stepper-val">\${item.miktar}</span>
              <button class="tray-stepper-btn" onclick="trayAdetDegistir('\${item.id}', 1)">+</button>
            </div>
          \`;

          list.appendChild(row);
        });
      }

      // Hesaplama kutusu
      const totalPrice = menuState.sepet.reduce((sum, i) => sum + (i.urun.fiyat * i.miktar), 0);
      const vat = totalPrice * 0.10;
      const subtotal = totalPrice - vat;

      document.getElementById('calcSubtotal').textContent = formatFiyat(subtotal);
      document.getElementById('calcVat').textContent = formatFiyat(vat);
      document.getElementById('calcGrandTotal').textContent = formatFiyat(totalPrice);
    }

    function trayAdetDegistir(itemId, delta) {
      const item = menuState.sepet.find(i => String(i.id) === String(itemId));
      if (!item) return;

      item.miktar += delta;
      if (item.miktar <= 0) {
        menuState.sepet = menuState.sepet.filter(i => String(i.id) !== String(itemId));
      }
      updateTrayUI();
    }

    function sepetiTemizle() {
      menuState.sepet = [];
      updateTrayUI();
      closeSheet('traySheet');
      showToast('Sipariş listeniz temizlendi', '🧹');
    }

    function openTraySheet() {
      renderTrayList();
      openSheet('traySheet');
    }

    function siparisOzetiGoster() {
      closeSheet('traySheet');
      const masaInfo = masaParam ? \`Masa \${masaParam}\` : 'Masanız';
      showToast(\`\${masaInfo} için sipariş listeniz hazır! Lütfen garsona gösterin.\`, '✅');
    }

    // Hizmet Talepleri Modalı (Garson Çağır / Hesap İste)
    function openServiceModal(type) {
      const title = document.getElementById('serviceSheetTitle');
      const body = document.getElementById('serviceSheetBody');
      const masaInfo = masaParam ? \`Masa: \${masaParam}\` : 'Masa Numarası Belirtilmemiş';

      if (type === 'garson') {
        title.textContent = 'Garson Çağır';
        body.innerHTML = \`
          <div style="text-align:center; padding: 10px 0 20px;">
            <div style="font-size:44px; margin-bottom:12px;">🔔</div>
            <div style="font-size:18px; font-weight:800; color:var(--text-primary); margin-bottom:6px;">Garson Masanıza Yönlendirilsin mi?</div>
            <div style="font-size:14px; color:var(--amber-400); font-weight:700; margin-bottom:20px;">\${masaInfo}</div>
            
            <div style="display:flex; flex-direction:column; gap:10px; text-align:left; margin-bottom:20px;">
              <label class="service-btn" style="cursor:pointer;">
                <input type="radio" name="garson_neden" checked style="accent-color:var(--amber-500); margin-right:8px;"> Sipariş vermek istiyorum
              </label>
              <label class="service-btn" style="cursor:pointer;">
                <input type="radio" name="garson_neden" style="accent-color:var(--amber-500); margin-right:8px;"> Servis / Peçete / Baharat talebi
              </label>
              <label class="service-btn" style="cursor:pointer;">
                <input type="radio" name="garson_neden" style="accent-color:var(--amber-500); margin-right:8px;"> Bir soru sormak istiyorum
              </label>
            </div>

            <button class="cta-button" onclick="garsonCagirOnay()">
              <span>Çağrıyı Gönder</span>
            </button>
          </div>
        \`;
      } else {
        title.textContent = 'Hesap İste';
        body.innerHTML = \`
          <div style="text-align:center; padding: 10px 0 20px;">
            <div style="font-size:44px; margin-bottom:12px;">💳</div>
            <div style="font-size:18px; font-weight:800; color:var(--text-primary); margin-bottom:6px;">Hesap Masanıza Getirilsin mi?</div>
            <div style="font-size:14px; color:var(--emerald-500); font-weight:700; margin-bottom:20px;">\${masaInfo}</div>
            
            <div style="display:flex; flex-direction:column; gap:10px; text-align:left; margin-bottom:20px;">
              <label class="service-btn" style="cursor:pointer;">
                <input type="radio" name="odeme_yontem" checked style="accent-color:var(--emerald-500); margin-right:8px;"> Kredi Kartı / Temassız POS
              </label>
              <label class="service-btn" style="cursor:pointer;">
                <input type="radio" name="odeme_yontem" style="accent-color:var(--emerald-500); margin-right:8px;"> Nakit Ödeme
              </label>
              <label class="service-btn" style="cursor:pointer;">
                <input type="radio" name="odeme_yontem" style="accent-color:var(--emerald-500); margin-right:8px;"> Yemek Kartı (Multinet / Sodexo / Setcard)
              </label>
            </div>

            <button class="cta-button" style="background:linear-gradient(135deg, #10B981 0%, #059669 100%); color:#fff;" onclick="hesapIsteOnay()">
              <span>Hesap Talebini İlet</span>
            </button>
          </div>
        \`;
      }

      openSheet('serviceSheet');
    }

    function garsonCagirOnay() {
      closeSheet('serviceSheet');
      showToast('Garson masanıza yönlendirildi 🔔', '🔔');
    }

    function hesapIsteOnay() {
      closeSheet('serviceSheet');
      showToast('Hesap talebiniz garsona iletildi 💳', '💳');
    }

    // Modal Helpers
    function openSheet(id) {
      const sheet = document.getElementById(id);
      if (sheet) sheet.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function closeSheet(id) {
      const sheet = document.getElementById(id);
      if (sheet) sheet.classList.remove('open');
      document.body.style.overflow = '';
    }

    function closeOnBackdrop(e, id) {
      if (e.target.id === id) {
        closeSheet(id);
      }
    }

    // INIT
    menuYukle();
  </script>
</body>
</html>`;
}
