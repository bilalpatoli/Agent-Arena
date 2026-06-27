/* eslint-disable no-console */
// Live Arena event-contract tests (run: `npm test`). Uses an injected mock
// runner so no real Gemini/browser is needed.
import { buildCustomChallenge } from "../lib/arena/challenge";
import { runCustomTournament } from "../lib/arena/custom";
import type { LiveArenaEvent } from "../lib/arena/liveEvents";

process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || "test-key";

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
  }

  console.log(`\n${failures === 0 ? "✓ ALL PASS" : "✗ " + failures + " CHECK(S) FAILED"}\n`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
