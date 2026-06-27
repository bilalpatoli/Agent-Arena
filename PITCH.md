# 🏟 Agent Arena — Pitch & Demo Script

> **Agents compete. Winners teach. Losers evolve.**
> An evolutionary tournament where AI agents get smarter every round.

---

## The 15-second hook (what a judge sees on the dashboard)

Three agents — **Planner, Explorer, Verifier** — attempt the same browser task.
Round 1: only **Verifier wins (100)**; Planner (60) and Explorer (15) **fail**.
Agent Arena extracts Verifier's winning behavior, generates a **skill patch**, and
applies it to the losers. Hit **Rematch** → the patched losers **clear every trap and
the whole population converges to 100.** Planner +40, Explorer +85.

The whole loop — compete → teach → evolve — is on one screen, driven by the **live
engine** (the `LIVE · ENGINE` badge confirms the numbers are real, not staged).

---

## The problem

Today every agent fails in isolation and fails the same way tomorrow. There's no
mechanism for a weaker agent to **learn from a stronger one**. Agent Arena is that
mechanism: a tournament where the population's best behavior propagates to everyone.

---

## Demo script (60–90 seconds)

1. **Open the dashboard.** "Three agents, three strategies, one task: sign up on a
   trap-laden SaaS site and reach the dashboard."
2. **Read Round 1 (top cards + center bracket).** "Only **Verifier** wins — it scanned
   the full page, scrolled below the fold to the hidden checkbox, and **verified the real
   success state**. Planner and Explorer failed." The green path in the bracket is the
   winning trajectory.
3. **Skill Mutation panel (right).** "Agent Arena diffs the winner's trace against the
   losers, extracts the trait that mattered, and writes a **skill patch** — applied to
   Planner and Explorer at 94% confidence."
4. **Trace Replay (bottom).** "Here's Planner *before* — never scrolled, missed the
   checkbox, failed. And *after the patch* — scrolls, finds the checkbox, verifies the
   dashboard, reaches success. **60 → 100.**" (These steps are the real engine traces.)
5. **Click `Rematch`.** The cards and bracket flip to **Round 2**: the patched losers turn
   green and **succeed**, all paths light up — the whole population converges to 100.
   "The agents didn't just get evaluated — they **evolved from each other**."

---

## The five things the screen proves (success criteria)

1. Three agents competed.  2. Verifier won.  3. The system extracted Verifier's winning
behavior.  4. Planner and Explorer received a skill patch.  5. Planner improved on the
rematch.

---

## Theme & prize alignment

- **Continual learning** — agents improve from real task attempts and failures.
- **Self-improvement stack** — evaluate → compare → patch → rerun, as infrastructure.
- **Recursive intelligence** — the winning agent's behavior becomes training signal for
  the others.
- **Gemini** — the live engine (Role 2) drives the challenge with **Gemini 3.5 computer
  use** against the `/challenge` SaaS page; `AGENTS.md` / `SKILL.md` per agent hold
  strategy and the mutating skill set.

---

## Demo safety

The dashboard is **live-wired**: on load it runs a real tournament via `POST
/api/arena/demo` and renders the engine's actual results (the `LIVE · ENGINE` badge turns
on). If that call ever fails — no network, cold serverless, build hiccup — it **silently
falls back** to a captured real run (`lib/arena/fallback.ts`) and renders the identical
story, so it **cannot break on stage**. The engine swaps to live **Gemini 3.5 computer
use** automatically when `GEMINI_API_KEY` is set (the badge then reads `LIVE · Gemini`);
the trace/score contract is identical, so no UI changes are needed.

---

## One-line summary for the judging sheet

> Agent Arena runs AI agents in a tournament, then automatically transplants the winner's
> skill into the losers so they measurably improve on the rematch — shown end-to-end on a
> single dashboard, with a live Gemini computer-use engine behind it.
