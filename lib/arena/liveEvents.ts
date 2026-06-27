import type { Run, TraceStep } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Live Arena SSE event contract (shared by the /api/arena/custom backend and the
// Live Arena UI). Per-agent failures are structured (agent-error + a terminal
// agent-done with a real failed run); generic `error` is reserved for run-level
// fatal infrastructure failures.
// ─────────────────────────────────────────────────────────────────────────────

export type AgentStep = TraceStep;
export type AgentRun = Run;

export type RunSummary = {
  totalAgents: number;
  successCount: number;
  failureCount: number;
  interruptedCount: number;
};

export type LiveArenaEvent =
  | { type: "challenge"; challenge: unknown }
  | { type: "run-started"; runId: string; task: string; url: string }
  | { type: "status"; message: string }
  | { type: "agent-started"; agentId: string; agentName: string }
  | { type: "agent-step"; agentId: string; agentName: string; step: AgentStep }
  | { type: "agent-error"; agentId: string; agentName: string; message: string; errorCode?: string; fatal: false }
  | { type: "agent-done"; agentId: string; agentName: string; run: AgentRun }
  | { type: "patch"; sourceWinner: string; targets: string[]; behavior: string }
  | {
      type: "run-done";
      status: "completed" | "failed";
      winnerAgentId: string | null;
      winnerAgentName: string | null;
      summary: RunSummary;
      runs: AgentRun[];
    }
  | { type: "error"; message: string; fatal: true; errorCode?: string };

/** Coarse error code for a thrown agent message — UI hint only, not exhaustive. */
export function classifyError(message: string): string {
  const m = message.toLowerCase();
  if (/timeout|timed out/.test(m)) return "TIMEOUT";
  if (/rate limit|429|quota|resource exhausted/.test(m)) return "RATE_LIMIT";
  if (/api[\s_-]?key|unauthorized|\b401\b|permission/.test(m)) return "AUTH";
  if (/navigat|net::|dns|connection|econn/.test(m)) return "NAVIGATION";
  return "AGENT_ERROR";
}
