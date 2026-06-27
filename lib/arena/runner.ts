import type { Agent, Run } from "./types";
import type { Challenge } from "./challenge";

/** A runner turns (agent, challenge, round) into a scored Run with a trace. */
export interface AgentRunner {
  readonly source: "mock" | "gemini";
  run(agent: Agent, challenge: Challenge, round: number): Promise<Run>;
}

/** Union of all behavior tags an agent's current skills grant. */
export function agentBehaviors(agent: Agent): Set<string> {
  const set = new Set<string>();
  for (const skill of agent.skills) for (const g of skill.grants) set.add(g);
  return set;
}
