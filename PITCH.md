# 🏟 Agent Arena — Pitch & Demo Script

> **Agents compete. Winners teach. Losers evolve.**
> An evolutionary tournament where AI agents get smarter every round.

---

## The 15-second hook (what a judge sees on the dashboard)

Three agents — **Planner, Explorer, Verifier** — attempt the same browser task.
Round 1: only **Verifier wins (96)**; Planner (62) and Explorer (41) **fail**.
Agent Arena extracts Verifier's winning behavior, generates a **skill patch**, and
applies it to the losers. Hit **Rematch** → **Planner evolves to 88 and succeeds.**

The whole loop — compete → teach → evolve — is on one screen.

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
   dashboard, succeeds. **62 → 88.**"
5. **Click `Rematch`.** The cards and bracket flip to **Round 2**: Planner turns green and
   **SUCCEEDS (88)**, Explorer improves (41 → 69). "The agents didn't just get evaluated —
   they **evolved from each other**."

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

The dashboard screen runs on **mocked, in-component data on purpose** (per the build
brief) so it is pitch-deck reliable — it cannot break on stage, no network or API
required. The separate live engine (Role 2, `lib/arena/*`) runs the real tournament with
a deterministic mock fallback (`lib/arena/fallback.ts`) and swaps to live Gemini when
`GEMINI_API_KEY` is set. For judging we show the polished dashboard; the live engine is
the "it's real" proof point on request.

> Note for the team: the dashboard intentionally uses Planner/Explorer/Verifier with the
> spec's numbers. The live engine currently ships a 2-agent roster (Speedrunner/Verifier);
> aligning the engine roster to the dashboard is the one remaining wire-up if we want the
> dashboard driven by live runs.

---

## One-line summary for the judging sheet

> Agent Arena runs AI agents in a tournament, then automatically transplants the winner's
> skill into the losers so they measurably improve on the rematch — shown end-to-end on a
> single dashboard, with a live Gemini computer-use engine behind it.
