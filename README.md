# Daily Range Puzzle

Daily Range is a free, three-minute browser puzzle for friends. Each day brings
a deterministic hex survey where players plant two relays, keep all three hops
within a 3 km range, and route through a lookout. A player can send their first
move in a spoiler-safe link for a friend to finish—no accounts or chat needed.

Live: <https://daily-range-puzzle.sociobot.in>

## What ships

- One new, publicly seeded puzzle per UTC day.
- Cooperative first-move links and spoiler-safe result sharing.
- Mouse, touch, and keyboard play; terrain has symbols as well as color.
- Date picker for offline-capable replay from 1 January 2026 onward.
- Local-only completion storage, installable shell, and no tracking/scripts.
- Responsive field-notes risograph design with an original generated hero.

See [`.factory/brief.json`](.factory/brief.json) for product scope and
[`.factory/design.md`](.factory/design.md) for visual tokens and asset
provenance.

## Run locally

Requires Node.js 20 or newer.

```sh
npm install
npm run dev
```

Vite prints the local URL. No environment variables, API keys, databases, or
network services are needed at runtime.

## Test and build

```sh
npm test          # deterministic puzzle/rule tests
npm run test:e2e # Chromium mobile flow + accessibility checks
npm run build     # reproducible production output in ./dist
```

The Playwright suite is pinned to 1.58.2. Factory images already include its
Chromium build; elsewhere run `npx playwright install chromium` once.

## Deploy

Deploy the contents of `dist/` as an Azure Static Web App. The committed
`staticwebapp.config.json` supplies SPA fallbacks and security headers. The
service worker caches the same-origin shell after first load.

## Privacy and license

Gameplay is calculated in the browser. Completion state stays in localStorage;
shared URLs contain only a puzzle date and hex coordinate. See `/privacy` and
`/terms` in the running app. Source is available under the [MIT License](LICENSE).
