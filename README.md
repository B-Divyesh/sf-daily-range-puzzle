# Daily Range Puzzle

Daily Range is a browser puzzle for friends who want a short map to solve and
share each day. Place two relays, keep every hop within 3 km, and use a
lookout before reaching the beacon.

Try the sample at [the demo route](/demo). It opens with a first relay already
placed. The demo uses separate browser storage and does not change real game
data.

## What it provides

- A deterministic map for each UTC date.
- One hex step equals 1 km.
- Two relays, one lookout, and hops of 3 km or less complete a route.
- First-move links only appear when the receiving player can finish them.
- Shared results omit relay coordinates.
- Keyboard play, local browser storage, and offline reload after a first visit.
- No account, tracking, sign-in, or payment is needed to play.

The testable public statements are listed in
[`.factory/claims.json`](.factory/claims.json).

## Run locally

Requires Node.js 20 or newer.

```sh
npm ci
npm run dev
```

Vite prints the local URL. The game has no environment variables, API keys,
databases, or runtime network services.

## Test and build

```sh
npm test
npm run test:e2e
npm run build
```

Run an individual documented claim command from `.factory/claims.json` with
the same clean setup. The Playwright suite uses Chromium from Playwright 1.58.2.
If Chromium is absent, run `npx playwright install chromium` once.

## Deploy

Deploy `dist/` to Azure Static Web Apps. The committed configuration supplies
SPA routing, the designed 404 page, security headers, and immutable caching for
fingerprinted assets. The service worker caches the same-origin shell and
loaded app files after the first visit.

## Privacy, demo, and license

Read [the demo notes](.factory/demo.md) for its URL, sample, reset behavior,
and storage namespace. The [privacy page](/privacy) and [terms page](/terms)
are included in the app. The source code is available under the
[MIT License](LICENSE).
