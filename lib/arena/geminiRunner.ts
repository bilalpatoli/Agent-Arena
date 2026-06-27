import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Agent, Run, TraceStep } from "./types";
import type { Challenge } from "./challenge";
import { TOTAL_POSSIBLE } from "./challenge";
import { type AgentRunner } from "./runner";

// ─────────────────────────────────────────────────────────────────────────────
// Live runner backed by Gemini 3.5 Flash.
//
// Today it drives the agent by *reasoning* over the challenge + the agent's
// current SKILL.md and returns a structured trace. The COMPUTER-USE SEAM below
// (marked TODO) is where the real Gemini 3.5 Flash Computer Use loop plugs in:
// feed screenshots of /challenge, receive click/scroll/type actions, execute
// them in the browser, repeat. The trace/score contract stays identical, so the
// rest of the arena (judge, patcher, UI) needs zero changes when we go live.
// ─────────────────────────────────────────────────────────────────────────────

const MODEL = "gemini-2.0-flash"; // swap to the 3.5 Flash computer-use model id when enabled

export function geminiAvailable(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export class GeminiRunner implements AgentRunner {
  readonly source = "gemini" as const;

  async run(agent: Agent, challenge: Challenge, round: number): Promise<Run> {
    if (!geminiAvailable()) throw new Error("GEMINI_API_KEY not set");

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: MODEL,
      generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
    });

    const prompt = buildPrompt(agent, challenge);

    // ── COMPUTER-USE SEAM ──────────────────────────────────────────────────
    // Replace this single text call with the action loop:
    //   while (!done) { screenshot -> model -> action -> execute }
    // and accumulate real TraceSteps from executed browser actions.
    const res = await model.generateContent(prompt);
    const parsed = safeParse(res.response.text());

    const steps: TraceStep[] = (parsed.steps ?? []).map((s: any, i: number) => ({
      index: i,
      action: String(s.action ?? "act"),
      description: String(s.description ?? ""),
      target: s.target ? String(s.target) : undefined,
      screenshot: s.screenshot ? String(s.screenshot) : `gemini://signup/${i}`,
      ok: Boolean(s.ok),
    }));

    const score = clampScore(parsed.score);
    const success = parsed.result === "success";

    return {
      agentId: agent.id,
      taskId: challenge.id,
      round,
      steps: steps.length ? steps : [fallbackStep(success)],
      finalState: success ? "dashboard" : "signup (blocked)",
      result: success ? "success" : "fail",
      score,
      failureReason: success ? undefined : String(parsed.failureReason ?? "Did not reach the dashboard."),
      signalTrait: String(parsed.signalTrait ?? ""),
      source: this.source,
      durationMs: Number(parsed.durationMs ?? 2500),
    };
  }
}

function buildPrompt(agent: Agent, challenge: Challenge): string {
  return [
    "You are an autonomous web agent attempting a browser task. Act ONLY according to your skills.",
    "If a required behavior is NOT in your skills, you will realistically FAIL the related step.",
    "",
    `# Task\n${challenge.goal}`,
    `# Page traps\n${challenge.traps.map((t) => `- ${t.label}: ${t.description}`).join("\n")}`,
    `# Decoy\n- ${challenge.decoy.label} (only agents that verify the final state avoid this)`,
    `# Your strategy\n${agent.strategy}`,
    `# Your current skills (SKILL.md)\n${agent.skills.map((s) => `- ${s.text}`).join("\n")}`,
    "",
    "Return JSON: {steps:[{action,description,target,ok}], result:'success'|'fail', score:0-100, failureReason, signalTrait, durationMs}.",
    "Be honest: if you lack a skill needed for a trap, that step's ok=false and it lowers the score.",
  ].join("\n");
}

function safeParse(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : { steps: [], result: "fail", score: 0 };
  }
}

function clampScore(v: unknown): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function fallbackStep(success: boolean): TraceStep {
  return {
    index: 0,
    action: success ? "verify" : "halt",
    description: success ? "Reached the dashboard." : "Could not complete the task.",
    ok: success,
  };
}

// keep TOTAL_POSSIBLE referenced so the scoring scale stays in one place
void TOTAL_POSSIBLE;
