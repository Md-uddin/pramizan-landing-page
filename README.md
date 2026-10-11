# PRAMIZAN PRIVATE LIMITED — website source

A single-page marketing site built with React, TypeScript, Vite and
[Motion](https://motion.dev) (formerly Framer Motion). Fonts (Schibsted Grotesk
and IBM Plex Mono) load from Google Fonts.

## Run it

Requires Node.js 18 or newer.

```bash
npm install
npm run dev        # local dev server at http://localhost:5173
npm run build      # production build into dist/
npm run preview    # serve the production build locally
```

`dist/` is a plain static site; upload its contents to any static host.

## What each file does

| File | What to edit |
| --- | --- |
| `index.html` | Page title, description, social metadata, font links |
| `src/App.tsx` | All page copy and section structure |
| `src/components/Header.tsx` | Navigation links, sticky header, mobile menu |
| `src/components/SystemGraph.tsx` | The animated 3D layer graph in the hero |
| `src/components/Reveal.tsx` | Shared scroll-in animation settings |
| `src/components/Icons.tsx` | Arrow and capability icons |
| `src/styles.css` | Colours, typography, spacing, responsive layouts, hover/focus styles |

## Set the company name

`PRAMIZAN PRIVATE LIMITED` appears in `index.html` (title and metadata),
`Header.tsx` and the footer in `App.tsx`. Use Find and Replace across the project.

## Contact email

The contact panel links to `info@pramizan.com` (in `src/App.tsx`, search for
`mailto:`). An email link opens the visitor's own email app; no form or booking
service is connected.

## Change the wording

Copy lives in `src/App.tsx`: the `capabilities`, `principles` and `steps` arrays
at the top, and the JSX below. Keep the section IDs (`capabilities`,
`how-we-work`, `process`, `contact`) so the navigation links keep working.
Do not add unverified client claims or results.

## Brand colours

The official palette is defined once at the top of `src/styles.css`. Every other
colour on the site derives from these variables, so change them there only.

| Variable | Value | Use |
| --- | --- | --- |
| `--brand-navy` | `#141A2E` | Text, dark section, logo pillar |
| `--brand-blue` | `#2F4BFF` | Accent, buttons, contact panel, logo arc |
| `--brand-paper` | `#FAFAF8` | Page background |

Buttons use `--button-bg` (navy) with a `--button-icon-bg` (electric blue) disc.

Each has an `-rgb` twin (e.g. `--brand-blue-rgb`) for transparent tints:
`rgb(var(--brand-blue-rgb) / .2)`. Semantic tokens such as `--ink`, `--muted`,
`--on-night` and `--on-blue` sit below them and are contrast-checked (WCAG AA).

The official logo SVG lives in `src/components/Logo.tsx`. Its colours come from
the `.logo-pillar` and `.logo-arc` CSS rules, so it follows the palette.

## Pointer effects

`src/components/PointerEffects.tsx` adds a soft light that trails the cursor and
the "spotlight" borders in the How we work grid, capability rows and contact
panel. `src/components/Magnetic.tsx` pulls the main buttons toward the cursor.
All of them run for mouse users only and switch off with reduced motion.

## Before launch

- Test navigation links, keyboard focus and the skip link.
- Check widths down to 320px for overflow.
- Remove `<meta name="robots" content="noindex, nofollow">` from `index.html`
  only when you choose to launch publicly. That tag is not access control.
