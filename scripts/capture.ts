// Capture real Gemini computer-use trajectories for a challenge, then the demo
// replays them deterministically. Resume-friendly: skips runs already captured,
// so you can run it repeatedly across quota windows until the set is complete.
//
//   npx tsx scripts/capture.ts saucedemo
//
// Produces data/trajectories/<challenge>/<agent>-r{1,2}.json
// (r1 = original behavior, r2 = behavior AFTER the skill patch).

import { readFileSync } from "node:fs";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { CHALLENGES, type Challenge } from "../lib/arena/challenge";
import { seedAgents } from "../lib/arena/agents";
import { makeTournament, runRound, evolve } from "../lib/arena/orchestrator";
import { runComputerUse } from "../lib/arena/computerUse";
import { resultToRun } from "../lib/arena/geminiRunner";
import { loadTrajectory, saveTrajectory } from "../lib/arena/trajectory";
import { type AgentRunner } from "../lib/arena/runner";
import type { Agent, Run } from "../lib/arena/types";

// load .env.local
try {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}

const STAMP = process.env.CAPTURE_STAMP ?? "captured";

/** Runs live + saves a trajectory, OR loads it if already captured (resume). */
class CaptureRunner implements AgentRunner {
  readonly source = "gemini" as const;
  async run(agent: Agent, challenge: Challenge, round: number): Promise<Run> {
    const existing = loadTrajectory(challenge.id, agent.id, round);
    if (existing) {
      console.log(`  • ${agent.id} r${round}: already captured (skip)`);
      return { ...existing.run, round };
    }
    console.log(`  ▶ ${agent.id} r${round}: capturing live…`);
    const recordDir = join("public", "live-trace", challenge.id, `${agent.id}-r${round}`);
    const t0 = Date.now();
    const result = await runComputerUse(agent, challenge, {
      baseUrl: process.env.ARENA_BASE_URL ?? "http://localhost:3001",
      maxSteps: 24,
      recordDir,
    });
    const run = resultToRun(agent, challenge, round, result, Date.now() - t0);
    saveTrajectory({
      capturedAt: STAMP,
      challengeId: challenge.id,
      agentId: agent.id,
      round,
      run,
    });
    console.log(`    saved: ${run.result} (${run.score}/100), ${run.steps.length} steps`);
    return run;
  }
}

async function main() {
  const challenge = CHALLENGES[process.argv[2] ?? "saucedemo"];
  if (!challenge) throw new Error(`Unknown challenge: ${process.argv[2]}`);
  console.log(`\n🎥 Capturing trajectories for: ${challenge.title}\n`);

  const state = makeTournament(challenge);
  state.agents = seedAgents();
  const runner = new CaptureRunner();

  console.log("ROUND 1 (original behavior)");
  await runRound(state, runner, challenge);

  console.log("\nEVOLUTION (applying skill patches)");
  const patches = evolve(state, challenge, STAMP);
  patches.forEach((p) => console.log(`  ${p.sourceWinner} → ${p.targetAgents.join(",")}`));

  // Winner doesn't change → reuse its r1 capture as r2 (saves quota).
  const winnerId = state.rounds[0].winnerId;
  const dir = join("data", "trajectories", challenge.id);
  mkdirSync(dir, { recursive: true });
  const r1 = join(dir, `${winnerId}-r1.json`);
  const r2 = join(dir, `${winnerId}-r2.json`);
  if (existsSync(r1) && !existsSync(r2)) copyFileSync(r1, r2);

  console.log("\nROUND 2 (after patch — losers re-run with patched SKILL.md)");
  await runRound(state, runner, challenge);

  console.log("\n✅ Capture complete. Trajectories in data/trajectories/" + challenge.id);
  for (const a of state.agents) console.log(`  ${a.name}: ${a.scoreHistory.join(" → ")}`);
}

main().catch((e) => {
  console.error("CAPTURE ERROR:", e?.message ?? e);
  console.error("(re-run to resume from where it stopped)");
  process.exit(1);
});
