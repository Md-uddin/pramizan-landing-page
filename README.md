# PRAMIZAN PRIVATE LIMITED — website source

This is the complete, editable source of your private website preview.
It uses plain HTML, CSS and one small script (`main.js`). There are no packages
to install, build commands, or JavaScript dependencies. Fonts (Schibsted Grotesk
and IBM Plex Mono) load from Google Fonts; without a connection the page falls
back to system fonts.

## Open the website

1. Extract the ZIP file.
2. Open the `ai-engineering-website` folder.
3. Double-click `index.html` to view the page in your browser.

Keep `index.html`, `styles.css` and `main.js` in the same folder. Edit either file using
a plain-text code editor, save it, then refresh your browser to see the changes.

## What each file does

| File | What to edit |
| --- | --- |
| `index.html` | Company name, page copy, contact details, page title, metadata, and decorative illustration |
| `styles.css` | Colours, typography, spacing, animation, responsive layouts, and hover/focus styles |
| `main.js` | Sticky header, scroll-in animations, and the mobile menu. The page stays fully readable if it fails to load |
| `README.md` | These instructions |

## Set the company name

The company name is set to `PRAMIZAN PRIVATE LIMITED` in the navigation,
footer, accessible home-link label, and browser page title. To change it later,
use your editor's Find and Replace command in `index.html`.

## Activate the email action

The preview deliberately has a disabled button because no email address was
provided. Search for `class="contact-action"` in `index.html` and replace that
entire div with the following block, using your real email in both places:

```html
<div class="contact-action">
  <a class="email-button" href="mailto:YOUR_REAL_EMAIL">
    <span>YOUR_REAL_EMAIL</span>
    <span class="button-icon" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="M5 11 11 5M6 5h5v5"/></svg></span>
  </a>
</div>
```

Do not leave `YOUR_REAL_EMAIL` in the finished page. Replacing this div also
removes the preview-only note. An email link opens the visitor's configured
email app; it does not submit a message or guarantee delivery. No form or
booking service is connected.

## Change the wording

Edit the text inside headings and paragraphs in `index.html`. The main sections
are identified by `id="capabilities"`, `id="how-we-work"`, and `id="contact"`.
Keep these IDs if you want the current navigation links to continue working.
The process section follows the working-relationship section.

Update the `<title>` and `<meta name="description">` near the top if you change
the business positioning. Do not add unverified client claims or results.

## Change colours and sizes

At the top of `styles.css`, the `:root` block defines the main colours:

| Variable | Current value | Purpose |
| --- | --- | --- |
| `--paper` | `#f7f6f2` | Warm page background |
| `--ink` | `#1c1f1b` | Main text |
| `--muted` | `#565b54` | Paragraph text |
| `--soft` | `#646a62` | Lightest allowed text (captions) |
| `--blue` | `#2b4683` | Main accent and buttons |
| `--night` | `#131a2c` | Dark "How we work" section |
| `--line` | 12% ink | Subtle borders |

Animation curves live in the same block (`--ease-out`, `--ease-in-out`,
`--ease-drawer`). Every animation respects the visitor's reduced-motion setting.

The illustration in `index.html` also contains explicit SVG colour values.
If you change the blue palette, update those to match. Related light-blue shades
in the contact section are defined directly in `styles.css`.

Search for `.hero h1` to change the main heading size and `.wrap` to change the
page width. The large outlined PRAMIZAN in the footer is `.footer-giant`. Media queries near the end adapt the design to smaller screens;
check those rules when adjusting font sizes or spacing.

## Review your changes

- Test every navigation link and the back-to-top link.
- Test the email link with your configured email application.
- Check desktop and mobile widths, including 320px and 375px, for overflow.
- Press Tab to check visible focus, navigation order, and the skip-to-content link.
- Keep adequate text contrast and the reduced-motion CSS rule.

The original preview passed source checks for navigation targets, semantic
structure, metadata, and accessibility markup. Browser-based visual and
keyboard testing was not available, so that review remains necessary.

## Publishing and updating the hosted preview

Editing these downloaded files changes your local copy only. It does not change
the private hosted preview. You can upload the edited files here and ask for the
preview to be updated, or use the files with a static web host of your choice.

This package excludes account credentials and platform-specific configuration.
No publishing action is performed by opening or editing it.

Before a public launch, replace the contact placeholder and
complete browser testing. The page currently includes:

```html
<meta name="robots" content="noindex, nofollow">
```

Keep this while reviewing. Remove it when you explicitly choose to launch
publicly and want search engines to index the page. This tag is not access
control; private hosting settings are what restrict access to the hosted preview.
