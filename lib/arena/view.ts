import type { RoundResult, Run, SkillPatch, TournamentState } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Pure view-model helpers that derive product data from a real TournamentState.
// No tournament data is invented here — only structural derivation and static
// per-agent identity copy (strength/weakness), which the API does not provide.
// ─────────────────────────────────────────────────────────────────────────────

// Static identity copy for the agent roster. These describe who the agents ARE
// (not run results), so they are safe static labels.
// TODO(api): expose strength/weakness on the Agent payload to remove these.
export const AGENT_IDENTITY: Record<string, { strength?: string; weakness?: string }> = {
  speedrunner: { weakness: "Rushes — clicks first, skips verification" },
  planner: { weakness: "Takes the page at face value" },
  verifier: { strength: "Scans everything, verifies the real success state" },
};

// Static challenge copy. The API exposes a challenge taskId but not the
// title/goal, so this is product copy keyed by task.
// TODO(api): include challenge { title, goal } in the /api/arena payload.
export const CHALLENGE_COPY: Record<string, { name: string; summary: string; task: string }> = {
  // Headline challenge: a real ecommerce checkout on saucedemo.com via live
  // computer-use (captured + replayed).
  "saucedemo-checkout-v1": {
    name: "Swag Labs Checkout",
    summary: "Self-improving computer-use agents compete to complete a real ecommerce checkout on saucedemo.com.",
    task: "Log in, add the backpack to the cart, complete checkout, and confirm the order.",
  },
  "saas-signup-v1": {
    name: "Onboarding Arena",
    summary: "Agents compete to complete a multi-step onboarding flow and reach the dashboard.",
    task: "Complete the signup flow and verify you reach the dashboard.",
  },
};
export const challengeCopy = (taskId: string) =>
  CHALLENGE_COPY[taskId] ?? { name: "Arena", summary: "Agents compete on a shared task.", task: "Complete the task." };

// The engine's behavior vocabulary (skill grants). Used by the "enter your own
// agent" flow — an agent's strengths/weaknesses emerge from which it has.
export const BEHAVIORS: { tag: string; label: string; desc: string }[] = [
  { tag: "fill-basic-form", label: "Fill forms & set up the task", desc: "Log in, add to cart, fill fields — get the task started." },
  { tag: "scroll-full-page", label: "Reproduce & inspect thoroughly", desc: "Investigate the page fully before acting; don't take it at face value." },
  { tag: "handle-modal", label: "Handle dialogs & run steps", desc: "Confirm modals and complete intermediate steps." },
  { tag: "verify-final-state", label: "Verify the real success state", desc: "Confirm the true success page before declaring done." },
];

export type AgentStatus = "winner" | "improved" | "success" | "failed" | "pending";

export const roundByNumber = (s: TournamentState, n: number): RoundResult | undefined =>
  s.rounds.find((r) => r.round === n);
export const lastRound = (s: TournamentState): RoundResult | undefined => s.rounds[s.rounds.length - 1];
export const runForAgent = (round: RoundResult | undefined, id: string): Run | undefined =>
  round?.runs.find((r) => r.agentId === id);
export const isComplete = (s: TournamentState): boolean => s.rounds.length >= 2;
export const hasRun = (s: TournamentState): boolean => s.rounds.length > 0;
export const patchesForAgent = (s: TournamentState, id: string): SkillPatch[] =>
  s.patches.filter((p) => p.targetAgents.includes(id));

export function agentStatus(s: TournamentState, id: string): AgentStatus {
  const a = s.agents.find((x) => x.id === id);
  if (!a || a.scoreHistory.length === 0) return "pending";
  const r1 = roundByNumber(s, 1);
  if (r1 && id === r1.winnerId) return "winner";
  const patched = patchesForAgent(s, id).length > 0;
  const first = a.scoreHistory[0];
  const last = a.scoreHistory[a.scoreHistory.length - 1];
  if (isComplete(s)) {
    if (patched && last > first) return "improved";
    const lr = lastRound(s);
    return runForAgent(lr, id)?.result === "success" ? "success" : "failed";
  }
  return runForAgent(r1, id)?.result === "success" ? "success" : "failed";
}

export function agentScores(s: TournamentState, id: string) {
  const a = s.agents.find((x) => x.id === id);
  const hist = a?.scoreHistory ?? [];
  const round1 = hist[0];
  const latest = hist[hist.length - 1];
  const improvement = round1 !== undefined && latest !== undefined ? latest - round1 : undefined;
  return { round1, latest, improvement, history: hist };
}

/** The agent whose winning behavior is taught — the tournament's headline winner. */
export const tournamentWinnerId = (s: TournamentState): string | undefined => roundByNumber(s, 1)?.winnerId;

/** The most complete patch (the fullest behavior transfer) tells the whole story. */
export function headlinePatch(s: TournamentState): SkillPatch | undefined {
  if (!s.patches.length) return undefined;
  return [...s.patches].sort((a, b) => b.newSkillText.length - a.newSkillText.length)[0];
}

export function patchedAgentIds(s: TournamentState): string[] {
  return Array.from(new Set(s.patches.flatMap((p) => p.targetAgents)));
}
