import type { Run, TournamentState, TraceStep } from "./types";
import type { Challenge } from "./challenge";
import { seedAgents } from "./agents";
import { runComputerUse } from "./computerUse";
import { resultToRun } from "./geminiRunner";
import { pickWinner } from "./judge";
import { evolve, makeTournament } from "./orchestrator";
import { setActiveTournament } from "./store";

// ─────────────────────────────────────────────────────────────────────────────
// Live "paste a URL" mode: run the 3 agents against a user-supplied website with
// real Gemini computer-use, stream progress, judge the winner with an LLM judge,
// and generate the skill patches the winner would teach. One round (fast +
// coherent on arbitrary sites); the curated saucedemo demo keeps the full
// evolve+rerun arc. Requires a live key — there is no replay for a fresh URL.
// ─────────────────────────────────────────────────────────────────────────────

export type CustomEvent =
  | { type: "status"; message: string }
  | { type: "agent-start"; agentId: string; agentName: string }
  | { type: "step"; agentId: string; step: TraceStep }
  | { type: "agent-done"; agentId: string; run: Run }
  | { type: "winner"; agentId: string }
  | { type: "patch"; sourceWinner: string; targets: string[]; behavior: string }
  | { type: "complete" }
  | { type: "error"; message: string };

export async function runCustomTournament(
  challenge: Challenge,
  emit: (e: CustomEvent) => void,
): Promise<void> {
  if (!process.env.GEMINI_API_KEY) {
    emit({ type: "error", message: "GEMINI_API_KEY is not set — live runs need a Gemini key." });
    return;
  }

  const state = makeTournament(challenge);
  state.agents = seedAgents();
  setActiveTournament(state); // so GET /api/arena reflects the live run as it builds

  const runs: Run[] = [];
  emit({ type: "status", message: `Starting live arena on ${challenge.url}` });

  for (const agent of state.agents) {
    emit({ type: "agent-start", agentId: agent.id, agentName: agent.name });
    try {
      const t0 = Date.now();
      const result = await runComputerUse(agent, challenge, {
        baseUrl: challenge.url,
        maxSteps: 20,
        onEvent: (e) => {
          if (e.kind === "step") emit({ type: "step", agentId: agent.id, step: e.step });
          else emit({ type: "status", message: `${agent.name}: ${e.message}` });
        },
      });
      const run = resultToRun(agent, challenge, 1, result, Date.now() - t0);
      runs.push(run);
      agent.scoreHistory.push(run.score);
      // push into the round so the live snapshot updates incrementally
      upsertRound(state, runs);
      emit({ type: "agent-done", agentId: agent.id, run });
    } catch (err) {
      emit({ type: "error", message: `${agent.name} failed: ${(err as Error).message}` });
    }
  }

  if (runs.length === 0) {
    emit({ type: "error", message: "No agent runs completed." });
    return;
  }

  const winner = pickWinner(runs);
  finalizeRound(state, runs, winner.agentId);
  emit({ type: "winner", agentId: winner.agentId });

  // Generate the patches the winner would teach the losers (instant, no extra runs).
  const patches = evolve(state, challenge);
  for (const p of patches) {
    emit({ type: "patch", sourceWinner: p.sourceWinner, targets: p.targetAgents, behavior: p.winningBehavior });
  }

  setActiveTournament(state);
  emit({ type: "complete" });
}

function upsertRound(state: TournamentState, runs: Run[]) {
  const existing = state.rounds.find((r) => r.round === 1);
  if (existing) existing.runs = [...runs];
  else
    state.rounds.push({
      round: 1,
      taskId: state.taskId,
      runs: [...runs],
      winnerId: runs[0].agentId,
    });
}

function finalizeRound(state: TournamentState, runs: Run[], winnerId: string) {
  const r = state.rounds.find((x) => x.round === 1);
  if (r) {
    r.runs = [...runs];
    r.winnerId = winnerId;
  }
}
