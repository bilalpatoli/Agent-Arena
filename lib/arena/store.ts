import type { RoundResult, SkillPatch, TournamentState } from "./types";
import { SIGNUP_CHALLENGE } from "./challenge";
import { HybridRunner, evolve, makeTournament, runRound } from "./orchestrator";

// ─────────────────────────────────────────────────────────────────────────────
// Process-wide singleton tournament state. In-memory is fine for the demo; swap
// for DigitalOcean Spaces / a DB later without touching the API surface.
// (Survives HMR via globalThis so dev reloads don't wipe the arena.)
// ─────────────────────────────────────────────────────────────────────────────

const g = globalThis as unknown as { __arena?: TournamentState };

function state(): TournamentState {
  if (!g.__arena) g.__arena = makeTournament();
  return g.__arena;
}

const runner = new HybridRunner();

export function getState(): TournamentState {
  return state();
}

export function resetArena(): TournamentState {
  g.__arena = makeTournament();
  return g.__arena;
}

export async function nextRound(): Promise<RoundResult> {
  return runRound(state(), runner, SIGNUP_CHALLENGE);
}

export function evolveArena(): SkillPatch[] {
  return evolve(state(), SIGNUP_CHALLENGE);
}

/** One-shot: run a round, evolve, run again — the full before/after story. */
export async function runFullDemo() {
  resetArena();
  const round1 = await nextRound();
  const patches = evolveArena();
  const round2 = await nextRound();
  return { state: getState(), round1, patches, round2 };
}
