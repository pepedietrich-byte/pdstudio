import { useState, useEffect, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'

// ─── Brand tokens ─────────────────────────────────────────────────────────
const GOLD       = '#C9922A'
const GOLD_LIGHT = '#E8B84B'
const CREAM      = '#F5EDD7'
const DARK       = '#0E0A06'
const DARK2      = '#1A1209'
const DARK3      = '#241A0F'
const BORDER     = 'rgba(201,146,42,0.18)'

// ─── Unsplash images (Indian restaurant / food) ───────────────────────────
const IMG = {
  hero:     'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1920&q=85&auto=format&fit=crop',
  interior: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80&auto=format&fit=crop',
  butter:   'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80&auto=format&fit=crop',
  biryani:  'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80&auto=format&fit=crop',
  naan:     'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80&auto=format&fit=crop',
  spices:   'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80&auto=format&fit=crop',
  tikka:    'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80&auto=format&fit=crop',
  mango:    'https://images.unsplash.com/photo-1571197203854-e4cf29899f80?w=800&q=80&auto=format&fit=crop',
}

// ─── Helpers ─────────────────────────────────────────────────────────────
function FadeIn({ children, delay = 0, className = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  )
}

function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '0 auto 20px', maxWidth: 180 }}>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, ${GOLD})` }} />
      <span style={{ color: GOLD, fontSize: 16 }}>✦</span>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, transparent, ${GOLD})` }} />
    </div>
  )
}

function Label({ children }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.2em', color: GOLD, textTransform: 'uppercase', marginBottom: 12 }}>
      {children}
    </p>
  )
}

// ─── Nav ──────────────────────────────────────────────────────────────────
function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const links = [
    { label: 'Küche', href: '#cuisine' },
    { label: 'Über uns', href: '#about' },
    { label: 'Öffnungszeiten', href: '#hours' },
    { label: 'Kontakt', href: '#contact' },
  ]

  return (
    <motion.nav
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(14,10,6,0.96)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? `1px solid ${BORDER}` : 'none',
        transition: 'all 0.35s ease',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="#" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: CREAM, lineHeight: 1 }}>Indian Crown</span>
            <span style={{ fontSize: 9, letterSpacing: '0.22em', color: GOLD, fontWeight: 500 }}>AUTHENTIC INDIAN CUISINE</span>
          </div>
        </a>

        {/* Desktop */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="nav-desktop">
          {links.map(l => (
            <a key={l.label} href={l.href} style={{ fontSize: 13, fontWeight: 500, color: 'rgba(245,237,215,0.7)', textDecoration: 'none', letterSpacing: '0.04em', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = CREAM}
              onMouseLeave={e => e.target.style.color = 'rgba(245,237,215,0.7)'}
            >
              {l.label}
            </a>
          ))}
          <a href="#reservation" style={{ padding: '9px 22px', background: GOLD, color: DARK, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: 2, transition: 'all 0.2s' }}
            onMouseEnter={e => { e.target.style.background = GOLD_LIGHT; e.target.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.target.style.background = GOLD; e.target.style.transform = 'none' }}
          >
            Reservieren
          </a>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setOpen(v => !v)} className="nav-mobile-btn" aria-label="Menü"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'none', flexDirection: 'column', gap: 5 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width: 22, height: 1.5, background: open && i===1 ? 'transparent' : CREAM, transition: 'all 0.25s', transform: open ? (i===0 ? 'rotate(45deg) translate(5px,5px)' : i===2 ? 'rotate(-45deg) translate(5px,-5px)' : 'none') : 'none' }} />
          ))}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden', background: 'rgba(14,10,6,0.98)', borderTop: `1px solid ${BORDER}` }}>
            <div style={{ padding: '20px 24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              {links.map(l => (
                <a key={l.label} href={l.href} onClick={() => setOpen(false)} style={{ fontSize: 18, color: CREAM, textDecoration: 'none', fontFamily: 'Playfair Display, serif' }}>{l.label}</a>
              ))}
              <a href="#reservation" onClick={() => setOpen(false)} style={{ padding: '13px 0', background: GOLD, color: DARK, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: 2, textAlign: 'center', marginTop: 4 }}>
                Tisch reservieren
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media(max-width:768px){.nav-desktop{display:none!important}.nav-mobile-btn{display:flex!important}}
      `}</style>
    </motion.nav>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section style={{ position: 'relative', minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${IMG.hero})`, backgroundSize: 'cover', backgroundPosition: 'center 40%' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(14,10,6,0.5) 0%, rgba(14,10,6,0.25) 40%, rgba(14,10,6,0.88) 100%)' }} />

      <div style={{ position: 'relative', zIndex: 2, maxWidth: 820, margin: '0 auto', padding: '120px 24px 80px', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7 }}>
          <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 600, letterSpacing: '0.3em', color: GOLD, textTransform: 'uppercase', marginBottom: 24, padding: '6px 18px', border: `1px solid ${GOLD}40` }}>
            Authentische Indische Küche · Leipzig
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          style={{ fontSize: 'clamp(44px, 8vw, 90px)', fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.02em', color: CREAM, marginBottom: 20 }}
        >
          Indiens Seele.<br />
          <em style={{ color: GOLD_LIGHT }}>Königlich serviert.</em>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.7 }}
          style={{ fontSize: 17, color: 'rgba(245,237,215,0.75)', maxWidth: 480, margin: '0 auto 40px', lineHeight: 1.65 }}>
          Erleben Sie die aromatische Vielfalt Indiens — zubereitet mit Leidenschaft,
          serviert mit königlicher Gastfreundschaft im Herzen Leipzigs.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65, duration: 0.6 }}
          style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="#reservation" style={{ padding: '15px 36px', background: GOLD, color: DARK, fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: 2, boxShadow: `0 8px 32px rgba(201,146,42,0.4)`, transition: 'all 0.25s' }}
            onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = `0 12px 40px rgba(201,146,42,0.55)` }}
            onMouseLeave={e => { e.target.style.transform = 'none'; e.target.style.boxShadow = `0 8px 32px rgba(201,146,42,0.4)` }}>
            Tisch reservieren
          </a>
          <a href="tel:034125699737" style={{ padding: '15px 36px', background: 'transparent', color: CREAM, fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', textDecoration: 'none', border: '1px solid rgba(245,237,215,0.3)', borderRadius: 2, transition: 'all 0.25s' }}
            onMouseEnter={e => { e.target.style.borderColor = GOLD; e.target.style.color = GOLD_LIGHT }}
            onMouseLeave={e => { e.target.style.borderColor = 'rgba(245,237,215,0.3)'; e.target.style.color = CREAM }}>
            0341 25699737
          </a>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.5 }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginTop: 48, padding: '10px 22px', background: 'rgba(14,10,6,0.7)', border: `1px solid ${BORDER}`, borderRadius: 40, backdropFilter: 'blur(8px)' }}>
          <span style={{ color: GOLD, fontSize: 15 }}>★★★★★</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: CREAM }}>4.7</span>
          <span style={{ width: 1, height: 14, background: BORDER }} />
          <span style={{ fontSize: 12, color: 'rgba(245,237,215,0.55)' }}>1.361 Google-Bewertungen</span>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
        style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 2 }}>
        <span style={{ fontSize: 10, letterSpacing: '0.2em', color: 'rgba(245,237,215,0.35)', textTransform: 'uppercase' }}>Entdecken</span>
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.8, repeat: Infinity }}
          style={{ width: 1, height: 36, background: `linear-gradient(to bottom, ${GOLD}70, transparent)` }} />
      </motion.div>
    </section>
  )
}

// ─── Trust stats ──────────────────────────────────────────────────────────
function TrustSection() {
  const stats = [
    { value: '4.7★', label: 'Google Rating' },
    { value: '1.361', label: 'Bewertungen' },
    { value: '15+', label: 'Jahre Erfahrung' },
    { value: '100%', label: 'Authentisch' },
  ]
  return (
    <section style={{ background: DARK2, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '56px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 0 }}>
          {stats.map((s, i) => (
            <FadeIn key={s.label} delay={i * 0.1}>
              <div style={{ textAlign: 'center', padding: '32px 16px', borderRight: i < stats.length-1 ? `1px solid ${BORDER}` : 'none' }}>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 38, fontWeight: 700, color: GOLD_LIGHT, lineHeight: 1, marginBottom: 8 }}>{s.value}</div>
                <div style={{ fontSize: 11, letterSpacing: '0.12em', color: 'rgba(245,237,215,0.45)', textTransform: 'uppercase' }}>{s.label}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── About ────────────────────────────────────────────────────────────────
function AboutSection() {
  return (
    <section id="about" style={{ background: DARK, padding: '96px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 64, alignItems: 'center' }}>
          <FadeIn>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', inset: -12, border: `1px solid ${BORDER}`, borderRadius: 2, zIndex: 0 }} />
              <img src={IMG.interior} alt="Indian Crown Restaurant" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 2, position: 'relative', zIndex: 1, filter: 'brightness(0.88)' }} />
              <div style={{ position: 'absolute', bottom: -20, right: -20, zIndex: 2, background: GOLD, padding: '16px 20px', textAlign: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 26, fontWeight: 700, color: DARK, lineHeight: 1 }}>4.7</div>
                <div style={{ fontSize: 13, color: DARK, marginTop: 2 }}>★★★★★</div>
                <div style={{ fontSize: 9, color: DARK, letterSpacing: '0.1em', marginTop: 4 }}>GOOGLE</div>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.15}>
            <div>
              <Label>Unsere Geschichte</Label>
              <Divider />
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, lineHeight: 1.15, color: CREAM, marginBottom: 20, letterSpacing: '-0.01em' }}>
                Indische Seele im<br />Herzen Leipzigs
              </h2>
              <p style={{ color: 'rgba(245,237,215,0.65)', lineHeight: 1.75, marginBottom: 16, fontSize: 15 }}>
                Indian Crown steht für authentische indische Küche auf höchstem Niveau.
                Unsere Gerichte werden nach überlieferten Familienrezepten zubereitet —
                mit frisch gemahlenen Gewürzen, ausgewählten Zutaten und echter Leidenschaft.
              </p>
              <p style={{ color: 'rgba(245,237,215,0.65)', lineHeight: 1.75, marginBottom: 32, fontSize: 15 }}>
                Im eleganten Ambiente der Reichsstraße empfangen wir Sie mit legendärer
                indischer Gastfreundschaft — ob romantisches Dinner, Geschäftsessen oder
                ein besonderer Familienabend.
              </p>
              <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
                {[['🌶️','Authentische Rezepte'],['🥘','Frische Zutaten'],['👑','Königlicher Service']].map(([icon, label]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{icon}</span>
                    <span style={{ fontSize: 13, color: GOLD_LIGHT, fontWeight: 500 }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}

// ─── Cuisine ──────────────────────────────────────────────────────────────
function CuisineSection() {
  const dishes = [
    { img: IMG.butter,  name: 'Butter Chicken',       desc: 'Zartes Hähnchen in samtiger Tomatensauce mit Gewürzbutter.', tag: 'Klassiker' },
    { img: IMG.biryani, name: 'Lamb Biryani',          desc: 'Duftendes Basmati-Reisgericht mit zartem Lamm und Safran.', tag: 'Signature' },
    { img: IMG.tikka,   name: 'Chicken Tikka Masala',  desc: 'Hähnchenstücke in würziger Masala-Sauce — nordindischer Genuss.', tag: 'Bestseller' },
    { img: IMG.naan,    name: 'Frisches Naan',         desc: 'Im Tandoor-Ofen gebacken, knusprig außen, weich innen.', tag: 'Beilage' },
    { img: IMG.spices,  name: 'Vegetarische Küche',    desc: 'Dal, Palak Paneer und saisonale Gemüsegerichte in Hülle und Fülle.', tag: 'Vegetarisch' },
    { img: IMG.mango,   name: 'Mango Lassi',           desc: 'Hausgemachtes Joghurtgetränk mit reifer Alphonso-Mango.', tag: 'Getränk' },
  ]

  return (
    <section id="cuisine" style={{ background: DARK2, padding: '96px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <FadeIn>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <Label>Unsere Küche</Label>
            <Divider />
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, color: CREAM, letterSpacing: '-0.01em' }}>
              Aromen die Geschichten erzählen
            </h2>
          </div>
        </FadeIn>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {dishes.map((d, i) => (
            <FadeIn key={d.name} delay={i * 0.07}>
              <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.25 }}
                style={{ background: DARK3, border: `1px solid ${BORDER}`, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ position: 'relative', aspectRatio: '16/10', overflow: 'hidden' }}>
                  <img src={d.img} alt={d.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(14,10,6,0.55), transparent)' }} />
                  <span style={{ position: 'absolute', top: 12, right: 12, fontSize: 10, fontWeight: 600, letterSpacing: '0.15em', color: DARK, background: GOLD, padding: '4px 10px', borderRadius: 1 }}>{d.tag}</span>
                </div>
                <div style={{ padding: '20px 22px 24px' }}>
                  <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 19, fontWeight: 600, color: CREAM, marginBottom: 8 }}>{d.name}</h3>
                  <p style={{ fontSize: 13, color: 'rgba(245,237,215,0.55)', lineHeight: 1.65 }}>{d.desc}</p>
                </div>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Reservation ──────────────────────────────────────────────────────────
function ReservationSection() {
  const [form, setForm] = useState({ name: '', date: '', guests: '2', message: '' })

  const inputStyle = {
    width: '100%', padding: '12px 14px',
    background: DARK3, border: `1px solid ${BORDER}`,
    borderRadius: 2, color: CREAM, fontSize: 14,
    outline: 'none', fontFamily: 'Inter, sans-serif',
    transition: 'border-color 0.2s',
    colorScheme: 'dark',
  }

  return (
    <section id="reservation" style={{ background: DARK, padding: '96px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 64, alignItems: 'start' }}>
          <FadeIn>
            <div>
              <Label>Reservierung</Label>
              <Divider />
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, color: CREAM, letterSpacing: '-0.01em', marginBottom: 20 }}>
                Reservieren Sie<br />Ihren Tisch
              </h2>
              <p style={{ color: 'rgba(245,237,215,0.65)', lineHeight: 1.75, marginBottom: 32, fontSize: 15 }}>
                Sichern Sie sich Ihren Platz für ein unvergessliches indisches Dinner.
                Wir empfehlen eine Reservierung besonders an Wochenenden.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { icon: '📞', label: 'ANRUFEN', value: '0341 25699737', href: 'tel:034125699737' },
                  { icon: '📍', label: 'ADRESSE',  value: 'Reichsstraße 15, 04109 Leipzig', href: 'https://maps.google.com/?q=Indian+Crown+Leipzig' },
                ].map(item => (
                  <a key={item.label} href={item.href} target={item.href.startsWith('http') ? '_blank' : '_self'} rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 22px', background: DARK3, border: `1px solid ${BORDER}`, borderRadius: 2, textDecoration: 'none', transition: 'border-color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = GOLD}
                    onMouseLeave={e => e.currentTarget.style.borderColor = BORDER}
                  >
                    <div style={{ width: 44, height: 44, background: `${GOLD}18`, border: `1px solid ${GOLD}35`, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{item.icon}</div>
                    <div>
                      <div style={{ fontSize: 10, letterSpacing: '0.12em', color: GOLD, marginBottom: 4, fontWeight: 600 }}>{item.label}</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: CREAM }}>{item.value}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.15}>
            <form onSubmit={e => { e.preventDefault(); window.location.href = 'tel:034125699737' }}
              style={{ background: DARK2, border: `1px solid ${BORDER}`, borderRadius: 2, padding: '36px 32px' }}>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 600, color: CREAM, marginBottom: 24 }}>Tischanfrage</h3>

              {[
                { key: 'name', label: 'IHR NAME', type: 'text', placeholder: 'Vor- und Nachname', required: true },
                { key: 'date', label: 'DATUM', type: 'date', required: true },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', color: GOLD, marginBottom: 8 }}>{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder} required={f.required} value={form[f.key]}
                    onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = GOLD}
                    onBlur={e => e.target.style.borderColor = BORDER}
                  />
                </div>
              ))}

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', color: GOLD, marginBottom: 8 }}>PERSONEN</label>
                <select value={form.guests} onChange={e => setForm(v => ({ ...v, guests: e.target.value }))}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  onFocus={e => e.target.style.borderColor = GOLD}
                  onBlur={e => e.target.style.borderColor = BORDER}
                >
                  {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} {n===1?'Person':'Personen'}</option>)}
                  <option value="9+">9+ Personen</option>
                </select>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', color: GOLD, marginBottom: 8 }}>NACHRICHT (OPTIONAL)</label>
                <textarea placeholder="Besondere Wünsche, Allergien, Anlass..." rows={3} value={form.message}
                  onChange={e => setForm(v => ({ ...v, message: e.target.value }))}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  onFocus={e => e.target.style.borderColor = GOLD}
                  onBlur={e => e.target.style.borderColor = BORDER}
                />
              </div>

              <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                style={{ width: '100%', padding: '14px', background: GOLD, color: DARK, border: 'none', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', borderRadius: 2, cursor: 'pointer', fontFamily: 'Inter, sans-serif', boxShadow: `0 4px 20px rgba(201,146,42,0.3)` }}>
                Anfrage senden
              </motion.button>
              <p style={{ fontSize: 11, color: 'rgba(245,237,215,0.3)', textAlign: 'center', marginTop: 12 }}>Bestätigung erfolgt telefonisch unter 0341 25699737</p>
            </form>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}

// ─── Hours & Map ──────────────────────────────────────────────────────────
function HoursSection() {
  const hours = [
    { day: 'Montag',     time: 'Auf Anfrage' },
    { day: 'Dienstag',   time: '12:00 – 14:30 · 17:30 – 23:00' },
    { day: 'Mittwoch',   time: '12:00 – 14:30 · 17:30 – 23:00' },
    { day: 'Donnerstag', time: '12:00 – 14:30 · 17:30 – 23:00' },
    { day: 'Freitag',    time: '12:00 – 14:30 · 17:30 – 23:30' },
    { day: 'Samstag',    time: '12:00 – 23:30' },
    { day: 'Sonntag',    time: '12:00 – 23:00' },
  ]
  return (
    <section id="hours" style={{ background: DARK3, padding: '96px 24px', borderTop: `1px solid ${BORDER}` }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 64 }}>
          <FadeIn>
            <div>
              <Label>Öffnungszeiten</Label>
              <Divider />
              <h2 style={{ fontSize: 32, fontWeight: 700, color: CREAM, marginBottom: 28, letterSpacing: '-0.01em' }}>Wann wir für Sie da sind</h2>
              {hours.map((h, i) => (
                <div key={h.day} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 0', borderBottom: i < hours.length-1 ? `1px solid ${BORDER}` : 'none' }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: CREAM }}>{h.day}</span>
                  <span style={{ fontSize: 13, color: 'rgba(245,237,215,0.5)' }}>{h.time}</span>
                </div>
              ))}
              <p style={{ fontSize: 11, color: 'rgba(245,237,215,0.28)', marginTop: 16 }}>
                * Öffnungszeiten können variieren. Bitte rufen Sie an.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.15}>
            <div>
              <Label>Anfahrt</Label>
              <Divider />
              <h2 style={{ fontSize: 32, fontWeight: 700, color: CREAM, marginBottom: 28, letterSpacing: '-0.01em' }}>Finden Sie uns</h2>
              <div style={{ marginBottom: 24, borderRadius: 2, overflow: 'hidden', border: `1px solid ${BORDER}` }}>
                <iframe
                  title="Indian Crown Leipzig"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2493.06!2d12.3731!3d51.3397!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47a6f8b9e6ca0a97%3A0x1!2sReichsstra%C3%9Fe%2015%2C%2004109%20Leipzig!5e0!3m2!1sde!2sde!4v1"
                  width="100%" height="200"
                  style={{ border: 0, display: 'block', filter: 'invert(90%) hue-rotate(180deg) brightness(0.8) contrast(1.1)' }}
                  allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { icon: '📍', value: 'Reichsstraße 15, 04109 Leipzig', href: 'https://maps.google.com/?q=Indian+Crown+Leipzig' },
                  { icon: '📞', value: '0341 25699737', href: 'tel:034125699737' },
                ].map(item => (
                  <a key={item.value} href={item.href} target={item.href.startsWith('http') ? '_blank' : '_self'} rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: DARK2, border: `1px solid ${BORDER}`, borderRadius: 2, textDecoration: 'none', transition: 'border-color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = GOLD}
                    onMouseLeave={e => e.currentTarget.style.borderColor = BORDER}
                  >
                    <span style={{ fontSize: 16 }}>{item.icon}</span>
                    <span style={{ fontSize: 14, color: CREAM }}>{item.value}</span>
                  </a>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}

// ─── CTA Banner ───────────────────────────────────────────────────────────
function CTABanner() {
  return (
    <section style={{ position: 'relative', padding: '80px 24px', overflow: 'hidden', background: DARK2, borderTop: `1px solid ${BORDER}` }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${IMG.spices})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.07 }} />
      <FadeIn>
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 580, margin: '0 auto' }}>
          <span style={{ fontSize: 28, display: 'block', marginBottom: 12, color: GOLD }}>✦</span>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 700, color: CREAM, letterSpacing: '-0.01em', marginBottom: 14 }}>
            Erleben Sie Indien in Leipzig
          </h2>
          <p style={{ color: 'rgba(245,237,215,0.6)', marginBottom: 32, fontSize: 15, lineHeight: 1.65 }}>
            Reservieren Sie jetzt Ihren Tisch und genießen Sie authentische indische Küche.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#reservation" style={{ padding: '14px 32px', background: GOLD, color: DARK, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: 2, boxShadow: `0 4px 20px rgba(201,146,42,0.35)`, transition: 'all 0.2s' }}
              onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.target.style.transform = 'none'}>
              Tisch reservieren
            </a>
            <a href="tel:034125699737" style={{ padding: '14px 32px', background: 'transparent', color: CREAM, fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textDecoration: 'none', border: '1px solid rgba(245,237,215,0.25)', borderRadius: 2, transition: 'all 0.2s' }}
              onMouseEnter={e => { e.target.style.borderColor = GOLD; e.target.style.color = GOLD_LIGHT }}
              onMouseLeave={e => { e.target.style.borderColor = 'rgba(245,237,215,0.25)'; e.target.style.color = CREAM }}>
              0341 25699737
            </a>
          </div>
        </div>
      </FadeIn>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer id="contact" style={{ background: '#080503', borderTop: `1px solid ${BORDER}`, padding: '48px 24px 32px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 36, marginBottom: 40 }}>
          <div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: CREAM, marginBottom: 4 }}>Indian Crown</div>
            <div style={{ fontSize: 9, letterSpacing: '0.22em', color: GOLD, marginBottom: 14 }}>AUTHENTIC INDIAN CUISINE</div>
            <p style={{ fontSize: 13, color: 'rgba(245,237,215,0.38)', lineHeight: 1.65 }}>Authentische indische Küche im Herzen von Leipzig.</p>
          </div>
          <div>
            <h4 style={{ fontSize: 10, letterSpacing: '0.15em', color: GOLD, marginBottom: 14, fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>KONTAKT</h4>
            {[['tel:034125699737','0341 25699737'],['https://maps.google.com/?q=Indian+Crown+Leipzig','Reichsstraße 15, 04109 Leipzig']].map(([href, label]) => (
              <a key={href} href={href} target={href.startsWith('http')?'_blank':'_self'} rel="noopener noreferrer" style={{ display: 'block', fontSize: 13, color: 'rgba(245,237,215,0.5)', textDecoration: 'none', marginBottom: 6 }}
                onMouseEnter={e => e.target.style.color = GOLD_LIGHT}
                onMouseLeave={e => e.target.style.color = 'rgba(245,237,215,0.5)'}
              >{label}</a>
            ))}
          </div>
          <div>
            <h4 style={{ fontSize: 10, letterSpacing: '0.15em', color: GOLD, marginBottom: 14, fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>NAVIGATION</h4>
            {[['Unsere Küche','#cuisine'],['Über uns','#about'],['Reservierung','#reservation'],['Öffnungszeiten','#hours']].map(([label, href]) => (
              <a key={label} href={href} style={{ display: 'block', fontSize: 13, color: 'rgba(245,237,215,0.5)', textDecoration: 'none', marginBottom: 6 }}
                onMouseEnter={e => e.target.style.color = GOLD_LIGHT}
                onMouseLeave={e => e.target.style.color = 'rgba(245,237,215,0.5)'}
              >{label}</a>
            ))}
          </div>
          <div>
            <h4 style={{ fontSize: 10, letterSpacing: '0.15em', color: GOLD, marginBottom: 14, fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>RECHTLICHES</h4>
            {[['Impressum','#impressum'],['Datenschutz','#datenschutz'],['AGB','#agb']].map(([label, href]) => (
              <a key={label} href={href} style={{ display: 'block', fontSize: 13, color: 'rgba(245,237,215,0.5)', textDecoration: 'none', marginBottom: 6 }}
                onMouseEnter={e => e.target.style.color = GOLD_LIGHT}
                onMouseLeave={e => e.target.style.color = 'rgba(245,237,215,0.5)'}
              >{label}</a>
            ))}
          </div>
        </div>
        <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'rgba(245,237,215,0.22)' }}>© 2026 Indian Crown Leipzig. Alle Rechte vorbehalten.</span>
          <span style={{ fontSize: 11, color: 'rgba(245,237,215,0.18)', letterSpacing: '0.06em' }}>Erstellt von PDSTUDIO</span>
        </div>
      </div>
    </footer>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <>
      <Nav />
      <Hero />
      <TrustSection />
      <AboutSection />
      <CuisineSection />
      <ReservationSection />
      <HoursSection />
      <CTABanner />
      <Footer />
    </>
  )
}
