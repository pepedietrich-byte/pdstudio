import { useState, useMemo } from 'react'

const IMG_HERO       = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&q=85&auto=format&fit=crop'
const IMG_INTERIOR   = 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&q=80&auto=format&fit=crop'
const IMG_FOOD       = 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80&auto=format&fit=crop'
const IMG_ATMOSPHERE = 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200&q=80&auto=format&fit=crop'

const HOURS = [
  { day: 'Montag',     n: 1, time: '11:30 — 23:00' },
  { day: 'Dienstag',   n: 2, time: '11:30 — 23:00' },
  { day: 'Mittwoch',   n: 3, time: '11:30 — 23:00' },
  { day: 'Donnerstag', n: 4, time: '11:30 — 23:00' },
  { day: 'Freitag',    n: 5, time: '11:30 — 24:00' },
  { day: 'Samstag',    n: 6, time: '11:30 — 24:00' },
  { day: 'Sonntag',    n: 0, time: '11:30 — 22:00' },
]

const VORSPEISEN = [
  { name: 'Sächsische Zwiebelsuppe',   desc: 'Überbacken mit Gruyère, hausgemachte Croutons',          price: '8,90 €' },
  { name: 'Carpaccio vom Rind',         desc: 'Kapern, Parmesanspäne, Rucola, Zitronenöl',             price: '14,50 €' },
  { name: 'Räucherlachs auf Schwarzbrot', desc: 'Meerrettichcreme, Dill, eingelegte Gurke',            price: '13,90 €' },
]

const HAUPTSPEISEN = [
  { name: 'Sauerbraten vom Rind',      desc: 'Rotkraut, Thüringer Klöße, Sauerbratensoße',             price: '26,50 €', tag: 'Hausspecial' },
  { name: 'Leipziger Allerlei',         desc: 'Gemüseragout, Krebsbutter, Flusskrebse, Morcheln',      price: '24,00 €' },
  { name: 'Schmorbraten vom Kalb',      desc: 'Pfifferlinge, Semmelknödel, dunkle Rahmsoße',           price: '31,00 €' },
]

const DESSERTS = [
  { name: 'Hausgemachter Apfelstrudel', desc: 'Vanilleeis, Zimtschaum, karamellisierte Walnüsse',      price: '8,50 €' },
  { name: 'Sächsischer Quark',          desc: 'Traditionell mit Leinöl und Pellkartoffeln',             price: '9,90 €', tag: 'Traditionell' },
  { name: 'Rote Grütze',                desc: 'Saisonale Früchte, Vanillesoße, frische Minze',         price: '7,90 €' },
]

function Medallion() {
  return (
    <div className="medallion" aria-hidden="true">
      <svg viewBox="0 0 400 400" className="medallion-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <path id="cp" d="M 200,200 m -158,0 a 158,158 0 1,1 316,0 a 158,158 0 1,1 -316,0"/>
        </defs>
        <circle cx="200" cy="200" r="195" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 12" strokeOpacity="0.15"/>
        <circle cx="200" cy="200" r="172" stroke="currentColor" strokeWidth="0.4" strokeOpacity="0.08"/>
        <circle cx="200" cy="200" r="144" stroke="currentColor" strokeWidth="0.3" strokeOpacity="0.05"/>
        <text fontSize="10" letterSpacing="6.5" fill="currentColor" fillOpacity="0.22"
              fontFamily="'Cormorant Garamond', serif" fontWeight="500">
          <textPath href="#cp">
            BARTHELS HOF · SEIT 1497 · SÄCHSISCHE KÜCHE · HAINSTRASSE · LEIPZIG ·
          </textPath>
        </text>
        <g transform="translate(168,146)" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" opacity="0.30">
          <line x1="17" y1="8" x2="17" y2="96"/>
          <line x1="10" y1="8" x2="10" y2="32"/>
          <line x1="17" y1="8" x2="17" y2="32"/>
          <line x1="24" y1="8" x2="24" y2="32"/>
          <path d="M 10 32 C 10 44 24 44 24 32"/>
          <line x1="48" y1="8" x2="48" y2="96"/>
          <path d="M 48 8 C 48 8 62 22 62 38 L 48 46"/>
        </g>
      </svg>
    </div>
  )
}

function ArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6"/>
    </svg>
  )
}

function Dish({ name, desc, price, tag }) {
  return (
    <div className="dish">
      <div>
        <p className="dish-name">
          {name}
          {tag && <span className="dish-tag">{tag}</span>}
        </p>
        <p className="dish-desc">{desc}</p>
      </div>
      <span className="dish-price">{price}</span>
    </div>
  )
}

const CSS = `
:root {
  --brand:        #160b04;
  --brand-mid:    #1d1008;
  --brand-deep:   #0d0702;
  --cream:        #f0e2cc;
  --cream-soft:   #d3bb95;
  --cream-mute:   #9b7d52;
  --cream-faint:  #62503a;
  --gold:         #c49a3c;
  --gold-b:       #d4aa4c;
  --line:         rgba(240,226,204,0.09);
  --line-s:       rgba(240,226,204,0.20);
  --display:      'Cormorant Garamond', Georgia, serif;
  --sans:         'Inter', system-ui, sans-serif;
  --container:    1280px;
  --ease:         cubic-bezier(0.23,1,0.32,1);
  --r-md:         8px;
  --r-lg:         12px;
}

*,*::before,*::after { box-sizing: border-box; }
*::selection { background: var(--gold); color: var(--brand); }
html { scroll-behavior: smooth; }
html,body {
  margin: 0; padding: 0;
  background: var(--brand);
  color: var(--cream);
  font-family: var(--sans);
  font-size: 16px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
img { max-width: 100%; display: block; }
a { color: inherit; text-decoration: none; transition: color 200ms var(--ease), opacity 200ms var(--ease); }
button { font: inherit; cursor: pointer; border: 0; background: none; padding: 0; }

.eyebrow {
  font-family: var(--sans);
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--cream-mute);
}

.container {
  width: 100%;
  max-width: var(--container);
  margin: 0 auto;
  padding: 0 clamp(20px,5vw,52px);
}

section { padding: clamp(80px,10vw,144px) 0; position: relative; }

/* ── Demo Banner ─────────────────────────────────────────────────── */

.demo-banner {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--brand-deep);
  border-bottom: 1px solid var(--gold);
  color: var(--gold);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 36px;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.demo-banner .sep { opacity: 0.4; }

/* ── Nav ─────────────────────────────────────────────────────────── */

.nav {
  position: sticky;
  top: 36px;
  z-index: 90;
  background: rgba(22,11,4,0.90);
  backdrop-filter: blur(22px) saturate(130%);
  -webkit-backdrop-filter: blur(22px) saturate(130%);
  border-bottom: 1px solid var(--line);
}
.nav-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 72px;
  gap: 24px;
}
.nav-brand {
  font-family: var(--display);
  font-size: 26px;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: var(--cream);
  font-style: italic;
}
.nav-brand:hover { opacity: 1; color: var(--cream); }
.nav-links {
  display: flex;
  align-items: center;
  gap: clamp(20px,2.8vw,40px);
  list-style: none;
  margin: 0; padding: 0;
}
.nav-links a {
  font-size: 13.5px;
  font-weight: 400;
  letter-spacing: 0.04em;
  color: var(--cream-soft);
}
.nav-links a:hover { color: var(--cream); opacity: 1; }
.nav-ctas { display: flex; gap: 8px; }
.nav-cta {
  display: inline-flex;
  align-items: center;
  height: 40px;
  padding: 0 22px;
  border-radius: 2px;
  background: var(--gold);
  color: var(--brand);
  font-weight: 600;
  font-size: 13.5px;
  letter-spacing: 0.04em;
  transition: background 200ms var(--ease), transform 160ms var(--ease);
}
.nav-cta:hover { background: var(--gold-b); opacity: 1; }
.nav-cta:active { transform: scale(0.97); }
.nav-toggle {
  display: none;
  width: 40px; height: 40px;
  border: 1px solid var(--line-s);
  border-radius: var(--r-md);
  color: var(--cream);
  align-items: center;
  justify-content: center;
}
@media (max-width: 960px) {
  .nav-links, .nav-ctas { display: none; }
  .nav-toggle { display: inline-flex; }
}

/* ── Mobile Menu ─────────────────────────────────────────────────── */

.mobile-menu {
  position: fixed;
  top: calc(36px + 72px);
  left: 0; right: 0; bottom: 0;
  background: var(--brand);
  border-top: 1px solid var(--line);
  padding: 36px clamp(20px,5vw,52px) 48px;
  transform: translateY(-10px);
  opacity: 0;
  pointer-events: none;
  transition: transform 260ms var(--ease), opacity 220ms var(--ease);
  z-index: 89;
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow-y: auto;
}
.mobile-menu.open { transform: translateY(0); opacity: 1; pointer-events: auto; }
.mobile-menu a {
  font-family: var(--display);
  font-size: clamp(36px,9vw,56px);
  font-weight: 500;
  letter-spacing: -0.01em;
  padding: 16px 0;
  border-bottom: 1px solid var(--line);
  color: var(--cream);
  display: block;
  font-style: italic;
}
.mobile-menu a:hover { color: var(--gold-b); opacity: 1; }
.mobile-menu .mobile-cta {
  margin-top: 32px;
  display: inline-flex;
  align-items: center;
  height: 56px;
  padding: 0 32px;
  background: var(--gold);
  border-radius: 2px;
  font-family: var(--sans);
  font-size: 15px;
  font-weight: 600;
  color: var(--brand);
  letter-spacing: 0.04em;
  border-bottom: 0;
  font-style: normal;
  align-self: flex-start;
}
.mobile-menu .mobile-cta:hover { background: var(--gold-b); opacity: 1; }

/* ── Buttons ─────────────────────────────────────────────────────── */

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 56px;
  padding: 0 32px;
  border-radius: 2px;
  background: var(--cream);
  color: var(--brand);
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0.04em;
  transition: transform 160ms var(--ease), background 200ms var(--ease), box-shadow 200ms var(--ease);
}
.btn-primary:hover { background: #fff; opacity: 1; box-shadow: 0 18px 40px -12px rgba(0,0,0,0.35); }
.btn-primary:active { transform: scale(0.97); }

.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 56px;
  padding: 0 28px;
  border-radius: 2px;
  background: transparent;
  color: var(--cream);
  font-weight: 500;
  font-size: 14px;
  letter-spacing: 0.04em;
  border: 1px solid var(--line-s);
  transition: transform 160ms var(--ease), border-color 200ms var(--ease), background 200ms var(--ease);
}
.btn-ghost:hover { border-color: rgba(240,226,204,0.55); background: rgba(240,226,204,0.05); opacity: 1; }
.btn-ghost:active { transform: scale(0.97); }

.btn-gold {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 56px;
  padding: 0 32px;
  border-radius: 2px;
  background: var(--gold);
  color: var(--brand);
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0.04em;
  transition: transform 160ms var(--ease), background 200ms var(--ease);
}
.btn-gold:hover { background: var(--gold-b); opacity: 1; }
.btn-gold:active { transform: scale(0.97); }

/* ── Hero ────────────────────────────────────────────────────────── */

.hero {
  min-height: calc(100dvh - 36px - 72px);
  padding: clamp(60px,9vw,100px) 0;
  display: flex;
  align-items: center;
  background-size: cover;
  background-position: center top;
  position: relative;
  overflow: hidden;
}
.hero-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(115deg, rgba(22,11,4,0.97) 0%, rgba(22,11,4,0.82) 42%, rgba(22,11,4,0.48) 100%);
  z-index: 0;
}

.medallion {
  position: absolute;
  right: -12vw;
  top: 50%;
  transform: translateY(-50%);
  width: min(80vh,66vw);
  aspect-ratio: 1;
  color: var(--cream);
  pointer-events: none;
  z-index: 0;
}
.medallion-svg {
  width: 100%; height: 100%;
  animation: med-spin 120s linear infinite;
  will-change: transform;
}
@keyframes med-spin { to { transform: rotate(360deg); } }
@media (max-width: 760px) {
  .medallion {
    right: auto; left: 50%; top: auto; bottom: -12%;
    transform: translateX(-50%);
    width: 140vw;
    opacity: 0.28;
  }
}

.hero-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
}
.hero-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: clamp(52px,9vw,108px);
}
.hero-since {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-family: var(--display);
  font-size: clamp(14px,1.2vw,17px);
  font-weight: 400;
  letter-spacing: 0.06em;
  color: var(--gold);
  font-style: italic;
}
.hero-seit-dot {
  width: 5px; height: 5px;
  border-radius: 50%;
  background: var(--gold);
  display: inline-block;
  opacity: 0.7;
}

.hero-main { max-width: 860px; }
.hero-main h1 {
  font-family: var(--display);
  font-size: clamp(76px,14vw,200px);
  font-weight: 400;
  line-height: 0.86;
  letter-spacing: -0.02em;
  margin: 0 0 clamp(28px,4vw,48px);
  color: var(--cream);
}
.hero-main h1 em {
  font-style: italic;
  font-weight: 300;
  color: var(--gold);
  display: block;
}
.hero-sub {
  font-size: clamp(15px,1.3vw,18px);
  line-height: 1.7;
  color: var(--cream-soft);
  max-width: 52ch;
  margin: 0 0 clamp(32px,4vw,52px);
  font-weight: 300;
}
.hero-ctas {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}
@media (max-width: 480px) { .hero-ctas { flex-direction: column; align-items: stretch; } }

.hero-meta {
  display: flex;
  gap: clamp(32px,6vw,80px);
  margin-top: clamp(52px,8vw,100px);
  padding-top: 28px;
  border-top: 1px solid var(--line);
  flex-wrap: wrap;
}
.hero-meta-item { display: flex; flex-direction: column; gap: 6px; }
.hero-meta-item .k {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--cream-mute);
}
.hero-meta-item .v {
  font-family: var(--display);
  font-size: clamp(18px,1.8vw,24px);
  font-weight: 400;
  letter-spacing: 0.01em;
  color: var(--cream);
  line-height: 1.25;
  font-style: italic;
}
.hero-meta-item .v small {
  font-family: var(--sans);
  font-size: 13px;
  font-weight: 400;
  font-style: normal;
  color: var(--cream-mute);
}

/* ── Trust Strip ─────────────────────────────────────────────────── */

.trust {
  padding: 44px 0;
  background: var(--brand-mid);
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}
.trust-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
}
.trust-item { display: flex; flex-direction: column; gap: 5px; }
.trust-item .n {
  font-family: var(--display);
  font-size: clamp(20px,2.4vw,32px);
  font-weight: 500;
  letter-spacing: 0.01em;
  line-height: 1;
  color: var(--cream);
  font-style: italic;
}
.trust-item .l {
  font-size: 10.5px;
  font-weight: 400;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--cream-mute);
}
.trust-divider {
  width: 1px;
  height: 40px;
  background: var(--line-s);
}
@media (max-width: 680px) { .trust-divider { display: none; } }

/* ── Konzept ─────────────────────────────────────────────────────── */

.konzept-grid {
  display: grid;
  grid-template-columns: 5fr 7fr;
  gap: clamp(48px,7vw,104px);
  align-items: start;
}
@media (max-width: 920px) { .konzept-grid { grid-template-columns: 1fr; gap: 48px; } }

.konzept-left h2 {
  font-family: var(--display);
  font-size: clamp(42px,6vw,84px);
  font-weight: 400;
  line-height: 0.94;
  letter-spacing: -0.01em;
  margin: 20px 0 32px;
  color: var(--cream);
  text-wrap: balance;
}
.konzept-left h2 em { font-style: italic; font-weight: 300; color: var(--cream-soft); }
.konzept-img {
  border-radius: var(--r-lg);
  overflow: hidden;
  border: 1px solid var(--line);
  position: relative;
}
.konzept-img::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 55%, rgba(22,11,4,0.35) 100%);
  pointer-events: none;
}
.konzept-img img {
  width: 100%; height: 340px;
  object-fit: cover;
  display: block;
  filter: brightness(0.90) contrast(1.05) saturate(0.95);
}

.konzept-right .lead-p {
  font-family: var(--display);
  font-size: clamp(18px,1.7vw,23px);
  font-weight: 400;
  line-height: 1.6;
  color: var(--cream);
  margin: 0 0 24px;
  font-style: italic;
}
.konzept-right p {
  font-size: clamp(14px,1.1vw,16px);
  line-height: 1.8;
  color: var(--cream-soft);
  margin: 0 0 18px;
  max-width: 58ch;
  font-weight: 300;
}

.konzept-facts {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  margin-top: 40px;
  padding-top: 32px;
  border-top: 1px solid var(--line);
}
@media (max-width: 600px) { .konzept-facts { grid-template-columns: 1fr; } }
.fact { padding: 0 22px 0 0; border-right: 1px solid var(--line); }
.fact:first-child { padding-left: 0; }
.fact:last-child { border-right: 0; padding-right: 0; }
@media (max-width: 600px) {
  .fact { padding: 20px 0; border-right: 0; border-bottom: 1px solid var(--line); }
  .fact:last-child { border-bottom: 0; }
}
.fact .k {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--cream-mute);
  margin-bottom: 8px;
}
.fact .v {
  font-family: var(--display);
  font-size: 17px;
  font-weight: 400;
  letter-spacing: 0.01em;
  color: var(--cream);
  line-height: 1.4;
  font-style: italic;
}

/* ── Showcase ────────────────────────────────────────────────────── */

.showcase {
  position: relative;
  width: 100%;
  height: clamp(320px,55vh,600px);
  overflow: hidden;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}
.showcase img {
  width: 100%; height: 100%;
  object-fit: cover; display: block;
  filter: brightness(0.78) contrast(1.08) saturate(0.88);
}
.showcase::after {
  content: '';
  position: absolute; inset: 0;
  background:
    linear-gradient(180deg, rgba(22,11,4,0.12) 0%, transparent 30%, transparent 54%, rgba(22,11,4,0.92) 100%),
    linear-gradient(90deg, rgba(22,11,4,0.65) 0%, transparent 52%);
  pointer-events: none;
}
.showcase-text {
  position: absolute;
  left: clamp(20px,5vw,68px);
  bottom: clamp(32px,5vw,60px);
  z-index: 1;
  max-width: 560px;
}
.showcase-text .eyebrow { display: block; margin-bottom: 16px; }
.showcase-text p {
  font-family: var(--display);
  font-style: italic;
  font-size: clamp(24px,3.2vw,44px);
  font-weight: 300;
  line-height: 1.18;
  letter-spacing: -0.01em;
  color: var(--cream);
  margin: 0;
}

/* ── Karte ───────────────────────────────────────────────────────── */

.karte-section {
  background: var(--brand-mid);
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}
.karte-head {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 32px;
  align-items: end;
  margin-bottom: clamp(52px,7vw,88px);
}
@media (max-width: 760px) { .karte-head { grid-template-columns: 1fr; gap: 20px; } }
.karte-head h2 {
  font-family: var(--display);
  font-size: clamp(58px,11vw,148px);
  font-weight: 400;
  line-height: 0.86;
  letter-spacing: -0.015em;
  margin: 20px 0 0;
  color: var(--cream);
}
.karte-head h2 em { font-style: italic; font-weight: 300; color: var(--cream-soft); }
.karte-demo-note { text-align: right; }
@media (max-width: 760px) { .karte-demo-note { text-align: left; } }
.demo-tag {
  display: inline-block;
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--gold);
  border: 1px solid var(--gold);
  border-radius: 2px;
  padding: 3px 10px;
  margin-bottom: 8px;
}
.karte-demo-note p { font-size: 13px; color: var(--cream-mute); margin: 0; }
.karte-demo-note strong { color: var(--cream-soft); }

.karte-grid {
  display: grid;
  grid-template-columns: repeat(3,1fr);
  gap: clamp(24px,4.5vw,64px);
}
@media (max-width: 900px) { .karte-grid { grid-template-columns: 1fr; gap: 52px; } }

.menu-col { display: flex; flex-direction: column; gap: 24px; }
.menu-col-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--line-s);
}
.menu-col-head h3 {
  font-family: var(--display);
  font-size: 24px;
  font-weight: 500;
  letter-spacing: 0.01em;
  margin: 0;
  color: var(--cream);
  font-style: italic;
}
.menu-col-head span {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--cream-mute);
}
.dish {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 14px;
  align-items: baseline;
}
.dish-name {
  font-family: var(--display);
  font-size: 17px;
  font-weight: 500;
  letter-spacing: 0.01em;
  color: var(--cream);
  line-height: 1.3;
  margin: 0 0 5px;
}
.dish-tag {
  display: inline-block;
  font-family: var(--sans);
  font-size: 9px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--gold);
  border: 1px solid var(--gold);
  border-radius: 2px;
  padding: 2px 7px;
  margin-left: 8px;
  vertical-align: middle;
}
.dish-desc {
  font-size: 12.5px;
  line-height: 1.55;
  color: var(--cream-mute);
  margin: 0;
  font-weight: 300;
}
.dish-price {
  font-size: 14px;
  font-weight: 500;
  color: var(--cream-soft);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}

/* ── Öffnungszeiten ──────────────────────────────────────────────── */

.hours-section {
  background: var(--brand-deep);
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}
.hours-grid {
  display: grid;
  grid-template-columns: 4fr 8fr;
  gap: clamp(44px,7vw,104px);
  align-items: start;
}
@media (max-width: 920px) { .hours-grid { grid-template-columns: 1fr; gap: 40px; } }
.hours-head h2 {
  font-family: var(--display);
  font-size: clamp(40px,6vw,72px);
  font-weight: 400;
  line-height: 0.95;
  letter-spacing: -0.01em;
  margin: 20px 0 20px;
  color: var(--cream);
}
.hours-head h2 em { font-style: italic; font-weight: 300; color: var(--cream-soft); }
.hours-head .lead-text {
  font-size: 15px;
  line-height: 1.85;
  color: var(--cream-soft);
  margin: 0;
  font-weight: 300;
}
.hours-list { border-top: 1px solid var(--line); }
.hours-row {
  display: grid;
  grid-template-columns: 140px 1fr auto;
  gap: 16px;
  align-items: baseline;
  padding: 18px 0;
  border-bottom: 1px solid var(--line);
}
.hours-row.today {
  background: rgba(196,154,60,0.07);
  padding: 18px 14px;
  margin: 0 -14px;
  border-radius: 4px;
}
.hours-row .day {
  font-family: var(--display);
  font-size: 19px;
  font-weight: 500;
  letter-spacing: 0.01em;
  color: var(--cream);
  font-style: italic;
}
.hours-row .marker {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--gold);
}
.hours-row .time {
  font-size: 14.5px;
  font-weight: 400;
  color: var(--cream);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.03em;
}

/* ── Anfahrt & Kontakt ───────────────────────────────────────────── */

.contact-section {
  background: var(--brand);
  border-top: 1px solid var(--line);
}
.contact-grid {
  display: grid;
  grid-template-columns: 6fr 4fr;
  gap: clamp(44px,7vw,100px);
  align-items: start;
}
@media (max-width: 920px) { .contact-grid { grid-template-columns: 1fr; gap: 52px; } }

.contact-left h2 {
  font-family: var(--display);
  font-size: clamp(40px,6vw,72px);
  font-weight: 400;
  line-height: 0.95;
  letter-spacing: -0.01em;
  margin: 20px 0 24px;
  color: var(--cream);
}
.contact-left h2 em { font-style: italic; font-weight: 300; color: var(--cream-soft); }
.contact-left > .intro-p {
  font-size: 16px;
  color: var(--cream-soft);
  max-width: 52ch;
  margin: 0 0 36px;
  line-height: 1.75;
  font-weight: 300;
}
.contact-block {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-bottom: 36px;
}
@media (max-width: 600px) { .contact-block { grid-template-columns: 1fr; } }
.contact-cell .key {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--cream-mute);
  margin-bottom: 8px;
}
.contact-cell .val {
  font-family: var(--display);
  font-size: 19px;
  font-weight: 400;
  letter-spacing: 0.01em;
  color: var(--cream);
  line-height: 1.4;
  font-style: italic;
}
.contact-cell .val.mono { font-family: var(--sans); font-size: 15px; letter-spacing: 0; font-weight: 400; font-style: normal; }
.contact-cell .val a { color: var(--cream); border-bottom: 1px solid var(--line-s); padding-bottom: 1px; }
.contact-cell .val a:hover { color: var(--gold-b); border-color: var(--gold-b); opacity: 1; }

.map-container {
  border-radius: var(--r-lg);
  overflow: hidden;
  border: 1px solid var(--line);
  height: 240px;
  margin-top: 4px;
}
.map-container iframe {
  width: 100%; height: 100%;
  display: block;
  filter: grayscale(30%) brightness(0.82) contrast(1.1) sepia(18%);
}

.reserve-card {
  border-radius: var(--r-lg);
  overflow: hidden;
  border: 1px solid var(--line);
  background: var(--brand-mid);
}
.reserve-card img {
  width: 100%; height: 200px;
  object-fit: cover; display: block;
  filter: brightness(0.82) contrast(1.06) saturate(0.92);
}
.reserve-card-body {
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.reserve-card-body .eyebrow { display: block; }
.reserve-card-num {
  font-family: var(--display);
  font-size: 27px;
  font-weight: 500;
  letter-spacing: 0.01em;
  color: var(--cream);
  margin: 0;
  font-style: italic;
}
.reserve-card-body p {
  font-size: 14px;
  line-height: 1.65;
  color: var(--cream-soft);
  margin: 0;
  font-weight: 300;
}
.reserve-card-body .btn-gold {
  margin-top: 8px;
  height: 48px;
  font-size: 13.5px;
  align-self: flex-start;
}

/* ── Footer ──────────────────────────────────────────────────────── */

footer {
  background: var(--brand-deep);
  border-top: 1px solid var(--line);
  padding: 76px 0 32px;
}
.footer-top {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 40px;
  margin-bottom: 60px;
}
@media (max-width: 760px) { .footer-top { grid-template-columns: 1fr 1fr; gap: 32px; } }
@media (max-width: 480px) { .footer-top { grid-template-columns: 1fr; } }

.footer-brand {
  font-family: var(--display);
  font-size: 36px;
  font-weight: 400;
  letter-spacing: 0;
  color: var(--cream);
  margin-bottom: 12px;
  line-height: 1;
  font-style: italic;
}
.footer-tag { font-size: 13px; color: var(--cream-mute); line-height: 1.75; margin: 0; font-weight: 300; }

.footer-col h4 {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--cream-mute);
  margin: 0 0 18px;
}
.footer-col ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 9px; }
.footer-col a { font-size: 13.5px; color: var(--cream-soft); font-weight: 300; }
.footer-col a:hover { color: var(--cream); opacity: 1; }
.footer-col p { font-size: 13.5px; color: var(--cream-soft); margin: 0 0 5px; line-height: 1.7; font-weight: 300; }

.footer-bottom {
  border-top: 1px solid var(--line);
  padding-top: 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.footer-bottom p { font-size: 12px; color: var(--cream-mute); margin: 0; font-weight: 300; }
.footer-bottom strong { color: var(--cream-soft); font-weight: 500; }
.footer-bottom-demo {
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--cream-faint);
  padding: 4px 10px;
  border: 1px solid var(--line);
  border-radius: 2px;
}

/* ── Map anchor offset ──────────────────────────────────────────── */
#anfahrt { scroll-margin-top: calc(36px + 72px); }
#karte   { scroll-margin-top: calc(36px + 72px); }
#zeiten  { scroll-margin-top: calc(36px + 72px); }
#konzept { scroll-margin-top: calc(36px + 72px); }

/* ── Reduced Motion ──────────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
@media (hover: none) {
  .btn-primary:hover, .btn-ghost:hover, .btn-gold:hover { transform: none; }
}
`

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const today = useMemo(() => new Date().getDay(), [])
  const close = () => setMenuOpen(false)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Demo Banner */}
      <div className="demo-banner">
        <span>Demo von PDSTUDIO</span>
        <span className="sep">·</span>
        <span>barthels-hof.de</span>
      </div>

      {/* Nav */}
      <nav className="nav">
        <div className="container nav-inner">
          <a href="#top" className="nav-brand">Barthels Hof</a>
          <ul className="nav-links">
            <li><a href="#konzept">Geschichte</a></li>
            <li><a href="#karte">Speisekarte</a></li>
            <li><a href="#zeiten">Öffnungszeiten</a></li>
            <li><a href="#anfahrt">Anfahrt</a></li>
          </ul>
          <div className="nav-ctas">
            <a href="tel:+493411410310" className="nav-cta">Reservieren</a>
          </div>
          <button className="nav-toggle" onClick={() => setMenuOpen(o => !o)} aria-label="Menü öffnen">
            {menuOpen
              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
            }
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`mobile-menu${menuOpen ? ' open' : ''}`} aria-hidden={!menuOpen}>
        <a href="#konzept" onClick={close}>Geschichte</a>
        <a href="#karte" onClick={close}>Speisekarte</a>
        <a href="#zeiten" onClick={close}>Öffnungszeiten</a>
        <a href="#anfahrt" onClick={close}>Anfahrt</a>
        <a href="tel:+493411410310" className="mobile-cta" onClick={close}>Jetzt reservieren</a>
      </div>

      <main id="top">

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="hero" style={{ backgroundImage: `url(${IMG_HERO})` }}>
          <div className="hero-overlay" />
          <Medallion />
          <div className="container hero-content">

            <div className="hero-top">
              <span className="eyebrow">Sächsische Küche · Hainstraße · Leipzig</span>
              <span className="hero-since">
                <span className="hero-seit-dot" />
                Gegründet 1497
              </span>
            </div>

            <div className="hero-main">
              <h1>
                Sächsische<br />
                Küche.<br />
                <em>Seit 1497.</em>
              </h1>
              <p className="hero-sub">
                Barthels Hof — Leipzig besucht uns seit dem 15. Jahrhundert.
                In der ältesten Passage der Stadt trifft historisches Ambiente auf
                sächsische Handwerkskunst und regionale Weine.
              </p>
              <div className="hero-ctas">
                <a href="#karte" className="btn-primary">Speisekarte ansehen</a>
                <a href="tel:+493411410310" className="btn-ghost">
                  0341 1410310
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M5 4h4l2 5-3 2a11 11 0 005 5l2-3 5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/>
                  </svg>
                </a>
              </div>
            </div>

            <div className="hero-meta">
              <div className="hero-meta-item">
                <span className="k">Bewertung</span>
                <span className="v">4,3 ★ <small>2.800 Bewertungen</small></span>
              </div>
              <div className="hero-meta-item">
                <span className="k">Adresse</span>
                <span className="v">Hainstraße 1<br />04109 Leipzig</span>
              </div>
              <div className="hero-meta-item">
                <span className="k">Küche</span>
                <span className="v">Sächsische Spezialitäten</span>
              </div>
              <div className="hero-meta-item">
                <span className="k">Preisklasse</span>
                <span className="v">€€€</span>
              </div>
            </div>

          </div>
        </section>

        {/* ── Trust Strip ───────────────────────────────────────────────── */}
        <section className="trust" style={{ padding: '44px 0' }}>
          <div className="container">
            <div className="trust-row">
              <div className="trust-item">
                <span className="n">Seit 1497</span>
                <span className="l">Älteste Passage Leipzigs</span>
              </div>
              <div className="trust-divider" />
              <div className="trust-item">
                <span className="n">4,3 ★</span>
                <span className="l">2.800 Google-Bewertungen</span>
              </div>
              <div className="trust-divider" />
              <div className="trust-item">
                <span className="n">Innenhof</span>
                <span className="l">Historisches Ambiente</span>
              </div>
              <div className="trust-divider" />
              <div className="trust-item">
                <span className="n">€€€</span>
                <span className="l">Regionale Weine · Premium</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Konzept / Geschichte ──────────────────────────────────────── */}
        <section id="konzept">
          <div className="container">
            <div className="konzept-grid">

              <div className="konzept-left">
                <span className="eyebrow">Geschichte & Atmosphäre</span>
                <h2>Leipzig<br /><em>tafelt hier<br />seit dem<br />15. Jahrhundert.</em></h2>
                <div className="konzept-img">
                  <img src={IMG_INTERIOR} alt="Historisches Ambiente im Barthels Hof, elegante Einrichtung" loading="lazy" />
                </div>
              </div>

              <div className="konzept-right">
                <p className="lead-p">
                  Barthels Hof ist mehr als ein Restaurant — es ist ein Stück Stadtgeschichte.
                  Seit 1497 empfängt die älteste Passage Leipzigs Gäste, die den Unterschied zwischen
                  einem guten Abend und einem unvergesslichen Abend kennen.
                </p>
                <p>
                  Wer durch den Torbogen in der Hainstraße tritt, betritt einen anderen Zeitraum.
                  Der historische Innenhof, die gewölbten Decken, das gedämpfte Licht — all das ist
                  nicht inszeniert. Es ist gewachsen. Über Jahrhunderte.
                </p>
                <p>
                  Auf der Karte finden Sie sächsische Klassiker, wie sie sein sollen: handgemacht,
                  mit regionalen Zutaten, ohne Kompromisse. Begleitet von einer Weinauswahl, die dem
                  Anlass gerecht wird — ob Geschäftsessen, Geburtstag oder einfach ein langer Abend
                  zu zweit.
                </p>
                <div className="konzept-facts">
                  <div className="fact">
                    <div className="k">Gegründet</div>
                    <div className="v">1497 — über 525 Jahre</div>
                  </div>
                  <div className="fact">
                    <div className="k">Lage</div>
                    <div className="v">Hainstraße 1, Stadtzentrum</div>
                  </div>
                  <div className="fact">
                    <div className="k">Besonderheit</div>
                    <div className="v">Historischer Innenhof</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── Showcase ─────────────────────────────────────────────────── */}
        <div className="showcase">
          <img src={IMG_FOOD} alt="Sächsische Spezialitäten im Barthels Hof — handgemacht, regional" loading="lazy" />
          <div className="showcase-text">
            <span className="eyebrow">Sächsische Handwerkskunst</span>
            <p>Regionale Zutaten —<br />traditionelle Rezepte seit Generationen.</p>
          </div>
        </div>

        {/* ── Speisekarte ───────────────────────────────────────────────── */}
        <section id="karte" className="karte-section">
          <div className="container">

            <div className="karte-head">
              <div>
                <span className="eyebrow" style={{ display: 'block', marginBottom: '20px' }}>Die Speisekarte</span>
                <h2>Sächsische<br /><em>Klassiker.</em></h2>
              </div>
              <div className="karte-demo-note">
                <span className="demo-tag">Demo-Karte</span>
                <p>Aktuelle Karte und Tagesmenu<br />auf <strong>barthels-hof.de</strong></p>
              </div>
            </div>

            <div className="karte-grid">

              <div className="menu-col">
                <div className="menu-col-head">
                  <h3>Vorspeisen</h3>
                  <span>Zum Auftakt</span>
                </div>
                {VORSPEISEN.map((item, i) => <Dish key={i} {...item} />)}
              </div>

              <div className="menu-col">
                <div className="menu-col-head">
                  <h3>Hauptspeisen</h3>
                  <span>Sächsische Küche</span>
                </div>
                {HAUPTSPEISEN.map((item, i) => <Dish key={i} {...item} />)}
              </div>

              <div className="menu-col">
                <div className="menu-col-head">
                  <h3>Desserts</h3>
                  <span>Zum Abschluss</span>
                </div>
                {DESSERTS.map((item, i) => <Dish key={i} {...item} />)}
              </div>

            </div>
          </div>
        </section>

        {/* ── Öffnungszeiten ───────────────────────────────────────────── */}
        <section id="zeiten" className="hours-section">
          <div className="container">
            <div className="hours-grid">

              <div className="hours-head">
                <span className="eyebrow">Öffnungszeiten</span>
                <h2>Täglich<br /><em>ab halb zwölf.</em></h2>
                <p className="lead-text">
                  Montag bis Donnerstag<br />11:30 bis 23:00 Uhr.<br />
                  Freitag und Samstag<br />11:30 bis 24:00 Uhr.<br />
                  Sonntag 11:30 bis 22:00 Uhr.
                </p>
              </div>

              <div className="hours-list">
                {HOURS.map(({ day, n, time }) => (
                  <div key={n} className={`hours-row${today === n ? ' today' : ''}`}>
                    <span className="day">{day}</span>
                    <span className="marker">{today === n ? 'Heute' : ''}</span>
                    <span className="time">{time}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </section>

        {/* ── Anfahrt & Kontakt ────────────────────────────────────────── */}
        <section id="anfahrt" className="contact-section">
          <div className="container">
            <div className="contact-grid">

              <div className="contact-left">
                <span className="eyebrow">Anfahrt & Reservierung</span>
                <h2>Mitten in<br /><em>Leipzig.</em></h2>
                <p className="intro-p">
                  Barthels Hof liegt direkt im Herzen der Altstadt — Hainstraße 1,
                  wenige Schritte vom Markt entfernt. Strassenbahn, Bus und Parkhaus
                  in unmittelbarer Nähe.
                </p>

                <div className="contact-block">
                  <div className="contact-cell">
                    <div className="key">Adresse</div>
                    <div className="val">Hainstraße 1<br />04109 Leipzig</div>
                  </div>
                  <div className="contact-cell">
                    <div className="key">Telefon</div>
                    <div className="val mono">
                      <a href="tel:+493411410310">0341 1410310</a>
                    </div>
                  </div>
                  <div className="contact-cell">
                    <div className="key">Öffnungszeiten</div>
                    <div className="val">Täglich ab 11:30 Uhr</div>
                  </div>
                  <div className="contact-cell">
                    <div className="key">Website</div>
                    <div className="val mono">
                      <a href="https://barthels-hof.de" target="_blank" rel="noopener">
                        barthels-hof.de
                      </a>
                    </div>
                  </div>
                </div>

                <div className="map-container">
                  <iframe
                    title="Barthels Hof auf der Karte"
                    src="https://maps.google.com/maps?q=Hainstra%C3%9Fe+1%2C+04109+Leipzig&output=embed&z=16"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                </div>

                <a
                  href="https://maps.google.com/?q=Barthels+Hof+Hainstraße+1+Leipzig"
                  target="_blank"
                  rel="noopener"
                  className="btn-ghost"
                  style={{ marginTop: '20px', alignSelf: 'flex-start', height: '48px', fontSize: '13.5px' }}
                >
                  In Google Maps öffnen
                  <ArrowRight />
                </a>
              </div>

              <div className="contact-right">
                <div className="reserve-card">
                  <img src={IMG_ATMOSPHERE} alt="Atmosphärisches Ambiente im Barthels Hof" loading="lazy" />
                  <div className="reserve-card-body">
                    <span className="eyebrow">Tisch reservieren</span>
                    <p className="reserve-card-num">0341 1410310</p>
                    <p>Für Gruppen, besondere Anlässe oder ein spontanes Abendessen — wir freuen uns auf Ihren Anruf.</p>
                    <a href="tel:+493411410310" className="btn-gold">Jetzt reservieren</a>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer>
        <div className="container">
          <div className="footer-top">

            <div>
              <div className="footer-brand">Barthels Hof</div>
              <p className="footer-tag">
                Hainstraße 1 · 04109 Leipzig<br />
                Sächsische Küche · Seit 1497
              </p>
            </div>

            <div className="footer-col">
              <h4>Kontakt</h4>
              <ul>
                <li><a href="tel:+493411410310">0341 1410310</a></li>
                <li>
                  <a href="https://barthels-hof.de" target="_blank" rel="noopener">
                    barthels-hof.de
                  </a>
                </li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Öffnungszeiten</h4>
              <p>Mo–Do: 11:30–23:00 Uhr</p>
              <p>Fr–Sa: 11:30–24:00 Uhr</p>
              <p>So: 11:30–22:00 Uhr</p>
            </div>

            <div className="footer-col">
              <h4>Rechtliches</h4>
              <ul>
                <li><a href="#impressum">Impressum</a></li>
                <li><a href="#datenschutz">Datenschutz</a></li>
                <li><a href="#agb">AGB</a></li>
              </ul>
            </div>

          </div>

          <div className="footer-bottom">
            <p>© 2026 Barthels Hof · Erstellt von <strong>PDSTUDIO</strong></p>
            <span className="footer-bottom-demo">Demo · barthels-hof.de</span>
          </div>
        </div>
      </footer>
    </>
  )
}
