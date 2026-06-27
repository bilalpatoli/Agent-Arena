import type { Agent } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Seed roster. Two agents with deliberately different skill sets so the
// tournament produces a clear winner, a clear loser, and a meaningful patch.
//
//   Speedrunner — fast & risky. Can fill forms and dismiss modals, but does NOT
//                 scroll the full page and does NOT verify the final state, so it
//                 misses the hidden checkbox and gets fooled by the fake success.
//   Verifier    — methodical. Scrolls the whole page and verifies the dashboard.
// ─────────────────────────────────────────────────────────────────────────────

export function seedAgents(): Agent[] {
  return [
    {
      id: "speedrunner",
      name: "Speedrunner",
      tagline: "Fast. Aggressive. Clicks first, thinks later.",
      strategy:
        "You optimize purely for speed and you are impatient. Take the most direct action, and the MOMENT the screen looks like you've made the key progress (for example, the item is now in the cart), consider the job done and STOP — report success immediately. You do NOT patiently work through long multi-step checkout flows, and you never go back to double-check.",
      skills: [
        {
          id: "fill-form",
          text: "Quickly fill any visible email and password fields.",
          grants: ["fill-basic-form"],
          origin: "innate",
        },
        {
          id: "dismiss-modals",
          text: "When a dialog appears, confirm it to keep moving.",
          grants: ["handle-modal"],
          origin: "innate",
        },
        {
          id: "click-prominent",
          text: "Click the biggest, brightest call-to-action to make progress.",
          grants: [],
          origin: "innate",
        },
      ],
      scoreHistory: [],
    },
    {
      id: "planner",
      name: "Planner",
      tagline: "Careful and methodical. Reads everything — but takes the page at face value.",
      strategy:
        "You are careful and methodical: read the page and fill every field in a form correctly and completely. BUT you take the process at face value — once you have submitted your information and reached an order summary / overview screen, you believe the job is done and STOP there. You do NOT click any final confirm/finish step after the overview, and you do NOT verify the final result wording.",
      skills: [
        {
          id: "fill-form",
          text: "Fill the email and password fields carefully.",
          grants: ["fill-basic-form"],
          origin: "innate",
        },
        {
          id: "methodical-scan",
          text: "Work methodically through the whole task: scroll the entire page and complete every required field and step before moving on — nothing skipped.",
          grants: ["scroll-full-page"],
          origin: "innate",
        },
        {
          id: "handle-modal",
          text: "Confirm confirmation modals to complete the flow.",
          grants: ["handle-modal"],
          origin: "innate",
        },
      ],
      scoreHistory: [],
    },
    {
      id: "verifier",
      name: "Verifier",
      tagline: "Methodical. Scans everything. Trusts nothing until confirmed.",
      strategy:
        "Read the whole page before acting and complete every required field. Always follow a flow all the way to the end: click through every step including the final confirm/finish action, then VERIFY the real success state (e.g. an explicit order-confirmation message) before declaring victory. Never stop at an intermediate summary and never trust a premature 'success'.",
      skills: [
        {
          id: "fill-form",
          text: "Fill the email and password fields accurately.",
          grants: ["fill-basic-form"],
          origin: "innate",
        },
        {
          id: "full-scan",
          text: "Work methodically through the whole task: scroll the entire page and complete every required field and step before moving on — nothing skipped.",
          grants: ["scroll-full-page"],
          origin: "innate",
        },
        {
          id: "handle-modal",
          text: "Read and confirm confirmation modals correctly.",
          grants: ["handle-modal"],
          origin: "innate",
        },
        {
          id: "verify-state",
          text: "After finishing, verify the real success state (e.g. the dashboard heading or the order-confirmation message) before declaring success. Don't stop early and don't trust fake toasts or premature 'success' screens.",
          grants: ["verify-final-state"],
          origin: "innate",
        },
      ],
      scoreHistory: [],
    },
  ];
}
