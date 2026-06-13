# Product

## Register

product

## Users

Solo operator (Pepe) running a 7-agent AI pipeline that scans restaurants, builds them demo websites, and deploys them to Vercel. Uses this dashboard daily to trigger agents, monitor pipeline runs, review leads, and open live demo sites. Works at a desktop, in focused bursts, needs high information density without visual noise.

## Product Purpose

MONEYLAN Command Center is the control panel for an automated restaurant-website sales pipeline. Lets the operator: enter a restaurant URL or Google Maps link to start the pipeline, monitor all 7 agents, review the leads produced, and open or trigger demo site builds. Success = operator can go from URL to deployed demo site without touching n8n directly.

## Brand Personality

Precise, industrial, unsentimental. The dashboard is a tool, not a show. It should feel like the kind of interface a solo hacker builds for themselves: no chrome, no decorative noise, just the exact information needed at the right moment. Like a Bloomberg terminal that respects good typography.

## Anti-references

- Generic SaaS dashboards (Vercel, Railway dark mode): too rounded, too padded, too much empty space
- Cyberpunk neon excess: scanlines, grid overlays, glowing borders on everything at once
- Dashboard template clones: the "metric card + chart + table" SaaS template that every AI dashboard produces
- Glassmorphism cards: blur + border together as decoration

## Design Principles

1. **Information first, decoration last.** Every pixel earns its place by conveying state, data, or affordance. If it's only decorative, remove it.
2. **Hierarchy through contrast, not repetition.** One strong typographic moment per section. Everything else recedes.
3. **State is color.** Neon colors are reserved for live state (running, error, done). Inactive elements use muted tones. Saturation is a signal, not a style.
4. **Motion conveys change, not entrance.** Animations exist only to communicate state transitions. No page-load choreography.
5. **Density without clutter.** Pack the information, but give each element enough room to breathe individually.

## Accessibility & Inclusion

WCAG AA minimum. The operator is the only user so constraints are light, but text contrast must be readable in bright office lighting. Reduced motion supported via CSS media query already present.
