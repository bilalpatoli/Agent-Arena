import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Agent, Run } from "./types";
import type { Challenge } from "./challenge";
import { type AgentRunner } from "./runner";

// ─────────────────────────────────────────────────────────────────────────────
// Trajectories: a captured real Gemini computer-use run, saved to disk so the
// demo can replay it deterministically (real screenshots, zero live API calls).
//
//   capture (live, ahead of time) → data/trajectories/<challenge>/<agent>-r<n>.json
//   replay  (on stage)            → ReplayRunner loads it and returns the Run
//
// Round 1 trajectory = the agent's original behavior; round 2 = its behavior
// AFTER the skill patch (captured by running it again with the patched SKILL.md).
// ─────────────────────────────────────────────────────────────────────────────

export interface Trajectory {
  capturedAt: string;
  challengeId: string;
  agentId: string;
  round: number;
  /** The full Run, including step screenshots inline as data URLs. */
  run: Run;
}

function rootDir(): string {
  return process.env.ARENA_TRAJECTORY_DIR ?? join(process.cwd(), "data", "trajectories");
}

function pathFor(challengeId: string, agentId: string, round: number): string {
  return join(rootDir(), challengeId, `${agentId}-r${round}.json`);
}

export function saveTrajectory(t: Trajectory): string {
  const file = pathFor(t.challengeId, t.agentId, t.round);
  mkdirSync(join(rootDir(), t.challengeId), { recursive: true });
  writeFileSync(file, JSON.stringify(t, null, 2));
  return file;
}

export function loadTrajectory(challengeId: string, agentId: string, round: number): Trajectory | null {
  const file = pathFor(challengeId, agentId, round);
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, "utf8")) as Trajectory;
}

export function hasTrajectories(challengeId: string): boolean {
  return existsSync(join(rootDir(), challengeId));
}

/**
 * Replays captured real runs as if they were live. Deterministic and offline —
 * this is what powers the bulletproof "real website" demo.
 */
export class ReplayRunner implements AgentRunner {
  readonly source = "gemini" as const;

  async run(agent: Agent, challenge: Challenge, round: number): Promise<Run> {
    const t = loadTrajectory(challenge.id, agent.id, round);
    if (!t) {
      throw new Error(
        `No captured trajectory for ${challenge.id}/${agent.id} round ${round}. Run the capture script first.`,
      );
    }
    // Keep the recorded run, but stamp the round we're replaying into.
    return { ...t.run, round, source: "gemini" };
  }
}
