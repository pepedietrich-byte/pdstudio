import { useState, useEffect, useCallback } from 'react';

/* ─── image urls ─────────────────────────────────────────────── */
const IMG = {
  hero:          'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=1920&q=85&auto=format&fit=crop',
  showcase:      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=85&auto=format&fit=crop',
  signature_dish:'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=900&q=80&auto=format&fit=crop',
  interior:      'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&q=80&auto=format&fit=crop',
  atmosphere:    'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200&q=80&auto=format&fit=crop',
};

/* ─── data ───────────────────────────────────────────────────── */
const HOURS = [
  { label: 'Montag',     idx: 1, time: '17:30 – 23:00', closed: false },
  { label: 'Dienstag',   idx: 2, time: '17:30 – 23:00', closed: false },
  { label: 'Mittwoch',   idx: 3, time: '17:30 – 23:00', closed: false },
  { label: 'Donnerstag', idx: 4, time: '17:30 – 23:00', closed: false },
  { label: 'Freitag',    idx: 5, time: '17:30 – 23:00', closed: false },
  { label: 'Samstag',    idx: 6, time: '17:30 – 23:00', closed: false },
  { label: 'Sonntag',    idx: 0, time: 'Ruhetag',        closed: true  },
];

const PASTA = [
  { name: 'Tagliatelle al Ragù',       tag: 'Signature', desc: 'Hausgemachte Bandnudeln, langsam gegarter Fleischsugo, gereifter Parmesan.', price: '14,90 €' },
  { name: "Rigatoni all'Amatriciana",  tag: '',          desc: 'Guanciale, San Marzano, Pecorino Romano, Peperoncino.', price: '13,90 €' },
  { name: 'Spaghetti Aglio e Olio',    tag: 'veg',       desc: 'Knoblauch, Peperoncino, natives Olivenöl extra, Petersilie.', price: '11,50 €' },
  { name: 'Pappardelle al Cinghiale',  tag: '',          desc: 'Hausgemachte Pappardelle, Wildschweinsugo, Rosmarin, Rotwein.', price: '16,90 €' },
];

const PIZZA = [
  { name: 'Margherita',   tag: '',    desc: 'San Marzano, Fior di Latte, frischer Basilikum, Olivenöl.', price: '10,50 €' },
  { name: 'Diavola',      tag: 'scharf', desc: 'San Marzano, Mozzarella, scharfe Salami, Peperoncino.', price: '12,50 €' },
  { name: 'Bianca Funghi',tag: 'veg', desc: 'Mozzarella, gemischte Pilze, Knoblauch, Rucola, Parmesan.', price: '13,50 €' },
];

const DOLCI = [
  { name: 'Tiramisù della Casa', tag: 'hausgemacht', desc: 'Familienrezept, Savoiardi, Mascarpone, Espresso.', price: '7,50 €' },
];

const LEGAL = {
  impressum: {
    title: 'Impressum',
    body: `<p><strong>Trattoria Antonio</strong><br>Plagwitz, 04229 Leipzig</p>
           <p>Verantwortlich für den Inhalt gemäß § 55 Abs. 2 RStV: der Inhaber.</p>
           <p style="font-size:12px;color:var(--ink-mute);margin-top:20px;"><em>Hinweis: Diese Seite ist eine Konzept-Vorschau von PDSTUDIO. Die rechtlich vollständigen Angaben werden vor Live-Schaltung ergänzt.</em></p>`,
  },
  datenschutz: {
    title: 'Datenschutz',
    body: `<p>Wir nehmen den Schutz Ihrer personenbezogenen Daten ernst und behandeln diese vertraulich entsprechend der DSGVO.</p>
           <p><strong>Verantwortlich:</strong> Trattoria Antonio, Plagwitz, 04229 Leipzig.</p>
           <p><strong>Kontaktformular:</strong> Daten aus dem Kontaktformular werden ausschließlich zur Bearbeitung Ihrer Anfrage verwendet.</p>
           <p><strong>Ihre Rechte:</strong> Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit.</p>
           <p style="font-size:12px;color:var(--ink-mute);margin-top:20px;"><em>Stand: Konzept-Vorschau.</em></p>`,
  },
  agb: {
    title: 'AGB',
    body: `<p><strong>Allgemeine Geschäftsbedingungen — Trattoria Antonio</strong></p>
           <p><strong>§ 1 Geltungsbereich</strong><br>Diese AGB gelten für alle Verträge zwischen Trattoria Antonio und seinen Gästen.</p>
           <p><strong>§ 2 Reservierungen</strong><br>Reservierungsanfragen sind unverbindlich bis zur schriftlichen Bestätigung.</p>
           <p><strong>§ 3 Stornierung</strong><br>Bitte informieren Sie uns rechtzeitig bei Stornierung oder Änderung Ihrer Reservierung.</p>
           <p style="font-size:12px;color:var(--ink-mute);margin-top:20px;"><em>Stand: Konzept-Vorschau.</em></p>`,
  },
};

/* ─── css ────────────────────────────────────────────────────── */
const CSS = `
:root {
  --ease-out:    cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);

  --brand:        #a73a1f;
  --brand-deep:   #8a2f1a;
  --brand-rich:   oklch(0.43 0.165 28);
  --brand-dark:   oklch(0.30 0.135 26);

  --ink:       #f0e8d5;
  --ink-soft:  oklch(0.88 0.022 70);
  --ink-mute:  oklch(0.78 0.030 60);

  --line:        oklch(0.97 0.018 75 / 0.18);
  --line-strong: oklch(0.97 0.018 75 / 0.35);

  --cream:        #f0e8d5;
  --ink-on-cream: oklch(0.22 0.060 30);

  --display: "Bricolage Grotesque", system-ui, sans-serif;
  --sans:    "Inter", system-ui, -apple-system, sans-serif;
  --mono:    "JetBrains Mono", "SFMono-Regular", monospace;

  --r-sm: 4px;
  --r-md: 10px;
  --r-lg: 14px;
  --container: 1320px;
  --sy: clamp(120px, 14vw, 180px);
  --sy-m: 80px;
}

*, *::before, *::after { box-sizing: border-box; }
*::selection { background: var(--cream); color: var(--brand-deep); }
html { scroll-behavior: smooth; }
html, body {
  margin: 0; padding: 0;
  background: var(--brand);
  color: var(--ink);
  font-family: var(--sans);
  font-size: 16px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
img { max-width: 100%; display: block; }
a { color: inherit; text-decoration: none; transition: color 200ms var(--ease-out), opacity 200ms; }
a:hover { color: var(--cream); }
button { font: inherit; cursor: pointer; background: transparent; border: none; }
input, textarea, select { font: inherit; color: inherit; background: transparent; }

/* ── Helpers ── */
.c {
  width: 100%;
  max-width: var(--container);
  margin: 0 auto;
  padding: 0 clamp(20px, 5vw, 48px);
}
section { padding: var(--sy) 0; position: relative; }
@media (max-width: 768px) { section { padding: var(--sy-m) 0; } }

.eyebrow {
  font-family: var(--mono);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--ink-mute);
}

/* ── NAV ── */
.nav {
  position: sticky; top: 0; z-index: 90;
  background: oklch(0.48 0.160 30 / 0.82);
  backdrop-filter: blur(22px) saturate(140%);
  -webkit-backdrop-filter: blur(22px) saturate(140%);
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
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--ink);
  display: flex;
  align-items: center;
  gap: 0;
  flex-shrink: 0;
}
.nav-brand span {
  display: inline-block;
  width: 5px; height: 5px;
  border-radius: 50%;
  background: var(--cream);
  margin: 0 6px 3px;
  vertical-align: middle;
}
.nav-links {
  display: flex; align-items: center; gap: clamp(18px, 2.5vw, 32px);
  list-style: none; margin: 0; padding: 0;
}
.nav-links a {
  font-size: 13.5px;
  font-weight: 500;
  color: var(--ink-soft);
  letter-spacing: -0.005em;
}
.nav-links a:hover { color: var(--ink); }
.nav-ctas { display: flex; gap: 8px; align-items: center; }

.btn-cta {
  display: inline-flex; align-items: center; gap: 8px;
  height: 40px; padding: 0 20px;
  border-radius: 999px;
  background: var(--cream);
  color: var(--ink-on-cream);
  font-weight: 600; font-size: 13.5px;
  letter-spacing: -0.005em;
  transition: transform 150ms var(--ease-out), background 200ms;
}
.btn-cta:hover { background: #fff; color: var(--ink-on-cream); }
.btn-cta:active { transform: scale(0.97); }

.btn-ghost-sm {
  display: inline-flex; align-items: center; gap: 8px;
  height: 40px; padding: 0 18px;
  border-radius: 999px;
  background: transparent;
  color: var(--ink);
  font-weight: 500; font-size: 13.5px;
  border: 1px solid var(--line-strong);
  transition: transform 150ms var(--ease-out), border-color 200ms, background 200ms;
}
.btn-ghost-sm:hover { border-color: var(--cream); background: oklch(0.97 0.018 75 / 0.07); }
.btn-ghost-sm:active { transform: scale(0.97); }

.nav-toggle {
  display: none;
  width: 40px; height: 40px;
  align-items: center; justify-content: center;
  border: 1px solid var(--line-strong);
  border-radius: var(--r-md);
  color: var(--ink);
}
@media (max-width: 960px) {
  .nav-links { display: none; }
  .nav-toggle { display: inline-flex; }
}

.mobile-menu {
  position: fixed;
  inset: 102px 0 0 0;
  background: var(--brand);
  border-top: 1px solid var(--line);
  padding: 32px clamp(20px, 5vw, 48px);
  transform: translateY(-10px);
  opacity: 0;
  pointer-events: none;
  transition: transform 230ms var(--ease-out), opacity 200ms;
  z-index: 89;
  display: flex; flex-direction: column; gap: 2px;
}
.mobile-menu.open {
  transform: translateY(0);
  opacity: 1;
  pointer-events: auto;
}
.mobile-menu a {
  font-family: var(--display);
  font-weight: 600;
  font-size: 30px;
  letter-spacing: -0.025em;
  padding: 14px 0;
  border-bottom: 1px solid var(--line);
  color: var(--ink);
}
.mobile-menu a:last-of-type { border-bottom: 0; }
.mobile-menu .row {
  display: flex; gap: 10px; margin-top: 28px;
}
.mobile-menu .row a {
  border: 0; padding: 0; flex: 1; font-size: 15px;
  font-family: var(--sans);
}

/* ── HERO ── */
.hero {
  min-height: calc(100dvh - 102px);
  padding-top: clamp(56px, 7vw, 96px);
  padding-bottom: clamp(56px, 7vw, 96px);
  display: flex; flex-direction: column;
  overflow: hidden;
  position: relative;
}
.hero::before {
  content: '';
  position: absolute;
  top: -5%; left: -10%;
  width: 60vw; height: 60vw;
  border-radius: 50%;
  background: radial-gradient(circle, oklch(0.62 0.180 38 / 0.12) 0%, transparent 65%);
  pointer-events: none;
  z-index: 0;
}

.hero-rotate {
  position: absolute;
  top: 50%;
  right: -24vw;
  transform: translateY(-50%);
  width: min(115vh, 88vw);
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
  opacity: 0.58;
  filter: brightness(0.82) saturate(1.12) contrast(1.06);
  mask-image: radial-gradient(circle at center, black 52%, transparent 68%);
  -webkit-mask-image: radial-gradient(circle at center, black 52%, transparent 68%);
}
.hero-rotate img {
  width: 100%; height: 100%;
  object-fit: cover;
  animation: slow-rotate 90s linear infinite;
  will-change: transform;
}
@keyframes slow-rotate {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@media (max-width: 760px) {
  .hero-rotate { right: -38vw; width: 130vw; opacity: 0.38; }
}
@media (prefers-reduced-motion: reduce) {
  .hero-rotate img { animation: none; }
}

.hero-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  position: relative; z-index: 1;
  margin-bottom: clamp(48px, 8vw, 96px);
}
.hero-top .eyebrow {
  display: inline-flex; align-items: center; gap: 12px;
}
.hero-top .eyebrow::before {
  content: '';
  width: 28px; height: 1px;
  background: var(--line-strong);
}
.hero-live {
  display: inline-flex; align-items: center; gap: 8px;
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink-soft);
}
.pulse {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: var(--ink);
  display: inline-block;
  animation: pulse-ring 2s var(--ease-out) infinite;
}
@keyframes pulse-ring {
  0%   { box-shadow: 0 0 0 0 oklch(0.97 0.018 75 / 0.65); }
  100% { box-shadow: 0 0 0 9px oklch(0.97 0.018 75 / 0); }
}

.hero-main {
  position: relative; z-index: 1;
  flex: 1;
  display: flex; flex-direction: column; justify-content: center;
}
.hero h1 {
  font-family: var(--display);
  font-weight: 600;
  font-size: clamp(54px, 11vw, 158px);
  line-height: 0.88;
  letter-spacing: -0.04em;
  margin: 0;
  color: var(--ink);
  text-wrap: balance;
  font-variation-settings: 'opsz' 96;
}
.hero h1 .light {
  font-weight: 300;
  font-style: italic;
  letter-spacing: -0.03em;
  display: block;
  color: var(--ink-soft);
}

.hero-meta-row {
  display: grid;
  grid-template-columns: 6fr 3fr 3fr;
  gap: clamp(20px, 3vw, 48px);
  align-items: end;
  margin-top: clamp(48px, 7vw, 96px);
  padding-top: 28px;
  border-top: 1px solid var(--line);
  position: relative; z-index: 1;
}
@media (max-width: 760px) {
  .hero-meta-row { grid-template-columns: 1fr; gap: 24px; }
}
.hero-sub {
  font-size: clamp(15px, 1.4vw, 17px);
  line-height: 1.5;
  color: var(--ink-soft);
  max-width: 40ch;
  margin: 0;
  text-wrap: pretty;
}
.hero-meta-item { display: flex; flex-direction: column; gap: 4px; }
.hero-meta-item .k {
  font-family: var(--mono);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--ink-mute);
}
.hero-meta-item .v {
  font-family: var(--display);
  font-size: clamp(18px, 1.8vw, 24px);
  font-weight: 500;
  letter-spacing: -0.015em;
  color: var(--ink);
  line-height: 1.1;
}

.hero-ctas {
  display: flex; gap: 12px; align-items: center;
  margin-top: clamp(40px, 5vw, 56px);
  position: relative; z-index: 1;
}
@media (max-width: 480px) { .hero-ctas { flex-direction: column; align-items: stretch; } }

.btn-primary {
  display: inline-flex; align-items: center; gap: 12px;
  height: 60px; padding: 0 32px;
  border-radius: 999px;
  background: var(--cream);
  color: var(--ink-on-cream);
  font-weight: 700; font-size: 16px;
  letter-spacing: -0.01em;
  transition: transform 150ms var(--ease-out), background 200ms, box-shadow 200ms;
}
.btn-primary:hover {
  background: #fff;
  color: var(--ink-on-cream);
  box-shadow: 0 16px 36px -10px oklch(0 0 0 / 0.22);
}
.btn-primary:active { transform: scale(0.97); }

.btn-ghost {
  display: inline-flex; align-items: center; gap: 12px;
  height: 60px; padding: 0 28px;
  border-radius: 999px;
  background: transparent;
  color: var(--ink);
  font-weight: 600; font-size: 16px;
  border: 1.5px solid var(--line-strong);
  transition: transform 150ms var(--ease-out), border-color 200ms, background 200ms;
}
.btn-ghost:hover { border-color: var(--cream); background: oklch(0.97 0.018 75 / 0.06); }
.btn-ghost:active { transform: scale(0.97); }

/* ── TRUST STRIP ── */
.trust {
  padding: 36px 0 !important;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  background: oklch(0.44 0.155 28);
}
.trust-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}
.trust-item { display: inline-flex; align-items: baseline; gap: 10px; }
.trust-item .n {
  font-family: var(--display);
  font-size: clamp(26px, 3vw, 38px);
  font-weight: 500;
  letter-spacing: -0.025em;
  line-height: 1;
  color: var(--ink);
}
.trust-item .l {
  font-family: var(--mono);
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink-mute);
  max-width: 16ch;
}

/* ── SHOWCASE ── */
.showcase {
  padding: 0 !important;
  width: 100%;
  height: clamp(360px, 62vh, 660px);
  overflow: hidden;
  background: var(--brand-deep);
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  position: relative;
}
.showcase img {
  width: 100%; height: 100%;
  object-fit: cover;
  filter: brightness(0.88) contrast(1.06) saturate(1.08);
}
.showcase::after {
  content: '';
  position: absolute; inset: 0;
  background:
    linear-gradient(180deg, oklch(0.40 0.150 28 / 0.28) 0%, transparent 28%, transparent 52%, oklch(0.40 0.150 28 / 0.88) 100%),
    linear-gradient(90deg, oklch(0.40 0.150 28 / 0.52) 0%, transparent 40%);
  pointer-events: none;
}
.showcase-text {
  position: absolute;
  left: clamp(20px, 5vw, 64px);
  bottom: clamp(28px, 5vw, 56px);
  z-index: 1;
  max-width: 500px;
}
.showcase-text .eyebrow { display: block; margin-bottom: 14px; color: var(--ink); }
.showcase-text p {
  font-family: var(--display);
  font-style: italic;
  font-weight: 400;
  font-size: clamp(22px, 2.6vw, 32px);
  line-height: 1.15;
  letter-spacing: -0.025em;
  color: var(--ink);
  margin: 0;
  text-wrap: balance;
}

/* ── KONZEPT / ABOUT ── */
.about-grid {
  display: grid;
  grid-template-columns: 5fr 7fr;
  gap: clamp(40px, 6vw, 96px);
  align-items: start;
}
@media (max-width: 920px) { .about-grid { grid-template-columns: 1fr; gap: 40px; } }

.about-side h2 {
  font-family: var(--display);
  font-weight: 500;
  font-size: clamp(40px, 6vw, 78px);
  line-height: 0.95;
  letter-spacing: -0.035em;
  margin: 16px 0 0;
  color: var(--ink);
  text-wrap: balance;
}
.about-side h2 em { font-style: italic; font-weight: 400; color: var(--ink-soft); }

.about-image {
  margin-top: 32px;
  border-radius: var(--r-lg);
  overflow: hidden;
  border: 1px solid var(--line);
  position: relative;
  aspect-ratio: 4/3;
}
.about-image img {
  width: 100%; height: 100%;
  object-fit: cover;
  filter: brightness(0.94) contrast(1.05);
}
.about-image::after {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(180deg, transparent 60%, oklch(0.40 0.150 28 / 0.22) 100%);
  pointer-events: none;
}

.about-body p {
  font-size: clamp(16px, 1.3vw, 18px);
  line-height: 1.62;
  color: var(--ink-soft);
  max-width: 56ch;
  margin: 0 0 22px;
  text-wrap: pretty;
}
.about-body p:first-of-type { font-size: clamp(17px, 1.5vw, 20px); color: var(--ink); }

.about-pillars {
  margin-top: 36px;
  padding-top: 28px;
  border-top: 1px solid var(--line);
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0;
}
@media (max-width: 560px) { .about-pillars { grid-template-columns: 1fr; } }
.pillar {
  padding: 0 22px 0 0;
  border-right: 1px solid var(--line);
}
.pillar:last-child { border-right: 0; padding-right: 0; }
@media (max-width: 560px) {
  .pillar { padding: 18px 0; border-right: 0; border-bottom: 1px solid var(--line); }
  .pillar:last-child { border-bottom: 0; }
}
.pillar .k {
  font-family: var(--mono);
  font-size: 10px; font-weight: 500;
  letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--ink-mute); margin-bottom: 8px;
}
.pillar .v {
  font-family: var(--display);
  font-size: clamp(17px, 1.4vw, 20px);
  font-weight: 500;
  letter-spacing: -0.015em;
  line-height: 1.2;
  color: var(--ink);
}

/* ── KARTE ── */
.menu-section {
  background: var(--brand-deep);
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}
.menu-head {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 32px;
  align-items: end;
  margin-bottom: clamp(56px, 7vw, 96px);
}
@media (max-width: 760px) { .menu-head { grid-template-columns: 1fr; gap: 20px; } }
.menu-head h2 {
  font-family: var(--display);
  font-weight: 600;
  font-size: clamp(54px, 9.5vw, 134px);
  line-height: 0.87;
  letter-spacing: -0.04em;
  margin: 16px 0 0;
  color: var(--ink);
  text-wrap: balance;
  font-variation-settings: 'opsz' 96;
}
.menu-head h2 em { font-style: italic; font-weight: 400; color: var(--ink-soft); }

.menu-signature {
  margin-bottom: clamp(48px, 6vw, 80px);
  display: grid;
  grid-template-columns: 5fr 7fr;
  gap: clamp(24px, 4vw, 52px);
  align-items: center;
  padding: clamp(22px, 3vw, 34px);
  background: oklch(0.97 0.018 75 / 0.04);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
}
@media (max-width: 760px) { .menu-signature { grid-template-columns: 1fr; gap: 20px; } }
.menu-sig-img {
  border-radius: var(--r-md);
  overflow: hidden;
  aspect-ratio: 4/3;
}
.menu-sig-img img {
  width: 100%; height: 100%;
  object-fit: cover;
  filter: contrast(1.04) saturate(1.06);
}
.menu-sig-text .eyebrow { display: block; margin-bottom: 10px; }
.menu-sig-text h3 {
  font-family: var(--display);
  font-weight: 600;
  font-size: clamp(26px, 3.2vw, 42px);
  letter-spacing: -0.025em;
  line-height: 1.05;
  margin: 0 0 14px;
  color: var(--ink);
}
.menu-sig-text h3 em { font-style: italic; font-weight: 400; color: var(--ink-soft); }
.menu-sig-text p { font-size: 15px; line-height: 1.55; color: var(--ink-soft); margin: 0 0 14px; max-width: 42ch; }
.menu-sig-text .sig-meta { display: flex; gap: 16px; align-items: baseline; flex-wrap: wrap; }
.menu-sig-text .sig-price {
  font-family: var(--mono);
  font-size: 17px; font-weight: 600;
  color: var(--ink);
}
.menu-sig-text .sig-tag {
  font-family: var(--mono);
  font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--ink-mute);
  padding: 3px 8px;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
}

.menu-spread {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(24px, 4vw, 52px) clamp(40px, 7vw, 110px);
}
@media (max-width: 760px) { .menu-spread { grid-template-columns: 1fr; } }

.menu-group { display: flex; flex-direction: column; gap: 22px; }
.menu-group-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line-strong);
}
.menu-group-head h3 {
  font-family: var(--display);
  font-weight: 600; font-size: 21px;
  letter-spacing: -0.018em; margin: 0;
  color: var(--ink);
}
.menu-group-head span {
  font-family: var(--mono);
  font-size: 10px; font-weight: 500;
  letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--ink-mute);
}

.dish {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 14px;
  align-items: baseline;
}
.dish-name {
  font-family: var(--display);
  font-weight: 600; font-size: 18px;
  letter-spacing: -0.012em;
  color: var(--ink); line-height: 1.2;
  margin: 0 0 4px;
}
.dish-tag {
  display: inline-block;
  font-family: var(--mono);
  font-size: 9.5px; letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--ink-mute);
  padding: 2px 7px;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  margin-left: 8px;
  vertical-align: middle;
}
.dish-desc {
  font-size: 13px; line-height: 1.5;
  color: var(--ink-mute); margin: 0; max-width: 40ch;
}
.dish-price {
  font-family: var(--mono);
  font-size: 14px; font-weight: 600;
  color: var(--ink); white-space: nowrap;
  letter-spacing: -0.01em;
}

.menu-note {
  margin-top: clamp(44px, 5.5vw, 68px);
  padding-top: 28px;
  border-top: 1px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
}
.menu-note p { margin: 0; font-size: 14px; color: var(--ink-soft); max-width: 58ch; }

/* ── ATMOSPHERE ── */
.atmo {
  padding: 0 !important;
  position: relative;
  height: clamp(340px, 58vh, 620px);
  overflow: hidden;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}
.atmo img {
  width: 100%; height: 100%;
  object-fit: cover;
  filter: brightness(0.80) saturate(1.1) contrast(1.04);
}
.atmo::after {
  content: '';
  position: absolute; inset: 0;
  background:
    linear-gradient(180deg, oklch(0.40 0.150 28 / 0.20) 0%, transparent 40%, oklch(0.40 0.150 28 / 0.70) 100%);
  pointer-events: none;
}
.atmo-text {
  position: absolute;
  left: clamp(20px, 5vw, 64px);
  bottom: clamp(28px, 5vw, 52px);
  z-index: 1;
}
.atmo-text .eyebrow { display: block; margin-bottom: 12px; color: var(--ink); }
.atmo-text h2 {
  font-family: var(--display);
  font-weight: 600;
  font-size: clamp(32px, 4.5vw, 56px);
  line-height: 0.95;
  letter-spacing: -0.03em;
  color: var(--ink);
  margin: 0;
  text-wrap: balance;
}
.atmo-text h2 em { font-style: italic; font-weight: 400; color: var(--ink-soft); }

/* ── ÖFFNUNGSZEITEN ── */
.hours-section {
  background: var(--brand-deep);
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}
.hours-grid {
  display: grid;
  grid-template-columns: 4fr 8fr;
  gap: clamp(40px, 6vw, 96px);
  align-items: start;
}
@media (max-width: 920px) { .hours-grid { grid-template-columns: 1fr; gap: 32px; } }
.hours-head h2 {
  font-family: var(--display);
  font-weight: 600;
  font-size: clamp(38px, 5.5vw, 62px);
  line-height: 0.95;
  letter-spacing: -0.035em;
  margin: 16px 0 16px;
  color: var(--ink);
}
.hours-head h2 em { font-style: italic; font-weight: 400; color: var(--ink-soft); }
.hours-head .sub {
  font-size: clamp(15px, 1.3vw, 17px);
  line-height: 1.55;
  color: var(--ink-soft);
  max-width: 34ch;
}

.hours-list {
  display: grid;
  grid-template-columns: 1fr;
  border-top: 1px solid var(--line);
}
.hours-row {
  display: grid;
  grid-template-columns: 130px 1fr auto;
  gap: 14px;
  align-items: baseline;
  padding: 17px 0;
  border-bottom: 1px solid var(--line);
}
.hours-row.today {
  background: oklch(0.97 0.018 75 / 0.045);
  padding: 17px 14px;
  margin: 0 -14px;
}
.hours-row .day {
  font-family: var(--display);
  font-weight: 600; font-size: 18px;
  letter-spacing: -0.015em;
  color: var(--ink);
}
.hours-row .marker {
  font-family: var(--mono);
  font-size: 11px; font-weight: 500;
  letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--ink-mute);
}
.hours-row.today .marker { color: var(--ink); }
.hours-row .time {
  font-family: var(--mono);
  font-size: 15px; font-weight: 500;
  color: var(--ink); letter-spacing: -0.01em;
}
.hours-row .time.closed { color: var(--ink-mute); }

/* ── RESERVATION ── */
.reservation-section { background: var(--brand-rich); }
.res-grid {
  display: grid;
  grid-template-columns: 6fr 6fr;
  gap: clamp(40px, 6vw, 96px);
  align-items: start;
}
@media (max-width: 860px) { .res-grid { grid-template-columns: 1fr; gap: 48px; } }

.res-head h2 {
  font-family: var(--display);
  font-weight: 600;
  font-size: clamp(38px, 5.5vw, 68px);
  line-height: 0.95;
  letter-spacing: -0.035em;
  margin: 16px 0 20px;
  color: var(--ink);
  text-wrap: balance;
}
.res-head h2 em { font-style: italic; font-weight: 400; color: var(--ink-soft); }
.res-head p {
  font-size: clamp(15px, 1.3vw, 17px);
  line-height: 1.55;
  color: var(--ink-soft);
  max-width: 44ch;
  margin: 0 0 28px;
}

.res-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  padding: 24px;
  background: oklch(0.97 0.018 75 / 0.04);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
}
@media (max-width: 500px) { .res-info { grid-template-columns: 1fr; } }
.res-info-cell .k {
  font-family: var(--mono);
  font-size: 10px; font-weight: 500;
  letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--ink-mute); margin-bottom: 6px;
}
.res-info-cell .v {
  font-family: var(--display);
  font-size: 18px; font-weight: 500;
  letter-spacing: -0.012em;
  color: var(--ink); line-height: 1.3;
}

.res-form {
  display: flex; flex-direction: column; gap: 14px;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
@media (max-width: 500px) { .form-row { grid-template-columns: 1fr; } }

.field { display: flex; flex-direction: column; gap: 6px; }
.field label {
  font-family: var(--mono);
  font-size: 10px; font-weight: 500;
  letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--ink-mute);
}
.field input,
.field select,
.field textarea {
  width: 100%;
  padding: 12px 14px;
  background: oklch(0.97 0.018 75 / 0.06);
  border: 1px solid var(--line-strong);
  border-radius: var(--r-md);
  font-size: 15px;
  color: var(--ink);
  outline: none;
  transition: border-color 180ms;
  -webkit-appearance: none;
}
.field input::placeholder,
.field textarea::placeholder { color: var(--ink-mute); }
.field input:focus,
.field select:focus,
.field textarea:focus { border-color: var(--cream); }
.field select option { background: #8a2f1a; color: var(--ink); }
.field textarea { resize: vertical; min-height: 100px; }

.form-success {
  text-align: center;
  padding: 40px 24px;
  background: oklch(0.97 0.018 75 / 0.05);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
}
.form-success .check {
  width: 48px; height: 48px;
  border-radius: 50%;
  background: var(--cream);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 18px;
  color: var(--ink-on-cream);
}
.form-success h3 {
  font-family: var(--display);
  font-weight: 600; font-size: 24px;
  letter-spacing: -0.02em; margin: 0 0 10px;
  color: var(--ink);
}
.form-success p { font-size: 14px; color: var(--ink-soft); margin: 0; }

/* ── ANFAHRT ── */
.anfahrt-grid {
  display: grid;
  grid-template-columns: 5fr 7fr;
  gap: clamp(40px, 6vw, 96px);
  align-items: start;
}
@media (max-width: 920px) { .anfahrt-grid { grid-template-columns: 1fr; gap: 40px; } }
.anfahrt-side h2 {
  font-family: var(--display);
  font-weight: 600;
  font-size: clamp(38px, 5.5vw, 66px);
  line-height: 0.95;
  letter-spacing: -0.035em;
  margin: 16px 0 22px;
  color: var(--ink);
}
.anfahrt-side h2 em { font-style: italic; font-weight: 400; color: var(--ink-soft); }
.anfahrt-side > p { color: var(--ink-soft); font-size: 16px; max-width: 44ch; margin: 0 0 30px; }

.addr-block {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px 28px;
  margin-bottom: 28px;
}
@media (max-width: 520px) { .addr-block { grid-template-columns: 1fr; } }
.addr-cell .k {
  font-family: var(--mono);
  font-size: 10px; font-weight: 500;
  letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--ink-mute); margin-bottom: 6px;
}
.addr-cell .v {
  font-family: var(--display);
  font-size: 18px; font-weight: 500;
  letter-spacing: -0.012em;
  color: var(--ink); line-height: 1.3;
}
.addr-cell .v.mono {
  font-family: var(--mono);
  font-size: 14px; letter-spacing: 0;
}

.map-embed {
  border-radius: var(--r-lg);
  overflow: hidden;
  border: 1px solid var(--line);
  aspect-ratio: 4/3;
  background: var(--brand-dark);
}
.map-embed iframe {
  width: 100%; height: 100%;
  border: 0;
  display: block;
  filter: saturate(0.6) contrast(1.1) brightness(0.7) sepia(0.4) hue-rotate(320deg);
}

/* ── FOOTER ── */
footer {
  background: oklch(0.30 0.135 26);
  border-top: 1px solid var(--line);
  padding: 80px 0 32px;
}
.footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 40px;
  margin-bottom: 64px;
}
@media (max-width: 760px) { .footer-grid { grid-template-columns: 1fr 1fr; gap: 32px; } }
@media (max-width: 500px) { .footer-grid { grid-template-columns: 1fr; } }
.footer-brand {
  font-family: var(--display);
  font-size: 34px; font-weight: 700;
  letter-spacing: -0.035em;
  color: var(--ink); margin-bottom: 10px; line-height: 1;
}
.footer-brand small {
  display: block;
  font-family: var(--mono);
  font-size: 10.5px; font-weight: 500;
  letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--ink-mute); margin-top: 10px;
}
.footer-tag { color: var(--ink-soft); font-size: 14px; max-width: 34ch; line-height: 1.55; margin: 0 0 4px; }
.footer-pdstudio {
  display: inline-block;
  margin-top: 14px;
  font-family: var(--mono);
  font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--ink-mute);
  padding: 4px 10px;
  border: 1px solid var(--line-strong);
  border-radius: var(--r-sm);
}
.footer-col h4 {
  font-family: var(--mono);
  font-size: 10px; font-weight: 500;
  letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--ink-mute); margin: 0 0 16px;
}
.footer-col ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 9px; }
.footer-col a { color: var(--ink-soft); font-size: 14px; }
.footer-col a:hover { color: var(--ink); }
.footer-col p { color: var(--ink-soft); font-size: 14px; line-height: 1.55; margin: 0 0 5px; }
.footer-col p strong { color: var(--ink); font-weight: 500; }

.footer-bottom {
  border-top: 1px solid var(--line);
  padding-top: 26px;
  display: flex; align-items: center;
  justify-content: space-between; gap: 16px; flex-wrap: wrap;
}
.footer-bottom p {
  font-family: var(--mono);
  font-size: 11px; letter-spacing: 0.06em;
  color: var(--ink-mute); margin: 0;
}
.footer-bottom .demo-badge {
  font-family: var(--mono);
  font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--ink-mute);
  padding: 3px 9px;
  border: 1px solid var(--line-strong);
  border-radius: var(--r-sm);
}

/* ── LEGAL MODAL ── */
.modal-overlay {
  position: fixed; inset: 0; z-index: 200;
  background: oklch(0.18 0.075 28 / 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
  animation: overlay-in 220ms var(--ease-out);
}
@keyframes overlay-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.modal-box {
  background: var(--brand-rich);
  border: 1px solid var(--line-strong);
  border-radius: var(--r-lg);
  max-width: 600px; width: 100%;
  max-height: 85vh; overflow: auto;
  padding: 36px 32px;
  animation: modal-up 260ms var(--ease-out);
}
@keyframes modal-up {
  from { transform: translateY(10px); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
}
@media (max-width: 600px) { .modal-box { padding: 28px 22px; } }
.modal-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: 24px; margin-bottom: 24px;
}
.modal-header h2 {
  font-family: var(--display);
  font-weight: 600; font-size: 34px;
  letter-spacing: -0.025em; margin: 0;
  color: var(--ink);
}
.modal-close {
  width: 36px; height: 36px;
  border-radius: 50%;
  border: 1px solid var(--line-strong);
  color: var(--ink);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: background 180ms;
}
.modal-close:hover { background: oklch(0.97 0.018 75 / 0.1); }
.modal-body { color: var(--ink-soft); font-size: 14.5px; line-height: 1.65; }
.modal-body p { margin: 0 0 14px; }
.modal-body p:last-child { margin-bottom: 0; }
.modal-body strong { color: var(--ink); font-weight: 500; }

/* ── REVEALS ── */
.reveal {
  opacity: 0;
  transform: translateY(18px);
  transition: opacity 680ms var(--ease-out), transform 680ms var(--ease-out);
}
.reveal.in { opacity: 1; transform: translateY(0); }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  .reveal { opacity: 1; transform: none; }
}
@media (hover: none) {
  .btn-primary:hover { box-shadow: none; }
}
`;

/* ─── component ──────────────────────────────────────────────── */
export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [legalModal, setLegalModal] = useState(null);
  const [todayIdx] = useState(() => new Date().getDay());
  const [form, setForm] = useState({ name: '', email: '', date: '', guests: '2', message: '' });
  const [formSent, setFormSent] = useState(false);

  /* inject css */
  useEffect(() => {
    const el = document.createElement('style');
    el.textContent = CSS;
    document.head.appendChild(el);
    return () => el.remove();
  }, []);

  /* scroll reveals */
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      els.forEach(e => e.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      }),
      { rootMargin: '-8% 0px -8% 0px', threshold: 0.1 }
    );
    els.forEach(e => io.observe(e));
    return () => io.disconnect();
  }, []);

  /* ESC closes modal */
  useEffect(() => {
    if (!legalModal) return;
    const handler = e => { if (e.key === 'Escape') setLegalModal(null); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [legalModal]);

  const handleForm = useCallback(e => {
    e.preventDefault();
    setFormSent(true);
  }, []);

  const openLegal = useCallback(key => e => {
    e.preventDefault();
    setLegalModal(key);
  }, []);

  const isOpenToday = todayIdx >= 1 && todayIdx <= 6;
  const todayLabel = HOURS.find(h => h.idx === todayIdx)?.label ?? '';

  return (
    <>
      {/* ── NAV ── */}
      <nav className="nav">
        <div className="c nav-inner">
          <a href="#top" className="nav-brand" onClick={() => setMenuOpen(false)}>
            Trattoria<span></span>Antonio
          </a>

          <ul className="nav-links">
            <li><a href="#konzept">Konzept</a></li>
            <li><a href="#karte">Karte</a></li>
            <li><a href="#atmosphaere">Atmosphäre</a></li>
            <li><a href="#zeiten">Zeiten</a></li>
            <li><a href="#anfahrt">Anfahrt</a></li>
          </ul>

          <div className="nav-ctas">
            <a href="#reservierung" className="btn-cta">Tisch reservieren</a>
          </div>

          <button
            className="nav-toggle"
            aria-label="Menü öffnen"
            onClick={() => setMenuOpen(o => !o)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              {menuOpen
                ? <path d="M6 6l12 12M6 18L18 6"/>
                : <path d="M3 6h18M3 12h18M3 18h18"/>}
            </svg>
          </button>
        </div>

        <div className={`mobile-menu${menuOpen ? ' open' : ''}`}>
          {['#konzept', '#karte', '#atmosphaere', '#zeiten', '#anfahrt'].map((href, i) => (
            <a key={i} href={href} onClick={() => setMenuOpen(false)}>
              {['Konzept','Karte','Atmosphäre','Zeiten','Anfahrt'][i]}
            </a>
          ))}
          <div className="row">
            <a href="#reservierung" className="btn-cta" onClick={() => setMenuOpen(false)}>Tisch reservieren</a>
          </div>
        </div>
      </nav>

      <main id="top">

        {/* ── HERO ── */}
        <section className="hero">
          <div className="hero-rotate" aria-hidden="true">
            <img src={IMG.hero} alt="" loading="eager"/>
          </div>

          <div className="c">
            <div className="hero-top">
              <span className="eyebrow">Italiano · Plagwitz Leipzig</span>
              <span className="hero-live">
                <span className="pulse"/>
                {isOpenToday ? 'Heute ab 17:30' : 'Sonntag Ruhetag'}
              </span>
            </div>

            <div className="hero-main">
              <h1 className="reveal in">
                Hausgemachte&nbsp;Pasta.
                <span className="light">Echte Trattoria.</span>
              </h1>
            </div>

            <div className="hero-meta-row reveal in">
              <p className="hero-sub">
                Familiäre Küche aus dem Herzen Italiens — hausgemachte Pasta,
                neapolitanische Pizza, handverlesene Weine. Täglich frisch. Seit Jahren Stammlokal.
              </p>
              <div className="hero-meta-item">
                <span className="k">Bewertung</span>
                <span className="v">
                  4,5 ★{' '}
                  <small style={{ fontSize: 12, color: 'var(--ink-mute)', fontFamily: 'var(--mono)', fontWeight: 400 }}>
                    / 290 Reviews
                  </small>
                </span>
              </div>
              <div className="hero-meta-item">
                <span className="k">Adresse</span>
                <span className="v">Plagwitz<br/>04229 Leipzig</span>
              </div>
            </div>

            <div className="hero-ctas reveal in">
              <a href="#reservierung" className="btn-primary">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                </svg>
                Tisch reservieren
              </a>
              <a href="#karte" className="btn-ghost">
                Zur Karte
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M13 6l6 6-6 6"/>
                </svg>
              </a>
            </div>
          </div>
        </section>

        {/* ── TRUST STRIP ── */}
        <section className="trust">
          <div className="c">
            <div className="trust-row">
              <div className="trust-item">
                <span className="n">4,5 ★</span>
                <span className="l">aus 290 Bewertungen</span>
              </div>
              <div className="trust-item">
                <span className="n">100%</span>
                <span className="l">hausgemachte Pasta</span>
              </div>
              <div className="trust-item">
                <span className="n">€€</span>
                <span className="l">Preisklasse</span>
              </div>
              <div className="trust-item">
                <span className="n">Mo–Sa</span>
                <span className="l">17:30 – 23:00 Uhr</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── SHOWCASE ── */}
        <section className="showcase" aria-hidden="true">
          <img src={IMG.showcase} alt="Trattoria Antonio — Restaurant Atmosphäre Leipzig" loading="lazy"/>
          <div className="showcase-text">
            <span className="eyebrow">Jedes Gericht nach Rezept</span>
            <p>Täglich frisch. Pasta von Hand. Tomaten aus Italien.</p>
          </div>
        </section>

        {/* ── KONZEPT ── */}
        <section id="konzept">
          <div className="c">
            <div className="about-grid">
              <div className="about-side">
                <span className="eyebrow">Konzept</span>
                <h2 className="reveal">
                  Familie.<br/>Pasta.<br/>
                  <em>Tradition.</em>
                </h2>
                <div className="about-image reveal">
                  <img
                    src={IMG.interior}
                    alt="Innenraum der Trattoria Antonio, Leipzig Plagwitz"
                    loading="lazy"
                  />
                </div>
              </div>

              <div className="about-body reveal">
                <p>
                  Die Trattoria Antonio ist das, was ein Restaurantbesuch sein sollte:
                  warme Gastfreundschaft, vertraute Gerichte, ein Glas Wein, der passt.
                  Kein Theater, kein Konzept für den Instagramfeed — nur ehrliche
                  italienische Küche, so wie sie in kleinen Familientrattorien gemacht wird.
                </p>
                <p>
                  Mittelpunkt der Küche ist die hausgemachte Pasta — täglich frisch
                  gewalzt, Teig nach eigenem Rezept. Dazu neapolitanische Pizza auf dünnem
                  Boden und eine sorgfältig zusammengestellte Weinkarte aus kleinen
                  italienischen Weingütern.
                </p>
                <p>
                  In Plagwitz, einem der lebendigsten Viertel Leipzigs, hat die Trattoria
                  Antonio über die Jahre eine treue Stammkundschaft aufgebaut. Man kommt
                  einmal und kehrt immer wieder.
                </p>

                <div className="about-pillars">
                  <div className="pillar">
                    <div className="k">Pasta</div>
                    <div className="v">Täglich frisch, von Hand gewalzt.</div>
                  </div>
                  <div className="pillar">
                    <div className="k">Wein</div>
                    <div className="v">Kleine ital. Weingüter, handverlesen.</div>
                  </div>
                  <div className="pillar">
                    <div className="k">Atmosphäre</div>
                    <div className="v">Familiär, warm, ohne Trubel.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── KARTE ── */}
        <section id="karte" className="menu-section">
          <div className="c">
            <div className="menu-head">
              <div>
                <span className="eyebrow" style={{ display: 'block', marginBottom: 18 }}>Auswahl aus der Karte</span>
                <h2 className="reveal">
                  Pasta,&nbsp;Pizza
                  <em>&nbsp;&amp;&nbsp;Dolci.</em>
                </h2>
              </div>
            </div>

            {/* Signature strip */}
            <div className="menu-signature reveal">
              <div className="menu-sig-img">
                <img src={IMG.signature_dish} alt="Tagliatelle al Ragù — Signature Pasta der Trattoria Antonio" loading="lazy"/>
              </div>
              <div className="menu-sig-text">
                <span className="eyebrow">House Signature</span>
                <h3>Tagliatelle <em>al Ragù.</em></h3>
                <p>
                  Hausgemachte Bandnudeln, langsam gegarter Fleischsugo über mehrere Stunden,
                  gereifter Parmesan. Das Gericht, für das unsere Stammgäste wiederkommen.
                </p>
                <div className="sig-meta">
                  <span className="sig-price">14,90 €</span>
                  <span className="sig-tag">Signature</span>
                  <span className="sig-tag">hausgemacht</span>
                </div>
              </div>
            </div>

            {/* Menu spread */}
            <div className="menu-spread">
              <div className="menu-group">
                <div className="menu-group-head">
                  <h3>Pasta</h3>
                  <span>hausgemacht</span>
                </div>
                {PASTA.map((item, i) => (
                  <div key={i} className="dish">
                    <div>
                      <p className="dish-name">
                        {item.name}
                        {item.tag && <span className="dish-tag">{item.tag}</span>}
                      </p>
                      <p className="dish-desc">{item.desc}</p>
                    </div>
                    <span className="dish-price">{item.price}</span>
                  </div>
                ))}
              </div>

              <div className="menu-group">
                <div className="menu-group-head">
                  <h3>Pizza</h3>
                  <span>neapolitanisch</span>
                </div>
                {PIZZA.map((item, i) => (
                  <div key={i} className="dish">
                    <div>
                      <p className="dish-name">
                        {item.name}
                        {item.tag && <span className="dish-tag">{item.tag}</span>}
                      </p>
                      <p className="dish-desc">{item.desc}</p>
                    </div>
                    <span className="dish-price">{item.price}</span>
                  </div>
                ))}

                <div className="menu-group-head" style={{ marginTop: 24 }}>
                  <h3>Dolci</h3>
                  <span>zum Abschluss</span>
                </div>
                {DOLCI.map((item, i) => (
                  <div key={i} className="dish">
                    <div>
                      <p className="dish-name">
                        {item.name}
                        {item.tag && <span className="dish-tag">{item.tag}</span>}
                      </p>
                      <p className="dish-desc">{item.desc}</p>
                    </div>
                    <span className="dish-price">{item.price}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="menu-note">
              <p>
                Tägliche Empfehlungen und saisonale Spezialitäten fragen Sie gerne unser Team.
                Weinkarte auf Anfrage — überwiegend kleine italienische Güter.
              </p>
              <a href="#reservierung" className="btn-primary" style={{ height: 52, fontSize: 14 }}>
                Tisch reservieren
              </a>
            </div>
          </div>
        </section>

        {/* ── ATMOSPHERE ── */}
        <section id="atmosphaere" className="atmo">
          <img src={IMG.atmosphere} alt="Atmosphäre Trattoria Antonio Leipzig Plagwitz" loading="lazy"/>
          <div className="atmo-text">
            <span className="eyebrow">Atmosphäre</span>
            <h2 className="reveal in">
              Klein. Warm.
              <em> Immer voll.</em>
            </h2>
          </div>
        </section>

        {/* ── ÖFFNUNGSZEITEN ── */}
        <section id="zeiten" className="hours-section">
          <div className="c">
            <div className="hours-grid">
              <div className="hours-head">
                <span className="eyebrow">Öffnungszeiten</span>
                <h2 className="reveal">
                  Mo–Sa
                  <em> ab 17:30.</em>
                </h2>
                <p className="sub">
                  Montag bis Samstag öffnen wir abends um halb sechs.
                  Sonntag ist unser Ruhetag.
                </p>
              </div>

              <div className="hours-list">
                {HOURS.map(h => (
                  <div
                    key={h.idx}
                    className={`hours-row${h.idx === todayIdx ? ' today' : ''}`}
                  >
                    <span className="day">{h.label}</span>
                    <span className="marker">
                      {h.idx === todayIdx ? '· Heute' : ''}
                    </span>
                    <span className={`time${h.closed ? ' closed' : ''}`}>{h.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── RESERVATION ── */}
        <section id="reservierung" className="reservation-section">
          <div className="c">
            <div className="res-grid">
              <div>
                <span className="eyebrow">Reservierung</span>
                <div className="res-head">
                  <h2>
                    Tisch
                    <em> reservieren.</em>
                  </h2>
                  <p>
                    Schreiben Sie uns — wir bestätigen Ihre Anfrage innerhalb von
                    24 Stunden per E-Mail. Für größere Gruppen nehmen Sie bitte
                    rechtzeitig Kontakt auf.
                  </p>
                </div>
                <div className="res-info">
                  <div className="res-info-cell">
                    <div className="k">Adresse</div>
                    <div className="v">Plagwitz<br/>04229 Leipzig</div>
                  </div>
                  <div className="res-info-cell">
                    <div className="k">Geöffnet</div>
                    <div className="v">Mo – Sa<br/>17:30 – 23:00</div>
                  </div>
                  <div className="res-info-cell">
                    <div className="k">Küche</div>
                    <div className="v">Italienisch<br/>Pasta · Pizza</div>
                  </div>
                  <div className="res-info-cell">
                    <div className="k">Kontakt</div>
                    <div className="v" style={{ fontSize: 14, fontFamily: 'var(--mono)' }}>
                      per Formular
                    </div>
                  </div>
                </div>
              </div>

              <div>
                {formSent ? (
                  <div className="form-success">
                    <div className="check">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 13l4 4L19 7"/>
                      </svg>
                    </div>
                    <h3>Anfrage gesendet.</h3>
                    <p>Wir melden uns innerhalb von 24 Stunden bei Ihnen. Grazie!</p>
                  </div>
                ) : (
                  <form className="res-form" onSubmit={handleForm}>
                    <div className="form-row">
                      <div className="field">
                        <label htmlFor="res-name">Name</label>
                        <input
                          id="res-name"
                          type="text"
                          placeholder="Ihr Name"
                          value={form.name}
                          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="field">
                        <label htmlFor="res-email">E-Mail</label>
                        <input
                          id="res-email"
                          type="email"
                          placeholder="ihre@mail.de"
                          value={form.email}
                          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="field">
                        <label htmlFor="res-date">Wunschdatum</label>
                        <input
                          id="res-date"
                          type="date"
                          value={form.date}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="field">
                        <label htmlFor="res-guests">Personen</label>
                        <select
                          id="res-guests"
                          value={form.guests}
                          onChange={e => setForm(f => ({ ...f, guests: e.target.value }))}
                        >
                          {['1','2','3','4','5','6','7','8+'].map(n => (
                            <option key={n} value={n}>{n} {n === '1' ? 'Person' : 'Personen'}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="field">
                      <label htmlFor="res-msg">Anmerkungen</label>
                      <textarea
                        id="res-msg"
                        placeholder="Allergien, besondere Wünsche, Anlass…"
                        value={form.message}
                        onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      />
                    </div>
                    <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                      </svg>
                      Anfrage senden
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── ANFAHRT ── */}
        <section id="anfahrt" style={{ background: 'var(--brand-deep)', borderTop: '1px solid var(--line)' }}>
          <div className="c">
            <div className="anfahrt-grid">
              <div className="anfahrt-side">
                <span className="eyebrow">Anfahrt &amp; Lage</span>
                <h2 className="reveal">
                  Plagwitz,
                  <em> Leipzig.</em>
                </h2>
                <p>
                  Im Herzen von Plagwitz — einem der lebendigsten Viertel Leipzigs.
                  Gut erreichbar mit Tram und Rad.
                </p>

                <div className="addr-block">
                  <div className="addr-cell">
                    <div className="k">Adresse</div>
                    <div className="v">Plagwitz<br/>04229 Leipzig</div>
                  </div>
                  <div className="addr-cell">
                    <div className="k">Öffnungszeiten</div>
                    <div className="v">Mo – Sa<br/>17:30 – 23:00</div>
                  </div>
                  <div className="addr-cell">
                    <div className="k">Tram</div>
                    <div className="v" style={{ fontSize: 15 }}>Linien Richtung Plagwitz / Karl-Heine-Str.</div>
                  </div>
                  <div className="addr-cell">
                    <div className="k">Heute</div>
                    <div className="v" style={{ fontSize: 15 }}>
                      {isOpenToday
                        ? `${todayLabel} — 17:30 bis 23:00`
                        : 'Sonntag — Ruhetag'}
                    </div>
                  </div>
                </div>

                <a
                  href="https://maps.google.com/?q=Plagwitz+04229+Leipzig"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost"
                  style={{ height: 48, fontSize: 14 }}
                >
                  In Google Maps öffnen
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 17L17 7M7 7h10v10"/>
                  </svg>
                </a>
              </div>

              <div className="map-embed">
                <iframe
                  src="https://maps.google.com/maps?q=Plagwitz,+04229+Leipzig&t=&z=15&ie=UTF8&iwloc=&output=embed"
                  title="Trattoria Antonio Karte Leipzig Plagwitz"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer>
        <div className="c">
          <div className="footer-grid">
            <div>
              <div className="footer-brand">
                Trattoria
                <span style={{ display:'inline-block', width:5, height:5, borderRadius:'50%', background:'var(--ink)', margin:'0 7px 4px', verticalAlign:'middle' }}/>
                Antonio
                <small>Italiano · Plagwitz Leipzig</small>
              </div>
              <p className="footer-tag">
                Familiäre italienische Trattoria in Leipzig-Plagwitz.
                Hausgemachte Pasta, neapolitanische Pizza.
              </p>
              <span className="footer-pdstudio">Erstellt von PDSTUDIO</span>
            </div>

            <div className="footer-col">
              <h4>Besuch</h4>
              <ul>
                <li><p><strong>Plagwitz</strong></p><p style={{ fontSize:13, color:'var(--ink-mute)' }}>04229 Leipzig</p></li>
                <li><p><strong>Mo – Sa</strong></p><p style={{ fontSize:13, color:'var(--ink-mute)' }}>17:30 – 23:00 Uhr</p></li>
                <li><p><strong>So</strong></p><p style={{ fontSize:13, color:'var(--ink-mute)' }}>Ruhetag</p></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Navigation</h4>
              <ul>
                <li><a href="#konzept">Konzept</a></li>
                <li><a href="#karte">Speisekarte</a></li>
                <li><a href="#atmosphaere">Atmosphäre</a></li>
                <li><a href="#zeiten">Öffnungszeiten</a></li>
                <li><a href="#reservierung">Reservierung</a></li>
                <li><a href="#anfahrt">Anfahrt</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Rechtliches</h4>
              <ul>
                <li><a href="#impressum" onClick={openLegal('impressum')}>Impressum</a></li>
                <li><a href="#datenschutz" onClick={openLegal('datenschutz')}>Datenschutz</a></li>
                <li><a href="#agb" onClick={openLegal('agb')}>AGB</a></li>
                <li><a href="#reservierung">Kontakt</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>© 2026 Trattoria Antonio · Plagwitz, 04229 Leipzig</p>
            <span className="demo-badge">Demo · noindex · pdstudio.de</span>
          </div>
        </div>
      </footer>

      {/* ── LEGAL MODAL ── */}
      {legalModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setLegalModal(null); }}>
          <div className="modal-box">
            <div className="modal-header">
              <h2>{LEGAL[legalModal].title}</h2>
              <button className="modal-close" onClick={() => setLegalModal(null)} aria-label="Schließen">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M6 18L18 6"/>
                </svg>
              </button>
            </div>
            <div
              className="modal-body"
              dangerouslySetInnerHTML={{ __html: LEGAL[legalModal].body }}
            />
          </div>
        </div>
      )}
    </>
  );
}
