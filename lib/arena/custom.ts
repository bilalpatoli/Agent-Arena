import type { Agent, Run, TournamentState, TraceStep } from "./types";
import type { Challenge } from "./challenge";
import { seedAgents } from "./agents";
import { runComputerUse } from "./computerUse";
import { resultToRun } from "./geminiRunner";
import { pickWinner } from "./judge";
import { evolve, makeTournament } from "./orchestrator";
import { setActiveTournament } from "./store";
import { classifyError, type LiveArenaEvent, type RunSummary } from "./liveEvents";
import { newRunId, upsertRun, type RunStatus } from "./historyStore";

// ─────────────────────────────────────────────────────────────────────────────
// Live "paste a URL" mode: run the 3 agents against a user-supplied website with
// real Gemini computer-use, stream structured progress, judge the winner, and
// generate the skill patches the winner would teach.
//
// Failure contract: every agent that STARTS always emits a terminal `agent-done`.
// A thrown error becomes a real failed run (agent-error + agent-done, partial
// trace preserved) and the tournament continues. Generic `error` is reserved for
// run-level fatal failures (missing key, no agents) before/around the loop.
// ─────────────────────────────────────────────────────────────────────────────

export type { LiveArenaEvent } from "./liveEvents";
// Back-compat alias for existing imports.
export type CustomEvent = LiveArenaEvent;

type Runner = typeof runComputerUse;

export async function runCustomTournament(
  challenge: Challenge,
  emit: (e: LiveArenaEvent) => void,
  runner: Runner = runComputerUse,
): Promise<void> {
  const state = makeTournament(challenge);
  state.agents = seedAgents();
  setActiveTournament(state); // so GET /api/arena reflects the live run as it builds

  // Persist this run to history under a real id from the very start, so even a
  // fatal failure is saved and viewable.
  const runId = newRunId(state.taskId);
  const persist = (status: RunStatus, failureReason?: string) =>
    upsertRun({ id: runId, status, state, failureReason }).catch(() => {});

  if (!process.env.GEMINI_API_KEY) {
    await persist("failed", "GEMINI_API_KEY is not set — live runs need a Gemini key.");
    emit({ type: "error", message: "GEMINI_API_KEY is not set — live runs need a Gemini key.", fatal: true, errorCode: "NO_API_KEY" });
    return;
  }

  if (state.agents.length === 0) {
    await persist("failed", "No agents are configured for the arena.");
    emit({ type: "error", message: "No agents are configured for the arena.", fatal: true, errorCode: "NO_AGENTS" });
    return;
  }

  emit({ type: "run-started", runId, task: challenge.goal, url: challenge.url });
  await persist("running");

  const runs: Run[] = [];

  for (const agent of state.agents) {
    emit({ type: "agent-started", agentId: agent.id, agentName: agent.name });
    const collected: TraceStep[] = []; // retained so a thrown error keeps its partial trace
    const t0 = Date.now();
    try {
      const result = await runner(agent, challenge, {
        baseUrl: challenge.url,
        // Graded capability: dumber agents get fewer actions and blurrier vision.
        maxSteps: agent.capability?.maxSteps ?? 20,
        visionQuality: agent.capability?.vision ?? 55,
        onEvent: (e) => {
          if (e.kind === "step") {
            collected.push(e.step);
            emit({ type: "agent-step", agentId: agent.id, agentName: agent.name, step: e.step });
          } else {
            emit({ type: "status", message: `${agent.name}: ${e.message}` });
          }
        },
      });
      const run = resultToRun(agent, challenge, 1, result, Date.now() - t0);
      runs.push(run);
      agent.scoreHistory.push(run.score);
      upsertRound(state, runs);
      emit({ type: "agent-done", agentId: agent.id, agentName: agent.name, run });
    } catch (err) {
      // A thrown agent error becomes a real failed run (never a generic stream
      // error). The tournament keeps going with the next agent.
      const message = (err as Error).message || "Agent run failed";
      const run = buildFailedRun(agent, challenge, collected, message, Date.now() - t0);
      runs.push(run);
      agent.scoreHistory.push(0);
      upsertRound(state, runs);
      emit({ type: "agent-error", agentId: agent.id, agentName: agent.name, message, errorCode: classifyError(message), fatal: false });
      emit({ type: "agent-done", agentId: agent.id, agentName: agent.name, run });
    }
  }

  // Winner = best successful run; null if every agent failed (a valid result, not
  // a fatal error).
  const successful = runs.filter((r) => r.result === "success");
  const winnerRun = successful.length ? pickWinner(successful) : null;
  const winnerAgent = winnerRun ? state.agents.find((a) => a.id === winnerRun.agentId) ?? null : null;
  finalizeRound(state, runs, winnerRun?.agentId ?? runs[0]?.agentId ?? "");

  // Skill patches the winner would teach (only when there is a winner). A
  // patch-generation hiccup must not fail the whole stream.
  if (winnerAgent) {
    try {
      for (const p of evolve(state, challenge)) {
        emit({ type: "patch", sourceWinner: p.sourceWinner, targets: p.targetAgents, behavior: p.winningBehavior });
      }
    } catch {
      /* non-fatal */
    }
  }

  const summary: RunSummary = {
    totalAgents: state.agents.length,
    successCount: successful.length,
    failureCount: runs.length - successful.length,
    interruptedCount: 0, // backend never interrupts; stream-disconnect interruptions are tracked client-side
  };

  setActiveTournament(state);
  // All-agents-failed is a valid COMPLETED run with no winner (not a fatal error).
  await persist("completed");
  emit({
    type: "run-done",
    status: "completed",
    winnerAgentId: winnerAgent?.id ?? null,
    winnerAgentName: winnerAgent?.name ?? null,
    summary,
    runs,
  });
}

function buildFailedRun(agent: Agent, challenge: Challenge, steps: TraceStep[], message: string, durationMs: number): Run {
  // Preserve the partial trace and append the failure as a final step.
  const withError: TraceStep[] = [...steps, { index: steps.length, action: "error", description: message, ok: false }];
  return {
    agentId: agent.id,
    taskId: challenge.id,
    round: 1,
    steps: withError,
    finalState: "failed",
    result: "fail",
    score: 0,
    failureReason: message,
    signalTrait: `Failed: ${message}`,
    source: "gemini",
    durationMs,
  };
}

function upsertRound(state: TournamentState, runs: Run[]) {
  const existing = state.rounds.find((r) => r.round === 1);
  if (existing) existing.runs = [...runs];
  else state.rounds.push({ round: 1, taskId: state.taskId, runs: [...runs], winnerId: runs[0].agentId });
}

function finalizeRound(state: TournamentState, runs: Run[], winnerId: string) {
  const r = state.rounds.find((x) => x.round === 1);
  if (r) {
    r.runs = [...runs];
    r.winnerId = winnerId;
  }
}
