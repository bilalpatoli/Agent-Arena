import type { Agent, Run, TraceStep } from "./types";
import type { Challenge } from "./challenge";
import { TOTAL_POSSIBLE } from "./challenge";
import { agentBehaviors, type AgentRunner } from "./runner";

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic runner. Produces a realistic browser/debugging trace + score
// purely from the agent's current skills, so the *same* agent behaves
// differently before and after a skill patch. This is what proves the learning
// loop is real, and it's the runner used until a live Gemini key is present.
// ─────────────────────────────────────────────────────────────────────────────

export class MockRunner implements AgentRunner {
  readonly source = "mock" as const;

  async run(agent: Agent, challenge: Challenge, round: number): Promise<Run> {
    const behaviors = agentBehaviors(agent);
    const steps: TraceStep[] = [];
    let score = 0;
    let i = 0;
    const push = (s: Omit<TraceStep, "index">) => steps.push({ index: i++, ...s });

    push({
      action: "navigate",
      description: `Opened the checkout page (${challenge.url}).`,
      target: challenge.url,
      screenshot: shot("checkout"),
      ok: true,
    });

    let reproduced = true; // did the agent actually reproduce/diagnose the bug?
    let verified = false;

    for (const trap of challenge.traps) {
      const canClear = behaviors.has(trap.requiredBehavior);
      if (canClear) {
        score += trap.weight;
        if (trap.id === "verify-success") verified = true;
        push({
          action: actionFor(trap.requiredBehavior),
          description: `${trap.label} — done. ${trap.description}`,
          target: trap.id,
          screenshot: shot(trap.id),
          ok: true,
        });
      } else {
        if (trap.id === "reproduce-bug") reproduced = false;
        push({
          action: actionFor(trap.requiredBehavior),
          description: `${trap.label} — skipped. ${missReason(trap.requiredBehavior)}`,
          target: trap.id,
          screenshot: shot(`${trap.id}-fail`),
          ok: false,
        });
      }
    }

    // The decoy: agents that don't verify the final state edit the obvious file
    // on a guess and lose time.
    const avoidsDecoy = behaviors.has(challenge.decoy.behaviorThatAvoidsIt);
    if (!avoidsDecoy) {
      score = Math.max(0, score - challenge.decoy.penalty);
      push({
        action: "edit",
        description: `${challenge.decoy.label} — edited code on a guess before reproducing the bug, and lost time (−${challenge.decoy.penalty}).`,
        target: challenge.decoy.id,
        screenshot: shot("guess"),
        ok: false,
      });
    }

    const success = verified && reproduced;
    const failureReason = success
      ? undefined
      : !reproduced
        ? "Edited code without reproducing the bug, so the real validation condition was never fixed — checkout stays blocked."
        : "Declared success off a passing log line without confirming the order reached /success.";

    push({
      action: success ? "verify" : "halt",
      description: success
        ? "Verified /success — 'Order confirmed'. Checkout fixed."
        : `Checkout still blocked. ${failureReason}`,
      target: success ? "success" : "stuck",
      screenshot: shot(success ? "success" : "stuck"),
      ok: success,
    });

    const normalized = Math.round((score / TOTAL_POSSIBLE) * 100);

    return {
      agentId: agent.id,
      taskId: challenge.id,
      round,
      steps,
      finalState: success ? "/success — Order confirmed" : "checkout (blocked)",
      result: success ? "success" : "fail",
      score: normalized,
      failureReason,
      signalTrait: success
        ? "Reproduced the bug, fixed the validation logic, ran the tests, and verified the /success page."
        : deriveFailTrait(behaviors),
      source: this.source,
      durationMs: 1200 + steps.length * 180,
    };
  }
}

function deriveFailTrait(behaviors: Set<string>): string {
  if (!behaviors.has("scroll-full-page"))
    return "Jumped into code before reproducing the bug, so it never found the validation condition.";
  if (!behaviors.has("verify-final-state"))
    return "Trusted a passing log line instead of verifying the real /success page.";
  return "Stopped short of a verified, working checkout.";
}

function actionFor(behavior: string): string {
  return (
    {
      "fill-basic-form": "browser",
      "scroll-full-page": "inspect",
      "handle-modal": "test",
      "verify-final-state": "verify",
    }[behavior] ?? "act"
  );
}

function missReason(behavior: string): string {
  return (
    {
      "scroll-full-page": "Skipped reproducing the bug and never inspected the console or validation state.",
      "verify-final-state": "Never confirmed the order reached /success.",
      "handle-modal": "Did not run the checkout test.",
      "fill-basic-form": "Could not set up a test order.",
    }[behavior] ?? "Lacked the skill to handle this."
  );
}

/** Synthetic screenshot id the UI can map to a placeholder frame. */
function shot(id: string): string {
  return `synthetic://checkout/${id}`;
}
