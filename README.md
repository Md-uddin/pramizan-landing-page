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

## Activate the email action

The preview deliberately has a disabled button because no email address was
provided. In `src/App.tsx`, find `className="contact-action"` and replace the
`<button>` and the "Preview only" paragraph with:

```tsx
<a className="email-button" href="mailto:YOUR_REAL_EMAIL">
  <span>YOUR_REAL_EMAIL</span>
  <span className="button-icon" aria-hidden="true"><ArrowUpRight /></span>
</a>
```

Do not leave `YOUR_REAL_EMAIL` in the finished page. An email link opens the
visitor's configured email app; no form or booking service is connected.

## Change the wording

Copy lives in `src/App.tsx`: the `capabilities`, `principles` and `steps` arrays
at the top, and the JSX below. Keep the section IDs (`capabilities`,
`how-we-work`, `process`, `contact`) so the navigation links keep working.
Do not add unverified client claims or results.

## Change colours and sizes

The `:root` block at the top of `src/styles.css` defines the main colours:

| Variable | Current value | Purpose |
| --- | --- | --- |
| `--paper` | `#f7f6f2` | Warm page background |
| `--ink` | `#1c1f1b` | Main text |
| `--muted` | `#565b54` | Paragraph text |
| `--soft` | `#646a62` | Lightest allowed text (captions) |
| `--blue` | `#2b4683` | Main accent and buttons |
| `--night` | `#131a2c` | Dark "How we work" section |
| `--line` | 12% ink | Subtle borders |

Animation curves live in the same block. The hero graph's colours are the
`.sg-*` rules in `styles.css`; its geometry, speed and cursor response are the
constants at the top of `SystemGraph.tsx`. Every animation respects the
visitor's reduced-motion setting.

## Before launch

- Replace the contact placeholder.
- Test navigation links, keyboard focus and the skip link.
- Check widths down to 320px for overflow.
- Remove `<meta name="robots" content="noindex, nofollow">` from `index.html`
  only when you choose to launch publicly. That tag is not access control.
