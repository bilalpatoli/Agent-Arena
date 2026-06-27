import type { Run } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Judge: scores already come from the runner; the judge decides the winner and
// can be swapped for a Gemini LLM judge later (same return contract).
//
// Ranking: higher score wins; success beats fail on ties; then fewer steps
// (efficiency); then shorter duration.
// ─────────────────────────────────────────────────────────────────────────────

export function pickWinner(runs: Run[]): Run {
  if (runs.length === 0) throw new Error("No runs to judge");
  return [...runs].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.result !== b.result) return a.result === "success" ? -1 : 1;
    if (a.steps.length !== b.steps.length) return a.steps.length - b.steps.length;
    return a.durationMs - b.durationMs;
  })[0];
}

export interface Scorecard {
  agentId: string;
  score: number;
  result: string;
  rank: number;
}

export function scoreboard(runs: Run[]): Scorecard[] {
  const sorted = [...runs].sort((a, b) => b.score - a.score);
  return sorted.map((r, i) => ({
    agentId: r.agentId,
    score: r.score,
    result: r.result,
    rank: i + 1,
  }));
}
