import { GoogleGenAI } from "@google/genai";
import type { Agent, TraceStep } from "./types";
import type { Challenge } from "./challenge";
import { runComputerUse } from "./computerUse";

// ─────────────────────────────────────────────────────────────────────────────
// Relay / continual-learning loop. ONE best-effort agent attempts a task on a
// real site. When it genuinely fails, we extract the concrete LESSON from that
// failure and add it to a shared playbook; the NEXT attempt inherits the whole
// playbook and tries again. Repeat until success (or the attempt budget runs
// out). The failures are real (no scripted stop points) — the only thing that
// changes between attempts is what the agent has learned.
// ─────────────────────────────────────────────────────────────────────────────

export type RelayEvent =
  | { type: "status"; message: string }
  | { type: "attempt-start"; attempt: number; lessons: string[] }
  | { type: "step"; attempt: number; step: TraceStep }
  | { type: "attempt-failed"; attempt: number; reason: string }
  | { type: "lesson"; attempt: number; lesson: string }
  | { type: "success"; attempt: number }
  | { type: "exhausted"; attempts: number }
  | { type: "error"; message: string };

/** A single neutral, best-effort operator — no scripted limitations. */
function operatorAgent(): Agent {
  return {
    id: "operator",
    name: "Operator",
    tagline: "Best effort. Learns from every failure.",
    strategy:
      "You are a capable autonomous web agent. Accomplish the task as reliably as you can: read the page carefully, dismiss popups/consent walls, follow flows all the way to the end, and confirm you actually reached the goal before stopping. Give your genuine best effort.",
    skills: [],
    scoreHistory: [],
  };
}

export async function runRelay(
  challenge: Challenge,
  opts: { maxAttempts?: number; baseUrl?: string },
  emit: (e: RelayEvent) => void,
): Promise<void> {
  if (!process.env.GEMINI_API_KEY) {
    emit({ type: "error", message: "GEMINI_API_KEY is not set — relay runs need a Gemini key." });
    return;
  }
  const maxAttempts = opts.maxAttempts ?? 4;
  const baseUrl = opts.baseUrl ?? challenge.url;
  const agent = operatorAgent();
  const playbook: string[] = [];

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    emit({ type: "attempt-start", attempt, lessons: [...playbook] });
    try {
      const result = await runComputerUse(agent, challenge, {
        baseUrl,
        maxSteps: 20,
        extraInstructions: playbook.length
          ? playbook.map((l, i) => `${i + 1}. ${l}`).join("\n")
          : undefined,
        onEvent: (e) => {
          if (e.kind === "step") emit({ type: "step", attempt, step: e.step });
          else emit({ type: "status", message: e.message });
        },
      });

      if (result.success) {
        emit({ type: "success", attempt });
        return;
      }

      const reason = result.judgeReason ?? "Did not reach the goal.";
      emit({ type: "attempt-failed", attempt, reason });

      if (attempt < maxAttempts) {
        const lesson = await extractLesson(challenge, result);
        playbook.push(lesson);
        emit({ type: "lesson", attempt, lesson });
      }
    } catch (err) {
      emit({ type: "attempt-failed", attempt, reason: (err as Error).message });
      if (attempt < maxAttempts) {
        const lesson = `Previous attempt errored (${(err as Error).message}). Be more deliberate and wait for the page to settle.`;
        playbook.push(lesson);
        emit({ type: "lesson", attempt, lesson });
      }
    }
  }

  emit({ type: "exhausted", attempts: maxAttempts });
}

/** Turn a real failure (what the agent did + why the judge failed it) into one
 *  concrete, actionable lesson for the next attempt. */
async function extractLesson(
  challenge: Challenge,
  result: { steps: TraceStep[]; judgeReason?: string; finalUrl: string },
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const actions = result.steps.map((s, i) => `${i + 1}. ${s.action}: ${s.description}`).join("\n");
  try {
    const res: any = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text:
                `Task: "${challenge.goal}"\n\n` +
                `An agent just attempted this and FAILED.\n` +
                `Why it failed (judge): ${result.judgeReason ?? "unknown"}\n` +
                `Ended at URL: ${result.finalUrl}\n` +
                `What it did:\n${actions}\n\n` +
                `Write ONE concrete, actionable lesson (max 25 words) the NEXT attempt should ` +
                `follow to avoid this exact failure. Be specific about the page/step. ` +
                `Return JSON: {"lesson": "<the lesson>"}.`,
            },
          ],
        },
      ],
      config: { responseMimeType: "application/json" },
    });
    const text = res.text ?? res.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const m = String(text).match(/\{[\s\S]*\}/);
    return m ? String(JSON.parse(m[0]).lesson) : "Be more thorough and verify the goal was actually reached.";
  } catch {
    return "Be more thorough and verify the goal was actually reached before stopping.";
  }
}
