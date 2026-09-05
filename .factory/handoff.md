# Daily Range Puzzle handoff

## Independent verification 2

Verification on 2026-09-05 is **FAIL** with 6 findings and 8 untested public
claims. The full evidence and required next work are in
[`verification-2.md`](verification-2.md).

All 11 declared claim commands, 6 unit tests, 18 E2E tests, the build, live
offline flow, live axe scans, and Lighthouse passed. Live also matches the
`aaefed8` implementation byte-for-byte. Acceptance is blocked by the low-
contrast 404 footer, mobile links below 44 px and 6 px header spacing,
incomplete public claim coverage and copy audit, missing generated-art
disclosure, and incomplete shared chrome on the 404 page.

The implementation reviewed remains
`aaefed8231e029f159e75ba634b8ddb7e5562bce`. The builder documentation baseline
is `079d56ee1a713a6e6a09f8effcd6ce3e270e0b90`; `ccc9a58` changes only Graphify
output.

## What changed

Daily Range helps friends solve a short daily relay map together. The first
landing action is **Try it with sample data**. It opens `/demo`, a populated
sample route with a persistent demo banner, **Reset demo**, and **Start for
real**.

The final deployed implementation is
`aaefed8231e029f159e75ba634b8ddb7e5562bce`. The primary product repair is
`0c4a7c3`; later implementation commits fix the Static Web Apps 404 routing.
This handoff is committed separately after deployment.

- Added `.factory/claims.json` with 11 executable, outcome-based claims.
- Added separate `demo:daily-range:*` storage. Reset clears only demo storage.
- Added a pre-started sample route. Completing it never changes a real game
  record.
- Restricted first-move sharing to relays with at least one valid second move.
  Incoming dead-end links now show a recovery note instead of pinning a loss.
- Added strict calendar-date validation and clear invalid-link recovery text.
- Added visible manual-copy recovery when sharing is blocked by browser
  permissions.
- Reworked mobile layout so the first screen and puzzle reflow at 200% text
  size. Header, footer, skip link, and map tiles meet the 44 px target rule.
- Added route titles, canonical and social metadata, sitemap, apple touch icon,
  a designed HTTP 404 page, immutable hashed-asset caching, and CSP headers.
- Updated the service worker to cache built assets at install and to reload the
  demo offline after the first visit.
- Added the demo guide, copy audit, catalog description, and updated README and
  visual thesis/provenance.

## Verification

Clean setup and full checks:

```sh
npm ci
npm audit --audit-level=moderate
npm test
npm run build
npm run test:e2e
```

Results:

- `npm audit --audit-level=moderate`: 0 vulnerabilities.
- `npm test`: 6/6 passed.
- `npm run build`: passed; `dist/index.html` exists.
- `npm run test:e2e`: 18/18 passed.
- Every command in `.factory/claims.json` was run individually from that clean
  setup and passed.
- Local worker URL verification passed for `/demo`: title, language, one h1,
  main landmark, image alt text, and zero console errors.
- Playwright axe scans have zero serious or critical violations.
- Local 390 px/200% text check has `scrollWidth === clientWidth` (390 px).
- Local production output: 18.37 KB JavaScript (7.27 KB gzip), 14.96 KB CSS
  (4.24 KB gzip), and a 100.83 KB hero WebP.
- Local Lighthouse 10.9.8 JSON report: Performance 100, Accessibility 100,
  Best Practices 100, SEO 100; FCP 1.0 s, LCP 1.1 s, CLS 0. The headless
  report emitted a post-capture target-crash warning, but wrote complete scores
  and exited successfully on the final run.

Live checks on `https://daily-range-puzzle.sociobot.in`:

- Deployment completed successfully with the durable existing Static Web App;
  no backend, database, volume, or replica settings apply to this static
  product.
- Fresh desktop and phone contexts loaded without console errors. The desktop
  first screen states the job, audience, first action, price, privacy, and
  offline facts before scrolling.
- Live sample completed, retained its demo label, reset, and preserved a seeded
  real-storage record. Live demo offline reload also passed.
- Live `/privacy` and `/terms` both return 200 with route-specific titles.
  An unknown route returns HTTP 404 with the designed recovery page.
- The live verifier and live axe scan report zero console errors and zero
  serious/critical violations.
- Live hashed JS returns `Cache-Control: public, max-age=31536000, immutable`.
  The live CSP, referrer policy, and nosniff headers are present.
- Live `index.html`, JavaScript, CSS, hero WebP, service worker, and 404 page
  match the final `dist/` output byte-for-byte.

## Earlier findings

The demo, dead-end cooperative links, 200% text clipping, clipboard recovery,
invalid dates, immutable asset caching, and CSP findings from
`verification-1.md` are resolved. The claims manifest now exists and every
declared command passes, but verification 2 found missing and incomplete public
claim coverage. The mobile target repair fixed heights but not the narrow Demo
and Terms links or the 6 px header spacing.

## Known limits

The game remains intentionally static and local-first. Cooperative play is a
turn-based URL handoff, not live chat or presence. The free brief has no paid
offer, so billing registration and `/work/.evidence/billing-offer.json` do not
apply.

## Open verification defects

- Fix the 404 footer background so its text contrast reaches 4.5:1.
- Make every mobile link target at least 44×44 px and separate adjacent header
  targets by at least 8 px.
- Complete claims coverage and the landing copy audit.
- Disclose generated artwork in the footer.
- Add the build identifier and consistent navigation to the 404 chrome.
