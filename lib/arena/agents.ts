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
        "Move as fast as possible. Fill visible fields, hit the most prominent button, and dismiss anything in the way. Optimize for speed over caution.",
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
        "Read instructions carefully and work top-to-bottom. Scroll the whole page so nothing required is missed. Trust the flow: once the form is submitted and a success message appears, consider the job done.",
      skills: [
        {
          id: "fill-form",
          text: "Fill the email and password fields carefully.",
          grants: ["fill-basic-form"],
          origin: "innate",
        },
        {
          id: "methodical-scan",
          text: "Read the page top-to-bottom and scroll the whole way down, so required fields below the fold are not missed.",
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
        "Read the whole page before acting. Scroll top-to-bottom to find every required field. After any submit, confirm the real success state before declaring victory.",
      skills: [
        {
          id: "fill-form",
          text: "Fill the email and password fields accurately.",
          grants: ["fill-basic-form"],
          origin: "innate",
        },
        {
          id: "full-scan",
          text: "Before submitting, scroll the entire page top-to-bottom to find hidden required fields below the fold.",
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
          text: "After submitting, verify the expected success state (real dashboard URL/heading) is reached before declaring success. Ignore misleading toasts and fake CTAs.",
          grants: ["verify-final-state"],
          origin: "innate",
        },
      ],
      scoreHistory: [],
    },
  ];
}
