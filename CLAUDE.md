# CLAUDE.md: Daar (off-plan property in Dubai, UI mockup)

## What this is
Daar is a high-fidelity **UI mockup** of a site for buying off-plan property, starting
with Dubai (the rest of the GCC comes later). All prices, yields and developer records
are **placeholder data**, but they have to be plausible and internally consistent.
The audience is a business stakeholder, so polish and taste matter more than features.

## The product flow
1. **Onboarding.** Requirements are asked one question at a time over the live 3D city:
   purpose, budget, size, handover window, financing, areas, priorities.
2. **Results.** The left panel lists the matched projects. The right side is a 3D
   wireframe of Dubai with markers.
3. **Detail.** Clicking a project replaces the list with its detail page (why it fits,
   handover estimate from the developer's track record, payment plan, mortgage, rent,
   appreciation). The camera flies to the project's real location, and the unbuilt
   tower is drawn in the accent colour.

## Docs
- `TASTE.md` is the design language. It's binding. Read it before any UI work.
- `AGENTS.md` holds the rules for implementation subagents.

## Stack
Vite + React 19 + TypeScript, three.js through @react-three/fiber (+ drei helpers),
plain CSS with design tokens, and self-hosted Zodiak + Switzer (Fontshare, ITF free
licence) in `src/assets/fonts/`. No UI or chart libraries, and no monospace.

## Commands
- `npm run dev -- --port 5173 --strictPort`
- `npm run build` (typecheck + build)
- `node scripts/fetch-osm.mjs` re-bakes the OSM city data into `public/geo/`
- QA screenshots: `node ~/.cache/qa-rig/shot.mjs <url> <out.png> [w] [h] [waitMs] [actionsJson]`

## Layout and ownership
```
src/
  main.tsx, App.tsx          app shell + view state         (lead / integration)
  types.ts                   shared contracts               (lead only)
  styles/tokens.css          design tokens + 3 Wada themes  (lead only)
  styles/base.css            reset, fonts, globals          (lead only)
  state/                     app store (answers, selection) (onboarding agent)
  onboarding/                question flow                  (onboarding agent)
  scene/                     3D city, camera, markers, label overlay (scene agent)
  data/                      placeholder projects, developers, matching (results agent)
  results/                   list + detail panel, calculators, SVG charts (results agent)
scripts/fetch-osm.mjs        Overpass → public/geo/*.json   (scene agent)
public/geo/                  baked city geometry            (scene agent)
qa/                          screenshots                    (anyone)
```

## Conventions
- Colours come only from CSS variables. The theme is `data-plate="166|303|296"` on `<html>`.
- All motion follows TASTE.md §4: the UI cuts and the camera moves.
- Use the coordinates in `DISTRICTS` (`src/types.ts`). The world origin is
  lat 25.1500, lon 55.2300. Use an equirectangular projection to metres
  (x = east, z = −north, y = up).

## Demo URLs (dev)
- `/` starts onboarding from scratch
- `/?view=results` shows results with demo answers
- `/?view=detail&id=seventeen-canal` shows detail (also `marsa-21`, `harbour-row`, `ghaf-residences`)
- `&plate=303` or `&plate=296` switches the Wada colour plate (also in the panel footer)
