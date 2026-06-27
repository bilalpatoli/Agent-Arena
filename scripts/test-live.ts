/* eslint-disable no-console */
// Live Arena event-contract + history-persistence tests (run: `npm test`).
// Uses an injected mock runner so no real Gemini/browser is needed, and an
// isolated temp history dir so nothing touches real saved runs.
import os from "os";
import path from "path";
import { promises as fs } from "fs";
import { buildCustomChallenge } from "../lib/arena/challenge";
import { runCustomTournament } from "../lib/arena/custom";
import type { LiveArenaEvent } from "../lib/arena/liveEvents";
import { getRun, listRuns, saveRun, toSummary, type PersistedRun } from "../lib/arena/historyStore";
import type { TournamentState } from "../lib/arena/types";

process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || "test-key";
const TEST_HISTORY_DIR = path.join(os.tmpdir(), `arena-test-history-${Date.now()}`);
process.env.ARENA_HISTORY_DIR = TEST_HISTORY_DIR;

type Behavior = "success" | "fail" | "throw";

// Mock matching runComputerUse: emits a couple of steps, then succeeds/fails/throws.
function mockRunner(plan: Record<string, Behavior>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (async (agent: any, challenge: any, opts: any) => {
    const onEvent = opts?.onEvent;
    onEvent?.({ kind: "status", message: "starting" });
    onEvent?.({ kind: "step", step: { index: 0, action: "navigate", description: `Opened ${challenge.url}`, ok: true } });
    const b: Behavior = plan[agent.id] ?? "success";
    if (b === "throw") {
      onEvent?.({ kind: "step", step: { index: 1, action: "click", description: "Clicked the search box", ok: true } });
      throw new Error("navigation timeout after 30s");
    }
    return {
      steps: [{ index: 0, action: "navigate", description: "Opened", ok: true }],
      success: b === "success",
      clickedDecoy: b !== "success",
      finalUrl: "https://example.com/done",
      finalState: b === "success" ? "success" : "incomplete",
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;
}

async function scenario(plan: Record<string, Behavior>): Promise<LiveArenaEvent[]> {
  const events: LiveArenaEvent[] = [];
  const challenge = buildCustomChallenge({ url: "https://example.com", task: "do the thing" });
  await runCustomTournament(challenge, (e) => events.push(e), mockRunner(plan));
  return events;
}

let failures = 0;
function check(cond: boolean, msg: string) {
  console.log(`${cond ? "  ok  " : "FAIL  "}${msg}`);
  if (!cond) failures++;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ofType = (evs: LiveArenaEvent[], t: string): any[] => evs.filter((e) => e.type === t);

async function main() {
  console.log("\n# thrown agent error");
  {
    const ev = await scenario({ speedrunner: "throw", planner: "success", verifier: "success" });
    check(ofType(ev, "agent-error").some((e) => e.agentId === "speedrunner" && e.fatal === false), "agent-error has agentId + fatal:false");
    const sd = ofType(ev, "agent-done").find((e) => e.agentId === "speedrunner");
    check(!!sd && sd.run.result === "fail", "thrown agent gets terminal agent-done with result:fail");
    check(!!sd && (sd.run.failureReason ?? "").includes("timeout"), "failed run has readable failureReason");
    check(!!sd && sd.run.steps.length >= 2 && sd.run.steps.some((s: { ok: boolean }) => !s.ok), "partial trace preserved + error step");
    const started = ofType(ev, "agent-started").map((e) => e.agentId);
    const done = ofType(ev, "agent-done").map((e) => e.agentId);
    check(started.length === 3 && started.every((id: string) => done.includes(id)), "every started agent emits agent-done");
    check(!ev.some((e) => e.type === "error"), "no fatal error for a per-agent failure");
    const rd = ofType(ev, "run-done")[0];
    check(!!rd && !!rd.winnerAgentId && rd.winnerAgentId !== "speedrunner", "winner is a successful agent");
  }

  console.log("\n# completed (non-throwing) failure + success");
  {
    const ev = await scenario({ speedrunner: "fail", planner: "fail", verifier: "success" });
    check(ofType(ev, "agent-error").length === 0, "no agent-error for completed (non-throwing) failures");
    const planner = ofType(ev, "agent-done").find((e) => e.agentId === "planner");
    const verifier = ofType(ev, "agent-done").find((e) => e.agentId === "verifier");
    check(!!planner && planner.run.result === "fail", "completed failure → result:fail");
    check(!!verifier && verifier.run.result === "success", "completed success → result:success");
  }

  console.log("\n# all agents fail");
  {
    const ev = await scenario({ speedrunner: "throw", planner: "throw", verifier: "throw" });
    const rd = ofType(ev, "run-done")[0];
    check(!!rd && rd.status === "completed", "run-done status completed even when all fail");
    check(!!rd && rd.winnerAgentId === null, "winnerAgentId null when all fail");
    check(!!rd && rd.summary.failureCount === 3 && rd.summary.successCount === 0, "summary counts all failed");
    check(ofType(ev, "agent-done").length === 3, "all agents still emit agent-done");
    check(!ev.some((e) => e.type === "error"), "all-fail is not a fatal error");
  }

  console.log("\n# fatal: missing API key");
  {
    const saved = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    const ev = await scenario({});
    process.env.GEMINI_API_KEY = saved;
    check(ofType(ev, "error").some((e) => e.fatal === true), "missing key → fatal error event");
    check(ofType(ev, "agent-started").length === 0, "no agents start on a fatal error");
    // The fatal run is still SAVED as failed so it's viewable.
    const failedRun = (await listRuns()).find((r) => r.status === "failed");
    check(!!failedRun && !!failedRun.failureReason, "fatal (no key) run is persisted with status:failed + reason");
  }

  console.log("\n# history persistence (direct)");
  {
    const state: TournamentState = {
      taskId: "saucedemo-checkout-v1",
      agents: [
        { id: "planner", name: "Planner", tagline: "", strategy: "", skills: [], scoreHistory: [60, 100] },
        { id: "verifier", name: "Verifier", tagline: "", strategy: "", skills: [], scoreHistory: [100, 100] },
      ],
      rounds: [
        {
          round: 1,
          taskId: "x",
          winnerId: "verifier",
          runs: [
            { agentId: "verifier", taskId: "x", round: 1, steps: [], finalState: "done", result: "success", score: 100, source: "mock", durationMs: 1 },
            { agentId: "planner", taskId: "x", round: 1, steps: [], finalState: "stuck", result: "fail", score: 60, source: "mock", durationMs: 1 },
          ],
        },
        { round: 2, taskId: "x", winnerId: "planner", runs: [] },
      ],
      patches: [
        { id: "p1", round: 1, sourceWinner: "verifier", targetAgents: ["planner"], winningBehavior: "verify", failureCorrected: "", newSkillText: "", appliedAt: new Date().toISOString() },
      ],
    };
    const rec: PersistedRun = {
      id: "test-direct-1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "completed",
      challengeName: "Swag Labs Checkout",
      challengeType: "Swag Labs Checkout",
      task: "checkout",
      state,
    };
    await saveRun(rec);
    const got = await getRun("test-direct-1");
    check(!!got && got.id === "test-direct-1", "saveRun → getRun round-trips");
    check((await listRuns()).some((r) => r.id === "test-direct-1"), "listRuns includes the saved run");
    const sum = toSummary(rec);
    check(sum.winnerAgentName === "Verifier" && sum.winnerAgentId === "verifier", "summary derives the real winner");
    check(sum.agentCount === 2 && sum.patchCount === 1, "summary derives agent + patch counts");
    check(!!sum.improvementSummary && sum.improvementSummary.agentId === "planner" && sum.improvementSummary.delta === 40, "summary derives top improver (Planner +40)");

    // No-winner (all failed) → winnerAgentId null.
    const noWinner: PersistedRun = {
      ...rec,
      id: "test-direct-2",
      state: { ...state, rounds: [{ round: 1, taskId: "x", winnerId: "planner", runs: [{ agentId: "planner", taskId: "x", round: 1, steps: [], finalState: "stuck", result: "fail", score: 0, source: "mock", durationMs: 1 }] }] },
    };
    check(toSummary(noWinner).winnerAgentId === null, "all-failed run summarizes with winnerAgentId:null");
  }

  // Clean up the isolated test history dir.
  await fs.rm(TEST_HISTORY_DIR, { recursive: true, force: true }).catch(() => {});

  console.log(`\n${failures === 0 ? "✓ ALL PASS" : "✗ " + failures + " CHECK(S) FAILED"}\n`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
