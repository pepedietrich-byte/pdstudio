import { useState, useEffect } from 'react'

const HOURS = [
  { day: 'Montag',     jsDay: 1, time: '11:30 — 22:00' },
  { day: 'Dienstag',   jsDay: 2, time: '11:30 — 22:00' },
  { day: 'Mittwoch',   jsDay: 3, time: '11:30 — 22:00' },
  { day: 'Donnerstag', jsDay: 4, time: '11:30 — 22:00' },
  { day: 'Freitag',    jsDay: 5, time: '11:30 — 22:00' },
  { day: 'Samstag',    jsDay: 6, time: '11:30 — 22:00' },
  { day: 'Sonntag',    jsDay: 0, time: 'Ruhetag', closed: true },
]

const LEGAL = {
  impressum: {
    title: 'Impressum',
    body: `<p><strong>Pho Saigon</strong><br>Karl-Liebknecht-Straße<br>04275 Leipzig</p>
           <p>Verantwortlich für den Inhalt gemäß § 55 Abs. 2 RStV: der Inhaber.</p>
           <p style="font-size:12px;opacity:0.55;margin-top:24px;"><em>Diese Seite ist eine Demo-Vorschau, erstellt von PDSTUDIO. Die rechtlich vollständigen Angaben werden vor Livegang ergänzt.</em></p>`,
  },
  datenschutz: {
    title: 'Datenschutz',
    body: `<p>Wir behandeln Ihre Daten vertraulich und entsprechend der DSGVO.</p>
           <p><strong>1. Verantwortlich</strong><br>Pho Saigon, Karl-Liebknecht-Straße, 04275 Leipzig.</p>
           <p><strong>2. Bestellungen über Lieferando</strong><br>Klicken Sie auf Lieferando, werden Sie dorthin weitergeleitet. Es gelten deren Datenschutzbestimmungen.</p>
           <p><strong>3. Ihre Rechte</strong><br>Auskunft, Berichtigung und Löschung gemäß DSGVO Art. 15–17 auf Anfrage.</p>
           <p style="font-size:12px;opacity:0.55;margin-top:24px;"><em>Stand: Demo-Vorschau.</em></p>`,
  },
  agb: {
    title: 'AGB',
    body: `<p><strong>Allgemeine Geschäftsbedingungen — Pho Saigon</strong></p>
           <p><strong>§ 1 Geltungsbereich</strong><br>Diese AGB gelten für alle Verträge zwischen Pho Saigon und seinen Gästen.</p>
           <p><strong>§ 2 Bestellungen über Drittplattformen</strong><br>Für Bestellungen über Lieferando gelten zusätzlich deren AGB.</p>
           <p><strong>§ 3 Abholung</strong><br>Bestellungen zur Abholung sind nach Bestätigung verbindlich.</p>
           <p style="font-size:12px;opacity:0.55;margin-top:24px;"><em>Stand: Demo-Vorschau.</em></p>`,
  },
}

function IconCart() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.97-1.67L23 6H6"/>
    </svg>
  )
}

function IconArrow() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 17L17 7M7 7h10v10"/>
    </svg>
  )
}

function IconClose() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 6l12 12M6 18L18 6"/>
    </svg>
  )
}

function IconMenu() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 6h18M3 12h18M3 18h18"/>
    </svg>
  )
}

function IconX() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 6l12 12M6 18L18 6"/>
    </svg>
  )
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [legalKey, setLegalKey] = useState(null)

  const todayDay = new Date().getDay()
  const todayEntry = HOURS.find(h => h.jsDay === todayDay)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    if (!('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) }
      }),
      { rootMargin: '-8% 0px -8% 0px', threshold: 0.08 }
    )
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setLegalKey(null) }
    if (legalKey) {
      document.addEventListener('keydown', onKey)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [legalKey])

  const closeMenu = () => setMenuOpen(false)
  const openLegal = (key, e) => { e.preventDefault(); setLegalKey(key) }

  return (
    <>
      {/* ── DEMO BANNER ── */}
      <div className="demo-banner" aria-label="Demo-Hinweis">
        <strong>Demo von PDSTUDIO</strong>
        <span className="sep" aria-hidden="true"/>
        <span>Bestellungen nur über Lieferando</span>
      </div>

      {/* ── NAV ── */}
      <nav className={`nav${scrolled ? ' scrolled' : ''}`} role="navigation" aria-label="Hauptnavigation">
        <div className="container nav-inner">
          <a href="#oben" className="nav-brand">
            Pho <em>Saigon</em>
          </a>

          <ul className="nav-links">
            <li><a href="#konzept" onClick={closeMenu}>Konzept</a></li>
            <li><a href="#karte" onClick={closeMenu}>Karte</a></li>
            <li><a href="#zeiten" onClick={closeMenu}>Öffnungszeiten</a></li>
            <li><a href="#anfahrt" onClick={closeMenu}>Anfahrt</a></li>
          </ul>

          <div className="nav-ctas">
            <a
              href="https://www.lieferando.de"
              target="_blank" rel="noopener"
              className="nav-cta"
            >
              <IconCart/> Bestellen
            </a>
          </div>

          <button
            className="nav-toggle"
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Menü schließen' : 'Menü öffnen'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <IconX/> : <IconMenu/>}
          </button>
        </div>

        <div className={`mobile-menu${menuOpen ? ' open' : ''}`} aria-hidden={!menuOpen}>
          <a href="#konzept" onClick={closeMenu}>Konzept</a>
          <a href="#karte" onClick={closeMenu}>Karte</a>
          <a href="#zeiten" onClick={closeMenu}>Öffnungszeiten</a>
          <a href="#anfahrt" onClick={closeMenu}>Anfahrt</a>
          <div className="mob-cta-row">
            <a href="https://www.lieferando.de" target="_blank" rel="noopener" className="nav-cta" onClick={closeMenu}>
              <IconCart/> Auf Lieferando bestellen
            </a>
          </div>
        </div>
      </nav>

      <main id="oben">

        {/* ── HERO ── */}
        <section className="hero">
          <div className="hero-bg" aria-hidden="true">
            <img
              src="https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=1920&q=85&auto=format&fit=crop"
              alt=""
              loading="eager"
              fetchPriority="high"
            />
          </div>
          <div className="container hero-content">
            <div className="hero-top">
              <span className="hero-eyebrow">Vietnamesisch · Südvorstadt Leipzig</span>
              <span className="hero-live" aria-label={todayEntry?.closed ? 'Heute Ruhetag' : 'Heute geöffnet'}>
                <span className="pulse" aria-hidden="true"/>
                {todayEntry?.closed ? 'Heute Ruhetag' : 'Heute geöffnet'}
              </span>
            </div>

            <h1 className="reveal in">
              Acht Stunden Brühe.
              <span className="light">Jeden Tag.</span>
            </h1>

            <div className="hero-meta reveal in">
              <p className="hero-sub">
                Hausgemachte Pho aus acht Stunden Knochenbrühe, knuspriges Banh&nbsp;Mi,
                frische Sommerrollen. Ehrliches vietnamesisches Essen — kein Fusion,
                keine Kompromisse.
              </p>
              <div className="hero-stat">
                <span className="k">Bewertung</span>
                <span className="v">
                  4,5&thinsp;★{' '}
                  <small style={{ fontSize: '11px', color: 'var(--ink-mute)', fontFamily: 'var(--mono)', fontWeight: 400 }}>
                    / 320 Stimmen
                  </small>
                </span>
              </div>
              <div className="hero-stat">
                <span className="k">Adresse</span>
                <span className="v" style={{ fontSize: 'clamp(14px,1.3vw,18px)' }}>
                  Karl-Liebknecht-Str.<br/>04275 Leipzig
                </span>
              </div>
            </div>

            <div className="hero-ctas reveal in">
              <a
                href="https://www.lieferando.de"
                target="_blank" rel="noopener"
                className="btn-primary"
              >
                <IconCart/> Auf Lieferando bestellen
              </a>
              <a href="#karte" className="btn-ghost">
                Zur Karte
              </a>
            </div>
          </div>
        </section>

        {/* ── SHOWCASE — food ── */}
        <section className="showcase" aria-hidden="true">
          <img
            src="https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80&auto=format&fit=crop"
            alt="Hausgemachte Pho-Suppe — Pho Saigon Leipzig"
            loading="lazy"
          />
          <div className="showcase-caption">
            <span className="eyebrow">8 Stunden · Jeden Morgen</span>
            <p>Die Brühe steht vor Sonnenaufgang auf dem Herd. Fertig ist sie, wenn sie bereit ist.</p>
          </div>
        </section>

        {/* ── TRUST STRIP ── */}
        <section className="trust" style={{ padding: 0 }}>
          <div className="container">
            <div className="trust-row">
              <div className="trust-item">
                <span className="n">4,5</span>
                <span className="l">aus 320 Google-Bewertungen</span>
              </div>
              <div className="trust-item">
                <span className="n">8h</span>
                <span className="l">Knochenbrühe täglich</span>
              </div>
              <div className="trust-item">
                <span className="n">Mo–Sa</span>
                <span className="l">11:30 bis 22 Uhr</span>
              </div>
              <div className="trust-item">
                <span className="n">€</span>
                <span className="l">Faire Preise, kein Schnickschnack</span>
              </div>
              <div className="trust-item">
                <span className="n">Lieferando</span>
                <span className="l">Lieferung direkt nach Hause</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── KONZEPT ── */}
        <section id="konzept">
          <div className="container">
            <div className="konzept-grid">

              <div className="konzept-side">
                <span className="eyebrow">Konzept</span>
                <h2 className="reveal">
                  Familiär.
                  <em>Ehrlich. Seit dem ersten Tag.</em>
                </h2>
                <div className="konzept-img reveal">
                  <img
                    src="https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&q=80&auto=format&fit=crop"
                    alt="Interieur — Pho Saigon Leipzig Südvorstadt"
                    loading="lazy"
                  />
                </div>
              </div>

              <div className="konzept-body reveal">
                <p>
                  Pho Saigon ist kein Trend-Restaurant. Es ist ein kleiner, ehrlicher Laden
                  in der Südvorstadt — mit Stammgästen, die seit Jahren kommen, und einer
                  Speisekarte, die sich nicht ändert, weil sie das nicht muss.
                </p>
                <p>
                  Die Pho-Brühe wird jede Nacht angesetzt und acht Stunden geköchelt —
                  mit Rinderknochen, Ingwer, Sternanis und viel Geduld. Das Banh Mi kommt
                  auf frischem Baguette. Die Sommerrollen werden täglich gerollt.
                </p>
                <p>
                  Vietnamesisch kochen heißt: Nichts übertreiben. Die Zutaten sprechen
                  für sich. Das war hier immer so — und bleibt es.
                </p>
                <div className="konzept-facts">
                  <div className="konzept-fact">
                    <div className="k">Brühe</div>
                    <div className="v">8 Stunden täglich gekocht.</div>
                  </div>
                  <div className="konzept-fact">
                    <div className="k">Stil</div>
                    <div className="v">Familiär, kein Fusion.</div>
                  </div>
                  <div className="konzept-fact">
                    <div className="k">Lage</div>
                    <div className="v">Karl-Liebknecht-Str., Südvorstadt.</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── ATMOSPHÄRE STRIP ── */}
        <section className="atmo-strip" aria-hidden="true">
          <img
            src="https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=1200&q=80&auto=format&fit=crop"
            alt="Atmosphäre Pho Saigon Leipzig"
            loading="lazy"
          />
          <div className="atmo-text">
            <span className="eyebrow">Südvorstadt · Leipzig</span>
            <p>
              Ein kleiner Laden. Wenige Tische.<br/>
              Stammgäste, die wiederkommen — seit Jahren.
            </p>
          </div>
        </section>

        {/* ── KARTE ── */}
        <section id="karte" className="menu-section">
          <div className="container">

            <div className="menu-head">
              <div>
                <span className="eyebrow" style={{ display: 'block', marginBottom: '16px' }}>Die Karte</span>
                <h2 className="reveal">
                  Pho, Banh&nbsp;Mi,
                  <em>Sommerrollen.</em>
                </h2>
              </div>
              <div>
                <a
                  href="https://www.lieferando.de"
                  target="_blank" rel="noopener"
                  className="btn-ghost"
                  style={{ height: '46px', fontSize: '14px' }}
                >
                  Auf Lieferando bestellen <IconArrow/>
                </a>
              </div>
            </div>

            <div className="menu-demo-note">
              <span className="demo-dot" aria-hidden="true"/>
              Demo-Karte · Aktuelle Preise und Auswahl direkt auf Lieferando
            </div>

            <div className="menu-spread">

              {/* Linke Spalte: Pho */}
              <div className="menu-group">
                <div className="menu-group-head">
                  <h3>Pho — Suppen</h3>
                  <span>Hauptspeisen</span>
                </div>

                <div className="dish">
                  <div>
                    <p className="dish-name">Pho Bo</p>
                    <p className="dish-desc">8h-Rinderknochenbrühe, Rindfleischscheiben, Beansprouts, Thai-Basilikum, Zitrone, Chili.</p>
                  </div>
                  <span className="dish-price">9,90 €</span>
                </div>

                <div className="dish">
                  <div>
                    <p className="dish-name">Pho Ga</p>
                    <p className="dish-desc">Helle Hühnerbrühe, zarte Hähnchenstreifen, Frühlingszwiebeln, Koriander.</p>
                  </div>
                  <span className="dish-price">8,90 €</span>
                </div>

                <div className="dish">
                  <div>
                    <p className="dish-name">
                      Pho Chay <span className="dish-tag">vegan</span>
                    </p>
                    <p className="dish-desc">Aromatische Gemüsebrühe, gebratener Tofu, Shiitake-Pilze, Kräuter, Glasnudeln.</p>
                  </div>
                  <span className="dish-price">8,50 €</span>
                </div>

                <div className="dish">
                  <div>
                    <p className="dish-name">Bun Bo Nam Bo</p>
                    <p className="dish-desc">Kalte Reisnudeln, Rindfleisch aus dem Wok, Gurke, Möhre, Erdnüsse, Fischsauce-Dressing.</p>
                  </div>
                  <span className="dish-price">10,90 €</span>
                </div>
              </div>

              {/* Rechte Spalte: Banh Mi & Vorspeisen */}
              <div className="menu-group">
                <div className="menu-group-head">
                  <h3>Banh Mi & Vorspeisen</h3>
                  <span>Snacks & Starter</span>
                </div>

                <div className="dish">
                  <div>
                    <p className="dish-name">
                      Banh Mi Thit <span className="dish-tag">Klassiker</span>
                    </p>
                    <p className="dish-desc">Knuspriges Baguette, Schweinebauch, eingelegte Möhre & Rettich, Koriander, Jalapeño.</p>
                  </div>
                  <span className="dish-price">5,50 €</span>
                </div>

                <div className="dish">
                  <div>
                    <p className="dish-name">
                      Banh Mi Tofu <span className="dish-tag">vegan</span>
                    </p>
                    <p className="dish-desc">Gebackener Tofu, Avocado, Sriracha-Mayo, eingelegte Möhre, Koriander.</p>
                  </div>
                  <span className="dish-price">5,00 €</span>
                </div>

                <div className="dish">
                  <div>
                    <p className="dish-name">Goi Cuon — Sommerrollen</p>
                    <p className="dish-desc">3 frische Sommerrollen, Garnelen, Reisnudeln, Minze, Salat — mit Erdnuss-Dip.</p>
                  </div>
                  <span className="dish-price">6,50 €</span>
                </div>

                <div className="dish">
                  <div>
                    <p className="dish-name">Cha Gio — Frühlingsrollen</p>
                    <p className="dish-desc">4 knusprig gebratene Rollen, Schwein & Glasnudeln, Nuoc-Cham-Sauce.</p>
                  </div>
                  <span className="dish-price">5,90 €</span>
                </div>
              </div>

            </div>

            <div className="menu-foot reveal">
              <p>
                Vollständige Speisekarte, Tages-Specials und aktuelle Preise auf Lieferando.
                Allergenliste auf Anfrage im Restaurant erhältlich.
              </p>
              <a
                href="https://www.lieferando.de"
                target="_blank" rel="noopener"
                className="btn-primary"
                style={{ height: '50px', fontSize: '14px' }}
              >
                <IconCart/> Jetzt bestellen
              </a>
            </div>

          </div>
        </section>

        {/* ── ÖFFNUNGSZEITEN ── */}
        <section id="zeiten" className="hours-section">
          <div className="container">
            <div className="hours-grid">

              <div className="hours-head">
                <span className="eyebrow">Öffnungszeiten</span>
                <h2 className="reveal">
                  Sechs Tage.
                  <em>Sonntag Ruhe.</em>
                </h2>
                <p className="lead">
                  Montag bis Samstag ab 11:30 Uhr. Sonntags hat die Küche
                  — und das Team — frei.
                </p>
              </div>

              <div className="hours-list" aria-label="Öffnungszeiten">
                {HOURS.map(({ day, jsDay, time, closed }) => (
                  <div
                    key={jsDay}
                    className={[
                      'hours-row',
                      jsDay === todayDay ? 'today' : '',
                      closed ? 'ruhetag' : '',
                    ].filter(Boolean).join(' ')}
                  >
                    <span className="day">{day}</span>
                    <span className="marker">{jsDay === todayDay ? '· Heute' : ''}</span>
                    <span className="time">{time}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </section>

        {/* ── ANFAHRT & KONTAKT ── */}
        <section id="anfahrt" className="contact-section">
          <div className="container">
            <div className="contact-grid">

              <div className="contact-side">
                <span className="eyebrow">Anfahrt &amp; Kontakt</span>
                <h2 className="reveal">
                  Karl-Liebknecht-Str.
                  <em>Mitten in der Südvorstadt.</em>
                </h2>
                <p className="lead">
                  Direkt an der Straßenbahnlinie. Fußläufig vom Karl-Liebknecht-Platz
                  und der Innenstadt. Parkplätze in der Straße vorhanden.
                </p>

                <div className="contact-block">
                  <div className="contact-cell">
                    <div className="key">Adresse</div>
                    <div className="val">Karl-Liebknecht-Str.<br/>04275 Leipzig</div>
                  </div>
                  <div className="contact-cell">
                    <div className="key">Telefon</div>
                    <div className="val mono" style={{ color: 'var(--ink-mute)' }}>
                      Nicht öffentlich
                    </div>
                  </div>
                  <div className="contact-cell">
                    <div className="key">Heute</div>
                    <div className="val mono">{todayEntry?.time ?? '—'}</div>
                  </div>
                  <div className="contact-cell">
                    <div className="key">Bestellen</div>
                    <div className="val mono">
                      <a href="https://www.lieferando.de" target="_blank" rel="noopener">
                        Lieferando
                      </a>
                    </div>
                  </div>
                </div>

                <a
                  href="https://www.lieferando.de"
                  target="_blank" rel="noopener"
                  className="btn-primary"
                >
                  <IconCart/> Auf Lieferando bestellen
                </a>
              </div>

              <div>
                <div className="map-frame">
                  <iframe
                    src="https://maps.google.com/maps?q=Karl-Liebknecht-Stra%C3%9Fe+04275+Leipzig&output=embed"
                    title="Pho Saigon auf Google Maps"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                  <div className="map-frame-footer">
                    <a
                      href="https://maps.google.com/?q=Karl-Liebknecht-Stra%C3%9Fe+04275+Leipzig"
                      target="_blank" rel="noopener"
                      className="map-link"
                    >
                      In Google Maps öffnen <IconArrow/>
                    </a>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer>
        <div className="container">
          <div className="footer-grid">

            <div>
              <div className="footer-brand">Pho <em>Saigon</em></div>
              <div className="footer-sub">Vietnamesisch · Leipzig-Südvorstadt</div>
              <p className="footer-desc">
                Hausgemachte Pho-Brühe, Banh Mi und Sommerrollen.
                Karl-Liebknecht-Straße, 04275 Leipzig.
                Montag bis Samstag ab 11:30 Uhr.
              </p>
            </div>

            <div className="footer-col">
              <h4>Besuch</h4>
              <ul>
                <li>
                  <p><strong>Karl-Liebknecht-Str.</strong></p>
                  <p className="foot-mute">04275 Leipzig</p>
                </li>
                <li>
                  <p><strong>Mo – Sa</strong></p>
                  <p className="foot-mute">11:30 – 22:00 Uhr</p>
                </li>
                <li>
                  <p><strong>Sonntag</strong></p>
                  <p className="foot-mute">Ruhetag</p>
                </li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Erleben</h4>
              <ul>
                <li><a href="#konzept">Konzept</a></li>
                <li><a href="#karte">Speisekarte</a></li>
                <li><a href="#zeiten">Öffnungszeiten</a></li>
                <li><a href="#anfahrt">Anfahrt</a></li>
                <li>
                  <a href="https://www.lieferando.de" target="_blank" rel="noopener">
                    Lieferando
                  </a>
                </li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Rechtliches</h4>
              <ul>
                <li><a href="#impressum" onClick={(e) => openLegal('impressum', e)}>Impressum</a></li>
                <li><a href="#datenschutz" onClick={(e) => openLegal('datenschutz', e)}>Datenschutz</a></li>
                <li><a href="#agb" onClick={(e) => openLegal('agb', e)}>AGB</a></li>
                <li><a href="#anfahrt">Kontakt</a></li>
              </ul>
            </div>

          </div>

          <div className="footer-bottom">
            <p>© 2026 Pho Saigon · Karl-Liebknecht-Str., 04275 Leipzig · Erstellt von PDSTUDIO</p>
            <span className="footer-badge">Demo · noindex</span>
          </div>
        </div>
      </footer>

      {/* ── LEGAL MODAL ── */}
      {legalKey && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={LEGAL[legalKey].title}
          onClick={(e) => { if (e.target === e.currentTarget) setLegalKey(null) }}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'oklch(0.18 0.075 46 / 0.88)',
            backdropFilter: 'blur(16px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
            animation: 'fadeIn 220ms cubic-bezier(0.23,1,0.32,1) both',
          }}
        >
          <div style={{
            background: 'var(--brand-rich)',
            border: '1px solid var(--line-strong)',
            borderRadius: 'var(--r-lg)',
            maxWidth: '600px', width: '100%',
            maxHeight: '84vh', overflowY: 'auto',
            padding: 'clamp(24px,4vw,36px)',
            animation: 'slideUp 280ms cubic-bezier(0.23,1,0.32,1) both',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px', gap: '20px' }}>
              <h2 style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: '32px', letterSpacing: '-0.025em', margin: 0, color: 'var(--ink)' }}>
                {LEGAL[legalKey].title}
              </h2>
              <button
                onClick={() => setLegalKey(null)}
                aria-label="Schließen"
                style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'transparent', border: '1px solid var(--line-strong)', color: 'var(--ink)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                <IconClose/>
              </button>
            </div>
            <div
              style={{ color: 'var(--ink-soft)', fontSize: '14.5px', lineHeight: '1.68' }}
              dangerouslySetInnerHTML={{ __html: LEGAL[legalKey].body }}
            />
          </div>
        </div>
      )}
    </>
  )
}
