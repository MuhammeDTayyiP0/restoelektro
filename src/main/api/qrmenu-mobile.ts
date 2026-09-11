// =====================================================
// ETİBOL POS - Müşteri QR Menü Mobil Web Arayüzü
// Dark Fine-Dining — Lüks Tipografi Odaklı Katalog
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
  <meta name="theme-color" content="#0B0A08">
  <meta name="description" content="Dijital Menü — Lezzetlerimizi keşfedin">
  <title>Dijital Menü</title>
  <link rel="icon" type="image/x-icon" href="/favicon.ico">

  <!-- Premium Typography: Playfair Display SC (headings) + Karla (body) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Karla:wght@300;400;500;600;700&family=Playfair+Display+SC:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap" rel="stylesheet">

  <style>
    /* ==========================================================================
       DESIGN TOKENS — Dark Fine-Dining
       ========================================================================== */
    :root {
      /* Surfaces */
      --bg-base: #0B0A08;
      --bg-surface: #171410;
      --bg-elevated: #1E1A16;
      --bg-glass: rgba(11, 10, 8, 0.92);

      /* Clay Accent System */
      --gold-500: #9A5F48;
      --gold-400: #C08F7A;
      --gold-600: #824E3C;
      --gold-glow: rgba(154, 95, 72, 0.18);
      --gold-border: rgba(154, 95, 72, 0.12);
      --gold-border-active: rgba(154, 95, 72, 0.35);

      --text-primary: #F4EFE8;
      --text-secondary: #9C9284;
      --text-muted: #5C554C;
      --text-gold: #C08F7A;

      /* Borders */
      --border-subtle: rgba(255, 255, 255, 0.06);
      --border-card: rgba(255, 255, 255, 0.08);

      /* Functional */
      --red-500: #C0392B;
      --green-500: #27AE60;

      /* Geometry */
      --radius-sm: 6px;
      --radius-md: 12px;
      --radius-lg: 18px;
      --radius-xl: 24px;
      --radius-full: 9999px;

      /* Motion */
      --ease-smooth: cubic-bezier(0.16, 1, 0.3, 1);
      --ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
      --duration-fast: 200ms;
      --duration-normal: 300ms;
    }

    /* ==========================================================================
       RESET & BASE
       ========================================================================== */
    *,
    *::before,
    *::after {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      -webkit-tap-highlight-color: transparent;
    }

    html {
      scroll-behavior: smooth;
    }

    body {
      background-color: var(--bg-base);
      color: var(--text-primary);
      font-family: 'Karla', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-weight: 400;
      line-height: 1.5;
      min-height: 100dvh;
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      touch-action: manipulation;
    }

    /* ==========================================================================
       APP CONTAINER
       ========================================================================== */
    .app-container {
      max-width: 640px;
      width: 100%;
      margin: 0 auto;
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    /* ==========================================================================
       HEADER — Luxury Masthead
       ========================================================================== */
    .header-masthead {
      position: relative;
      padding: calc(env(safe-area-inset-top, 20px) + 24px) 24px 28px;
      text-align: center;
      border-bottom: 1px solid var(--border-subtle);
    }

    .header-masthead::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 50%;
      transform: translateX(-50%);
      width: 60px;
      height: 1px;
      background: var(--gold-500);
    }

    .brand-ornament {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-bottom: 8px;
      color: var(--gold-500);
      opacity: 0.5;
    }

    .brand-ornament-line {
      width: 32px;
      height: 1px;
      background: currentColor;
    }

    .brand-ornament svg {
      flex-shrink: 0;
    }

    .brand-title {
      font-family: 'Playfair Display SC', 'Playfair Display', serif;
      font-size: 26px;
      font-weight: 700;
      letter-spacing: 0.12em;
      color: var(--text-primary);
      line-height: 1.2;
      margin-bottom: 6px;
    }

    .brand-subtitle {
      font-family: 'Karla', sans-serif;
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      color: var(--text-muted);
    }

    .table-badge {
      display: none;
      margin-top: 12px;
      justify-content: center;
    }

    .table-badge-inner {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--gold-glow);
      border: 1px solid var(--gold-border-active);
      color: var(--gold-400);
      padding: 5px 14px;
      border-radius: var(--radius-full);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.04em;
    }

    /* ==========================================================================
       STICKY NAVIGATION — Search + Categories
       ========================================================================== */
    .sticky-nav {
      position: sticky;
      top: 0;
      z-index: 50;
      background: var(--bg-glass);
      backdrop-filter: blur(24px) saturate(1.2);
      -webkit-backdrop-filter: blur(24px) saturate(1.2);
      border-bottom: 1px solid var(--border-subtle);
    }

    /* Search */
    .search-section {
      padding: 14px 20px 8px;
    }

    .search-box {
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
      height: 44px;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-full);
      padding: 0 42px 0 44px;
      color: var(--text-primary);
      font-family: 'Karla', sans-serif;
      font-size: 14px;
      font-weight: 500;
      outline: none;
      transition: border-color var(--duration-fast) ease, box-shadow var(--duration-fast) ease;
    }

    .search-input::placeholder {
      color: var(--text-muted);
      font-weight: 400;
    }

    .search-input:focus {
      border-color: var(--gold-500);
      box-shadow: 0 0 0 3px var(--gold-glow);
    }

    .search-clear {
      position: absolute;
      right: 12px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.08);
      border: none;
      color: var(--text-secondary);
      display: none;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 12px;
      transition: background var(--duration-fast);
    }

    .search-clear:active {
      background: rgba(255, 255, 255, 0.16);
    }

    /* Category Tabs */
    .cat-scroll {
      padding: 8px 20px 14px;
      overflow-x: auto;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
      display: flex;
      gap: 8px;
    }

    .cat-scroll::-webkit-scrollbar {
      display: none;
    }

    .cat-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 16px;
      background: transparent;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-full);
      color: var(--text-secondary);
      font-family: 'Karla', sans-serif;
      font-size: 13px;
      font-weight: 600;
      white-space: nowrap;
      cursor: pointer;
      transition: all var(--duration-fast) ease;
      flex-shrink: 0;
      letter-spacing: 0.01em;
    }

    .cat-pill:active {
      transform: scale(0.96);
    }

    .cat-pill.active {
      background: var(--gold-glow);
      border-color: var(--gold-500);
      color: var(--gold-400);
    }

    .cat-pill-icon {
      font-size: 14px;
      line-height: 1;
    }

    .cat-pill-count {
      font-size: 11px;
      padding: 1px 6px;
      border-radius: var(--radius-full);
      background: rgba(255, 255, 255, 0.06);
      color: var(--text-muted);
      font-weight: 700;
    }

    .cat-pill.active .cat-pill-count {
      background: rgba(154, 95, 72, 0.2);
      color: var(--gold-400);
    }

    /* ==========================================================================
       MENU CONTENT AREA
       ========================================================================== */
    .menu-content {
      padding: 24px 20px 60px;
      flex: 1;
    }

    /* Category Group */
    .category-group {
      margin-bottom: 36px;
    }

    .category-header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      margin-bottom: 16px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--border-subtle);
      position: relative;
    }

    .category-header::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      width: 40px;
      height: 1px;
      background: var(--gold-500);
    }

    .category-title {
      font-family: 'Playfair Display SC', serif;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 0.1em;
      color: var(--text-primary);
      text-transform: uppercase;
    }

    .category-count {
      font-family: 'Karla', sans-serif;
      font-size: 12px;
      font-weight: 500;
      color: var(--text-muted);
      letter-spacing: 0.02em;
    }

    /* ==========================================================================
       DISH ITEM — Typography Mode (No Photo)
       Basılı lüks menü estetiği: Minimal, zarif satır düzeni
       ========================================================================== */
    .dish-list {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .dish-row {
      padding: 14px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      cursor: pointer;
      transition: background var(--duration-fast) ease;
      position: relative;
    }

    .dish-row:last-child {
      border-bottom: none;
    }

    .dish-row:active {
      background: rgba(154, 95, 72, 0.04);
    }

    .dish-row-top {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 3px;
    }

    .dish-name {
      font-family: 'Karla', sans-serif;
      font-size: 16px;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.3;
      flex: 1;
      min-width: 0;
    }

    .dish-dots {
      flex: 1;
      min-width: 20px;
      max-width: 80px;
      border-bottom: 1px dotted var(--text-muted);
      margin: 0 8px;
      opacity: 0.4;
      align-self: center;
      transform: translateY(-3px);
    }

    .dish-price {
      font-family: 'Karla', sans-serif;
      font-size: 16px;
      font-weight: 700;
      color: var(--gold-500);
      white-space: nowrap;
      flex-shrink: 0;
    }

    .dish-desc {
      font-family: 'Karla', sans-serif;
      font-size: 13px;
      font-weight: 400;
      color: var(--text-secondary);
      font-style: italic;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      margin-top: 2px;
    }

    .dish-unit-label {
      font-family: 'Karla', sans-serif;
      font-size: 11px;
      color: var(--text-muted);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    /* ==========================================================================
       DISH ITEM — Rich Card Mode (With Photo)
       Fotoğraflı ürünler otomatik zengin kart moduna geçer
       ========================================================================== */
    .dish-card-rich {
      display: flex;
      gap: 16px;
      padding: 14px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      cursor: pointer;
      transition: background var(--duration-fast) ease;
    }

    .dish-card-rich:last-child {
      border-bottom: none;
    }

    .dish-card-rich:active {
      background: rgba(154, 95, 72, 0.04);
    }

    .dish-thumb {
      width: 88px;
      height: 88px;
      border-radius: var(--radius-md);
      overflow: hidden;
      flex-shrink: 0;
      position: relative;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
    }

    .dish-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform var(--duration-normal) ease;
    }

    .dish-card-rich:active .dish-thumb img {
      transform: scale(1.05);
    }

    .dish-card-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-width: 0;
      padding: 2px 0;
    }

    .dish-card-title {
      font-family: 'Karla', sans-serif;
      font-size: 15px;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.25;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      margin-bottom: 4px;
    }

    .dish-card-desc {
      font-family: 'Karla', sans-serif;
      font-size: 12px;
      font-weight: 400;
      color: var(--text-secondary);
      line-height: 1.35;
      font-style: italic;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .dish-card-footer {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      margin-top: 6px;
    }

    .dish-card-price {
      font-family: 'Karla', sans-serif;
      font-size: 16px;
      font-weight: 700;
      color: var(--gold-500);
    }

    .dish-card-unit {
      font-size: 11px;
      color: var(--text-muted);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    /* ==========================================================================
       PRODUCT DETAIL — Read-Only Overlay
       ========================================================================== */
    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.78);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 100;
      opacity: 0;
      pointer-events: none;
      transition: opacity var(--duration-normal) ease;
      display: flex;
      align-items: flex-end;
      justify-content: center;
    }

    .overlay.open {
      opacity: 1;
      pointer-events: auto;
    }

    .detail-sheet {
      width: 100%;
      max-width: 600px;
      max-height: 85vh;
      background: var(--bg-surface);
      border-top: 1px solid var(--border-card);
      border-radius: var(--radius-xl) var(--radius-xl) 0 0;
      display: flex;
      flex-direction: column;
      transform: translateY(100%);
      transition: transform 0.4s var(--ease-spring);
      overflow: hidden;
    }

    .overlay.open .detail-sheet {
      transform: translateY(0);
    }

    .sheet-handle {
      width: 40px;
      height: 4px;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 2px;
      margin: 12px auto 8px;
    }

    .sheet-top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 4px 20px 14px;
      border-bottom: 1px solid var(--border-subtle);
    }

    .sheet-title {
      font-family: 'Playfair Display SC', serif;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: var(--text-secondary);
      text-transform: uppercase;
    }

    .sheet-close {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background var(--duration-fast);
      font-size: 14px;
    }

    .sheet-close:active {
      background: rgba(255, 255, 255, 0.12);
    }

    .sheet-body {
      padding: 20px;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      flex: 1;
    }

    /* Detail Image */
    .detail-img-wrap {
      width: 100%;
      aspect-ratio: 16 / 10;
      border-radius: var(--radius-lg);
      overflow: hidden;
      margin-bottom: 20px;
      background: var(--bg-elevated);
      border: 1px solid var(--border-subtle);
    }

    .detail-img-wrap img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .detail-name {
      font-family: 'Playfair Display', serif;
      font-size: 24px;
      font-weight: 600;
      color: var(--text-primary);
      line-height: 1.2;
      margin-bottom: 10px;
    }

    .detail-price-row {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border-subtle);
    }

    .detail-price {
      font-family: 'Karla', sans-serif;
      font-size: 28px;
      font-weight: 700;
      color: var(--gold-500);
    }

    .detail-unit {
      font-size: 13px;
      color: var(--text-muted);
      font-weight: 500;
    }

    .detail-desc {
      font-family: 'Karla', sans-serif;
      font-size: 15px;
      color: var(--text-secondary);
      line-height: 1.6;
      font-style: italic;
    }

    .detail-category-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-top: 16px;
      background: var(--gold-glow);
      border: 1px solid var(--gold-border);
      color: var(--gold-400);
      padding: 5px 14px;
      border-radius: var(--radius-full);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    /* ==========================================================================
       LOADING & EMPTY STATES
       ========================================================================== */
    .shimmer-loader {
      padding: 30px 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .shimmer-block {
      height: 20px;
      background: linear-gradient(90deg, #171410 0%, #1E1A16 50%, #171410 100%);
      background-size: 200% 100%;
      animation: shimmer 1.6s infinite ease-in-out;
      border-radius: var(--radius-sm);
    }

    .shimmer-block.w-60 { width: 60%; }
    .shimmer-block.w-80 { width: 80%; }
    .shimmer-block.w-40 { width: 40%; }
    .shimmer-block.h-lg { height: 40px; }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .empty-state {
      text-align: center;
      padding: 48px 20px;
      color: var(--text-muted);
    }

    .empty-state-icon {
      margin-bottom: 12px;
      opacity: 0.4;
      color: var(--gold-500);
    }

    .empty-state-title {
      font-family: 'Karla', sans-serif;
      font-size: 16px;
      font-weight: 700;
      color: var(--text-secondary);
      margin-bottom: 4px;
    }

    .empty-state-desc {
      font-size: 13px;
      color: var(--text-muted);
    }

    /* ==========================================================================
       TOAST
       ========================================================================== */
    .toast {
      position: fixed;
      top: calc(env(safe-area-inset-top, 16px) + 16px);
      left: 50%;
      transform: translateX(-50%) translateY(-100px);
      background: var(--bg-surface);
      border: 1px solid var(--gold-border-active);
      color: var(--text-primary);
      padding: 10px 20px;
      border-radius: var(--radius-full);
      font-family: 'Karla', sans-serif;
      font-size: 13px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(16px);
      z-index: 200;
      transition: transform 0.4s var(--ease-spring);
      pointer-events: none;
    }

    .toast.show {
      transform: translateX(-50%) translateY(0);
    }

    /* ==========================================================================
       ANIMATIONS
       ========================================================================== */
    @keyframes fadeUp {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animate-in {
      animation: fadeUp 0.4s var(--ease-smooth) both;
    }

    /* Stagger delays applied via JS inline style */

    /* ==========================================================================
       FOOTER
       ========================================================================== */
    .menu-footer {
      text-align: center;
      padding: 32px 20px 48px;
      border-top: 1px solid var(--border-subtle);
      position: relative;
    }

    .menu-footer::before {
      content: '';
      position: absolute;
      top: -1px;
      left: 50%;
      transform: translateX(-50%);
      width: 40px;
      height: 1px;
      background: var(--gold-500);
    }

    .footer-brand {
      font-family: 'Playfair Display SC', serif;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.12em;
      color: var(--text-muted);
      margin-bottom: 4px;
    }

    .footer-sub {
      font-size: 11px;
      color: var(--text-muted);
      opacity: 0.5;
      letter-spacing: 0.04em;
    }

    /* ==========================================================================
       REDUCED MOTION
       ========================================================================== */
    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
  </style>
</head>
<body>

  <div class="app-container">

    <!-- ═══════════════════════════════════════════════════════
         HEADER — Luxury Masthead
         ═══════════════════════════════════════════════════════ -->
    <header class="header-masthead">
      <div class="brand-ornament">
        <span class="brand-ornament-line"></span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2l2.09 6.26L20 9.27l-5 3.87L16.18 20 12 16.77 7.82 20 9 13.14l-5-3.87 5.91-1.01L12 2z"></path>
        </svg>
        <span class="brand-ornament-line"></span>
      </div>
      <h1 id="isletmeAdi" class="brand-title">RESTORAN</h1>
      <div class="brand-subtitle">Dijital Menü</div>

      <div id="masaBadge" class="table-badge">
        <div class="table-badge-inner">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <rect x="3" y="3" width="18" height="18" rx="3"></rect>
            <line x1="3" y1="9" x2="21" y2="9"></line>
          </svg>
          <span id="masaNoText">Masa 1</span>
        </div>
      </div>
    </header>

    <!-- ═══════════════════════════════════════════════════════
         STICKY NAVIGATION — Search + Category Tabs
         ═══════════════════════════════════════════════════════ -->
    <nav class="sticky-nav">
      <div class="search-section">
        <div class="search-box">
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
            placeholder="Menüde ara..."
            autocomplete="off"
            oninput="handleSearch(this.value)"
          >
          <button id="searchClearBtn" class="search-clear" onclick="clearSearch()">✕</button>
        </div>
      </div>

      <div id="catTabs" class="cat-scroll">
        <!-- Injected via JS -->
      </div>
    </nav>

    <!-- ═══════════════════════════════════════════════════════
         MAIN CONTENT
         ═══════════════════════════════════════════════════════ -->
    <main class="menu-content">
      <!-- Loading Skeleton -->
      <div id="loader" class="shimmer-loader">
        <div class="shimmer-block w-40 h-lg"></div>
        <div class="shimmer-block w-80"></div>
        <div class="shimmer-block w-60"></div>
        <div style="height: 16px"></div>
        <div class="shimmer-block w-80"></div>
        <div class="shimmer-block w-60"></div>
        <div class="shimmer-block w-40"></div>
        <div style="height: 16px"></div>
        <div class="shimmer-block w-40 h-lg"></div>
        <div class="shimmer-block w-80"></div>
        <div class="shimmer-block w-60"></div>
      </div>

      <!-- Menu Items Container -->
      <div id="menuContainer" style="display:none;"></div>
    </main>

  </div>

  <!-- ═══════════════════════════════════════════════════════
       PRODUCT DETAIL — Read-Only Bottom Sheet
       ═══════════════════════════════════════════════════════ -->
  <div id="detailOverlay" class="overlay" onclick="closeOnBackdrop(event)">
    <div class="detail-sheet">
      <div class="sheet-handle"></div>
      <div class="sheet-top-bar">
        <span class="sheet-title">Detay</span>
        <button class="sheet-close" onclick="closeDetail()" aria-label="Kapat">✕</button>
      </div>
      <div class="sheet-body">
        <div id="detailImgWrap" class="detail-img-wrap" style="display:none;">
          <!-- Injected via JS -->
        </div>
        <h2 id="detailName" class="detail-name">—</h2>
        <div class="detail-price-row">
          <span id="detailPrice" class="detail-price">₺ 0,00</span>
          <span id="detailUnit" class="detail-unit">/ Porsiyon</span>
        </div>
        <p id="detailDesc" class="detail-desc"></p>
        <div id="detailCatTag" class="detail-category-tag" style="display:none;"></div>
      </div>
    </div>
  </div>

  <!-- Toast -->
  <div id="toastEl" class="toast">
    <span id="toastMsg">—</span>
  </div>

  <!-- ═══════════════════════════════════════════════════════
       CLIENT APPLICATION LOGIC
       ═══════════════════════════════════════════════════════ -->
  <script>
    // ── State ──
    let menuState = {
      isletme_adi: 'Restoran',
      kategoriler: [],
      urunler: [],
      aktifKategoriId: null,
      aramaMetni: ''
    };

    // ── Masa Parametresi ──
    const urlParams = new URLSearchParams(window.location.search);
    const masaParam = urlParams.get('masa');

    if (masaParam) {
      const mb = document.getElementById('masaBadge');
      const mText = document.getElementById('masaNoText');
      mText.textContent = 'Masa ' + masaParam;
      mb.style.display = 'flex';
    }

    // ── Fiyat Formatlayıcı ──
    function formatFiyat(tutar) {
      return '₺ ' + Number(tutar || 0).toLocaleString('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }

    // ── Satış Türleri Fiyat Formatlayıcı ──
    function formatSatisTurleri(urun) {
      if (!urun) return '0 ₺';
      let turler = [];
      if (typeof urun.satis_turleri === 'string') {
        try { turler = JSON.parse(urun.satis_turleri); } catch(e) { turler = []; }
      } else if (Array.isArray(urun.satis_turleri)) {
        turler = urun.satis_turleri;
      }
      if ((!turler || turler.length === 0) && (urun.porsiyon_fiyati || urun.kilo_fiyati)) {
        turler = [];
        if (urun.porsiyon_fiyati) turler.push({ birim: 'porsiyon', fiyat: urun.porsiyon_fiyati });
        if (urun.kilo_fiyati) turler.push({ birim: 'kg', fiyat: urun.kilo_fiyati });
      }
      const formatBirim = (b) => {
        const s = (b || '').trim().toLowerCase();
        if (s === 'kg' || s === 'kilo') return 'KG';
        if (s === 'porsiyon') return 'Porsiyon';
        if (s === 'adet') return 'Adet';
        if (s === 'gram' || s === 'gr') return 'Gram';
        return b ? b.charAt(0).toUpperCase() + b.slice(1) : 'Porsiyon';
      };
      if (!turler || turler.length === 0) {
        const birim = formatBirim(urun.birim || 'Porsiyon');
        return birim + ': ' + Number(urun.fiyat || 0).toLocaleString('tr-TR') + ' ₺';
      }
      return turler
        .filter(t => t && t.fiyat !== undefined && t.fiyat !== null)
        .map(t => formatBirim(t.birim) + ': ' + Number(t.fiyat || 0).toLocaleString('tr-TR') + ' ₺')
        .join(' | ');
    }

    // ── Toast ──
    function showToast(msg) {
      const t = document.getElementById('toastEl');
      document.getElementById('toastMsg').textContent = msg;
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 2800);
    }

    // ── Kategori İkon Haritası ──
    const categoryIcons = {
      'çorba': '🍜', 'salata': '🥗', 'et': '🥩', 'kebap': '🔥',
      'tavuk': '🍗', 'balık': '🐟', 'deniz': '🦐', 'makarna': '🍝',
      'pizza': '🍕', 'burger': '🍔', 'sandviç': '🥪', 'tatlı': '🍮',
      'pasta': '🎂', 'dondurma': '🍨', 'kahvaltı': '🍳', 'meze': '🫒',
      'başlangıç': '🫒', 'ara': '🍢', 'ızgara': '🔥', 'fırın': '♨️',
      'içecek': '🥤', 'meşrubat': '🥤', 'su': '💧', 'kahve': '☕',
      'çay': '🍵', 'alkol': '🍷', 'kokteyl': '🍸', 'bira': '🍺',
      'şarap': '🍷', 'atıştırma': '🍿', 'aperatif': '🧀', 'ana': '🍽️',
      'yemek': '🍽️', 'pilav': '🍚', 'sebze': '🥬', 'vegan': '🌱',
      'default': '◆'
    };

    function getCategoryIcon(name) {
      const lower = (name || '').toLowerCase();
      for (const [key, icon] of Object.entries(categoryIcons)) {
        if (key !== 'default' && lower.includes(key)) return icon;
      }
      return categoryIcons['default'];
    }

    // ══════════════════════════════════════════════════════════
    // MENÜ VERİSİNİ YÜKLE (API çağrısı — korunuyor)
    // ══════════════════════════════════════════════════════════
    async function menuYukle() {
      try {
        const res = await fetch('/api/qrmenu');
        if (!res.ok) throw new Error('API Hatası');
        const data = await res.json();

        menuState.isletme_adi = data.isletme_adi || 'Restoran';
        const cats = data.kategoriler || [];
        cats.sort((a, b) => {
          const orderA = a.sira_no !== undefined && a.sira_no !== null ? a.sira_no : 999;
          const orderB = b.sira_no !== undefined && b.sira_no !== null ? b.sira_no : 999;
          if (orderA !== orderB) return orderA - orderB;
          return (a.ad || '').localeCompare(b.ad || '', 'tr');
        });
        menuState.kategoriler = cats;
        menuState.urunler = data.urunler || [];

        document.getElementById('isletmeAdi').textContent = menuState.isletme_adi;
        document.title = menuState.isletme_adi + ' — Dijital Menü';

        renderKategoriTabs();
        renderUrunler();

        document.getElementById('loader').style.display = 'none';
        document.getElementById('menuContainer').style.display = 'block';
      } catch (err) {
        console.error(err);
        document.getElementById('loader').innerHTML = \`
          <div class="empty-state">
            <div class="empty-state-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <div class="empty-state-title">Menüye Erişilemedi</div>
            <div class="empty-state-desc">Lütfen internet bağlantınızı kontrol edip sayfayı yenileyin.</div>
          </div>
        \`;
      }
    }

    // ══════════════════════════════════════════════════════════
    // KATEGORİ TABS
    // ══════════════════════════════════════════════════════════
    function renderKategoriTabs() {
      const container = document.getElementById('catTabs');
      container.innerHTML = '';

      // Tümü Butonu
      const tumuBtn = document.createElement('button');
      tumuBtn.className = 'cat-pill' + (menuState.aktifKategoriId === null ? ' active' : '');
      tumuBtn.innerHTML = \`
        <span class="cat-pill-icon">◆</span>
        <span>Tümü</span>
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
        if (urunSayisi === 0) return;

        const icon = getCategoryIcon(k.ad);
        const btn = document.createElement('button');
        btn.className = 'cat-pill' + (menuState.aktifKategoriId === k.id ? ' active' : '');
        btn.innerHTML = \`
          <span class="cat-pill-icon">\${icon}</span>
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

    // ══════════════════════════════════════════════════════════
    // ÜRÜNLERİ ÇİZ — İkili Mod (Tipografi / Zengin Kart)
    // ══════════════════════════════════════════════════════════
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
            <div class="empty-state-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                <line x1="8" y1="11" x2="14" y2="11"></line>
              </svg>
            </div>
            <div class="empty-state-title">Sonuç bulunamadı</div>
            <div class="empty-state-desc">Farklı bir terim deneyin veya kategorilere göz atın.</div>
          </div>
        \`;
        return;
      }

      // Kategoriye Göre Grupla
      const kategorilerListesi = menuState.aktifKategoriId !== null
        ? menuState.kategoriler.filter(k => k.id === menuState.aktifKategoriId)
        : menuState.kategoriler;

      let globalIndex = 0;

      kategorilerListesi.forEach(kat => {
        const katUrunler = filtrelenmis.filter(u => u.kategori_id === kat.id);
        if (katUrunler.length === 0) return;

        const groupDiv = document.createElement('div');
        groupDiv.className = 'category-group animate-in';
        groupDiv.style.animationDelay = (globalIndex * 0.06) + 's';

        groupDiv.innerHTML = \`
          <div class="category-header">
            <div class="category-title">\${kat.ad}</div>
            <div class="category-count">\${katUrunler.length} çeşit</div>
          </div>
        \`;

        const listDiv = document.createElement('div');
        listDiv.className = 'dish-list';

        katUrunler.forEach((urun, idx) => {
          const delay = ((globalIndex + idx) * 0.04) + 's';

          if (urun.resim_yolu) {
            // ── ZENGİN KART MODU (fotoğraflı) ──
            const card = document.createElement('div');
            card.className = 'dish-card-rich animate-in';
            card.style.animationDelay = delay;
            card.onclick = () => openDetail(urun);

            const descText = urun.kisaltma || '';

            card.innerHTML = \`
              <div class="dish-thumb">
                <img src="\${urun.resim_yolu}" alt="\${urun.ad}" loading="lazy">
              </div>
              <div class="dish-card-info">
                <div>
                  <div class="dish-card-title">\${urun.ad}</div>
                  \${descText ? '<div class="dish-card-desc">' + descText + '</div>' : ''}
                </div>
                <div class="dish-card-footer">
                  <span class="dish-card-price">\${formatSatisTurleri(urun)}</span>
                </div>
              </div>
            \`;

            listDiv.appendChild(card);
          } else {
            // ── TİPOGRAFİ MODU (fotoğrafsız) ──
            const row = document.createElement('div');
            row.className = 'dish-row animate-in';
            row.style.animationDelay = delay;
            row.onclick = () => openDetail(urun);

            const descText = urun.kisaltma || '';

            row.innerHTML = \`
              <div class="dish-row-top">
                <span class="dish-name">\${urun.ad}</span>
                <span class="dish-dots"></span>
                <span class="dish-price">\${formatSatisTurleri(urun)}</span>
              </div>
              \${descText ? '<div class="dish-desc">' + descText + '</div>' : ''}
            \`;

            listDiv.appendChild(row);
          }
        });

        groupDiv.appendChild(listDiv);
        container.appendChild(groupDiv);
        globalIndex += katUrunler.length;
      });

      // Footer
      const footer = document.createElement('div');
      footer.className = 'menu-footer animate-in';
      footer.style.animationDelay = (globalIndex * 0.03 + 0.2) + 's';
      footer.innerHTML = \`
        <div class="footer-brand">\${menuState.isletme_adi}</div>
        <div class="footer-sub">Dijital Menü</div>
      \`;
      container.appendChild(footer);
    }

    // ══════════════════════════════════════════════════════════
    // ARAMA
    // ══════════════════════════════════════════════════════════
    function handleSearch(val) {
      menuState.aramaMetni = val;
      const clearBtn = document.getElementById('searchClearBtn');
      clearBtn.style.display = val.trim() ? 'flex' : 'none';
      renderUrunler();
    }

    function clearSearch() {
      const input = document.getElementById('searchInput');
      input.value = '';
      menuState.aramaMetni = '';
      document.getElementById('searchClearBtn').style.display = 'none';
      renderUrunler();
    }

    // ══════════════════════════════════════════════════════════
    // ÜRÜN DETAY — Sade, Read-Only Modal
    // ══════════════════════════════════════════════════════════
    function openDetail(urun) {
      document.getElementById('detailName').textContent = urun.ad;
      document.getElementById('detailPrice').textContent = formatSatisTurleri(urun);
      document.getElementById('detailUnit').textContent = '';

      // Açıklama
      const descEl = document.getElementById('detailDesc');
      descEl.textContent = urun.kisaltma || '';
      descEl.style.display = urun.kisaltma ? 'block' : 'none';

      // Fotoğraf
      const imgWrap = document.getElementById('detailImgWrap');
      if (urun.resim_yolu) {
        imgWrap.innerHTML = '<img src="' + urun.resim_yolu + '" alt="' + urun.ad + '">';
        imgWrap.style.display = 'block';
      } else {
        imgWrap.style.display = 'none';
        imgWrap.innerHTML = '';
      }

      // Kategori etiketi
      const catTag = document.getElementById('detailCatTag');
      const kat = menuState.kategoriler.find(k => k.id === urun.kategori_id);
      if (kat) {
        catTag.textContent = kat.ad;
        catTag.style.display = 'inline-flex';
      } else {
        catTag.style.display = 'none';
      }

      // Aç
      const overlay = document.getElementById('detailOverlay');
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function closeDetail() {
      document.getElementById('detailOverlay').classList.remove('open');
      document.body.style.overflow = '';
    }

    function closeOnBackdrop(e) {
      if (e.target.id === 'detailOverlay') {
        closeDetail();
      }
    }

    // ── INIT ──
    menuYukle();
  </script>
</body>
</html>`;
}
