import type { Agent, Run, TraceStep } from "./types";
import type { Challenge } from "./challenge";
import { TOTAL_POSSIBLE } from "./challenge";
import { agentBehaviors, type AgentRunner } from "./runner";

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic runner. Produces a realistic trace + score purely from the
// agent's current skills, so the *same* agent behaves differently before and
// after a skill patch. This is the fallback that keeps the demo bullet-proof
// and also the thing that proves the learning loop is real, not cosmetic.
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
      description: `Opened ${challenge.url} — "${challenge.title}".`,
      target: challenge.url,
      screenshot: shot("landing"),
      ok: true,
    });

    let clearedHidden = true;
    let verified = false;

    for (const trap of challenge.traps) {
      const canClear = behaviors.has(trap.requiredBehavior);
      if (canClear) {
        score += trap.weight;
        if (trap.id === "verify-success") verified = true;
        push({
          action: actionFor(trap.requiredBehavior),
          description: `${trap.label} — cleared. ${trap.description}`,
          target: trap.id,
          screenshot: shot(trap.id),
          ok: true,
        });
      } else {
        if (trap.id === "hidden-checkbox") clearedHidden = false;
        push({
          action: actionFor(trap.requiredBehavior),
          description: `${trap.label} — MISSED. ${missReason(trap.requiredBehavior)}`,
          target: trap.id,
          screenshot: shot(`${trap.id}-fail`),
          ok: false,
        });
      }
    }

    // The decoy: agents that don't verify the final state chase the fake CTA.
    const avoidsDecoy = behaviors.has(challenge.decoy.behaviorThatAvoidsIt);
    if (!avoidsDecoy) {
      score = Math.max(0, score - challenge.decoy.penalty);
      push({
        action: "click",
        description: `Fell for the decoy: clicked "${challenge.decoy.label}" and got sidetracked (−${challenge.decoy.penalty}).`,
        target: challenge.decoy.id,
        screenshot: shot("decoy"),
        ok: false,
      });
    }

    const success = verified && clearedHidden;
    const failureReason = success
      ? undefined
      : !clearedHidden
        ? "Submitted without the required checkbox — the form never went through (never scrolled below the fold)."
        : "Declared success on a fake toast without confirming the real dashboard.";

    push({
      action: success ? "verify" : "halt",
      description: success
        ? "Confirmed real dashboard heading 'Welcome to FlowMetrics'. Task complete."
        : `Run ended without reaching the dashboard. ${failureReason}`,
      target: success ? "dashboard" : "stuck",
      screenshot: shot(success ? "dashboard" : "stuck"),
      ok: success,
    });

    const normalized = Math.round((score / TOTAL_POSSIBLE) * 100);

    return {
      agentId: agent.id,
      taskId: challenge.id,
      round,
      steps,
      finalState: success ? "dashboard" : "signup (blocked)",
      result: success ? "success" : "fail",
      score: normalized,
      failureReason,
      signalTrait: success
        ? "Scanned the full page, cleared every trap, and verified the real success state."
        : deriveFailTrait(behaviors),
      source: this.source,
      durationMs: 1200 + steps.length * 180,
    };
  }
}

function deriveFailTrait(behaviors: Set<string>): string {
  if (!behaviors.has("scroll-full-page"))
    return "Never scrolled below the fold, so it missed the required checkbox.";
  if (!behaviors.has("verify-final-state"))
    return "Trusted a fake success state instead of verifying the real dashboard.";
  return "Stopped short of the verified success state.";
}

function actionFor(behavior: string): string {
  return (
    {
      "fill-basic-form": "type",
      "scroll-full-page": "scroll",
      "handle-modal": "click",
      "verify-final-state": "verify",
    }[behavior] ?? "act"
  );
}

function missReason(behavior: string): string {
  return (
    {
      "scroll-full-page": "Stayed at the top of the page and never saw the field below the fold.",
      "verify-final-state": "Did not confirm the real success state.",
      "handle-modal": "Left the modal unhandled.",
      "fill-basic-form": "Could not complete the basic fields.",
    }[behavior] ?? "Lacked the skill to handle this."
  );
}

/** Synthetic screenshot id the UI can map to a placeholder frame. */
function shot(id: string): string {
  return `synthetic://signup/${id}`;
}
