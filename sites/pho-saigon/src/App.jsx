import { useState, useEffect, useRef } from 'react'

const today = new Date().getDay()

const HOURS = [
  { day: 1, name: 'Montag',     time: '11:30 — 22:00', open: true },
  { day: 2, name: 'Dienstag',   time: '11:30 — 22:00', open: true },
  { day: 3, name: 'Mittwoch',   time: '11:30 — 22:00', open: true },
  { day: 4, name: 'Donnerstag', time: '11:30 — 22:00', open: true },
  { day: 5, name: 'Freitag',    time: '11:30 — 22:00', open: true },
  { day: 6, name: 'Samstag',    time: '11:30 — 22:00', open: true },
  { day: 0, name: 'Sonntag',    time: 'Ruhetag',        open: false },
]

const MENU = [
  { cat: 'pho', name: 'Pho Bo',      sub: 'Rind',      desc: 'Hausgemachte Rinderbrühe (8 Stunden), Reisnudeln, zartes Rindfleisch, Frühlingszwiebeln, Koriander, Chili',       price: '9,50 €', tag: null },
  { cat: 'pho', name: 'Pho Ga',      sub: 'Huhn',      desc: 'Klare Hühnerbrühe, Reisnudeln, saftiges Hähnchenfleisch, frische Kräuter, Limette',                               price: '9,00 €', tag: null },
  { cat: 'pho', name: 'Pho Chay',    sub: 'Vegan',     desc: 'Aromatische Gemüsebrühe, Reisnudeln, Tofu, Pilze, Sojasprossen, frische Kräuter',                                 price: '8,50 €', tag: 'vegan' },
  { cat: 'pho', name: 'Bun Bo Hue',  sub: 'Scharf',    desc: 'Würzige Suppe aus Zentralvietnam, Rinderstelze, Reisnudeln, Zitronengras, Shrimppaste',                           price: '10,50 €', tag: 'scharf' },
  { cat: 'mehr', name: 'Banh Mi Thit', sub: 'Sandwich', desc: 'Vietnamesisches Baguette, gegrilltes Schweinefleisch, eingelegte Möhren & Rettich, Koriander, Chili, Mayonnaise', price: '6,50 €', tag: null },
  { cat: 'mehr', name: 'Banh Mi Chay', sub: 'Vegan',    desc: 'Baguette, gebratener Tofu, Avocado, eingelegte Möhren, Koriander',                                                price: '5,90 €', tag: 'vegan' },
  { cat: 'mehr', name: 'Goi Cuon',    sub: '3 Stück',  desc: 'Frische Sommerrollen: Reispapier, Garnelen, Salat, Reisnudeln, Minze — mit Nuoc Cham',                            price: '5,90 €', tag: null },
  { cat: 'mehr', name: 'Com Tam',     sub: 'Reisgericht', desc: 'Gebrochener Reis, gegrillte Spareribs, Spiegelei, eingelegtes Gemüse, Fischsauce',                              price: '9,90 €', tag: null },
]

const LEGAL = {
  impressum: {
    title: 'Impressum',
    body: `<p><strong>Pho Saigon</strong><br>Karl-Liebknecht-Straße<br>04275 Leipzig</p>
           <p>Verantwortlich für den Inhalt gemäß § 55 Abs. 2 RStV: der Inhaber.</p>
           <p style="font-size:12px;color:var(--ink-mute);margin-top:20px;"><em>Hinweis: Diese Seite ist eine Konzept-Vorschau. Die rechtlich vollständigen Angaben werden vor Live-Schaltung ergänzt.</em></p>`
  },
  datenschutz: {
    title: 'Datenschutz',
    body: `<p>Wir nehmen den Schutz Ihrer personenbezogenen Daten ernst und behandeln diese vertraulich gemäß DSGVO.</p>
           <p><strong>Verantwortlich:</strong> Pho Saigon, Karl-Liebknecht-Straße, 04275 Leipzig.</p>
           <p><strong>Externe Dienste:</strong> Beim Klick auf Bestelloptionen (Lieferando) werden Sie zu externen Partnern weitergeleitet. Es gelten deren Datenschutzbestimmungen.</p>
           <p><strong>Ihre Rechte:</strong> Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung sowie Datenübertragbarkeit.</p>
           <p style="font-size:12px;color:var(--ink-mute);margin-top:20px;"><em>Stand: Konzept-Vorschau.</em></p>`
  },
  agb: {
    title: 'AGB',
    body: `<p><strong>Allgemeine Geschäftsbedingungen — Pho Saigon</strong></p>
           <p><strong>§ 1 Geltungsbereich</strong><br>Diese AGB gelten für alle Verträge zwischen Pho Saigon und seinen Gästen.</p>
           <p><strong>§ 2 Bestellungen</strong><br>Für Bestellungen über externe Partner (Lieferando) gelten zusätzlich deren AGB.</p>
           <p><strong>§ 3 Abholung</strong><br>Bestellungen zur Abholung sind nach Bestätigung der Bereitstellungszeit verbindlich.</p>
           <p style="font-size:12px;color:var(--ink-mute);margin-top:20px;"><em>Stand: Konzept-Vorschau.</em></p>`
  },
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [formSent, setFormSent] = useState(false)
  const [legalModal, setLegalModal] = useState(null)
  const revealRefs = useRef([])
  const addRef = el => { if (el && !revealRefs.current.includes(el)) revealRefs.current.push(el) }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target) }
      }),
      { rootMargin: '-8% 0px -8% 0px', threshold: 0.08 }
    )
    revealRefs.current.forEach(el => el && obs.observe(el))
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!legalModal) return
    document.body.style.overflow = 'hidden'
    const esc = e => { if (e.key === 'Escape') setLegalModal(null) }
    document.addEventListener('keydown', esc)
    return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', esc) }
  }, [legalModal])

  const close = () => setMenuOpen(false)
  const isOpenToday = today !== 0

  return (
    <>
      {/* DEMO BANNER */}
      <div className="demo-banner">
        Demo von PDSTUDIO · Konzept-Vorschlag für Pho Saigon
      </div>

      {/* NAV */}
      <nav className={`nav${scrolled ? ' scrolled' : ''}`}>
        <div className="container nav-inner">
          <a href="#top" className="nav-brand">
            Pho Saigon
            <small>Südvorstadt · Leipzig</small>
          </a>
          <ul className="nav-links">
            <li><a href="#konzept" onClick={close}>Konzept</a></li>
            <li><a href="#karte" onClick={close}>Karte</a></li>
            <li><a href="#zeiten" onClick={close}>Zeiten</a></li>
            <li><a href="#kontakt" onClick={close}>Kontakt</a></li>
          </ul>
          <div className="nav-ctas">
            <a href="https://www.lieferando.de/" target="_blank" rel="noopener" className="nav-cta">
              Online bestellen
            </a>
          </div>
          <button className="nav-toggle" onClick={() => setMenuOpen(o => !o)} aria-label="Menü öffnen">
            {menuOpen
              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
            }
          </button>
        </div>
        <div className={`mobile-menu${menuOpen ? ' open' : ''}`}>
          <a href="#konzept" onClick={close}>Konzept</a>
          <a href="#karte" onClick={close}>Karte</a>
          <a href="#zeiten" onClick={close}>Zeiten</a>
          <a href="#kontakt" onClick={close}>Kontakt</a>
          <div className="mobile-row">
            <a
              href="https://www.lieferando.de/"
              target="_blank"
              rel="noopener"
              className="btn-primary"
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={close}
            >
              Online bestellen
            </a>
          </div>
        </div>
      </nav>

      <main id="top">

        {/* HERO */}
        <section className="hero">
          <div className="hero-img" aria-hidden="true">
            <img
              src="https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=1920&q=85&auto=format&fit=crop"
              alt=""
              loading="eager"
              fetchPriority="high"
            />
          </div>
          <div className="container hero-content">
            <div className="hero-top">
              <span className="eyebrow">
                <span className="eyebrow-line" />
                Vietnamesisch · Südvorstadt Leipzig
              </span>
              <span className="live">
                <span className="pulse" />
                {isOpenToday ? 'Heute geöffnet' : 'Mo – Sa geöffnet'}
              </span>
            </div>

            <div className="hero-main">
              <h1 className="reveal in">
                Echte Pho.
                <span className="light">Acht Stunden Brühe.</span>
              </h1>
            </div>

            <div className="hero-meta-row reveal in">
              <p className="hero-sub">
                Familienbetrieb in der Südvorstadt. Hausgemachte Brühe,
                Banh Mi, frische Sommerrollen — ehrliche vietnamesische
                Küche ohne Schnörkel.
              </p>
              <div className="hero-meta-item">
                <span className="k">Bewertung</span>
                <span className="v">4,5 ★ <small>320 Reviews</small></span>
              </div>
              <div className="hero-meta-item">
                <span className="k">Adresse</span>
                <span className="v">Karl-Liebknecht-Str.<br />04275 Leipzig</span>
              </div>
            </div>

            <div className="hero-ctas">
              <a href="https://www.lieferando.de/" target="_blank" rel="noopener" className="btn-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.98-1.71l1.62-9.29H6"/></svg>
                Online bestellen
              </a>
              <a href="#kontakt" className="btn-ghost">
                Anfrage stellen
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </a>
            </div>
          </div>
        </section>

        {/* TRUST STRIP */}
        <section className="trust">
          <div className="container">
            <div className="trust-row">
              <div className="trust-item">
                <span className="n">4,5 ★</span>
                <span className="l">aus 320 Google-Bewertungen</span>
              </div>
              <div className="trust-item">
                <span className="n">8h</span>
                <span className="l">Pho-Brühe — täglich frisch</span>
              </div>
              <div className="trust-item">
                <span className="n">Mo–Sa</span>
                <span className="l">11:30 bis 22:00 Uhr</span>
              </div>
              <div className="trust-item">
                <span className="n">Südvst.</span>
                <span className="l">Karl-Liebknecht-Str. Leipzig</span>
              </div>
              <div className="trust-item">
                <span className="n">€</span>
                <span className="l">Faire Preise, ehrliche Küche</span>
              </div>
            </div>
          </div>
        </section>

        {/* SHOWCASE 1 — Pho */}
        <div className="showcase" role="img" aria-label="Hausgemachte Pho-Suppe">
          <img
            src="https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80&auto=format&fit=crop"
            alt="Hausgemachte Pho-Suppe, Pho Saigon Leipzig"
            loading="lazy"
          />
          <div className="showcase-text">
            <span className="eyebrow">Die Brühe</span>
            <p>Acht Stunden Knochen, Ingwer, Sternanis, Zimtstange — und kein Pulver.</p>
          </div>
        </div>

        {/* KONZEPT */}
        <section id="konzept">
          <div className="container">
            <div className="manifesto-grid">
              <div className="manifesto-side">
                <span className="eyebrow">Konzept</span>
                <h2 ref={addRef} className="reveal">
                  Familienbetrieb,
                  <em> echte Küche.</em>
                </h2>
                <div ref={addRef} className="manifesto-image reveal">
                  <img
                    src="https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&q=80&auto=format&fit=crop"
                    alt="Innenraum Pho Saigon, Leipzig Südvorstadt"
                    loading="lazy"
                  />
                </div>
              </div>

              <div ref={addRef} className="manifesto-body reveal">
                <p>
                  In der Südvorstadt, an der Karl-Liebknecht-Straße, steht Pho Saigon
                  für das, wofür Stammgäste aus dem ganzen Süden Leipzigs kommen:
                  echte vietnamesische Hausmannskost ohne Abstriche.
                </p>
                <p>
                  Keine lange Karte, keine Fusion-Experimente. Dafür wenige Gerichte,
                  richtig gemacht. Die Pho-Brühe steht acht Stunden auf dem Herd —
                  Knochen, Gewürze, Zeit. Das Banh Mi kommt mit frischen Kräutern und
                  selbstgemachter Mayonnaise. Die Sommerrollen werden täglich frisch gerollt.
                </p>
                <p>
                  Wer einmal hier gegessen hat, kommt wieder. Die 320 Google-Bewertungen
                  mit 4,5 Sternen sprechen eine klare Sprache.
                </p>
                <div className="manifesto-list">
                  <div className="manifesto-item">
                    <div className="k">Brühe</div>
                    <div className="v">8 Stunden gekocht, täglich frisch.</div>
                  </div>
                  <div className="manifesto-item">
                    <div className="k">Karte</div>
                    <div className="v">Klein, ehrlich, handgemacht.</div>
                  </div>
                  <div className="manifesto-item">
                    <div className="k">Stammgäste</div>
                    <div className="v">Seit Jahren dieselben Gesichter.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* KARTE */}
        <section id="karte" className="menu-section">
          <div className="container">
            <div className="menu-head">
              <div>
                <span className="eyebrow" style={{ display: 'block', marginBottom: '18px' }}>Auswahl aus der Karte</span>
                <h2 ref={addRef} className="reveal">
                  Pho, Banh&nbsp;Mi,
                  <em> Klassiker.</em>
                </h2>
              </div>
              <div>
                <a href="https://www.lieferando.de/" target="_blank" rel="noopener" className="btn-ghost" style={{ height: '48px', fontSize: '14px' }}>
                  Auf Lieferando bestellen
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 17L17 7M7 7h10v10"/></svg>
                </a>
              </div>
            </div>

            <div ref={addRef} className="menu-spread reveal">
              <div className="menu-group">
                <div className="menu-group-head">
                  <h3>Pho — Nudelsuppe</h3>
                  <span>Hausgemacht</span>
                </div>
                {MENU.filter(m => m.cat === 'pho').map((item, i) => (
                  <div className="dish" key={i}>
                    <div>
                      <p className="dish-name">
                        {item.name}<em> · {item.sub}</em>
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
                  <h3>Banh Mi &amp; Klassiker</h3>
                  <span>Täglich frisch</span>
                </div>
                {MENU.filter(m => m.cat === 'mehr').map((item, i) => (
                  <div className="dish" key={i}>
                    <div>
                      <p className="dish-name">
                        {item.name}<em> · {item.sub}</em>
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
              <p>Auswahl aus der Karte — vollständige Speisekarte vor Ort oder über Lieferando.</p>
              <a href="https://www.lieferando.de/" target="_blank" rel="noopener" className="btn-primary" style={{ height: '52px', fontSize: '14px' }}>
                Jetzt bestellen
              </a>
            </div>
          </div>
        </section>

        {/* SHOWCASE 2 — Atmosphäre */}
        <div className="showcase" role="img" aria-label="Atmosphäre Pho Saigon">
          <img
            src="https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=1200&q=80&auto=format&fit=crop"
            alt="Warme Atmosphäre, Pho Saigon Leipzig"
            loading="lazy"
          />
          <div className="showcase-text">
            <span className="eyebrow">Atmosphäre</span>
            <p>Kleine Karte, warme Atmosphäre — Abende in der Südvorstadt.</p>
          </div>
        </div>

        {/* ZEITEN */}
        <section id="zeiten" className="hours-section">
          <div className="container">
            <div className="hours-grid">
              <div className="hours-head">
                <span className="eyebrow">Öffnungszeiten</span>
                <h2 ref={addRef} className="reveal">
                  Sechs Tage
                  <em> für Sie da.</em>
                </h2>
                <p className="lead">
                  Montag bis Samstag ab halb zwölf. Sonntag ist Ruhetag.
                </p>
              </div>
              <div className="hours-list">
                {HOURS.map(({ day, name, time, open: isOpenDay }) => (
                  <div key={day} className={`hours-row${today === day ? ' today' : ''}`}>
                    <span className="day">{name}</span>
                    <span className="marker">{today === day ? '· Heute' : ''}</span>
                    <span className={`time${!isOpenDay ? ' closed' : ''}`}>{time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* KONTAKT */}
        <section id="kontakt" className="contact-section">
          <div className="container">
            <div className="contact-grid">
              <div className="contact-side">
                <span className="eyebrow">Kontakt &amp; Anfahrt</span>
                <h2 ref={addRef} className="reveal">
                  Fragen?
                  <em> Schreiben Sie uns.</em>
                </h2>
                <p className="contact-lead">
                  Kein Telefonanschluss verfügbar — Anfragen werden per E-Mail in der Regel
                  noch am selben Tag beantwortet.
                </p>

                <div className="contact-block">
                  <div className="contact-cell">
                    <div className="key">Adresse</div>
                    <div className="val">Karl-Liebknecht-Str.<br />04275 Leipzig<br />Südvorstadt</div>
                  </div>
                  <div className="contact-cell">
                    <div className="key">Öffnungszeiten</div>
                    <div className="val">
                      Mo – Sa<br />11:30 – 22:00 Uhr
                      <small>Sonntag: Ruhetag</small>
                    </div>
                  </div>
                  <div className="contact-cell">
                    <div className="key">Bestellen</div>
                    <div className="val mono">
                      <a href="https://www.lieferando.de/" target="_blank" rel="noopener">Lieferando →</a>
                    </div>
                  </div>
                  <div className="contact-cell">
                    <div className="key">Bewertungen</div>
                    <div className="val mono">
                      4,5 ★ Google
                      <small>320 Bewertungen</small>
                    </div>
                  </div>
                </div>

                {formSent ? (
                  <div className="form-success">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                    <p>Anfrage gesendet. Wir melden uns so bald wie möglich.</p>
                  </div>
                ) : (
                  <form className="contact-form" onSubmit={e => { e.preventDefault(); setFormSent(true) }}>
                    <div className="form-row">
                      <div className="form-field">
                        <label className="form-label">Name</label>
                        <input type="text" className="form-input" placeholder="Max Mustermann" required />
                      </div>
                      <div className="form-field">
                        <label className="form-label">E-Mail</label>
                        <input type="email" className="form-input" placeholder="max@example.de" required />
                      </div>
                    </div>
                    <div className="form-field">
                      <label className="form-label">Nachricht</label>
                      <textarea className="form-input form-textarea" placeholder="Ihre Anfrage..." rows={4} required />
                    </div>
                    <button type="submit" className="btn-primary" style={{ marginTop: '4px' }}>
                      Anfrage senden
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                    </button>
                  </form>
                )}
              </div>

              <div className="contact-map-col">
                <iframe
                  title="Karte Pho Saigon Leipzig"
                  src="https://maps.google.com/maps?q=Karl-Liebknecht-Stra%C3%9Fe+Leipzig&output=embed&hl=de&z=15"
                  width="100%"
                  height="340"
                  style={{ border: 0, borderRadius: 'var(--r-lg)', display: 'block' }}
                  loading="lazy"
                  allowFullScreen
                />
                <div style={{ marginTop: '16px' }}>
                  <a
                    href="https://www.google.com/maps/search/Karl-Liebknecht-Stra%C3%9Fe+Leipzig"
                    target="_blank"
                    rel="noopener"
                    className="btn-ghost"
                    style={{ height: '48px', fontSize: '14px', display: 'inline-flex' }}
                  >
                    In Google Maps öffnen
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 17L17 7M7 7h10v10"/></svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer>
        <div className="container">
          <div className="footer-grid">
            <div>
              <div className="footer-brand">
                Pho Saigon
                <small>Vietnamesisches Restaurant · Leipzig</small>
              </div>
              <p className="footer-tag">
                Hausgemachte Pho-Brühe, Banh Mi und Sommerrollen —
                Familienbetrieb in der Südvorstadt.
              </p>
            </div>
            <div className="footer-col">
              <h4>Angebot</h4>
              <ul>
                <li><a href="#karte">Pho-Suppen</a></li>
                <li><a href="#karte">Banh Mi</a></li>
                <li><a href="#karte">Sommerrollen</a></li>
                <li><a href="https://www.lieferando.de/" target="_blank" rel="noopener">Lieferando</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Besuchen</h4>
              <p><strong>Karl-Liebknecht-Str.</strong></p>
              <p>04275 Leipzig</p>
              <p>Mo – Sa: 11:30 – 22:00</p>
              <p>So: Ruhetag</p>
            </div>
            <div className="footer-col">
              <h4>Rechtliches</h4>
              <ul>
                <li><a href="#impressum" onClick={e => { e.preventDefault(); setLegalModal('impressum') }}>Impressum</a></li>
                <li><a href="#datenschutz" onClick={e => { e.preventDefault(); setLegalModal('datenschutz') }}>Datenschutz</a></li>
                <li><a href="#agb" onClick={e => { e.preventDefault(); setLegalModal('agb') }}>AGB</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>© 2025 Pho Saigon · Karl-Liebknecht-Straße, 04275 Leipzig</p>
            <p>Erstellt von <strong>PDSTUDIO</strong></p>
            <span className="demo-tag">Konzept-Demo</span>
          </div>
        </div>
      </footer>

      {/* LEGAL MODAL */}
      {legalModal && (
        <div
          className="legal-overlay"
          onClick={e => { if (e.target === e.currentTarget) setLegalModal(null) }}
          role="dialog"
          aria-modal="true"
          aria-label={LEGAL[legalModal].title}
        >
          <div className="legal-box">
            <div className="legal-header">
              <h2>{LEGAL[legalModal].title}</h2>
              <button onClick={() => setLegalModal(null)} aria-label="Schließen">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="legal-body" dangerouslySetInnerHTML={{ __html: LEGAL[legalModal].body }} />
          </div>
        </div>
      )}
    </>
  )
}
