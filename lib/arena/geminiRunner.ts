import type { Agent, Run, TraceStep } from "./types";
import type { Challenge } from "./challenge";
import { type AgentRunner } from "./runner";
import { runComputerUse, type ComputerUseResult } from "./computerUse";

// ─────────────────────────────────────────────────────────────────────────────
// Live runner backed by Gemini 3.5 Flash Computer Use. Drives a real headless
// browser over /challenge (see computerUse.ts). Behavior is shaped by the
// agent's SKILL.md, so a patched agent genuinely acts differently on screen.
// Scoring is computed from ground truth (did it reach the real dashboard, how
// efficiently, did it fall for the decoy) — never self-reported by the model.
// ─────────────────────────────────────────────────────────────────────────────

export function geminiAvailable(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

/** Live runs are slow + costly; gate behind a flag so we choose when to burn them. */
export function liveEnabled(): boolean {
  return geminiAvailable() && process.env.ARENA_LIVE !== "0";
}

function baseUrl(): string {
  return process.env.ARENA_BASE_URL ?? "http://localhost:3001";
}

export class GeminiRunner implements AgentRunner {
  readonly source = "gemini" as const;

  async run(agent: Agent, challenge: Challenge, round: number): Promise<Run> {
    if (!geminiAvailable()) throw new Error("GEMINI_API_KEY not set");

    const t0 = Date.now();
    const result = await runComputerUse(agent, challenge, { baseUrl: baseUrl() });
    return resultToRun(agent, challenge, round, result, Date.now() - t0);
  }
}

/** Build a scored Run from a (live or captured) computer-use result.
 *  Shared by the live runner and the capture script. */
export function resultToRun(
  agent: Agent,
  challenge: Challenge,
  round: number,
  result: ComputerUseResult,
  durationMs: number,
): Run {
  const { score, signalTrait, failureReason } = scoreRun(result);
  return {
    agentId: agent.id,
    taskId: challenge.id,
    round,
    steps: result.steps.length ? result.steps : [terminalStep(result.success)],
    finalState: result.finalState,
    result: result.success ? "success" : "fail",
    score,
    failureReason: result.success ? undefined : failureReason,
    signalTrait,
    source: "gemini",
    durationMs,
  };
}

// ── ground-truth scoring (challenge-agnostic, outcome-driven) ────────────────
function scoreRun(r: ComputerUseResult): {
  score: number;
  signalTrait: string;
  failureReason?: string;
} {
  if (r.success) {
    // All successes are NOT equal — score HOW it succeeded so a real winner
    // emerges even when every agent completes the task. Balanced across:
    // efficiency (fewer steps), clean execution (no failed/redundant actions),
    // and verification (did it actually confirm the result).
    const steps = r.steps.length;
    const failed = r.steps.filter((s) => !s.ok).length;
    const verified = r.steps.some(
      (s) => s.action === "verify" || /verif|confirm|double-check|ensure/i.test(s.description ?? ""),
    );
    let score = 100;
    score -= Math.max(0, steps - 6) * 1.5; // efficiency: lean runs win
    score -= failed * 5; // clean execution: wasted/failed actions cost
    score -= verified ? 0 : 6; // thoroughness: not confirming costs
    score -= r.clickedDecoy ? 8 : 0;
    score = Math.round(Math.max(72, Math.min(100, score)));
    return {
      score,
      signalTrait: verified
        ? `Completed and verified the result in ${steps} steps.`
        : `Completed the task in ${steps} steps, but didn't verify the result.`,
    };
  }

  // Fail: credit progress by how many actions actually landed before stalling.
  const okSteps = r.steps.filter((s) => s.ok).length;
  const score = Math.max(8, Math.min(55, 8 + okSteps * 4));

  const failureReason = failureFromUrl(r.finalUrl);
  return {
    score,
    signalTrait: r.finalUrl.includes("inventory")
      ? "Gave up early — never followed the task through."
      : "Did not see the task through to a verified success.",
    failureReason,
  };
}

/** Turn the real final URL into a human failure reason (saucedemo-aware, generic fallback). */
function failureFromUrl(url: string): string {
  if (url.includes("inventory") || url.includes("cart"))
    return "Gave up early — added the item but never went through checkout.";
  if (url.includes("step-two") || url.includes("overview"))
    return "Stopped at the order overview and never clicked Finish to place and confirm the order.";
  if (url.includes("step-one") || url.includes("information"))
    return "Left the checkout form incomplete.";
  return "Stopped before reaching and verifying the real success state.";
}

function terminalStep(success: boolean): TraceStep {
  return {
    index: 0,
    action: success ? "verify" : "halt",
    description: success ? "Reached the success state." : "Could not complete the task.",
    ok: success,
  };
}
