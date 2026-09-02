# Alerego Design System

Cinematic photographer portfolio. Rhythm borrowed from Runway (media as UI, invisible chrome, tight type). Material is photography: light, skin, fabric, set. Not a Runway clone. Not Apple. Not Liquid Glass.

**Design read:** landing + portfolio for brands and creators. Awwwards / studio motion adapted to real frames.  
**Dials:** DESIGN_VARIANCE 9 · MOTION_INTENSITY 8 · VISUAL_DENSITY 3

---

## 1. Visual Theme

Full-bleed plates, oversized subjects, scroll as scene change. The interface recedes. Color lives in the photographs. Depth is layering (z-index L0–L4), scale, and parallax on `transform` only.

One typeface. One accent. One radius scale. Zero shadows on chrome. Zero `backdrop-filter`.

---

## 2. Color

Photography supplies most of the hue. Chrome is still dark, but each world has its own gel:

| Page | Ground | Accent |
|---|---|---|
| Home / About | wine `#1a0b10` | coral `#ff4d3a` (home identity) |
| Cosplay | plum black `#140c18` | cinematic violet `#b07ac8` |
| Corporate | forest black `#0e1715` | eucalyptus `#7eb8a4` |

Nav chips and world tiles use violet + eucalyptus on every page (not violet + orange). Home stays coral. No neon fuchsia. No electric teal. No amber. No slate UI.


---

## 3. Typography

**Family:** Outfit (self-hosted woff2), fallback `ui-sans-serif, system-ui, sans-serif`.  
Never Inter. Never a second family for emphasis (italic/bold of Outfit only).

| Role | Size | Weight | LH | Tracking |
|---|---|---|---|---|
| Display / H1 | clamp(2.5rem, 6vw, 4.5rem) | 400 | 1.05 | -0.04em |
| Section H2 | clamp(1.75rem, 3vw, 2.5rem) | 400 | 1.1 | -0.03em |
| Body | 1rem | 400 | 1.45 | -0.01em |
| Button / nav | 0.875rem | 600 | 1.2 | 0 |
| Label | 0.75rem | 500 | 1.3 | 0.08em (uppercase, max 1 per 3 sections) |

Headings: `text-wrap: balance`. No em-dash in any copy.

---

## 4. Shape and chrome

- Radius: **6px** everywhere (buttons, images, inputs). Not pills. Not 2.5rem blobs.
- Shadows: **none** on UI. Photographic depth only.
- Borders: 1px `--hairline`.
- Nav: solid `--ink-2`, height 64–72px, max 80px, one row desktop, hairline bottom. **Not glass.**
- Buttons: accent fill primary; hairline + paper text secondary. Hover darkens fill or brightens border. `:active` `scale(0.98)`. Focus: 2px accent ring, never `outline: none` without replacement.

---

## 5. Layers (z-index)

| Layer | z | Use |
|---|---|---|
| L0 | 0 | Grade / atmosphere (solid color or photo plate dimmed) |
| L1 | 1 | Full-bleed photographic plate |
| L2 | 2 | Cutout / oversized subject |
| L3 | 3 | Type and CTAs |
| L4 | 40 | Solid nav |
| Lightbox | 50 | Full-screen viewer |
| Skip | 60 | Skip link |

---

## 6. Motion

- Animate `transform` and `opacity` only.
- Parallax: CSS `animation-timeline: scroll()` on L1 vs L2.
- Sticky stack: pin world scenes (`position: sticky; top: 0`).
- One horizontal device max (prefer none if sticky stack is used).
- `@media (prefers-reduced-motion: reduce)`: freeze layers, no pin scale.
- No `window` scroll listeners. No `transition: all`.

---

## 7. Layout

- Hero: `min-height: 100dvh`, top padding max 6rem, H1 ≤ 2 lines, subtext ≤ 20 words, CTAs in first viewport.
- Container: 1400px cinema width for grids; hero edge-to-edge.
- Section rhythm: stacked scene, then editorial grid, then footer. Do not repeat the same layout family.
- Mobile `<768px`: single column, subject still large, type above or over lower third with solid scrim.

---

## 8. Do / Don't

**Do**
- Let photographs be the page.
- Offset type; avoid centered hero.
- Use real set covers from `/media/` when the API is up; generated plates are fallback only.
- One H1 per page. Unique title, description, canonical, og:image.

**Don't**
- Liquid Glass, `backdrop-filter`, frosted nav, inner refraction, white/10 glass cards.
- Tailwind CDN, Inter, AI purple, three equal feature cards, em-dash, scroll cues, pill nav.
- Fake dashboards, version stamps, locale/weather strips, logo-wall-in-hero.
- `h-screen` (use `100dvh`). Pure `#000` / `#fff`.
