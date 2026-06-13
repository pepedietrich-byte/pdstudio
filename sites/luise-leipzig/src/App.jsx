import { useState, useMemo } from 'react'

// ── Images ────────────────────────────────────────────────────────────────────
const IMG_HERO     = 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1920&q=85&auto=format&fit=crop'
const IMG_INTERIOR = 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200&q=80&auto=format&fit=crop'
const IMG_KUCHEN   = 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&q=80&auto=format&fit=crop'
const IMG_KAFFEE   = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80&auto=format&fit=crop'

// ── Data ─────────────────────────────────────────────────────────────────────
const HOURS = [
  { day: 'Montag',     n: 1, time: '8:00 — 22:00' },
  { day: 'Dienstag',   n: 2, time: '8:00 — 22:00' },
  { day: 'Mittwoch',   n: 3, time: '8:00 — 22:00' },
  { day: 'Donnerstag', n: 4, time: '8:00 — 22:00' },
  { day: 'Freitag',    n: 5, time: '8:00 — 22:00' },
  { day: 'Samstag',    n: 6, time: '9:00 — 22:00' },
  { day: 'Sonntag',    n: 0, time: '9:00 — 22:00' },
]

const FRUEHSTUECK = [
  { name: 'Kleines Frühstück',       desc: 'Brötchen, Butter, Marmelade, Kaffee oder Tee',              price: '6,50 €' },
  { name: 'Luise-Riesenfrühstück',   desc: 'Aufschnitt, Käse, Ei, Joghurt, Saft, Kaffee',               price: '12,90 €', tag: 'Beliebt' },
  { name: 'Veganes Frühstück',       desc: 'Hummus, Avocado, Gemüseaufschnitt, Saatenbrot',             price: '9,90 €' },
  { name: 'Rührei mit Lachs',        desc: 'Auf Toast, Schnittlauch, Crème fraîche',                    price: '9,50 €' },
]

const KUCHEN_MENU = [
  { name: 'Käsekuchen',              desc: 'Klassisch cremig — täglich frisch gebacken',                price: '3,90 €', tag: 'Hausgemacht' },
  { name: 'Apfelkuchen',             desc: 'Mit Zimtstreuseln, hausgemacht',                            price: '3,50 €' },
  { name: 'Schokotorte',             desc: 'Nach Hausrezept, dunkel und saftig',                        price: '4,20 €' },
  { name: 'Tarte des Tages',         desc: 'Täglich wechselnd — fragen Sie die Tafel',                  price: 'auf Anfrage' },
]

const MITTAGSTISCH = [
  { name: 'Tagessuppe',              desc: 'Mit frischem Brot — täglich andere',                        price: '4,90 €' },
  { name: 'Quiche des Tages',        desc: 'Mit gemischtem Blattsalat',                                 price: '9,50 €' },
  { name: 'Pasta des Tages',         desc: 'Täglich wechselnde Rezeptur',                               price: '9,90 €' },
  { name: 'Salatbowl',               desc: 'Mit Dressing nach Wahl und Brot',                           price: '8,90 €' },
]

// ── Subcomponents ─────────────────────────────────────────────────────────────
function CupOrbit() {
  return (
    <div className="cup-orbit" aria-hidden="true">
      <svg viewBox="0 0 400 400" className="cup-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <path id="cp" d="M 200,200 m -150,0 a 150,150 0 1,1 300,0 a 150,150 0 1,1 -300,0"/>
        </defs>
        <circle cx="200" cy="200" r="193" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 10" strokeOpacity="0.22"/>
        <circle cx="200" cy="200" r="170" stroke="currentColor" strokeWidth="0.4" strokeOpacity="0.10"/>
        <text fontSize="10.5" letterSpacing="8.5" fill="currentColor" fillOpacity="0.28"
              fontFamily="'Inter', sans-serif" fontWeight="500">
          <textPath href="#cp">
            CAFÉ LUISE · FRÜHSTÜCK · KUCHEN · MITTAGSTISCH · SÜDVORSTADT ·
          </textPath>
        </text>
        <g transform="translate(158,152)" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" opacity="0.40">
          <path d="M 8 24 L 72 24 L 65 76 L 15 76 Z"/>
          <path d="M 72 35 Q 96 35 96 52 Q 96 68 72 68"/>
          <path d="M 0 80 Q 40 88 80 80"/>
          <path d="M 22 16 Q 25 4 28 16"/>
          <path d="M 38 12 Q 41 0 44 12"/>
          <path d="M 54 16 Q 57 4 60 16"/>
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

// ── Styles ────────────────────────────────────────────────────────────────────
const CSS = `
:root {
  --brand:        #1a0f0a;
  --brand-mid:    #221208;
  --brand-deep:   #0f0805;
  --cream:        #f5e6c8;
  --cream-soft:   #dfc9a0;
  --cream-mute:   #b89b72;
  --cream-faint:  #7a6545;
  --orange:       #c4621a;
  --orange-b:     #d97328;
  --line:         rgba(245,230,200,0.12);
  --line-s:       rgba(245,230,200,0.26);
  --display:      'Bricolage Grotesque', system-ui, sans-serif;
  --sans:         'Inter', system-ui, sans-serif;
  --container:    1280px;
  --ease:         cubic-bezier(0.23,1,0.32,1);
  --r-md:         10px;
  --r-lg:         14px;
}

*,*::before,*::after { box-sizing: border-box; }
*::selection { background: var(--orange); color: var(--cream); }
html { scroll-behavior: smooth; }
html,body {
  margin: 0; padding: 0;
  background: var(--brand);
  color: var(--cream);
  font-family: var(--sans);
  font-size: 16px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
img { max-width: 100%; display: block; }
a { color: inherit; text-decoration: none; transition: color 200ms var(--ease), opacity 200ms var(--ease); }
button { font: inherit; cursor: pointer; border: 0; background: none; padding: 0; }

.eyebrow {
  font-family: var(--sans);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--cream-mute);
}

.container {
  width: 100%;
  max-width: var(--container);
  margin: 0 auto;
  padding: 0 clamp(20px,5vw,48px);
}

section { padding: clamp(80px,10vw,140px) 0; position: relative; }

/* ── Demo Banner ─────────────────────────────────────────────────── */

.demo-banner {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--orange);
  color: var(--cream);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 36px;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.08em;
}
.demo-banner .sep { opacity: 0.45; }

/* ── Nav ─────────────────────────────────────────────────────────── */

.nav {
  position: sticky;
  top: 36px;
  z-index: 90;
  background: rgba(26,15,10,0.88);
  backdrop-filter: blur(20px) saturate(140%);
  -webkit-backdrop-filter: blur(20px) saturate(140%);
  border-bottom: 1px solid var(--line);
}
.nav-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 68px;
  gap: 24px;
}
.nav-brand {
  font-family: var(--display);
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.022em;
  color: var(--cream);
  font-variation-settings: 'opsz' 24;
}
.nav-brand:hover { opacity: 1; color: var(--cream); }
.nav-links {
  display: flex;
  align-items: center;
  gap: clamp(18px,2.5vw,36px);
  list-style: none;
  margin: 0; padding: 0;
}
.nav-links a {
  font-size: 14px;
  font-weight: 500;
  color: var(--cream-soft);
}
.nav-links a:hover { color: var(--cream); opacity: 1; }
.nav-ctas { display: flex; gap: 8px; }
.nav-cta {
  display: inline-flex;
  align-items: center;
  height: 40px;
  padding: 0 20px;
  border-radius: 999px;
  background: var(--orange);
  color: var(--cream);
  font-weight: 600;
  font-size: 14px;
  transition: background 200ms var(--ease), transform 160ms var(--ease);
}
.nav-cta:hover { background: var(--orange-b); opacity: 1; }
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
  top: calc(36px + 68px);
  left: 0; right: 0; bottom: 0;
  background: var(--brand);
  border-top: 1px solid var(--line);
  padding: 32px clamp(20px,5vw,48px) 48px;
  transform: translateY(-10px);
  opacity: 0;
  pointer-events: none;
  transition: transform 250ms var(--ease), opacity 210ms var(--ease);
  z-index: 89;
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow-y: auto;
}
.mobile-menu.open { transform: translateY(0); opacity: 1; pointer-events: auto; }
.mobile-menu a {
  font-family: var(--display);
  font-size: clamp(32px,8vw,48px);
  font-weight: 600;
  letter-spacing: -0.025em;
  padding: 14px 0;
  border-bottom: 1px solid var(--line);
  color: var(--cream);
  display: block;
  font-variation-settings: 'opsz' 48;
}
.mobile-menu a:hover { color: var(--orange-b); opacity: 1; }
.mobile-menu .mobile-cta {
  margin-top: 28px;
  display: inline-flex;
  align-items: center;
  height: 56px;
  padding: 0 28px;
  background: var(--orange);
  border-radius: 999px;
  font-family: var(--sans);
  font-size: 16px;
  font-weight: 600;
  color: var(--cream);
  letter-spacing: 0;
  border-bottom: 0;
  align-self: flex-start;
}
.mobile-menu .mobile-cta:hover { background: var(--orange-b); opacity: 1; }

/* ── Buttons ─────────────────────────────────────────────────────── */

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 56px;
  padding: 0 28px;
  border-radius: 999px;
  background: var(--cream);
  color: #1a0f0a;
  font-weight: 700;
  font-size: 15px;
  letter-spacing: -0.01em;
  transition: transform 160ms var(--ease), background 200ms var(--ease), box-shadow 200ms var(--ease);
}
.btn-primary:hover { background: #fff; opacity: 1; box-shadow: 0 16px 36px -10px rgba(0,0,0,0.3); }
.btn-primary:active { transform: scale(0.97); }

.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 56px;
  padding: 0 24px;
  border-radius: 999px;
  background: transparent;
  color: var(--cream);
  font-weight: 600;
  font-size: 15px;
  border: 1.5px solid var(--line-s);
  transition: transform 160ms var(--ease), border-color 200ms var(--ease), background 200ms var(--ease);
}
.btn-ghost:hover { border-color: var(--cream); background: rgba(245,230,200,0.06); opacity: 1; }
.btn-ghost:active { transform: scale(0.97); }

/* ── Hero ────────────────────────────────────────────────────────── */

.hero {
  min-height: calc(100dvh - 36px - 68px);
  padding: clamp(56px,8vw,96px) 0;
  display: flex;
  align-items: center;
  background-size: cover;
  background-position: center;
  position: relative;
  overflow: hidden;
}
.hero-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(125deg, rgba(26,15,10,0.96) 0%, rgba(26,15,10,0.78) 45%, rgba(26,15,10,0.55) 100%);
  z-index: 0;
}

/* Rotating cup */
.cup-orbit {
  position: absolute;
  right: -14vw;
  top: 50%;
  transform: translateY(-50%);
  width: min(82vh,68vw);
  aspect-ratio: 1;
  color: var(--cream);
  pointer-events: none;
  z-index: 0;
}
.cup-svg {
  width: 100%; height: 100%;
  animation: cup-spin 80s linear infinite;
  will-change: transform;
}
@keyframes cup-spin { to { transform: rotate(360deg); } }
@media (max-width: 760px) {
  .cup-orbit {
    right: auto; left: 50%; top: auto; bottom: -10%;
    transform: translateX(-50%);
    width: 140vw;
    opacity: 0.35;
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
  margin-bottom: clamp(48px,8vw,96px);
}
.hero-live {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--cream-soft);
}
.pulse {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: var(--orange);
  display: inline-block;
  animation: pulse-anim 2s ease-out infinite;
}
@keyframes pulse-anim {
  0%   { box-shadow: 0 0 0 0 rgba(196,98,26,0.7); }
  100% { box-shadow: 0 0 0 9px rgba(196,98,26,0); }
}

.hero-main { max-width: 820px; }
.hero-main h1 {
  font-family: var(--display);
  font-size: clamp(72px,12.5vw,184px);
  font-weight: 600;
  line-height: 0.86;
  letter-spacing: -0.042em;
  margin: 0 0 clamp(28px,4vw,44px);
  color: var(--cream);
  font-variation-settings: 'opsz' 96;
  text-wrap: balance;
}
.hero-main h1 em {
  font-style: italic;
  font-weight: 300;
  color: var(--orange-b);
  display: block;
  letter-spacing: -0.03em;
}
.hero-sub {
  font-size: clamp(16px,1.4vw,20px);
  line-height: 1.7;
  color: var(--cream-soft);
  max-width: 50ch;
  margin: 0 0 clamp(32px,4vw,48px);
  text-wrap: pretty;
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
  margin-top: clamp(48px,7vw,96px);
  padding-top: 28px;
  border-top: 1px solid var(--line);
  flex-wrap: wrap;
}
.hero-meta-item { display: flex; flex-direction: column; gap: 5px; }
.hero-meta-item .k {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--cream-mute);
}
.hero-meta-item .v {
  font-family: var(--display);
  font-size: clamp(18px,1.8vw,24px);
  font-weight: 500;
  letter-spacing: -0.018em;
  color: var(--cream);
  line-height: 1.2;
  font-variation-settings: 'opsz' 24;
}
.hero-meta-item .v small {
  font-family: var(--sans);
  font-size: 13px;
  font-weight: 400;
  color: var(--cream-mute);
}

/* ── Trust Strip ─────────────────────────────────────────────────── */

.trust {
  padding: 40px 0;
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
.trust-item { display: flex; flex-direction: column; gap: 4px; }
.trust-item .n {
  font-family: var(--display);
  font-size: clamp(22px,2.5vw,34px);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1;
  color: var(--cream);
  font-variation-settings: 'opsz' 36;
}
.trust-item .l {
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--cream-mute);
}

/* ── Konzept ─────────────────────────────────────────────────────── */

.konzept-grid {
  display: grid;
  grid-template-columns: 5fr 7fr;
  gap: clamp(40px,6vw,96px);
  align-items: start;
}
@media (max-width: 920px) { .konzept-grid { grid-template-columns: 1fr; gap: 40px; } }

.konzept-left h2 {
  font-family: var(--display);
  font-size: clamp(42px,6vw,84px);
  font-weight: 500;
  line-height: 0.93;
  letter-spacing: -0.036em;
  margin: 16px 0 28px;
  color: var(--cream);
  text-wrap: balance;
  font-variation-settings: 'opsz' 84;
}
.konzept-left h2 em { font-style: italic; font-weight: 300; color: var(--cream-soft); }
.konzept-img {
  border-radius: var(--r-lg);
  overflow: hidden;
  border: 1px solid var(--line);
}
.konzept-img img {
  width: 100%; height: 320px;
  object-fit: cover;
  display: block;
  filter: brightness(0.93) contrast(1.04) saturate(1.05);
}

.konzept-right .lead-p {
  font-size: clamp(17px,1.5vw,21px);
  line-height: 1.65;
  color: var(--cream);
  margin: 0 0 24px;
  text-wrap: pretty;
}
.konzept-right p {
  font-size: clamp(15px,1.1vw,17px);
  line-height: 1.75;
  color: var(--cream-soft);
  margin: 0 0 20px;
  max-width: 58ch;
  text-wrap: pretty;
}

.konzept-facts {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  margin-top: 36px;
  padding-top: 28px;
  border-top: 1px solid var(--line);
}
@media (max-width: 600px) { .konzept-facts { grid-template-columns: 1fr; } }
.fact {
  padding: 0 20px 0 0;
  border-right: 1px solid var(--line);
}
.fact:first-child { padding-left: 0; }
.fact:last-child { border-right: 0; padding-right: 0; }
@media (max-width: 600px) {
  .fact { padding: 18px 0; border-right: 0; border-bottom: 1px solid var(--line); }
  .fact:last-child { border-bottom: 0; }
}
.fact .k {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--cream-mute);
  margin-bottom: 7px;
}
.fact .v {
  font-family: var(--display);
  font-size: 17px;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: var(--cream);
  line-height: 1.3;
  font-variation-settings: 'opsz' 20;
}

/* ── Showcase ────────────────────────────────────────────────────── */

.showcase {
  position: relative;
  width: 100%;
  height: clamp(300px,52vh,580px);
  overflow: hidden;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}
.showcase img {
  width: 100%; height: 100%;
  object-fit: cover; display: block;
  filter: brightness(0.85) contrast(1.06) saturate(1.12);
}
.showcase::after {
  content: '';
  position: absolute; inset: 0;
  background:
    linear-gradient(180deg, rgba(26,15,10,0.15) 0%, transparent 28%, transparent 52%, rgba(26,15,10,0.88) 100%),
    linear-gradient(90deg, rgba(26,15,10,0.60) 0%, transparent 48%);
  pointer-events: none;
}
.showcase-text {
  position: absolute;
  left: clamp(20px,5vw,64px);
  bottom: clamp(28px,5vw,56px);
  z-index: 1;
  max-width: 500px;
}
.showcase-text .eyebrow { display: block; margin-bottom: 14px; }
.showcase-text p {
  font-family: var(--display);
  font-style: italic;
  font-weight: 300;
  font-size: clamp(24px,3vw,40px);
  line-height: 1.13;
  letter-spacing: -0.028em;
  color: var(--cream);
  margin: 0;
  font-variation-settings: 'opsz' 40;
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
  margin-bottom: clamp(48px,7vw,80px);
}
@media (max-width: 760px) { .karte-head { grid-template-columns: 1fr; gap: 20px; } }
.karte-head h2 {
  font-family: var(--display);
  font-size: clamp(56px,10vw,140px);
  font-weight: 600;
  line-height: 0.86;
  letter-spacing: -0.042em;
  margin: 16px 0 0;
  color: var(--cream);
  font-variation-settings: 'opsz' 96;
  text-wrap: balance;
}
.karte-head h2 em { font-style: italic; font-weight: 300; color: var(--cream-soft); letter-spacing: -0.03em; }
.karte-demo-note { text-align: right; }
@media (max-width: 760px) { .karte-demo-note { text-align: left; } }
.demo-tag {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--orange);
  border: 1px solid var(--orange);
  border-radius: 999px;
  padding: 3px 10px;
  margin-bottom: 8px;
}
.karte-demo-note p { font-size: 13px; color: var(--cream-mute); margin: 0; }
.karte-demo-note strong { color: var(--cream-soft); }

.karte-grid {
  display: grid;
  grid-template-columns: repeat(3,1fr);
  gap: clamp(20px,4vw,60px);
}
@media (max-width: 900px) { .karte-grid { grid-template-columns: 1fr; gap: 48px; } }

.menu-col { display: flex; flex-direction: column; gap: 22px; }
.menu-col-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--line-s);
}
.menu-col-head h3 {
  font-family: var(--display);
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.018em;
  margin: 0;
  color: var(--cream);
  font-variation-settings: 'opsz' 24;
}
.menu-col-head span {
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--cream-mute);
}

.dish {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: baseline;
}
.dish-name {
  font-family: var(--display);
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.012em;
  color: var(--cream);
  line-height: 1.2;
  margin: 0 0 4px;
  font-variation-settings: 'opsz' 20;
}
.dish-tag {
  display: inline-block;
  font-family: var(--sans);
  font-size: 9px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--orange);
  border: 1px solid var(--orange);
  border-radius: 999px;
  padding: 2px 7px;
  margin-left: 8px;
  vertical-align: middle;
}
.dish-desc {
  font-size: 13px;
  line-height: 1.5;
  color: var(--cream-mute);
  margin: 0;
}
.dish-price {
  font-size: 14px;
  font-weight: 600;
  color: var(--cream-soft);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
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
  gap: clamp(40px,6vw,96px);
  align-items: start;
}
@media (max-width: 920px) { .hours-grid { grid-template-columns: 1fr; gap: 36px; } }
.hours-head h2 {
  font-family: var(--display);
  font-size: clamp(40px,5.5vw,70px);
  font-weight: 600;
  line-height: 0.93;
  letter-spacing: -0.036em;
  margin: 16px 0 16px;
  color: var(--cream);
  font-variation-settings: 'opsz' 70;
  text-wrap: balance;
}
.hours-head h2 em { font-style: italic; font-weight: 300; color: var(--cream-soft); }
.hours-head .lead-text {
  font-size: 16px;
  line-height: 1.75;
  color: var(--cream-soft);
  margin: 0;
}
.hours-list { border-top: 1px solid var(--line); }
.hours-row {
  display: grid;
  grid-template-columns: 130px 1fr auto;
  gap: 16px;
  align-items: baseline;
  padding: 18px 0;
  border-bottom: 1px solid var(--line);
  transition: background 200ms;
}
.hours-row.today {
  background: rgba(196,98,26,0.08);
  padding: 18px 14px;
  margin: 0 -14px;
  border-radius: 6px;
}
.hours-row .day {
  font-family: var(--display);
  font-size: 19px;
  font-weight: 600;
  letter-spacing: -0.012em;
  color: var(--cream);
  font-variation-settings: 'opsz' 20;
}
.hours-row .marker {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--orange);
}
.hours-row .time {
  font-size: 15px;
  font-weight: 500;
  color: var(--cream);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.01em;
}

/* ── Anfahrt & Kontakt ───────────────────────────────────────────── */

.contact-section {
  background: var(--brand);
  border-top: 1px solid var(--line);
}
.contact-grid {
  display: grid;
  grid-template-columns: 6fr 4fr;
  gap: clamp(40px,6vw,96px);
  align-items: start;
}
@media (max-width: 920px) { .contact-grid { grid-template-columns: 1fr; gap: 48px; } }

.contact-left h2 {
  font-family: var(--display);
  font-size: clamp(40px,6vw,76px);
  font-weight: 600;
  line-height: 0.93;
  letter-spacing: -0.036em;
  margin: 16px 0 20px;
  color: var(--cream);
  font-variation-settings: 'opsz' 76;
  text-wrap: balance;
}
.contact-left h2 em { font-style: italic; font-weight: 300; color: var(--cream-soft); }
.contact-left > .intro-p {
  font-size: 17px;
  color: var(--cream-soft);
  max-width: 52ch;
  margin: 0 0 32px;
  line-height: 1.65;
}
.contact-block {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;
  margin-bottom: 32px;
}
@media (max-width: 600px) { .contact-block { grid-template-columns: 1fr; } }
.contact-cell .key {
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--cream-mute);
  margin-bottom: 7px;
}
.contact-cell .val {
  font-family: var(--display);
  font-size: 19px;
  font-weight: 500;
  letter-spacing: -0.012em;
  color: var(--cream);
  line-height: 1.35;
  font-variation-settings: 'opsz' 20;
}
.contact-cell .val.mono { font-family: var(--sans); font-size: 15px; letter-spacing: 0; font-weight: 400; }
.contact-cell .val a {
  color: var(--cream);
  border-bottom: 1px solid var(--line-s);
  padding-bottom: 1px;
}
.contact-cell .val a:hover { color: var(--orange-b); border-color: var(--orange-b); opacity: 1; }

.coffee-card {
  border-radius: var(--r-lg);
  overflow: hidden;
  border: 1px solid var(--line);
  background: var(--brand-mid);
}
.coffee-card img {
  width: 100%; height: 200px;
  object-fit: cover; display: block;
  filter: brightness(0.88) contrast(1.06) saturate(1.1);
}
.coffee-card-body {
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.coffee-card-body .eyebrow { display: block; }
.coffee-card-num {
  font-family: var(--display);
  font-size: 26px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--cream);
  margin: 0;
  font-variation-settings: 'opsz' 28;
}
.coffee-card-body p {
  font-size: 14px;
  line-height: 1.6;
  color: var(--cream-soft);
  margin: 0;
}
.coffee-card-body .btn-primary {
  margin-top: 6px;
  height: 48px;
  font-size: 14px;
  align-self: flex-start;
}

/* ── Footer ──────────────────────────────────────────────────────── */

footer {
  background: var(--brand-deep);
  border-top: 1px solid var(--line);
  padding: 72px 0 28px;
}
.footer-top {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 40px;
  margin-bottom: 56px;
}
@media (max-width: 760px) { .footer-top { grid-template-columns: 1fr 1fr; gap: 28px; } }
@media (max-width: 480px) { .footer-top { grid-template-columns: 1fr; } }

.footer-brand {
  font-family: var(--display);
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--cream);
  margin-bottom: 10px;
  line-height: 1;
  font-variation-settings: 'opsz' 36;
}
.footer-tag { font-size: 13px; color: var(--cream-mute); line-height: 1.7; margin: 0; }

.footer-col h4 {
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--cream-mute);
  margin: 0 0 16px;
}
.footer-col ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.footer-col a { font-size: 14px; color: var(--cream-soft); }
.footer-col a:hover { color: var(--cream); opacity: 1; }
.footer-col p { font-size: 14px; color: var(--cream-soft); margin: 0 0 4px; line-height: 1.6; }

.footer-bottom {
  border-top: 1px solid var(--line);
  padding-top: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.footer-bottom p { font-size: 12px; color: var(--cream-mute); margin: 0; }
.footer-bottom strong { color: var(--cream-soft); font-weight: 600; }
.footer-bottom-demo {
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--cream-faint);
  padding: 4px 10px;
  border: 1px solid var(--line);
  border-radius: 4px;
}

/* ── Accessibility & Reduced Motion ──────────────────────────────── */

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
@media (hover: none) {
  .btn-primary:hover, .btn-ghost:hover { transform: none; }
}
`

// ── App ───────────────────────────────────────────────────────────────────────
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
        <span>cafe-luise-leipzig.de</span>
      </div>

      {/* Nav */}
      <nav className="nav">
        <div className="container nav-inner">
          <a href="#top" className="nav-brand">Café Luise</a>
          <ul className="nav-links">
            <li><a href="#konzept">Konzept</a></li>
            <li><a href="#karte">Karte</a></li>
            <li><a href="#zeiten">Zeiten</a></li>
            <li><a href="#anfahrt">Anfahrt</a></li>
          </ul>
          <div className="nav-ctas">
            <a href="tel:+493413917812" className="nav-cta">Anrufen</a>
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
        <a href="#konzept" onClick={close}>Konzept</a>
        <a href="#karte" onClick={close}>Karte</a>
        <a href="#zeiten" onClick={close}>Zeiten</a>
        <a href="#anfahrt" onClick={close}>Anfahrt</a>
        <a href="tel:+493413917812" className="mobile-cta" onClick={close}>Jetzt anrufen</a>
      </div>

      <main id="top">

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="hero" style={{ backgroundImage: `url(${IMG_HERO})` }}>
          <div className="hero-overlay" />
          <CupOrbit />
          <div className="container hero-content">

            <div className="hero-top">
              <span className="eyebrow">Café · Südvorstadt · Leipzig</span>
              <span className="hero-live">
                <span className="pulse" />
                Täglich geöffnet
              </span>
            </div>

            <div className="hero-main">
              <h1>
                Frühstück.<br />
                Kuchen.<br />
                <em>Hausgemacht.</em>
              </h1>
              <p className="hero-sub">
                Das Café Luise in der Südvorstadt — seit Jahrzehnten der Treffpunkt
                für Frühstücksfreunde, Kuchenfans und alle, die einfach ankommen wollen.
              </p>
              <div className="hero-ctas">
                <a href="#karte" className="btn-primary">Karte ansehen</a>
                <a href="tel:+493413917812" className="btn-ghost">
                  0341 3917812
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M5 4h4l2 5-3 2a11 11 0 005 5l2-3 5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/>
                  </svg>
                </a>
              </div>
            </div>

            <div className="hero-meta">
              <div className="hero-meta-item">
                <span className="k">Bewertung</span>
                <span className="v">4,4 ★ <small>~800 Reviews</small></span>
              </div>
              <div className="hero-meta-item">
                <span className="k">Adresse</span>
                <span className="v">Karl-Liebknecht-Str. 70<br />04275 Leipzig</span>
              </div>
              <div className="hero-meta-item">
                <span className="k">Mittagstisch</span>
                <span className="v">ab 11:30 Uhr</span>
              </div>
            </div>

          </div>
        </section>

        {/* ── Trust Strip ───────────────────────────────────────────────── */}
        <section className="trust" style={{ padding: '40px 0' }}>
          <div className="container">
            <div className="trust-row">
              <div className="trust-item">
                <span className="n">4,4 ★</span>
                <span className="l">aus ~800 Bewertungen</span>
              </div>
              <div className="trust-item">
                <span className="n">Hausgemacht</span>
                <span className="l">Kuchen täglich frisch</span>
              </div>
              <div className="trust-item">
                <span className="n">Südvorstadt</span>
                <span className="l">Karl-Liebknecht-Str.</span>
              </div>
              <div className="trust-item">
                <span className="n">7 Tage</span>
                <span className="l">Mo–Fr ab 8, Sa–So ab 9</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Konzept ──────────────────────────────────────────────────── */}
        <section id="konzept">
          <div className="container">
            <div className="konzept-grid">

              <div className="konzept-left">
                <span className="eyebrow">Konzept</span>
                <h2>Genau das Café,<br /><em>das Leipzig braucht.</em></h2>
                <div className="konzept-img">
                  <img src={IMG_INTERIOR} alt="Gemütliches Café-Interieur, warmes Licht, Holztische" loading="lazy" />
                </div>
              </div>

              <div className="konzept-right">
                <p className="lead-p">
                  Das Café Luise ist das, was ein Stadtcafé sein sollte: ein Ort, an dem man bleibt.
                  Kein Durchgangsbetrieb, kein Kettenkonzept. Alteingesessen, gemütlich, ehrlich.
                </p>
                <p>
                  Seit Jahrzehnten kommt die Südvorstadt hierher — Studenten, Locals, Familien.
                  Das Frühstück ist üppig, der Kuchen hausgemacht, der Mittagstisch täglich frisch.
                  Morgens Cappuccino, mittags Tagessuppe, nachmittags Käsekuchen — das Café Luise
                  hat alles, was ein langer Tag braucht.
                </p>
                <p>
                  Der Vintage-Charme kommt ohne Kalkül aus. Hier hat sich nicht viel verändert —
                  und das ist genau richtig so.
                </p>
                <div className="konzept-facts">
                  <div className="fact">
                    <div className="k">Atmosphäre</div>
                    <div className="v">Gemütlich, Vintage, alteingesessen</div>
                  </div>
                  <div className="fact">
                    <div className="k">Publikum</div>
                    <div className="v">Studenten, Locals, Familien</div>
                  </div>
                  <div className="fact">
                    <div className="k">Lage</div>
                    <div className="v">Herz der Südvorstadt</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── Showcase ─────────────────────────────────────────────────── */}
        <div className="showcase">
          <img src={IMG_KUCHEN} alt="Hausgemachte Kuchen im Café Luise — Käsekuchen, Apfelkuchen, Schokotorte" loading="lazy" />
          <div className="showcase-text">
            <span className="eyebrow">Täglich frisch gebacken</span>
            <p>Hausgemachte Kuchen —<br />gebacken wie früher, aufgegessen wie immer.</p>
          </div>
        </div>

        {/* ── Karte ────────────────────────────────────────────────────── */}
        <section id="karte" className="karte-section">
          <div className="container">

            <div className="karte-head">
              <div>
                <span className="eyebrow" style={{ display: 'block', marginBottom: '18px' }}>Die Karte</span>
                <h2>Frühstück.<br /><em>Kuchen. Mittag.</em></h2>
              </div>
              <div className="karte-demo-note">
                <span className="demo-tag">Demo-Karte</span>
                <p>Tagesaktuelle Angebote auf <strong>cafe-luise-leipzig.de</strong></p>
              </div>
            </div>

            <div className="karte-grid">

              <div className="menu-col">
                <div className="menu-col-head">
                  <h3>Frühstück</h3>
                  <span>ab 8:00 Uhr</span>
                </div>
                {FRUEHSTUECK.map((item, i) => <Dish key={i} {...item} />)}
              </div>

              <div className="menu-col">
                <div className="menu-col-head">
                  <h3>Kuchen</h3>
                  <span>Hausgemacht</span>
                </div>
                {KUCHEN_MENU.map((item, i) => <Dish key={i} {...item} />)}
              </div>

              <div className="menu-col">
                <div className="menu-col-head">
                  <h3>Mittagstisch</h3>
                  <span>ab 11:30 Uhr</span>
                </div>
                {MITTAGSTISCH.map((item, i) => <Dish key={i} {...item} />)}
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
                <h2>Jeden Tag<br /><em>für euch da.</em></h2>
                <p className="lead-text">
                  Montag bis Freitag<br />ab 8:00 Uhr.<br />
                  Samstag und Sonntag<br />ab 9:00 Uhr.<br />
                  Täglich bis 22:00 Uhr.
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
                <span className="eyebrow">Anfahrt & Kontakt</span>
                <h2>Komm vorbei.<br /><em>Wir sind da.</em></h2>
                <p className="intro-p">
                  Das Café Luise liegt mitten in der Südvorstadt, direkt auf der
                  Karl-Liebknecht-Straße. Tram, Bus, Fahrrad — alles erreichbar.
                </p>

                <div className="contact-block">
                  <div className="contact-cell">
                    <div className="key">Adresse</div>
                    <div className="val">Karl-Liebknecht-Str. 70<br />04275 Leipzig</div>
                  </div>
                  <div className="contact-cell">
                    <div className="key">Telefon</div>
                    <div className="val mono">
                      <a href="tel:+493413917812">0341 3917812</a>
                    </div>
                  </div>
                  <div className="contact-cell">
                    <div className="key">Öffnungszeiten</div>
                    <div className="val">Mo–Fr 8–22 Uhr<br />Sa–So 9–22 Uhr</div>
                  </div>
                  <div className="contact-cell">
                    <div className="key">Website</div>
                    <div className="val mono">
                      <a href="https://cafe-luise-leipzig.de" target="_blank" rel="noopener">
                        cafe-luise-leipzig.de
                      </a>
                    </div>
                  </div>
                </div>

                <a
                  href="https://maps.google.com/?q=Café+Luise+Karl-Liebknecht-Straße+70+Leipzig"
                  target="_blank"
                  rel="noopener"
                  className="btn-ghost"
                  style={{ alignSelf: 'flex-start', height: '48px', fontSize: '14px' }}
                >
                  In Google Maps öffnen
                  <ArrowRight />
                </a>
              </div>

              <div className="contact-right">
                <div className="coffee-card">
                  <img src={IMG_KAFFEE} alt="Frisch gebrühter Kaffee im Café Luise" loading="lazy" />
                  <div className="coffee-card-body">
                    <span className="eyebrow">Direkt anrufen</span>
                    <p className="coffee-card-num">0341 3917812</p>
                    <p>Reservierungen, Gruppenanfragen — einfach kurz anrufen.</p>
                    <a href="tel:+493413917812" className="btn-primary">Jetzt anrufen</a>
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
              <div className="footer-brand">Café Luise</div>
              <p className="footer-tag">
                Karl-Liebknecht-Str. 70 · 04275 Leipzig<br />
                Frühstück · Kuchen · Mittagstisch
              </p>
            </div>

            <div className="footer-col">
              <h4>Kontakt</h4>
              <ul>
                <li><a href="tel:+493413917812">0341 3917812</a></li>
                <li>
                  <a href="https://cafe-luise-leipzig.de" target="_blank" rel="noopener">
                    cafe-luise-leipzig.de
                  </a>
                </li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Öffnungszeiten</h4>
              <p>Mo–Fr: 8:00–22:00 Uhr</p>
              <p>Sa–So: 9:00–22:00 Uhr</p>
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
            <p>© 2026 Café Luise · Erstellt von <strong>PDSTUDIO</strong></p>
            <span className="footer-bottom-demo">Demo · cafe-luise-leipzig.de</span>
          </div>
        </div>
      </footer>
    </>
  )
}
