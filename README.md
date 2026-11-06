# Daar

A UI mockup for browsing off-plan property in Dubai. You answer a few questions, see the matched projects on a 3D hidden-line model of the city, and open any project for its handover estimate, payment plan, mortgage, rent and appreciation figures.

**All prices, yields, developers and projects are placeholder data.** The developer and project names are made up. The building, road and coastline geometry comes from © OpenStreetMap contributors (ODbL). The colours come from Sanzo Wada, *A Dictionary of Color Combinations*.

## Run locally
```
npm install
npm run dev
```

## Demo links
- `?view=results` opens the results with demo answers
- `?view=detail&id=seventeen-canal` opens a project detail page (also `marsa-21`, `harbour-row`, `ghaf-residences`)
- `&plate=303` or `&plate=296` switches the colour plate

## Deploy
Every push to `main` builds and deploys to GitHub Pages through `.github/workflows/deploy.yml`.

The design language is in `TASTE.md`. The project notes for coding agents are in `CLAUDE.md` and `AGENTS.md`.
