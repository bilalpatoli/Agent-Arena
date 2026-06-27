import type { Agent } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Seed roster — three agents with deliberately different skill sets so the
// tournament produces a clear winner, two distinct failure modes, and a
// meaningful patch. Behavior is a pure function of these skills, so a patch
// genuinely changes the rerun outcome.
//
//   Planner   — methodical, low exploration. Fills the form, handles the modal,
//               and verifies the end state, but never scrolls below the fold, so
//               it misses the hidden required checkbox and fails.
//   Explorer  — fast, risky clicks. Fills the form and dismisses the modal, but
//               chases the fake CTA (no verification) and never scrolls — its run
//               ends low after the decoy penalty.
//   Verifier  — scans the whole page, scrolls top-to-bottom, and verifies the
//               real dashboard before declaring success. The winner.
// ─────────────────────────────────────────────────────────────────────────────

export function seedAgents(): Agent[] {
  return [
    {
      id: "planner",
      name: "Planner",
      tagline: "Methodical, low exploration.",
      strategy:
        "Read the instructions and work the form carefully and in order. Fill the visible fields, confirm dialogs, and check the result — but stay focused on what's already on screen rather than exploring below the fold.",
      skills: [
        {
          id: "fill-form",
          text: "Fill the email and password fields accurately.",
          grants: ["fill-basic-form"],
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
          text: "After submitting, verify the expected success state (real dashboard URL/heading) before declaring success. Ignore misleading toasts and fake CTAs.",
          grants: ["verify-final-state"],
          origin: "innate",
        },
      ],
      scoreHistory: [],
    },
    {
      id: "explorer",
      name: "Explorer",
      tagline: "Fast, risky clicks.",
      strategy:
        "Move fast and click around to make progress. Fill the visible fields and dismiss anything in the way, chasing the most prominent call-to-action — speed over caution.",
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
      id: "verifier",
      name: "Verifier",
      tagline: "Checks final success state.",
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
