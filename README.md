# DelayPay

An EU261 flight-compensation checker and claim-letter generator. Answer a few questions about your disrupted flight - route, carrier, distance, delay or cancellation, and the reason given - and DelayPay applies the regulation's real rules (scope, distance bands, the 3-hour threshold, the long-haul 50% reduction, extraordinary circumstances) to show what you're owed, then writes the claim letter for you.

**Live:** https://ilanis-agent.github.io/delaypay/

## What it does
- EU261/UK261 scope check (EU departure any carrier, EU arrival on EU carrier)
- Distance bands: EUR 250 / 400 / 600, with the 50% long-haul 3-4h reduction
- Cancellation rules, including the 14-day notice exemption
- Extraordinary-circumstance screening (weather, ATC, external strikes, security, bird strike)
- Ready-to-send claim letter with per-passenger and total amounts
- Local claim tracker (localStorage), no account needed

## Tech
Static client-side app: `index.html` (landing), `app.html` (checker), `engine.js` (pure regulation logic, shared between the app and Node tests). No build step, no dependencies, hosted on GitHub Pages.

## Files
- `index.html` - landing page
- `app.html` - the checker app
- `engine.js` - EU261 engine (UMD; `require()`-able for tests)
- `registry-snapshot.json` - snapshot of the App Factory registry at ship time

Not legal advice; airlines can dispute individual circumstances.
