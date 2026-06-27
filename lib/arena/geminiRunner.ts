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
    const durationMs = Date.now() - t0;

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
      source: this.source,
      durationMs,
    };
  }
}

// ── ground-truth scoring ─────────────────────────────────────────────────────
function scoreRun(r: ComputerUseResult): {
  score: number;
  signalTrait: string;
  failureReason?: string;
} {
  const scrolled = r.steps.some((s) => s.action === "scroll" && s.ok);
  const typed = r.steps.some((s) => s.action === "type" && s.ok);

  if (r.success) {
    let score = 100;
    if (r.clickedDecoy) score -= 15;
    const overhead = Math.max(0, r.steps.length - 9);
    score = Math.max(70, score - overhead * 2);
    return {
      score,
      signalTrait: "Scanned the full page, cleared every trap, and verified the real dashboard state.",
    };
  }

  // Partial credit for how far it got before stalling.
  let score = 10;
  if (typed) score += 15;
  if (scrolled) score += 20;
  if (r.clickedDecoy) score -= 15;
  score = Math.max(0, Math.min(55, score));

  const failureReason = !scrolled
    ? "Never scrolled below the fold, so it missed the required checkbox and the form never submitted."
    : r.clickedDecoy
      ? "Chased the fake 'Get Started Free' CTA instead of verifying the real dashboard."
      : "Stalled before reaching and verifying the real dashboard.";

  return {
    score,
    signalTrait: !scrolled
      ? "Never scrolled below the fold."
      : "Did not verify the real success state.",
    failureReason,
  };
}

function terminalStep(success: boolean): TraceStep {
  return {
    index: 0,
    action: success ? "verify" : "halt",
    description: success ? "Reached the dashboard." : "Could not complete the task.",
    ok: success,
  };
}
