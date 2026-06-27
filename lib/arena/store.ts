import type { RoundResult, SkillPatch, TournamentState } from "./types";
import type { Challenge } from "./challenge";
import { evolve, makeRunner, makeTournament, runRound, selectChallenge } from "./orchestrator";
import { type AgentRunner } from "./runner";

// ─────────────────────────────────────────────────────────────────────────────
// Process-wide singleton tournament state. In-memory is fine for the demo; swap
// for DigitalOcean Spaces / a DB later without touching the API surface.
// (Survives HMR via globalThis so dev reloads don't wipe the arena.)
//
// The active challenge + runner are chosen from env (ARENA_CHALLENGE):
//   signup    → synthetic trap page, mock/live hybrid (default, demo-safe)
//   saucedemo → real site, replays captured Gemini computer-use trajectories
// ─────────────────────────────────────────────────────────────────────────────

const g = globalThis as unknown as { __arena?: TournamentState };

function challenge(): Challenge {
  return selectChallenge();
}

function state(): TournamentState {
  if (!g.__arena) g.__arena = makeTournament(challenge());
  return g.__arena;
}

function runner(): AgentRunner {
  return makeRunner(challenge());
}

export function getState(): TournamentState {
  return state();
}

/** Replace the active tournament (used by the live "paste a URL" custom run). */
export function setActiveTournament(t: TournamentState): void {
  g.__arena = t;
}

export function resetArena(): TournamentState {
  g.__arena = makeTournament(challenge());
  return g.__arena;
}

export async function nextRound(): Promise<RoundResult> {
  return runRound(state(), runner(), challenge());
}

export function evolveArena(): SkillPatch[] {
  return evolve(state(), challenge());
}

/** One-shot: run a round, evolve, run again — the full before/after story. */
export async function runFullDemo() {
  resetArena();
  const round1 = await nextRound();
  const patches = evolveArena();
  const round2 = await nextRound();
  return { state: getState(), round1, patches, round2, challenge: challenge() };
}
