import type { Agent } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Bug Fix Arena roster — three engineering agents debugging the broken checkout.
// Behavior is a pure function of an agent's skills, so a skill patch genuinely
// changes the rerun outcome.
//
//   Planner   — methodical debugger, but guesses and edits the obvious file
//               before fully reproducing the bug, so it never finds the real
//               validation condition and the fix doesn't hold.
//   Explorer  — fast browser explorer; sets up the order and runs a test, but
//               skips reproducing the bug and declares success without checking
//               the /success page.
//   Verifier  — runs the full debugging loop: reproduce, inspect console &
//               validation state, fix the logic, run tests, verify /success.
// ─────────────────────────────────────────────────────────────────────────────

export function seedAgents(): Agent[] {
  return [
    {
      id: "planner",
      name: "Planner",
      tagline: "Methodical debugger.",
      strategy:
        "Read the failure, form a hypothesis, and edit the most likely file. Run the test and check the result — but tends to jump into code before fully reproducing the bug and inspecting the validation state.",
      skills: [
        {
          id: "set-up-order",
          text: "Add an item and open the checkout so there is a real test order to put through.",
          grants: ["fill-basic-form"],
          origin: "innate",
        },
        {
          id: "run-tests",
          text: "After editing, run the checkout test to check the change.",
          grants: ["handle-modal"],
          origin: "innate",
        },
        {
          id: "verify-success",
          text: "Confirm the order reaches the /success page ('Order confirmed') before declaring done. Don't trust a passing log line alone.",
          grants: ["verify-final-state"],
          origin: "innate",
        },
      ],
      scoreHistory: [],
    },
    {
      id: "explorer",
      name: "Explorer",
      tagline: "Fast browser explorer.",
      strategy:
        "Click through the app quickly to find clues and make progress. Sets up the order and runs a test, but moves fast — skips reproducing the bug and doesn't always verify the final outcome.",
      skills: [
        {
          id: "set-up-order",
          text: "Quickly add an item and open the checkout to start a test order.",
          grants: ["fill-basic-form"],
          origin: "innate",
        },
        {
          id: "run-tests",
          text: "Run a checkout test to keep moving.",
          grants: ["handle-modal"],
          origin: "innate",
        },
        {
          id: "chase-guess",
          text: "Follow the most obvious lead and edit the first file that looks related.",
          grants: [],
          origin: "innate",
        },
      ],
      scoreHistory: [],
    },
    {
      id: "verifier",
      name: "Verifier",
      tagline: "Full debugging loop.",
      strategy:
        "Reproduce the bug first, read the console, and inspect the validation state before editing. Fix the condition, run the tests, and verify the real success page before declaring the task done.",
      skills: [
        {
          id: "set-up-order",
          text: "Add an item and open the checkout to create a real test order.",
          grants: ["fill-basic-form"],
          origin: "innate",
        },
        {
          id: "reproduce-and-inspect",
          text: "Before editing code, reproduce the bug. Check the browser console and the checkout validation state, and identify the exact condition blocking completion.",
          grants: ["scroll-full-page"],
          origin: "innate",
        },
        {
          id: "run-tests",
          text: "After fixing the logic, run the checkout test to confirm the change.",
          grants: ["handle-modal"],
          origin: "innate",
        },
        {
          id: "verify-success",
          text: "Verify the final /success page ('Order confirmed') is actually reached before declaring done. Ignore a passing log line that isn't backed by the success page.",
          grants: ["verify-final-state"],
          origin: "innate",
        },
      ],
      scoreHistory: [],
    },
  ];
}
