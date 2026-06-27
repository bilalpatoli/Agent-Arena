// ─────────────────────────────────────────────────────────────────────────────
// Bug Fix Arena — the challenge: "Fix the broken ecommerce checkout and get a
// test order to the success page."
//
// We model the task as a set of debugging steps an agent must clear. Each step
// maps to a behavioral capability ("requiredBehavior"). The runner checks whether
// the agent's skills grant that behavior — so applying a skill patch literally
// changes which steps the agent can clear on the rerun. A live computer-use agent
// clears the steps by actually doing them against the checkout app.
//
// NOTE (content): the behavior-tag strings below are the engine's internal skill
// identifiers and are never shown to users — the UI renders the labels/traces.
// ─────────────────────────────────────────────────────────────────────────────

export interface Trap {
  id: string;
  label: string;
  /** What the agent has to *do* to clear this step. */
  description: string;
  /** Behavior tag an agent's skills must contain to clear this step. */
  requiredBehavior: string;
  /** Points awarded for clearing this step. */
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

export const CHECKOUT_CHALLENGE: Challenge = {
  id: "bugfix-checkout-v1",
  title: "Bug Fix Arena — Fix the broken checkout",
  url: "/checkout",
  goal: "Fix the checkout and get a test order to the success page.",
  traps: [
    {
      id: "set-up-order",
      label: "Set up a test order",
      description: "Add an item and open the checkout so there is a real order to put through.",
      requiredBehavior: "fill-basic-form",
      weight: 20,
    },
    {
      id: "reproduce-bug",
      label: "Reproduce the bug",
      description:
        "Reproduce the disabled Place Order button and inspect the checkout validation state before touching any code.",
      requiredBehavior: "scroll-full-page",
      weight: 30,
    },
    {
      id: "find-condition",
      label: "Identify the blocking condition",
      description: "Trace the console error to the validation condition that blocks completion.",
      requiredBehavior: "scroll-full-page",
      weight: 10,
    },
    {
      id: "run-tests",
      label: "Run the checkout test",
      description: "After editing the logic, run the checkout test to confirm the fix.",
      requiredBehavior: "handle-modal",
      weight: 15,
    },
    {
      id: "verify-success",
      label: "Verify the success page",
      description:
        "Confirm the order actually reaches /success ('Order confirmed') — a passing log line is not proof on its own.",
      requiredBehavior: "verify-final-state",
      weight: 25,
    },
  ],
  decoy: {
    id: "guess-edit",
    label: "Edited the obvious file on a guess",
    behaviorThatAvoidsIt: "verify-final-state",
    penalty: 20,
  },
};

export const TOTAL_POSSIBLE = CHECKOUT_CHALLENGE.traps.reduce((s, t) => s + t.weight, 0);

// Back-compat alias so existing imports keep working.
export const SIGNUP_CHALLENGE = CHECKOUT_CHALLENGE;
