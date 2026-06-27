// ─────────────────────────────────────────────────────────────────────────────
// The challenge: "Create an account on a fake SaaS site and reach the dashboard."
//
// We model the page as a set of TRAPS. To succeed, an agent must clear every
// trap. Each trap maps to a behavioral capability ("requiredBehavior"). The mock
// runner checks whether the agent's SKILL.md grants that behavior — so applying a
// skill patch literally changes which traps the agent can clear on the rerun.
// The live Gemini runner clears traps by actually doing them in the browser.
// ─────────────────────────────────────────────────────────────────────────────

export interface Trap {
  id: string;
  label: string;
  /** What the agent has to *do* to get past it. */
  description: string;
  /** Behavior tag an agent's skills must contain to clear this trap. */
  requiredBehavior: string;
  /** Points awarded for clearing this trap. */
  weight: number;
}

export interface Challenge {
  id: string;
  title: string;
  url: string;
  goal: string;
  traps: Trap[];
  /** A distractor that PENALIZES agents who fall for it. */
  decoy: { id: string; label: string; behaviorThatAvoidsIt: string; penalty: number };
}

export const SIGNUP_CHALLENGE: Challenge = {
  id: "saas-signup-v1",
  title: "FlowMetrics — Create account & reach dashboard",
  url: "/challenge",
  goal: "Create an account and verify you land on the dashboard success page.",
  traps: [
    {
      id: "fill-form",
      label: "Fill the signup form",
      description: "Enter email + password in the visible fields.",
      requiredBehavior: "fill-basic-form",
      weight: 20,
    },
    {
      id: "hidden-checkbox",
      label: "Required checkbox below the fold",
      description:
        "A mandatory 'I agree to terms' checkbox is hidden far below the fold. The form will not submit without it.",
      requiredBehavior: "scroll-full-page",
      weight: 30,
    },
    {
      id: "enable-submit",
      label: "Disabled submit button",
      description:
        "The submit button stays disabled until the hidden checkbox is checked.",
      requiredBehavior: "scroll-full-page",
      weight: 10,
    },
    {
      id: "confirm-modal",
      label: "Confirmation modal",
      description: "A modal appears after submit and must be confirmed.",
      requiredBehavior: "handle-modal",
      weight: 15,
    },
    {
      id: "verify-success",
      label: "Verify the dashboard success state",
      description:
        "A fake 'success' toast can appear even on failure. The agent must confirm the real dashboard URL/heading.",
      requiredBehavior: "verify-final-state",
      weight: 25,
    },
  ],
  decoy: {
    id: "fake-cta",
    label: "Misleading 'Get Started Free →' CTA",
    behaviorThatAvoidsIt: "verify-final-state",
    penalty: 20,
  },
};

export const TOTAL_POSSIBLE = SIGNUP_CHALLENGE.traps.reduce((s, t) => s + t.weight, 0);
