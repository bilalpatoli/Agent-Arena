import type { Agent, Run, Skill, SkillPatch } from "./types";
import type { Challenge } from "./challenge";
import { agentBehaviors } from "./runner";

// ─────────────────────────────────────────────────────────────────────────────
// The evolution step. Compare the winner's behavior against a loser's, find the
// exact capability the loser was missing on the traps it failed, and synthesize
// a skill patch that grants it. Applying the patch mutates the loser's SKILL.md
// so its very next run behaves differently. This is the "wow" moment.
// ─────────────────────────────────────────────────────────────────────────────

export function diffMissingBehaviors(
  winner: Agent,
  loser: Agent,
  loserRun: Run,
  challenge: Challenge,
): string[] {
  const winnerHas = agentBehaviors(winner);
  const loserHas = agentBehaviors(loser);

  // Behaviors the winner has that the loser lacks...
  const missing = [...winnerHas].filter((b) => !loserHas.has(b));

  // ...narrowed to ones the loser actually failed a trap on (or the decoy).
  const failedBehaviors = new Set<string>();
  for (const step of loserRun.steps) {
    if (!step.ok && step.target) {
      const trap = challenge.traps.find((t) => t.id === step.target);
      if (trap) failedBehaviors.add(trap.requiredBehavior);
      if (step.target === challenge.decoy.id)
        failedBehaviors.add(challenge.decoy.behaviorThatAvoidsIt);
    }
  }
  const relevant = missing.filter((b) => failedBehaviors.has(b));
  return relevant.length ? relevant : missing;
}

export function buildPatch(
  winner: Agent,
  loser: Agent,
  loserRun: Run,
  challenge: Challenge,
  round: number,
  now: string,
): SkillPatch | null {
  const behaviors = diffMissingBehaviors(winner, loser, loserRun, challenge);
  if (behaviors.length === 0) return null;

  // Pull the winner's own skill text for those behaviors — we literally teach
  // the loser what the winner knew.
  const taughtSkills = winner.skills.filter((s) => s.grants.some((g) => behaviors.includes(g)));
  const newSkillText = taughtSkills.map((s) => s.text).join(" ");

  return {
    id: `patch-r${round}-${loser.id}`,
    round,
    sourceWinner: winner.id,
    targetAgents: [loser.id],
    winningBehavior: describeBehaviors(behaviors),
    failureCorrected: loserRun.failureReason ?? loserRun.signalTrait ?? "Failed the task.",
    newSkillText,
    appliedAt: now,
  };
}

export function applyPatch(loser: Agent, patch: SkillPatch, behaviors: string[]): Agent {
  const learned: Skill = {
    id: `learned-${patch.round}-${behaviors.join("-")}`,
    text: patch.newSkillText,
    grants: behaviors,
    origin: "patch",
    learnedFrom: patch.sourceWinner,
    learnedRound: patch.round,
  };
  // Don't duplicate behaviors the loser somehow already has.
  return { ...loser, skills: [...loser.skills, learned] };
}

function describeBehaviors(behaviors: string[]): string {
  const map: Record<string, string> = {
    "scroll-full-page": "Reproduces the bug and inspects the console & validation state before editing code",
    "verify-final-state": "Verifies the real /success page instead of trusting a passing log line",
    "handle-modal": "Runs the checkout test after editing",
    "fill-basic-form": "Sets up a real test order",
  };
  return behaviors.map((b) => map[b] ?? b).join("; ");
}
