import { useState, useEffect } from 'react'

const IMAGES = {
  hero:       'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&q=85&auto=format&fit=crop',
  interior:   'https://images.unsplash.com/photo-1525610553991-2bede1a236e2?w=1200&q=80&auto=format&fit=crop',
  food:       'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80&auto=format&fit=crop',
  atmosphere: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=1200&q=80&auto=format&fit=crop',
}

const HOURS = [
  { day: 'Montag',     jsDay: 1, time: '12:00 — 22:00', open: true },
  { day: 'Dienstag',   jsDay: 2, time: '12:00 — 22:00', open: true },
  { day: 'Mittwoch',   jsDay: 3, time: '12:00 — 22:00', open: true },
  { day: 'Donnerstag', jsDay: 4, time: '12:00 — 22:00', open: true },
  { day: 'Freitag',    jsDay: 5, time: '12:00 — 22:00', open: true },
  { day: 'Samstag',    jsDay: 6, time: '18:00 — 22:00', open: true },
  { day: 'Sonntag',    jsDay: 0, time: 'Geschlossen',   open: false },
]

const MENU = [
  {
    category: 'Tageskarte',
    note: 'wechselt täglich',
    items: [
      { name: 'Linsen-Dal',         desc: 'Rote Linsen, Ingwer, Kokos, hausgemachtes Naan, Mango-Raita.',        price: '11,90 €', tag: 'vegan' },
      { name: 'Kürbissuppe',        desc: 'Hokkaido, Ingwer, Kokosrahm, Kürbiskernöl. Mit Vollkornbrot.',        price: '7,50 €',  tag: 'vegan' },
      { name: 'Pasta Bärlauch',     desc: 'Frische Bandnudeln, Bärlauch-Pesto, Walnuss, Parmesan.',              price: '12,50 €', tag: 'vegetarisch' },
      { name: 'Falafel-Teller',     desc: 'Hausgemachte Falafel, Hummus, Taboulé, Fladenbrot, Zitrone.',         price: '11,50 €', tag: 'vegan' },
    ],
  },
  {
    category: 'Küche & Getränke',
    note: 'durchgehend',
    items: [
      { name: 'Quiche Lorraine',    desc: 'Hausgemacht, täglich frisch. Mit gemischtem Blattsalat.',              price: '10,90 €', tag: 'vegetarisch' },
      { name: 'Mittagsgericht',     desc: 'Täglich wechselnd — fragen Sie das Team. Immer mit Beilage.',         price: 'ab 8,50 €', tag: '' },
      { name: 'Hauslimonade',       desc: 'Holunder, Ingwer-Zitrone oder Minze. Ohne Zusätze, täglich frisch.',  price: '3,50 €',  tag: 'vegan' },
      { name: 'Kaffee & Kuchen',    desc: 'Espresso-Spezialitäten und täglich frischer Kuchen vom Blech.',       price: 'ab 2,80 €', tag: '' },
    ],
  },
]

const CSS = `
:root {
  --banner-h: 36px;
  --nav-h: 64px;
  --scroll-off: calc(var(--banner-h) + var(--nav-h) + 20px);

  --cream:      oklch(0.97 0.018 80);
  --cream-warm: oklch(0.93 0.024 76);
  --cream-deep: oklch(0.89 0.030 72);

  --bark:       oklch(0.18 0.042 50);
  --bark-soft:  oklch(0.36 0.038 54);
  --bark-mute:  oklch(0.54 0.030 58);
  --bark-faint: oklch(0.72 0.022 64);

  --dark:       oklch(0.17 0.038 48);
  --dark-mid:   oklch(0.22 0.036 50);

  --ink:        oklch(0.96 0.016 78);
  --ink-soft:   oklch(0.82 0.020 74);
  --ink-mute:   oklch(0.64 0.026 66);

  --amber:      oklch(0.68 0.118 66);
  --amber-deep: oklch(0.55 0.128 58);

  --line-l: oklch(0.18 0.042 50 / 0.10);
  --line-m: oklch(0.18 0.042 50 / 0.18);
  --line-d: oklch(0.97 0.016 78 / 0.14);

  --display: "Fraunces", Georgia, serif;
  --sans: "Inter", system-ui, -apple-system, sans-serif;
  --mono: "JetBrains Mono", ui-monospace, monospace;

  --container: 1280px;
  --r-sm: 4px; --r-md: 10px; --r-lg: 16px; --r-xl: 22px;
  --ease: cubic-bezier(0.23, 1, 0.32, 1);
}

*{box-sizing:border-box}
*::selection{background:var(--amber);color:var(--cream)}
html{scroll-behavior:smooth}
html,body{margin:0;padding:0;background:var(--cream);color:var(--bark);font-family:var(--sans);font-size:16px;line-height:1.55;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
img{max-width:100%;display:block}
a{color:inherit;text-decoration:none;transition:opacity 200ms var(--ease)}
button{font:inherit;cursor:pointer;border:0;background:transparent}

.container{width:100%;max-width:var(--container);margin:0 auto;padding:0 clamp(20px,5vw,48px)}

#konzept,#karte,#zeiten,#anfahrt{scroll-margin-top:var(--scroll-off)}

.eyebrow{
  font-family:var(--mono);font-size:11px;font-weight:500;
  letter-spacing:0.18em;text-transform:uppercase;color:var(--ink-mute)
}
.eyebrow-dark{
  display:block;font-family:var(--mono);font-size:11px;font-weight:500;
  letter-spacing:0.18em;text-transform:uppercase;color:var(--bark-mute);margin-bottom:16px
}

/* === DEMO BANNER === */
.demo-banner{
  position:sticky;top:0;z-index:200;
  height:var(--banner-h);
  background:var(--dark);
  display:flex;align-items:center;justify-content:center;gap:10px;
  font-family:var(--mono);font-size:11px;font-weight:500;
  letter-spacing:0.14em;text-transform:uppercase;color:var(--ink-mute)
}
.demo-dot{opacity:0.45}

/* === NAV === */
.nav{
  position:sticky;top:var(--banner-h);z-index:100;
  background:oklch(0.97 0.018 80 / 0.88);
  backdrop-filter:blur(20px) saturate(160%);
  -webkit-backdrop-filter:blur(20px) saturate(160%);
  border-bottom:1px solid var(--line-l);
  transition:background 300ms var(--ease),box-shadow 300ms var(--ease)
}
.nav.scrolled{
  background:oklch(0.97 0.018 80 / 0.97);
  box-shadow:0 1px 0 var(--line-m),0 4px 20px oklch(0.18 0.042 50 / 0.06)
}
.nav-inner{display:flex;align-items:center;justify-content:space-between;height:var(--nav-h);gap:24px}

.nav-brand{
  display:flex;align-items:baseline;gap:8px;
  font-family:var(--display);font-size:22px;font-weight:600;
  letter-spacing:-0.022em;color:var(--bark);font-style:normal
}
.nav-brand-sub{
  font-family:var(--mono);font-size:11px;font-weight:500;
  letter-spacing:0.14em;text-transform:uppercase;
  color:var(--bark-mute);font-style:normal
}

.nav-links{display:flex;align-items:center;gap:clamp(18px,2.5vw,34px);list-style:none;margin:0;padding:0}
.nav-links a{font-size:14px;font-weight:500;color:var(--bark-soft);letter-spacing:-0.004em}
.nav-links a:hover{color:var(--bark)}

.nav-cta-call{
  display:inline-flex;align-items:center;height:38px;padding:0 18px;
  border-radius:999px;border:1.5px solid var(--line-m);
  font-size:13px;font-weight:600;color:var(--bark);
  transition:all 200ms var(--ease)
}
.nav-cta-call:hover{background:var(--bark);color:var(--cream);border-color:var(--bark)}

.nav-toggle{
  display:none;width:38px;height:38px;
  border:1.5px solid var(--line-m);border-radius:var(--r-md);
  color:var(--bark);align-items:center;justify-content:center
}
@media(max-width:900px){
  .nav-links,.nav-cta-call{display:none}
  .nav-toggle{display:inline-flex}
}

.mobile-menu{
  position:fixed;top:calc(var(--banner-h) + var(--nav-h));left:0;right:0;bottom:0;
  background:var(--cream);padding:32px clamp(20px,5vw,48px);
  transform:translateY(-8px);opacity:0;pointer-events:none;
  transition:transform 260ms var(--ease),opacity 220ms var(--ease);
  z-index:99;display:flex;flex-direction:column;overflow-y:auto
}
.mobile-menu.open{transform:translateY(0);opacity:1;pointer-events:auto}
.mobile-menu a{
  font-family:var(--display);font-size:clamp(28px,8vw,40px);font-weight:500;
  letter-spacing:-0.025em;padding:16px 0;
  border-bottom:1px solid var(--line-l);color:var(--bark)
}
.mobile-menu a:hover{color:var(--bark-soft)}
.mobile-cta{
  font-family:var(--mono) !important;font-size:16px !important;
  font-weight:600 !important;letter-spacing:0.02em !important;
  margin-top:24px;color:var(--amber-deep) !important;border-bottom:none !important
}

/* === HERO === */
.hero{
  position:relative;
  min-height:calc(100dvh - var(--banner-h) - var(--nav-h));
  overflow:hidden;background:var(--dark);
  display:flex;flex-direction:column;justify-content:flex-end;
  padding-bottom:clamp(56px,8vw,96px)
}
.hero-bg{position:absolute;inset:0;z-index:0}
.hero-bg img{
  width:100%;height:100%;object-fit:cover;object-position:center 38%;
  filter:brightness(0.70) saturate(0.88) contrast(1.06)
}
.hero-overlay{
  position:absolute;inset:0;z-index:1;
  background:
    linear-gradient(180deg,oklch(0.17 0.038 48 / 0.28) 0%,transparent 32%,transparent 48%,oklch(0.17 0.038 48 / 0.84) 100%),
    linear-gradient(105deg,oklch(0.17 0.038 48 / 0.52) 0%,transparent 58%)
}
.hero-content{position:relative;z-index:2}

.hero-eyebrow{
  display:flex;align-items:center;justify-content:space-between;
  margin-bottom:clamp(40px,7vw,80px)
}
.hero-live{
  display:inline-flex;align-items:center;gap:9px;
  font-family:var(--mono);font-size:11px;font-weight:500;
  letter-spacing:0.16em;text-transform:uppercase;color:var(--ink-mute)
}
.pulse-dot{
  width:7px;height:7px;border-radius:50%;
  background:oklch(0.74 0.142 135);
  animation:pulse-g 2.4s ease-out infinite
}
@keyframes pulse-g{
  0%{box-shadow:0 0 0 0 oklch(0.74 0.142 135 / 0.7)}
  100%{box-shadow:0 0 0 8px oklch(0.74 0.142 135 / 0)}
}
@media(prefers-reduced-motion:reduce){.pulse-dot{animation:none}}

.hero h1{
  font-family:var(--display);font-weight:400;
  font-size:clamp(64px,13vw,180px);
  line-height:0.88;letter-spacing:-0.04em;
  color:var(--ink);margin:0 0 clamp(24px,3vw,40px);text-wrap:balance
}
.hero h1 em{font-style:italic;font-weight:300;color:var(--ink-soft)}

.hero-sub{
  font-size:clamp(16px,1.4vw,19px);line-height:1.55;
  color:var(--ink-soft);max-width:42ch;
  margin:0 0 clamp(32px,4vw,48px);text-wrap:pretty
}
.hero-ctas{display:flex;gap:12px;align-items:center;flex-wrap:wrap}

.btn-primary{
  display:inline-flex;align-items:center;gap:10px;
  height:56px;padding:0 28px;border-radius:999px;
  background:var(--cream);color:var(--bark);
  font-weight:600;font-size:15px;letter-spacing:-0.01em;border:0;
  transition:transform 160ms var(--ease),background 200ms var(--ease),box-shadow 200ms var(--ease)
}
.btn-primary:hover{background:oklch(1 0 0);box-shadow:0 12px 32px -8px oklch(0 0 0 / 0.22);transform:translateY(-1px)}
.btn-primary:active{transform:scale(0.97)}

.btn-ghost{
  display:inline-flex;align-items:center;gap:10px;
  height:56px;padding:0 24px;border-radius:999px;
  background:transparent;color:var(--ink);
  font-weight:600;font-size:15px;
  border:1.5px solid oklch(0.97 0.016 78 / 0.35);
  transition:all 200ms var(--ease)
}
.btn-ghost:hover{border-color:oklch(0.97 0.016 78 / 0.65);background:oklch(0.97 0.016 78 / 0.07);color:var(--ink)}
.btn-ghost:active{transform:scale(0.97)}

/* === TRUST === */
.trust{
  background:var(--dark-mid);
  border-bottom:1px solid var(--line-d);
  padding:30px 0
}
.trust-row{
  display:flex;align-items:center;justify-content:space-between;
  gap:24px;flex-wrap:wrap
}
.trust-item{display:flex;flex-direction:column;gap:5px}
.trust-n{
  font-family:var(--display);font-size:clamp(20px,2.2vw,28px);
  font-weight:500;letter-spacing:-0.02em;line-height:1;color:var(--ink)
}
.trust-l{
  font-family:var(--mono);font-size:11px;font-weight:500;
  letter-spacing:0.14em;text-transform:uppercase;color:var(--ink-mute);max-width:22ch
}

/* === ABOUT === */
.about-section{padding:clamp(80px,11vw,140px) 0;background:var(--cream)}
.about-grid{
  display:grid;grid-template-columns:5fr 7fr;
  gap:clamp(48px,7vw,96px);align-items:start
}
@media(max-width:900px){.about-grid{grid-template-columns:1fr;gap:48px}}

.about-text h2{
  font-family:var(--display);font-weight:500;
  font-size:clamp(40px,6vw,72px);
  line-height:0.96;letter-spacing:-0.032em;
  margin:0 0 28px;color:var(--bark);text-wrap:balance
}
.about-text h2 em{font-style:italic;font-weight:400;color:var(--bark-mute)}

.about-lead{
  font-size:clamp(17px,1.5vw,20px);line-height:1.5;
  color:var(--bark);margin:0 0 18px;max-width:44ch
}
.about-body{
  font-size:clamp(15px,1.2vw,17px);line-height:1.65;
  color:var(--bark-soft);margin:0 0 16px;max-width:50ch;text-wrap:pretty
}

.about-facts{
  margin-top:36px;padding-top:28px;border-top:1px solid var(--line-m);
  display:grid;grid-template-columns:1fr 1fr 1fr
}
@media(max-width:580px){.about-facts{grid-template-columns:1fr}}
.about-fact{padding:0 20px 0 0;border-right:1px solid var(--line-m)}
.about-fact:last-child{border-right:0;padding-right:0}
@media(max-width:580px){
  .about-fact{padding:16px 0;border-right:0;border-bottom:1px solid var(--line-m)}
  .about-fact:last-child{border-bottom:0}
}
.af-k{
  font-family:var(--mono);font-size:10px;font-weight:500;
  letter-spacing:0.2em;text-transform:uppercase;color:var(--bark-mute);margin-bottom:7px
}
.af-v{
  font-family:var(--display);font-size:clamp(16px,1.3vw,18px);
  font-weight:500;letter-spacing:-0.01em;line-height:1.25;color:var(--bark)
}

.about-images{display:flex;flex-direction:column;gap:14px}
.about-img-main{
  border-radius:var(--r-xl);overflow:hidden;aspect-ratio:4/3;
  border:1px solid var(--line-l)
}
.about-img-main img{
  width:100%;height:100%;object-fit:cover;
  filter:contrast(1.03) saturate(0.94);
  transition:transform 800ms var(--ease)
}
.about-img-main:hover img{transform:scale(1.024)}
.about-img-sec{
  border-radius:var(--r-xl);overflow:hidden;aspect-ratio:16/7;
  border:1px solid var(--line-l)
}
.about-img-sec img{
  width:100%;height:100%;object-fit:cover;object-position:center 30%;
  filter:contrast(1.02) saturate(0.88) brightness(0.96)
}

/* === MENU === */
.menu-section{
  padding:clamp(80px,10vw,120px) 0;
  background:var(--cream-warm);
  border-top:1px solid var(--line-m);
  border-bottom:1px solid var(--line-m)
}
.menu-head{
  display:grid;grid-template-columns:1fr auto;
  gap:32px;align-items:end;margin-bottom:clamp(40px,6vw,64px)
}
@media(max-width:760px){.menu-head{grid-template-columns:1fr;align-items:start;gap:20px}}

.menu-title{
  font-family:var(--display);font-weight:500;
  font-size:clamp(44px,8vw,100px);
  line-height:0.90;letter-spacing:-0.036em;
  margin:0;color:var(--bark);text-wrap:balance
}
.menu-title em{font-style:italic;font-weight:400;color:var(--bark-mute)}

.menu-demo-note{
  display:flex;flex-direction:column;align-items:flex-end;gap:8px;text-align:right
}
@media(max-width:760px){.menu-demo-note{align-items:flex-start;text-align:left}}
.demo-tag{
  display:inline-block;
  font-family:var(--mono);font-size:10px;font-weight:600;
  letter-spacing:0.18em;text-transform:uppercase;
  color:var(--amber-deep);
  background:oklch(0.68 0.118 66 / 0.10);
  padding:4px 10px;border-radius:var(--r-sm);
  border:1px solid oklch(0.68 0.118 66 / 0.25)
}
.menu-demo-note p{font-size:13px;line-height:1.5;color:var(--bark-mute);margin:0}

.food-strip{
  position:relative;width:100%;height:clamp(240px,38vh,440px);
  overflow:hidden;border-radius:var(--r-xl);
  margin-bottom:clamp(40px,5vw,64px);border:1px solid var(--line-m)
}
.food-strip img{
  width:100%;height:100%;object-fit:cover;object-position:center 60%;
  filter:contrast(1.05) saturate(1.08) brightness(0.90)
}
.food-strip::after{
  content:'';position:absolute;inset:0;
  background:
    linear-gradient(180deg,transparent 35%,oklch(0.17 0.038 48 / 0.75) 100%),
    linear-gradient(90deg,oklch(0.17 0.038 48 / 0.30) 0%,transparent 48%);
  pointer-events:none
}
.food-strip-text{
  position:absolute;left:clamp(20px,4vw,40px);bottom:clamp(20px,3vw,32px);z-index:1
}
.food-strip-text .eyebrow{display:block;margin-bottom:8px}
.food-strip-text p{
  font-family:var(--display);font-style:italic;font-weight:400;
  font-size:clamp(20px,2.4vw,30px);letter-spacing:-0.022em;
  line-height:1.2;color:var(--ink);margin:0
}

.menu-grid{
  display:grid;grid-template-columns:1fr 1fr;
  gap:clamp(32px,4vw,64px) clamp(40px,6vw,96px)
}
@media(max-width:700px){.menu-grid{grid-template-columns:1fr}}

.menu-group{display:flex;flex-direction:column}
.menu-group-head{
  display:flex;align-items:baseline;justify-content:space-between;
  padding-bottom:14px;margin-bottom:2px;border-bottom:1px solid var(--line-m)
}
.menu-group-head h3{
  font-family:var(--display);font-weight:600;
  font-size:22px;letter-spacing:-0.018em;margin:0;color:var(--bark)
}
.menu-group-head span{
  font-family:var(--mono);font-size:10.5px;font-weight:500;
  letter-spacing:0.16em;text-transform:uppercase;color:var(--bark-mute)
}

.menu-item{
  display:grid;grid-template-columns:1fr auto;
  gap:16px;align-items:start;
  padding:18px 0;border-bottom:1px solid var(--line-l)
}
.menu-item:last-child{border-bottom:0}
.mi-name{
  font-family:var(--display);font-size:18px;font-weight:500;
  letter-spacing:-0.01em;color:var(--bark);line-height:1.25;
  margin-bottom:5px;display:flex;align-items:baseline;gap:8px;flex-wrap:wrap
}
.mi-tag{
  font-family:var(--mono);font-size:9.5px;font-weight:500;
  letter-spacing:0.14em;text-transform:uppercase;color:var(--bark-mute);
  padding:2px 7px;border:1px solid var(--line-m);border-radius:999px;
  white-space:nowrap;flex-shrink:0
}
.mi-desc{font-size:13.5px;line-height:1.5;color:var(--bark-soft);max-width:44ch}
.mi-price{
  font-family:var(--mono);font-size:15px;font-weight:600;
  color:var(--bark);white-space:nowrap;letter-spacing:-0.01em;padding-top:2px
}

.menu-fnote{
  margin-top:40px;padding-top:24px;border-top:1px solid var(--line-m);
  text-align:center
}
.menu-fnote p{font-size:14px;color:var(--bark-soft);margin:0}
.menu-fnote a{color:var(--bark);border-bottom:1px solid var(--line-m);padding-bottom:1px}
.menu-fnote a:hover{color:var(--amber-deep);border-bottom-color:var(--amber-deep)}

/* === HOURS === */
.hours-section{
  padding:clamp(80px,10vw,120px) 0;
  background:var(--dark);border-top:1px solid var(--line-d)
}
.hours-grid{
  display:grid;grid-template-columns:4fr 8fr;
  gap:clamp(48px,7vw,96px);align-items:start
}
@media(max-width:900px){.hours-grid{grid-template-columns:1fr;gap:40px}}

.hours-head .eyebrow-dark{color:var(--ink-mute)}
.hours-head h2{
  font-family:var(--display);font-weight:500;
  font-size:clamp(38px,5.5vw,64px);
  line-height:0.96;letter-spacing:-0.030em;
  margin:0 0 20px;color:var(--ink);text-wrap:balance
}
.hours-head h2 em{font-style:italic;font-weight:400;color:var(--ink-soft)}
.hours-note{font-size:15px;line-height:1.65;color:var(--ink-soft);margin:0 0 28px}

.btn-outline-light{
  display:inline-flex;align-items:center;gap:10px;
  height:48px;padding:0 22px;border-radius:999px;
  background:transparent;border:1.5px solid oklch(0.97 0.016 78 / 0.25);
  color:var(--ink);font-family:var(--mono);font-size:14px;font-weight:600;
  transition:all 200ms var(--ease)
}
.btn-outline-light:hover{
  background:oklch(0.97 0.016 78 / 0.07);
  border-color:oklch(0.97 0.016 78 / 0.50);color:var(--ink)
}

.hours-list{border-top:1px solid var(--line-d)}
.hours-row{
  display:grid;grid-template-columns:150px 1fr auto;
  gap:12px;align-items:baseline;
  padding:18px 0;border-bottom:1px solid var(--line-d)
}
.hours-row.today{
  background:oklch(0.97 0.016 78 / 0.04);
  padding:18px 16px;margin:0 -16px;border-radius:var(--r-md)
}
.hours-row.closed .hr-time{color:var(--ink-mute)}
.hr-day{
  font-family:var(--display);font-weight:500;
  font-size:19px;letter-spacing:-0.015em;color:var(--ink)
}
.hr-marker{
  font-family:var(--mono);font-size:10px;font-weight:600;
  letter-spacing:0.18em;text-transform:uppercase;color:var(--amber)
}
.hr-time{
  font-family:var(--mono);font-size:15px;font-weight:500;
  color:var(--ink);letter-spacing:-0.01em;text-align:right
}

/* === CONTACT === */
.contact-section{
  padding:clamp(80px,10vw,120px) 0;
  background:var(--cream);border-top:1px solid var(--line-l)
}
.contact-grid{
  display:grid;grid-template-columns:5fr 7fr;
  gap:clamp(48px,7vw,80px);align-items:start
}
@media(max-width:900px){.contact-grid{grid-template-columns:1fr;gap:40px}}

.contact-info h2{
  font-family:var(--display);font-weight:500;
  font-size:clamp(38px,5vw,60px);
  line-height:0.96;letter-spacing:-0.030em;
  margin:0 0 32px;color:var(--bark);text-wrap:balance
}
.contact-info h2 em{font-style:italic;font-weight:400;color:var(--bark-mute)}

.contact-blocks{display:grid;grid-template-columns:1fr 1fr;gap:28px 24px}
@media(max-width:500px){.contact-blocks{grid-template-columns:1fr}}

.ck{
  font-family:var(--mono);font-size:10px;font-weight:500;
  letter-spacing:0.2em;text-transform:uppercase;color:var(--bark-mute);margin-bottom:8px
}
.cv{
  font-family:var(--display);font-size:19px;font-weight:500;
  letter-spacing:-0.012em;color:var(--bark);line-height:1.35
}
.cv a{color:var(--bark);border-bottom:1px solid var(--line-m);padding-bottom:1px}
.cv a:hover{color:var(--amber-deep);border-bottom-color:var(--amber-deep)}
.cv-sm{
  font-family:var(--sans);font-size:14px;font-weight:400;
  letter-spacing:0;line-height:1.6;color:var(--bark-soft)
}

.map-wrap{
  border-radius:var(--r-xl);overflow:hidden;
  height:clamp(300px,48vw,480px);
  border:1px solid var(--line-m);background:var(--cream-warm)
}
.map-wrap iframe{display:block;width:100%;height:100%;border:0}

/* === FOOTER === */
footer{background:var(--dark);border-top:1px solid var(--line-d);padding:64px 0 0}

.footer-top{
  display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:40px;
  padding-bottom:48px;border-bottom:1px solid var(--line-d)
}
@media(max-width:900px){.footer-top{grid-template-columns:1fr 1fr;gap:32px}}
@media(max-width:500px){.footer-top{grid-template-columns:1fr}}

.footer-brand-name{
  font-family:var(--display);font-weight:500;font-size:30px;
  letter-spacing:-0.025em;color:var(--ink);line-height:1;margin-bottom:12px
}
.footer-tag{font-size:14px;line-height:1.6;color:var(--ink-soft);margin:0 0 16px}
.footer-phone{
  font-family:var(--mono);font-size:14px;font-weight:600;
  color:var(--ink-mute);letter-spacing:0;
  transition:color 200ms var(--ease)
}
.footer-phone:hover{color:var(--ink)}

.footer-col h4{
  font-family:var(--mono);font-size:10.5px;font-weight:500;
  letter-spacing:0.2em;text-transform:uppercase;color:var(--ink-mute);margin:0 0 16px
}
.footer-col ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px}
.footer-col a{font-size:14px;color:var(--ink-soft)}
.footer-col a:hover{color:var(--ink)}
.footer-col p{font-size:14px;line-height:1.6;color:var(--ink-soft);margin:0 0 5px}

.footer-bottom{
  padding:20px 0 28px;
  display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap
}
.footer-legal{display:flex;gap:20px;flex-wrap:wrap}
.footer-legal a{
  font-family:var(--mono);font-size:11px;font-weight:500;
  letter-spacing:0.10em;text-transform:uppercase;color:var(--ink-mute)
}
.footer-legal a:hover{color:var(--ink-soft)}
.footer-credit{font-family:var(--mono);font-size:11px;letter-spacing:0.08em;color:var(--ink-mute);margin:0}
.footer-credit a{color:var(--ink-mute);border-bottom:1px solid oklch(0.97 0.016 78 / 0.18);padding-bottom:1px}
.footer-credit a:hover{color:var(--ink-soft)}

.legal-section{border-top:1px solid var(--line-d);padding:36px 0}
.legal-section h3{
  font-family:var(--display);font-size:22px;font-weight:500;
  letter-spacing:-0.015em;color:var(--ink);margin:0 0 12px
}
.legal-section p{font-size:14px;line-height:1.6;color:var(--ink-soft);margin:0 0 8px;max-width:60ch}
`

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled]   = useState(false)
  const today = new Date().getDay()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 56)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const close = () => setMenuOpen(false)

  return (
    <>
      <style>{CSS}</style>

      {/* DEMO BANNER */}
      <div className="demo-banner">
        <span>Demo von PDSTUDIO</span>
        <span className="demo-dot">·</span>
        <span>kantine-leipzig.de</span>
      </div>

      {/* NAV */}
      <nav className={`nav${scrolled ? ' scrolled' : ''}`}>
        <div className="container nav-inner">
          <a href="#top" className="nav-brand" onClick={close}>
            Kantine<span className="nav-brand-sub">Leipzig</span>
          </a>
          <ul className="nav-links">
            <li><a href="#konzept">Konzept</a></li>
            <li><a href="#karte">Karte</a></li>
            <li><a href="#zeiten">Zeiten</a></li>
            <li><a href="#anfahrt">Anfahrt</a></li>
          </ul>
          <div>
            <a href="tel:+493414793500" className="nav-cta-call">Anrufen</a>
          </div>
          <button
            className="nav-toggle"
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Menü schließen' : 'Menü öffnen'}
            aria-expanded={menuOpen}
          >
            {menuOpen
              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M18 6L6 18M6 6l12 12"/></svg>
              : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
            }
          </button>
        </div>
        <div className={`mobile-menu${menuOpen ? ' open' : ''}`}>
          <a href="#konzept" onClick={close}>Konzept</a>
          <a href="#karte"   onClick={close}>Karte</a>
          <a href="#zeiten"  onClick={close}>Zeiten</a>
          <a href="#anfahrt" onClick={close}>Anfahrt</a>
          <a href="tel:+493414793500" className="mobile-cta" onClick={close}>0341 4793500</a>
        </div>
      </nav>

      <main id="top">

        {/* HERO */}
        <section className="hero">
          <div className="hero-bg">
            <img src={IMAGES.hero} alt="Kantine Leipzig — Bistro im Plagwitzer Westwerk" loading="eager" />
          </div>
          <div className="hero-overlay" aria-hidden="true" />
          <div className="container hero-content">
            <div className="hero-eyebrow">
              <span className="eyebrow">Bistro · Café · Plagwitz</span>
              <span className="hero-live">
                <span className="pulse-dot" aria-hidden="true" />
                Mo–Fr ab 12 Uhr
              </span>
            </div>
            <h1>
              Kantine<br />
              <em>Leipzig.</em>
            </h1>
            <p className="hero-sub">
              Regionale Küche, täglich neue Tageskarte.<br />
              Warm, unprätentiös, Westwerk-Nachbarschaft.
            </p>
            <div className="hero-ctas">
              <a href="#karte" className="btn-primary">Tageskarte ansehen</a>
              <a href="tel:+493414793500" className="btn-ghost">
                Anrufen
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 4h4l2 5-3 2a11 11 0 005 5l2-3 5 2v4a2 2 0 01-2 2 16 16 0 01-16-16 2 2 0 012-2z"/></svg>
              </a>
            </div>
          </div>
        </section>

        {/* TRUST STRIP */}
        <section className="trust">
          <div className="container trust-row">
            <div className="trust-item">
              <span className="trust-n">4,6 ★</span>
              <span className="trust-l">aus 420 Google-Bewertungen</span>
            </div>
            <div className="trust-item">
              <span className="trust-n">Tageskarte</span>
              <span className="trust-l">täglich frisch &amp; regional</span>
            </div>
            <div className="trust-item">
              <span className="trust-n">Vegan &amp; Veg.</span>
              <span className="trust-l">immer auf der Karte</span>
            </div>
            <div className="trust-item">
              <span className="trust-n">Hausgemacht</span>
              <span className="trust-l">Limonaden, Kuchen, Quiche</span>
            </div>
          </div>
        </section>

        {/* KONZEPT / ABOUT */}
        <section id="konzept" className="about-section">
          <div className="container about-grid">
            <div className="about-text">
              <span className="eyebrow-dark">Konzept</span>
              <h2>
                Klein, lokal,<br />
                <em>täglich anders.</em>
              </h2>
              <p className="about-lead">
                Die Kantine Leipzig ist kein Restaurant im klassischen Sinne —
                sie ist ein Ort, an dem man gerne isst, ohne viel Aufhebens.
              </p>
              <p className="about-body">
                Im Herzen von Plagwitz, unweit des Westwerks, ist die Kantine
                seit Jahren ein fester Anlaufpunkt für das Viertel. Keine Karte,
                die ewig gleich bleibt: stattdessen eine Tageskarte, die sich
                nach dem richtet, was gerade frisch und regional verfügbar ist.
              </p>
              <p className="about-body">
                Vegetarische und vegane Gerichte stehen immer zur Auswahl —
                nicht als Ausnahme, sondern als Programm. Dazu hausgemachte
                Limonaden, Espresso und täglich frischer Kuchen.
                Der Rest ist Atmosphäre: warmes Licht, ehrliche Küche,
                Karl-Heine-Straße draußen.
              </p>
              <div className="about-facts">
                <div className="about-fact">
                  <div className="af-k">Lage</div>
                  <div className="af-v">Plagwitz, Westwerk-Nähe</div>
                </div>
                <div className="about-fact">
                  <div className="af-k">Küche</div>
                  <div className="af-v">Regional, saisonal</div>
                </div>
                <div className="about-fact">
                  <div className="af-k">Atmosphäre</div>
                  <div className="af-v">Warm, unprätentiös</div>
                </div>
              </div>
            </div>
            <div className="about-images">
              <div className="about-img-main">
                <img src={IMAGES.interior} alt="Innenraum der Kantine Leipzig — warmes Bistro-Licht" loading="lazy" />
              </div>
              <div className="about-img-sec">
                <img src={IMAGES.atmosphere} alt="Café-Atmosphäre in der Kantine Leipzig" loading="lazy" />
              </div>
            </div>
          </div>
        </section>

        {/* KARTE / MENU */}
        <section id="karte" className="menu-section">
          <div className="container">
            <div className="menu-head">
              <div>
                <span className="eyebrow-dark">Speisekarte</span>
                <h2 className="menu-title">
                  Tageskarte —<br />
                  <em>immer frisch.</em>
                </h2>
              </div>
              <div className="menu-demo-note">
                <span className="demo-tag">Demo · Beispielkarte</span>
                <p>Die echte Karte wechselt täglich.<br />Rufen Sie einfach an.</p>
              </div>
            </div>

            <div className="food-strip">
              <img src={IMAGES.food} alt="Frisches Essen aus der Kantine Leipzig" loading="lazy" />
              <div className="food-strip-text">
                <span className="eyebrow">Heute auf der Karte</span>
                <p>Regional. Frisch. Saisonal.</p>
              </div>
            </div>

            <div className="menu-grid">
              {MENU.map(group => (
                <div key={group.category} className="menu-group">
                  <div className="menu-group-head">
                    <h3>{group.category}</h3>
                    <span>{group.note}</span>
                  </div>
                  <div className="menu-items">
                    {group.items.map(item => (
                      <div key={item.name} className="menu-item">
                        <div>
                          <div className="mi-name">
                            {item.name}
                            {item.tag && <span className="mi-tag">{item.tag}</span>}
                          </div>
                          <div className="mi-desc">{item.desc}</div>
                        </div>
                        <div className="mi-price">{item.price}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="menu-fnote">
              <p>
                Tageskarte telefonisch erfragen:{' '}
                <a href="tel:+493414793500">0341 4793500</a>.
                Alle Gerichte nach Verfügbarkeit.
              </p>
            </div>
          </div>
        </section>

        {/* ÖFFNUNGSZEITEN */}
        <section id="zeiten" className="hours-section">
          <div className="container hours-grid">
            <div className="hours-head">
              <span className="eyebrow-dark" style={{color:'var(--ink-mute)'}}>Öffnungszeiten</span>
              <h2>
                Wann wir<br />
                <em>da sind.</em>
              </h2>
              <p className="hours-note">
                Montag bis Freitag ab Mittag,<br />
                Samstag ab 18 Uhr,<br />
                Sonntag geschlossen.
              </p>
              <a href="tel:+493414793500" className="btn-outline-light">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 4h4l2 5-3 2a11 11 0 005 5l2-3 5 2v4a2 2 0 01-2 2 16 16 0 01-16-16 2 2 0 012-2z"/></svg>
                0341 4793500
              </a>
            </div>
            <div className="hours-list">
              {HOURS.map(h => (
                <div
                  key={h.day}
                  className={[
                    'hours-row',
                    h.jsDay === today ? 'today' : '',
                    !h.open ? 'closed' : '',
                  ].filter(Boolean).join(' ')}
                >
                  <span className="hr-day">{h.day}</span>
                  {h.jsDay === today
                    ? <span className="hr-marker">Heute</span>
                    : <span />
                  }
                  <span className="hr-time">{h.time}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ANFAHRT & KONTAKT */}
        <section id="anfahrt" className="contact-section">
          <div className="container contact-grid">
            <div className="contact-info">
              <span className="eyebrow-dark">Anfahrt &amp; Kontakt</span>
              <h2>
                Finden Sie<br />
                <em>uns.</em>
              </h2>
              <div className="contact-blocks">
                <div>
                  <div className="ck">Adresse</div>
                  <div className="cv">
                    Karl-Heine-Str. 50<br />04229 Leipzig<br />(Plagwitz)
                  </div>
                </div>
                <div>
                  <div className="ck">Telefon</div>
                  <div className="cv">
                    <a href="tel:+493414793500">0341 4793500</a>
                  </div>
                </div>
                <div>
                  <div className="ck">Website</div>
                  <div className="cv">
                    <a href="https://kantine-leipzig.de" target="_blank" rel="noopener noreferrer">kantine-leipzig.de</a>
                  </div>
                </div>
                <div>
                  <div className="ck">Anreise</div>
                  <div className="cv cv-sm">
                    Straßenbahn Linie 14, Haltestelle Karl-Heine-Str./Lützner Str.
                    Parkplätze in der Karl-Heine-Straße.
                  </div>
                </div>
              </div>
            </div>
            <div className="map-wrap">
              <iframe
                title="Kantine Leipzig auf Google Maps"
                src="https://www.google.com/maps?q=Karl-Heine-Str.+50,+04229+Leipzig&output=embed"
                width="100%"
                height="100%"
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer>
        <div className="container">
          <div className="footer-top">
            <div>
              <div className="footer-brand-name">Kantine Leipzig</div>
              <p className="footer-tag">
                Bistro &amp; Café<br />
                Karl-Heine-Str. 50, 04229 Leipzig
              </p>
              <a href="tel:+493414793500" className="footer-phone">0341 4793500</a>
            </div>
            <div className="footer-col">
              <h4>Navigation</h4>
              <ul>
                <li><a href="#konzept">Konzept</a></li>
                <li><a href="#karte">Tageskarte</a></li>
                <li><a href="#zeiten">Öffnungszeiten</a></li>
                <li><a href="#anfahrt">Anfahrt</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Öffnungszeiten</h4>
              <p>Mo–Fr: 12:00–22:00</p>
              <p>Samstag: 18:00–22:00</p>
              <p>Sonntag: geschlossen</p>
            </div>
            <div className="footer-col">
              <h4>Kontakt</h4>
              <p><a href="tel:+493414793500">0341 4793500</a></p>
              <p><a href="https://kantine-leipzig.de" target="_blank" rel="noopener noreferrer">kantine-leipzig.de</a></p>
            </div>
          </div>
          <div className="footer-bottom">
            <div className="footer-legal">
              <a href="#impressum">Impressum</a>
              <a href="#datenschutz">Datenschutz</a>
              <a href="#agb">AGB</a>
            </div>
            <p className="footer-credit">
              Erstellt von <a href="https://pdstudio.de" target="_blank" rel="noopener noreferrer">PDSTUDIO</a>
            </p>
          </div>

          <div id="impressum" className="legal-section">
            <h3>Impressum</h3>
            <p>Kantine Leipzig · Karl-Heine-Str. 50 · 04229 Leipzig</p>
            <p>Telefon: 0341 4793500 · Web: kantine-leipzig.de</p>
          </div>
          <div id="datenschutz" className="legal-section">
            <h3>Datenschutz</h3>
            <p>Diese Demo-Website erhebt keine personenbezogenen Daten und setzt keine Cookies ein.</p>
          </div>
          <div id="agb" className="legal-section">
            <h3>AGB</h3>
            <p>Es gelten die gesetzlichen Vorschriften der Bundesrepublik Deutschland.</p>
          </div>
        </div>
      </footer>
    </>
  )
}
