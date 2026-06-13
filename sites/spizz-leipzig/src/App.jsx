import { useState, useEffect, useRef } from 'react'

// ─── Tokens ───────────────────────────────────────────────────────────────────
const C = {
  bg:      '#08090f',
  surface: '#0f1018',
  card:    '#141520',
  gold:    '#c9850a',
  goldLt:  '#e8a020',
  cream:   '#f0e8d5',
  ink:     '#ede8e0',
  inkSoft: '#a09880',
  inkMute: '#6a6354',
  line:    'rgba(201,133,10,0.15)',
  lineStr: 'rgba(201,133,10,0.28)',
}

const IMG = {
  hero:     'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1920&q=85&auto=format&fit=crop',
  interior: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&q=80&auto=format&fit=crop',
  cocktail: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=800&q=80&auto=format&fit=crop',
  food:     'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80&auto=format&fit=crop',
  stage:    'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=1200&q=80&auto=format&fit=crop',
}

function useReveal() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.12 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return [ref, visible]
}

function Reveal({ children, delay = 0, style = {} }) {
  const [ref, visible] = useReveal()
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(22px)',
      transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
      ...style,
    }}>
      {children}
    </div>
  )
}

function DemoBanner() {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      background: C.gold, color: '#08090f',
      fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
      textAlign: 'center', padding: '7px 16px',
      fontFamily: 'monospace',
    }}>
      DEMO · Diese Website ist eine Demo-Präsentation von PDSTUDIO ·{' '}
      <a href="https://spizz.de" target="_blank" rel="noopener" style={{ color: '#08090f', textDecoration: 'underline' }}>
        Echte Seite: spizz.de
      </a>
    </div>
  )
}

function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])
  const links = [
    { label: 'Konzept', href: '#konzept' },
    { label: 'Karte', href: '#karte' },
    { label: 'Öffnungszeiten', href: '#zeiten' },
    { label: 'Anfahrt', href: '#anfahrt' },
  ]
  return (
    <nav style={{
      position: 'fixed', top: 32, left: 0, right: 0, zIndex: 900,
      background: scrolled ? 'rgba(8,9,15,0.92)' : 'transparent',
      backdropFilter: scrolled ? 'blur(18px)' : 'none',
      borderBottom: scrolled ? `1px solid ${C.line}` : 'none',
      transition: 'all 0.3s ease',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(20px,4vw,40px)', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="#top" style={{ textDecoration: 'none' }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, color: C.cream, lineHeight: 1 }}>Spizz</div>
          <div style={{ fontSize: 9, letterSpacing: '0.26em', color: C.gold, fontWeight: 600, marginTop: 2 }}>JAZZ BAR · RESTAURANT</div>
        </a>
        <div className="nav-d" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          {links.map(l => (
            <a key={l.label} href={l.href} style={{ fontSize: 13, color: C.inkSoft, textDecoration: 'none', letterSpacing: '0.04em', fontWeight: 500, transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = C.cream}
              onMouseLeave={e => e.target.style.color = C.inkSoft}
            >{l.label}</a>
          ))}
          <a href="tel:034196080430" style={{ padding: '9px 22px', background: C.gold, color: '#08090f', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textDecoration: 'none', borderRadius: 2, transition: 'background 0.2s' }}
            onMouseEnter={e => e.target.style.background = C.goldLt}
            onMouseLeave={e => e.target.style.background = C.gold}
          >ANRUFEN</a>
        </div>
        <button onClick={() => setOpen(v => !v)} className="nav-m" style={{ display: 'none', background: 'none', border: `1px solid ${C.lineStr}`, borderRadius: 4, padding: '8px 12px', cursor: 'pointer', color: C.cream, fontSize: 16 }}>
          {open ? '✕' : '☰'}
        </button>
      </div>
      {open && (
        <div style={{ background: 'rgba(8,9,15,0.98)', borderTop: `1px solid ${C.line}`, padding: '24px clamp(20px,4vw,40px) 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {links.map(l => <a key={l.label} href={l.href} onClick={() => setOpen(false)} style={{ fontSize: 20, fontFamily: 'Georgia,serif', color: C.cream, textDecoration: 'none' }}>{l.label}</a>)}
          <a href="tel:034196080430" onClick={() => setOpen(false)} style={{ padding: '14px 0', background: C.gold, color: '#08090f', fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textDecoration: 'none', borderRadius: 2, textAlign: 'center', marginTop: 8 }}>ANRUFEN</a>
        </div>
      )}
      <style>{`@media(max-width:768px){.nav-d{display:none!important}.nav-m{display:flex!important}}`}</style>
    </nav>
  )
}

function Hero() {
  const [angle, setAngle] = useState(0)
  useEffect(() => {
    const id = requestAnimationFrame(function tick() {
      setAngle(a => (a + 0.15) % 360)
      requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <section id="top" style={{ position: 'relative', minHeight: '100svh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${IMG.hero})`, backgroundSize: 'cover', backgroundPosition: 'center 30%' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(8,9,15,.88) 0%,rgba(8,9,15,.5) 55%,rgba(8,9,15,.78) 100%)' }} />
      <div style={{ position: 'absolute', right: '-10vw', top: '50%', transform: `translateY(-50%) rotate(${angle}deg)`, width: 'min(70vh,70vw)', aspectRatio: '1', borderRadius: '50%', opacity: 0.06, background: `repeating-radial-gradient(circle at center,${C.gold} 0,transparent 1px,transparent 20px,${C.gold} 21px,transparent 22px)`, willChange: 'transform', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', zIndex: 2, maxWidth: 1280, margin: '0 auto', padding: 'clamp(100px,12vw,140px) clamp(20px,4vw,40px) 80px', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <div style={{ width: 32, height: 1, background: C.gold }} />
          <span style={{ fontSize: 11, letterSpacing: '0.28em', color: C.gold, fontWeight: 600 }}>LIVE JAZZ · MARKT 9 · LEIPZIG</span>
        </div>
        <h1 style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(52px,10vw,130px)', fontWeight: 700, lineHeight: 0.92, letterSpacing: '-0.02em', color: C.cream, margin: 0, maxWidth: '12ch' }}>
          Wo Jazz<br /><em style={{ fontStyle: 'italic', fontWeight: 400, color: C.goldLt }}>lebt.</em>
        </h1>
        <p style={{ fontSize: 'clamp(15px,1.5vw,18px)', color: C.inkSoft, maxWidth: '46ch', lineHeight: 1.65, margin: 'clamp(24px,4vw,40px) 0 clamp(32px,5vw,48px)' }}>
          Mitten auf dem Markt — Treffpunkt für alle die guten Klang, ehrliche Küche und das richtige Glas zu schätzen wissen.
        </p>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <a href="#karte" style={{ padding: '16px 36px', background: C.gold, color: '#08090f', fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textDecoration: 'none', borderRadius: 2, transition: 'all 0.2s' }}
            onMouseEnter={e => { e.target.style.background = C.goldLt; e.target.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.target.style.background = C.gold; e.target.style.transform = 'none' }}>ZUR KARTE</a>
          <a href="tel:034196080430" style={{ padding: '16px 36px', background: 'transparent', color: C.cream, fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', textDecoration: 'none', border: `1px solid rgba(240,232,213,.3)`, borderRadius: 2, transition: 'all 0.2s' }}
            onMouseEnter={e => { e.target.style.borderColor = C.gold; e.target.style.color = C.goldLt }}
            onMouseLeave={e => { e.target.style.borderColor = 'rgba(240,232,213,.3)'; e.target.style.color = C.cream }}>0341 9608043</a>
        </div>
        <div style={{ display: 'flex', gap: 0, marginTop: 'clamp(48px,8vw,80px)', borderTop: `1px solid ${C.line}`, paddingTop: 28, flexWrap: 'wrap' }}>
          {[['4.1★','Google Rating'],['1.400+','Bewertungen'],['Live','Jazz täglich'],['Sa+So','Brunch']].map(([n, l], i) => (
            <div key={l} style={{ flex: '1 1 110px', paddingRight: i < 3 ? 28 : 0, marginRight: i < 3 ? 28 : 0, borderRight: i < 3 ? `1px solid ${C.line}` : 'none', marginBottom: 16 }}>
              <div style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(20px,2.5vw,28px)', fontWeight: 700, color: C.goldLt, lineHeight: 1 }}>{n}</div>
              <div style={{ fontSize: 11, letterSpacing: '0.12em', color: C.inkMute, marginTop: 6 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Showcase() {
  return (
    <div style={{ position: 'relative', height: 'clamp(300px,52vh,560px)', overflow: 'hidden', borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
      <img src={IMG.stage} alt="Spizz Bühne" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.7) contrast(1.08)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,rgba(8,9,15,.72) 0%,transparent 55%,rgba(8,9,15,.4) 100%)' }} />
      <div style={{ position: 'absolute', left: 'clamp(20px,5vw,64px)', bottom: 'clamp(24px,5vw,56px)' }}>
        <Reveal>
          <span style={{ display: 'block', fontSize: 11, letterSpacing: '0.24em', color: C.gold, marginBottom: 12 }}>JEDEN ABEND</span>
          <p style={{ fontFamily: 'Georgia,serif', fontStyle: 'italic', fontSize: 'clamp(18px,2.8vw,34px)', color: C.cream, margin: 0, maxWidth: '28ch', lineHeight: 1.25 }}>
            "Der beste Jazzklang der Stadt — direkt am Markt."
          </p>
        </Reveal>
      </div>
    </div>
  )
}

function Konzept() {
  return (
    <section id="konzept" style={{ background: C.bg, padding: 'clamp(64px,10vw,120px) clamp(20px,4vw,40px)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 'clamp(48px,7vw,96px)', alignItems: 'center' }}>
        <Reveal>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', inset: -14, border: `1px solid ${C.line}`, borderRadius: 2 }} />
            <img src={IMG.interior} alt="Spizz Innenraum" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 2, position: 'relative', zIndex: 1, filter: 'brightness(0.82) contrast(1.05)' }} />
            <div style={{ position: 'absolute', bottom: -18, right: -18, zIndex: 2, background: C.gold, padding: '18px 22px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Georgia,serif', fontSize: 28, fontWeight: 700, color: '#08090f', lineHeight: 1 }}>4.1</div>
              <div style={{ fontSize: 11, color: '#08090f', marginTop: 2 }}>★★★★☆ Google</div>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.15}>
          <span style={{ fontSize: 10, letterSpacing: '0.28em', color: C.gold, fontWeight: 600, display: 'block', marginBottom: 16 }}>KONZEPT</span>
          <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(28px,4vw,48px)', fontWeight: 700, lineHeight: 1.1, color: C.cream, marginBottom: 20 }}>
            Jazz, Küche<br /><em style={{ fontWeight: 400, color: C.inkSoft }}>und die Nacht.</em>
          </h2>
          <p style={{ color: C.inkSoft, lineHeight: 1.72, marginBottom: 16, fontSize: 15 }}>Das Spizz ist seit Jahren mehr als ein Restaurant. Hier treffen sich Locals und Reisende, Studenten und Geschäftsleute — vereint durch gutes Essen, ehrliche Drinks und den Klang, der jeden Abend von der Bühne kommt.</p>
          <p style={{ color: C.inkSoft, lineHeight: 1.72, marginBottom: 32, fontSize: 15 }}>Mitten auf dem Markt, mit Blick auf die Thomaskirche. Sonnenterrasse im Sommer, warme Atmosphäre im Winter. Das Spizz ist kein Konzept — es ist ein Ort.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0, borderTop: `1px solid ${C.line}`, paddingTop: 24 }}>
            {[['🎷','Live Jazz'],['🍸','Cocktails'],['☀️','Terrasse']].map(([icon, label], i) => (
              <div key={label} style={{ paddingRight: i < 2 ? 16 : 0, marginRight: i < 2 ? 16 : 0, borderRight: i < 2 ? `1px solid ${C.line}` : 'none' }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
                <div style={{ fontSize: 12, color: C.goldLt, fontWeight: 600, letterSpacing: '0.06em' }}>{label}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function Karte() {
  const items = [
    { name: 'Spizz Negroni', desc: 'Gin, Campari, süßer Wermut, Orangenzeste.', price: '9,50 €', tag: 'Signature', img: IMG.cocktail },
    { name: 'Beef Tartare', desc: 'Handgeschnitten, Kapern, Eigelb, geröstetes Brot.', price: '16,50 €', tag: 'Starter', img: IMG.food },
    { name: 'Jazz Old Fashioned', desc: 'Bourbon, Angostura, Demerara, Kirschbitter.', price: '10,50 €', tag: 'Classic', img: IMG.cocktail },
    { name: 'Spizz Burger', desc: 'Dry-aged Beef, Cheddar, Jalapeños, Brioche.', price: '17,50 €', tag: 'Klassiker', img: IMG.food },
    { name: 'Markt Spritz', desc: 'Aperol, Prosecco, Mineralwasser, Orange.', price: '7,50 €', tag: 'Leicht', img: IMG.cocktail },
    { name: 'Pasta alla Norma', desc: 'Aubergine, San Marzano, Ricotta salata.', price: '14,50 €', tag: 'Vegetarisch', img: IMG.food },
  ]
  return (
    <section id="karte" style={{ background: C.surface, borderTop: `1px solid ${C.line}`, padding: 'clamp(64px,10vw,120px) clamp(20px,4vw,40px)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <Reveal>
          <span style={{ fontSize: 10, letterSpacing: '0.28em', color: C.gold, fontWeight: 600, display: 'block', marginBottom: 16 }}>KARTE</span>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 'clamp(40px,6vw,64px)', flexWrap: 'wrap' }}>
            <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(40px,7vw,88px)', fontWeight: 700, lineHeight: 0.9, letterSpacing: '-0.025em', color: C.cream, margin: 0 }}>
              Drinks &<br /><em style={{ fontWeight: 400, color: C.inkSoft }}>Küche.</em>
            </h2>
            <p style={{ fontSize: 11, color: C.inkMute, maxWidth: '36ch', lineHeight: 1.65, fontStyle: 'italic', alignSelf: 'flex-end' }}>* Repräsentative Beispiele für die Demo. Aktuelle Karte auf spizz.de.</p>
          </div>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 20 }}>
          {items.map((d, i) => (
            <Reveal key={d.name} delay={i * 0.06}>
              <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 2, overflow: 'hidden', transition: 'border-color 0.25s,transform 0.25s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.lineStr; e.currentTarget.style.transform = 'translateY(-3px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.line; e.currentTarget.style.transform = 'none' }}>
                <div style={{ aspectRatio: '16/9', overflow: 'hidden' }}>
                  <img src={d.img} alt={d.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.78) contrast(1.06)', transition: 'transform 0.5s ease' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
                </div>
                <div style={{ padding: '20px 22px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                    <div>
                      <span style={{ fontFamily: 'Georgia,serif', fontSize: 18, fontWeight: 600, color: C.cream, display: 'block', marginBottom: 4 }}>{d.name}</span>
                      <span style={{ fontSize: 9, letterSpacing: '0.14em', color: C.gold, border: `1px solid ${C.lineStr}`, borderRadius: 1, padding: '2px 7px' }}>{d.tag}</span>
                    </div>
                    <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 600, color: C.cream, whiteSpace: 'nowrap', flexShrink: 0 }}>{d.price}</span>
                  </div>
                  <p style={{ fontSize: 13, color: C.inkMute, lineHeight: 1.55, margin: 0 }}>{d.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function Zeiten() {
  const today = new Date().getDay()
  const hours = [
    { day: 'Montag', t: '12:00 — 01:00', d: 1 },
    { day: 'Dienstag', t: '12:00 — 01:00', d: 2 },
    { day: 'Mittwoch', t: '12:00 — 01:00', d: 3 },
    { day: 'Donnerstag', t: '12:00 — 01:00', d: 4 },
    { day: 'Freitag', t: '12:00 — 03:00', d: 5 },
    { day: 'Samstag', t: '12:00 — 03:00', d: 6 },
    { day: 'Sonntag', t: '12:00 — 24:00', d: 0 },
  ]
  return (
    <section id="zeiten" style={{ background: C.bg, borderTop: `1px solid ${C.line}`, padding: 'clamp(64px,10vw,120px) clamp(20px,4vw,40px)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 'clamp(48px,7vw,96px)' }}>
        <Reveal>
          <span style={{ fontSize: 10, letterSpacing: '0.28em', color: C.gold, fontWeight: 600, display: 'block', marginBottom: 16 }}>ÖFFNUNGSZEITEN</span>
          <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(32px,5vw,58px)', fontWeight: 700, lineHeight: 0.95, letterSpacing: '-0.02em', color: C.cream, marginBottom: 20 }}>
            Täglich ab<br /><em style={{ fontWeight: 400, color: C.inkSoft }}>Mittag.</em>
          </h2>
          <p style={{ fontSize: 15, color: C.inkSoft, lineHeight: 1.65, maxWidth: '38ch' }}>Fr + Sa bis 03:00 Uhr. Live-Jazz jeden Abend ab 20 Uhr. Brunch Sa + So ab 12 Uhr.</p>
        </Reveal>
        <Reveal delay={0.12}>
          <div style={{ borderTop: `1px solid ${C.line}` }}>
            {hours.map(h => (
              <div key={h.day} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: h.d === today ? '16px 14px' : '14px 0', borderBottom: `1px solid ${C.line}`, background: h.d === today ? 'rgba(201,133,10,0.07)' : 'transparent', margin: h.d === today ? '0 -14px' : 0 }}>
                <span style={{ fontSize: 15, fontWeight: h.d === today ? 600 : 400, color: h.d === today ? C.cream : C.inkSoft }}>{h.day}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {h.d === today && <span style={{ fontSize: 9, letterSpacing: '0.16em', color: C.gold, fontWeight: 600 }}>HEUTE</span>}
                  <span style={{ fontFamily: 'monospace', fontSize: 13, color: h.d === today ? C.cream : C.inkMute }}>{h.t}</span>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function Anfahrt() {
  return (
    <section id="anfahrt" style={{ background: C.card, borderTop: `1px solid ${C.line}`, padding: 'clamp(64px,10vw,120px) clamp(20px,4vw,40px)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 'clamp(48px,7vw,96px)', alignItems: 'start' }}>
        <Reveal>
          <span style={{ fontSize: 10, letterSpacing: '0.28em', color: C.gold, fontWeight: 600, display: 'block', marginBottom: 16 }}>ANFAHRT</span>
          <h2 style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(28px,4vw,48px)', fontWeight: 700, lineHeight: 1.1, color: C.cream, marginBottom: 24 }}>
            Mitten in<br /><em style={{ fontWeight: 400, color: C.inkSoft }}>Leipzig.</em>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { icon: '📍', k: 'ADRESSE', v: 'Markt 9, 04109 Leipzig', href: 'https://maps.google.com/?q=Spizz+Leipzig' },
              { icon: '📞', k: 'TELEFON', v: '0341 9608043', href: 'tel:034196080430' },
              { icon: '🌐', k: 'WEBSITE', v: 'spizz.de', href: 'https://spizz.de' },
            ].map(item => (
              <a key={item.k} href={item.href} target={item.href.startsWith('http')?'_blank':'_self'} rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '18px 22px', background: C.surface, border: `1px solid ${C.line}`, borderRadius: 2, textDecoration: 'none', transition: 'border-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.gold}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.line}
              >
                <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: 9, letterSpacing: '0.18em', color: C.gold, marginBottom: 4, fontWeight: 600 }}>{item.k}</div>
                  <div style={{ fontSize: 15, color: C.cream, fontWeight: 500 }}>{item.v}</div>
                </div>
              </a>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.12}>
          <div style={{ borderRadius: 2, overflow: 'hidden', border: `1px solid ${C.line}` }}>
            <iframe title="Spizz Leipzig Karte" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2491.9!2d12.3748!3d51.3397!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47a6f90b3e3f10b7%3A0x0!2sMarkt%209%2C%2004109%20Leipzig!5e0!3m2!1sde!2sde!4v1" width="100%" height="280" style={{ border: 0, display: 'block', filter: 'invert(90%) hue-rotate(180deg) brightness(0.75) contrast(1.1)' }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer style={{ background: '#050609', borderTop: `1px solid ${C.line}`, padding: 'clamp(48px,6vw,64px) clamp(20px,4vw,40px) 32px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 32, marginBottom: 40 }}>
          <div>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: 22, fontWeight: 700, color: C.cream, marginBottom: 4 }}>Spizz</div>
            <div style={{ fontSize: 9, letterSpacing: '0.24em', color: C.gold, marginBottom: 14 }}>JAZZ BAR · RESTAURANT</div>
            <p style={{ fontSize: 13, color: C.inkMute, lineHeight: 1.65 }}>Markt 9 · 04109 Leipzig<br />täglich ab 12:00 Uhr</p>
          </div>
          <div>
            <h4 style={{ fontSize: 10, letterSpacing: '0.18em', color: C.gold, marginBottom: 14, fontWeight: 600 }}>KONTAKT</h4>
            {[['tel:034196080430','0341 9608043'],['https://spizz.de','spizz.de']].map(([href, label]) => (
              <a key={href} href={href} target={href.startsWith('http')?'_blank':'_self'} rel="noopener noreferrer" style={{ display: 'block', fontSize: 13, color: C.inkMute, textDecoration: 'none', marginBottom: 6 }}
                onMouseEnter={e => e.target.style.color = C.goldLt} onMouseLeave={e => e.target.style.color = C.inkMute}>{label}</a>
            ))}
          </div>
          <div>
            <h4 style={{ fontSize: 10, letterSpacing: '0.18em', color: C.gold, marginBottom: 14, fontWeight: 600 }}>SEITEN</h4>
            {[['Konzept','#konzept'],['Karte','#karte'],['Öffnungszeiten','#zeiten'],['Anfahrt','#anfahrt']].map(([label, href]) => (
              <a key={label} href={href} style={{ display: 'block', fontSize: 13, color: C.inkMute, textDecoration: 'none', marginBottom: 6 }}
                onMouseEnter={e => e.target.style.color = C.goldLt} onMouseLeave={e => e.target.style.color = C.inkMute}>{label}</a>
            ))}
          </div>
          <div>
            <h4 style={{ fontSize: 10, letterSpacing: '0.18em', color: C.gold, marginBottom: 14, fontWeight: 600 }}>RECHTLICHES</h4>
            {[['Impressum','#impressum'],['Datenschutz','#datenschutz'],['AGB','#agb']].map(([label, href]) => (
              <a key={label} href={href} style={{ display: 'block', fontSize: 13, color: C.inkMute, textDecoration: 'none', marginBottom: 6 }}
                onMouseEnter={e => e.target.style.color = C.goldLt} onMouseLeave={e => e.target.style.color = C.inkMute}>{label}</a>
            ))}
          </div>
        </div>
        <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 12, color: C.inkMute }}>© 2026 Spizz Leipzig.</span>
          <span style={{ fontSize: 11, color: C.inkMute, letterSpacing: '0.06em' }}>Erstellt von PDSTUDIO</span>
        </div>
      </div>
    </footer>
  )
}

export default function App() {
  return (
    <>
      <DemoBanner />
      <Nav />
      <Hero />
      <Showcase />
      <Konzept />
      <Karte />
      <Zeiten />
      <Anfahrt />
      <Footer />
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        body{background:#08090f;color:#ede8e0;font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
        img{display:block;max-width:100%}
        @media(max-width:600px){section,footer{padding-left:20px!important;padding-right:20px!important}}
        @media(prefers-reduced-motion:reduce){*{transition-duration:.01ms!important;animation-duration:.01ms!important}}
      `}</style>
    </>
  )
}
