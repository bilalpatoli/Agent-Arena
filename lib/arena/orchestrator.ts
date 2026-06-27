import type { Agent, RoundResult, Run, SkillPatch, TournamentState } from "./types";
import type { Challenge } from "./challenge";
import { CHALLENGES, SIGNUP_CHALLENGE } from "./challenge";
import { seedAgents } from "./agents";
import { MockRunner } from "./mockRunner";
import { GeminiRunner, liveEnabled } from "./geminiRunner";
import { ReplayRunner, hasTrajectories } from "./trajectory";
import { type AgentRunner } from "./runner";
import { pickWinner } from "./judge";
import { applyPatch, buildPatch, diffMissingBehaviors } from "./patcher";

// ─────────────────────────────────────────────────────────────────────────────
// Hybrid runner: try live Gemini, fall back to the deterministic mock on any
// failure (no key, rate limit, parse error). The demo never breaks.
// ─────────────────────────────────────────────────────────────────────────────
export class HybridRunner implements AgentRunner {
  readonly source = "mock" as const;
  private gemini = new GeminiRunner();
  private mock = new MockRunner();

  async run(agent: Agent, challenge: Challenge, round: number): Promise<Run> {
    if (liveEnabled()) {
      try {
        return await this.gemini.run(agent, challenge, round);
      } catch (err) {
        console.warn(`[arena] Gemini run failed for ${agent.id}, using mock:`, (err as Error).message);
      }
    }
    return this.mock.run(agent, challenge, round);
  }
}

export function makeTournament(challenge: Challenge = SIGNUP_CHALLENGE): TournamentState {
  return { taskId: challenge.id, agents: seedAgents(), rounds: [], patches: [] };
}

/** Which challenge the demo is currently configured to run (ARENA_CHALLENGE).
 *  Defaults to the headline real-site demo (saucedemo); ARENA_CHALLENGE=signup
 *  switches to the synthetic trap page. */
export function selectChallenge(): Challenge {
  return CHALLENGES[process.env.ARENA_CHALLENGE ?? "saucedemo"] ?? SIGNUP_CHALLENGE;
}

/**
 * Pick the runner for a challenge:
 *  - real site with captured trajectories → ReplayRunner (deterministic, offline)
 *  - otherwise → HybridRunner (live Gemini if enabled, else mock)
 */
export function makeRunner(challenge: Challenge): AgentRunner {
  if (challenge.kind === "real" && hasTrajectories(challenge.id)) return new ReplayRunner();
  return new HybridRunner();
}

/** Run every agent once, judge, and record the round (no patching yet). */
export async function runRound(
  state: TournamentState,
  runner: AgentRunner,
  challenge: Challenge = SIGNUP_CHALLENGE,
): Promise<RoundResult> {
  const round = state.rounds.length + 1;
  const runs: Run[] = [];
  for (const agent of state.agents) {
    const run = await runner.run(agent, challenge, round);
    runs.push(run);
    agent.scoreHistory.push(run.score);
  }
  const winner = pickWinner(runs);
  const result: RoundResult = { round, taskId: challenge.id, runs, winnerId: winner.agentId };
  state.rounds.push(result);
  return result;
}

/**
 * Evolution step for the most recent round: teach every loser the skill the
 * winner used. Mutates loser agents in place and records the patches.
 */
export function evolve(
  state: TournamentState,
  challenge: Challenge = SIGNUP_CHALLENGE,
  now: string = new Date().toISOString(),
): SkillPatch[] {
  const round = state.rounds[state.rounds.length - 1];
  if (!round) return [];
  const winnerAgent = state.agents.find((a) => a.id === round.winnerId)!;

  const patches: SkillPatch[] = [];
  for (const run of round.runs) {
    if (run.agentId === round.winnerId) continue;
    const loser = state.agents.find((a) => a.id === run.agentId)!;
    const behaviors = diffMissingBehaviors(winnerAgent, loser, run, challenge);
    const patch = buildPatch(winnerAgent, loser, run, challenge, round.round, now);
    if (!patch || behaviors.length === 0) continue;
    const evolved = applyPatch(loser, patch, behaviors);
    // mutate in place
    const idx = state.agents.findIndex((a) => a.id === loser.id);
    state.agents[idx] = evolved;
    state.patches.push(patch);
    patches.push(patch);
  }
  round.patch = patches[0];
  return patches;
}
