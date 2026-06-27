import type { RoundResult, SkillPatch, TournamentState } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Typed client for the existing Agent Arena API. No mock data, no fallbacks —
// every call hits the real backend and throws on failure so the UI can render an
// honest error state.
// ─────────────────────────────────────────────────────────────────────────────

export type ArenaSnapshot = { state: TournamentState; live: boolean };

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function req<T>(input: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(input, { cache: "no-store", ...init });
  } catch (e) {
    throw new ApiError(0, `Network error reaching ${input}: ${(e as Error).message}`);
  }
  if (!res.ok) {
    let detail = "";
    try {
      detail = (await res.text()).slice(0, 200);
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, `${input} responded ${res.status}${detail ? ` — ${detail}` : ""}`);
  }
  return (await res.json()) as T;
}

export const fetchSnapshot = (): Promise<ArenaSnapshot> => req<ArenaSnapshot>("/api/arena");

// ── Enter-your-own-agent (proposed API — see docs/AGENT-SUBMISSION.md) ─────────
export type NewAgent = { name: string; strategy: string; behaviors: string[] };

/** Sentinel thrown when the agent-submission endpoint isn't wired yet. */
export const NOT_IMPLEMENTED = "AGENT_SUBMISSION_NOT_IMPLEMENTED";

export async function submitAgent(agent: NewAgent): Promise<{ state: TournamentState }> {
  let res: Response;
  try {
    res = await fetch("/api/arena/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(agent),
    });
  } catch (e) {
    throw new ApiError(0, `Network error: ${(e as Error).message}`);
  }
  // The backend endpoint is proposed but may not exist yet — surface that clearly.
  if (res.status === 404 || res.status === 405) throw new ApiError(res.status, NOT_IMPLEMENTED);
  if (!res.ok) throw new ApiError(res.status, `Could not add agent (${res.status})`);
  return res.json();
}
export const resetArena = (): Promise<{ state: TournamentState }> =>
  req("/api/arena/reset", { method: "POST" });
export const runRound = (): Promise<{ round: RoundResult; state: TournamentState }> =>
  req("/api/arena/round", { method: "POST" });
export const evolveArena = (): Promise<{ patches: SkillPatch[]; state: TournamentState }> =>
  req("/api/arena/evolve", { method: "POST" });

// Run-status lifecycle, surfaced to the UI as a real progress state.
export type RunPhase =
  | "idle"
  | "queued"
  | "running-round-1"
  | "evaluating"
  | "patching"
  | "running-round-2"
  | "completed"
  | "failed";

export const PHASE_LABEL: Record<RunPhase, string> = {
  idle: "Idle",
  queued: "Queued",
  "running-round-1": "Running round 1",
  evaluating: "Evaluating",
  patching: "Applying skill patch",
  "running-round-2": "Running round 2",
  completed: "Completed",
  failed: "Failed",
};

export type RoundCallback = (which: number, round: RoundResult) => void;

/**
 * Drive a full tournament through the real endpoints, surfacing each phase and
 * each round's results as they complete (for the live activity feed).
 * reset → round 1 → evaluate → patch → round 2. Returns the final snapshot.
 */
export async function runTournament(onPhase: (p: RunPhase) => void, onRound?: RoundCallback): Promise<ArenaSnapshot> {
  onPhase("queued");
  await resetArena();
  onPhase("running-round-1");
  const r1 = await runRound();
  onRound?.(1, r1.round);
  onPhase("evaluating");
  onPhase("patching");
  await evolveArena();
  onPhase("running-round-2");
  const r2 = await runRound();
  onRound?.(2, r2.round);
  onPhase("completed");
  return fetchSnapshot();
}
