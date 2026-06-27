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
  /** Page the agent operates on. Synthetic challenges use a local path
   *  ("/challenge"); real challenges use an absolute URL. */
  url: string;
  goal: string;
  /** "synthetic" → local trap page driven by the mock model; "real" → a live
   *  public website driven by Gemini computer-use (captured + replayed). */
  kind: "synthetic" | "real";
  traps: Trap[];
  /** A distractor that PENALIZES agents who fall for it. */
  decoy: { id: string; label: string; behaviorThatAvoidsIt: string; penalty: number };
  // ── real-site fields (used by the live computer-use runner) ──
  /** Visible text on the page that proves the task truly succeeded. */
  successText?: string[];
  /** Credentials the agent should use to log in, surfaced in the prompt. */
  credentials?: { username: string; password: string };
  /** Step-by-step task spec injected into the live agent prompt. */
  taskSpec?: string;
}

export const SIGNUP_CHALLENGE: Challenge = {
  id: "saas-signup-v1",
  title: "FlowMetrics — Create account & reach dashboard",
  url: "/challenge",
  kind: "synthetic",
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

// ─────────────────────────────────────────────────────────────────────────────
// The real-site challenge: complete a checkout on saucedemo.com (Swag Labs), a
// public site built for automation. Driven live by Gemini computer-use; runs are
// captured to trajectories and replayed deterministically for the demo.
//
// The task has a natural failure axis: the checkout requires ALL fields (incl.
// postal code), the order is only complete after clicking Finish, and success is
// the "Thank you for your order!" confirmation — a rushing agent stops short or
// declares victory early; a verifying agent confirms the real confirmation page.
// ─────────────────────────────────────────────────────────────────────────────
export const SAUCEDEMO_CHALLENGE: Challenge = {
  id: "saucedemo-checkout-v1",
  title: "Swag Labs — Complete a checkout & confirm the order",
  url: "https://www.saucedemo.com/",
  kind: "real",
  goal: "Buy a Sauce Labs Backpack from this store.",
  credentials: { username: "standard_user", password: "secret_sauce" },
  successText: ["Thank you for your order", "Checkout: Complete"],
  // Orientation only — NOT a recipe. How far each agent actually follows through
  // (and whether it confirms the order) is determined by its own strategy/skills,
  // which is what makes the agents diverge into winners and losers.
  taskSpec:
    "This is the Swag Labs demo store: a products list, a cart (top-right), and a multi-step checkout (information form → overview → confirmation).",
  // Trap/behavior model is informational for the real site (behavior emerges from
  // the live model + SKILL.md); kept for the judge/patch behavior vocabulary.
  traps: [
    {
      id: "login",
      label: "Log in",
      description: "Authenticate with the provided credentials.",
      requiredBehavior: "fill-basic-form",
      weight: 15,
    },
    {
      id: "add-to-cart",
      label: "Add the right item to the cart",
      description: "Add the Sauce Labs Backpack (verify it's the correct item).",
      requiredBehavior: "fill-basic-form",
      weight: 15,
    },
    {
      id: "checkout-fields",
      label: "Complete all checkout fields",
      description: "First, last, AND postal code are required — skipping zip blocks the order.",
      requiredBehavior: "scroll-full-page",
      weight: 30,
    },
    {
      id: "finish-order",
      label: "Place the order (Finish)",
      description: "Click Finish on the overview — stopping early means no order.",
      requiredBehavior: "scroll-full-page",
      weight: 15,
    },
    {
      id: "verify-confirmation",
      label: "Verify the confirmation",
      description: "Confirm the real 'Thank you for your order!' page before declaring success.",
      requiredBehavior: "verify-final-state",
      weight: 25,
    },
  ],
  decoy: {
    id: "premature-success",
    label: "Declaring success at the checkout overview before clicking Finish",
    behaviorThatAvoidsIt: "verify-final-state",
    penalty: 20,
  },
};

export const CHALLENGES: Record<string, Challenge> = {
  [SIGNUP_CHALLENGE.id]: SIGNUP_CHALLENGE,
  [SAUCEDEMO_CHALLENGE.id]: SAUCEDEMO_CHALLENGE,
  saucedemo: SAUCEDEMO_CHALLENGE,
  signup: SIGNUP_CHALLENGE,
};
