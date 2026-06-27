// Run the full evolution loop in the terminal:  npm run loop
// Proves the self-improvement loop independently of the UI.

import { SIGNUP_CHALLENGE } from "../lib/arena/challenge";
import { evolve, makeTournament, runRound, HybridRunner } from "../lib/arena/orchestrator";
import { agentBehaviors } from "../lib/arena/runner";
import type { Run } from "../lib/arena/types";

const C = {
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  win: (s: string) => `\x1b[32m${s}\x1b[0m`,
  lose: (s: string) => `\x1b[31m${s}\x1b[0m`,
  accent: (s: string) => `\x1b[35m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
};

function printRun(r: Run) {
  const tag = r.result === "success" ? C.win("✓ SUCCESS") : C.lose("✗ FAIL");
  console.log(`  ${C.bold(r.agentId.padEnd(12))} ${String(r.score).padStart(3)}/100  ${tag}`);
  if (r.failureReason) console.log(C.dim(`    └ ${r.failureReason}`));
  else console.log(C.dim(`    └ ${r.signalTrait}`));
}

async function main() {
  const state = makeTournament();
  const runner = new HybridRunner();
  console.log(C.accent(`\n🏟  AGENT ARENA — ${SIGNUP_CHALLENGE.title}\n`));

  console.log(C.bold("── ROUND 1 ──────────────────────────────────"));
  const r1 = await runRound(state, runner);
  r1.runs.forEach(printRun);
  console.log(`  ${C.accent("WINNER")} → ${C.bold(r1.winnerId)}\n`);

  console.log(C.bold("── EVOLUTION ────────────────────────────────"));
  const patches = evolve(state);
  for (const p of patches) {
    console.log(`  ${C.accent("SKILL PATCH")} ${p.sourceWinner} → ${p.targetAgents.join(", ")}`);
    console.log(C.dim(`    corrected: ${p.failureCorrected}`));
    console.log(`    ${C.win("+ new skill:")} ${p.newSkillText}`);
  }
  console.log();
  for (const a of state.agents) {
    console.log(C.dim(`  ${a.id} now knows: [${[...agentBehaviors(a)].join(", ")}]`));
  }
  console.log();

  console.log(C.bold("── ROUND 2 (REMATCH) ────────────────────────"));
  const r2 = await runRound(state, runner);
  r2.runs.forEach(printRun);
  console.log(`  ${C.accent("WINNER")} → ${C.bold(r2.winnerId)}\n`);

  console.log(C.bold("── POPULATION IMPROVEMENT ───────────────────"));
  for (const a of state.agents) {
    const [a1, a2] = a.scoreHistory;
    const delta = a2 - a1;
    const arrow = delta > 0 ? C.win(`▲ +${delta}`) : delta < 0 ? C.lose(`▼ ${delta}`) : "•";
    console.log(`  ${a.name.padEnd(12)} ${a1} → ${a2}  ${arrow}`);
  }
  console.log();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
