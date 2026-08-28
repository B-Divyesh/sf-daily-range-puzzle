# Independent product verification — FAIL

- Candidate: `9ce460079d304357c6d5c72e7df64948ee584c49`
- Live URL: <https://daily-range-puzzle.sociobot.in>
- Verified: 2026-08-28 UTC
- Work order: `daily-range-puzzle-verify-1`
- Verdict: **FAIL — do not release this candidate**

The deployed files match the candidate and the ordinary happy path works, but
two explicit acceptance gates fail before functional scoring: the required
claims manifest is absent, and the first screen has no one-click sample-data
demo. Independent testing also found that most legal first moves create a
cooperative link that the recipient can never finish.

## Release-blocking findings

### Critical — required claims manifest is missing

`.factory/claims.json` does not exist at the tested commit. This was checked
before installation or any other repository test. Consequently, there were no
claim tests to execute. The work order explicitly defines either condition as
release-blocking.

### Critical — required one-click sample-data demo is absent

On a cold load, the first screen says:

- What it does: “Plant two relays. Keep every hop within range.”
- Who it is for: a player and a friend who finish the signal together.
- What to click first: “Play today’s map.”

Those three points are understandable in plain words. However, the DOM has no
action described as sample, demo, example, or “try it,” and the only primary
entry starts the real daily puzzle. This fails the separately required
one-click “try it with sample data” gate.

### High — many shared first moves are impossible for the recipient to finish

The sender may select and share any non-blocked tile, including an over-range
or otherwise dead-end relay. On `2026-08-28`, selecting `4,2` reports “Relay 1
is 4 km from camp” but still enables “Send first move.” The resulting URL is:

`https://daily-range-puzzle.sociobot.in/?day=2026-08-28&relay=4%2C2`

For the recipient, that relay is pinned, “Undo last relay” is disabled, and an
exhaustive browser attempt of all 26 other legal tiles found no completion.
An independent sweep of every available date from 2026-01-01 through
2026-08-28 found 4,205 dead-end first placements out of 5,408 legal placements
(77.8%). The co-op link is the product's central differentiator, so accepting
and sharing unrecoverable states blocks the real job-to-be-done.

### High — 200% text resize clips primary content

At a 390 px viewport with root text resized from 16 px to 32 px, the document
still reports a 390 px scroll width because `main` clips overflow, while the
hero heading grows to 506 px. “Close the distance,” its supporting copy, and
the primary button are visibly cut off at the right edge. This fails the
explicit requirement that text resize to 200% without loss.

## Other defects

### Medium — clipboard-denied share fails without recovery

In Chromium with `clipboard-write` left at `prompt` and no Web Share API,
pressing “Send first move” produces an unhandled `NotAllowedError`, no toast,
and no fallback text or selectable URL. This leaves the core sharing action
apparently inert when clipboard access is denied.

### Medium — several mobile interactive targets are under 44 px

At 390×844, measured interactive boxes below the contract minimum include the
32 px-high home/brand link, 16 px-high footer Privacy and Terms links, and the
42 px-high skip link. Puzzle tiles and primary controls meet the target size.

### Medium — impossible dates are accepted and silently normalized

`/?day=2026-02-31` passes validation. The UI displays “March 3, 2026,” while
the deterministic seed remains the nonexistent string `2026-02-31`. Malformed,
future, and pre-launch date URLs silently fall back to today without explaining
what happened. The date input itself constrains normal picker use, but shared
or hand-edited URLs expose this path.

### Low — hashed assets are not cached immutably

The live HTML and all hashed JS/CSS/image assets return
`Cache-Control: public, must-revalidate, max-age=30`. The static/PWA performance
contract calls for long-lived immutable caching on hashed assets. Brotli is
enabled and the service worker helps repeat visits, but origin/CDN caching is
not configured to the stated policy.

### Low — no Content-Security-Policy response header

Responses include HSTS, `Referrer-Policy: no-referrer`,
`X-Content-Type-Options: nosniff`, and a restrictive Permissions Policy, but
not a Content Security Policy. The present static app has a small attack
surface, so this is defense-in-depth rather than the cause of the FAIL.

## Passing evidence

### Repository gates

- HEAD and `origin/main`: `9ce460079d304357c6d5c72e7df64948ee584c49`.
- Tracked files were clean before verification; an unrelated untracked
  `graphify-out/` directory was already present and was not staged.
- `npm ci`: pass; 58 packages installed from lockfile.
- `npm audit --audit-level=moderate`: pass; 0 vulnerabilities.
- `npm test`: pass; 5/5 Vitest tests.
- `npm run build`: pass; includes `tsc --noEmit`; `dist/index.html` produced.
- `npm run test:e2e`: pass; 6/6 Playwright tests.
- No lint script exists in `package.json`.
- No worker `verify-url.sh` exists in the repository.

### Deployment identity

The live HTML, JS, CSS, hero image, and service worker are byte-for-byte equal
to the local production build. Representative SHA-256 values:

- `index.html`: `b8c3260582769bfc1a291053d4a77c53398a52371bf642036c24b91fad6eeace`
- JS: `710b99065c5a257761459e4537d7f6cc8257b8ea71a6207afbad460895e480b3`
- CSS: `b77aef591bc67d97c64898b4059850bab0839ff5978973baaa3197073d082598`
- hero WebP: `a97a4e6c7ded8db9989caa14e265222a9319e0b9e8015f044e29267be12b1b72`
- service worker: `31c0d18276cbb5077f3a927c94414782a37ea6fff7ac2909e8a5d234ed90745e`

### Functional and browser coverage

- Normal solution: relay `2,1` then `4,2` solves the 2026-08-28 map.
- Invalid route: reverse placement reports hop 1 at 4 km; undo and retry
  recover correctly.
- Cooperative happy path: a valid first-move URL pins the teammate relay and
  the second player can solve it.
- Result text is spoiler-safe and includes puzzle number and check count.
- Launch-date replay works; malformed/future/pre-launch links do not crash.
- All 240 available daily maps are distinct and have at least one solution.
- Desktop 1440×1000 and mobile 390×844 render without horizontal overflow at
  normal text size; mobile body text is 16 px.
- Keyboard-only traversal reaches the board and completes a solution using
  Tab, arrows, Enter/Space, and Backspace. The skip link is visible on focus,
  with a 3 px mustard outline and carbon outer ring; no trap was found.
- `prefers-reduced-motion: reduce` changes animation/transition durations to
  0.01 ms and disables smooth scrolling.
- Axe scans of initial, solved, privacy, and terms states found zero
  violations (including zero serious/critical findings).
- No console/page errors or failed requests occurred on ordinary initial,
  solved, privacy, and terms flows.

### Privacy, network, PWA, and policies

- Observed browser requests were same-origin only. Source search found no
  analytics, ads, API calls, auth, or third-party runtime scripts.
- No cookies or session storage were created. A solved game creates one
  expected localStorage item containing date-scoped puzzle state.
- `/privacy` and `/terms` load and accurately describe local storage and
  static hosting logs.
- The service worker installs and activates at `/sw.js`; `registration.update()`
  completes; cache `daily-range-v1` exists.
- After an online load, an offline navigation/reload of `/?day=2026-08-27`
  succeeds and shows the offline banner and the correct prior-date heading.
- Chrome parses the web manifest with no manifest errors.
- There are no server-side product endpoints, product-unlock calls, sign-in,
  backend persistence, library API, or CLI. Rate-limit, Entra authority,
  backend concurrency/health, and consumer-package checks are therefore not
  applicable.

### Performance and budgets

- Production output: 13.45 KB JS (5.96 KB gzip), 11.64 KB CSS (3.60 KB gzip),
  100.83 KB hero WebP, no web fonts; all are within the stated byte budgets.
- Three Lighthouse 12.8.2 mobile runs against the live URL scored Performance
  85, 94, and 95 (median 94); Accessibility/Best Practices/SEO were 100 in the
  latter two recorded runs.
- Median recorded lab metrics: FCP 0.9 s, LCP 1.0 s, TBT 290 ms, CLS 0,
  Speed Index 0.9 s, total transfer 110 KiB. INP is not available from a
  navigation-only lab run. One cold run observed a 3.33 s root response and
  scored 85, so live latency has some variance despite the passing median.

## Required remediation before reverification

1. Add `.factory/claims.json` and make every declared claim test pass.
2. Add the explicitly required one-click sample/demo path on the first screen.
3. Prevent sharing any first relay without a valid continuation, or give the
   recipient a clear way to reject/reset an impossible pinned move.
4. Reflow all content at 200% text size and make every mobile target at least
   44×44 CSS px.
5. Handle Web Share/clipboard failure with visible fallback instructions.
6. Strictly validate calendar dates and explain invalid-link recovery.
7. Add immutable cache rules for fingerprinted assets; consider a restrictive
   CSP appropriate to the app.
