// ─────────────────────────────────────────────────────────────────────────────
// Agent Arena — core domain types
// Owned by Role 2 (Agent / Evolution Engineer)
// ─────────────────────────────────────────────────────────────────────────────

export type AgentId = "speedrunner" | "verifier" | string;

/** A single capability the agent currently has. Skills drive behavior. */
export interface Skill {
  id: string;
  text: string;
  /** Behavior tags this skill grants. Mapped against challenge trap requirements. */
  grants: string[];
  /** Where this skill came from. "innate" = original; "patch" = learned from a winner. */
  origin: "innate" | "patch";
  /** If learned, which agent did we learn it from, and in which round. */
  learnedFrom?: AgentId;
  learnedRound?: number;
}

export interface Agent {
  id: AgentId;
  name: string;
  tagline: string;
  /** High-level behavioral strategy (from AGENTS.md). */
  strategy: string;
  /** The agent's living skill set (from SKILL.md). Mutated by patches. */
  skills: Skill[];
  scoreHistory: number[];
  /** Graded capability — how "smart" the agent is. Drives real handicaps:
   *  maxSteps (action budget) and vision (screenshot JPEG quality it perceives). */
  capability?: { level: "low" | "medium" | "high"; maxSteps: number; vision: number };
}

/** One concrete action an agent took against the challenge. */
export interface TraceStep {
  index: number;
  /** Machine action label, e.g. "scroll", "click", "type", "verify". */
  action: string;
  /** Human-readable description for the trace timeline. */
  description: string;
  /** The challenge state target this step interacted with. */
  target?: string;
  /** Screenshot reference (data url, remote url, or synthetic placeholder id). */
  screenshot?: string;
  ok: boolean;
}

export type RunResult = "success" | "fail";

export interface Run {
  agentId: AgentId;
  taskId: string;
  round: number;
  steps: TraceStep[];
  finalState: string;
  result: RunResult;
  score: number;
  failureReason?: string;
  /** The single behavior the judge credits for success/blames for failure. */
  signalTrait?: string;
  /** "mock" when deterministic, "gemini" when driven by live computer use. */
  source: "mock" | "gemini";
  durationMs: number;
}

export interface SkillPatch {
  id: string;
  round: number;
  sourceWinner: AgentId;
  targetAgents: AgentId[];
  winningBehavior: string;
  failureCorrected: string;
  newSkillText: string;
  appliedAt: string;
}

export interface RoundResult {
  round: number;
  taskId: string;
  runs: Run[];
  winnerId: AgentId;
  patch?: SkillPatch;
}

export interface TournamentState {
  taskId: string;
  agents: Agent[];
  rounds: RoundResult[];
  patches: SkillPatch[];
}
