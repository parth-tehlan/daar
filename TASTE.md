# TASTE.md — Daar design language

Daar is a UI mockup for buying off-plan property in Dubai. It's meant to be shown to a
decision-maker. It should look like it came from an architecture practice or a good
print studio, not from a template or an AI generator. Every rule here is there to keep
it from looking generated.

---

## 0. The one idea

**The paper stays still and the city moves.**

The UI is printed matter: flat surfaces, hairline rules, exact type, no decoration.
All the motion and depth come from one place, which is the 3D wireframe city. When the
user answers a question or picks a property, the **camera** responds. The interface
doesn't animate itself in.

---

## 1. Colour: plates from Sanzo Wada, *A Dictionary of Color Combinations*

Every colour comes from a real plate in the book. Three themes ship. 166 is the default.
Users switch with a small "Plate 166 / 303 / 296" control in the footer.

### Plate 166 (default): Deep Slate Green · Naples Yellow · Grenadine Pink
| token            | hex       | use |
|------------------|-----------|-----|
| `--ink`          | `#112f2c` | 3D canvas background, primary text on paper, onboarding background |
| `--ink-2`        | `#183c38` | raised surfaces on ink (rare) |
| `--paper`        | `#faf3dc` | detail/list panel background |
| `--paper-2`      | `#f3e6bc` | selected row, input track fill, quiet blocks |
| `--naples`       | `#fbe6a0` | pure plate colour, used for highlight fills only |
| `--accent`       | `#f48067` | Grenadine Pink. The off-plan tower in 3D, slider thumbs, the active state. On ink it can be text. |
| `--accent-ink`   | `#b9472f` | accent text on paper (passes contrast) |
| `--line-on-ink`  | `#fdf3d6` | city outlines and text on ink (warm white, never pure #fff) |
| `--muted-on-paper` | `#5f6f66` | secondary text on paper |
| `--muted-on-ink` | `#8fa39b` | secondary text on ink |
| `--rule-on-paper`| `rgba(17,47,44,.14)` | hairlines |
| `--rule-on-ink`  | `rgba(253,243,214,.14)` | hairlines on ink |

### Plate 303: Deep Slate Olive · Naples Yellow · Peach Red · Neutral Gray
ink `#253122`, ink-2 `#2e3c2a`, paper `#f9f2dc`, paper-2 `#f1e4b8`, accent `#f15a30`,
accent-ink `#b23d1a`, muted-on-paper `#5f6658`, muted-on-ink `#b6bfc1` (Neutral Gray, from the plate).

### Plate 296: Slate Color · Sulpher Yellow · Ochraceous Salmon · Pale Raw Umber
ink `#34454c`, ink-2 `#3d5058`, paper `#f8f2d6`, paper-2 `#f5ecc2` (Sulpher Yellow),
accent `#d8a37b`, accent-ink `#71502f` (Pale Raw Umber), muted-on-paper `#6b6a5c`,
muted-on-ink `#a9b6b9`.

### Colour rules
- No gradients anywhere, either in CSS or as background washes. Use flat colour only.
- No pure black (#000) or pure white (#fff).
- No glows, coloured shadows, glassmorphism, or `backdrop-filter` blur.
- The accent is rare. Use it at most once or twice per view. Its main job is to mark
  the off-plan building.
- Status colours (green/red badges) aren't allowed. Show state with type weight,
  a filled vs. hollow dot, or the accent.
- All colours come from CSS variables in `src/styles/tokens.css`. Hardcoded hex values
  in components aren't allowed.

---

## 2. Type

The register is high-ticket real estate and hospitality, not a tech product. The reference sites are Omniyat (Optima + Graphik), Aman (Lyon Display + Whitney), Sotheby's Realty (Freight Big / Mercury + Benton Sans) and Aesop (Suisse Int'l). They pair a refined display serif with a quiet neutral sans, and none of them use monospace.

| role     | family | notes |
|----------|--------|-------|
| Display  | **Zodiak** (Fontshare, ITF free licence) | Weight **300** for display and big figures, and 400 for small serif headings (≤ 22px). Roman only. **Italics are never allowed.** |
| UI/body  | **Switzer** (Fontshare, ITF free licence) | 400 and 500 only. Used for everything that isn't display, including labels, tables and chart ticks. |

Fonts are self-hosted from `src/assets/fonts/` and declared in `base.css`.

### Scale (px). Use only these sizes.
`11 · 12 · 13 · 15 · 17 · 22 · 28 · 40 · 56`

- Body: Switzer 15/1.5. Secondary: 13/1.45.
- **Labels** (the `.label` class): Switzer 12 or 13, **sentence case**, colour `--muted-*`, `letter-spacing: 0.01em`. Example: "Handover", "From", "Why it fits".
- **Banned label styles.** These are the strongest AI-template tells, so don't use them anywhere:
  - monospace text
  - UPPERCASE with wide letter-spacing
  - zero-padded indices (`01`, `02`)
  - step counters like `03 / 07`
  - meta strings in caps joined with `·`, like `DUBAI · OFF-PLAN`
  - status-tag pills in caps
- The **only** uppercase allowed is the `DAAR` wordmark (Zodiak 400, `letter-spacing: 0.34em`). The wordmark stands alone, with no tagline next to it.
- Display: Zodiak 300, 40/1.05 or 56/1.0, `letter-spacing: -0.015em`.
- Big figures (prices, monthly payment, handover quarter, fit score): Zodiak 300 at 22, 28 or 40.
- Small serif headings (section titles such as "Why it fits", "Outside your areas"): Zodiak 400, 22px, without numbering.
- Table and inline figures: Switzer with `font-variant-numeric: tabular-nums lining-nums`.
- Headings must not be bigger than they need to be. The biggest text on any screen is 56px, and only in onboarding.
- No text gradients, no mixed italic emphasis words ("Find your *dream* home"), and no emoji.

### Copy voice
Plain and specific, like a good broker's note. Use **sentence case everywhere** (the wordmark is the only exception).
- Good: "Handover is promised for Q3 2028. This developer's last six towers were delivered 4 months late on average, so plan for Q1 2029."
- Bad: "Unlock your dream investment ✨", "Seamless", "Elevate", "Discover", "Journey".
- Numbers come with units and an estimate marker: "≈ AED 9,840 / mo".
- All figures are placeholders, but they must be internally consistent and plausible for Dubai (AED, sq ft, Q-quarters).

---

## 3. Layout

- Use a 4px base unit and the spacing scale `4 8 12 16 24 32 48 64 96`.
- Separate things with **hairline rules (1px)**. Don't use cards with shadows.
- Border radius: 0 by default and 2px on inputs. Pills are allowed only for small chips
  (999px). No 16–24px "friendly" rounded cards.
- Shadows: none, with one exception. The floating 3D label can have a 1px rule
  outline instead of a shadow.
- Content width inside the panel is up to 560px. The panel itself is 44vw (min 520px,
  max 720px).
- Align to a strict left edge. Numbers align right in tables.
- Touch targets are ≥ 44px even when they look small (pad the hit area).

### Screens
1. **Onboarding (full-bleed ink).** The wireframe city drifts behind at reduced line
   opacity. Show one question at a time, left-aligned, at about 1/3 of the width from
   the left edge. Top-left has the wordmark and nothing else is up there. Bottom has a segmented progress rule (7 hairline segments; completed ones are line-on-ink at full opacity), plus "Back" and "Continue". There is no numeric step counter. A live count ("214 matching projects", Switzer 13, sentence case) sits beside the Continue button and updates as the user answers.
2. **Results (split).** On the left is the paper panel with a list of matches as rows.
   On the right is the city with markers. Hovering a row highlights its marker, and the
   reverse works too.
3. **Detail (split).** The paper panel replaces the list with the property detail. The
   camera flies to the project and the off-plan tower is drawn in accent. "← 12 matches"
   returns to the list.

---

## 4. Motion

**Banned** (these are the AI-template giveaways):
- Fade-in or slide-up when elements enter, whether on mount or on scroll
- Staggered list reveals
- Scroll-triggered reveals of any kind
- Count-up number animations
- Hover scale or lift on cards or buttons
- Bouncy or spring easing on UI
- Shimmer or skeleton loaders, pulsing glows, gradient borders
- Parallax on UI

**Allowed** (all functional):
- Colour and border transitions on hover/focus/active, 120ms `ease-out`.
- The progress segment filling, 240ms.
- Switching between onboarding steps is an **instant cut**. The camera does the moving.
- The list → detail swap is an **instant cut** in the panel. The camera flies to the
  project over 1400ms with a cubic ease-in-out.
- A 3D camera drift (very slow orbit, < 0.6°/s). It stops while the user drags.
- Slider thumbs follow the pointer directly with no easing.
- Respect `prefers-reduced-motion`: the camera cuts instead of flying, and the drift
  is off.

---

## 5. The 3D city

- Real Dubai geometry baked from OpenStreetMap (buildings, major roads, coastline).
- Buildings are drawn as **outlines only**. Extruded footprints are rendered as meshes
  in the exact `--ink` colour (so they hide the lines behind them), with `EdgesGeometry`
  line segments on top in `--line-on-ink`. Use polygonOffset on the fill. The result
  should read like an architectural hidden-line drawing.
- Line opacity falls off with distance (fog to `--ink`), so the city reads in depth.
- Roads: thin lines on the ground plane at about 25% opacity. Coastline/water edge:
  one continuous line at about 60%. No filled water and no ground texture.
- **The off-plan project** is a synthesised massing (it doesn't exist yet), drawn in
  `--accent` with **dashed** edges. A thin vertical leader rises from its roof to a DOM
  label in the overlay with two lines: the project name in Zodiak 400 15, then "46 floors, handover Q3 2028" in Switzer 12 muted.
- Result markers on the overview: a small accent square on the ground with a hairline
  vertical stem. No pins, no bouncing, no pulsing.
- No bloom, no post-processing, no sky, no lights (none are needed for lines).
- A tiny north arrow and scale bar sit in the corner in Switzer 12 ("N", "500 m"). Don't show coordinate readouts, which look techy rather than luxury.

---

## 6. Components

- **Choice rows** (onboarding): full-width rows separated by hairlines. Each row has a 10px square marker on the left (1px muted outline; filled `--accent` when selected), the label in Switzer 22, and the description below in 13 muted. There are no indices and no checkmark icons in circles.
- **Sliders**: a 1px track, a 2px filled portion in line colour, and a 14px square thumb
  in accent. Show the value above the thumb in Switzer 13 tabular. The budget slider has a hairline
  histogram of inventory above the track.
- **Buttons**: the primary is a solid ink rectangle with paper text (or the reverse on
  ink), 44px tall, 0 radius, label in Switzer 15/500, optionally ending in `→`. The secondary is
  a text button with an underline on hover. Only one primary per view.
- **Charts**: hand-built SVG. Hairline axes and Switzer 11 tick labels, with no gridlines
  except a baseline. The projection range is a flat `--paper-2` area with an ink
  median line. No chart libraries.
- **Stat blocks**: a sentence-case label (Switzer 12 muted) above a figure (Zodiak 300, 28), separated by vertical hairlines in a row.
- **Icons**: avoid them. Where one is unavoidable, use a text glyph (← → ↑ × +) in the running font.

---

## 7. Final check before you hand anything back

1. Would this look at home on an architecture firm's website? If it looks like a SaaS
   landing page, it fails.
2. Look for anything that fades or slides in. Remove it.
3. Look for anything rounded more than 2px (except chips), or with a shadow or gradient.
   Remove it.
4. Look for any italic text. Remove it.
5. Count the uses of the accent in the view. If there are more than 2 or 3, cut them.
6. Every number needs a unit and must be tabular.
7. Search for `font-mono`, `text-transform: uppercase`, `letter-spacing` above 0.02em, and zero-padded numbers. The only allowed hit is the wordmark.
8. Would this look at home on Aman's or Omniyat's website? If it looks like a developer tool, it fails.
