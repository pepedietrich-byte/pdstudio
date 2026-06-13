import { useEffect, useState } from 'react';

const CSS = `
:root {
  --obsidian:    #0a0a0a;
  --charcoal:    #1a1a1a;
  --charcoal-2:  #111111;
  --gold:        #c9922a;
  --gold-dim:    rgba(201,146,42,0.22);
  --gold-soft:   rgba(201,146,42,0.50);
  --cream:       #f5e6c8;
  --cream-soft:  rgba(245,230,200,0.68);
  --cream-mute:  rgba(245,230,200,0.38);
  --cream-faint: rgba(245,230,200,0.10);
  --line:        rgba(201,146,42,0.18);
  --line-strong: rgba(201,146,42,0.36);
  --display: 'Cormorant Garamond', Georgia, 'Times New Roman', serif;
  --sans:    'Inter Tight', 'Inter', system-ui, -apple-system, sans-serif;
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --container: 1280px;
  --banner-h: 36px;
  --nav-h:    68px;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
*::selection { background: var(--gold); color: var(--obsidian); }
html { scroll-behavior: smooth; color-scheme: dark; }
html, body {
  background: var(--obsidian);
  color: var(--cream);
  font-family: var(--sans);
  font-size: 16px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}
img { display: block; max-width: 100%; }
a { color: inherit; text-decoration: none; }
button { font: inherit; cursor: pointer; background: transparent; border: none; color: inherit; }
input, textarea, select { font: inherit; color: inherit; }

/* ── DEMO BANNER ─────────────────────────────── */
.demo-banner {
  position: sticky; top: 0; z-index: 100;
  height: var(--banner-h);
  background: var(--gold);
  color: var(--obsidian);
  display: flex; align-items: center; justify-content: center;
  font-size: 10.5px; font-weight: 700;
  letter-spacing: 0.20em; text-transform: uppercase;
  padding: 0 16px;
}

/* ── NAV ─────────────────────────────────────── */
.nav {
  position: sticky; top: var(--banner-h); z-index: 99;
  height: var(--nav-h);
  background: rgba(10,10,10,0.90);
  backdrop-filter: blur(28px) saturate(110%);
  -webkit-backdrop-filter: blur(28px) saturate(110%);
  border-bottom: 1px solid var(--line);
}
.nav-inner {
  display: flex; align-items: center; justify-content: space-between;
  height: 100%; max-width: var(--container); margin: 0 auto;
  padding: 0 clamp(20px,5vw,48px); gap: 24px;
}
.nav-brand {
  font-family: var(--display); font-style: italic; font-weight: 700;
  font-size: 22px; letter-spacing: 0.02em; color: var(--cream);
  flex-shrink: 0;
}
.nav-brand em { color: var(--gold); font-style: italic; }
.nav-links {
  display: flex; align-items: center;
  gap: clamp(20px,2.5vw,40px); list-style: none;
}
.nav-links a {
  font-size: 11px; font-weight: 600;
  letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--cream-mute);
  transition: color 180ms var(--ease-out);
}
.nav-links a:hover { color: var(--cream); }
.nav-cta {
  display: inline-flex; align-items: center;
  height: 38px; padding: 0 20px;
  border: 1px solid var(--gold); color: var(--gold);
  font-size: 11px; font-weight: 700;
  letter-spacing: 0.14em; text-transform: uppercase; flex-shrink: 0;
  transition: background 200ms var(--ease-out), color 200ms var(--ease-out);
}
.nav-cta:hover { background: var(--gold); color: var(--obsidian); }
.nav-toggle {
  display: none; width: 40px; height: 40px;
  align-items: center; justify-content: center;
  border: 1px solid var(--line-strong); color: var(--cream); flex-shrink: 0;
}
@media (max-width: 960px) {
  .nav-links, .nav-cta { display: none; }
  .nav-toggle { display: inline-flex; }
}
.mobile-nav {
  position: fixed;
  inset: calc(var(--banner-h) + var(--nav-h)) 0 0 0;
  background: var(--obsidian); border-top: 1px solid var(--line);
  padding: 40px clamp(20px,5vw,48px);
  z-index: 98; display: flex; flex-direction: column; gap: 0;
  transform: translateY(-10px); opacity: 0; pointer-events: none;
  transition: transform 260ms var(--ease-out), opacity 220ms var(--ease-out);
}
.mobile-nav.open { transform: translateY(0); opacity: 1; pointer-events: auto; }
.mobile-nav a {
  font-family: var(--display); font-style: italic; font-weight: 700;
  font-size: clamp(32px,7vw,52px); letter-spacing: -0.01em;
  color: var(--cream); padding: 14px 0; border-bottom: 1px solid var(--line);
  display: block; transition: color 180ms;
}
.mobile-nav a:hover { color: var(--gold); }
.mobile-cta {
  font-family: var(--sans) !important; font-style: normal !important;
  font-size: 11px !important; letter-spacing: 0.16em !important;
  text-transform: uppercase !important;
  margin-top: 28px; align-self: flex-start; border: none !important;
  height: 48px; padding: 0 24px;
  background: var(--gold) !important; color: var(--obsidian) !important;
  display: inline-flex; align-items: center;
}

/* ── LAYOUT ──────────────────────────────────── */
.container {
  width: 100%; max-width: var(--container); margin: 0 auto;
  padding: 0 clamp(20px,5vw,48px);
}
.sy-section {
  padding: clamp(80px,11vw,148px) 0;
  border-top: 1px solid var(--line);
}

/* ── SECTION LABEL ───────────────────────────── */
.section-label {
  display: flex; align-items: center; gap: 14px;
  margin-bottom: clamp(44px,6vw,72px);
}
.section-num {
  font-family: var(--display); font-style: italic; font-size: 13px;
  font-weight: 400; color: var(--gold); flex-shrink: 0; letter-spacing: 0.08em;
}
.section-name {
  font-size: 10px; font-weight: 700;
  letter-spacing: 0.24em; text-transform: uppercase; color: var(--cream-mute);
}
.section-label::after {
  content: ''; flex: 1; height: 1px;
  background: linear-gradient(90deg, var(--gold-dim) 0%, transparent 100%);
}

/* ── HERO ────────────────────────────────────── */
.hero {
  position: relative; height: 100dvh; min-height: 620px;
  display: flex; flex-direction: column; justify-content: flex-end; overflow: hidden;
}
.hero-bg { position: absolute; inset: 0; z-index: 0; }
.hero-bg img {
  width: 100%; height: 100%;
  object-fit: cover; object-position: center 38%;
  filter: brightness(0.52) saturate(0.78);
}
.hero-vignette {
  position: absolute; inset: 0; z-index: 1;
  background:
    linear-gradient(180deg, rgba(10,10,10,0.15) 0%, rgba(10,10,10,0.02) 22%,
                    rgba(10,10,10,0.40) 60%, rgba(10,10,10,0.95) 100%),
    linear-gradient(90deg, rgba(10,10,10,0.60) 0%, transparent 45%);
}
.hero-content { position: relative; z-index: 2; padding-bottom: clamp(52px,8vh,100px); }
.hero-eyebrow {
  display: flex; align-items: center; gap: 14px;
  font-size: 10px; font-weight: 700;
  letter-spacing: 0.28em; text-transform: uppercase; color: var(--gold);
  margin-bottom: clamp(20px,3vh,32px);
}
.hero-eyebrow::before {
  content: ''; width: 44px; height: 1px; background: var(--gold); flex-shrink: 0;
}
.hero h1 {
  font-family: var(--display); font-style: italic; font-weight: 700;
  font-size: clamp(80px,14vw,200px); line-height: 0.86; letter-spacing: -0.02em;
  color: var(--cream); margin-bottom: clamp(28px,4vh,52px); text-wrap: balance;
}
.hero-subtitle {
  display: block; font-weight: 300; color: var(--cream-soft);
  font-size: clamp(56px,10vw,144px);
}
.hero-meta {
  display: flex; align-items: flex-start; gap: clamp(28px,5vw,64px);
  flex-wrap: wrap; padding-top: 28px; border-top: 1px solid var(--line);
}
.hero-meta-item { display: flex; flex-direction: column; gap: 4px; }
.hero-meta-item .k {
  font-size: 9px; font-weight: 700;
  letter-spacing: 0.26em; text-transform: uppercase; color: var(--gold);
}
.hero-meta-item .v {
  font-family: var(--display); font-style: italic;
  font-size: clamp(14px,1.4vw,18px); color: var(--cream); line-height: 1.2;
}
.hero-ctas { display: flex; gap: 12px; flex-wrap: wrap; margin-top: clamp(24px,4vh,40px); }
@media (max-width: 600px) {
  .hero h1 { font-size: clamp(64px,19vw,92px); }
  .hero-subtitle { font-size: clamp(48px,14vw,70px); }
  .hero-meta { gap: 20px; }
}

/* ── BUTTONS ─────────────────────────────────── */
.btn-gold {
  display: inline-flex; align-items: center; gap: 10px;
  height: 52px; padding: 0 28px; background: var(--gold); color: var(--obsidian);
  font-size: 11px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase;
  transition: background 200ms var(--ease-out), transform 150ms;
}
.btn-gold:hover { background: #d4a040; color: var(--obsidian); }
.btn-gold:active { transform: scale(0.98); }
.btn-outline {
  display: inline-flex; align-items: center; gap: 10px;
  height: 52px; padding: 0 28px; background: transparent; color: var(--cream);
  font-size: 11px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase;
  border: 1px solid rgba(245,230,200,0.34);
  transition: border-color 200ms, transform 150ms;
}
.btn-outline:hover { border-color: var(--cream); }
.btn-outline:active { transform: scale(0.98); }
.btn-sm {
  display: inline-flex; align-items: center; gap: 8px;
  height: 42px; padding: 0 20px; background: var(--gold); color: var(--obsidian);
  font-size: 10px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase;
  transition: background 200ms;
}
.btn-sm:hover { background: #d4a040; color: var(--obsidian); }

/* ── TRUST STRIP ─────────────────────────────── */
.trust-strip {
  background: var(--charcoal);
  border-top: 1px solid var(--line); border-bottom: 1px solid var(--line);
  padding: 28px 0;
}
.trust-row {
  display: flex; align-items: center; justify-content: space-between;
  gap: 20px; flex-wrap: wrap;
}
.trust-item { display: flex; align-items: baseline; gap: 10px; }
.trust-item .n {
  font-family: var(--display); font-style: italic; font-weight: 700;
  font-size: clamp(26px,3.5vw,38px); color: var(--gold);
  line-height: 1; letter-spacing: -0.01em;
}
.trust-item .l {
  font-size: 10px; font-weight: 600;
  letter-spacing: 0.14em; text-transform: uppercase; color: var(--cream-mute);
}

/* ── STORY SECTIONS ──────────────────────────── */
.story-grid {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: clamp(40px,6vw,100px); align-items: start;
}
.story-grid.reverse .story-img { order: 2; }
.story-grid.reverse .story-body { order: 1; }
@media (max-width: 900px) {
  .story-grid { grid-template-columns: 1fr; }
  .story-grid.reverse .story-img,
  .story-grid.reverse .story-body { order: unset; }
}
.story-img {
  position: sticky;
  top: calc(var(--banner-h) + var(--nav-h) + 36px);
  overflow: hidden;
}
.story-img img {
  width: 100%; aspect-ratio: 4/5; object-fit: cover;
  filter: brightness(0.95) contrast(1.02);
  transition: transform 700ms var(--ease-out);
}
.story-img:hover img { transform: scale(1.025); }
@media (max-width: 900px) {
  .story-img { position: static; }
  .story-img img { aspect-ratio: 16/9; }
}
.story-body { padding-top: 4px; }
.story-h2 {
  font-family: var(--display); font-style: italic; font-weight: 700;
  font-size: clamp(44px,6.5vw,84px); line-height: 0.90;
  letter-spacing: -0.02em; color: var(--cream);
  margin-bottom: clamp(24px,3.5vw,44px); text-wrap: balance;
}
.story-h2 .light { font-weight: 300; color: var(--cream-soft); }
.story-p {
  font-size: clamp(14.5px,1.1vw,16.5px); line-height: 1.72;
  color: var(--cream-soft); max-width: 52ch; text-wrap: pretty; margin-bottom: 16px;
}
.story-p.lead-p {
  font-size: clamp(15.5px,1.2vw,18px); color: var(--cream);
}
.story-facts {
  display: grid; grid-template-columns: 1fr 1fr;
  border-top: 1px solid var(--line); margin-top: 40px;
}
.story-fact { padding: 20px 0; border-bottom: 1px solid var(--line); }
.story-fact:nth-child(odd) { padding-right: 24px; border-right: 1px solid var(--line); }
.story-fact:nth-child(even) { padding-left: 24px; }
.story-fact .k {
  font-size: 9px; font-weight: 700;
  letter-spacing: 0.26em; text-transform: uppercase; color: var(--gold); margin-bottom: 7px;
}
.story-fact .v {
  font-family: var(--display); font-style: italic; font-weight: 700;
  font-size: 17px; color: var(--cream); line-height: 1.3;
}

/* ── MENU SECTION ────────────────────────────── */
.menu-section { background: var(--charcoal); }
.menu-feature {
  display: grid; grid-template-columns: 5fr 7fr;
  gap: clamp(40px,6vw,80px); align-items: center;
  margin-bottom: clamp(56px,7vw,88px);
}
@media (max-width: 860px) { .menu-feature { grid-template-columns: 1fr; } }
.menu-feature-img { overflow: hidden; }
.menu-feature-img img {
  width: 100%; aspect-ratio: 1; object-fit: cover;
  filter: brightness(0.94) contrast(1.04);
  transition: transform 700ms var(--ease-out);
}
.menu-feature-img:hover img { transform: scale(1.025); }
.menu-feature-text h2 {
  font-family: var(--display); font-style: italic; font-weight: 700;
  font-size: clamp(42px,5.5vw,68px); line-height: 0.90; letter-spacing: -0.02em;
  color: var(--cream); margin-bottom: 18px;
}
.menu-feature-text h2 em { font-weight: 300; color: var(--cream-soft); }
.menu-feature-text p {
  font-size: 14.5px; line-height: 1.7; color: var(--cream-soft);
  max-width: 46ch; margin-bottom: 28px;
}
.menu-divider { height: 1px; background: var(--line); margin-bottom: clamp(44px,6vw,72px); }
.menu-grid {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 0 clamp(40px,7vw,96px);
}
@media (max-width: 760px) { .menu-grid { grid-template-columns: 1fr; } }
.menu-group-head {
  padding-bottom: 14px; border-bottom: 1px solid var(--line-strong); margin-bottom: 2px;
}
.menu-group-head h3 {
  font-family: var(--display); font-style: italic; font-weight: 700;
  font-size: 22px; letter-spacing: -0.01em; color: var(--gold);
}
.menu-item {
  display: flex; justify-content: space-between; align-items: baseline;
  gap: 16px; padding: 18px 0; border-bottom: 1px solid var(--line);
}
.menu-item:last-child { border-bottom: none; }
.menu-item-name {
  font-family: var(--display); font-style: italic; font-weight: 700;
  font-size: 19px; letter-spacing: -0.01em; color: var(--cream);
  margin-bottom: 4px; line-height: 1.2;
  display: flex; align-items: baseline; gap: 9px; flex-wrap: wrap;
}
.menu-tag {
  font-family: var(--sans); font-style: normal;
  font-size: 8.5px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--gold); border: 1px solid var(--gold-dim); padding: 2px 6px; flex-shrink: 0;
}
.menu-item-desc { font-size: 12.5px; line-height: 1.5; color: var(--cream-mute); max-width: 36ch; }
.menu-item-price {
  font-family: var(--display); font-style: italic; font-weight: 700;
  font-size: 17px; color: var(--cream); white-space: nowrap; flex-shrink: 0;
}

/* ── BAR SECTION ─────────────────────────────── */
.bar-feature {
  position: relative; height: clamp(380px,58vh,640px); overflow: hidden;
  margin-top: clamp(44px,6vw,72px);
}
.bar-feature img {
  width: 100%; height: 100%; object-fit: cover;
  filter: brightness(0.58) saturate(0.75);
}
.bar-feature::before {
  content: ''; position: absolute; inset: 0; z-index: 1;
  background: linear-gradient(90deg, rgba(10,10,10,0.78) 0%, rgba(10,10,10,0.28) 60%, transparent 100%);
}
.bar-feature-overlay {
  position: absolute; inset: 0; z-index: 2;
  display: flex; align-items: center;
}
.bar-feature-text h2 {
  font-family: var(--display); font-style: italic; font-weight: 700;
  font-size: clamp(46px,6.5vw,88px); line-height: 0.88;
  letter-spacing: -0.02em; color: var(--cream); margin-bottom: 16px;
}
.bar-feature-text h2 em { font-weight: 300; color: var(--cream-soft); }
.bar-feature-text p {
  font-size: 15px; line-height: 1.65; color: var(--cream-soft); max-width: 40ch; margin-bottom: 24px;
}
.bar-cards {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 0;
  margin-top: clamp(48px,6vw,80px);
  border-top: 1px solid var(--line); border-left: 1px solid var(--line);
}
@media (max-width: 760px) { .bar-cards { grid-template-columns: 1fr; } }
.bar-card {
  padding: clamp(24px,3vw,40px);
  border-right: 1px solid var(--line); border-bottom: 1px solid var(--line);
}
.bar-card .k {
  font-size: 9px; font-weight: 700;
  letter-spacing: 0.26em; text-transform: uppercase; color: var(--gold); margin-bottom: 12px;
}
.bar-card .name {
  font-family: var(--display); font-style: italic; font-weight: 700;
  font-size: 24px; color: var(--cream); margin-bottom: 10px; letter-spacing: -0.01em;
}
.bar-card p { font-size: 13.5px; line-height: 1.6; color: var(--cream-mute); }

/* ── HOURS SECTION ───────────────────────────── */
.hours-section { background: var(--charcoal-2); }
.hours-grid {
  display: grid; grid-template-columns: 5fr 7fr;
  gap: clamp(40px,6vw,96px); align-items: start;
}
@media (max-width: 900px) { .hours-grid { grid-template-columns: 1fr; } }
.hours-img {
  position: sticky; top: calc(var(--banner-h) + var(--nav-h) + 36px); overflow: hidden;
}
.hours-img img {
  width: 100%; aspect-ratio: 3/4; object-fit: cover;
  filter: brightness(0.90) contrast(1.02);
}
@media (max-width: 900px) {
  .hours-img { position: static; }
  .hours-img img { aspect-ratio: 16/9; }
}
.hours-h2 {
  font-family: var(--display); font-style: italic; font-weight: 700;
  font-size: clamp(44px,6vw,72px); line-height: 0.90;
  letter-spacing: -0.02em; color: var(--cream); margin-bottom: 16px;
}
.hours-h2 em { font-weight: 300; color: var(--cream-soft); }
.hours-note {
  font-size: 13.5px; line-height: 1.65; color: var(--cream-mute);
  max-width: 44ch; margin-bottom: 36px;
}
.hours-list { border-top: 1px solid var(--line); }
.hours-row {
  display: grid; grid-template-columns: 130px 1fr auto;
  gap: 12px; align-items: center;
  padding: 16px 0; border-bottom: 1px solid var(--line);
}
.hours-row.today {
  background: rgba(201,146,42,0.06);
  padding-left: 14px; padding-right: 14px;
  margin-left: -14px; margin-right: -14px;
}
.hours-row .day {
  font-family: var(--display); font-style: italic; font-weight: 700;
  font-size: 18px; color: var(--cream);
}
.hours-row .marker {
  font-size: 9px; font-weight: 700;
  letter-spacing: 0.20em; text-transform: uppercase; color: var(--cream-mute);
}
.hours-row.today .marker { color: var(--gold); }
.hours-row .time { font-size: 14px; font-weight: 500; color: var(--cream); white-space: nowrap; }
.hours-row.closed .day { color: var(--cream-mute); }
.hours-row.closed .time { color: var(--cream-mute); font-style: italic; }

/* ── RESERVATION ─────────────────────────────── */
.res-grid {
  display: grid; grid-template-columns: 5fr 7fr;
  gap: clamp(40px,6vw,96px); align-items: start;
}
@media (max-width: 900px) { .res-grid { grid-template-columns: 1fr; } }
.res-h2 {
  font-family: var(--display); font-style: italic; font-weight: 700;
  font-size: clamp(44px,6vw,72px); line-height: 0.90;
  letter-spacing: -0.02em; color: var(--cream); margin-bottom: 16px;
}
.res-h2 em { font-weight: 300; color: var(--cream-soft); }
.res-head-p {
  font-size: 14.5px; line-height: 1.7; color: var(--cream-soft);
  max-width: 44ch; margin-bottom: 36px;
}
.res-info {
  padding-top: 32px; border-top: 1px solid var(--line);
  display: flex; flex-direction: column; gap: 20px;
}
.res-info-item .k {
  font-size: 9px; font-weight: 700;
  letter-spacing: 0.26em; text-transform: uppercase; color: var(--gold); margin-bottom: 6px;
}
.res-info-item .v {
  font-family: var(--display); font-style: italic; font-weight: 700;
  font-size: 18px; color: var(--cream);
}
.res-form { display: flex; flex-direction: column; gap: 16px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 540px) { .form-row { grid-template-columns: 1fr; } }
.form-group { display: flex; flex-direction: column; gap: 7px; }
.form-group label {
  font-size: 9px; font-weight: 700;
  letter-spacing: 0.26em; text-transform: uppercase; color: var(--gold);
}
.form-group input,
.form-group select,
.form-group textarea {
  background: var(--charcoal); border: 1px solid var(--line); color: var(--cream);
  padding: 13px 16px; font-size: 14px; outline: none;
  transition: border-color 200ms; -webkit-appearance: none; appearance: none; border-radius: 0;
}
.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus { border-color: var(--gold); }
.form-group input::placeholder,
.form-group textarea::placeholder { color: var(--cream-mute); }
.form-group textarea { resize: vertical; min-height: 110px; }
.form-group input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.65); }
@media (max-width: 768px) {
  .form-group input,
  .form-group select,
  .form-group textarea { font-size: 16px; }
}
.form-success { border: 1px solid var(--line); padding: 52px 32px; text-align: center; }
.form-success .icon {
  font-family: var(--display); font-style: italic;
  font-size: 52px; font-weight: 700; color: var(--gold); display: block; margin-bottom: 18px;
}
.form-success h3 {
  font-family: var(--display); font-style: italic; font-weight: 700;
  font-size: 30px; color: var(--cream); margin-bottom: 12px;
}
.form-success p { font-size: 14px; color: var(--cream-soft); max-width: 38ch; margin: 0 auto; }

/* ── ANFAHRT ─────────────────────────────────── */
.anfahrt-section { background: var(--charcoal); }
.anfahrt-grid {
  display: grid; grid-template-columns: 4fr 8fr;
  gap: clamp(40px,6vw,80px); align-items: start;
}
@media (max-width: 860px) { .anfahrt-grid { grid-template-columns: 1fr; } }
.anfahrt-h2 {
  font-family: var(--display); font-style: italic; font-weight: 700;
  font-size: clamp(36px,4.5vw,56px); line-height: 0.90;
  letter-spacing: -0.02em; color: var(--cream); margin-bottom: 18px;
}
.anfahrt-h2 em { font-weight: 300; color: var(--cream-soft); }
.anfahrt-text p { font-size: 14px; line-height: 1.7; color: var(--cream-soft); margin-bottom: 12px; }
.anfahrt-info {
  margin-top: 28px; padding-top: 24px; border-top: 1px solid var(--line);
  display: flex; flex-direction: column; gap: 18px;
}
.anfahrt-info .k {
  font-size: 9px; font-weight: 700;
  letter-spacing: 0.26em; text-transform: uppercase; color: var(--gold); margin-bottom: 6px;
}
.anfahrt-info .v {
  font-family: var(--display); font-style: italic; font-weight: 700;
  font-size: 18px; color: var(--cream);
}
.anfahrt-info .maps-link {
  color: var(--gold); font-size: 11px; font-weight: 600;
  letter-spacing: 0.14em; text-transform: uppercase;
  display: inline-flex; align-items: center; gap: 6px; margin-top: 4px;
  transition: opacity 180ms;
}
.anfahrt-info .maps-link:hover { opacity: 0.7; }
.map-embed { overflow: hidden; border: 1px solid var(--line); }
.map-embed iframe {
  display: block; width: 100%; height: 420px; border: none;
  filter: grayscale(1) invert(1) sepia(0.18) brightness(0.86) contrast(0.88);
}

/* ── FOOTER ──────────────────────────────────── */
.footer { background: #060606; border-top: 1px solid var(--line); padding: 72px 0 32px; }
.footer-grid {
  display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 40px; margin-bottom: 56px;
}
@media (max-width: 760px) { .footer-grid { grid-template-columns: 1fr 1fr; gap: 28px; } }
@media (max-width: 480px) { .footer-grid { grid-template-columns: 1fr; } }
.footer-brand {
  font-family: var(--display); font-style: italic; font-weight: 700;
  font-size: 30px; color: var(--cream); line-height: 1; margin-bottom: 14px;
}
.footer-brand em { color: var(--gold); }
.footer-tag { font-size: 13px; color: var(--cream-mute); line-height: 1.6; max-width: 30ch; }
.footer-col h4 {
  font-size: 9px; font-weight: 700;
  letter-spacing: 0.26em; text-transform: uppercase; color: var(--gold); margin-bottom: 16px;
}
.footer-col ul { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.footer-col a { font-size: 13px; color: var(--cream-mute); transition: color 180ms; }
.footer-col a:hover { color: var(--cream); }
.footer-col p { font-size: 13px; color: var(--cream-mute); line-height: 1.55; margin-bottom: 4px; }
.footer-bottom {
  border-top: 1px solid var(--line); padding-top: 24px;
  display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;
}
.footer-bottom p { font-size: 11px; letter-spacing: 0.06em; color: var(--cream-mute); }
.footer-pdstudio { font-size: 11px; color: var(--cream-mute); letter-spacing: 0.06em; }
.footer-pdstudio a { color: var(--gold); }
.footer-badge {
  font-size: 9.5px; letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--cream-mute); border: 1px solid var(--line); padding: 4px 10px;
}

/* ── LEGAL MODAL ─────────────────────────────── */
.legal-overlay {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(6,6,6,0.90);
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  display: flex; align-items: center; justify-content: center; padding: 24px;
  opacity: 0; transition: opacity 240ms var(--ease-out);
}
.legal-overlay.open { opacity: 1; }
.legal-box {
  background: var(--charcoal); border: 1px solid var(--line-strong);
  max-width: 620px; width: 100%; max-height: 85vh; overflow: auto;
  padding: 40px 36px;
  transform: translateY(10px); transition: transform 280ms var(--ease-out);
}
.legal-overlay.open .legal-box { transform: translateY(0); }
.legal-head {
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: 24px; margin-bottom: 28px;
}
.legal-head h2 {
  font-family: var(--display); font-style: italic; font-weight: 700;
  font-size: 36px; letter-spacing: -0.02em; color: var(--cream);
}
.legal-close {
  width: 36px; height: 36px;
  border: 1px solid var(--line-strong);
  display: flex; align-items: center; justify-content: center;
  color: var(--cream); flex-shrink: 0; transition: background 180ms;
}
.legal-close:hover { background: var(--cream-faint); }
.legal-body { font-size: 14px; line-height: 1.7; color: var(--cream-soft); }
.legal-body p { margin-bottom: 14px; }
.legal-body strong { color: var(--cream); font-weight: 600; }

/* ── REVEAL ──────────────────────────────────── */
.reveal {
  opacity: 0; transform: translateY(22px);
  transition: opacity 800ms var(--ease-out), transform 800ms var(--ease-out);
}
.reveal.in { opacity: 1; transform: translateY(0); }
.rd1 { transition-delay: 100ms; }
.rd2 { transition-delay: 200ms; }
.rd3 { transition-delay: 300ms; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  .reveal { opacity: 1; transform: none; }
}
@media (hover: none) {
  .story-img:hover img,
  .menu-feature-img:hover img { transform: none; }
}
`;

const IMG = {
  hero:          'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=1920&q=85&auto=format&fit=crop',
  ambience:      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80&auto=format&fit=crop',
  chef_detail:   'https://images.unsplash.com/photo-1577106263724-2c8e03bfe9cf?w=900&q=80&auto=format&fit=crop',
  signature_plate:'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=900&q=80&auto=format&fit=crop',
  bar_or_wine:   'https://images.unsplash.com/photo-1591493665089-7d50aff8a4b6?w=900&q=80&auto=format&fit=crop',
  table_setting: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=1200&q=80&auto=format&fit=crop',
};

const HOURS = [
  { day: 'Dienstag',   dayNum: 2, time: '17:30 – 22:30' },
  { day: 'Mittwoch',   dayNum: 3, time: '17:30 – 22:30' },
  { day: 'Donnerstag', dayNum: 4, time: '17:30 – 22:30' },
  { day: 'Freitag',    dayNum: 5, time: '17:30 – 22:30' },
  { day: 'Samstag',    dayNum: 6, time: '17:30 – 22:30' },
  { day: 'Sonntag',    dayNum: 0, time: '17:30 – 22:30' },
  { day: 'Montag',     dayNum: 1, time: 'Ruhetag',       closed: true },
];

const SASHIMI_NIGIRI = [
  { name: 'Lachs Sashimi',     desc: 'Tagesfrisch · handgeschnitten · 5 Scheiben',      price: '14,50 €' },
  { name: 'Maguro Sashimi',    desc: 'Thunfisch Akami · tiefrot · 5 Scheiben',           price: '16,50 €' },
  { name: 'Sashimi Moriawase', desc: 'Küchenchefs Tagesauswahl · 12 Stück',              price: '29,00 €', tag: "Chef's Choice" },
  { name: 'Nigiri Auswahl',    desc: 'Lachs · Thunfisch · Tai · Garnele · 8 Stück',      price: '22,00 €' },
];

const OMAKASE_ETC = [
  { name: 'Omakase Menü',       desc: 'Vertrauensmenü des Küchenchefs · 10 Gänge',        price: '75,00 €', tag: 'Omakase' },
  { name: 'Maki Klassiker',     desc: 'Lachs · Thunfisch · Gurke · 6 Stück',              price: '9,50 €' },
  { name: 'Japanischer Sake',   desc: 'Handverlesene Auswahl nach Saisonalität · Glas',   price: 'ab 8,50 €' },
  { name: 'Japanischer Whisky', desc: 'Suntory Toki · Nikka Coffey · Yamazaki',           price: 'ab 14,00 €' },
];

const LEGAL_CONTENT = {
  impressum: {
    title: 'Impressum',
    body: `<p><strong>Sushi Yu</strong><br>Leipzig Zentrum</p>
           <p>Verantwortlich für den Inhalt: Inhaber des Restaurants.</p>
           <p style="font-size:12px;opacity:0.5;margin-top:20px;"><em>Hinweis: Diese Seite ist eine Konzept-Vorschau von PDSTUDIO. Die rechtlich vollständigen Angaben werden vor Live-Schaltung ergänzt.</em></p>`
  },
  datenschutz: {
    title: 'Datenschutz',
    body: `<p>Wir nehmen den Schutz Ihrer persönlichen Daten ernst und behandeln Ihre personenbezogenen Daten vertraulich gemäß DSGVO.</p>
           <p><strong>1. Verantwortlich</strong><br>Sushi Yu, Leipzig Zentrum.</p>
           <p><strong>2. Kontaktformular</strong><br>Wenn Sie das Reservierungsformular nutzen, werden Ihre Daten zur Bearbeitung der Anfrage gespeichert und nicht an Dritte weitergegeben.</p>
           <p><strong>3. Ihre Rechte</strong><br>Sie haben das Recht auf Auskunft, Berichtigung, Löschung sowie Einschränkung der Verarbeitung Ihrer personenbezogenen Daten.</p>
           <p style="font-size:12px;opacity:0.5;"><em>Stand: Konzept-Vorschau von PDSTUDIO.</em></p>`
  },
  agb: {
    title: 'AGB',
    body: `<p><strong>Allgemeine Geschäftsbedingungen — Sushi Yu</strong></p>
           <p><strong>§ 1 Geltungsbereich</strong><br>Diese AGB gelten für alle Verträge zwischen Sushi Yu und seinen Gästen.</p>
           <p><strong>§ 2 Reservierungen</strong><br>Reservierungen sind nach schriftlicher Bestätigung verbindlich. Bei Nichterscheinen ohne Absage behalten wir uns vor, den Tisch anderweitig zu vergeben.</p>
           <p><strong>§ 3 Omakase</strong><br>Omakase-Reservierungen müssen mindestens 24 Stunden im Voraus angemeldet werden. Stornierungen bis 12 Stunden vorher sind kostenfrei.</p>
           <p style="font-size:12px;opacity:0.5;"><em>Stand: Konzept-Vorschau von PDSTUDIO.</em></p>`
  },
};

const ArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6"/>
  </svg>
);
const ExtLink = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M7 17L17 7M7 7h10v10"/>
  </svg>
);
const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M6 6l12 12M6 18L18 6"/>
  </svg>
);
const HamburgerIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M3 6h18M3 12h18M3 18h18"/>
  </svg>
);
const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M6 6l12 12M6 18L18 6"/>
  </svg>
);

function MenuItem({ name, desc, price, tag }) {
  return (
    <div className="menu-item">
      <div>
        <p className="menu-item-name">
          {name}
          {tag && <span className="menu-tag">{tag}</span>}
        </p>
        <p className="menu-item-desc">{desc}</p>
      </div>
      <span className="menu-item-price">{price}</span>
    </div>
  );
}

export default function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', date: '', time: '19:00', guests: '2', message: '' });
  const [sent, setSent] = useState(false);
  const today = new Date().getDay();

  useEffect(() => {
    const s = document.createElement('style');
    s.setAttribute('data-sy', '1');
    s.textContent = CSS;
    document.head.appendChild(s);
    return () => { if (s.parentNode) document.head.removeChild(s); };
  }, []);

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
      { rootMargin: '-6% 0px -6% 0px', threshold: 0.08 }
    );
    els.forEach(e => io.observe(e));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const r = () => { if (window.innerWidth > 960) setMobileOpen(false); };
    window.addEventListener('resize', r);
    return () => window.removeEventListener('resize', r);
  }, []);

  useEffect(() => {
    function openLegal(key) {
      const d = LEGAL_CONTENT[key];
      if (!d) return;
      const el = document.createElement('div');
      el.className = 'legal-overlay';
      el.innerHTML = `
        <div class="legal-box">
          <div class="legal-head">
            <h2>${d.title}</h2>
            <button class="legal-close" aria-label="Schließen">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 6l12 12M6 18L18 6"/>
              </svg>
            </button>
          </div>
          <div class="legal-body">${d.body}</div>
        </div>`;
      document.body.appendChild(el);
      requestAnimationFrame(() => el.classList.add('open'));
      const close = () => {
        el.classList.remove('open');
        setTimeout(() => { if (el.parentNode) el.remove(); }, 250);
      };
      el.querySelector('.legal-close').onclick = close;
      el.onclick = ev => { if (ev.target === el) close(); };
      document.addEventListener('keydown', function esc(e) {
        if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
      }, { once: true });
    }
    ['impressum', 'datenschutz', 'agb'].forEach(k => {
      document.getElementById(`foot-${k}`)?.addEventListener('click', e => {
        e.preventDefault();
        openLegal(k);
      });
    });
  }, []);

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const cl = () => setMobileOpen(false);
  const submit = e => { e.preventDefault(); setSent(true); };

  return (
    <>
      {/* ── DEMO BANNER ───────────────────────────── */}
      <div className="demo-banner" role="banner">
        Demo von PDSTUDIO · Konzept-Vorschlag für Sushi Yu
      </div>

      {/* ── NAV ───────────────────────────────────── */}
      <nav className="nav" role="navigation" aria-label="Hauptnavigation">
        <div className="nav-inner">
          <a href="#top" className="nav-brand" onClick={cl}>
            Sushi <em>Yu</em>
          </a>
          <ul className="nav-links">
            <li><a href="#konzept">Konzept</a></li>
            <li><a href="#karte">Karte</a></li>
            <li><a href="#bar">Bar & Sake</a></li>
            <li><a href="#zeiten">Zeiten</a></li>
            <li><a href="#reservierung">Reservierung</a></li>
          </ul>
          <a href="#reservierung" className="nav-cta">Tisch reservieren</a>
          <button
            className="nav-toggle"
            onClick={() => setMobileOpen(v => !v)}
            aria-label={mobileOpen ? 'Menü schließen' : 'Menü öffnen'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <XIcon /> : <HamburgerIcon />}
          </button>
        </div>
        <div className={`mobile-nav${mobileOpen ? ' open' : ''}`} aria-hidden={!mobileOpen}>
          <a href="#konzept" onClick={cl}>Konzept</a>
          <a href="#karte" onClick={cl}>Karte</a>
          <a href="#bar" onClick={cl}>Bar & Sake</a>
          <a href="#zeiten" onClick={cl}>Zeiten</a>
          <a href="#reservierung" onClick={cl}>Reservierung</a>
          <a href="#reservierung" onClick={cl} className="mobile-cta">Tisch reservieren</a>
        </div>
      </nav>

      <main id="top">

        {/* ── HERO ──────────────────────────────────── */}
        <section className="hero" aria-label="Sushi Yu Leipzig">
          <div className="hero-bg" aria-hidden="true">
            <img
              src={IMG.hero}
              alt=""
              loading="eager"
              fetchPriority="high"
            />
          </div>
          <div className="hero-vignette" aria-hidden="true" />
          <div className="hero-content container">
            <div className="hero-eyebrow">Japanisch · Sushi · Omakase</div>
            <h1>
              Sushi
              <span className="hero-subtitle">Yu.</span>
            </h1>
            <div className="hero-meta">
              <div className="hero-meta-item">
                <span className="k">Bewertung</span>
                <span className="v">4,4 ★ · 240 Reviews</span>
              </div>
              <div className="hero-meta-item">
                <span className="k">Lage</span>
                <span className="v">Leipzig Zentrum</span>
              </div>
              <div className="hero-meta-item">
                <span className="k">Küche</span>
                <span className="v">Japanisch · €€€</span>
              </div>
              <div className="hero-meta-item">
                <span className="k">Heute</span>
                <span className="v">{today === 1 ? 'Ruhetag' : '17:30 – 22:30'}</span>
              </div>
            </div>
            <div className="hero-ctas">
              <a href="#reservierung" className="btn-gold">
                Tisch reservieren <ArrowRight />
              </a>
              <a href="#karte" className="btn-outline">Zur Karte</a>
            </div>
          </div>
        </section>

        {/* ── TRUST STRIP ───────────────────────────── */}
        <div className="trust-strip">
          <div className="container">
            <div className="trust-row">
              <div className="trust-item">
                <span className="n">4,4</span>
                <span className="l">★ Google · 240 Reviews</span>
              </div>
              <div className="trust-item">
                <span className="n">€€€</span>
                <span className="l">Gehobene Küche</span>
              </div>
              <div className="trust-item">
                <span className="n">Di–So</span>
                <span className="l">17:30 – 22:30 Uhr</span>
              </div>
              <div className="trust-item">
                <span className="n">Omakase</span>
                <span className="l">auf Wunsch</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 01. KONZEPT ───────────────────────────── */}
        <section className="sy-section" id="konzept" aria-labelledby="konzept-h2">
          <div className="container">
            <div className="section-label">
              <span className="section-num">01.</span>
              <span className="section-name">Konzept</span>
            </div>
            <div className="story-grid">
              <div className="story-img reveal">
                <img
                  src={IMG.ambience}
                  alt="Ruhiges Ambiente im Sushi Yu Leipzig"
                  loading="lazy"
                />
              </div>
              <div className="story-body">
                <h2 id="konzept-h2" className="story-h2 reveal">
                  Japanische Präzision.
                  <br /><span className="light">Ruhiges Ambiente.</span>
                </h2>
                <p className="story-p lead-p reveal">
                  Sushi Yu ist ein klassisches japanisches Sushi-Restaurant im Herzen von Leipzig.
                  Die Küche steht für handwerkliche Präzision und die Qualität tagesfrischer Zutaten.
                </p>
                <p className="story-p reveal">
                  Jede Rolle, jedes Nigiri, jedes Sashimi wird mit der nötigen Sorgfalt
                  zubereitet. Wer sich dem Küchenchef anvertrauen möchte, wählt das Omakase —
                  eine Abfolge von Gängen nach Tagesangebot und Saison.
                </p>
                <p className="story-p reveal">
                  Das Ambiente ist bewusst ruhig gehalten: gedämpftes Licht, keine Hektik.
                  Ein Ort, an dem man isst — und nichts sonst.
                </p>
                <div className="story-facts reveal">
                  <div className="story-fact">
                    <div className="k">Küche</div>
                    <div className="v">Japanisch · Sushi</div>
                  </div>
                  <div className="story-fact">
                    <div className="k">Spezialität</div>
                    <div className="v">Omakase auf Wunsch</div>
                  </div>
                  <div className="story-fact">
                    <div className="k">Atmosphäre</div>
                    <div className="v">Ruhig · Klassisch</div>
                  </div>
                  <div className="story-fact">
                    <div className="k">Preisniveau</div>
                    <div className="v">€€€ · Gehoben</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 02. KÜCHE ─────────────────────────────── */}
        <section className="sy-section" id="kueche" aria-labelledby="kueche-h2">
          <div className="container">
            <div className="section-label">
              <span className="section-num">02.</span>
              <span className="section-name">Küche</span>
            </div>
            <div className="story-grid reverse">
              <div className="story-img reveal">
                <img
                  src={IMG.chef_detail}
                  alt="Küchenchef bereitet Sushi zu"
                  loading="lazy"
                />
              </div>
              <div className="story-body">
                <h2 id="kueche-h2" className="story-h2 reveal">
                  Handwerk.
                  <br /><span className="light">Täglich frisch.</span>
                </h2>
                <p className="story-p lead-p reveal">
                  Tagesfrische Sashimi-Qualität ist die Grundlage — kein Kompromiss.
                  Fisch wird täglich nach Qualität und Saisonalität ausgewählt.
                </p>
                <p className="story-p reveal">
                  Nur was den Anspruch erfüllt, kommt auf den Teller. Der Sushi-Tresen
                  ist das Herzstück des Restaurants: Hier entstehen Nigiri mit der Ruhe
                  und Konzentration, die japanische Küche verlangt.
                </p>
                <div className="story-facts reveal">
                  <div className="story-fact">
                    <div className="k">Fisch</div>
                    <div className="v">Täglich frisch bezogen</div>
                  </div>
                  <div className="story-fact">
                    <div className="k">Zubereitung</div>
                    <div className="v">Handarbeit am Tresen</div>
                  </div>
                  <div className="story-fact">
                    <div className="k">Sashimi</div>
                    <div className="v">Tagesqualität</div>
                  </div>
                  <div className="story-fact">
                    <div className="k">Omakase</div>
                    <div className="v">Auf Vorbestellung</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 03. KARTE ─────────────────────────────── */}
        <section className="sy-section menu-section" id="karte" aria-labelledby="karte-h2">
          <div className="container">
            <div className="section-label">
              <span className="section-num">03.</span>
              <span className="section-name">Karte</span>
            </div>

            <div className="menu-feature">
              <div className="menu-feature-img reveal">
                <img
                  src={IMG.signature_plate}
                  alt="Signature Sashimi-Teller im Sushi Yu Leipzig"
                  loading="lazy"
                />
              </div>
              <div className="menu-feature-text">
                <h2 id="karte-h2" className="reveal">
                  Auswahl<br /><em>aus der Karte.</em>
                </h2>
                <p className="reveal">
                  Tagesfrische Sashimi, handgerollte Maki und das Omakase als
                  Vertrauensmenü des Küchenchefs — für Gäste, die sich der Küche
                  vollständig anvertrauen möchten.
                </p>
                <div className="reveal">
                  <a href="#reservierung" className="btn-gold">
                    Tisch reservieren <ArrowRight />
                  </a>
                </div>
              </div>
            </div>

            <div className="menu-divider" aria-hidden="true" />

            <div className="menu-grid reveal">
              <div className="menu-group">
                <div className="menu-group-head">
                  <h3>Sashimi & Nigiri</h3>
                </div>
                {SASHIMI_NIGIRI.map((item, i) => (
                  <MenuItem key={i} {...item} />
                ))}
              </div>
              <div className="menu-group">
                <div className="menu-group-head">
                  <h3>Omakase & Getränke</h3>
                </div>
                {OMAKASE_ETC.map((item, i) => (
                  <MenuItem key={i} {...item} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 04. BAR & SAKE ────────────────────────── */}
        <section className="sy-section bar-section" id="bar" aria-labelledby="bar-h2">
          <div className="container">
            <div className="section-label">
              <span className="section-num">04.</span>
              <span className="section-name">Bar & Sake</span>
            </div>
          </div>

          <div className="bar-feature reveal">
            <img
              src={IMG.bar_or_wine}
              alt="Japanische Sake- und Whisky-Auswahl Sushi Yu"
              loading="lazy"
            />
            <div className="bar-feature-overlay">
              <div className="container">
                <div className="bar-feature-text">
                  <h2 id="bar-h2">
                    Sake.<br /><em>Whisky.</em><br />Japan.
                  </h2>
                  <p>
                    Eine sorgfältig zusammengestellte Auswahl handverlesener
                    japanischer Sake und ausgewählter Single-Malt-Whisky.
                  </p>
                  <a href="#reservierung" className="btn-sm">
                    Reservieren <ArrowRight />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="container">
            <div className="bar-cards">
              <div className="bar-card reveal">
                <div className="k">Premium Sake</div>
                <div className="name">Junmai Daiginjo</div>
                <p>Blumige Aromen, elegante Struktur — der ideale Begleiter zu Sashimi und Nigiri.</p>
              </div>
              <div className="bar-card reveal rd1">
                <div className="k">Japanischer Whisky</div>
                <div className="name">Suntory Toki</div>
                <p>Ausgewogener Blend mit Zitrusnoten, weichem Abgang und japanischer Finesse.</p>
              </div>
              <div className="bar-card reveal rd2">
                <div className="k">Rauchig & Komplex</div>
                <div className="name">Nikka Coffey Grain</div>
                <p>Sanfte Süße, dezenter Rauch — ideal zum Abschluss eines Omakase-Menüs.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 05. ÖFFNUNGSZEITEN ────────────────────── */}
        <section className="sy-section hours-section" id="zeiten" aria-labelledby="zeiten-h2">
          <div className="container">
            <div className="section-label">
              <span className="section-num">05.</span>
              <span className="section-name">Öffnungszeiten</span>
            </div>
            <div className="hours-grid">
              <div className="hours-img reveal">
                <img
                  src={IMG.table_setting}
                  alt="Gedeckter Tisch im Sushi Yu Leipzig"
                  loading="lazy"
                />
              </div>
              <div>
                <h2 id="zeiten-h2" className="hours-h2 reveal">
                  Di — So.<br /><em>Ab 17:30.</em>
                </h2>
                <p className="hours-note reveal">
                  Montag ist Ruhetag. Reservierungen für das Omakase-Menü
                  bitten wir mindestens 24 Stunden im Voraus.
                </p>
                <div className="hours-list">
                  {HOURS.map(row => (
                    <div
                      key={row.dayNum}
                      className={[
                        'hours-row',
                        row.dayNum === today ? 'today' : '',
                        row.closed ? 'closed' : '',
                      ].filter(Boolean).join(' ')}
                    >
                      <span className="day">{row.day}</span>
                      <span className="marker">{row.dayNum === today ? '· Heute' : ''}</span>
                      <span className="time">{row.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 06. RESERVIERUNG ──────────────────────── */}
        <section className="sy-section" id="reservierung" aria-labelledby="res-h2">
          <div className="container">
            <div className="section-label">
              <span className="section-num">06.</span>
              <span className="section-name">Reservierung</span>
            </div>
            <div className="res-grid">
              <div>
                <h2 id="res-h2" className="res-h2 reveal">
                  Tisch<br /><em>reservieren.</em>
                </h2>
                <p className="res-head-p reveal">
                  Senden Sie uns Ihre Anfrage — wir bestätigen zeitnah per E-Mail.
                  Für das Omakase-Menü bitten wir um Voranmeldung mindestens
                  24 Stunden im Voraus.
                </p>
                <div className="res-info reveal">
                  <div className="res-info-item">
                    <div className="k">Öffnungszeiten</div>
                    <div className="v">Di – So · 17:30 – 22:30</div>
                  </div>
                  <div className="res-info-item">
                    <div className="k">Standort</div>
                    <div className="v">Leipzig Zentrum</div>
                  </div>
                  <div className="res-info-item">
                    <div className="k">Ruhetag</div>
                    <div className="v">Montag geschlossen</div>
                  </div>
                  <div className="res-info-item">
                    <div className="k">Antwortzeit</div>
                    <div className="v">In der Regel innerhalb weniger Stunden</div>
                  </div>
                </div>
              </div>

              <div>
                {sent ? (
                  <div className="form-success reveal">
                    <span className="icon" aria-hidden="true">✓</span>
                    <h3>Anfrage gesendet.</h3>
                    <p>
                      Wir bestätigen Ihre Reservierung per E-Mail —
                      in der Regel innerhalb weniger Stunden.
                    </p>
                  </div>
                ) : (
                  <form
                    className="res-form reveal"
                    onSubmit={submit}
                    aria-label="Reservierungsformular"
                  >
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="res-name">Name *</label>
                        <input
                          id="res-name" type="text" required autoComplete="name"
                          placeholder="Ihr Name"
                          value={form.name} onChange={e => f('name', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="res-email">E-Mail *</label>
                        <input
                          id="res-email" type="email" required autoComplete="email"
                          placeholder="ihre@email.de"
                          value={form.email} onChange={e => f('email', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="res-date">Datum *</label>
                        <input
                          id="res-date" type="date" required
                          value={form.date} onChange={e => f('date', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="res-time">Uhrzeit *</label>
                        <select
                          id="res-time" required
                          value={form.time} onChange={e => f('time', e.target.value)}
                        >
                          {['17:30','18:00','18:30','19:00','19:30','20:00','20:30','21:00','21:30'].map(t => (
                            <option key={t} value={t}>{t} Uhr</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="res-guests">Personen *</label>
                      <select
                        id="res-guests" required
                        value={form.guests} onChange={e => f('guests', e.target.value)}
                      >
                        {['1','2','3','4','5','6','7','8+'].map(n => (
                          <option key={n} value={n}>
                            {n}{n === '1' ? ' Person' : n === '8+' ? ' Personen oder mehr' : ' Personen'}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="res-msg">Nachricht (optional)</label>
                      <textarea
                        id="res-msg"
                        placeholder="Besondere Wünsche, Omakase-Anfrage, Allergien..."
                        value={form.message} onChange={e => f('message', e.target.value)}
                      />
                    </div>
                    <button type="submit" className="btn-gold">
                      Tisch anfragen <ArrowRight />
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── ANFAHRT ───────────────────────────────── */}
        <section className="sy-section anfahrt-section" id="anfahrt" aria-labelledby="anfahrt-h2">
          <div className="container">
            <div className="section-label">
              <span className="section-num">↓</span>
              <span className="section-name">Anfahrt</span>
            </div>
            <div className="anfahrt-grid">
              <div className="anfahrt-text reveal">
                <h2 id="anfahrt-h2" className="anfahrt-h2">
                  Leipzig<br /><em>Zentrum.</em>
                </h2>
                <p>
                  Sushi Yu liegt im Herzen von Leipzig und ist bequem erreichbar —
                  mit öffentlichen Verkehrsmitteln, zu Fuß aus der Innenstadt
                  oder per Fahrrad.
                </p>
                <p>
                  Die genaue Adresse und Anfahrtsdetails teilen wir bei der
                  Reservierungsbestätigung mit.
                </p>
                <div className="anfahrt-info">
                  <div>
                    <div className="k">Standort</div>
                    <div className="v">Leipzig Zentrum</div>
                  </div>
                  <div>
                    <div className="k">Öffnungszeiten</div>
                    <div className="v">Di – So · 17:30 – 22:30 Uhr</div>
                  </div>
                  <div>
                    <a
                      href="https://maps.google.com/?q=Sushi+Yu+Leipzig"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="maps-link"
                    >
                      In Google Maps öffnen <ExtLink />
                    </a>
                  </div>
                </div>
              </div>
              <div className="map-embed reveal">
                <iframe
                  title="Sushi Yu Leipzig — Standort"
                  src="https://maps.google.com/maps?q=Sushi+Yu+Leipzig&t=&z=15&ie=UTF8&iwloc=&output=embed"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  aria-label="Karte: Sushi Yu Leipzig Zentrum"
                />
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ── FOOTER ────────────────────────────────── */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <div className="footer-brand">Sushi <em>Yu</em></div>
              <p className="footer-tag">
                Japanisches Sushi-Restaurant · Leipzig Zentrum.<br />
                Omakase auf Wunsch. Di – So ab 17:30 Uhr.
              </p>
            </div>
            <div className="footer-col">
              <h4>Besuch</h4>
              <ul>
                <li><p>Leipzig Zentrum</p></li>
                <li><p>Di – So · 17:30 – 22:30</p></li>
                <li><p>Mo Ruhetag</p></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Erleben</h4>
              <ul>
                <li><a href="#konzept">Konzept</a></li>
                <li><a href="#karte">Speisekarte</a></li>
                <li><a href="#bar">Bar & Sake</a></li>
                <li><a href="#zeiten">Öffnungszeiten</a></li>
                <li><a href="#reservierung">Reservierung</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Rechtliches</h4>
              <ul>
                <li><a href="#impressum" id="foot-impressum">Impressum</a></li>
                <li><a href="#datenschutz" id="foot-datenschutz">Datenschutz</a></li>
                <li><a href="#agb" id="foot-agb">AGB</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2026 Sushi Yu · Leipzig Zentrum</p>
            <p className="footer-pdstudio">Erstellt von <a href="#top">PDSTUDIO</a></p>
            <span className="footer-badge">Demo · noindex</span>
          </div>
        </div>
      </footer>
    </>
  );
}
