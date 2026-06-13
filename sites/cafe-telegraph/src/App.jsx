import { useState, useEffect } from 'react'
import './App.css'

const HOURS = [
  { label: 'Montag',             open: '8:30', close: '18:00', jsDay: 1 },
  { label: 'Dienstag',           open: '8:30', close: '18:00', jsDay: 2 },
  { label: 'Mittwoch',           open: '8:30', close: '18:00', jsDay: 3 },
  { label: 'Donnerstag',         open: '8:30', close: '18:00', jsDay: 4 },
  { label: 'Freitag',            open: '8:30', close: '18:00', jsDay: 5 },
  { label: 'Samstag — Brunch',   open: '9:30', close: '18:00', jsDay: 6 },
  { label: 'Sonntag — Brunch',   open: '9:30', close: '18:00', jsDay: 0 },
]

const MENU = [
  {
    category: 'Spezialitätenkaffee',
    items: [
      {
        name: 'Filter Single-Origin',
        desc: 'Täglich wechselnder Ursprung — handgepflückt, schonend geröstet. Aktuell: Ethiopia Washed.',
        price: '3,50 €',
        tag: '',
      },
      {
        name: 'Cappuccino',
        desc: 'Doppelter Espresso, fein aufgeschäumte Vollmilch. Classic.',
        price: '3,80 €',
        tag: '',
      },
      {
        name: 'Matcha Latte',
        desc: 'Zeremonieller Matcha aus Uji, aufgeschäumter Haferdrink.',
        price: '4,50 €',
        tag: 'vegan',
      },
    ],
  },
  {
    category: 'Patisserie & Brunch',
    items: [
      {
        name: 'Hausgemachter Cookie',
        desc: 'Täglich frisch gebacken — Zartbitter-Schoko, Haselnuss oder Cranberry.',
        price: '2,50 €',
        tag: '',
      },
      {
        name: 'Kuchen des Tages',
        desc: 'Saisonal, hausgemacht, immer im Wechsel. Fragen lohnt sich.',
        price: '4,50 €',
        tag: '',
      },
      {
        name: 'Avocado auf Sauerteig',
        desc: 'Geröstetes Roggensauerteigbrot, Avocado, Chiliflocken, Limette, Fleur de Sel.',
        price: '9,50 €',
        tag: 'vegan',
      },
      {
        name: 'Granola Bowl',
        desc: 'Hausgemachtes Granola, griechischer Joghurt, saisonale Früchte, Honig.',
        price: '7,50 €',
        tag: 'vegan möglich',
      },
      {
        name: 'Sonntags-Brunch',
        desc: 'Der vollständige Telegraph-Tisch — nur sonntags, ab 9:30 Uhr.',
        price: '16,50 €',
        tag: 'Sonntag',
      },
    ],
  },
]

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [formSent, setFormSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const today = new Date().getDay()

  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in') }),
      { threshold: 0.1, rootMargin: '0px 0px -24px 0px' }
    )
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const close = () => setMenuOpen(false)

  const handleSubmit = e => {
    e.preventDefault()
    setFormSent(true)
  }

  const update = field => e => setForm(f => ({ ...f, [field]: e.target.value }))

  return (
    <>
      {/* ── DEMO BANNER ─────────────────────────────────────────── */}
      <div className="demo-banner" role="banner">
        Demo von PDSTUDIO · Konzept-Vorschlag für Café Telegraph
      </div>

      {/* ── NAV ─────────────────────────────────────────────────── */}
      <nav className="nav" aria-label="Hauptnavigation">
        <div className="nav-inner container">
          <a href="#top" className="nav-brand" onClick={close}>
            Café Telegraph
          </a>

          <ul className="nav-links" role="list">
            <li><a href="#konzept" onClick={close}>Konzept</a></li>
            <li><a href="#karte" onClick={close}>Karte</a></li>
            <li><a href="#zeiten" onClick={close}>Zeiten</a></li>
            <li><a href="#anfahrt" onClick={close}>Anfahrt</a></li>
          </ul>

          <a href="#kontakt" className="nav-cta" onClick={close}>Anfragen</a>

          <button
            className={`nav-toggle${menuOpen ? ' open' : ''}`}
            onClick={() => setMenuOpen(v => !v)}
            aria-label={menuOpen ? 'Menü schließen' : 'Menü öffnen'}
            aria-expanded={menuOpen}
          >
            <span className="nav-toggle-bar" />
            <span className="nav-toggle-bar" />
            <span className="nav-toggle-bar" />
          </button>
        </div>
      </nav>

      {/* ── MOBILE MENU ──────────────────────────────────────────── */}
      <div
        className={`mobile-menu${menuOpen ? ' open' : ''}`}
        aria-hidden={!menuOpen}
      >
        <a href="#konzept" className="mobile-menu-link" onClick={close}>Konzept</a>
        <a href="#karte" className="mobile-menu-link" onClick={close}>Karte</a>
        <a href="#zeiten" className="mobile-menu-link" onClick={close}>Zeiten</a>
        <a href="#anfahrt" className="mobile-menu-link" onClick={close}>Anfahrt</a>
        <a href="#kontakt" className="mobile-menu-cta" onClick={close}>Anfragen</a>
      </div>

      <main id="top">
        {/* ── HERO TEXT ───────────────────────────────────────────── */}
        <section className="hero-text" aria-labelledby="hero-heading">
          <div className="container">
            <div className="hero-meta-row">
              <span className="eyebrow" style={{ margin: 0 }}>
                Café · Brunch · Spezialitätenkaffee · Patisserie
              </span>
              <span className="eyebrow" style={{ margin: 0 }}>
                Plagwitz · Leipzig
              </span>
            </div>

            <h1 className="hero-headline" id="hero-heading">
              <em>Café</em>
              Telegraph.
            </h1>

            <div className="hero-sub-row">
              <p className="hero-sub">
                Indie-Café im Herzen von Plagwitz. Single-Origin-Filterkaffee,
                hausgemachte Kuchen und Patisserie, offene Atmosphäre —
                und sonntags der Brunch, auf den die halbe Nachbarschaft wartet.
              </p>
              <div className="hero-stats">
                <div className="stat">
                  <span className="stat-n">4,6 ★</span>
                  <span className="stat-l">480 Google-Reviews</span>
                </div>
                <div className="stat">
                  <span className="stat-n">€€</span>
                  <span className="stat-l">Plagwitz · 04229</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── HERO IMAGE — full bleed ──────────────────────────────── */}
        <div className="full-bleed reveal">
          <img
            src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1920&q=85&auto=format&fit=crop"
            alt="Café Telegraph — helles Café-Interieur mit Holztischen und Tageslicht, Plagwitz Leipzig"
            width="1920"
            height="1080"
            loading="eager"
            decoding="async"
            className="full-bleed-img"
          />
        </div>

        {/* ── TRUST STRIP ─────────────────────────────────────────── */}
        <section className="trust" aria-label="Eckdaten">
          <div className="container">
            <div className="trust-row">
              <div className="trust-item">
                <span className="trust-n">4,6 ★</span>
                <span className="trust-l">aus 480 Bewertungen</span>
              </div>
              <div className="trust-item">
                <span className="trust-n">Mo – So</span>
                <span className="trust-l">täglich geöffnet</span>
              </div>
              <div className="trust-item">
                <span className="trust-n">Single-Origin</span>
                <span className="trust-l">Spezialitätenkaffee</span>
              </div>
              <div className="trust-item">
                <span className="trust-n">Vegan</span>
                <span className="trust-l">Optionen auf der Karte</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── ABOUT / KONZEPT ─────────────────────────────────────── */}
        <section id="konzept" className="about" aria-labelledby="konzept-heading">
          <div className="container">
            <div className="about-grid">

              <div className="about-text">
                <span className="eyebrow reveal">Konzept</span>
                <h2 className="section-title reveal" id="konzept-heading">
                  Ein Ort zum<br />
                  <em>Verweilen.</em>
                </h2>
                <p className="about-lead reveal reveal-delay-1">
                  Das Café Telegraph liegt im Herzen von Plagwitz — einem Viertel,
                  das einst Industriegeschichte schrieb und heute Kreativität
                  und Lebensfreude atmet.
                </p>
                <p className="about-body reveal reveal-delay-2">
                  Wir glauben, dass ein guter Kaffee Zeit braucht. Unsere Filterkaffees
                  kommen von kleinen Spezialitätsröstereien, wechseln mit der Saison
                  und werden so serviert, wie sie am besten schmecken — in Ruhe,
                  ohne Hektik.
                </p>
                <p className="about-body reveal reveal-delay-3">
                  Hausgemachte Cookies, Kuchen aus frischen Zutaten, und am Wochenende
                  unser Sonntags-Brunch. Kommen Sie mit Freunden, mit einem Buch,
                  mit Ihrem Laptop — oder einfach so.
                </p>
                <div className="about-tags reveal">
                  <span className="tag">Spezialitätenkaffee</span>
                  <span className="tag">Hausgemacht</span>
                  <span className="tag">Plagwitz</span>
                  <span className="tag">Magazine-Vibe</span>
                  <span className="tag">Weltoffen</span>
                </div>
              </div>

              <div className="about-image reveal">
                <img
                  src="https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=900&q=80&auto=format&fit=crop"
                  alt="Barista bereitet Filterkaffee mit Sorgfalt zu — Café Telegraph Plagwitz"
                  width="900"
                  height="1200"
                  loading="lazy"
                  decoding="async"
                />
              </div>

            </div>
          </div>
        </section>

        {/* ── ENVIRONMENT IMAGE — full bleed with quote ────────────── */}
        <div className="full-bleed environment-bleed reveal">
          <img
            src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80&auto=format&fit=crop"
            alt="Kaffeezubereitung im Café Telegraph — Dripper, heißes Wasser, Single-Origin-Kaffee"
            width="1200"
            height="800"
            loading="lazy"
            decoding="async"
            className="full-bleed-img"
          />
          <div className="env-overlay" aria-hidden="true">
            <div className="env-quote">
              <blockquote>
                „Kaffee, der eine Geschichte erzählt."
              </blockquote>
              <cite>Single-Origin Filter · täglich frisch</cite>
            </div>
          </div>
        </div>

        {/* ── KARTE ───────────────────────────────────────────────── */}
        <section id="karte" className="karte" aria-labelledby="karte-heading">
          <div className="container">
            <div className="karte-head">
              <span className="eyebrow reveal">Auswahl aus der Karte</span>
              <h2 className="section-title reveal" id="karte-heading">
                Was uns<br />
                <em>auszeichnet.</em>
              </h2>
              <p className="karte-lead reveal">
                Unsere Karte wechselt mit dem Angebot der Saison. Was bleibt:
                hausgemachte Qualität, ehrliche Zutaten und echte vegane Optionen —
                keine Kompromisse.
              </p>
            </div>

            {MENU.map(group => (
              <div key={group.category} className="menu-group">
                <div className="menu-group-head reveal">
                  <h3>{group.category}</h3>
                  <div className="menu-divider" aria-hidden="true" />
                </div>
                <div className="menu-items" role="list">
                  {group.items.map(item => (
                    <div key={item.name} className="menu-item reveal" role="listitem">
                      <div>
                        <p className="menu-item-name">
                          {item.name}
                          {item.tag && <span className="item-tag">{item.tag}</span>}
                        </p>
                        <p className="menu-item-desc">{item.desc}</p>
                      </div>
                      <span className="menu-item-price">{item.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <p className="karte-note reveal">
              Preise inkl. MwSt. · Karte kann saisonal variieren ·
              Allergene und Unverträglichkeiten auf Nachfrage
            </p>
          </div>
        </section>

        {/* ── PRODUCT CLOSE-UP — full bleed ───────────────────────── */}
        <div className="full-bleed product-bleed reveal">
          <img
            src="https://images.unsplash.com/photo-1551024601-bec78aea704b?w=900&q=80&auto=format&fit=crop"
            alt="Hausgemachte Patisserie im Café Telegraph — frische Kuchen und Süßgebäck aus eigener Herstellung"
            width="900"
            height="600"
            loading="lazy"
            decoding="async"
            className="full-bleed-img"
          />
          <div className="product-caption" aria-hidden="true">
            <span className="eyebrow">Patisserie</span>
            <p>Täglich frisch.<br />Immer hausgemacht.</p>
          </div>
        </div>

        {/* ── ÖFFNUNGSZEITEN ──────────────────────────────────────── */}
        <section id="zeiten" className="zeiten" aria-labelledby="zeiten-heading">
          <div className="container">
            <div className="zeiten-grid">

              <div className="zeiten-head">
                <span className="eyebrow reveal">Öffnungszeiten</span>
                <h2 className="section-title reveal" id="zeiten-heading">
                  Sieben&nbsp;Tage<br />
                  <em>für&nbsp;Sie&nbsp;da.</em>
                </h2>
                <p className="zeiten-note reveal">
                  Mo – Fr ab 8:30 Uhr<br />
                  Sa + So Brunch ab 9:30 Uhr<br /><br />
                  Küche bis 17:30 Uhr
                </p>
              </div>

              <div className="hours-list" role="list">
                {HOURS.map(h => (
                  <div
                    key={h.jsDay}
                    className={`hours-row${h.jsDay === today ? ' today' : ''}`}
                    role="listitem"
                    aria-current={h.jsDay === today ? 'true' : undefined}
                  >
                    <span className="hours-day">{h.label}</span>
                    {h.jsDay === today && (
                      <span className="hours-marker">Heute</span>
                    )}
                    <span className="hours-time">{h.open} – {h.close}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </section>

        {/* ── KONTAKT ─────────────────────────────────────────────── */}
        <section id="kontakt" className="kontakt" aria-labelledby="kontakt-heading">
          <div className="container">
            <div className="kontakt-grid">

              <div>
                <span className="eyebrow reveal">Kontakt</span>
                <h2 className="section-title reveal" id="kontakt-heading">
                  Schreiben<br />
                  <em>Sie&nbsp;uns.</em>
                </h2>
                <p className="kontakt-text reveal">
                  Für Fragen zu Veranstaltungen, Catering, Kooperationen oder
                  wenn Sie einfach etwas wissen möchten — wir freuen uns auf
                  Ihre Nachricht und melden uns zeitnah.
                </p>
                <div className="kontakt-info reveal">
                  <div className="kontakt-cell">
                    <span className="kontakt-key">Adresse</span>
                    <span className="kontakt-val">Plagwitz, 04229 Leipzig</span>
                  </div>
                  <div className="kontakt-cell">
                    <span className="kontakt-key">Online</span>
                    <span className="kontakt-val">
                      <a
                        href="https://www.instagram.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="kontakt-link"
                        aria-label="Café Telegraph auf Instagram"
                      >
                        Instagram
                      </a>
                    </span>
                  </div>
                </div>
              </div>

              <div className="kontakt-form-wrap reveal">
                {formSent ? (
                  <div className="form-success" role="status" aria-live="polite">
                    <div className="form-success-mark" aria-hidden="true">✓</div>
                    <p>
                      Vielen Dank für Ihre Nachricht.<br />
                      Wir melden uns in Kürze.
                    </p>
                  </div>
                ) : (
                  <form
                    className="kontakt-form"
                    onSubmit={handleSubmit}
                    noValidate
                    aria-label="Kontaktformular"
                  >
                    <div className="form-row">
                      <div className="form-field">
                        <label htmlFor="ct-name">Name</label>
                        <input
                          id="ct-name"
                          type="text"
                          value={form.name}
                          onChange={update('name')}
                          placeholder="Ihr Name"
                          required
                          autoComplete="name"
                        />
                      </div>
                      <div className="form-field">
                        <label htmlFor="ct-email">E-Mail</label>
                        <input
                          id="ct-email"
                          type="email"
                          value={form.email}
                          onChange={update('email')}
                          placeholder="ihre@email.de"
                          required
                          autoComplete="email"
                        />
                      </div>
                    </div>
                    <div className="form-field">
                      <label htmlFor="ct-message">Nachricht</label>
                      <textarea
                        id="ct-message"
                        value={form.message}
                        onChange={update('message')}
                        placeholder="Wie können wir Ihnen helfen?"
                        rows={5}
                        required
                      />
                    </div>
                    <button type="submit" className="form-submit">
                      <span>Nachricht senden</span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        aria-hidden="true"
                      >
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </button>
                  </form>
                )}
              </div>

            </div>
          </div>
        </section>

        {/* ── ANFAHRT ─────────────────────────────────────────────── */}
        <section id="anfahrt" className="anfahrt" aria-labelledby="anfahrt-heading">
          <div className="container">
            <div className="anfahrt-head reveal">
              <span className="eyebrow">Anfahrt</span>
              <h2 className="section-title-sm" id="anfahrt-heading">
                Plagwitz,<br />
                <em>04229 Leipzig.</em>
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--ink-mute)', margin: 0, letterSpacing: '0.03em' }}>
                Gut erreichbar mit Tram 14 · Haltestelle Karl-Heine-Straße / Zschochersche Straße
              </p>
            </div>
          </div>
          <div className="map-wrap">
            <iframe
              title="Café Telegraph Standort — Plagwitz Leipzig"
              src="https://www.openstreetmap.org/export/embed.html?bbox=12.308%2C51.317%2C12.352%2C51.342&layer=mapnik&marker=51.3297%2C12.3296"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </section>

        {/* ── FOOTER ──────────────────────────────────────────────── */}
        <footer className="footer">
          <div className="container">
            <div className="footer-top">
              <div>
                <span className="footer-name">Café Telegraph</span>
                <span className="footer-place">Plagwitz · Leipzig · Sachsen</span>
              </div>
              <div className="footer-cols">
                <div className="footer-col">
                  <h4>Öffnungszeiten</h4>
                  <p>Mo – Fr: 8:30 – 18:00</p>
                  <p>Sa + So: 9:30 – 18:00</p>
                  <p style={{ marginTop: '4px', fontSize: '12px', opacity: 0.65 }}>
                    Sonntags-Brunch
                  </p>
                </div>
                <div className="footer-col">
                  <h4>Adresse</h4>
                  <p>Plagwitz<br />04229 Leipzig<br />Deutschland</p>
                </div>
                <div className="footer-col">
                  <h4>Navigation</h4>
                  <ul>
                    <li><a href="#konzept">Konzept</a></li>
                    <li><a href="#karte">Karte</a></li>
                    <li><a href="#zeiten">Öffnungszeiten</a></li>
                    <li><a href="#kontakt">Kontakt</a></li>
                    <li><a href="#anfahrt">Anfahrt</a></li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="footer-bottom">
              <p>© {new Date().getFullYear()} Café Telegraph</p>
              <p className="footer-credit">
                Erstellt von{' '}
                <a href="https://pdstudio.de" target="_blank" rel="noopener noreferrer">
                  PDSTUDIO
                </a>
              </p>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <a href="#impressum" style={{ fontSize: '11px', letterSpacing: '0.1em', color: 'rgba(247,243,238,0.3)' }}>
                  Impressum
                </a>
                <a href="#datenschutz" style={{ fontSize: '11px', letterSpacing: '0.1em', color: 'rgba(247,243,238,0.3)' }}>
                  Datenschutz
                </a>
                <a href="#agb" style={{ fontSize: '11px', letterSpacing: '0.1em', color: 'rgba(247,243,238,0.3)' }}>
                  AGB
                </a>
                <span className="demo-tag">Demo</span>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </>
  )
}
