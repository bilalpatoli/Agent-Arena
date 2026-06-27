# Live Gemini Computer-Use — Proof

The arena's live path is real: **Gemini 3.5 Flash computer-use drives a headless
Chromium browser over `/challenge`**, returning UI actions that Playwright
executes. Verified working on 2026-06-27.

## What ran

`lib/arena/computerUse.ts` runs the documented Interactions API loop:

```
screenshot → ai.interactions.create({ model: "gemini-3.5-flash",
              tools: [{ type: "computer_use", environment: "browser" }] })
           → function_call(s) {name, arguments:{x,y,intent}}   (coords 0–999)
           → Playwright executes (click/type/scroll, coords denormalized)
           → screenshot → function_result → repeat
```

## Captured run log (Verifier, live)

```
▶ Live computer-use run: Verifier
[cu] turn 0: calling Gemini (prevId=n)
[cu] turn 0: 1 action(s)
[cu] turn 1: calling Gemini (prevId=y)
[cu] turn 1: 1 action(s)
[cu] turn 2: calling Gemini (prevId=y)
[cu] turn 2: 1 action(s)
[cu] turn 3: calling Gemini (prevId=y)
... 429 (free-tier quota exhausted)
```

Each `turn` is a real round-trip: Gemini looked at a screenshot of our signup
page and returned a browser action that Playwright then performed.

## The one constraint

Computer-use sends a full screenshot every turn (image tokens are heavy), so the
**free-tier quota** is exhausted after a few turns (HTTP 429). For a full live
tournament on stage, enable billing on the Gemini key. Otherwise we run the
demo-safe mock (`ARENA_LIVE=0`) and use this as proof the live path is real.

## Capturing visual proof (frames + video)

When the key has quota (fresh day or billing enabled):

```bash
# dev server must be running (serves /challenge)
npx tsx scripts/live-test.ts verifier
```

Writes to `public/live-trace/verifier/`:
- `frame-NN-<action>.jpg` — a real screenshot after each Gemini action
- `page-*.webm` — full video of the browser session
- `trace.json` — the action/intent list

Those artifacts survive a later 429, so capture once and show them anytime.
