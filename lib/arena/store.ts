import type { RoundResult, SkillPatch, TournamentState } from "./types";
import type { Challenge } from "./challenge";
import { evolve, makeRunner, makeTournament, runRound, selectChallenge } from "./orchestrator";
import { type AgentRunner } from "./runner";
import { newRunId, upsertRun, type RunStatus } from "./historyStore";

// ─────────────────────────────────────────────────────────────────────────────
// Process-wide singleton tournament state (the *active* run) + a durable history
// layer (lib/arena/historyStore). Every run is persisted to disk under
// data/history so it survives a refresh and many runs accumulate.
//
// The active challenge + runner are chosen from env (ARENA_CHALLENGE):
//   signup    → synthetic trap page, mock/live hybrid (default, demo-safe)
//   saucedemo → real site, replays captured Gemini computer-use trajectories
// ─────────────────────────────────────────────────────────────────────────────

const g = globalThis as unknown as { __arena?: TournamentState; __runId?: string | null };

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
  g.__runId = null; // a fresh persisted run is created when the first round runs
  return g.__arena;
}

// Persist the active singleton as the current run. A run id is minted lazily on
// the first round so an empty reset never creates a history entry.
async function persistActive(statusOverride?: RunStatus): Promise<void> {
  const s = state();
  if (!g.__runId) g.__runId = newRunId(s.taskId);
  const status: RunStatus = statusOverride ?? (s.rounds.length >= 2 ? "completed" : "running");
  await upsertRun({ id: g.__runId, status, state: s });
}

export async function nextRound(): Promise<RoundResult> {
  const round = await runRound(state(), runner(), challenge());
  await persistActive();
  return round;
}

export async function evolveArena(): Promise<SkillPatch[]> {
  const patches = evolve(state(), challenge());
  await persistActive();
  return patches;
}

/** One-shot: run a round, evolve, run again — the full before/after story. */
export async function runFullDemo() {
  resetArena();
  const round1 = await nextRound();
  const patches = await evolveArena();
  const round2 = await nextRound();
  return { state: getState(), round1, patches, round2, challenge: challenge() };
}
