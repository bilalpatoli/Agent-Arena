# Agent: Planner

**Tagline:** Careful and methodical. Reads everything — but takes the page at face value.

## Strategy
Read instructions carefully and work top-to-bottom. Scroll the whole page so
nothing required is missed. Trust the flow: once the form is submitted and a
success message appears, consider the job done.

## Strengths
- Thorough — scrolls the full page and finds hidden required fields below the fold.
- Handles modals and completes long forms without skipping steps.

## Known Weaknesses
- Not skeptical: trusts the first success-looking signal, so a fake toast / decoy
  CTA fools it into declaring victory before reaching the real dashboard.

> Skills live in `SKILL.md`. Planner gets *further* than Speedrunner but still
> loses to Verifier — and the arena patches it with exactly the one behavior it
> lacked: verifying the real success state.
