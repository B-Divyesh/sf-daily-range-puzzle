# Verify the daily cooperative relay puzzle — FAIL

- Verdict: **FAIL**
- Finding count: **6**
- Untested public claim count: **8**
- Implementation candidate: `aaefed8231e029f159e75ba634b8ddb7e5562bce`
- Documentation baseline: `079d56ee1a713a6e6a09f8effcd6ce3e270e0b90`
- Repository HEAD inspected: `ccc9a581ce996e48325ae267d241f7876da35526`
- Live URL: <https://daily-range-puzzle.sociobot.in>
- Verified: 2026-09-05 UTC
- Work order: `daily-range-puzzle-verify-2`

The daily map, cooperative handoff, sample sandbox, recovery paths, offline
reload, and deployment identity work. The product is not ready for acceptance
because the 404 footer fails text contrast, small mobile links still miss the
required target geometry, and required claim and documentation contracts are
incomplete.

## Findings

### High — eight public promises do not have valid claim coverage

All 11 entries in `.factory/claims.json` have one tagged test, and every
declared command passed. Cross-checking the live copy and README found eight
additional or incompletely tested promises:

1. “Completed maps stay in your browser” has no manifest entry or tagged
   reload-persistence test.
2. The keyboard help promises arrows, Enter, Space, and Backspace. The
   `keyboard-play` claim test pre-focuses one tile and tests only Enter.
3. “Gameplay does not send events to a server” is broader than
   `privacy-local`; that test allows any same-origin request, including a
   possible same-origin event POST.
4. The README says there are no environment variables, API keys, databases,
   or runtime network services. No claim entry tests that architecture promise.
5. The README promises SPA routing without a corresponding claim entry.
6. The README promises a designed 404 without a corresponding claim entry.
7. The README promises security headers without a corresponding claim entry.
8. The README promises immutable caching without a corresponding claim entry.

Independent checks found these behaviors true in the current build where they
could be observed. That does not satisfy the contract that every public claim
be listed and exercised by its exact claim command on each build.

### Medium — the 404 footer has about 1.14:1 text contrast

On the live unknown-route page, the footer text uses `#fff8e8` over the page
paper `#f3e9d3`, about 1.14:1 instead of at least 4.5:1. The intended blue
`footer::before` layer has `z-index: -1` and is not painted behind the footer.
The phone screenshot and computed styles both show the white text directly on
paper. The main 404 recovery buttons still work, and the response correctly
returns HTTP 404; the deliberate status is not the defect.

Evidence: `/work/.evidence/live-404-footer.png` and
`/work/.evidence/live-links-and-404.log`.

### Medium — mobile link targets and spacing remain below contract minimums

At 390 px, the live header “Demo” link is 37.34×44 px and the footer “Terms”
link is 39.19×44 px. The three header links have 6 px gaps. The attached
contracts require every touch target to be at least 44×44 px and adjacent
targets to be at least 8 px apart. The same short links recur on legal pages;
the 404 footer also has the 39.19 px “Terms” target.

This means the earlier mobile-target finding was only partly resolved. Heights
were increased to 44 px, but widths and header spacing still fail.

Evidence: `/work/.evidence/live-browser.log`.

### Low — the required copy audit is incomplete

`.factory/copy-audit.md` covers the hero, rules, and privacy summary, but not
all copy on the landing page. It omits the embedded puzzle instructions and
states, date control, board help, header, and footer. For example, the public
17-word keyboard instruction is absent. The reviewed text itself is plain and
does not use banned words; the defect is the incomplete required audit.

### Low — generated artwork is not disclosed on the site

The original asset, source PNG, prompt sidecar, and provenance in
`.factory/design.md` are present and visually consistent. The source and
derivatives show no text artifacts, brands, or unintended symbols. However,
the design document says the footer discloses AI-assisted artwork, and the
attached image contract requires a footer or About disclosure. No live route
contains that disclosure.

### Low — the 404 page does not use the complete shared site chrome

The app footer includes the product line, Privacy, Terms, Param Factory, and
`Build 1.1.0`. The 404 footer omits the build identifier. Its header also omits
the “How to play” navigation link used on every app route. This falls short of
the required consistent header and versioned footer on every route.

## First screen before scrolling

Fresh desktop (1440×1000) and phone (390×844) contexts showed all required
copy before scrolling:

- Job: “Solve today’s relay map together.”
- Audience: “For friends who want a short map to solve and share each day.”
- First action: “Try it with sample data.”
- Next-step note: “Opens a pre-started route you can finish.”
- Facts: free to play, no account or tracking, and offline after the first
  visit.

The title names the job, the headline has five words, the audience sentence has
13 words, and the catalog description is 55 characters and begins with a verb.
Fresh desktop and phone loads had no console errors or failed requests.

## Sample and product paths

- The first-screen sample action opened `/demo` in one click.
- The sample opened with relay 1 at `2,1`; relay 2 at `4,2` completed it.
- The completion output was “Route complete. All three hops are within 3 km.”
- The demo label remained visible after completion.
- A seeded real key remained byte-for-byte unchanged after sample completion
  and reset. Reset removed only `demo:daily-range:*`; Start for real retained
  the real key.
- Live result copy was spoiler-safe and contained no relay coordinates.
- A live first-move link contained exactly `day` and `relay` query keys.
- A real completion persisted through reload in local storage.
- Demo and real play created no cookies or session storage. Observed gameplay
  requests were same-origin GETs for the document and static app files only.

## Normal, invalid, boundary, and recovery paths

- A normal two-relay route completed on the 2026-08-28 map.
- A valid shared first move opened pinned and the friend completed it.
- A dead-end first move showed an explanation and had no share action.
- An incoming dead-end link was rejected and returned a playable board.
- Clipboard denial showed a focused, selectable manual-copy message without a
  page error.
- Impossible, malformed, pre-launch, and future dates showed “That date is not
  available” and a playable fallback.
- Launch day `2026-01-01` and verification day `2026-09-05` loaded normally.
- Enter, Space, arrows, and Backspace worked in independent live keyboard
  checks. The board focus used a 5 px carbon ring plus a 4 px mustard inset.
- The skip link appeared on focus and targeted `main`. SPA navigation and the
  Back button moved focus to the route h1 and updated the title.
- Reduced motion changed transitions and animations to 0.01 ms and disabled
  smooth scrolling.
- At 390 px with 200% root text size, document width remained 390 px and the
  hero copy did not clip.

## Routes, accessibility, privacy, and offline use

- `/privacy` and `/terms` returned 200, used route-specific browser titles,
  and each had one h1 and one main landmark.
- An unknown route returned HTTP 404 with the designed recovery page. All its
  real destination links returned 200. Its own `#main` skip link correctly
  remains on the deliberate 404 response.
- Playwright axe found zero serious or critical violations on the landing,
  solved, privacy, terms, and 404 states. The manual 404 contrast failure above
  remains a finding because the pseudo-element layering confused automated
  contrast detection.
- The factory `verify-url.sh` passed live: title, `lang=en`, one h1, main,
  image alt text, labeled buttons, and zero console errors.
- The service worker installed, `registration.update()` completed, and cache
  `daily-range-v4` was present.
- The sample reloaded and remained playable offline. A fresh prior-date
  navigation to 2026-08-27 also loaded offline with the visible offline state.
- The app has no backend. Tenant isolation, SQLite restart persistence, health,
  and 429/Retry-After checks do not apply. There is no CLI, library, desktop
  artifact, payment flow, or AI runtime feature. An AI feature would not improve
  the deterministic three-minute puzzle job, so the missed-leverage check has
  no finding.

## Declared claim commands

The documented clean setup was a fresh clone at `ccc9a58`, whose only changes
after the implementation candidate are `.factory/handoff.md` and Graphify
output. `npm ci` installed the pinned Playwright 1.58.2 setup with zero audit
vulnerabilities.

| Claim | Exact command | Result |
| --- | --- | --- |
| `daily-map` | `npm test -- -t @claim:daily-map` | Pass |
| `map-scale` | `npm test -- -t @claim:map-scale` | Pass |
| `route-rules` | `npm test -- -t @claim:route-rules` | Pass |
| `demo-sandbox` | `npm run test:e2e -- --grep @claim:demo-sandbox` | Pass |
| `keyboard-play` | `npm run test:e2e -- --grep @claim:keyboard-play` | Pass, but incomplete for the detailed public instruction |
| `offline-reload` | `npm run test:e2e -- --grep @claim:offline-reload` | Pass |
| `privacy-local` | `npm run test:e2e -- --grep @claim:privacy-local` | Pass, but does not rule out same-origin event requests |
| `free-to-play` | `npm run test:e2e -- --grep @claim:free-to-play` | Pass |
| `share-finishable` | `npm run test:e2e -- --grep @claim:share-finishable` | Pass |
| `share-link-privacy` | `npm run test:e2e -- --grep @claim:share-link-privacy` | Pass |
| `spoiler-safe-results` | `npm run test:e2e -- --grep @claim:spoiler-safe-results` | Pass |

Raw results: `/work/.evidence/claims/summary.tsv` and per-claim logs under
`/work/.evidence/claims/`.

## Build, tests, performance, and deployment identity

- `npm audit --audit-level=moderate`: pass, 0 vulnerabilities.
- `npm test`: pass, 6/6.
- `npm run build`: pass; `dist/index.html` exists.
- `npm run test:e2e`: pass, 18/18.
- Production sizes: JavaScript 18.37 KB / 7.27 KB gzip; CSS 14.96 KB /
  4.24 KB gzip; hero WebP 100.83 KB.
- Live Lighthouse 12.8.2: Performance 100, Accessibility 100, Best Practices
  100, SEO 100; FCP 0.92 s, LCP 1.21 s, TBT 91.5 ms, CLS 0, transfer
  115,061 bytes.
- Root responses include CSP, no-referrer, nosniff, Permissions Policy, HSTS,
  and no-cache. Hashed JS, CSS, and hero assets return one-year immutable cache
  headers; the service worker returns no-cache.
- Live `index.html`, 404 HTML, JavaScript, CSS, hero image, and service worker
  match the clean candidate build byte-for-byte.

This proves live is the `aaefed8` implementation. The later `079d56e` commit is
documentation only, and `ccc9a58` changes only Graphify output, so neither
requires a different product image.

## Earlier verification findings

| Earlier finding | Current disposition |
| --- | --- |
| Claims manifest absent | Manifest exists and all 11 commands pass, but public coverage is incomplete (finding 1). |
| One-click demo absent | Resolved and verified live. |
| Shared moves can be unfinishable | Resolved by exhaustive unit coverage and live sender/recipient checks. |
| 200% text clips content | Resolved and verified live at 390 px. |
| Clipboard denial has no recovery | Resolved and verified live. |
| Mobile targets under 44 px | Partly resolved; heights pass, but two link widths and header spacing fail (finding 3). |
| Invalid dates normalize silently | Resolved for impossible, malformed, pre-launch, and future dates. |
| Hashed assets lack immutable caching | Resolved and verified in live response headers. |
| CSP absent | Resolved and verified in the live response header. |

## Required next work

1. Add padding and at least 8 px separation so every mobile link target is at
   least 44×44 px.
2. Paint the 404 footer background on the footer itself, then verify at least
   4.5:1 contrast.
3. Add or narrow claims so every public promise has one complete tagged test.
4. Complete the landing copy audit, add the generated-art disclosure, and make
   the 404 header/footer match the shared site chrome.
