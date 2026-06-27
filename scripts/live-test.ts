// Live smoke test for the Gemini computer-use loop (one agent, one run).
//   npx tsx scripts/live-test.ts verifier
// Requires the dev server running (serves /challenge) and GEMINI_API_KEY set.

import { readFileSync } from "node:fs";
import { runComputerUse } from "../lib/arena/computerUse";
import { SIGNUP_CHALLENGE } from "../lib/arena/challenge";
import { seedAgents } from "../lib/arena/agents";

// minimal .env.local loader (tsx doesn't auto-load it)
try {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}

async function main() {
  const id = process.argv[2] ?? "verifier";
  const agent = seedAgents().find((a) => a.id === id)!;
  console.log(`\n▶ Live computer-use run: ${agent.name}\n`);

  const recordDir = `public/live-trace/${agent.id}`;
  const r = await runComputerUse(agent, SIGNUP_CHALLENGE, {
    baseUrl: process.env.ARENA_BASE_URL ?? "http://localhost:3001",
    recordDir,
  });
  console.log(`  proof saved → ${recordDir}/ (frames + video + trace.json)`);

  r.steps.forEach((s) =>
    console.log(`  [${s.ok ? "ok" : "x "}] ${s.action.padEnd(10)} ${s.description?.slice(0, 70)}`),
  );
  console.log(`\n  success=${r.success}  decoy=${r.clickedDecoy}  url=${r.finalUrl}`);
  console.log(`  steps=${r.steps.length}\n`);
}

main().catch((e) => {
  console.error("LIVE TEST ERROR:", e?.message ?? e);
  process.exit(1);
});
