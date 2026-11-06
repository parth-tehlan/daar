# AGENTS.md: rules for implementation subagents

You are writing code for **Daar**, a UI mockup for browsing off-plan property in Dubai.
A lead designer gives you a scoped task. Your job is to carry it out exactly and
precisely. Don't invent a different design.

## Before you write any code
1. Read `TASTE.md` in full. It's the design law. If your task brief and TASTE.md
   conflict, follow the brief and say so in your report.
2. Read `CLAUDE.md` for the stack, the folder layout, and the file-ownership map.
3. Read `src/types.ts` and `src/styles/tokens.css`. These are shared contracts.
   **Don't edit them** unless your brief says you may. If you need a new field or
   token, say so in your report.

## Ownership
- Only create or edit files inside the paths your brief assigns you. Other agents are
  working in parallel on other folders.
- If you need something from another area, code against the interface in
  `src/types.ts` and leave a `// TODO(integration):` comment.

## Code standards
- React 19 + TypeScript (strict) + Vite. Function components and hooks only.
- Styling: plain CSS files co-located with components (`Foo.tsx` + `Foo.css`), using
  BEM-ish class names that start with the component name. Every colour, size and
  spacing value comes from `var(--token)`. **Don't hardcode hex values or px font
  sizes** outside tokens.css (the 3D scene is the exception: it reads CSS vars at
  runtime through `getComputedStyle`).
- Don't add UI libraries (no Tailwind, MUI, shadcn, framer-motion, chart libs, or icon
  packs). The only allowed runtime deps are react, react-dom, three,
  @react-three/fiber and @react-three/drei. Fonts are self-hosted files; don't add font packages. Ask before
  adding anything else.
- Don't add entrance animations of any kind (see TASTE.md §4). Use `transition` only
  for colour, border-color, background-color, and the progress fill.
- Accessibility: use real `<button>`/`<input type="range">` elements, visible
  `:focus-visible` outlines (1px solid currentColor, offset 2px), and labelled
  controls. Keep keyboard flows working (Enter = continue, number keys pick options in
  onboarding).
- Keep components small. No file over about 300 lines; split it if it grows.

## Verification (required)
- Run `npm run build` and make sure it has zero TypeScript errors.
- Take a screenshot of your work with the QA rig:
  ```
  node ~/.cache/qa-rig/shot.mjs <url> <out.png> [width] [height] [waitMs] [actionsJson]
  ```
  Start the dev server with `npm run dev -- --port 5173 --strictPort` in the background
  if it isn't already running (check with `curl -s localhost:5173`). Save screenshots
  to `qa/` inside the project. **Look at your screenshots** with the Read tool and fix
  anything that breaks TASTE.md before you report.
- `actionsJson` is an array of steps, e.g.
  `[{"click":"text=Rent it out"},{"press":"Enter"},{"wait":500},{"shot":"qa/step2.png"}]`.

## Report back
Keep the report short:
- the files you created or changed
- what you did, in 3–6 bullets
- the paths of the screenshots you took
- any deviations from the brief or TASTE.md, and any contract changes you need
