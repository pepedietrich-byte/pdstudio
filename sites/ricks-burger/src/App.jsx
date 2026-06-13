import { useState, useEffect } from 'react';

/* ============================================================
   RICKS BURGER — NEON STYLE
   #0a0a0a black · #ff2e63 magenta · white text
   Barlow Condensed 900 display · JetBrains Mono labels
   ============================================================ */

const CSS = `
:root {
  --black:        #0a0a0a;
  --black-2:      #111111;
  --black-3:      #161616;
  --black-4:      #1c1c1c;
  --magenta:      #ff2e63;
  --magenta-dim:  rgba(255,46,99,0.10);
  --magenta-glow: rgba(255,46,99,0.32);
  --magenta-mid:  rgba(255,46,99,0.55);
  --white:        #ffffff;
  --white-90:     rgba(255,255,255,0.90);
  --white-70:     rgba(255,255,255,0.70);
  --white-50:     rgba(255,255,255,0.50);
  --white-30:     rgba(255,255,255,0.30);
  --white-15:     rgba(255,255,255,0.15);
  --white-08:     rgba(255,255,255,0.08);
  --white-04:     rgba(255,255,255,0.04);
  --white-02:     rgba(255,255,255,0.02);

  --display: 'Barlow Condensed', 'Impact', sans-serif;
  --body:    'Barlow', 'Inter', system-ui, sans-serif;
  --mono:    'JetBrains Mono', ui-monospace, monospace;

  --container: 1360px;
  --ease-snap: cubic-bezier(0.23,1,0.32,1);
  --ease-slide: cubic-bezier(0.32,0.72,0,1);
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
*::selection { background: var(--magenta); color: var(--white); }

html { scroll-behavior: smooth; }
html, body {
  background: var(--black);
  color: var(--white);
  font-family: var(--body);
  font-size: 16px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
img { max-width: 100%; display: block; }
button { font: inherit; cursor: pointer; background: none; border: none; color: inherit; }
input, textarea { font: inherit; color: inherit; background: transparent; border: none; outline: none; }
a { color: inherit; text-decoration: none; }
section[id] { scroll-margin-top: 106px; }

.container {
  width: 100%;
  max-width: var(--container);
  margin: 0 auto;
  padding: 0 clamp(20px, 5vw, 56px);
}

/* ============================================================
   DEMO BANNER
   ============================================================ */

.demo-banner {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--magenta);
  padding: 9px 20px;
  text-align: center;
  font-family: var(--mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--white);
  line-height: 1.4;
}

/* ============================================================
   NAV
   ============================================================ */

.nav {
  position: sticky;
  top: 36px;
  z-index: 90;
  background: rgba(10,10,10,0.94);
  backdrop-filter: blur(24px) saturate(120%);
  -webkit-backdrop-filter: blur(24px) saturate(120%);
  border-bottom: 1px solid var(--white-08);
}

.nav-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  gap: 24px;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--display);
  font-size: 20px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--white);
  flex-shrink: 0;
}
.nav-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--magenta);
  flex-shrink: 0;
}

.nav-links {
  display: flex;
  list-style: none;
  gap: clamp(18px, 2.5vw, 36px);
}
.nav-links a {
  font-family: var(--mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--white-50);
  transition: color 180ms ease;
}
.nav-links a:hover { color: var(--magenta); }

.nav-cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 22px;
  background: var(--magenta);
  color: var(--white);
  font-family: var(--mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%);
  transition: opacity 180ms ease, transform 140ms ease;
  flex-shrink: 0;
}
.nav-cta:hover { opacity: 0.86; color: var(--white); }
.nav-cta:active { transform: scale(0.97); }

.nav-toggle {
  display: none;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  color: var(--white);
  border: 1px solid var(--white-15);
  flex-shrink: 0;
  transition: border-color 180ms ease;
}
.nav-toggle:hover { border-color: var(--magenta); color: var(--magenta); }

@media (max-width: 960px) {
  .nav-links { display: none; }
  .nav-toggle { display: flex; }
}
@media (max-width: 600px) {
  .nav-cta { display: none; }
}

.mobile-menu {
  position: fixed;
  inset: 100px 0 0 0;
  background: var(--black);
  border-top: 1px solid var(--white-08);
  padding: 40px clamp(20px, 5vw, 56px) 40px;
  transform: translateX(100%);
  transition: transform 320ms var(--ease-slide);
  z-index: 89;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}
.mobile-menu.open { transform: translateX(0); }

.mobile-menu a {
  display: block;
  font-family: var(--display);
  font-size: 52px;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--white);
  padding: 14px 0;
  border-bottom: 1px solid var(--white-08);
  transition: color 180ms ease;
  line-height: 1;
}
.mobile-menu a:hover { color: var(--magenta); }

.mobile-cta {
  margin-top: 36px;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  height: 56px;
  padding: 0 28px;
  background: var(--magenta) !important;
  color: var(--white) !important;
  font-family: var(--mono) !important;
  font-size: 11px !important;
  font-weight: 700 !important;
  letter-spacing: 0.18em !important;
  text-transform: uppercase !important;
  border: none !important;
  clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%);
  align-self: flex-start;
}

/* ============================================================
   HERO
   ============================================================ */

.hero {
  position: relative;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}
.hero-bg img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 40%;
  filter: brightness(0.50) saturate(0.75) contrast(1.1);
}
.hero-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg,
      rgba(10,10,10,0.25) 0%,
      rgba(10,10,10,0.0) 25%,
      rgba(10,10,10,0.75) 70%,
      rgba(10,10,10,0.98) 100%
    ),
    linear-gradient(90deg,
      rgba(10,10,10,0.65) 0%,
      rgba(10,10,10,0.0) 55%
    );
}

.hero-status {
  position: absolute;
  top: clamp(24px, 4vw, 48px);
  right: clamp(20px, 5vw, 56px);
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 9px;
  font-family: var(--mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--white-70);
}
.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--magenta);
  flex-shrink: 0;
  animation: pulse-magenta 2s ease infinite;
}
@keyframes pulse-magenta {
  0%   { box-shadow: 0 0 0 0   rgba(255,46,99,0.7); }
  100% { box-shadow: 0 0 0 9px rgba(255,46,99,0);   }
}

.hero-content {
  position: relative;
  z-index: 2;
  padding-bottom: clamp(56px, 8vw, 100px);
  padding-top: 80px;
}

.hero-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  font-family: var(--mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--magenta);
  margin-bottom: 22px;
}
.hero-eyebrow::before {
  content: '';
  display: block;
  width: 36px;
  height: 1px;
  background: var(--magenta);
  flex-shrink: 0;
}

.hero h1 {
  font-family: var(--display);
  font-size: clamp(76px, 15vw, 220px);
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: -0.01em;
  line-height: 0.86;
  color: var(--white);
  margin-bottom: 28px;
  animation: glitch-enter 0.75s var(--ease-snap) forwards;
}
.hero h1 .accent {
  display: block;
  color: var(--magenta);
  -webkit-text-stroke: 0px;
}

@keyframes glitch-enter {
  0%   { opacity: 0; transform: translateX(-10px); filter: blur(3px); }
  55%  { opacity: 1; transform: translateX(3px);  filter: blur(0);   }
  75%  { transform: translateX(-1px); }
  100% { transform: translateX(0); }
}

.hero-sub {
  font-size: clamp(15px, 1.6vw, 19px);
  color: var(--white-70);
  max-width: 44ch;
  line-height: 1.6;
  margin-bottom: 36px;
  font-weight: 400;
}

.hero-ctas {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 54px;
  padding: 0 28px;
  background: var(--magenta);
  color: var(--white);
  font-family: var(--mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%);
  transition: opacity 180ms ease, transform 140ms ease;
  cursor: pointer;
}
.btn-primary:hover { opacity: 0.86; color: var(--white); }
.btn-primary:active { transform: scale(0.97); }

.btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 54px;
  padding: 0 28px;
  background: transparent;
  color: var(--white);
  font-family: var(--mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  border: 1px solid var(--white-30);
  transition: border-color 200ms ease, color 200ms ease, transform 140ms ease;
  cursor: pointer;
}
.btn-outline:hover { border-color: var(--magenta); color: var(--magenta); }
.btn-outline:active { transform: scale(0.97); }

.hero-stats {
  display: flex;
  gap: clamp(28px, 4.5vw, 64px);
  flex-wrap: wrap;
  margin-top: 52px;
  padding-top: 32px;
  border-top: 1px solid var(--white-08);
}
.hero-stat-k {
  font-family: var(--mono);
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--white-40);
  margin-bottom: 6px;
}
.hero-stat-v {
  font-family: var(--display);
  font-size: clamp(24px, 3vw, 36px);
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  line-height: 1;
  color: var(--white);
}
.hero-stat-v em { color: var(--magenta); font-style: normal; }

/* ============================================================
   MARQUEE
   ============================================================ */

.marquee-strip {
  background: var(--magenta);
  overflow: hidden;
  border-top: none;
  border-bottom: none;
  padding: 13px 0;
}
.marquee-track {
  display: flex;
  white-space: nowrap;
  animation: marquee-scroll 20s linear infinite;
  will-change: transform;
}
.marquee-item {
  font-family: var(--mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--white);
  padding: 0 30px;
  flex-shrink: 0;
  position: relative;
}
.marquee-item::after {
  content: '·';
  position: absolute;
  right: 0;
  top: 50%;
  transform: translate(50%, -50%);
  color: rgba(255,255,255,0.4);
}
@keyframes marquee-scroll {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
@media (prefers-reduced-motion: reduce) {
  .marquee-track { animation: none; }
}

/* ============================================================
   TRUST STRIP
   ============================================================ */

.trust {
  padding: 52px 0;
  background: var(--black-2);
  border-bottom: 1px solid var(--white-08);
}
.trust-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}
@media (max-width: 720px) {
  .trust-row { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 440px) {
  .trust-row { grid-template-columns: 1fr 1fr; gap: 0; }
}

.trust-item {
  padding: 0 clamp(20px, 3vw, 40px);
  border-left: 1px solid var(--white-08);
}
.trust-item:first-child { border-left: none; padding-left: 0; }
@media (max-width: 720px) {
  .trust-item { padding: 24px 0; border-left: none; border-top: 1px solid var(--white-08); }
  .trust-item:first-child,
  .trust-item:nth-child(2) { border-top: none; }
  .trust-item:nth-child(even) { padding-left: 24px; border-left: 1px solid var(--white-08); }
}

.trust-n {
  font-family: var(--display);
  font-size: clamp(36px, 5vw, 60px);
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  line-height: 1;
  color: var(--white);
  margin-bottom: 6px;
}
.trust-n span { color: var(--magenta); }
.trust-l {
  font-family: var(--mono);
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--white-40);
}

/* ============================================================
   ABOUT / KONZEPT
   ============================================================ */

.about {
  padding: clamp(80px, 11vw, 160px) 0;
  background: var(--black);
}

.about-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(48px, 7vw, 112px);
  align-items: center;
}
@media (max-width: 900px) {
  .about-grid { grid-template-columns: 1fr; gap: 48px; }
}

/* Image column */
.about-images {
  position: relative;
  padding-bottom: 72px;
  padding-right: 60px;
}
@media (max-width: 600px) {
  .about-images { padding-bottom: 56px; padding-right: 48px; }
}

.about-sticker {
  position: absolute;
  top: 24px;
  left: 0;
  z-index: 4;
  background: var(--magenta);
  color: var(--white);
  font-family: var(--mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  padding: 7px 14px;
  transform: rotate(-1.5deg);
}

.about-img-main {
  width: 100%;
  aspect-ratio: 4/5;
  overflow: hidden;
  position: relative;
}
.about-img-main img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: contrast(1.04) saturate(0.88);
  transition: transform 700ms var(--ease-snap);
  display: block;
}
.about-img-main:hover img { transform: scale(1.04); }

.about-img-crowd {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 48%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border: 3px solid var(--black);
  z-index: 3;
}
.about-img-crowd img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: contrast(1.06) saturate(0.82);
  display: block;
}

.about-img-line {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 60px;
  height: 1px;
  background: var(--magenta);
  opacity: 0.4;
}

/* Text column */
.about-text {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.section-label {
  display: inline-flex;
  align-items: center;
  gap: 13px;
  font-family: var(--mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--magenta);
}
.section-label::before {
  content: '';
  display: block;
  width: 28px;
  height: 1px;
  background: var(--magenta);
  flex-shrink: 0;
}

.about-h2 {
  font-family: var(--display);
  font-size: clamp(52px, 7.5vw, 100px);
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: -0.01em;
  line-height: 0.88;
  color: var(--white);
}
.about-h2 .accent { color: var(--magenta); }

.about-body p {
  font-size: clamp(15px, 1.3vw, 17px);
  line-height: 1.65;
  color: var(--white-70);
  max-width: 50ch;
  font-weight: 400;
}
.about-body p + p { margin-top: 16px; }
.about-body p:first-child {
  color: var(--white-90);
  font-size: clamp(16px, 1.4vw, 18px);
}

.about-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.tag-pill {
  display: inline-flex;
  padding: 5px 14px;
  border: 1px solid var(--white-15);
  font-family: var(--mono);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--white-50);
  clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%);
  transition: border-color 200ms ease, color 200ms ease;
}
.tag-pill:hover { border-color: var(--magenta-glow); color: var(--magenta); }

/* ============================================================
   KARTE / MENU
   ============================================================ */

.menu-section {
  padding: clamp(80px, 11vw, 160px) 0;
  background: var(--black-2);
  border-top: 1px solid var(--white-08);
}

.menu-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: clamp(48px, 6vw, 80px);
  flex-wrap: wrap;
}

.menu-h2 {
  font-family: var(--display);
  font-size: clamp(56px, 10vw, 136px);
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: -0.01em;
  line-height: 0.86;
  color: var(--white);
  margin-top: 14px;
}
.menu-h2 .accent { color: var(--magenta); }

/* Signature feature block */
.menu-featured {
  display: grid;
  grid-template-columns: 5fr 7fr;
  margin-bottom: clamp(48px, 7vw, 80px);
  border: 1px solid var(--white-08);
  overflow: hidden;
}
@media (max-width: 800px) {
  .menu-featured { grid-template-columns: 1fr; }
}

.feat-img {
  position: relative;
  aspect-ratio: 4/3;
  overflow: hidden;
  background: var(--black-3);
}
@media (max-width: 800px) {
  .feat-img { aspect-ratio: 16/9; }
}
.feat-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  filter: contrast(1.04) saturate(1.0);
  display: block;
  transition: transform 700ms var(--ease-snap);
}
.menu-featured:hover .feat-img img { transform: scale(1.04); }

.feat-badge {
  position: absolute;
  top: 16px;
  left: 16px;
  background: var(--magenta);
  color: var(--white);
  font-family: var(--mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  padding: 6px 12px;
  z-index: 2;
}

.feat-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 22px;
  padding: clamp(32px, 4vw, 56px);
  background: var(--black-3);
}

.feat-h3 {
  font-family: var(--display);
  font-size: clamp(40px, 6vw, 76px);
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: -0.01em;
  line-height: 0.88;
  color: var(--white);
}

.feat-desc {
  font-size: 15px;
  line-height: 1.65;
  color: var(--white-60);
  max-width: 44ch;
}

.feat-price {
  font-family: var(--mono);
  font-size: 32px;
  font-weight: 700;
  color: var(--magenta);
  letter-spacing: -0.01em;
}

/* Menu grid */
.menu-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-top: 1px solid var(--white-08);
}
@media (max-width: 640px) {
  .menu-grid { grid-template-columns: 1fr; }
}

.menu-item {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 16px;
  align-items: start;
  padding: 24px 0;
  border-bottom: 1px solid var(--white-04);
  transition: background 200ms ease;
}
.menu-item:hover { background: var(--white-02); }

.menu-item:nth-child(odd)  { padding-right: clamp(24px, 4vw, 60px); }
.menu-item:nth-child(even) {
  padding-left: clamp(24px, 4vw, 60px);
  border-left: 1px solid var(--white-08);
}
@media (max-width: 640px) {
  .menu-item:nth-child(odd),
  .menu-item:nth-child(even) { padding: 20px 0; border-left: none; }
}

.item-name {
  font-family: var(--display);
  font-size: clamp(18px, 2vw, 24px);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--white);
  margin-bottom: 5px;
  line-height: 1.1;
}
.item-badge {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 8px;
  background: var(--magenta-dim);
  border: 1px solid var(--magenta-glow);
  font-family: var(--mono);
  font-size: 8px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--magenta);
  vertical-align: middle;
}
.item-desc {
  font-size: 13px;
  color: var(--white-40);
  line-height: 1.55;
  max-width: 36ch;
  font-weight: 400;
}
.item-price {
  font-family: var(--mono);
  font-size: 14px;
  font-weight: 700;
  color: var(--white);
  white-space: nowrap;
  letter-spacing: -0.01em;
  padding-top: 2px;
}

/* ============================================================
   ÖFFNUNGSZEITEN
   ============================================================ */

.hours-section {
  padding: clamp(80px, 11vw, 160px) 0;
  background: var(--black);
  border-top: 1px solid var(--white-08);
}

.hours-grid {
  display: grid;
  grid-template-columns: 4fr 8fr;
  gap: clamp(48px, 7vw, 112px);
  align-items: start;
}
@media (max-width: 900px) {
  .hours-grid { grid-template-columns: 1fr; gap: 40px; }
}

.hours-h2 {
  font-family: var(--display);
  font-size: clamp(48px, 8vw, 108px);
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: -0.01em;
  line-height: 0.86;
  color: var(--white);
  margin: 16px 0 24px;
}
.hours-h2 .accent { display: block; color: var(--magenta); }

.hours-sub {
  font-size: 15px;
  color: var(--white-50);
  line-height: 1.6;
  max-width: 30ch;
}

.hours-list {
  border-top: 1px solid var(--white-08);
}

.hours-row {
  display: grid;
  grid-template-columns: 140px 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 16px 16px;
  border-bottom: 1px solid var(--white-04);
  transition: background 200ms ease;
}
.hours-row:hover { background: var(--white-02); }
.hours-row.today {
  background: var(--magenta-dim);
  border-color: var(--magenta-glow);
  border-top: 1px solid var(--magenta-glow);
  margin-top: -1px;
  padding: 18px 16px;
}

.h-day {
  font-family: var(--display);
  font-size: 17px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--white-70);
}
.hours-row.today .h-day { color: var(--magenta); }

.h-badge {
  font-family: var(--mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--magenta);
  background: var(--magenta-dim);
  padding: 3px 9px;
  border: 1px solid var(--magenta-glow);
}

.h-time {
  font-family: var(--mono);
  font-size: 14px;
  font-weight: 600;
  color: var(--white-70);
  letter-spacing: -0.01em;
  white-space: nowrap;
}
.hours-row.today .h-time { color: var(--magenta); }

/* ============================================================
   ORDER / KONTAKT
   ============================================================ */

.order-section {
  padding: clamp(80px, 11vw, 160px) 0;
  background: var(--black-2);
  border-top: 1px solid var(--white-08);
}

.order-grid {
  display: grid;
  grid-template-columns: 5fr 7fr;
  gap: clamp(56px, 8vw, 128px);
  align-items: start;
}
@media (max-width: 900px) {
  .order-grid { grid-template-columns: 1fr; gap: 48px; }
}

.order-h2 {
  font-family: var(--display);
  font-size: clamp(52px, 8vw, 108px);
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: -0.01em;
  line-height: 0.86;
  color: var(--white);
  margin: 16px 0 20px;
}
.order-h2 .accent { display: block; color: var(--magenta); }

.order-sub {
  font-size: 15px;
  color: var(--white-60);
  line-height: 1.65;
  max-width: 42ch;
  margin-bottom: 32px;
}

.lieferando-btn {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 22px 24px;
  background: var(--black-3);
  border: 1px solid var(--white-08);
  transition: border-color 200ms ease, background 200ms ease;
  cursor: pointer;
}
.lieferando-btn:hover {
  border-color: var(--magenta-glow);
  background: var(--magenta-dim);
}
.lieferando-platform {
  font-family: var(--mono);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--white-40);
  margin-bottom: 5px;
}
.lieferando-name {
  font-family: var(--display);
  font-size: 28px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--white);
  line-height: 1;
}
.lieferando-arrow {
  margin-left: auto;
  color: var(--magenta);
  flex-shrink: 0;
  transition: transform 200ms ease;
}
.lieferando-btn:hover .lieferando-arrow { transform: translateX(4px); }

/* Contact form */
.contact-form {
  border: 1px solid var(--white-08);
  background: var(--black-3);
  overflow: hidden;
}

.form-header {
  padding: 18px 24px;
  border-bottom: 1px solid var(--white-08);
  font-family: var(--mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--magenta);
  background: var(--magenta-dim);
}

.form-field {
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid var(--white-04);
  transition: background 200ms ease;
}
.form-field:focus-within {
  background: rgba(255,46,99,0.04);
  border-bottom-color: var(--magenta-glow);
}
.form-field label {
  font-family: var(--mono);
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--white-40);
  padding: 14px 24px 4px;
}
.form-field input,
.form-field textarea {
  padding: 4px 24px 14px;
  font-size: 15px;
  color: var(--white);
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  font-family: var(--body);
}
.form-field input::placeholder,
.form-field textarea::placeholder { color: var(--white-20); }

.form-submit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 20px 24px;
  background: var(--magenta);
  color: var(--white);
  font-family: var(--mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  border: none;
  cursor: pointer;
  transition: opacity 180ms ease, transform 140ms ease;
}
.form-submit:hover { opacity: 0.86; }
.form-submit:active { transform: scale(0.99); }

.form-success {
  padding: 48px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  text-align: center;
}
.success-icon {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--magenta-dim);
  border: 1px solid var(--magenta-glow);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--magenta);
}
.form-success p {
  font-family: var(--mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--magenta);
}

/* ============================================================
   ANFAHRT
   ============================================================ */

.anfahrt {
  padding: clamp(80px, 11vw, 160px) 0;
  background: var(--black);
  border-top: 1px solid var(--white-08);
}

.anfahrt-inner {
  display: grid;
  grid-template-columns: 4fr 8fr;
  gap: clamp(48px, 7vw, 96px);
  align-items: start;
}
@media (max-width: 900px) {
  .anfahrt-inner { grid-template-columns: 1fr; gap: 44px; }
}

.anfahrt-h2 {
  font-family: var(--display);
  font-size: clamp(44px, 7vw, 96px);
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: -0.01em;
  line-height: 0.88;
  color: var(--white);
  margin: 16px 0 36px;
}

.anfahrt-info {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.info-block .ib-key {
  font-family: var(--mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--magenta);
  margin-bottom: 8px;
}
.info-block .ib-val {
  font-family: var(--display);
  font-size: 22px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--white);
  line-height: 1.2;
}

.anfahrt-right {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-frame {
  position: relative;
  aspect-ratio: 16/7;
  overflow: hidden;
  border: 1px solid var(--white-08);
  background: var(--black-3);
}
.detail-frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 60%;
  filter: contrast(1.05) saturate(0.85) brightness(0.92);
  display: block;
  transition: transform 600ms var(--ease-snap);
}
.detail-frame:hover img { transform: scale(1.03); }

.detail-label {
  position: absolute;
  bottom: 14px;
  left: 14px;
  background: var(--magenta);
  color: var(--white);
  font-family: var(--mono);
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  padding: 5px 11px;
  z-index: 2;
}

.map-frame {
  position: relative;
  aspect-ratio: 16/10;
  overflow: hidden;
  border: 1px solid var(--white-08);
  background: var(--black-3);
}
.map-frame iframe {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
  filter: grayscale(0.2) contrast(0.95);
}

/* ============================================================
   FOOTER
   ============================================================ */

footer {
  background: var(--black-2);
  border-top: 1px solid var(--white-08);
  padding: clamp(64px, 9vw, 104px) 0 0;
}

.footer-top {
  display: grid;
  grid-template-columns: 3fr 1fr 1fr 1fr;
  gap: 40px;
  padding-bottom: 56px;
  border-bottom: 1px solid var(--white-08);
}
@media (max-width: 900px) {
  .footer-top { grid-template-columns: 1fr 1fr; gap: 36px; }
}
@media (max-width: 500px) {
  .footer-top { grid-template-columns: 1fr; }
}

.footer-brand-name {
  font-family: var(--display);
  font-size: 44px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--white);
  line-height: 1;
  margin-bottom: 14px;
}
.footer-brand-name span { color: var(--magenta); }

.footer-tag {
  font-size: 14px;
  color: var(--white-40);
  line-height: 1.6;
  max-width: 36ch;
  margin-bottom: 24px;
}

.footer-pdstudio {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 8px 16px;
  border: 1px solid var(--white-08);
  font-family: var(--mono);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--white-40);
  transition: border-color 200ms ease, color 200ms ease;
}
.footer-pdstudio:hover { border-color: var(--magenta-glow); color: var(--magenta); }
.footer-pdstudio .pink { color: var(--magenta); }

.footer-col h4 {
  font-family: var(--mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--white-30);
  margin-bottom: 18px;
}
.footer-col ul { list-style: none; display: flex; flex-direction: column; gap: 11px; }
.footer-col a { font-size: 13px; color: var(--white-50); transition: color 180ms ease; }
.footer-col a:hover { color: var(--white); }
.footer-col p { font-size: 13px; color: var(--white-50); line-height: 1.6; }
.footer-col p + p { margin-top: 8px; }

.footer-bottom {
  padding: 22px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.footer-bottom p {
  font-family: var(--mono);
  font-size: 9px;
  letter-spacing: 0.14em;
  color: var(--white-20);
}

/* ============================================================
   REVEALS
   ============================================================ */

.reveal {
  opacity: 0;
  transform: translateY(22px);
  transition: opacity 640ms var(--ease-snap), transform 640ms var(--ease-snap);
}
.reveal.in {
  opacity: 1;
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  .reveal { opacity: 1; transform: none; transition: none; }
  .marquee-track { animation: none; }
  .hero h1 { animation: none; }
  .pulse-dot { animation: none; }
}
`;

const IMGS = {
  hero_energy:      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1920&q=85&auto=format&fit=crop',
  street_exterior:  'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200&q=80&auto=format&fit=crop',
  signature_product:'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=900&q=80&auto=format&fit=crop',
  crowd_vibe:       'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80&auto=format&fit=crop',
  detail_shot:      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=900&q=80&auto=format&fit=crop',
};

const DAYS = [
  { name: 'Montag',     day: 1, time: '12:00 — 23:00' },
  { name: 'Dienstag',   day: 2, time: '12:00 — 23:00' },
  { name: 'Mittwoch',   day: 3, time: '12:00 — 23:00' },
  { name: 'Donnerstag', day: 4, time: '12:00 — 23:00' },
  { name: 'Freitag',    day: 5, time: '12:00 — 23:00' },
  { name: 'Samstag',    day: 6, time: '12:00 — 23:00' },
  { name: 'Sonntag',    day: 0, time: '12:00 — 23:00' },
];

const MENU_ITEMS = [
  { name: 'Truffle Fries',    desc: 'Knusprige Frites, Trüffelöl, Parmesan, frische Kräuter.', price: '6,90 €', badge: null },
  { name: 'Classic Ricks',    desc: 'Single Smash, Cheddar, karamellisierte Zwiebeln, Brioche.', price: '10,90 €', badge: null },
  { name: 'BBQ Ranch Stack',  desc: 'Double Smash, BBQ-Glaze, Ranch, knusprige Onions.', price: '14,50 €', badge: null },
  { name: 'Craft Beer',       desc: 'Wechselnde Selektion aus lokalen Brauereien Leipzig.', price: 'ab 4,50 €', badge: 'LOKAL' },
  { name: 'Chicken Smash',    desc: 'Knuspriges Chicken-Patty, Coleslaw, Jalapeño-Mayo, Pickles.', price: '11,90 €', badge: null },
  { name: 'Vanilla Milkshake',desc: 'Handgemacht, echte Vanille. Thick & creamy.', price: '5,90 €', badge: null },
  { name: 'Loaded Fries',     desc: 'Frites, Pulled Beef, geschmolzener Käse, Pickled Jalapeños.', price: '8,90 €', badge: null },
];

const MARQUEE = ['SMASHBURGER', 'CRAFT BEER', 'REUDNITZ', 'LEIPZIG', '4.5 ★', 'MO–SO 12–23 UHR', 'HANDGEMACHT', 'TRUFFLE FRIES', 'MILKSHAKE'];

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [todayDay, setTodayDay] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  useEffect(() => {
    setTodayDay(new Date().getDay());
  }, []);

  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); }),
      { threshold: 0.08, rootMargin: '0px 0px -32px 0px' }
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const close = () => setMenuOpen(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  const marqueeItems = [...MARQUEE, ...MARQUEE, ...MARQUEE, ...MARQUEE];

  return (
    <>
      <style>{CSS}</style>

      {/* ── DEMO BANNER ── */}
      <div className="demo-banner" role="banner">
        Demo von PDSTUDIO&nbsp;&nbsp;·&nbsp;&nbsp;Konzept-Vorschlag für Ricks Burger
      </div>

      {/* ── NAV ── */}
      <nav className="nav" aria-label="Hauptnavigation">
        <div className="container nav-inner">
          <a href="#top" className="nav-brand" onClick={close}>
            <span className="nav-dot" aria-hidden="true" />
            Ricks Burger
          </a>

          <ul className="nav-links" role="list">
            <li><a href="#konzept" onClick={close}>Konzept</a></li>
            <li><a href="#karte"   onClick={close}>Karte</a></li>
            <li><a href="#zeiten"  onClick={close}>Zeiten</a></li>
            <li><a href="#bestellen" onClick={close}>Bestellen</a></li>
            <li><a href="#anfahrt" onClick={close}>Anfahrt</a></li>
          </ul>

          <a href="#bestellen" className="nav-cta">Online bestellen</a>

          <button
            className="nav-toggle"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Menü öffnen"
            aria-expanded={menuOpen}
          >
            {menuOpen
              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 6L6 18M6 6l12 12"/></svg>
              : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
            }
          </button>
        </div>

        <div className={`mobile-menu${menuOpen ? ' open' : ''}`} aria-hidden={!menuOpen}>
          <a href="#konzept"   onClick={close}>Konzept</a>
          <a href="#karte"     onClick={close}>Karte</a>
          <a href="#zeiten"    onClick={close}>Zeiten</a>
          <a href="#bestellen" onClick={close}>Bestellen</a>
          <a href="#anfahrt"   onClick={close}>Anfahrt</a>
          <a href="#bestellen" className="mobile-cta" onClick={close}>
            Online bestellen
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </a>
        </div>
      </nav>

      <main id="top">

        {/* ── HERO ── */}
        <section className="hero" aria-label="Ricks Burger Leipzig">
          <div className="hero-bg" aria-hidden="true">
            <img
              src={IMGS.hero_energy}
              alt=""
              loading="eager"
              fetchpriority="high"
            />
          </div>

          <div className="hero-status" aria-label="Heute geöffnet">
            <span className="pulse-dot" aria-hidden="true" />
            Heute geöffnet
          </div>

          <div className="container hero-content">
            <div className="hero-eyebrow" aria-hidden="true">
              Reudnitz · Leipzig · Smashburger
            </div>

            <h1>
              Ricks
              <span className="accent">Burger.</span>
            </h1>

            <p className="hero-sub">
              Loud Urban Burger-Joint. Echte Smashburger, lokales Craft Beer,
              junge Crowd. Reudnitz at its best.
            </p>

            <div className="hero-ctas">
              <a href="#bestellen" className="btn-primary">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                Online bestellen
              </a>
              <a href="#karte" className="btn-outline">Zur Karte</a>
            </div>

            <div className="hero-stats" aria-label="Kennzahlen">
              <div>
                <div className="hero-stat-k">Bewertung</div>
                <div className="hero-stat-v">4,5<em>★</em></div>
              </div>
              <div>
                <div className="hero-stat-k">Reviews</div>
                <div className="hero-stat-v">350<em>+</em></div>
              </div>
              <div>
                <div className="hero-stat-k">Täglich</div>
                <div className="hero-stat-v">12<em>–23h</em></div>
              </div>
              <div>
                <div className="hero-stat-k">Preis</div>
                <div className="hero-stat-v">€<em>€</em></div>
              </div>
            </div>
          </div>
        </section>

        {/* ── MARQUEE ── */}
        <div className="marquee-strip" aria-hidden="true">
          <div className="marquee-track">
            {marqueeItems.map((item, i) => (
              <span key={i} className="marquee-item">{item}</span>
            ))}
          </div>
        </div>

        {/* ── TRUST STRIP ── */}
        <section className="trust" aria-label="Fakten">
          <div className="container">
            <div className="trust-row">
              <div className="trust-item">
                <div className="trust-n">4,5<span>★</span></div>
                <div className="trust-l">Google Bewertung</div>
              </div>
              <div className="trust-item">
                <div className="trust-n">350<span>+</span></div>
                <div className="trust-l">Reviews</div>
              </div>
              <div className="trust-item">
                <div className="trust-n">7</div>
                <div className="trust-l">Tage geöffnet</div>
              </div>
              <div className="trust-item">
                <div className="trust-n">€<span>€</span></div>
                <div className="trust-l">Faire Preise</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── KONZEPT ── */}
        <section id="konzept" className="about" aria-labelledby="konzept-heading">
          <div className="container">
            <div className="about-grid">

              <div className="about-images reveal">
                <div className="about-sticker" aria-hidden="true">Reudnitz · Leipzig</div>
                <div className="about-img-main">
                  <img
                    src={IMGS.street_exterior}
                    alt="Ricks Burger — Außenansicht, Reudnitz Leipzig"
                    loading="lazy"
                  />
                </div>
                <div className="about-img-crowd">
                  <img
                    src={IMGS.crowd_vibe}
                    alt="Ricks Burger — Energie und Gäste im Restaurant"
                    loading="lazy"
                  />
                </div>
                <div className="about-img-line" aria-hidden="true" />
              </div>

              <div className="about-text">
                <div className="section-label" aria-hidden="true">Konzept</div>
                <h2 id="konzept-heading" className="about-h2 reveal">
                  Laut.<br />
                  Urban.<br />
                  <span className="accent">Burger.</span>
                </h2>
                <div className="about-body">
                  <p>
                    Ricks Burger steht für echte Smashburger — dünn gepresst, hard seared,
                    mit perfektem Crust. Kein Schnickschnack, dafür maximale Intensität auf
                    jeder Ebene.
                  </p>
                  <p>
                    Dazu: lokales Craft Beer von Leipziger Brauereien, handgemachte Milkshakes
                    und knusprige Truffle Fries. Die Atmosphäre ist laut, urban, ansteckend gut.
                    Jung, hungrig, ehrlich — Reudnitz at its best.
                  </p>
                </div>
                <div className="about-tags" aria-label="Tags">
                  {['Smashburger', 'Craft Beer', 'Handgemacht', 'Lokal', 'Urban'].map(t => (
                    <span key={t} className="tag-pill">{t}</span>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── KARTE ── */}
        <section id="karte" className="menu-section" aria-labelledby="karte-heading">
          <div className="container">

            <div className="menu-head">
              <div>
                <div className="section-label" aria-hidden="true">Die Karte</div>
                <h2 id="karte-heading" className="menu-h2 reveal">
                  Auswahl<br />
                  <span className="accent">aus der Karte.</span>
                </h2>
              </div>
              <a href="#bestellen" className="btn-outline" style={{ alignSelf: 'flex-end' }}>
                Jetzt bestellen
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </a>
            </div>

            {/* Signature feature */}
            <div className="menu-featured reveal">
              <div className="feat-img">
                <img
                  src={IMGS.signature_product}
                  alt="Smashburger Double — Signature-Burger bei Ricks Burger Leipzig"
                  loading="lazy"
                />
                <div className="feat-badge" aria-hidden="true">Signature</div>
              </div>
              <div className="feat-content">
                <div className="section-label" aria-hidden="true">House Signature</div>
                <h3 className="feat-h3">
                  Smashburger<br />Double
                </h3>
                <p className="feat-desc">
                  Zwei dünn gepresste Patties, doppelter American Cheese, hausgemachte
                  Sonder-Sauce, Pickles, karamellisierte Zwiebeln im Brioche. Der Burger,
                  für den man extra nach Reudnitz fährt.
                </p>
                <div className="feat-price">13,90 €</div>
                <a href="#bestellen" className="btn-primary" style={{ alignSelf: 'flex-start' }}>
                  Jetzt bestellen
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                </a>
              </div>
            </div>

            {/* Menu grid */}
            <div className="menu-grid" role="list" aria-label="Weitere Gerichte">
              {MENU_ITEMS.map((item, i) => (
                <div key={i} className="menu-item" role="listitem">
                  <div>
                    <div className="item-name">
                      {item.name}
                      {item.badge && <span className="item-badge">{item.badge}</span>}
                    </div>
                    <div className="item-desc">{item.desc}</div>
                  </div>
                  <div className="item-price">{item.price}</div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ── ÖFFNUNGSZEITEN ── */}
        <section id="zeiten" className="hours-section" aria-labelledby="zeiten-heading">
          <div className="container">
            <div className="hours-grid">

              <div>
                <div className="section-label" aria-hidden="true">Öffnungszeiten</div>
                <h2 id="zeiten-heading" className="hours-h2 reveal">
                  Täglich<br />
                  <span className="accent">geöffnet.</span>
                </h2>
                <p className="hours-sub">
                  Mo bis So ab 12 Uhr.
                  Kein Ruhetag — kein Hunger bleibt ungestillt.
                </p>
              </div>

              <div className="hours-list" role="list" aria-label="Öffnungszeiten nach Tag">
                {DAYS.map(({ name, day, time }) => {
                  const isToday = todayDay === day;
                  return (
                    <div
                      key={day}
                      className={`hours-row${isToday ? ' today' : ''}`}
                      role="listitem"
                      aria-current={isToday ? 'true' : undefined}
                    >
                      <span className="h-day">{name}</span>
                      <span>{isToday && <span className="h-badge" aria-label="Heute">Heute</span>}</span>
                      <span className="h-time">{time}</span>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        </section>

        {/* ── ORDER / KONTAKT ── */}
        <section id="bestellen" className="order-section" aria-labelledby="bestellen-heading">
          <div className="container">
            <div className="order-grid">

              <div>
                <div className="section-label" aria-hidden="true">Bestellen & Kontakt</div>
                <h2 id="bestellen-heading" className="order-h2 reveal">
                  Online<br />
                  <span className="accent">bestellen.</span>
                </h2>
                <p className="order-sub">
                  Ricks Burger ist auf Lieferando — oder schreib uns direkt.
                  Keine Telefonnummer nötig, einfach bestellen.
                </p>
                <a
                  href="https://www.lieferando.de/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lieferando-btn"
                  aria-label="Auf Lieferando bestellen"
                >
                  <div>
                    <div className="lieferando-platform">Lieferservice</div>
                    <div className="lieferando-name">Lieferando</div>
                  </div>
                  <div className="lieferando-arrow" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                  </div>
                </a>
              </div>

              <div>
                <div className="contact-form" role="form" aria-label="Kontaktformular">
                  <div className="form-header">Direkt schreiben</div>
                  {sent ? (
                    <div className="form-success">
                      <div className="success-icon" aria-hidden="true">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      <p>Nachricht gesendet. Wir melden uns bald.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} noValidate>
                      <div className="form-field">
                        <label htmlFor="cf-name">Name</label>
                        <input
                          id="cf-name"
                          type="text"
                          placeholder="Dein Name"
                          required
                          autoComplete="name"
                          value={form.name}
                          onChange={e => setForm(s => ({ ...s, name: e.target.value }))}
                        />
                      </div>
                      <div className="form-field">
                        <label htmlFor="cf-email">E-Mail</label>
                        <input
                          id="cf-email"
                          type="email"
                          placeholder="deine@mail.de"
                          required
                          autoComplete="email"
                          value={form.email}
                          onChange={e => setForm(s => ({ ...s, email: e.target.value }))}
                        />
                      </div>
                      <div className="form-field">
                        <label htmlFor="cf-message">Nachricht</label>
                        <textarea
                          id="cf-message"
                          rows={4}
                          placeholder="Deine Nachricht..."
                          required
                          value={form.message}
                          onChange={e => setForm(s => ({ ...s, message: e.target.value }))}
                        />
                      </div>
                      <button type="submit" className="form-submit">
                        Nachricht senden
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                      </button>
                    </form>
                  )}
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── ANFAHRT ── */}
        <section id="anfahrt" className="anfahrt" aria-labelledby="anfahrt-heading">
          <div className="container">
            <div className="section-label" aria-hidden="true">Anfahrt</div>
            <div className="anfahrt-inner">

              <div>
                <h2 id="anfahrt-heading" className="anfahrt-h2 reveal">Wo wir sind.</h2>
                <div className="anfahrt-info">
                  <div className="info-block">
                    <div className="ib-key">Adresse</div>
                    <div className="ib-val">Reudnitz<br />04317 Leipzig</div>
                  </div>
                  <div className="info-block">
                    <div className="ib-key">Öffnungszeiten</div>
                    <div className="ib-val">Mo — So<br />12:00 — 23:00</div>
                  </div>
                  <div className="info-block">
                    <div className="ib-key">Bestellen</div>
                    <div className="ib-val">Lieferando<br />oder vor Ort</div>
                  </div>
                </div>
              </div>

              <div className="anfahrt-right">
                <div className="detail-frame">
                  <img
                    src={IMGS.detail_shot}
                    alt="Frische Zutaten — Handgemacht täglich bei Ricks Burger"
                    loading="lazy"
                  />
                  <div className="detail-label" aria-hidden="true">Handgemacht · Täglich frisch</div>
                </div>
                <div className="map-frame">
                  <iframe
                    title="Ricks Burger Standort Reudnitz Leipzig"
                    src="https://maps.google.com/maps?q=Reudnitz,+04317+Leipzig,+Deutschland&output=embed&z=15"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>

            </div>
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer>
        <div className="container">
          <div className="footer-top">

            <div>
              <div className="footer-brand-name">Ricks<span>.</span></div>
              <p className="footer-tag">
                Smashburger, Craft Beer und gute Vibes in Reudnitz.
                Täglich ab 12 Uhr — sieben Tage die Woche.
              </p>
              <a href="https://pdstudio.de" className="footer-pdstudio" target="_blank" rel="noopener noreferrer">
                <span className="pink" aria-hidden="true">▸</span>
                Erstellt von PDSTUDIO
              </a>
            </div>

            <div className="footer-col">
              <h4>Navigation</h4>
              <ul role="list">
                <li><a href="#konzept">Konzept</a></li>
                <li><a href="#karte">Karte</a></li>
                <li><a href="#zeiten">Öffnungszeiten</a></li>
                <li><a href="#bestellen">Bestellen</a></li>
                <li><a href="#anfahrt">Anfahrt</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Standort</h4>
              <p>Reudnitz<br />04317 Leipzig</p>
              <p style={{ marginTop: '12px' }}>Mo–So<br />12:00 — 23:00</p>
            </div>

            <div className="footer-col">
              <h4>Rechtliches</h4>
              <ul role="list">
                <li><a href="#impressum">Impressum</a></li>
                <li><a href="#datenschutz">Datenschutz</a></li>
                <li><a href="#agb">AGB</a></li>
              </ul>
            </div>

          </div>

          <div className="footer-bottom">
            <p>© 2026 Ricks Burger, Leipzig. Alle Rechte vorbehalten.</p>
            <p>Demo-Website · Erstellt von PDSTUDIO</p>
          </div>
        </div>

        {/* Legal anchor targets */}
        <span id="impressum" style={{ display: 'none' }} />
        <span id="datenschutz" style={{ display: 'none' }} />
        <span id="agb" style={{ display: 'none' }} />
      </footer>
    </>
  );
}
