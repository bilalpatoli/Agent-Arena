# 🏟 Agent Arena

**Agents compete. Winners teach. Losers evolve.**
An evolutionary tournament where AI agents attempt the same task, learn from the
winner, and get smarter every round.

## The loop (Role 2 — evolution engine)

1. **Run** every agent on the `/challenge` task → captures a scored trace.
2. **Judge** the runs → picks a winner.
3. **Diff** the winner's behavior vs each loser's failed traps.
4. **Patch** — synthesize a skill from the winning behavior and graft it onto the loser's `SKILL.md`.
5. **Rerun** — the patched loser now clears the traps it used to fail. **Wow moment.**

The key trick: **agent behavior is a pure function of its skills.** The mock
runner reads each agent's current skills and produces success/failure from them,
so a patch *genuinely* changes the rerun outcome — the demo is real even with no
API key, and swaps to live Gemini computer-use the moment a key is present.

## Quick start

```bash
npm install
npm run loop     # full story in the terminal (round 1 → patch → round 2)
npm run dev      # arena UI at /, challenge page at /challenge
```

## Demo flow (hybrid — the recommended stage setup)

`ARENA_LIVE=0` (default): the clickable tournament runs the deterministic mock —
fast, reliable, tells the full Round 1 → Patch → Round 2 story every time.

1. Open `/`, click **Run Tournament**. Speedrunner fails (15), Verifier wins
   (100), the skill patch is shown, the rematch has Speedrunner at 100 (**+85**,
   "AGENT EVOLVED").
2. For the "this is real" beat, show the **live computer-use proof**:
   Gemini 3.5 Flash actually driving Chromium over `/challenge`. See
   [`docs/LIVE-PROOF.md`](docs/LIVE-PROOF.md) and run
   `npx tsx scripts/live-test.ts verifier` (captures frames + video when the key
   has quota).

## Real-site demo (saucedemo.com) — capture & replay

The headline framing is **self-improving computer-use agents** on a *real website*.
The agents complete a checkout on saucedemo.com via live Gemini computer-use.

**The real trajectories are already captured and committed** (`data/trajectories/`),
so the default demo (`ARENA_CHALLENGE=saucedemo`) replays genuine Gemini-on-saucedemo
runs out of the box — real screenshots, deterministic, zero live API calls:

```
Round 1   Speedrunner 36 ✗ (gave up early)   Planner 55 ✗ (stopped at overview)   Verifier 96 ✓
Patches   Verifier → Speedrunner (follow through), Verifier → Planner (verify the order)
Round 2   Speedrunner 98 ✓   Planner 100 ✓   Verifier 96 ✓     (real failure → real success)
```

To re-capture (e.g. a new site or fresh runs) we **capture once, replay forever**:

1. **Capture** (needs quota — billing-enabled key, or wait for free-tier reset):
   ```bash
   npm run dev                          # serves nothing site-side, but capture needs a base url
   npx tsx scripts/capture.ts saucedemo # resume-friendly: re-run until all 6 runs captured
   ```
   Writes `data/trajectories/saucedemo-checkout-v1/<agent>-r{1,2}.json` (real
   screenshots inline) + frames/video under `public/live-trace/`.

2. **Replay** (deterministic, offline — what runs on stage):
   ```bash
   ARENA_CHALLENGE=saucedemo npm run dev   # the demo now serves the captured real runs
   ```
   `makeRunner()` auto-selects `ReplayRunner` for a real challenge once trajectories
   exist. Zero live API calls, nothing can 429 or hang.

The loop (judge → patch → rerun → improvement) and the whole UI are identical
between synthetic and real — only the *source* of the `Run` objects changes.

> Until real trajectories are captured, generate placeholders to exercise the
> pipeline/UI: `npx tsx scripts/make-fixtures.ts` (marked `placeholder`,
> gitignored — never shipped as if real).

## Going live with Gemini (full live tournament)

The live path is **built and proven** (`lib/arena/computerUse.ts`): the real
`@google/genai` Interactions API + Playwright. To run the whole tournament live:

1. `GEMINI_API_KEY` in `.env.local` (already wired).
2. `ARENA_LIVE=1` (and `ARENA_BASE_URL` pointing at the running dev server).
3. The key needs **billing enabled** — free-tier quota is exhausted after a few
   computer-use turns (screenshots are image-token heavy → HTTP 429).

The `HybridRunner` always falls back to the mock on any error (including 429),
so the demo can never hard-break. The trace/score contract is identical between
mock and live, so the judge, patcher, and UI need zero changes either way.

## API surface (for the frontend)

| Method | Route               | Does                                            |
| ------ | ------------------- | ----------------------------------------------- |
| GET    | `/api/arena`        | current tournament state + `live` flag          |
| POST   | `/api/arena/round`  | run one round (all agents) and judge            |
| POST   | `/api/arena/evolve` | apply skill patches winner → losers             |
| POST   | `/api/arena/reset`  | reset the arena to the seed roster              |
| POST   | `/api/arena/demo`   | one-shot: round 1 → evolve → round 2 (full story)|

`/api/arena/demo` returns `{ state, round1, patches, round2 }` — enough to render
the entire before/after on one screen.

## Layout

```
lib/arena/
  types.ts         domain types (Agent, Run, Skill, SkillPatch, ...)
  challenge.ts     the trap-laden signup challenge (state machine)
  agents.ts        seed roster: Speedrunner (loses) + Verifier (wins)
  runner.ts        AgentRunner interface + behavior helper
  mockRunner.ts    deterministic, skill-driven runner (demo-safe)
  geminiRunner.ts  live runner: drives computerUse.ts, ground-truth scoring
  computerUse.ts   Gemini 3.5 Flash computer-use ↔ Playwright browser loop
  judge.ts         winner selection
  patcher.ts       diff behaviors → build patch → apply to loser
  orchestrator.ts  HybridRunner (live→mock fallback) + runRound + evolve
  store.ts         in-memory tournament singleton
scripts/
  run-loop.ts      terminal tournament demo (mock)
  live-test.ts     one live computer-use run + proof capture
  api-probe.ts     isolated Gemini Interactions API smoke test
app/
  page.tsx         arena UI (minimal; Role 1 owns the polished version)
  challenge/       the fake SaaS signup target (live computer-use surface)
  api/arena/*      route handlers above
agents/<id>/       AGENTS.md (strategy) + SKILL.md (skills) per agent
scripts/run-loop.ts  terminal demo
```
