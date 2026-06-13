import { useState, useEffect } from 'react'

const TODAY = new Date().getDay()

const HOURS = [
  { label: 'Montag',      time: '8:30 – 18:00', day: 1 },
  { label: 'Dienstag',    time: '8:30 – 18:00', day: 2 },
  { label: 'Mittwoch',    time: '8:30 – 18:00', day: 3 },
  { label: 'Donnerstag',  time: '8:30 – 18:00', day: 4 },
  { label: 'Freitag',     time: '8:30 – 18:00', day: 5 },
  { label: 'Samstag',     time: '9:30 – 18:00', note: 'Brunch', day: 6 },
  { label: 'Sonntag',     time: '9:30 – 18:00', note: 'Brunch', day: 0 },
]

const MENU = [
  { name: 'Filterkaffee',   desc: 'Single Origin · wechselnde Röstungen',            tag: 'vegan',       price: '3,50 €' },
  { name: 'Flat White',     desc: 'Doppelter Ristretto, Spezialitätenmilch',          price: '3,80 €' },
  { name: 'Matcha Latte',   desc: 'Bio-Matcha, Oatly Hafer',                          tag: 'vegan',       price: '4,20 €' },
  { name: 'Avocado Toast',  desc: 'Sauerteig · Avocado · Rucola · Zitrone',           tag: 'vegan',       price: '8,50 €' },
  { name: 'Granola Bowl',   desc: 'Hausgemachtes Granola, Joghurt, Saisonfrüchte',    tag: 'vegan mögl.', price: '7,90 €' },
  { name: 'Eggs Benedict',  desc: 'Sauerteig, pochiertes Ei, Hollandaise',             tag: 'Sa + So',     price: '10,50 €' },
  { name: 'French Toast',   desc: 'Brioche, Ahornsirup, Mascarpone',                  tag: 'Sa + So',     price: '9,50 €' },
  { name: 'Tagesstück',     desc: 'Hausgemachter Kuchen · wechselt täglich',           price: '3,90 €' },
]

const LEGAL = {
  impressum: {
    title: 'Impressum',
    body: `<p><strong>Café Telegraph</strong><br/>Plagwitz, 04229 Leipzig</p>
           <p>Verantwortlich für den Inhalt gemäß § 55 Abs. 2 RStV: der Inhaber.</p>
           <p>Kontakt über Instagram: <a href="https://www.instagram.com/cafetelegraph/" target="_blank" rel="noopener">@cafetelegraph</a></p>
           <p style="font-size:12px;color:var(--cream-mute);margin-top:20px;"><em>Hinweis: Diese Seite ist eine Konzept-Vorschau von PDSTUDIO. Rechtlich vollständige Angaben werden vor Live-Schaltung ergänzt.</em></p>`,
  },
  datenschutz: {
    title: 'Datenschutz',
    body: `<p>Wir nehmen den Schutz Ihrer Daten ernst und behandeln personenbezogene Daten vertraulich gemäß DSGVO.</p>
           <p><strong>Verantwortlich:</strong> Café Telegraph, Plagwitz, 04229 Leipzig.</p>
           <p><strong>Kontaktformular:</strong> Eingaben werden nur zur Beantwortung Ihrer Anfrage verwendet und nicht an Dritte weitergegeben.</p>
           <p><strong>Ihre Rechte:</strong> Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung auf Anfrage.</p>
           <p style="font-size:12px;color:var(--cream-mute);margin-top:20px;"><em>Stand: Konzept-Vorschau.</em></p>`,
  },
  agb: {
    title: 'AGB',
    body: `<p><strong>Allgemeine Geschäftsbedingungen — Café Telegraph</strong></p>
           <p><strong>§ 1 Geltungsbereich</strong><br/>Diese AGB gelten für alle Verträge zwischen Café Telegraph und seinen Gästen.</p>
           <p><strong>§ 2 Angebot</strong><br/>Das Angebot des Cafés wechselt saisonal. Aktuelle Karte im Café einsehbar.</p>
           <p><strong>§ 3 Kontakt</strong><br/>Anfragen und Reservierungsanfragen über das Kontaktformular oder Instagram.</p>
           <p style="font-size:12px;color:var(--cream-mute);margin-top:20px;"><em>Stand: Konzept-Vorschau.</em></p>`,
  },
}

const CSS = `
/* ================================================================
   CAFÉ TELEGRAPH — Production Demo
   cream-soft drenched palette · Cormorant Garamond + Inter + JetBrains Mono
   ================================================================ */

:root {
  --ease-out:    cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);

  /* LIGHT (cream sections) */
  --bg:           oklch(0.95 0.030 78);
  --bg-card:      oklch(0.91 0.036 76);
  --bg-card2:     oklch(0.87 0.042 74);

  /* DARK (espresso sections) */
  --dark:         oklch(0.23 0.038 44);
  --dark-rich:    oklch(0.27 0.040 46);
  --dark-footer:  oklch(0.17 0.030 42);

  /* ACCENT */
  --amber:        oklch(0.62 0.140 62);
  --amber-deep:   oklch(0.50 0.118 56);

  /* INK on LIGHT */
  --ink:          oklch(0.20 0.038 44);
  --ink-soft:     oklch(0.38 0.030 48);
  --ink-mute:     oklch(0.55 0.022 52);

  /* INK on DARK */
  --cream:        oklch(0.96 0.020 80);
  --cream-soft:   oklch(0.82 0.024 76);
  --cream-mute:   oklch(0.62 0.022 72);

  --line-d:       oklch(0.96 0.020 80 / 0.11);
  --line-d-str:   oklch(0.96 0.020 80 / 0.24);
  --line-l:       oklch(0.20 0.038 44 / 0.10);
  --line-l-str:   oklch(0.20 0.038 44 / 0.18);

  --display: "Cormorant Garamond", "Georgia", serif;
  --sans:    "Inter", system-ui, -apple-system, sans-serif;
  --mono:    "JetBrains Mono", ui-monospace, monospace;

  --r-sm: 4px;
  --r-md: 10px;
  --r-lg: 16px;
  --container: 1280px;
  --section-y: clamp(80px, 10vw, 144px);
}

*, *::before, *::after { box-sizing: border-box; }
*::selection { background: var(--amber); color: var(--dark); }

html { scroll-behavior: smooth; }
html, body {
  margin: 0; padding: 0;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--sans);
  font-size: 16px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
img { max-width: 100%; display: block; }
a { color: inherit; text-decoration: none; }
button { font: inherit; cursor: pointer; border: 0; background: 0; }
input, textarea { font: inherit; color: inherit; }

body { padding-top: 40px; }

/* ================================================================
   DEMO BANNER
   ================================================================ */

.demo-bar {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
  height: 40px;
  display: flex; align-items: center; justify-content: center;
  background: var(--dark-footer);
  border-bottom: 1px solid var(--line-d);
  font-family: var(--mono);
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.20em;
  text-transform: uppercase;
  color: var(--amber);
}

/* ================================================================
   CONTAINER
   ================================================================ */

.container {
  width: 100%;
  max-width: var(--container);
  margin: 0 auto;
  padding: 0 clamp(20px, 5vw, 48px);
}

/* ================================================================
   EYEBROW
   ================================================================ */

.eyebrow {
  display: inline-flex; align-items: center; gap: 12px;
  font-family: var(--mono);
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--cream-mute);
}
.eyebrow::before {
  content: '';
  width: 26px; height: 1px;
  background: currentColor;
  opacity: 0.5;
  flex-shrink: 0;
}
.eyebrow.light { color: var(--ink-mute); }

/* ================================================================
   NAV
   ================================================================ */

.nav {
  position: sticky;
  top: 40px;
  z-index: 50;
  background: oklch(0.23 0.038 44 / 0.80);
  backdrop-filter: blur(20px) saturate(150%);
  -webkit-backdrop-filter: blur(20px) saturate(150%);
  border-bottom: 1px solid var(--line-d);
  transition: background 280ms var(--ease-out);
}
.nav.scrolled {
  background: oklch(0.20 0.036 43 / 0.95);
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
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--cream);
  display: flex; align-items: center;
  transition: opacity 180ms var(--ease-out);
}
.nav-brand:hover { opacity: 0.75; }

.brand-dot {
  display: inline-block;
  width: 5px; height: 5px;
  border-radius: 50%;
  background: var(--amber);
  margin: 0 5px 2px;
  vertical-align: middle;
  flex-shrink: 0;
}

.nav-links {
  display: flex; align-items: center;
  gap: clamp(20px, 2.6vw, 36px);
  list-style: none; margin: 0; padding: 0;
}
.nav-links a {
  font-size: 14px;
  font-weight: 500;
  letter-spacing: -0.005em;
  color: var(--cream-soft);
  transition: color 180ms var(--ease-out);
}
.nav-links a:hover { color: var(--cream); }

.nav-cta {
  display: inline-flex; align-items: center;
  height: 38px; padding: 0 20px;
  border-radius: 999px;
  background: var(--cream);
  color: var(--dark);
  font-weight: 600; font-size: 14px;
  letter-spacing: -0.005em;
  transition: background 200ms var(--ease-out), transform 160ms var(--ease-out);
}
.nav-cta:hover { background: oklch(1 0 0); }
.nav-cta:active { transform: scale(0.97); }

.nav-toggle {
  display: none;
  width: 38px; height: 38px;
  align-items: center; justify-content: center;
  border: 1px solid var(--line-d-str);
  border-radius: var(--r-md);
  color: var(--cream);
  background: transparent;
}

@media (max-width: 960px) {
  .nav-links, .nav-cta { display: none; }
  .nav-toggle { display: inline-flex; }
}

.mobile-menu {
  position: fixed;
  inset: 108px 0 0;
  background: var(--dark);
  border-top: 1px solid var(--line-d);
  padding: 28px clamp(20px, 5vw, 48px);
  display: flex; flex-direction: column; gap: 0;
  transform: translateY(-16px);
  opacity: 0;
  pointer-events: none;
  transition: transform 260ms var(--ease-out), opacity 220ms var(--ease-out);
  z-index: 49;
}
.mobile-menu.open {
  transform: translateY(0);
  opacity: 1;
  pointer-events: auto;
}
.mobile-menu a {
  font-family: var(--display);
  font-weight: 600;
  font-size: 38px;
  letter-spacing: -0.02em;
  color: var(--cream);
  padding: 14px 0;
  border-bottom: 1px solid var(--line-d);
  display: block;
  transition: opacity 160ms var(--ease-out);
}
.mobile-menu a:hover { opacity: 0.65; }
.mobile-cta-link {
  color: var(--amber) !important;
  border-bottom: 0 !important;
  margin-top: 20px;
  font-size: 28px !important;
}

/* ================================================================
   HERO
   ================================================================ */

.hero {
  position: relative;
  min-height: calc(100dvh - 108px);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  overflow: hidden;
  background: var(--dark);
}

.hero-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center 40%;
  background-repeat: no-repeat;
  opacity: 0.52;
  filter: saturate(0.82) contrast(1.06);
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(0deg, oklch(0.23 0.038 44 / 1) 0%, oklch(0.23 0.038 44 / 0.70) 35%, oklch(0.23 0.038 44 / 0.10) 75%),
    linear-gradient(100deg, oklch(0.23 0.038 44 / 0.60) 0%, transparent 55%);
  pointer-events: none;
}

.hero-content {
  position: relative;
  z-index: 1;
  padding-top: clamp(48px, 7vw, 96px);
  padding-bottom: clamp(56px, 8vw, 112px);
}

.hero-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: clamp(32px, 5vw, 64px);
}

.live {
  display: inline-flex; align-items: center; gap: 8px;
  font-family: var(--mono);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--cream-soft);
}
.pulse {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: var(--amber);
  display: inline-block;
  animation: pulseAnim 2.4s var(--ease-out) infinite;
}
@keyframes pulseAnim {
  0%   { box-shadow: 0 0 0 0 oklch(0.62 0.140 62 / 0.7); }
  100% { box-shadow: 0 0 0 10px oklch(0.62 0.140 62 / 0); }
}
@media (prefers-reduced-motion: reduce) { .pulse { animation: none; } }

.hero-h1 {
  font-family: var(--display);
  font-weight: 600;
  font-size: clamp(60px, 11.5vw, 168px);
  line-height: 0.89;
  letter-spacing: -0.025em;
  color: var(--cream);
  margin: 0 0 clamp(22px, 3vw, 36px);
  text-wrap: balance;
}
.hero-h1 em {
  font-style: italic;
  font-weight: 400;
  color: var(--cream-soft);
}

.hero-sub {
  font-size: clamp(16px, 1.45vw, 19px);
  line-height: 1.55;
  color: var(--cream-soft);
  max-width: 50ch;
  margin: 0 0 clamp(28px, 4vw, 48px);
  text-wrap: pretty;
}

.hero-ctas {
  display: flex; gap: 12px; align-items: center;
  margin-bottom: clamp(40px, 5vw, 72px);
}
@media (max-width: 480px) { .hero-ctas { flex-direction: column; align-items: stretch; } }

.hero-meta {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: clamp(16px, 3vw, 40px);
  padding-top: clamp(22px, 3vw, 32px);
  border-top: 1px solid var(--line-d);
}
@media (max-width: 600px) {
  .hero-meta { grid-template-columns: 1fr 1fr; }
  .hero-meta-item:last-child { display: none; }
}

.hero-meta-item .mk {
  font-family: var(--mono);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.20em;
  text-transform: uppercase;
  color: var(--cream-mute);
  margin-bottom: 6px;
  display: block;
}
.hero-meta-item .mv {
  font-family: var(--display);
  font-size: clamp(19px, 2vw, 25px);
  font-weight: 500;
  color: var(--cream);
  line-height: 1.15;
}
.hero-meta-item .mv small {
  font-size: 13px;
  font-family: var(--mono);
  font-weight: 400;
  color: var(--cream-mute);
}

/* ================================================================
   BUTTONS
   ================================================================ */

.btn-primary {
  display: inline-flex; align-items: center; gap: 10px;
  height: 56px; padding: 0 32px;
  border-radius: 999px;
  background: var(--cream);
  color: var(--dark);
  font-weight: 700; font-size: 15px;
  letter-spacing: -0.01em;
  border: 0;
  transition: background 200ms var(--ease-out), transform 160ms var(--ease-out), box-shadow 200ms var(--ease-out);
}
.btn-primary:hover {
  background: oklch(1 0 0);
  box-shadow: 0 12px 32px -8px oklch(0 0 0 / 0.22);
}
.btn-primary:active { transform: scale(0.97); }

.btn-ghost {
  display: inline-flex; align-items: center; gap: 10px;
  height: 56px; padding: 0 28px;
  border-radius: 999px;
  background: transparent;
  color: var(--cream);
  font-weight: 600; font-size: 15px;
  border: 1.5px solid var(--line-d-str);
  transition: border-color 200ms var(--ease-out), background 200ms var(--ease-out), transform 160ms var(--ease-out);
}
.btn-ghost:hover { border-color: var(--cream); background: oklch(0.96 0.020 80 / 0.07); }
.btn-ghost:active { transform: scale(0.97); }

/* ================================================================
   SHOWCASE — interior image
   ================================================================ */

.showcase {
  position: relative;
  width: 100%;
  height: clamp(300px, 52vh, 600px);
  overflow: hidden;
  background: var(--dark-rich);
  border-top: 1px solid var(--line-d);
  border-bottom: 1px solid var(--line-d);
}
.showcase > img {
  width: 100%; height: 100%;
  object-fit: cover;
  filter: brightness(0.70) saturate(0.90) contrast(1.04);
}
.showcase::after {
  content: '';
  position: absolute; inset: 0;
  background:
    linear-gradient(180deg, transparent 30%, oklch(0.23 0.038 44 / 0.82) 100%),
    linear-gradient(90deg, oklch(0.23 0.038 44 / 0.56) 0%, transparent 50%);
  pointer-events: none;
}
.showcase-text {
  position: absolute;
  left: clamp(20px, 5vw, 64px);
  bottom: clamp(24px, 4vw, 52px);
  z-index: 1;
  max-width: 500px;
}
.showcase-text p {
  font-family: var(--display);
  font-style: italic;
  font-weight: 400;
  font-size: clamp(22px, 2.8vw, 36px);
  line-height: 1.14;
  letter-spacing: -0.020em;
  color: var(--cream);
  margin: 12px 0 0;
  text-wrap: balance;
}

/* ================================================================
   TRUST STRIP
   ================================================================ */

.trust-strip {
  background: var(--dark-rich);
  border-bottom: 1px solid var(--line-d);
  padding: 30px 0;
}
.trust-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}
.trust-item {
  display: inline-flex; align-items: baseline; gap: 10px;
}
.trust-item .tn {
  font-family: var(--display);
  font-size: clamp(24px, 2.8vw, 36px);
  font-weight: 500;
  letter-spacing: -0.02em;
  color: var(--cream);
  line-height: 1;
}
.trust-item .tl {
  font-family: var(--mono);
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--cream-mute);
  max-width: 18ch;
}
@media (max-width: 640px) {
  .trust-item:nth-child(n+4) { display: none; }
}

/* ================================================================
   KONZEPT (light)
   ================================================================ */

.konzept-section {
  padding: var(--section-y) 0;
  background: var(--bg);
}
.konzept-grid {
  display: grid;
  grid-template-columns: 5fr 7fr;
  gap: clamp(40px, 6vw, 96px);
  align-items: start;
}
@media (max-width: 900px) { .konzept-grid { grid-template-columns: 1fr; gap: 40px; } }

.section-h2 {
  font-family: var(--display);
  font-weight: 600;
  font-size: clamp(48px, 7.5vw, 100px);
  line-height: 0.90;
  letter-spacing: -0.028em;
  color: var(--ink);
  margin: 18px 0 28px;
  text-wrap: balance;
}
.section-h2 em {
  font-style: italic;
  font-weight: 400;
  color: var(--ink-soft);
}
.section-h2.on-dark { color: var(--cream); }
.section-h2.on-dark em { color: var(--cream-soft); }

.body-p {
  font-size: clamp(15px, 1.35vw, 17px);
  line-height: 1.66;
  color: var(--ink-soft);
  max-width: 54ch;
  margin: 0 0 20px;
  text-wrap: pretty;
}
.body-p.on-dark { color: var(--cream-soft); }
.body-p.on-dark a { color: var(--amber); }

.konzept-facts {
  margin-top: 36px;
  padding-top: 26px;
  border-top: 1px solid var(--line-l-str);
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
}
@media (max-width: 480px) { .konzept-facts { grid-template-columns: 1fr; } }

.fact {
  padding: 0 18px 0 0;
  border-right: 1px solid var(--line-l);
}
.fact:last-child { border-right: 0; padding-right: 0; }
@media (max-width: 480px) {
  .fact { padding: 16px 0; border-right: 0; border-bottom: 1px solid var(--line-l); }
  .fact:last-child { border-bottom: 0; }
}
.fk {
  font-family: var(--mono);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.20em;
  text-transform: uppercase;
  color: var(--ink-mute);
  margin-bottom: 7px;
}
.fv {
  font-family: var(--display);
  font-size: clamp(17px, 1.6vw, 20px);
  font-weight: 500;
  letter-spacing: -0.01em;
  line-height: 1.25;
  color: var(--ink);
}

.konzept-images {
  display: flex; flex-direction: column; gap: 14px;
}
.img-wrap {
  border-radius: var(--r-lg);
  overflow: hidden;
  border: 1px solid var(--line-l-str);
}
.img-wrap img {
  width: 100%;
  object-fit: cover;
  display: block;
  filter: saturate(0.88) contrast(1.04);
}
.img-wrap.main img   { aspect-ratio: 4/3; }
.img-wrap.accent img { aspect-ratio: 16/7; }

/* ================================================================
   KARTE (dark)
   ================================================================ */

.karte-section {
  padding: var(--section-y) 0;
  background: var(--dark);
  border-top: 1px solid var(--line-d);
  border-bottom: 1px solid var(--line-d);
}
.karte-head {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  align-items: end;
  margin-bottom: clamp(44px, 6vw, 80px);
}
@media (max-width: 760px) { .karte-head { grid-template-columns: 1fr; } }

.karte-note {
  font-family: var(--mono);
  font-size: 12px;
  letter-spacing: 0.06em;
  color: var(--cream-mute);
  max-width: 36ch;
  line-height: 1.6;
  margin: 0;
  align-self: end;
}

.menu-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 clamp(40px, 6vw, 96px);
  border-top: 1px solid var(--line-d);
}
@media (max-width: 760px) { .menu-grid { grid-template-columns: 1fr; } }

.menu-item {
  padding: 22px 0;
  border-bottom: 1px solid var(--line-d);
}
.mi-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 16px;
  align-items: start;
}
.mi-name {
  font-family: var(--display);
  font-weight: 600;
  font-size: 20px;
  letter-spacing: -0.012em;
  color: var(--cream);
  margin: 0 0 5px;
  line-height: 1.2;
}
.mi-tag {
  display: inline-block;
  font-family: var(--mono);
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--cream-mute);
  border: 1px solid var(--line-d-str);
  border-radius: 999px;
  padding: 2px 8px;
  margin-left: 10px;
  vertical-align: middle;
}
.mi-desc {
  font-size: 13.5px;
  line-height: 1.5;
  color: var(--cream-mute);
  margin: 0;
}
.mi-price {
  font-family: var(--mono);
  font-size: 13.5px;
  font-weight: 600;
  color: var(--cream);
  white-space: nowrap;
  letter-spacing: -0.01em;
  padding-top: 2px;
}

/* ================================================================
   ÖFFNUNGSZEITEN (light)
   ================================================================ */

.zeiten-section {
  padding: var(--section-y) 0;
  background: var(--bg-card);
  border-bottom: 1px solid var(--line-l-str);
}
.zeiten-grid {
  display: grid;
  grid-template-columns: 4fr 8fr;
  gap: clamp(40px, 6vw, 96px);
  align-items: start;
}
@media (max-width: 900px) { .zeiten-grid { grid-template-columns: 1fr; gap: 32px; } }

.zeiten-list {
  border-top: 1px solid var(--line-l-str);
}
.zeiten-row {
  display: grid;
  grid-template-columns: 120px 1fr auto;
  gap: 12px;
  align-items: baseline;
  padding: 16px 0;
  border-bottom: 1px solid var(--line-l);
  transition: background 180ms var(--ease-out);
}
.zeiten-row.is-today {
  background: var(--bg);
  padding: 16px 14px;
  margin: 0 -14px;
  border-radius: var(--r-md);
}
.zday {
  font-family: var(--display);
  font-weight: 600;
  font-size: 18px;
  letter-spacing: -0.01em;
  color: var(--ink);
  line-height: 1;
}
.zmarker {
  font-family: var(--mono);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--amber-deep);
}
.ztime {
  font-family: var(--mono);
  font-size: 14.5px;
  font-weight: 500;
  color: var(--ink-soft);
  letter-spacing: -0.01em;
}
.zeiten-row.is-today .ztime { color: var(--ink); }
.znote {
  font-family: var(--mono);
  font-size: 10px;
  color: var(--ink-mute);
  letter-spacing: 0.06em;
  margin-left: 4px;
}
@media (max-width: 480px) {
  .zeiten-row { grid-template-columns: 1fr auto; gap: 8px; }
  .zmarker { display: none; }
}

/* ================================================================
   KONTAKT (dark)
   ================================================================ */

.kontakt-section {
  padding: var(--section-y) 0;
  background: var(--dark-rich);
  border-top: 1px solid var(--line-d);
}
.kontakt-grid {
  display: grid;
  grid-template-columns: 5fr 7fr;
  gap: clamp(40px, 6vw, 96px);
  align-items: start;
}
@media (max-width: 900px) { .kontakt-grid { grid-template-columns: 1fr; gap: 48px; } }

.kontakt-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-top: 36px;
}
@media (max-width: 560px) { .kontakt-info { grid-template-columns: 1fr; gap: 20px; } }

.ki-key {
  font-family: var(--mono);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.20em;
  text-transform: uppercase;
  color: var(--cream-mute);
  margin-bottom: 7px;
}
.ki-val {
  font-family: var(--display);
  font-size: 18px;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: var(--cream);
  line-height: 1.35;
}
.ki-val a {
  color: var(--amber);
  border-bottom: 1px solid oklch(0.62 0.140 62 / 0.32);
  padding-bottom: 1px;
  transition: border-color 180ms var(--ease-out);
}
.ki-val a:hover { border-color: var(--amber); }

.contact-form {
  display: flex; flex-direction: column; gap: 14px;
  background: oklch(0.96 0.020 80 / 0.04);
  border: 1px solid var(--line-d);
  border-radius: var(--r-lg);
  padding: clamp(22px, 3vw, 36px);
}
.form-row {
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
}
@media (max-width: 560px) { .form-row { grid-template-columns: 1fr; } }

.contact-form label {
  display: flex; flex-direction: column; gap: 7px;
  font-family: var(--mono);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--cream-mute);
}
.contact-form input,
.contact-form textarea {
  background: oklch(0.96 0.020 80 / 0.06);
  border: 1px solid var(--line-d-str);
  border-radius: var(--r-md);
  padding: 11px 15px;
  color: var(--cream);
  font-size: 15px;
  line-height: 1.5;
  font-family: var(--sans);
  transition: border-color 200ms var(--ease-out), background 200ms var(--ease-out);
  width: 100%;
  resize: vertical;
}
.contact-form input::placeholder,
.contact-form textarea::placeholder { color: var(--cream-mute); opacity: 0.7; }
.contact-form input:focus,
.contact-form textarea:focus {
  outline: none;
  border-color: var(--cream-soft);
  background: oklch(0.96 0.020 80 / 0.10);
}

.sent-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 16px; text-align: center;
  padding: 52px 32px;
  background: oklch(0.96 0.020 80 / 0.04);
  border: 1px solid var(--line-d);
  border-radius: var(--r-lg);
}
.sent-icon {
  width: 50px; height: 50px;
  border-radius: 50%;
  background: var(--amber);
  color: var(--dark);
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; font-weight: 700;
}
.sent-state p {
  font-family: var(--display);
  font-size: 24px;
  font-weight: 500;
  color: var(--cream);
  margin: 0;
}

.map-wrap {
  margin-top: 14px;
  border-radius: var(--r-lg);
  overflow: hidden;
  border: 1px solid var(--line-d);
}
.map-wrap iframe {
  display: block;
  width: 100%; height: 260px;
}
.map-link {
  display: inline-flex; align-items: center; gap: 6px;
  margin-top: 12px;
  font-family: var(--mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--cream-soft);
  transition: color 180ms var(--ease-out);
}
.map-link:hover { color: var(--cream); }

/* ================================================================
   FOOTER
   ================================================================ */

footer {
  background: var(--dark-footer);
  border-top: 1px solid var(--line-d);
  padding: 72px 0 32px;
}
.footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 40px;
  margin-bottom: 52px;
}
@media (max-width: 760px) { .footer-grid { grid-template-columns: 1fr 1fr; gap: 32px; } }
@media (max-width: 460px) { .footer-grid { grid-template-columns: 1fr; } }

.footer-brand-name {
  font-family: var(--display);
  font-size: 30px;
  font-weight: 600;
  letter-spacing: -0.018em;
  color: var(--cream);
  display: flex; align-items: center;
  line-height: 1;
  margin-bottom: 12px;
}
.brand-dot-footer {
  display: inline-block;
  width: 5px; height: 5px;
  border-radius: 50%;
  background: var(--amber);
  margin: 0 5px 2px;
  vertical-align: middle;
  flex-shrink: 0;
}
.footer-tag {
  font-size: 13.5px;
  color: var(--cream-mute);
  line-height: 1.55;
  margin: 0 0 18px;
  max-width: 32ch;
}
.footer-ig {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid var(--line-d-str);
  font-family: var(--mono);
  font-size: 11.5px;
  color: var(--cream-soft);
  transition: all 200ms var(--ease-out);
}
.footer-ig:hover { background: var(--cream); color: var(--dark); border-color: var(--cream); }

.footer-col h4 {
  font-family: var(--mono);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--cream-mute);
  margin: 0 0 16px;
}
.footer-col ul {
  list-style: none; margin: 0; padding: 0;
  display: flex; flex-direction: column; gap: 8px;
}
.footer-col a {
  font-size: 14px;
  color: var(--cream-soft);
  transition: color 180ms var(--ease-out);
}
.footer-col a:hover { color: var(--cream); }
.footer-col p {
  font-size: 14px;
  color: var(--cream-soft);
  line-height: 1.55;
  margin: 0 0 6px;
}

.footer-bottom {
  border-top: 1px solid var(--line-d);
  padding-top: 24px;
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; flex-wrap: wrap;
}
.footer-bottom p {
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.04em;
  color: var(--cream-mute);
  margin: 0;
}
.footer-bottom a { color: var(--cream-soft); transition: color 180ms var(--ease-out); }
.footer-bottom a:hover { color: var(--cream); }
.fdemo-tag {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--cream-mute);
  padding: 3px 8px;
  border: 1px solid var(--line-d);
  border-radius: var(--r-sm);
}

/* ================================================================
   LEGAL MODAL
   ================================================================ */

.legal-overlay {
  position: fixed; inset: 0; z-index: 200;
  background: oklch(0.17 0.030 42 / 0.86);
  backdrop-filter: blur(16px);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
  opacity: 0;
  transition: opacity 240ms var(--ease-out);
}
.legal-overlay.visible { opacity: 1; }

.legal-box {
  background: var(--dark-rich);
  border: 1px solid var(--line-d-str);
  border-radius: var(--r-lg);
  max-width: 600px; width: 100%;
  max-height: 85vh; overflow-y: auto;
  padding: clamp(24px, 4vw, 40px);
  transform: translateY(12px);
  transition: transform 280ms var(--ease-out);
}
.legal-overlay.visible .legal-box { transform: translateY(0); }

.legal-head {
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: 20px; margin-bottom: 24px;
}
.legal-title {
  font-family: var(--display);
  font-weight: 600;
  font-size: 36px;
  letter-spacing: -0.022em;
  margin: 0;
  color: var(--cream);
}
.legal-close {
  width: 36px; height: 36px;
  border-radius: 50%;
  background: transparent;
  border: 1px solid var(--line-d-str);
  color: var(--cream);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: background 180ms var(--ease-out);
}
.legal-close:hover { background: oklch(0.96 0.020 80 / 0.10); }

.legal-body {
  color: var(--cream-soft);
  font-size: 14.5px;
  line-height: 1.65;
}
.legal-body p { margin: 0 0 14px; }
.legal-body strong { color: var(--cream); font-weight: 500; }
.legal-body a { color: var(--amber); }

/* ================================================================
   REVEALS
   ================================================================ */

.reveal {
  opacity: 0;
  transform: translateY(22px);
  transition: opacity 800ms var(--ease-out), transform 800ms var(--ease-out);
}
.reveal.in {
  opacity: 1;
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  .reveal { opacity: 1; transform: none; transition: none; }
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
@media (hover: none) {
  .menu-item:hover { opacity: 1; }
}
`

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled]  = useState(false)
  const [sent, setSent]          = useState(false)
  const [legalKey, setLegalKey]  = useState(null)
  const [legalVis, setLegalVis]  = useState(false)

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    if (!('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('in'))
      return
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) }
      })
    }, { rootMargin: '-5% 0px', threshold: 0.08 })
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  const openLegal = (key) => {
    setLegalKey(key)
    requestAnimationFrame(() => setLegalVis(true))
  }
  const closeLegal = () => {
    setLegalVis(false)
    setTimeout(() => setLegalKey(null), 260)
  }

  useEffect(() => {
    if (!legalKey) return
    const esc = (e) => { if (e.key === 'Escape') closeLegal() }
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [legalKey])

  const todayHours = HOURS.find(h => h.day === TODAY)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* DEMO BANNER */}
      <div className="demo-bar">
        Demo von PDSTUDIO · Konzept-Vorschlag für Café Telegraph
      </div>

      {/* NAV */}
      <nav className={`nav${scrolled ? ' scrolled' : ''}`}>
        <div className="container nav-inner">
          <a href="#top" className="nav-brand">
            Café<span className="brand-dot" />Telegraph
          </a>
          <ul className="nav-links">
            <li><a href="#konzept">Konzept</a></li>
            <li><a href="#karte">Karte</a></li>
            <li><a href="#zeiten">Zeiten</a></li>
            <li><a href="#kontakt">Kontakt</a></li>
          </ul>
          <a href="#kontakt" className="nav-cta">Anfragen</a>
          <button
            className="nav-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menü öffnen"
            aria-expanded={menuOpen}
          >
            {menuOpen
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 6l12 12M6 18L18 6"/></svg>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
            }
          </button>
        </div>
        <div className={`mobile-menu${menuOpen ? ' open' : ''}`} aria-hidden={!menuOpen}>
          {[['#konzept','Konzept'],['#karte','Karte'],['#zeiten','Zeiten'],['#kontakt','Kontakt']].map(([href, label]) => (
            <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>
          ))}
          <a href="#kontakt" className="mobile-cta-link" onClick={() => setMenuOpen(false)}>Anfragen →</a>
        </div>
      </nav>

      <main id="top">

        {/* HERO */}
        <section className="hero">
          <div
            className="hero-bg"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1920&q=85&auto=format&fit=crop')" }}
            aria-hidden="true"
          />
          <div className="hero-overlay" aria-hidden="true" />
          <div className="container hero-content">
            <div className="hero-top">
              <span className="eyebrow">Plagwitz · Leipzig</span>
              <span className="live"><span className="pulse" aria-hidden="true" />Jetzt geöffnet</span>
            </div>
            <h1 className="hero-h1 reveal in">
              Guter Kaffee.<br />
              <em>Gute Zeit.</em>
            </h1>
            <p className="hero-sub reveal in">
              Spezialitätenkaffee, hausgemachte Kuchen und Sonntags-Brunch —
              mitten in Plagwitz, für alle, die Zeit haben.
            </p>
            <div className="hero-ctas reveal in">
              <a href="#kontakt" className="btn-primary">
                Anfragen
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </a>
              <a href="#karte" className="btn-ghost">Zur Karte</a>
            </div>
            <div className="hero-meta reveal in">
              <div className="hero-meta-item">
                <span className="mk">Bewertung</span>
                <span className="mv">4,6 ★ <small>/ 480 Reviews</small></span>
              </div>
              <div className="hero-meta-item">
                <span className="mk">Heute</span>
                <span className="mv">
                  {todayHours ? todayHours.time : '9:30 – 18:00'}
                  {todayHours?.note ? ` · ${todayHours.note}` : ''}
                </span>
              </div>
              <div className="hero-meta-item">
                <span className="mk">Stadtteil</span>
                <span className="mv">Plagwitz<br />Leipzig</span>
              </div>
            </div>
          </div>
        </section>

        {/* INTERIOR SHOWCASE */}
        <div className="showcase" aria-hidden="true">
          <img
            src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200&q=80&auto=format&fit=crop"
            alt="Café Telegraph — warmes Interieur, Plagwitz"
            loading="lazy"
          />
          <div className="showcase-text">
            <span className="eyebrow">Seit dem ersten Schluck</span>
            <p>Plagwitzer Café-Kultur. Kein Take-away-Stress — echte Atmosphäre, echter Kaffee.</p>
          </div>
        </div>

        {/* TRUST STRIP */}
        <div className="trust-strip">
          <div className="container trust-row">
            <div className="trust-item"><span className="tn">4,6</span><span className="tl">aus 480 Reviews</span></div>
            <div className="trust-item"><span className="tn">€€</span><span className="tl">Faire Preise</span></div>
            <div className="trust-item"><span className="tn">100%</span><span className="tl">Spezialitäten­kaffee</span></div>
            <div className="trust-item"><span className="tn">Sa+So</span><span className="tl">Brunch</span></div>
            <div className="trust-item"><span className="tn">∅</span><span className="tl">Vegane Optionen</span></div>
          </div>
        </div>

        {/* KONZEPT */}
        <section id="konzept" className="konzept-section">
          <div className="container konzept-grid">
            <div className="konzept-text">
              <span className="eyebrow light">Konzept</span>
              <h2 className="section-h2 reveal">
                Kaffee,<br /><em>der zählt.</em>
              </h2>
              <p className="body-p">
                Das Café Telegraph ist mehr als ein Ort zum Kaffeetrinken. Es ist ein
                Treffpunkt für Menschen, die in Plagwitz leben, arbeiten und sich Zeit nehmen —
                für ein Gespräch, eine Runde Lesen, oder einfach guten Filterkaffee in Ruhe.
              </p>
              <p className="body-p">
                Wir wählen sorgfältig aus: Single-Origin-Bohnen, transparente Herkunft,
                wechselnde Röstereien. Dazu hausgemachte Kuchen, frische Zutaten, vegane
                Optionen — und an Wochenenden echter Brunch.
              </p>
              <div className="konzept-facts reveal">
                <div className="fact">
                  <div className="fk">Kaffee</div>
                  <div className="fv">Single Origin, transparent.</div>
                </div>
                <div className="fact">
                  <div className="fk">Kuchen</div>
                  <div className="fv">Hausgemacht, täglich frisch.</div>
                </div>
                <div className="fact">
                  <div className="fk">Crowd</div>
                  <div className="fv">Jung, weltoffen, Plagwitz.</div>
                </div>
              </div>
            </div>
            <div className="konzept-images">
              <div className="img-wrap main reveal">
                <img
                  src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80&auto=format&fit=crop"
                  alt="Café Telegraph — Atmosphäre und Gäste"
                  loading="lazy"
                />
              </div>
              <div className="img-wrap accent reveal">
                <img
                  src="https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&q=80&auto=format&fit=crop"
                  alt="Hausgemachte Kuchen und Gebäck"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>

        {/* KARTE */}
        <section id="karte" className="karte-section">
          <div className="container">
            <div className="karte-head">
              <div>
                <span className="eyebrow">Angebot</span>
                <h2 className="section-h2 on-dark reveal">
                  Auswahl aus<br /><em>der Karte.</em>
                </h2>
              </div>
              <p className="karte-note">
                Vollständige Karte im Café einsehbar.<br />
                Angebot wechselt saisonal.
              </p>
            </div>
            <div className="menu-grid">
              {MENU.map((item, i) => (
                <div
                  key={i}
                  className="menu-item reveal"
                  style={{ transitionDelay: `${(i % 4) * 55}ms` }}
                >
                  <div className="mi-row">
                    <div>
                      <p className="mi-name">
                        {item.name}
                        {item.tag && <span className="mi-tag">{item.tag}</span>}
                      </p>
                      <p className="mi-desc">{item.desc}</p>
                    </div>
                    <span className="mi-price">{item.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ÖFFNUNGSZEITEN */}
        <section id="zeiten" className="zeiten-section">
          <div className="container zeiten-grid">
            <div>
              <span className="eyebrow light">Öffnungszeiten</span>
              <h2 className="section-h2 reveal">
                Jeden Tag<br /><em>für euch da.</em>
              </h2>
              <p className="body-p">
                Mo – Fr ab 8:30 Uhr. Wochenende ab 9:30 Uhr
                mit Brunch bis 18:00.
              </p>
            </div>
            <div className="zeiten-list">
              {HOURS.map((h, i) => (
                <div key={i} className={`zeiten-row${h.day === TODAY ? ' is-today' : ''}`}>
                  <span className="zday">{h.label}</span>
                  <span className="zmarker">{h.day === TODAY ? '· Heute' : ''}</span>
                  <span className="ztime">
                    {h.time}
                    {h.note && <span className="znote">· {h.note}</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* KONTAKT */}
        <section id="kontakt" className="kontakt-section">
          <div className="container kontakt-grid">
            <div>
              <span className="eyebrow">Kontakt</span>
              <h2 className="section-h2 on-dark reveal">
                Schreibt uns.<br /><em>Wir antworten.</em>
              </h2>
              <p className="body-p on-dark">
                Anfragen, Events, Kooperationen — einfach eine Nachricht schicken.
                Wir sind auch auf Instagram.
              </p>
              <div className="kontakt-info">
                <div>
                  <div className="ki-key">Stadtteil</div>
                  <div className="ki-val">Plagwitz<br />04229 Leipzig</div>
                </div>
                <div>
                  <div className="ki-key">Öffnungszeiten</div>
                  <div className="ki-val">Mo–Fr 8:30<br />Sa+So 9:30 – 18:00</div>
                </div>
                <div>
                  <div className="ki-key">Instagram</div>
                  <div className="ki-val">
                    <a href="https://www.instagram.com/cafetelegraph/" target="_blank" rel="noopener">@cafetelegraph</a>
                  </div>
                </div>
                <div>
                  <div className="ki-key">Preis</div>
                  <div className="ki-val">€€ · Faire Preise</div>
                </div>
              </div>
            </div>
            <div>
              {!sent ? (
                <form
                  className="contact-form"
                  onSubmit={e => { e.preventDefault(); setSent(true) }}
                >
                  <div className="form-row">
                    <label>
                      Name
                      <input type="text" name="name" required placeholder="Euer Name" />
                    </label>
                    <label>
                      E-Mail
                      <input type="email" name="email" required placeholder="email@beispiel.de" />
                    </label>
                  </div>
                  <label>
                    Nachricht
                    <textarea name="message" rows="5" required placeholder="Was möchtet ihr wissen?" />
                  </label>
                  <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }}>
                    Nachricht senden
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                  </button>
                </form>
              ) : (
                <div className="sent-state">
                  <div className="sent-icon">✓</div>
                  <p>Danke! Wir melden uns bald.</p>
                </div>
              )}
              <div className="map-wrap">
                <iframe
                  title="Café Telegraph, Plagwitz Leipzig"
                  src="https://maps.google.com/maps?q=Cafe+Telegraph+Plagwitz+Leipzig&output=embed"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <a
                href="https://maps.google.com/?q=Cafe+Telegraph+Plagwitz+Leipzig"
                target="_blank"
                rel="noopener"
                className="map-link"
              >
                In Google Maps öffnen
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M7 7h10v10"/></svg>
              </a>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer>
        <div className="container footer-grid">
          <div>
            <div className="footer-brand-name">
              Café<span className="brand-dot-footer" />Telegraph
            </div>
            <p className="footer-tag">
              Spezialitätenkaffee · Brunch · Plagwitz Leipzig
            </p>
            <a
              href="https://www.instagram.com/cafetelegraph/"
              target="_blank"
              rel="noopener"
              className="footer-ig"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="3" width="18" height="18" rx="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>
              </svg>
              @cafetelegraph
            </a>
          </div>
          <div className="footer-col">
            <h4>Besuch</h4>
            <p>Plagwitz<br />04229 Leipzig</p>
            <p>Mo–Fr 8:30 – 18:00<br />Sa+So 9:30 – 18:00</p>
          </div>
          <div className="footer-col">
            <h4>Navigation</h4>
            <ul>
              <li><a href="#konzept">Konzept</a></li>
              <li><a href="#karte">Karte</a></li>
              <li><a href="#zeiten">Zeiten</a></li>
              <li><a href="#kontakt">Kontakt</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Rechtliches</h4>
            <ul>
              <li>
                <a href="#impressum" onClick={e => { e.preventDefault(); openLegal('impressum') }}>
                  Impressum
                </a>
              </li>
              <li>
                <a href="#datenschutz" onClick={e => { e.preventDefault(); openLegal('datenschutz') }}>
                  Datenschutz
                </a>
              </li>
              <li>
                <a href="#agb" onClick={e => { e.preventDefault(); openLegal('agb') }}>
                  AGB
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="container footer-bottom">
          <p>© 2026 Café Telegraph · Plagwitz, Leipzig</p>
          <p>Erstellt von <a href="#top">PDSTUDIO</a></p>
          <span className="fdemo-tag">Demo · noindex</span>
        </div>
      </footer>

      {/* LEGAL MODAL */}
      {legalKey && (
        <div
          className={`legal-overlay${legalVis ? ' visible' : ''}`}
          onClick={e => { if (e.target === e.currentTarget) closeLegal() }}
          role="dialog"
          aria-modal="true"
          aria-label={LEGAL[legalKey]?.title}
        >
          <div className="legal-box">
            <div className="legal-head">
              <h2 className="legal-title">{LEGAL[legalKey]?.title}</h2>
              <button className="legal-close" onClick={closeLegal} aria-label="Schließen">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M6 18L18 6"/>
                </svg>
              </button>
            </div>
            <div
              className="legal-body"
              dangerouslySetInnerHTML={{ __html: LEGAL[legalKey]?.body }}
            />
          </div>
        </div>
      )}
    </>
  )
}
