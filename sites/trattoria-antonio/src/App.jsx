import { useState, useEffect } from 'react';

const HOURS = [
  { day: 'Montag',     d: 1, time: '17:30 — 23:00', open: true  },
  { day: 'Dienstag',   d: 2, time: '17:30 — 23:00', open: true  },
  { day: 'Mittwoch',   d: 3, time: '17:30 — 23:00', open: true  },
  { day: 'Donnerstag', d: 4, time: '17:30 — 23:00', open: true  },
  { day: 'Freitag',    d: 5, time: '17:30 — 23:00', open: true  },
  { day: 'Samstag',    d: 6, time: '17:30 — 23:00', open: true  },
  { day: 'Sonntag',    d: 0, time: 'Ruhetag',        open: false },
];

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', datum: '', zeit: '18:00', personen: '2', nachricht: '',
  });
  const [sent, setSent] = useState(false);
  const today = new Date().getDay();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); }),
      { threshold: 0.08, rootMargin: '0px 0px -32px 0px' }
    );
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 900px)');
    const handler = e => { if (e.matches) setMenuOpen(false); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleSubmit = e => { e.preventDefault(); setSent(true); };

  const todayOpen = today !== 0;
  const minDate = new Date().toISOString().split('T')[0];

  return (
    <>
      {/* ── DEMO BANNER ── */}
      <div className="demo-banner" role="note">
        <span className="demo-dot" aria-hidden="true" />
        Demo von PDSTUDIO · Konzept-Vorschlag für Trattoria Antonio
        <span className="demo-dot" aria-hidden="true" />
      </div>

      {/* ── NAV ── */}
      <nav className="nav" aria-label="Hauptnavigation">
        <div className="container nav-inner">
          <a href="#top" className="nav-brand">
            Trattoria
            <span className="nav-brand-dot" aria-hidden="true" />
            Antonio
          </a>

          <ul className="nav-links" role="list">
            <li><a href="#konzept">Konzept</a></li>
            <li><a href="#karte">Karte</a></li>
            <li><a href="#zeiten">Zeiten</a></li>
            <li><a href="#anfahrt">Anfahrt</a></li>
          </ul>

          <div className="nav-ctas">
            <a href="#karte" className="nav-cta-ghost">Die Karte</a>
            <a href="#reservierung" className="nav-cta">Reservieren</a>
          </div>

          <button
            className="nav-toggle"
            aria-label={menuOpen ? 'Menü schließen' : 'Menü öffnen'}
            aria-expanded={menuOpen}
            aria-controls="mobileMenu"
            onClick={() => setMenuOpen(o => !o)}
          >
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 18L18 6M6 6l12 12"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 6h18M3 12h18M3 18h18"/>
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* ── MOBILE MENU ── */}
      <div
        id="mobileMenu"
        className={`mobile-menu${menuOpen ? ' open' : ''}`}
        aria-hidden={!menuOpen}
      >
        <a href="#konzept" onClick={() => setMenuOpen(false)}>Konzept</a>
        <a href="#karte" onClick={() => setMenuOpen(false)}>Die Karte</a>
        <a href="#zeiten" onClick={() => setMenuOpen(false)}>Zeiten</a>
        <a href="#anfahrt" onClick={() => setMenuOpen(false)}>Anfahrt</a>
        <div className="mobile-menu-row">
          <a href="#reservierung" className="nav-cta" onClick={() => setMenuOpen(false)}>
            Tisch reservieren
          </a>
        </div>
      </div>

      <main id="top">

        {/* ── HERO ── */}
        <section className="hero">

          {/* Rotating element — CINNABAR signature */}
          <div className="hero-rotate" aria-hidden="true">
            <img
              src="https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=1920&q=85&auto=format&fit=crop"
              alt=""
              loading="eager"
              decoding="async"
            />
          </div>

          <div className="container">
            <div className="hero-top">
              <span className="eyebrow">Italienisch · Plagwitz · Leipzig</span>
              <span className="hero-live">
                <span className="pulse" aria-hidden="true" />
                {todayOpen ? 'Heute ab 17:30' : 'Heute Ruhetag'}
              </span>
            </div>

            <div className="hero-main">
              <h1 className="reveal in">
                Hausgemachte&nbsp;Pasta.
                <span className="hero-h1-light">Wie in der Familie.</span>
              </h1>
            </div>

            <div className="hero-meta-row reveal in">
              <p className="hero-sub">
                Familiäre Trattoria in Plagwitz. Pasta täglich frisch gezogen,
                Teig von Hand, Sauce nach Hausrezept — der Ort, zu dem
                Stammgäste aus dem ganzen Westen Leipzigs zurückkehren.
              </p>

              <div className="hero-meta-item">
                <span className="k">Bewertung</span>
                <span className="v">
                  4,5 ★ <small>/ 290 Reviews</small>
                </span>
              </div>

              <div className="hero-meta-item">
                <span className="k">Adresse</span>
                <span className="v">Plagwitz<br />04229 Leipzig</span>
              </div>
            </div>

            <div className="hero-ctas reveal in">
              <a href="#reservierung" className="btn-primary">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <path d="M16 2v4M8 2v4M3 10h18"/>
                </svg>
                Tisch reservieren
              </a>
              <a href="#karte" className="btn-ghost">
                Die Karte
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M5 12h14M13 6l6 6-6 6"/>
                </svg>
              </a>
            </div>
          </div>
        </section>

        {/* ── TRUST STRIP ── */}
        <section className="trust" style={{ padding: '32px 0' }}>
          <div className="container">
            <div className="trust-row">
              <div className="trust-item">
                <span className="n">4,5</span>
                <span className="l">aus 290 Google-Bewertungen</span>
              </div>
              <div className="trust-item">
                <span className="n">6</span>
                <span className="l">Tage die Woche geöffnet</span>
              </div>
              <div className="trust-item">
                <span className="n">100%</span>
                <span className="l">Pasta täglich frisch gemacht</span>
              </div>
              <div className="trust-item">
                <span className="n">€€</span>
                <span className="l">Familiäre Trattoria-Preise</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── SHOWCASE — full-bleed ── */}
        <div className="showcase">
          <img
            src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=85&auto=format&fit=crop"
            alt="Stimmungsvolle Atmosphäre eines klassischen italienischen Restaurants"
            loading="lazy"
          />
          <div className="showcase-text">
            <span className="eyebrow">Tradizione · Autentica</span>
            <p>Nicht schnell. Nicht laut. Nur gut — und immer von Hand.</p>
          </div>
        </div>

        {/* ── KONZEPT / ABOUT ── */}
        <section id="konzept">
          <div className="container">
            <div className="konzept-grid">

              <div className="konzept-img reveal">
                <img
                  src="https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&q=80&auto=format&fit=crop"
                  alt="Warmes Ambiente: Holztische, gedimmtes Licht in der Trattoria Antonio"
                  loading="lazy"
                />
              </div>

              <div className="konzept-body">
                <span className="eyebrow">Konzept</span>
                <h2 className="reveal">
                  Eine Trattoria<br /><em>wie früher.</em>
                </h2>

                <div className="konzept-text reveal">
                  <p>
                    Die Trattoria Antonio ist kein Restaurantkonzept — sie ist ein Ort.
                    Ein kleines Lokal in Plagwitz, das weiß, wer seine Gäste sind und
                    was sie wollen: echte Pasta, ruhige Abende, vertraute Gesichter.
                  </p>
                  <p>
                    Pasta wird täglich von Hand gezogen. Die Saucen köcheln nach
                    Hausrezept, die Weine kommen aus kleinen italienischen Weingütern,
                    und die Pizza folgt dem neapolitanischen Grundsatz: Teig, Tomate,
                    Mozzarella — fertig.
                  </p>
                </div>

                <div className="konzept-list reveal">
                  <div className="konzept-item">
                    <div className="k">Pasta</div>
                    <div className="v">Täglich frisch, von Hand geformt.</div>
                  </div>
                  <div className="konzept-item">
                    <div className="k">Pizza</div>
                    <div className="v">Neapolitanisch, dünn, authentisch.</div>
                  </div>
                  <div className="konzept-item">
                    <div className="k">Wein</div>
                    <div className="v">Ausgewählte Karte aus Italien.</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── KARTE / MENU ── */}
        <section id="karte" className="menu-section">
          <div className="container">

            <div className="menu-head">
              <span className="eyebrow" style={{ display: 'block', marginBottom: '16px' }}>
                Auswahl aus der Karte
              </span>
              <h2 className="reveal">
                Pasta&nbsp;e&nbsp;Pizza,
                <em>fatto a&nbsp;mano.</em>
              </h2>
            </div>

            {/* Signature dish strip */}
            <div className="menu-signature reveal">
              <div className="menu-signature-img">
                <img
                  src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=900&q=80&auto=format&fit=crop"
                  alt="Hausgemachte Tagliatelle al Ragù — das Signature-Gericht der Trattoria Antonio"
                  loading="lazy"
                />
              </div>
              <div className="menu-signature-text">
                <span className="eyebrow">Signature</span>
                <h3>Tagliatelle <em>al Ragù.</em></h3>
                <p>
                  Hausgemachte Tagliatelle, stundenlang geschmortes Rinderhack
                  nach Hausrezept, Pecorino Romano, frischer Basilikum.
                  Das Gericht, wegen dem Stammgäste jede Woche wiederkommen.
                </p>
                <div className="menu-sig-meta">
                  <span className="price">ab 14,–</span>
                  <span className="tag">Hausgemacht</span>
                  <span className="tag">Täglich frisch</span>
                </div>
              </div>
            </div>

            {/* Menu grid */}
            <div className="menu-spread">

              <div className="menu-group">
                <div className="menu-group-head">
                  <h3>Pasta</h3>
                  <span>Hausgemacht</span>
                </div>

                <div className="dish">
                  <div>
                    <p className="dish-name">Tagliatelle al Ragù</p>
                    <p className="dish-desc">Stundenlang geschmortes Rinderhack, San-Marzano-Tomaten, Parmesan.</p>
                  </div>
                  <span className="dish-price">14,–</span>
                </div>

                <div className="dish">
                  <div>
                    <p className="dish-name">Spaghetti Carbonara</p>
                    <p className="dish-desc">Guanciale, Pecorino Romano, Eigelb, viel schwarzer Pfeffer.</p>
                  </div>
                  <span className="dish-price">13,–</span>
                </div>

                <div className="dish">
                  <div>
                    <p className="dish-name">
                      Pappardelle ai Funghi
                      <span className="dish-tag">vegetarisch</span>
                    </p>
                    <p className="dish-desc">Waldpilze, Butter, Knoblauch, Thymian, Parmesan.</p>
                  </div>
                  <span className="dish-price">13,–</span>
                </div>

                <div className="dish">
                  <div>
                    <p className="dish-name">
                      Risotto del Giorno
                      <span className="dish-tag">tägl. wechselnd</span>
                    </p>
                    <p className="dish-desc">Saisonal, nach Marktlage — fragen Sie Ihren Kellner.</p>
                  </div>
                  <span className="dish-price">15,–</span>
                </div>
              </div>

              <div className="menu-group">
                <div className="menu-group-head">
                  <h3>Pizza & Antipasti</h3>
                  <span>Classico</span>
                </div>

                <div className="dish">
                  <div>
                    <p className="dish-name">Margherita</p>
                    <p className="dish-desc">San-Marzano-Tomate, Fior di Latte, frischer Basilikum.</p>
                  </div>
                  <span className="dish-price">10,–</span>
                </div>

                <div className="dish">
                  <div>
                    <p className="dish-name">Diavola</p>
                    <p className="dish-desc">Tomate, Mozzarella, scharfe Salami, Peperoncino.</p>
                  </div>
                  <span className="dish-price">12,–</span>
                </div>

                <div className="dish">
                  <div>
                    <p className="dish-name">Bruschetta al Pomodoro</p>
                    <p className="dish-desc">Geröstetes Weißbrot, Kirschtomaten, Basilikum, Olivenöl.</p>
                  </div>
                  <span className="dish-price">7,–</span>
                </div>

                <div className="dish">
                  <div>
                    <p className="dish-name">Tiramisù della Casa</p>
                    <p className="dish-desc">Hausgemacht, täglich frisch. Mascarpone, Savoiardi, Espresso.</p>
                  </div>
                  <span className="dish-price">7,–</span>
                </div>
              </div>

            </div>

            <div className="menu-note">
              <p>
                Vollständige Karte mit Antipasti, Secondi, Dolci und italienischer
                Weinkarte direkt im Lokal. Preise sind Richtwerte für diesen Konzept-Vorschlag.
              </p>
              <a href="#reservierung" className="btn-primary" style={{ height: '48px', fontSize: '14px' }}>
                Tisch reservieren
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
                  Abends für&nbsp;Sie&nbsp;da.
                  <em>Montag bis Samstag.</em>
                </h2>
                <p className="lead">
                  Ab 17:30 Uhr geöffnet. Sonntag ist Ruhetag —
                  für die Küche und für die Familie.
                </p>
              </div>

              <div className="hours-list">
                {HOURS.map(({ day, d, time, open }) => (
                  <div
                    key={d}
                    className={`hours-row${today === d ? ' today' : ''}`}
                    data-day={d}
                  >
                    <span className="day">{day}</span>
                    <span className="marker">{today === d ? 'Heute' : ''}</span>
                    <span className={`time${!open ? ' closed' : ''}`}>{time}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </section>

        {/* ── RESERVIERUNG / KONTAKT ── */}
        <section id="reservierung" className="reservation-section">
          {/* Atmosphere image as background */}
          <div className="reservation-bg" aria-hidden="true">
            <img
              src="https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200&q=80&auto=format&fit=crop"
              alt=""
              loading="lazy"
            />
          </div>

          <div className="container">
            <div className="reservation-grid">

              <div className="reservation-head">
                <span className="eyebrow">Reservierung</span>
                <h2 className="reveal">
                  Tisch reservieren
                  <em>bei Antonio.</em>
                </h2>
                <p className="lead reveal">
                  Füllen Sie das Formular aus — wir melden uns zeitnah
                  zur Bestätigung Ihres Tisches. Für Gruppen ab 8&nbsp;Personen
                  bitte vorab anfragen.
                </p>
                <div className="reservation-info reveal">
                  <div className="res-info-item">
                    <span className="k">Öffnungszeiten</span>
                    <span className="v">Mo – Sa · 17:30 – 23:00</span>
                  </div>
                  <div className="res-info-item">
                    <span className="k">Adresse</span>
                    <span className="v">Plagwitz · 04229 Leipzig</span>
                  </div>
                  <div className="res-info-item">
                    <span className="k">Kontakt</span>
                    <span className="v">Per Reservierungsformular</span>
                  </div>
                </div>
              </div>

              <div className="reservation-form-wrap reveal">
                {sent ? (
                  <div className="form-success">
                    <div className="form-success-icon" aria-hidden="true">
                      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="9"/>
                        <path d="M8 12l3 3 5-5"/>
                      </svg>
                    </div>
                    <h3>Anfrage gesendet</h3>
                    <p>
                      Vielen Dank! Wir melden uns in Kürze zur Bestätigung
                      Ihres Tisches bei der Trattoria Antonio.
                    </p>
                    <button className="btn-ghost-sm" onClick={() => setSent(false)}>
                      Neue Anfrage
                    </button>
                  </div>
                ) : (
                  <form className="reservation-form" onSubmit={handleSubmit} noValidate>
                    <div className="form-row">
                      <div className="form-field">
                        <label htmlFor="res-name" className="form-label">Name</label>
                        <input
                          type="text" id="res-name" name="name"
                          className="form-input" placeholder="Ihr Name"
                          value={form.name} onChange={handleChange}
                          required autoComplete="name"
                        />
                      </div>
                      <div className="form-field">
                        <label htmlFor="res-email" className="form-label">E-Mail</label>
                        <input
                          type="email" id="res-email" name="email"
                          className="form-input" placeholder="ihre@email.de"
                          value={form.email} onChange={handleChange}
                          required autoComplete="email"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-field">
                        <label htmlFor="res-datum" className="form-label">Datum</label>
                        <input
                          type="date" id="res-datum" name="datum"
                          className="form-input"
                          value={form.datum} onChange={handleChange}
                          required min={minDate}
                        />
                      </div>
                      <div className="form-field">
                        <label htmlFor="res-zeit" className="form-label">Uhrzeit</label>
                        <select
                          id="res-zeit" name="zeit"
                          className="form-input form-select"
                          value={form.zeit} onChange={handleChange}
                        >
                          {['17:30','18:00','18:30','19:00','19:30','20:00','20:30','21:00','21:30','22:00'].map(t => (
                            <option key={t} value={t}>{t} Uhr</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-field">
                      <label htmlFor="res-personen" className="form-label">Anzahl Personen</label>
                      <select
                        id="res-personen" name="personen"
                        className="form-input form-select"
                        value={form.personen} onChange={handleChange}
                      >
                        {[1,2,3,4,5,6,7,8].map(n => (
                          <option key={n} value={n}>{n} {n === 1 ? 'Person' : 'Personen'}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-field">
                      <label htmlFor="res-nachricht" className="form-label">
                        Nachricht <span className="form-optional">(optional)</span>
                      </label>
                      <textarea
                        id="res-nachricht" name="nachricht"
                        className="form-input form-textarea"
                        placeholder="Besondere Wünsche, Allergien, Anlass…"
                        value={form.nachricht} onChange={handleChange}
                        rows={3}
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn-primary"
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      Tisch reservieren
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M5 12h14M13 6l6 6-6 6"/>
                      </svg>
                    </button>

                    <p className="form-note">
                      Demo-Seite · Keine echte Reservierung wird übermittelt
                    </p>
                  </form>
                )}
              </div>

            </div>
          </div>
        </section>

        {/* ── ANFAHRT ── */}
        <section id="anfahrt" className="anfahrt-section">
          <div className="container">
            <div className="anfahrt-grid">

              <div className="anfahrt-info">
                <span className="eyebrow">Anfahrt</span>
                <h2 className="reveal">
                  So finden<br /><em>Sie uns.</em>
                </h2>
                <div className="anfahrt-details reveal">
                  <div className="anfahrt-item">
                    <span className="k">Stadtteil</span>
                    <span className="v">Plagwitz · Leipzig West</span>
                  </div>
                  <div className="anfahrt-item">
                    <span className="k">Postleitzahl</span>
                    <span className="v">04229 Leipzig</span>
                  </div>
                  <div className="anfahrt-item">
                    <span className="k">Straßenbahn</span>
                    <span className="v">Linie 14 · Karl-Heine-Straße</span>
                  </div>
                  <div className="anfahrt-item">
                    <span className="k">Parken</span>
                    <span className="v">Parkplätze im Viertel verfügbar</span>
                  </div>
                </div>
                <a
                  href="#anfahrt"
                  className="btn-ghost"
                  style={{ marginTop: '28px', display: 'inline-flex' }}
                >
                  In Google Maps öffnen
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M7 17L17 7M7 7h10v10"/>
                  </svg>
                </a>
              </div>

              <div className="anfahrt-map reveal">
                <iframe
                  title="Karte: Trattoria Antonio Plagwitz Leipzig"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=12.31%2C51.32%2C12.35%2C51.34&layer=mapnik"
                  width="100%"
                  height="100%"
                  loading="lazy"
                  allowFullScreen
                />
              </div>

            </div>
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer>
        <div className="container">
          <div className="footer-grid">

            <div className="footer-brand-col">
              <div className="footer-brand">Trattoria<br />Antonio</div>
              <p className="footer-tag">
                Familiäre italienische Trattoria in Plagwitz, Leipzig.
                Hausgemachte Pasta, neapolitanische Pizza, gepflegte Weinkarte.
              </p>
              <div className="footer-hours-short">
                <span className="k">Mo – Sa · 17:30 – 23:00 Uhr</span>
                <span className="k">Sonntag · Ruhetag</span>
              </div>
            </div>

            <div className="footer-col">
              <h4>Navigation</h4>
              <ul role="list">
                <li><a href="#konzept">Konzept</a></li>
                <li><a href="#karte">Die Karte</a></li>
                <li><a href="#zeiten">Öffnungszeiten</a></li>
                <li><a href="#reservierung">Reservierung</a></li>
                <li><a href="#anfahrt">Anfahrt</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Rechtliches</h4>
              <ul role="list">
                <li><a href="#impressum">Impressum</a></li>
                <li><a href="#datenschutz">Datenschutz</a></li>
                <li><a href="#agb">AGB</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Kontakt</h4>
              <p>Plagwitz<br />04229 Leipzig</p>
              <p>Reservierung über das<br />Kontaktformular.</p>
            </div>

          </div>

          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} Trattoria Antonio · Alle Rechte vorbehalten</p>
            <p className="footer-pdstudio">
              Erstellt von <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>PDSTUDIO</strong>
            </p>
            <span className="footer-demo-tag">Demo · Konzept-Vorschlag</span>
          </div>
        </div>
      </footer>
    </>
  );
}
