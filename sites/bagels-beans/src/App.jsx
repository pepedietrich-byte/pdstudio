import { useState, useEffect, useRef } from 'react'

/* ─── TERRAIN PALETTE ─────────────────────────────────────────────
   sand #d4a574 · olive #6b7a3a · terracotta #c4621a
   walnut #5a3a1f · paper #f5ede0
   ─────────────────────────────────────────────────────────────── */

const IMAGES = {
  hero_lifestyle:  'https://images.unsplash.com/photo-1592151450181-25f5a4f1a3f9?w=1920&q=85&auto=format&fit=crop',
  people_at_work:  'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200&q=80&auto=format&fit=crop',
  kitchen:         'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&q=80&auto=format&fit=crop',
  dish_top_down:   'https://images.unsplash.com/photo-1592151450181-25f5a4f1a3f9?w=900&q=80&auto=format&fit=crop',
  neighborhood:    'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=1200&q=80&auto=format&fit=crop',
}

/* ─── today highlight ─── */
function getTodayIndex() {
  const d = new Date().getDay()
  // 0=Sun,1=Mon,...6=Sat
  return d
}

/* ─── intersection reveal hook ─── */
function useReveal(threshold = 0.15) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, visible]
}

/* ─── Polaroid image component ─── */
function Polaroid({ src, alt, rotate = 0, caption, style = {} }) {
  const [ref, visible] = useReveal(0.1)
  return (
    <div
      ref={ref}
      className="polaroid"
      style={{
        '--rot': `${rotate}deg`,
        opacity: visible ? 1 : 0,
        transform: visible
          ? `rotate(var(--rot)) translateY(0)`
          : `rotate(var(--rot)) translateY(24px)`,
        transition: 'opacity 700ms cubic-bezier(0.23,1,0.32,1), transform 700ms cubic-bezier(0.23,1,0.32,1)',
        ...style,
      }}
    >
      <div className="polaroid-img">
        <img src={src} alt={alt} loading="lazy" />
      </div>
      {caption && <p className="polaroid-caption">{caption}</p>}
    </div>
  )
}

/* ─── Contact form ─── */
function ContactForm() {
  const [sent, setSent] = useState(false)
  const [vals, setVals] = useState({ name: '', email: '', message: '' })

  function handleSubmit(e) {
    e.preventDefault()
    setSent(true)
  }

  if (sent) return (
    <div className="form-success">
      <span className="form-success-icon">✓</span>
      <p>Danke! Wir melden uns bald.</p>
    </div>
  )

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-field">
          <label htmlFor="name">Name</label>
          <input
            id="name" type="text" required placeholder="Dein Name"
            value={vals.name}
            onChange={e => setVals(v => ({ ...v, name: e.target.value }))}
          />
        </div>
        <div className="form-field">
          <label htmlFor="email">E-Mail</label>
          <input
            id="email" type="email" required placeholder="deine@mail.de"
            value={vals.email}
            onChange={e => setVals(v => ({ ...v, email: e.target.value }))}
          />
        </div>
      </div>
      <div className="form-field">
        <label htmlFor="msg">Nachricht</label>
        <textarea
          id="msg" rows={4} required placeholder="Deine Anfrage, Frage oder Feedback…"
          value={vals.message}
          onChange={e => setVals(v => ({ ...v, message: e.target.value }))}
        />
      </div>
      <button type="submit" className="btn-terrain">
        Anfrage senden
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </button>
    </form>
  )
}

/* ─── HOURS DATA ─── */
const HOURS = [
  { day: 'Montag',     dayIdx: 1, closed: true },
  { day: 'Dienstag',   dayIdx: 2, time: '8:00 – 17:00' },
  { day: 'Mittwoch',   dayIdx: 3, time: '8:00 – 17:00' },
  { day: 'Donnerstag', dayIdx: 4, time: '8:00 – 17:00' },
  { day: 'Freitag',    dayIdx: 5, time: '8:00 – 17:00' },
  { day: 'Samstag',    dayIdx: 6, time: '8:00 – 17:00' },
  { day: 'Sonntag',    dayIdx: 0, time: '8:00 – 17:00' },
]

/* ─── MENU ITEMS ─── */
const MENU = [
  { name: 'Classic Everything', desc: 'Cream Cheese, Lachs, rote Zwiebel, Kapern, Dill', price: '8,90 €', tag: 'Klassiker' },
  { name: 'Vegan Garden', desc: 'Vegane Cream Cheese, Avocado, Gurke, Sprossen, Limette', price: '7,90 €', tag: 'Vegan' },
  { name: 'Weekly Special', desc: 'Wechselnder Hausbelag — frag uns heute', price: 'täglich neu', tag: 'Special' },
  { name: 'Plain Bagel', desc: 'Frisch gebacken, pur oder mit Butter', price: '2,50 €', tag: '' },
  { name: 'Filter Coffee', desc: 'Specialty Filterkaffee aus wechselnden Origins', price: '3,20 €', tag: 'Coffee' },
  { name: 'Hausgemachte Limonade', desc: 'Saisonal, täglich frisch — Zitrone, Ingwer, Minze', price: '3,80 €', tag: 'Drinks' },
  { name: 'Flat White', desc: 'Doppelter Espresso mit aufgeschäumter Vollmilch', price: '3,80 €', tag: 'Coffee' },
  { name: 'Avocado Smash Bagel', desc: 'Avocado, Sesam, Chiliflocken, Zitrone, Microgreens', price: '8,50 €', tag: 'Brunch' },
]

/* ═══════════════════════════════════════════════════════════════
   APP
   ═══════════════════════════════════════════════════════════════ */
export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const today = getTodayIndex()

  return (
    <>
      <style>{CSS}</style>

      {/* ── DEMO BANNER ── */}
      <div className="demo-banner">
        Demo von PDSTUDIO · Konzept-Vorschlag für Bagels &amp; Beans
      </div>

      {/* ── NAV ── */}
      <nav className="nav">
        <div className="nav-inner container">
          <a href="#top" className="nav-brand">
            <span className="brand-b">B&amp;B</span>
            <span className="brand-sub">Bagels &amp; Beans</span>
          </a>

          <ul className="nav-links">
            <li><a href="#konzept">Konzept</a></li>
            <li><a href="#karte">Karte</a></li>
            <li><a href="#zeiten">Zeiten</a></li>
            <li><a href="#kontakt">Kontakt</a></li>
          </ul>

          <a href="#kontakt" className="nav-cta">Anfrage stellen</a>

          <button
            className="nav-toggle"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Menü"
          >
            {menuOpen
              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 6L6 18M6 6l12 12"/></svg>
              : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
            }
          </button>
        </div>

        <div className={`mobile-menu${menuOpen ? ' open' : ''}`}>
          {['#konzept','#karte','#zeiten','#kontakt'].map((href, i) => (
            <a key={i} href={href} onClick={() => setMenuOpen(false)}>
              {['Konzept','Karte','Zeiten','Kontakt'][i]}
            </a>
          ))}
          <a href="#kontakt" className="nav-cta" style={{marginTop:'16px', textAlign:'center'}} onClick={() => setMenuOpen(false)}>
            Anfrage stellen
          </a>
        </div>
      </nav>

      <main id="top">

        {/* ── HERO ── */}
        <section className="hero">
          <div className="hero-bg">
            <img src={IMAGES.hero_lifestyle} alt="Bagels & Beans Café Connewitz Leipzig" loading="eager" />
            <div className="hero-bg-overlay" />
          </div>

          <div className="container hero-content">
            <div className="hero-stamp">
              <span>Connewitz · Leipzig</span>
            </div>

            <h1 className="hero-h1">
              Hausgemachte<br />
              <em>Bagels.</em><br />
              <span className="hero-h1-light">Gute Bohnen.</span>
            </h1>

            <div className="hero-meta-row">
              <div className="hero-meta-pill">
                <span className="star">★</span> 4,7 aus 230 Reviews
              </div>
              <div className="hero-meta-pill">
                Di – So · 8 bis 17 Uhr
              </div>
              <div className="hero-meta-pill">
                Connewitz, 04277 Leipzig
              </div>
            </div>

            <div className="hero-ctas">
              <a href="#karte" className="btn-terrain">Zur Karte</a>
              <a href="#kontakt" className="btn-ghost">Anfrage senden</a>
            </div>

            <div className="hero-polaroid-float" aria-hidden="true">
              <Polaroid
                src={IMAGES.dish_top_down}
                alt="Bagel Draufsicht"
                rotate={4}
                caption="Weekly Special"
              />
            </div>
          </div>
        </section>

        {/* ── TRUST STRIP ── */}
        <section className="trust-strip">
          <div className="container trust-inner">
            {[
              ['4,7 ★', '230 Google-Reviews'],
              ['Hausgemacht', 'Täglich frisch gebacken'],
              ['Specialty', 'Single-Origin Coffee'],
              ['Vegan ✓', 'Vegane Cream Cheese immer'],
              ['Di–So', '8–17 Uhr · Mo Ruhetag'],
            ].map(([n, l]) => (
              <div key={n} className="trust-item">
                <span className="trust-n">{n}</span>
                <span className="trust-l">{l}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── KONZEPT / ABOUT ── */}
        <section id="konzept" className="konzept-section">
          <div className="container">
            <div className="konzept-grid">

              <div className="konzept-left">
                <span className="eyebrow">Das Café</span>
                <h2 className="section-h2">
                  Bagels wie sie<br /><em>sein sollten.</em>
                </h2>
                <p className="body-text">
                  In Connewitz, wo die Straßen noch nach Kaffee und Konzerten riechen,
                  backen wir jeden Morgen frische Bagels — nach eigenen Rezepten,
                  mit Zutaten die man kennt.
                </p>
                <p className="body-text">
                  Vegane Cream Cheese aus der eigenen Küche. Filterkaffee
                  aus Bohnen, die wir mögen. Limonaden, die wir selbst trinken würden.
                  Kein Schnickschnack — aber auch kein Kompromiss.
                </p>
                <div className="konzept-tags">
                  {['Bagels','Specialty Coffee','Brunch','Vegan-Optionen','Indie-Vibe'].map(t => (
                    <span key={t} className="tag-chip">{t}</span>
                  ))}
                </div>
              </div>

              <div className="konzept-right">
                <Polaroid
                  src={IMAGES.people_at_work}
                  alt="Team im Café, Bagels zubereiten"
                  rotate={-2}
                  caption="Das Team"
                  style={{ marginBottom: '24px' }}
                />
                <Polaroid
                  src={IMAGES.kitchen}
                  alt="Küche in Bagels & Beans"
                  rotate={3}
                  caption="Unsere Küche"
                  style={{ alignSelf: 'flex-end' }}
                />
              </div>

            </div>
          </div>
        </section>

        {/* ── NEIGHBORHOOD IMAGE ── */}
        <div className="neighborhood-band">
          <div className="neighborhood-img-wrap">
            <img src={IMAGES.neighborhood} alt="Connewitz Leipzig Nachbarschaft" loading="lazy" />
            <div className="neighborhood-overlay">
              <p className="neighborhood-quote">
                "Ein Bagel-Café, das Connewitz verdient."
              </p>
              <span className="neighborhood-sub">Connewitz, Leipzig · seit 2019</span>
            </div>
          </div>
        </div>

        {/* ── KARTE ── */}
        <section id="karte" className="karte-section">
          <div className="container">
            <div className="karte-head">
              <div>
                <span className="eyebrow">Auswahl aus der Karte</span>
                <h2 className="section-h2">Bagels. Kaffee.<br /><em>Und mehr.</em></h2>
              </div>
              <p className="karte-note">
                Karte wechselt saisonal — Weekly Specials immer frisch auf Instagram
              </p>
            </div>

            <div className="karte-grid">
              {MENU.map((item, i) => (
                <MenuCard key={i} item={item} i={i} />
              ))}
            </div>

            <div className="karte-footer-row">
              <p className="body-text" style={{ margin: 0, maxWidth: '48ch' }}>
                Alle Angaben ohne Gewähr. Allergene auf Anfrage. Speisekarte vor Ort.
              </p>
              <a href="#kontakt" className="btn-terrain-sm">Nachfragen</a>
            </div>
          </div>
        </section>

        {/* ── ZEITEN ── */}
        <section id="zeiten" className="zeiten-section">
          <div className="container zeiten-grid">
            <div className="zeiten-left">
              <span className="eyebrow">Öffnungszeiten</span>
              <h2 className="section-h2 h2-light">
                Wir sind da —<br /><em>außer montags.</em>
              </h2>
              <Polaroid
                src={IMAGES.dish_top_down}
                alt="Bagel & Kaffee am Morgen"
                rotate={-3}
                caption="Morgens ab 8 Uhr"
              />
            </div>

            <div className="zeiten-right">
              <ul className="hours-list">
                {HOURS.map(({ day, dayIdx, time, closed }) => {
                  const isToday = dayIdx === today
                  return (
                    <li key={day} className={`hours-row${isToday ? ' today' : ''}${closed ? ' closed' : ''}`}>
                      <span className="hours-day">{day}</span>
                      {isToday && <span className="today-badge">Heute</span>}
                      <span className="hours-time">
                        {closed ? 'Ruhetag' : time}
                      </span>
                    </li>
                  )
                })}
              </ul>
              <p className="body-text" style={{ marginTop: '24px', fontSize: '13px', color: '#8a6a4a' }}>
                Mo Ruhetag · Feiertage können abweichen · Änderungen auf Instagram
              </p>
            </div>
          </div>
        </section>

        {/* ── KONTAKT ── */}
        <section id="kontakt" className="kontakt-section">
          <div className="container kontakt-grid">

            <div className="kontakt-left">
              <span className="eyebrow">Kontakt & Anfragen</span>
              <h2 className="section-h2">
                Schreib uns.<br /><em>Wir antworten.</em>
              </h2>
              <p className="body-text">
                Kein Telefon — aber wir sind per Formular oder Instagram erreichbar.
                Für Catering, Events oder einfach um Hallo zu sagen.
              </p>

              <div className="kontakt-info-cards">
                <div className="info-card">
                  <span className="info-key">Adresse</span>
                  <span className="info-val">Connewitz, 04277 Leipzig</span>
                </div>
                <div className="info-card">
                  <span className="info-key">Öffnungszeiten</span>
                  <span className="info-val">Di – So · 8:00 – 17:00 Uhr</span>
                </div>
                <div className="info-card">
                  <span className="info-key">Instagram</span>
                  <span className="info-val">
                    <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer">
                      @bagelsandbeans
                    </a>
                  </span>
                </div>
              </div>
            </div>

            <div className="kontakt-right">
              <ContactForm />
            </div>
          </div>
        </section>

        {/* ── ANFAHRT ── */}
        <section id="anfahrt" className="anfahrt-section">
          <div className="container">
            <div className="anfahrt-head">
              <span className="eyebrow">Anfahrt</span>
              <h2 className="section-h2">Connewitz,<br /><em>04277 Leipzig.</em></h2>
            </div>
            <div className="map-wrap">
              <iframe
                title="Bagels & Beans Connewitz Leipzig Karte"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2497.8!2d12.3700!3d51.3200!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sConnewitz%2C+04277+Leipzig!5e0!3m2!1sde!2sde!4v1234567890"
                width="100%"
                height="400"
                style={{ border: 0, borderRadius: '12px', filter: 'sepia(20%) contrast(0.95)' }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="anfahrt-chips">
              <span className="chip">🚋 Straßenbahn Linie 9 · Haltestelle Connewitz</span>
              <span className="chip">🚲 Fahrrad-freundlich</span>
              <span className="chip">🅿️ Parkplätze in der Nähe</span>
            </div>
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="container footer-grid">
          <div className="footer-brand-col">
            <div className="footer-brand">Bagels &amp; Beans</div>
            <p className="footer-tag">
              Hausgemachte Bagels, Specialty Coffee und Indie-Vibe
              in Connewitz, Leipzig.
            </p>
            <div className="footer-hours-quick">
              Di – So · 8:00 – 17:00 · Mo Ruhetag
            </div>
          </div>

          <div className="footer-col">
            <h4>Café</h4>
            <ul>
              <li><a href="#konzept">Konzept</a></li>
              <li><a href="#karte">Karte</a></li>
              <li><a href="#zeiten">Öffnungszeiten</a></li>
              <li><a href="#anfahrt">Anfahrt</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Kontakt</h4>
            <ul>
              <li><a href="#kontakt">Anfrage</a></li>
              <li>
                <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer">
                  Instagram
                </a>
              </li>
              <li>Connewitz, 04277 Leipzig</li>
            </ul>
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

        <div className="container footer-bottom">
          <p>© 2024 Bagels &amp; Beans · Connewitz Leipzig</p>
          <p className="footer-pdstudio">
            Erstellt von{' '}
            <a href="https://pdstudio.de" target="_blank" rel="noopener noreferrer">
              PDSTUDIO
            </a>
          </p>
          <span className="footer-demo-badge">Demo · Nicht indexiert</span>
        </div>
      </footer>

      {/* ── LEGAL ANCHORS (hidden) ── */}
      <div id="impressum" style={{position:'absolute',visibility:'hidden'}} aria-hidden="true" />
      <div id="datenschutz" style={{position:'absolute',visibility:'hidden'}} aria-hidden="true" />
      <div id="agb" style={{position:'absolute',visibility:'hidden'}} aria-hidden="true" />
    </>
  )
}

/* ─── Menu card with reveal ─── */
function MenuCard({ item, i }) {
  const [ref, visible] = useReveal(0.1)
  return (
    <div
      ref={ref}
      className="menu-card"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 600ms ${i * 60}ms cubic-bezier(0.23,1,0.32,1), transform 600ms ${i * 60}ms cubic-bezier(0.23,1,0.32,1)`,
      }}
    >
      {item.tag && <span className="menu-card-tag">{item.tag}</span>}
      <p className="menu-card-name">{item.name}</p>
      <p className="menu-card-desc">{item.desc}</p>
      <span className="menu-card-price">{item.price}</span>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   CSS — TERRAIN STYLE
   ═══════════════════════════════════════════════════════════════ */
const CSS = `
/* ─── RESET & BASE ─── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body {
  font-family: 'DM Sans', system-ui, sans-serif;
  background: #f5ede0;
  color: #3a2a15;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}
img { display: block; max-width: 100%; }
a { color: inherit; text-decoration: none; }
button { cursor: pointer; font: inherit; border: none; }
input, textarea, select { font: inherit; }

/* ─── VARS ─── */
:root {
  --sand: #d4a574;
  --olive: #6b7a3a;
  --terra: #c4621a;
  --walnut: #5a3a1f;
  --paper: #f5ede0;
  --paper-dark: #ede1ce;
  --ink: #3a2a15;
  --ink-soft: #6b4f30;
  --ink-mute: #9a7a56;
  --ease: cubic-bezier(0.23,1,0.32,1);
}

.container {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 clamp(20px, 5vw, 48px);
}

/* ─── TYPOGRAPHY ─── */
.eyebrow {
  display: block;
  font-family: 'DM Sans', sans-serif;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--olive);
  margin-bottom: 12px;
}
.section-h2 {
  font-family: 'Playfair Display', serif;
  font-size: clamp(36px, 6vw, 72px);
  font-weight: 700;
  line-height: 1.0;
  letter-spacing: -0.02em;
  color: var(--ink);
  margin-bottom: 24px;
}
.section-h2 em {
  font-style: italic;
  font-weight: 400;
  color: var(--terra);
}
.h2-light { color: var(--walnut); }
.body-text {
  font-size: clamp(15px, 1.3vw, 17px);
  line-height: 1.65;
  color: var(--ink-soft);
  margin-bottom: 16px;
}

/* ─── DEMO BANNER ─── */
.demo-banner {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--walnut);
  color: var(--sand);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-align: center;
  padding: 8px 16px;
  font-family: 'DM Sans', sans-serif;
}

/* ─── NAV ─── */
.nav {
  position: sticky;
  top: 33px;
  z-index: 90;
  background: rgba(245,237,224,0.88);
  backdrop-filter: blur(16px) saturate(130%);
  -webkit-backdrop-filter: blur(16px) saturate(130%);
  border-bottom: 1px solid rgba(90,58,31,0.12);
}
.nav-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  gap: 20px;
}
.nav-brand {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-shrink: 0;
}
.brand-b {
  font-family: 'Playfair Display', serif;
  font-size: 22px;
  font-weight: 700;
  font-style: italic;
  color: var(--terra);
  letter-spacing: -0.01em;
}
.brand-sub {
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-soft);
  letter-spacing: 0.02em;
}
.nav-links {
  display: flex;
  list-style: none;
  gap: clamp(18px, 2.5vw, 32px);
  align-items: center;
}
.nav-links a {
  font-size: 14px;
  font-weight: 500;
  color: var(--ink-soft);
  transition: color 180ms var(--ease);
}
.nav-links a:hover { color: var(--terra); }
.nav-cta {
  display: inline-flex;
  align-items: center;
  height: 38px;
  padding: 0 20px;
  background: var(--terra);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
  border-radius: 6px;
  transition: background 180ms var(--ease), transform 150ms var(--ease);
  flex-shrink: 0;
}
.nav-cta:hover { background: #a8521b; transform: translateY(-1px); }
.nav-toggle {
  display: none;
  background: transparent;
  border: 1.5px solid rgba(90,58,31,0.2);
  border-radius: 6px;
  padding: 8px;
  color: var(--ink);
  align-items: center;
  justify-content: center;
}
@media (max-width: 860px) {
  .nav-links { display: none; }
  .nav-toggle { display: inline-flex; }
}
@media (max-width: 560px) {
  .brand-sub { display: none; }
}
.mobile-menu {
  display: flex;
  flex-direction: column;
  gap: 0;
  background: var(--paper);
  border-top: 1px solid rgba(90,58,31,0.1);
  max-height: 0;
  overflow: hidden;
  transition: max-height 320ms var(--ease);
  padding: 0 clamp(20px,5vw,48px);
}
.mobile-menu.open {
  max-height: 360px;
  padding: 20px clamp(20px,5vw,48px) 28px;
}
.mobile-menu a {
  font-family: 'Playfair Display', serif;
  font-size: 28px;
  font-weight: 700;
  font-style: italic;
  color: var(--ink);
  padding: 10px 0;
  border-bottom: 1px solid rgba(90,58,31,0.1);
  transition: color 180ms var(--ease);
}
.mobile-menu a:hover { color: var(--terra); }

/* ─── BUTTONS ─── */
.btn-terrain {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 52px;
  padding: 0 28px;
  background: var(--terra);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  border-radius: 8px;
  transition: background 180ms var(--ease), transform 150ms var(--ease), box-shadow 180ms var(--ease);
  border: none;
}
.btn-terrain:hover {
  background: #a8521b;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(196,98,26,0.3);
}
.btn-terrain:active { transform: scale(0.98); }
.btn-terrain-sm {
  display: inline-flex;
  align-items: center;
  height: 40px;
  padding: 0 20px;
  background: var(--terra);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  border-radius: 6px;
  transition: background 180ms var(--ease), transform 150ms var(--ease);
}
.btn-terrain-sm:hover { background: #a8521b; transform: translateY(-1px); }
.btn-ghost {
  display: inline-flex;
  align-items: center;
  height: 52px;
  padding: 0 28px;
  background: transparent;
  color: var(--ink);
  font-size: 15px;
  font-weight: 500;
  border-radius: 8px;
  border: 1.5px solid rgba(90,58,31,0.25);
  transition: border-color 180ms var(--ease), background 180ms var(--ease);
}
.btn-ghost:hover {
  border-color: var(--terra);
  background: rgba(196,98,26,0.06);
  color: var(--terra);
}

/* ─── POLAROID ─── */
.polaroid {
  background: #fff;
  padding: 10px 10px 32px;
  box-shadow: 0 4px 18px rgba(58,42,21,0.14), 0 1px 4px rgba(58,42,21,0.08);
  display: inline-block;
  max-width: 320px;
  will-change: transform;
  transition: transform 300ms var(--ease), box-shadow 300ms var(--ease);
}
.polaroid:hover {
  transform: rotate(calc(var(--rot, 0deg) * 0.3)) translateY(-6px) scale(1.02) !important;
  box-shadow: 0 12px 36px rgba(58,42,21,0.2);
}
.polaroid-img {
  width: 100%;
  aspect-ratio: 4/3;
  overflow: hidden;
  background: var(--paper-dark);
}
.polaroid-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 400ms var(--ease);
}
.polaroid:hover .polaroid-img img { transform: scale(1.04); }
.polaroid-caption {
  margin-top: 12px;
  text-align: center;
  font-family: 'Playfair Display', serif;
  font-style: italic;
  font-size: 13px;
  color: var(--ink-mute);
}

/* ─── HERO ─── */
.hero {
  position: relative;
  min-height: calc(100dvh - 97px);
  display: flex;
  align-items: center;
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
  object-position: center 30%;
  filter: brightness(0.62) saturate(0.9);
}
.hero-bg-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(90,58,31,0.72) 0%,
    rgba(90,58,31,0.45) 50%,
    rgba(107,122,58,0.3) 100%
  );
}
.hero-content {
  position: relative;
  z-index: 1;
  padding-top: clamp(56px,8vw,100px);
  padding-bottom: clamp(56px,8vw,100px);
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto auto;
  gap: 32px;
  align-items: start;
}
@media (max-width: 760px) {
  .hero-content { grid-template-columns: 1fr; }
}
.hero-stamp {
  grid-column: 1;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--sand);
}
.hero-stamp::before {
  content: '';
  width: 28px;
  height: 1px;
  background: var(--sand);
  opacity: 0.6;
}
.hero-h1 {
  grid-column: 1;
  font-family: 'Playfair Display', serif;
  font-size: clamp(52px, 10vw, 130px);
  font-weight: 900;
  line-height: 0.95;
  letter-spacing: -0.03em;
  color: #fff;
  text-wrap: balance;
}
.hero-h1 em {
  font-style: italic;
  color: var(--sand);
}
.hero-h1-light {
  display: block;
  font-weight: 400;
  font-style: italic;
  font-size: 0.55em;
  color: rgba(255,255,255,0.72);
}
.hero-meta-row {
  grid-column: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.hero-meta-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 14px;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255,255,255,0.9);
  backdrop-filter: blur(8px);
}
.hero-meta-pill .star { color: var(--sand); }
.hero-ctas {
  grid-column: 1;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.hero-polaroid-float {
  grid-column: 2;
  grid-row: 1 / 5;
  align-self: center;
  padding-top: 40px;
}
@media (max-width: 760px) {
  .hero-polaroid-float { display: none; }
}

/* ─── TRUST STRIP ─── */
.trust-strip {
  background: var(--walnut);
  padding: 28px 0;
  border-top: 2px solid rgba(212,165,116,0.3);
  border-bottom: 2px solid rgba(212,165,116,0.3);
}
.trust-inner {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 24px;
}
.trust-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.trust-n {
  font-family: 'Playfair Display', serif;
  font-size: clamp(22px, 2.5vw, 32px);
  font-weight: 700;
  font-style: italic;
  color: var(--sand);
  line-height: 1;
}
.trust-l {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(212,165,116,0.65);
  max-width: 20ch;
}

/* ─── KONZEPT ─── */
.konzept-section {
  padding: clamp(80px,10vw,140px) 0;
  background: var(--paper);
}
.konzept-grid {
  display: grid;
  grid-template-columns: 5fr 4fr;
  gap: clamp(48px, 7vw, 100px);
  align-items: start;
}
@media (max-width: 860px) {
  .konzept-grid { grid-template-columns: 1fr; }
}
.konzept-left { padding-top: 8px; }
.konzept-right {
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
}
@media (max-width: 860px) {
  .konzept-right { flex-direction: row; flex-wrap: wrap; }
  .konzept-right .polaroid { max-width: calc(50% - 10px); flex: 1; }
}
.konzept-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 24px;
}
.tag-chip {
  height: 30px;
  padding: 0 12px;
  background: rgba(107,122,58,0.1);
  border: 1px solid rgba(107,122,58,0.3);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  color: var(--olive);
  display: inline-flex;
  align-items: center;
}

/* ─── NEIGHBORHOOD BAND ─── */
.neighborhood-band {
  position: relative;
  height: clamp(300px, 50vh, 560px);
  overflow: hidden;
}
.neighborhood-img-wrap {
  position: relative;
  width: 100%;
  height: 100%;
}
.neighborhood-img-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 40%;
  filter: brightness(0.65) saturate(0.85);
}
.neighborhood-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 24px;
  background: linear-gradient(to bottom, rgba(90,58,31,0.25) 0%, rgba(90,58,31,0.5) 100%);
}
.neighborhood-quote {
  font-family: 'Playfair Display', serif;
  font-size: clamp(22px, 4vw, 48px);
  font-style: italic;
  font-weight: 400;
  color: #fff;
  text-wrap: balance;
  margin-bottom: 14px;
  max-width: 22ch;
}
.neighborhood-sub {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--sand);
}

/* ─── KARTE ─── */
.karte-section {
  padding: clamp(80px,10vw,140px) 0;
  background: var(--paper-dark);
}
.karte-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 32px;
  margin-bottom: clamp(48px, 6vw, 72px);
  flex-wrap: wrap;
}
.karte-note {
  font-size: 13px;
  color: var(--ink-mute);
  max-width: 28ch;
  line-height: 1.5;
  font-style: italic;
  text-align: right;
}
@media (max-width: 640px) {
  .karte-head { flex-direction: column; }
  .karte-note { text-align: left; }
}
.karte-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 40px;
}
@media (max-width: 1024px) { .karte-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 480px)  { .karte-grid { grid-template-columns: 1fr; } }
.menu-card {
  background: #fff;
  border: 1px solid rgba(90,58,31,0.1);
  border-radius: 10px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: transform 250ms var(--ease), box-shadow 250ms var(--ease), border-color 250ms var(--ease);
  position: relative;
}
.menu-card:hover {
  transform: translateY(-4px) rotate(-0.5deg);
  box-shadow: 0 10px 28px rgba(90,58,31,0.12);
  border-color: rgba(196,98,26,0.25);
}
.menu-card-tag {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--olive);
  padding: 3px 8px;
  background: rgba(107,122,58,0.1);
  border-radius: 999px;
  align-self: flex-start;
}
.menu-card-name {
  font-family: 'Playfair Display', serif;
  font-size: 17px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1.2;
}
.menu-card-desc {
  font-size: 13px;
  line-height: 1.55;
  color: var(--ink-mute);
  flex: 1;
}
.menu-card-price {
  font-family: 'DM Sans', sans-serif;
  font-size: 15px;
  font-weight: 600;
  color: var(--terra);
  margin-top: 4px;
  align-self: flex-end;
}
.karte-footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding-top: 32px;
  border-top: 1px solid rgba(90,58,31,0.1);
  flex-wrap: wrap;
}

/* ─── ZEITEN ─── */
.zeiten-section {
  padding: clamp(80px,10vw,140px) 0;
  background: var(--paper);
}
.zeiten-grid {
  display: grid;
  grid-template-columns: 4fr 6fr;
  gap: clamp(48px,7vw,100px);
  align-items: start;
}
@media (max-width: 860px) { .zeiten-grid { grid-template-columns: 1fr; } }
.zeiten-left { display: flex; flex-direction: column; gap: 32px; }
.hours-list {
  list-style: none;
  border-top: 1px solid rgba(90,58,31,0.15);
}
.hours-row {
  display: grid;
  grid-template-columns: 130px auto 1fr;
  align-items: center;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid rgba(90,58,31,0.1);
  transition: background 180ms var(--ease);
}
.hours-row.today {
  background: rgba(196,98,26,0.07);
  padding: 14px 12px;
  margin: 0 -12px;
  border-radius: 6px;
}
.hours-row.closed .hours-day { color: var(--ink-mute); }
.hours-row.closed .hours-time { color: var(--ink-mute); font-style: italic; }
.hours-day {
  font-family: 'Playfair Display', serif;
  font-size: 17px;
  font-weight: 700;
  color: var(--ink);
}
.today-badge {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #fff;
  background: var(--terra);
  padding: 3px 8px;
  border-radius: 999px;
  white-space: nowrap;
  justify-self: start;
}
.hours-time {
  font-family: 'DM Sans', sans-serif;
  font-size: 15px;
  font-weight: 500;
  color: var(--ink);
  justify-self: end;
}

/* ─── KONTAKT ─── */
.kontakt-section {
  padding: clamp(80px,10vw,140px) 0;
  background: #ede1ce;
}
.kontakt-grid {
  display: grid;
  grid-template-columns: 5fr 5fr;
  gap: clamp(48px,7vw,96px);
  align-items: start;
}
@media (max-width: 860px) { .kontakt-grid { grid-template-columns: 1fr; } }
.kontakt-info-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 28px;
}
.info-card {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 14px 18px;
  background: rgba(255,255,255,0.55);
  border: 1px solid rgba(90,58,31,0.12);
  border-radius: 8px;
  border-left: 3px solid var(--terra);
}
.info-key {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-mute);
}
.info-val {
  font-family: 'Playfair Display', serif;
  font-size: 16px;
  font-weight: 600;
  color: var(--ink);
}
.info-val a { color: var(--terra); border-bottom: 1px solid rgba(196,98,26,0.3); padding-bottom: 1px; }
.info-val a:hover { border-bottom-color: var(--terra); }

/* ─── FORM ─── */
.contact-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
@media (max-width: 560px) { .form-row { grid-template-columns: 1fr; } }
.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-field label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-soft);
}
.form-field input,
.form-field textarea {
  width: 100%;
  padding: 12px 14px;
  background: rgba(255,255,255,0.75);
  border: 1.5px solid rgba(90,58,31,0.18);
  border-radius: 8px;
  font-size: 15px;
  color: var(--ink);
  transition: border-color 180ms var(--ease), box-shadow 180ms var(--ease);
  outline: none;
  resize: vertical;
}
.form-field input::placeholder,
.form-field textarea::placeholder { color: var(--ink-mute); }
.form-field input:focus,
.form-field textarea:focus {
  border-color: var(--terra);
  box-shadow: 0 0 0 3px rgba(196,98,26,0.12);
}
.form-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px;
  background: rgba(107,122,58,0.08);
  border: 1.5px solid rgba(107,122,58,0.25);
  border-radius: 10px;
  text-align: center;
}
.form-success-icon {
  font-size: 32px;
  color: var(--olive);
}
.form-success p {
  font-family: 'Playfair Display', serif;
  font-size: 20px;
  font-style: italic;
  color: var(--olive);
}

/* ─── ANFAHRT ─── */
.anfahrt-section {
  padding: clamp(64px,8vw,120px) 0;
  background: var(--paper-dark);
}
.anfahrt-head { margin-bottom: 28px; }
.map-wrap { border-radius: 12px; overflow: hidden; }
.anfahrt-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
}
.chip {
  display: inline-flex;
  align-items: center;
  height: 34px;
  padding: 0 14px;
  background: rgba(90,58,31,0.08);
  border: 1px solid rgba(90,58,31,0.14);
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-soft);
}

/* ─── FOOTER ─── */
.footer {
  background: var(--walnut);
  padding: 72px 0 32px;
  border-top: 2px solid rgba(212,165,116,0.2);
}
.footer-grid {
  display: grid;
  grid-template-columns: 2.5fr 1fr 1fr 1fr;
  gap: 40px;
  margin-bottom: 60px;
}
@media (max-width: 860px) { .footer-grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 480px) { .footer-grid { grid-template-columns: 1fr; } }
.footer-brand {
  font-family: 'Playfair Display', serif;
  font-size: 28px;
  font-weight: 700;
  font-style: italic;
  color: var(--sand);
  margin-bottom: 12px;
}
.footer-tag {
  font-size: 14px;
  line-height: 1.6;
  color: rgba(212,165,116,0.65);
  max-width: 34ch;
  margin-bottom: 12px;
}
.footer-hours-quick {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.1em;
  color: rgba(212,165,116,0.5);
  text-transform: uppercase;
}
.footer-col h4 {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(212,165,116,0.5);
  margin-bottom: 16px;
}
.footer-col ul { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.footer-col a,
.footer-col li {
  font-size: 14px;
  color: rgba(212,165,116,0.7);
  transition: color 180ms var(--ease);
}
.footer-col a:hover { color: var(--sand); }
.footer-bottom {
  border-top: 1px solid rgba(212,165,116,0.15);
  padding-top: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.footer-bottom p {
  font-size: 12px;
  color: rgba(212,165,116,0.45);
  margin: 0;
}
.footer-pdstudio {
  font-size: 12px;
  color: rgba(212,165,116,0.55) !important;
}
.footer-pdstudio a {
  color: var(--sand);
  border-bottom: 1px solid rgba(212,165,116,0.3);
  padding-bottom: 1px;
  transition: color 180ms var(--ease), border-color 180ms var(--ease);
}
.footer-pdstudio a:hover { color: #fff; border-bottom-color: #fff; }
.footer-demo-badge {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(212,165,116,0.4);
  padding: 4px 10px;
  border: 1px solid rgba(212,165,116,0.2);
  border-radius: 4px;
}

/* ─── REDUCED MOTION ─── */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
  .polaroid { opacity: 1 !important; transform: rotate(var(--rot, 0deg)) !important; }
}
`
