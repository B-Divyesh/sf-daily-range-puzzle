# Daily Range Puzzle — build handoff

## What shipped

- Complete deterministic daily 7×5 hex puzzle with guaranteed valid routes.
- Clear 1 hex = 1 km scale; two-relay, 3 km-per-hop, lookout, and blocked
  terrain rules with immediate textual and visual feedback.
- Cooperative share link carrying only the date and first relay coordinate;
  incoming links pin the teammate move. Completed puzzles create a
  spoiler-safe share card.
- Full touch, mouse, and keyboard play (arrows, Enter/Space, Backspace), 44 px
  mobile targets, date replay, invalid-link handling, optional local-only
  completion restore, and offline shell/map generation.
- Responsive field-notes risograph visual system. Original AI-assisted hero
  was generated with the factory Azure image deployment, reviewed, and reduced
  from a retained source PNG to a 100.83 KB WebP. Prompt and provenance live in
  `.factory/design.md` and `assets/src/range-field-map.png.json`.
- Semantic page structure, one h1 per route, skip link, named controls, visible
  focus, color-independent terrain symbols, live status, reduced-motion mode,
  privacy and terms routes, PWA manifest/service worker, robots policy, and
  static-host security headers.

## How to run and verify

```sh
npm install
npm test
npm run build
npm run test:e2e
```

Build command: `npm run build`. Deployment root: `./dist`; `dist/index.html`
is present at that root. The browser suite uses Playwright 1.58.2 and runs at a
390×844 viewport, covering initial load/console, 44 px tile targets, first-move
co-op flow, a full valid solution, privacy, and axe-core.

Verified 2026-08-28:

- Vitest: 5/5 passed, including determinism and solvability sampling.
- Playwright: 6/6 passed; no console errors in the load smoke test.
- axe-core 4.13: 0 serious or critical violations.
- `npm audit`: 0 vulnerabilities.
- Production payload: 13.45 KB JS (5.96 KB gzip), 11.64 KB CSS (3.60 KB
  gzip), 100.83 KB hero WebP; Lighthouse transfer total 111 KB.
- Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100,
  SEO 100; FCP 1.0 s, LCP 1.1 s, TBT 90 ms, CLS 0. Lab run used headless
  Chromium against the local production preview.
- Desktop and 390 px full-page screenshots were manually inspected; layout,
  map labels, hero crop, and focus/touch affordances remain legible.

## Known gaps / next steps

- The cooperative layer is deliberately turn-based through a URL, not live
  presence or chat, matching the brief's static/no-account scope.
- Browser Web Share behavior varies by platform; the implementation falls back
  to clipboard where Web Share is unavailable.
- Product success metrics are intentionally not collected in-product because
  the privacy contract forbids gameplay analytics. The hosting layer may add
  an aggregate privacy-preserving page count outside this repository.
