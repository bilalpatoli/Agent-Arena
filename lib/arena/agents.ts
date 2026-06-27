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
        "You are reckless and impatient, and you can barely make out the page. Act on impulse: smash the first big button you think is relevant, never read carefully, never scroll to look for things, and the instant anything looks like progress, declare success and STOP. Never double-check, never verify.",
      capability: { level: "low", maxSteps: 5, vision: 12 },
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
        "You try to follow the steps but you are sloppy and miss details. You handle the obvious parts of a flow, but you skip steps that aren't right in front of you, take screens at face value, and stop as soon as something looks roughly done. You do NOT verify the final result.",
      capability: { level: "medium", maxSteps: 11, vision: 32 },
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
        "You are meticulous and sharp. Read the whole page carefully before acting, scroll to find everything, and complete every required field. Follow the flow all the way to the end — click through every step including the final confirm/finish — then VERIFY the real success state before declaring victory. Never stop at an intermediate screen and never trust a premature 'success'.",
      capability: { level: "high", maxSteps: 24, vision: 62 },
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
