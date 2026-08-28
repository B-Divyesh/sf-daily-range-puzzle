# Daily Range Puzzle — independent verification handoff

## Verdict: FAIL

Candidate `9ce460079d304357c6d5c72e7df64948ee584c49` was independently tested on
2026-08-28 against <https://daily-range-puzzle.sociobot.in>. The live files are
byte-for-byte identical to the candidate build, so this is not a stale or
deployment-only failure.

Release blockers:

1. `.factory/claims.json` is missing; the mandatory claim suite therefore
   cannot run.
2. The cold first screen has no one-click sample-data/demo action.
3. The core cooperative handoff accepts dead-end first moves. For the current
   map, sharing relay `4,2` pins an over-range move that the recipient cannot
   undo or complete. Across all 240 available days, 4,205/5,408 legal first
   placements (77.8%) cannot lead to a solution in that order.
4. At 390 px and 200% text size, the hero heading, copy, and primary action are
   clipped rather than reflowed.

Additional defects: clipboard denial produces an unhandled error with no user
recovery; several mobile links are under 44 px high; impossible dates such as
`2026-02-31` are accepted and inconsistently displayed; hashed assets receive
only a 30-second cache lifetime; no CSP is sent.

Full evidence, severity, command results, deployment hashes, browser coverage,
Lighthouse results, privacy checks, and required remediation are in
[`verification-1.md`](verification-1.md).

## Passing checks

```sh
npm ci
npm audit --audit-level=moderate
npm test
npm run build
npm run test:e2e
```

Results: 0 audit vulnerabilities, 5/5 unit tests, exact production build, and
6/6 repository E2E tests. The repository has no lint script and no
`verify-url.sh`. Live axe scans found no violations in initial, solved, privacy,
or terms states. Keyboard play, reduced motion, valid co-op, local-only
storage, service-worker update, and offline prior-day reload pass. Live mobile
Lighthouse scores were 85/94/95 (median 94); the latter two accessibility,
best-practices, and SEO scores were 100. Bundles are within budget.

## Scope and tree state

No product code was changed. This verification adds only the verification
report and replaces the prior builder handoff with this unambiguous result.
The pre-existing untracked `graphify-out/` directory was not staged.
