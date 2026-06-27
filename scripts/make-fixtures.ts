// Generate PLACEHOLDER saucedemo trajectories so the replay pipeline + UI can be
// validated without burning Gemini quota. These are clearly marked
// (capturedAt: "placeholder") and gitignored — real captures from
// scripts/capture.ts overwrite them in Phase 2.
//
//   npx tsx scripts/make-fixtures.ts

import { SAUCEDEMO_CHALLENGE } from "../lib/arena/challenge";
import { saveTrajectory } from "../lib/arena/trajectory";
import type { Run, TraceStep } from "../lib/arena/types";

const C = SAUCEDEMO_CHALLENGE.id;
let idx = 0;
const step = (action: string, description: string, ok: boolean, target?: string): TraceStep => ({
  index: idx++,
  action,
  description,
  target,
  screenshot: `saucedemo://${action}-${idx}`, // placeholder frame tag (UI shows a label, not an image)
  ok,
});

function resetIdx() {
  idx = 0;
}

const base = (over: Partial<Run>): Run => ({
  agentId: "",
  taskId: C,
  round: 1,
  steps: [],
  finalState: "incomplete",
  result: "fail",
  score: 0,
  source: "gemini",
  durationMs: 9000,
  ...over,
});

// ── Round 1 ──────────────────────────────────────────────────────────────────
resetIdx();
const speedrunnerR1 = base({
  agentId: "speedrunner",
  result: "fail",
  score: 28,
  finalState: "checkout (blocked)",
  failureReason: "Skipped the postal code and never confirmed the order — declared success at the overview.",
  signalTrait: "Rushed: left a required field empty and didn't verify the confirmation.",
  durationMs: 7200,
  steps: [
    step("navigate", "Opened saucedemo.com.", true),
    step("type", "Typed username standard_user.", true),
    step("type", "Typed password.", true),
    step("click", "Clicked Login → products page.", true),
    step("click", "Added Sauce Labs Backpack to cart.", true),
    step("click", "Opened cart and clicked Checkout.", true),
    step("type", "Typed first name.", true),
    step("type", "Typed last name.", true),
    step("click", "Clicked Continue WITHOUT a postal code — blocked.", false, "checkout-fields"),
    step("click", "Treated the overview as done.", false, "premature-success"),
    step("halt", "Stopped before placing/confirming the order.", false, "verify-confirmation"),
  ],
});

resetIdx();
const plannerR1 = base({
  agentId: "planner",
  result: "fail",
  score: 62,
  finalState: "overview (not confirmed)",
  failureReason: "Completed the form but stopped at the overview and never confirmed 'Thank you for your order'.",
  signalTrait: "Thorough on the form, but trusted the overview instead of verifying the real confirmation.",
  durationMs: 10800,
  steps: [
    step("navigate", "Opened saucedemo.com.", true),
    step("type", "Typed username standard_user.", true),
    step("type", "Typed password.", true),
    step("click", "Clicked Login → products page.", true),
    step("click", "Added Sauce Labs Backpack to cart.", true),
    step("click", "Opened cart and clicked Checkout.", true),
    step("type", "Typed first name.", true),
    step("type", "Typed last name.", true),
    step("type", "Typed postal code.", true),
    step("click", "Clicked Continue → overview.", true),
    step("click", "Declared success at the overview.", false, "premature-success"),
    step("halt", "Never clicked Finish / confirmed the order.", false, "verify-confirmation"),
  ],
});

resetIdx();
const verifierR1 = base({
  agentId: "verifier",
  result: "success",
  score: 100,
  finalState: "order confirmed",
  signalTrait: "Completed every field, clicked Finish, and verified 'Thank you for your order!'.",
  durationMs: 12600,
  steps: [
    step("navigate", "Opened saucedemo.com.", true),
    step("type", "Typed username standard_user.", true),
    step("type", "Typed password.", true),
    step("click", "Clicked Login → products page.", true),
    step("click", "Added Sauce Labs Backpack to cart.", true),
    step("click", "Opened cart and clicked Checkout.", true),
    step("type", "Typed first name, last name, AND postal code.", true),
    step("click", "Clicked Continue → overview.", true),
    step("click", "Clicked Finish to place the order.", true),
    step("verify", "Confirmed 'Thank you for your order!' — order complete.", true, "verify-confirmation"),
  ],
});

// ── Round 2 (after patch — losers now complete + verify) ─────────────────────
const winRun = (agentId: string, durationMs: number): Run => {
  resetIdx();
  return base({
    agentId,
    round: 2,
    result: "success",
    score: 100,
    finalState: "order confirmed",
    signalTrait: "Completed every field, clicked Finish, and verified 'Thank you for your order!'.",
    durationMs,
    steps: [
      step("navigate", "Opened saucedemo.com.", true),
      step("type", "Logged in as standard_user.", true),
      step("click", "Added Sauce Labs Backpack to cart.", true),
      step("click", "Opened cart and clicked Checkout.", true),
      step("type", "Filled first name, last name, AND postal code (now thorough).", true),
      step("click", "Clicked Continue → overview.", true),
      step("click", "Clicked Finish to actually place the order.", true),
      step("verify", "Verified 'Thank you for your order!' before declaring success.", true, "verify-confirmation"),
    ],
  });
};

const trajectories = [
  { agentId: "speedrunner", round: 1, run: speedrunnerR1 },
  { agentId: "planner", round: 1, run: plannerR1 },
  { agentId: "verifier", round: 1, run: verifierR1 },
  { agentId: "verifier", round: 2, run: { ...verifierR1, round: 2 } },
  { agentId: "speedrunner", round: 2, run: winRun("speedrunner", 9600) },
  { agentId: "planner", round: 2, run: winRun("planner", 10200) },
];

for (const t of trajectories) {
  const file = saveTrajectory({
    capturedAt: "placeholder",
    challengeId: C,
    agentId: t.agentId,
    round: t.round,
    run: t.run,
  });
  console.log(`wrote ${file}`);
}
console.log("\nPlaceholder trajectories ready. Validate with ARENA_CHALLENGE=saucedemo.");
