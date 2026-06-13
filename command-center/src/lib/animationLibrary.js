// ─── Premium Animation Library ──────────────────────────────────────────────
// Standardisierte CSS-Snippets für Premium-Animationen.
// Wird in den Build-Prompt eingebettet, damit Claude nicht freistilig
// "smooth scroll" interpretiert sondern konkrete Snippets nutzt.
//
// Konzept: pure CSS + minimal JS (kein npm-Package).
// prefers-reduced-motion respektiert.

export const ANIMATION_SNIPPETS = {
  // ── Hero Entrance — fade + scale + delay-stagger ─────────────────────────
  hero_entrance: `
.hero-enter { opacity: 0; transform: translateY(24px) scale(0.985); }
.hero-enter.in {
  opacity: 1; transform: none;
  transition: opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1);
}
.hero-enter-1 { transition-delay: 0.10s; }
.hero-enter-2 { transition-delay: 0.25s; }
.hero-enter-3 { transition-delay: 0.40s; }
.hero-enter-4 { transition-delay: 0.55s; }
`.trim(),

  // ── Magnetic Button — pointer follows cursor leicht ──────────────────────
  magnetic_button: `
.btn-magnetic { transition: transform 0.25s cubic-bezier(0.16,1,0.3,1); will-change: transform; }
// JS-Handler:
// onMouseMove: const r = el.getBoundingClientRect(); el.style.transform = \`translate(\${(e.clientX-r.left-r.width/2)*0.18}px, \${(e.clientY-r.top-r.height/2)*0.18}px)\`;
// onMouseLeave: el.style.transform = 'translate(0,0)';
`.trim(),

  // ── Smooth Reveal — Intersection Observer with stagger ──────────────────
  smooth_reveal: `
.reveal-up { opacity: 0; transform: translateY(28px); transition: opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1); }
.reveal-up.in { opacity: 1; transform: none; }
.reveal-stagger > * { opacity: 0; transform: translateY(20px); transition: opacity 0.6s, transform 0.6s; }
.reveal-stagger.in > *:nth-child(1) { transition-delay: 0.00s; opacity: 1; transform: none; }
.reveal-stagger.in > *:nth-child(2) { transition-delay: 0.08s; opacity: 1; transform: none; }
.reveal-stagger.in > *:nth-child(3) { transition-delay: 0.16s; opacity: 1; transform: none; }
.reveal-stagger.in > *:nth-child(4) { transition-delay: 0.24s; opacity: 1; transform: none; }
.reveal-stagger.in > *:nth-child(5) { transition-delay: 0.32s; opacity: 1; transform: none; }
.reveal-stagger.in > *:nth-child(6) { transition-delay: 0.40s; opacity: 1; transform: none; }
`.trim(),

  // ── Parallax Background — pure CSS via translate3d ──────────────────────
  parallax_bg: `
.parallax-bg { will-change: transform; }
// JS: window.addEventListener('scroll', () => {
//   const y = window.scrollY * 0.35;
//   document.querySelectorAll('.parallax-bg').forEach(el => el.style.transform = \`translate3d(0, \${y}px, 0)\`);
// });
`.trim(),

  // ── Hover Microinteractions — scale + underline grow ────────────────────
  hover_micro: `
.hover-lift { transition: transform 0.3s cubic-bezier(0.16,1,0.3,1); }
.hover-lift:hover { transform: translateY(-3px); }
.hover-glow { transition: box-shadow 0.4s; }
.hover-glow:hover { box-shadow: 0 12px 40px rgba(var(--accent-rgb, 201,146,42), 0.35); }
.link-underline {
  position: relative;
}
.link-underline::after {
  content: ''; position: absolute; left: 0; right: 100%; bottom: -2px; height: 1px;
  background: currentColor; transition: right 0.5s cubic-bezier(0.16,1,0.3,1);
}
.link-underline:hover::after { right: 0; }
`.trim(),

  // ── Floating Motion — für Hero-Bilder (subtle, restaurant-food) ─────────
  floating_motion: `
@keyframes float-soft {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50%      { transform: translateY(-12px) rotate(-1deg); }
}
.float-soft { animation: float-soft 8s ease-in-out infinite; will-change: transform; }
`.trim(),

  // ── Scroll-text-reveal — words fade in sequentially ─────────────────────
  scroll_text_reveal: `
.text-reveal-word { display: inline-block; opacity: 0; transform: translateY(10px); transition: opacity 0.6s, transform 0.6s; }
.text-reveal-word.in { opacity: 1; transform: none; }
// Apply via splitting text into spans:
// "Hello world".split(' ').map((w,i) => <span class="text-reveal-word" style={{transitionDelay: \`\${i*0.05}s\`}}>{w}</span>)
`.trim(),

  // ── Marquee — for trust strips, specials, etc. ──────────────────────────
  marquee: `
@keyframes marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
.marquee { overflow: hidden; }
.marquee-track { display: flex; gap: 48px; animation: marquee 35s linear infinite; will-change: transform; }
.marquee:hover .marquee-track { animation-play-state: paused; }
`.trim(),

  // ── Reduced Motion Override ─────────────────────────────────────────────
  reduced_motion: `
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  .float-soft, .marquee-track { animation: none; }
  .reveal-up, .reveal-stagger > *, .hero-enter, .text-reveal-word { opacity: 1; transform: none; transition: none; }
}
`.trim(),

  // ── IntersectionObserver Init (one shared hook) ─────────────────────────
  intersection_observer_init: `
useEffect(() => {
  const io = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -80px 0px' });
  document.querySelectorAll('.reveal-up, .reveal-stagger, .hero-enter, .text-reveal-word').forEach(el => io.observe(el));
  return () => io.disconnect();
}, []);
`.trim(),
}

// ─── Per Style Animation-Profile ───────────────────────────────────────────
// Welche Snippets sollen pro Style verwendet werden
const STYLE_ANIMATION_PROFILES = {
  cinnabar: {
    snippets: ['hero_entrance', 'smooth_reveal', 'hover_micro', 'floating_motion', 'parallax_bg', 'reduced_motion'],
    extras:   'Rotating hero element (90s linear infinite). Pulse heartbeat on live indicators.',
    feel:     'Slow, drenched, mediterranean warmth. Reveal-Animations beim Scroll. Italic-Akzente fade-in.',
  },
  obsidian: {
    snippets: ['hero_entrance', 'smooth_reveal', 'hover_micro', 'scroll_text_reveal', 'reduced_motion'],
    extras:   'Sehr subtle: opacity fades only, kein scale. Sticky-image-scroll. Numbered sections fade-in sequenziell.',
    feel:     'Restrained, refined. Almost imperceptible. Cinematic.',
  },
  atelier: {
    snippets: ['hero_entrance', 'smooth_reveal', 'hover_micro', 'scroll_text_reveal', 'reduced_motion'],
    extras:   'Page-turn feel. Hover: underline grow (use .link-underline class). Minimalistic.',
    feel:     'Editorial. Page-turn. Hover-grows. Very subtle.',
  },
  terrain: {
    snippets: ['hero_entrance', 'smooth_reveal', 'hover_micro', 'floating_motion', 'reduced_motion'],
    extras:   'Playful tilt -2deg/+1deg on cards. Polaroid-feel. Subtle hover bounce.',
    feel:     'Warm, lived-in, slightly playful. Cards rotate subtly.',
  },
  neon: {
    snippets: ['hero_entrance', 'smooth_reveal', 'hover_micro', 'magnetic_button', 'marquee', 'reduced_motion'],
    extras:   'Snappy: scale(0.97) on click. Marquee for trust strip. Diagonal cuts. Sticker rotation -2/+2deg.',
    feel:     'Urban Energy. Snappy. Marquee. Magnetic buttons. Pop-color glitch-fade reveal.',
  },
}

export function getAnimationBlock(styleId, conceptAnimationConcept = '') {
  const profile = STYLE_ANIMATION_PROFILES[styleId] || STYLE_ANIMATION_PROFILES.cinnabar
  const snippetsCss = profile.snippets.map(k => ANIMATION_SNIPPETS[k]).join('\n\n')

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ANIMATION-STANDARD (pflicht — verwende DIESE snippets, keine eigenen):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Style: ${styleId}
Feel: ${profile.feel}
Extras: ${profile.extras}
Concept-Hinweis: ${conceptAnimationConcept}

PFLICHT-CSS (kopiere folgende Snippets in einen <style>-Block oder in App.css):

${snippetsCss}

PFLICHT-JS:

${ANIMATION_SNIPPETS.intersection_observer_init}

ANWENDUNG:
- Hero-Elemente bekommen class="hero-enter hero-enter-1" / "hero-enter-2" etc. für Stagger
- Sections bekommen class="reveal-up"
- Cards-Container bekommen class="reveal-stagger"
- CTAs bekommen class="hover-lift" (alle) oder class="btn-magnetic" (Style: ${styleId})
- Trust-Strip/Specials: nutze class="marquee" mit innerem .marquee-track (Style: ${styleId})

prefers-reduced-motion ist über .reduced_motion bereits respektiert.
KEINE eigenen Animation-Frameworks (framer-motion, gsap, etc.).
KEIN inline-style mit animation:.
`.trim()
}
