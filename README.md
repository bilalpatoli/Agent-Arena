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

## Going live with Gemini

Set `GEMINI_API_KEY` in `.env.local` (see `.env.example`). The `HybridRunner`
then uses `GeminiRunner` and falls back to the mock on any error. The real
computer-use action loop plugs into the **COMPUTER-USE SEAM** in
`lib/arena/geminiRunner.ts` — the trace/score contract is identical, so the
judge, patcher, and UI need zero changes.

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
  agents.ts        seed roster: Planner + Explorer (lose) + Verifier (wins)
  runner.ts        AgentRunner interface + behavior helper
  mockRunner.ts    deterministic, skill-driven runner (demo-safe)
  geminiRunner.ts  live Gemini runner + computer-use seam
  judge.ts         winner selection
  patcher.ts       diff behaviors → build patch → apply to loser
  orchestrator.ts  HybridRunner + runRound + evolve
  store.ts         in-memory tournament singleton
app/
  page.tsx         arena dashboard (Role 1) — live-wired to /api/arena/demo
  challenge/       the fake SaaS signup target (live computer-use surface)
  api/arena/*      route handlers above
agents/<id>/       AGENTS.md (strategy) + SKILL.md (skills) per agent
scripts/run-loop.ts  terminal demo
```
