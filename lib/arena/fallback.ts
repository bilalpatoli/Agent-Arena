// ─────────────────────────────────────────────────────────────────────────────
// Mocked fallback demo payload (Role 1 — demo experience).
// Captured from a real 3-agent runFullDemo() so the shapes are identical to the
// live API. If POST /api/arena/demo ever fails (network, build, cold serverless),
// the dashboard renders this instead — the tournament story NEVER breaks.
// Regenerate after engine changes: see scripts/ or run runFullDemo() and paste.
// ─────────────────────────────────────────────────────────────────────────────
import type { RoundResult, SkillPatch, TournamentState } from "./types";

export type DemoResponse = {
  state: TournamentState;
  round1: RoundResult;
  patches: SkillPatch[];
  round2: RoundResult;
};

export const FALLBACK_DEMO: DemoResponse = {
  "state": {
    "taskId": "saas-signup-v1",
    "agents": [
      {
        "id": "planner",
        "name": "Planner",
        "tagline": "Methodical, low exploration.",
        "strategy": "Read the instructions and work the form carefully and in order. Fill the visible fields, confirm dialogs, and check the result — but stay focused on what's already on screen rather than exploring below the fold.",
        "skills": [
          {
            "id": "fill-form",
            "text": "Fill the email and password fields accurately.",
            "grants": [
              "fill-basic-form"
            ],
            "origin": "innate"
          },
          {
            "id": "handle-modal",
            "text": "Read and confirm confirmation modals correctly.",
            "grants": [
              "handle-modal"
            ],
            "origin": "innate"
          },
          {
            "id": "verify-state",
            "text": "After submitting, verify the expected success state (real dashboard URL/heading) before declaring success. Ignore misleading toasts and fake CTAs.",
            "grants": [
              "verify-final-state"
            ],
            "origin": "innate"
          },
          {
            "id": "learned-1-scroll-full-page",
            "text": "Before submitting, scroll the entire page top-to-bottom to find hidden required fields below the fold.",
            "grants": [
              "scroll-full-page"
            ],
            "origin": "patch",
            "learnedFrom": "verifier",
            "learnedRound": 1
          }
        ],
        "scoreHistory": [
          60,
          100
        ]
      },
      {
        "id": "explorer",
        "name": "Explorer",
        "tagline": "Fast, risky clicks.",
        "strategy": "Move fast and click around to make progress. Fill the visible fields and dismiss anything in the way, chasing the most prominent call-to-action — speed over caution.",
        "skills": [
          {
            "id": "fill-form",
            "text": "Quickly fill any visible email and password fields.",
            "grants": [
              "fill-basic-form"
            ],
            "origin": "innate"
          },
          {
            "id": "dismiss-modals",
            "text": "When a dialog appears, confirm it to keep moving.",
            "grants": [
              "handle-modal"
            ],
            "origin": "innate"
          },
          {
            "id": "click-prominent",
            "text": "Click the biggest, brightest call-to-action to make progress.",
            "grants": [],
            "origin": "innate"
          },
          {
            "id": "learned-1-scroll-full-page-verify-final-state",
            "text": "Before submitting, scroll the entire page top-to-bottom to find hidden required fields below the fold. After submitting, verify the expected success state (real dashboard URL/heading) is reached before declaring success. Ignore misleading toasts and fake CTAs.",
            "grants": [
              "scroll-full-page",
              "verify-final-state"
            ],
            "origin": "patch",
            "learnedFrom": "verifier",
            "learnedRound": 1
          }
        ],
        "scoreHistory": [
          15,
          100
        ]
      },
      {
        "id": "verifier",
        "name": "Verifier",
        "tagline": "Checks final success state.",
        "strategy": "Read the whole page before acting. Scroll top-to-bottom to find every required field. After any submit, confirm the real success state before declaring victory.",
        "skills": [
          {
            "id": "fill-form",
            "text": "Fill the email and password fields accurately.",
            "grants": [
              "fill-basic-form"
            ],
            "origin": "innate"
          },
          {
            "id": "full-scan",
            "text": "Before submitting, scroll the entire page top-to-bottom to find hidden required fields below the fold.",
            "grants": [
              "scroll-full-page"
            ],
            "origin": "innate"
          },
          {
            "id": "handle-modal",
            "text": "Read and confirm confirmation modals correctly.",
            "grants": [
              "handle-modal"
            ],
            "origin": "innate"
          },
          {
            "id": "verify-state",
            "text": "After submitting, verify the expected success state (real dashboard URL/heading) is reached before declaring success. Ignore misleading toasts and fake CTAs.",
            "grants": [
              "verify-final-state"
            ],
            "origin": "innate"
          }
        ],
        "scoreHistory": [
          100,
          100
        ]
      }
    ],
    "rounds": [
      {
        "round": 1,
        "taskId": "saas-signup-v1",
        "runs": [
          {
            "agentId": "planner",
            "taskId": "saas-signup-v1",
            "round": 1,
            "steps": [
              {
                "index": 0,
                "action": "navigate",
                "description": "Opened /challenge — \"FlowMetrics — Create account & reach dashboard\".",
                "target": "/challenge",
                "screenshot": "synthetic://signup/landing",
                "ok": true
              },
              {
                "index": 1,
                "action": "type",
                "description": "Fill the signup form — cleared. Enter email + password in the visible fields.",
                "target": "fill-form",
                "screenshot": "synthetic://signup/fill-form",
                "ok": true
              },
              {
                "index": 2,
                "action": "scroll",
                "description": "Required checkbox below the fold — MISSED. Stayed at the top of the page and never saw the field below the fold.",
                "target": "hidden-checkbox",
                "screenshot": "synthetic://signup/hidden-checkbox-fail",
                "ok": false
              },
              {
                "index": 3,
                "action": "scroll",
                "description": "Disabled submit button — MISSED. Stayed at the top of the page and never saw the field below the fold.",
                "target": "enable-submit",
                "screenshot": "synthetic://signup/enable-submit-fail",
                "ok": false
              },
              {
                "index": 4,
                "action": "click",
                "description": "Confirmation modal — cleared. A modal appears after submit and must be confirmed.",
                "target": "confirm-modal",
                "screenshot": "synthetic://signup/confirm-modal",
                "ok": true
              },
              {
                "index": 5,
                "action": "verify",
                "description": "Verify the dashboard success state — cleared. A fake 'success' toast can appear even on failure. The agent must confirm the real dashboard URL/heading.",
                "target": "verify-success",
                "screenshot": "synthetic://signup/verify-success",
                "ok": true
              },
              {
                "index": 6,
                "action": "halt",
                "description": "Run ended without reaching the dashboard. Submitted without the required checkbox — the form never went through (never scrolled below the fold).",
                "target": "stuck",
                "screenshot": "synthetic://signup/stuck",
                "ok": false
              }
            ],
            "finalState": "signup (blocked)",
            "result": "fail",
            "score": 60,
            "failureReason": "Submitted without the required checkbox — the form never went through (never scrolled below the fold).",
            "signalTrait": "Never scrolled below the fold, so it missed the required checkbox.",
            "source": "mock",
            "durationMs": 2460
          },
          {
            "agentId": "explorer",
            "taskId": "saas-signup-v1",
            "round": 1,
            "steps": [
              {
                "index": 0,
                "action": "navigate",
                "description": "Opened /challenge — \"FlowMetrics — Create account & reach dashboard\".",
                "target": "/challenge",
                "screenshot": "synthetic://signup/landing",
                "ok": true
              },
              {
                "index": 1,
                "action": "type",
                "description": "Fill the signup form — cleared. Enter email + password in the visible fields.",
                "target": "fill-form",
                "screenshot": "synthetic://signup/fill-form",
                "ok": true
              },
              {
                "index": 2,
                "action": "scroll",
                "description": "Required checkbox below the fold — MISSED. Stayed at the top of the page and never saw the field below the fold.",
                "target": "hidden-checkbox",
                "screenshot": "synthetic://signup/hidden-checkbox-fail",
                "ok": false
              },
              {
                "index": 3,
                "action": "scroll",
                "description": "Disabled submit button — MISSED. Stayed at the top of the page and never saw the field below the fold.",
                "target": "enable-submit",
                "screenshot": "synthetic://signup/enable-submit-fail",
                "ok": false
              },
              {
                "index": 4,
                "action": "click",
                "description": "Confirmation modal — cleared. A modal appears after submit and must be confirmed.",
                "target": "confirm-modal",
                "screenshot": "synthetic://signup/confirm-modal",
                "ok": true
              },
              {
                "index": 5,
                "action": "verify",
                "description": "Verify the dashboard success state — MISSED. Did not confirm the real success state.",
                "target": "verify-success",
                "screenshot": "synthetic://signup/verify-success-fail",
                "ok": false
              },
              {
                "index": 6,
                "action": "click",
                "description": "Fell for the decoy: clicked \"Misleading 'Get Started Free →' CTA\" and got sidetracked (−20).",
                "target": "fake-cta",
                "screenshot": "synthetic://signup/decoy",
                "ok": false
              },
              {
                "index": 7,
                "action": "halt",
                "description": "Run ended without reaching the dashboard. Submitted without the required checkbox — the form never went through (never scrolled below the fold).",
                "target": "stuck",
                "screenshot": "synthetic://signup/stuck",
                "ok": false
              }
            ],
            "finalState": "signup (blocked)",
            "result": "fail",
            "score": 15,
            "failureReason": "Submitted without the required checkbox — the form never went through (never scrolled below the fold).",
            "signalTrait": "Never scrolled below the fold, so it missed the required checkbox.",
            "source": "mock",
            "durationMs": 2640
          },
          {
            "agentId": "verifier",
            "taskId": "saas-signup-v1",
            "round": 1,
            "steps": [
              {
                "index": 0,
                "action": "navigate",
                "description": "Opened /challenge — \"FlowMetrics — Create account & reach dashboard\".",
                "target": "/challenge",
                "screenshot": "synthetic://signup/landing",
                "ok": true
              },
              {
                "index": 1,
                "action": "type",
                "description": "Fill the signup form — cleared. Enter email + password in the visible fields.",
                "target": "fill-form",
                "screenshot": "synthetic://signup/fill-form",
                "ok": true
              },
              {
                "index": 2,
                "action": "scroll",
                "description": "Required checkbox below the fold — cleared. A mandatory 'I agree to terms' checkbox is hidden far below the fold. The form will not submit without it.",
                "target": "hidden-checkbox",
                "screenshot": "synthetic://signup/hidden-checkbox",
                "ok": true
              },
              {
                "index": 3,
                "action": "scroll",
                "description": "Disabled submit button — cleared. The submit button stays disabled until the hidden checkbox is checked.",
                "target": "enable-submit",
                "screenshot": "synthetic://signup/enable-submit",
                "ok": true
              },
              {
                "index": 4,
                "action": "click",
                "description": "Confirmation modal — cleared. A modal appears after submit and must be confirmed.",
                "target": "confirm-modal",
                "screenshot": "synthetic://signup/confirm-modal",
                "ok": true
              },
              {
                "index": 5,
                "action": "verify",
                "description": "Verify the dashboard success state — cleared. A fake 'success' toast can appear even on failure. The agent must confirm the real dashboard URL/heading.",
                "target": "verify-success",
                "screenshot": "synthetic://signup/verify-success",
                "ok": true
              },
              {
                "index": 6,
                "action": "verify",
                "description": "Confirmed real dashboard heading 'Welcome to FlowMetrics'. Task complete.",
                "target": "dashboard",
                "screenshot": "synthetic://signup/dashboard",
                "ok": true
              }
            ],
            "finalState": "dashboard",
            "result": "success",
            "score": 100,
            "signalTrait": "Scanned the full page, cleared every trap, and verified the real success state.",
            "source": "mock",
            "durationMs": 2460
          }
        ],
        "winnerId": "verifier",
        "patch": {
          "id": "patch-r1-planner",
          "round": 1,
          "sourceWinner": "verifier",
          "targetAgents": [
            "planner"
          ],
          "winningBehavior": "Scrolls the full page to find hidden required fields below the fold",
          "failureCorrected": "Submitted without the required checkbox — the form never went through (never scrolled below the fold).",
          "newSkillText": "Before submitting, scroll the entire page top-to-bottom to find hidden required fields below the fold.",
          "appliedAt": "2026-06-27T20:51:30.194Z"
        }
      },
      {
        "round": 2,
        "taskId": "saas-signup-v1",
        "runs": [
          {
            "agentId": "planner",
            "taskId": "saas-signup-v1",
            "round": 2,
            "steps": [
              {
                "index": 0,
                "action": "navigate",
                "description": "Opened /challenge — \"FlowMetrics — Create account & reach dashboard\".",
                "target": "/challenge",
                "screenshot": "synthetic://signup/landing",
                "ok": true
              },
              {
                "index": 1,
                "action": "type",
                "description": "Fill the signup form — cleared. Enter email + password in the visible fields.",
                "target": "fill-form",
                "screenshot": "synthetic://signup/fill-form",
                "ok": true
              },
              {
                "index": 2,
                "action": "scroll",
                "description": "Required checkbox below the fold — cleared. A mandatory 'I agree to terms' checkbox is hidden far below the fold. The form will not submit without it.",
                "target": "hidden-checkbox",
                "screenshot": "synthetic://signup/hidden-checkbox",
                "ok": true
              },
              {
                "index": 3,
                "action": "scroll",
                "description": "Disabled submit button — cleared. The submit button stays disabled until the hidden checkbox is checked.",
                "target": "enable-submit",
                "screenshot": "synthetic://signup/enable-submit",
                "ok": true
              },
              {
                "index": 4,
                "action": "click",
                "description": "Confirmation modal — cleared. A modal appears after submit and must be confirmed.",
                "target": "confirm-modal",
                "screenshot": "synthetic://signup/confirm-modal",
                "ok": true
              },
              {
                "index": 5,
                "action": "verify",
                "description": "Verify the dashboard success state — cleared. A fake 'success' toast can appear even on failure. The agent must confirm the real dashboard URL/heading.",
                "target": "verify-success",
                "screenshot": "synthetic://signup/verify-success",
                "ok": true
              },
              {
                "index": 6,
                "action": "verify",
                "description": "Confirmed real dashboard heading 'Welcome to FlowMetrics'. Task complete.",
                "target": "dashboard",
                "screenshot": "synthetic://signup/dashboard",
                "ok": true
              }
            ],
            "finalState": "dashboard",
            "result": "success",
            "score": 100,
            "signalTrait": "Scanned the full page, cleared every trap, and verified the real success state.",
            "source": "mock",
            "durationMs": 2460
          },
          {
            "agentId": "explorer",
            "taskId": "saas-signup-v1",
            "round": 2,
            "steps": [
              {
                "index": 0,
                "action": "navigate",
                "description": "Opened /challenge — \"FlowMetrics — Create account & reach dashboard\".",
                "target": "/challenge",
                "screenshot": "synthetic://signup/landing",
                "ok": true
              },
              {
                "index": 1,
                "action": "type",
                "description": "Fill the signup form — cleared. Enter email + password in the visible fields.",
                "target": "fill-form",
                "screenshot": "synthetic://signup/fill-form",
                "ok": true
              },
              {
                "index": 2,
                "action": "scroll",
                "description": "Required checkbox below the fold — cleared. A mandatory 'I agree to terms' checkbox is hidden far below the fold. The form will not submit without it.",
                "target": "hidden-checkbox",
                "screenshot": "synthetic://signup/hidden-checkbox",
                "ok": true
              },
              {
                "index": 3,
                "action": "scroll",
                "description": "Disabled submit button — cleared. The submit button stays disabled until the hidden checkbox is checked.",
                "target": "enable-submit",
                "screenshot": "synthetic://signup/enable-submit",
                "ok": true
              },
              {
                "index": 4,
                "action": "click",
                "description": "Confirmation modal — cleared. A modal appears after submit and must be confirmed.",
                "target": "confirm-modal",
                "screenshot": "synthetic://signup/confirm-modal",
                "ok": true
              },
              {
                "index": 5,
                "action": "verify",
                "description": "Verify the dashboard success state — cleared. A fake 'success' toast can appear even on failure. The agent must confirm the real dashboard URL/heading.",
                "target": "verify-success",
                "screenshot": "synthetic://signup/verify-success",
                "ok": true
              },
              {
                "index": 6,
                "action": "verify",
                "description": "Confirmed real dashboard heading 'Welcome to FlowMetrics'. Task complete.",
                "target": "dashboard",
                "screenshot": "synthetic://signup/dashboard",
                "ok": true
              }
            ],
            "finalState": "dashboard",
            "result": "success",
            "score": 100,
            "signalTrait": "Scanned the full page, cleared every trap, and verified the real success state.",
            "source": "mock",
            "durationMs": 2460
          },
          {
            "agentId": "verifier",
            "taskId": "saas-signup-v1",
            "round": 2,
            "steps": [
              {
                "index": 0,
                "action": "navigate",
                "description": "Opened /challenge — \"FlowMetrics — Create account & reach dashboard\".",
                "target": "/challenge",
                "screenshot": "synthetic://signup/landing",
                "ok": true
              },
              {
                "index": 1,
                "action": "type",
                "description": "Fill the signup form — cleared. Enter email + password in the visible fields.",
                "target": "fill-form",
                "screenshot": "synthetic://signup/fill-form",
                "ok": true
              },
              {
                "index": 2,
                "action": "scroll",
                "description": "Required checkbox below the fold — cleared. A mandatory 'I agree to terms' checkbox is hidden far below the fold. The form will not submit without it.",
                "target": "hidden-checkbox",
                "screenshot": "synthetic://signup/hidden-checkbox",
                "ok": true
              },
              {
                "index": 3,
                "action": "scroll",
                "description": "Disabled submit button — cleared. The submit button stays disabled until the hidden checkbox is checked.",
                "target": "enable-submit",
                "screenshot": "synthetic://signup/enable-submit",
                "ok": true
              },
              {
                "index": 4,
                "action": "click",
                "description": "Confirmation modal — cleared. A modal appears after submit and must be confirmed.",
                "target": "confirm-modal",
                "screenshot": "synthetic://signup/confirm-modal",
                "ok": true
              },
              {
                "index": 5,
                "action": "verify",
                "description": "Verify the dashboard success state — cleared. A fake 'success' toast can appear even on failure. The agent must confirm the real dashboard URL/heading.",
                "target": "verify-success",
                "screenshot": "synthetic://signup/verify-success",
                "ok": true
              },
              {
                "index": 6,
                "action": "verify",
                "description": "Confirmed real dashboard heading 'Welcome to FlowMetrics'. Task complete.",
                "target": "dashboard",
                "screenshot": "synthetic://signup/dashboard",
                "ok": true
              }
            ],
            "finalState": "dashboard",
            "result": "success",
            "score": 100,
            "signalTrait": "Scanned the full page, cleared every trap, and verified the real success state.",
            "source": "mock",
            "durationMs": 2460
          }
        ],
        "winnerId": "planner"
      }
    ],
    "patches": [
      {
        "id": "patch-r1-planner",
        "round": 1,
        "sourceWinner": "verifier",
        "targetAgents": [
          "planner"
        ],
        "winningBehavior": "Scrolls the full page to find hidden required fields below the fold",
        "failureCorrected": "Submitted without the required checkbox — the form never went through (never scrolled below the fold).",
        "newSkillText": "Before submitting, scroll the entire page top-to-bottom to find hidden required fields below the fold.",
        "appliedAt": "2026-06-27T20:51:30.194Z"
      },
      {
        "id": "patch-r1-explorer",
        "round": 1,
        "sourceWinner": "verifier",
        "targetAgents": [
          "explorer"
        ],
        "winningBehavior": "Scrolls the full page to find hidden required fields below the fold; Verifies the real success state instead of trusting fake toasts/CTAs",
        "failureCorrected": "Submitted without the required checkbox — the form never went through (never scrolled below the fold).",
        "newSkillText": "Before submitting, scroll the entire page top-to-bottom to find hidden required fields below the fold. After submitting, verify the expected success state (real dashboard URL/heading) is reached before declaring success. Ignore misleading toasts and fake CTAs.",
        "appliedAt": "2026-06-27T20:51:30.194Z"
      }
    ]
  },
  "round1": {
    "round": 1,
    "taskId": "saas-signup-v1",
    "runs": [
      {
        "agentId": "planner",
        "taskId": "saas-signup-v1",
        "round": 1,
        "steps": [
          {
            "index": 0,
            "action": "navigate",
            "description": "Opened /challenge — \"FlowMetrics — Create account & reach dashboard\".",
            "target": "/challenge",
            "screenshot": "synthetic://signup/landing",
            "ok": true
          },
          {
            "index": 1,
            "action": "type",
            "description": "Fill the signup form — cleared. Enter email + password in the visible fields.",
            "target": "fill-form",
            "screenshot": "synthetic://signup/fill-form",
            "ok": true
          },
          {
            "index": 2,
            "action": "scroll",
            "description": "Required checkbox below the fold — MISSED. Stayed at the top of the page and never saw the field below the fold.",
            "target": "hidden-checkbox",
            "screenshot": "synthetic://signup/hidden-checkbox-fail",
            "ok": false
          },
          {
            "index": 3,
            "action": "scroll",
            "description": "Disabled submit button — MISSED. Stayed at the top of the page and never saw the field below the fold.",
            "target": "enable-submit",
            "screenshot": "synthetic://signup/enable-submit-fail",
            "ok": false
          },
          {
            "index": 4,
            "action": "click",
            "description": "Confirmation modal — cleared. A modal appears after submit and must be confirmed.",
            "target": "confirm-modal",
            "screenshot": "synthetic://signup/confirm-modal",
            "ok": true
          },
          {
            "index": 5,
            "action": "verify",
            "description": "Verify the dashboard success state — cleared. A fake 'success' toast can appear even on failure. The agent must confirm the real dashboard URL/heading.",
            "target": "verify-success",
            "screenshot": "synthetic://signup/verify-success",
            "ok": true
          },
          {
            "index": 6,
            "action": "halt",
            "description": "Run ended without reaching the dashboard. Submitted without the required checkbox — the form never went through (never scrolled below the fold).",
            "target": "stuck",
            "screenshot": "synthetic://signup/stuck",
            "ok": false
          }
        ],
        "finalState": "signup (blocked)",
        "result": "fail",
        "score": 60,
        "failureReason": "Submitted without the required checkbox — the form never went through (never scrolled below the fold).",
        "signalTrait": "Never scrolled below the fold, so it missed the required checkbox.",
        "source": "mock",
        "durationMs": 2460
      },
      {
        "agentId": "explorer",
        "taskId": "saas-signup-v1",
        "round": 1,
        "steps": [
          {
            "index": 0,
            "action": "navigate",
            "description": "Opened /challenge — \"FlowMetrics — Create account & reach dashboard\".",
            "target": "/challenge",
            "screenshot": "synthetic://signup/landing",
            "ok": true
          },
          {
            "index": 1,
            "action": "type",
            "description": "Fill the signup form — cleared. Enter email + password in the visible fields.",
            "target": "fill-form",
            "screenshot": "synthetic://signup/fill-form",
            "ok": true
          },
          {
            "index": 2,
            "action": "scroll",
            "description": "Required checkbox below the fold — MISSED. Stayed at the top of the page and never saw the field below the fold.",
            "target": "hidden-checkbox",
            "screenshot": "synthetic://signup/hidden-checkbox-fail",
            "ok": false
          },
          {
            "index": 3,
            "action": "scroll",
            "description": "Disabled submit button — MISSED. Stayed at the top of the page and never saw the field below the fold.",
            "target": "enable-submit",
            "screenshot": "synthetic://signup/enable-submit-fail",
            "ok": false
          },
          {
            "index": 4,
            "action": "click",
            "description": "Confirmation modal — cleared. A modal appears after submit and must be confirmed.",
            "target": "confirm-modal",
            "screenshot": "synthetic://signup/confirm-modal",
            "ok": true
          },
          {
            "index": 5,
            "action": "verify",
            "description": "Verify the dashboard success state — MISSED. Did not confirm the real success state.",
            "target": "verify-success",
            "screenshot": "synthetic://signup/verify-success-fail",
            "ok": false
          },
          {
            "index": 6,
            "action": "click",
            "description": "Fell for the decoy: clicked \"Misleading 'Get Started Free →' CTA\" and got sidetracked (−20).",
            "target": "fake-cta",
            "screenshot": "synthetic://signup/decoy",
            "ok": false
          },
          {
            "index": 7,
            "action": "halt",
            "description": "Run ended without reaching the dashboard. Submitted without the required checkbox — the form never went through (never scrolled below the fold).",
            "target": "stuck",
            "screenshot": "synthetic://signup/stuck",
            "ok": false
          }
        ],
        "finalState": "signup (blocked)",
        "result": "fail",
        "score": 15,
        "failureReason": "Submitted without the required checkbox — the form never went through (never scrolled below the fold).",
        "signalTrait": "Never scrolled below the fold, so it missed the required checkbox.",
        "source": "mock",
        "durationMs": 2640
      },
      {
        "agentId": "verifier",
        "taskId": "saas-signup-v1",
        "round": 1,
        "steps": [
          {
            "index": 0,
            "action": "navigate",
            "description": "Opened /challenge — \"FlowMetrics — Create account & reach dashboard\".",
            "target": "/challenge",
            "screenshot": "synthetic://signup/landing",
            "ok": true
          },
          {
            "index": 1,
            "action": "type",
            "description": "Fill the signup form — cleared. Enter email + password in the visible fields.",
            "target": "fill-form",
            "screenshot": "synthetic://signup/fill-form",
            "ok": true
          },
          {
            "index": 2,
            "action": "scroll",
            "description": "Required checkbox below the fold — cleared. A mandatory 'I agree to terms' checkbox is hidden far below the fold. The form will not submit without it.",
            "target": "hidden-checkbox",
            "screenshot": "synthetic://signup/hidden-checkbox",
            "ok": true
          },
          {
            "index": 3,
            "action": "scroll",
            "description": "Disabled submit button — cleared. The submit button stays disabled until the hidden checkbox is checked.",
            "target": "enable-submit",
            "screenshot": "synthetic://signup/enable-submit",
            "ok": true
          },
          {
            "index": 4,
            "action": "click",
            "description": "Confirmation modal — cleared. A modal appears after submit and must be confirmed.",
            "target": "confirm-modal",
            "screenshot": "synthetic://signup/confirm-modal",
            "ok": true
          },
          {
            "index": 5,
            "action": "verify",
            "description": "Verify the dashboard success state — cleared. A fake 'success' toast can appear even on failure. The agent must confirm the real dashboard URL/heading.",
            "target": "verify-success",
            "screenshot": "synthetic://signup/verify-success",
            "ok": true
          },
          {
            "index": 6,
            "action": "verify",
            "description": "Confirmed real dashboard heading 'Welcome to FlowMetrics'. Task complete.",
            "target": "dashboard",
            "screenshot": "synthetic://signup/dashboard",
            "ok": true
          }
        ],
        "finalState": "dashboard",
        "result": "success",
        "score": 100,
        "signalTrait": "Scanned the full page, cleared every trap, and verified the real success state.",
        "source": "mock",
        "durationMs": 2460
      }
    ],
    "winnerId": "verifier",
    "patch": {
      "id": "patch-r1-planner",
      "round": 1,
      "sourceWinner": "verifier",
      "targetAgents": [
        "planner"
      ],
      "winningBehavior": "Scrolls the full page to find hidden required fields below the fold",
      "failureCorrected": "Submitted without the required checkbox — the form never went through (never scrolled below the fold).",
      "newSkillText": "Before submitting, scroll the entire page top-to-bottom to find hidden required fields below the fold.",
      "appliedAt": "2026-06-27T20:51:30.194Z"
    }
  },
  "patches": [
    {
      "id": "patch-r1-planner",
      "round": 1,
      "sourceWinner": "verifier",
      "targetAgents": [
        "planner"
      ],
      "winningBehavior": "Scrolls the full page to find hidden required fields below the fold",
      "failureCorrected": "Submitted without the required checkbox — the form never went through (never scrolled below the fold).",
      "newSkillText": "Before submitting, scroll the entire page top-to-bottom to find hidden required fields below the fold.",
      "appliedAt": "2026-06-27T20:51:30.194Z"
    },
    {
      "id": "patch-r1-explorer",
      "round": 1,
      "sourceWinner": "verifier",
      "targetAgents": [
        "explorer"
      ],
      "winningBehavior": "Scrolls the full page to find hidden required fields below the fold; Verifies the real success state instead of trusting fake toasts/CTAs",
      "failureCorrected": "Submitted without the required checkbox — the form never went through (never scrolled below the fold).",
      "newSkillText": "Before submitting, scroll the entire page top-to-bottom to find hidden required fields below the fold. After submitting, verify the expected success state (real dashboard URL/heading) is reached before declaring success. Ignore misleading toasts and fake CTAs.",
      "appliedAt": "2026-06-27T20:51:30.194Z"
    }
  ],
  "round2": {
    "round": 2,
    "taskId": "saas-signup-v1",
    "runs": [
      {
        "agentId": "planner",
        "taskId": "saas-signup-v1",
        "round": 2,
        "steps": [
          {
            "index": 0,
            "action": "navigate",
            "description": "Opened /challenge — \"FlowMetrics — Create account & reach dashboard\".",
            "target": "/challenge",
            "screenshot": "synthetic://signup/landing",
            "ok": true
          },
          {
            "index": 1,
            "action": "type",
            "description": "Fill the signup form — cleared. Enter email + password in the visible fields.",
            "target": "fill-form",
            "screenshot": "synthetic://signup/fill-form",
            "ok": true
          },
          {
            "index": 2,
            "action": "scroll",
            "description": "Required checkbox below the fold — cleared. A mandatory 'I agree to terms' checkbox is hidden far below the fold. The form will not submit without it.",
            "target": "hidden-checkbox",
            "screenshot": "synthetic://signup/hidden-checkbox",
            "ok": true
          },
          {
            "index": 3,
            "action": "scroll",
            "description": "Disabled submit button — cleared. The submit button stays disabled until the hidden checkbox is checked.",
            "target": "enable-submit",
            "screenshot": "synthetic://signup/enable-submit",
            "ok": true
          },
          {
            "index": 4,
            "action": "click",
            "description": "Confirmation modal — cleared. A modal appears after submit and must be confirmed.",
            "target": "confirm-modal",
            "screenshot": "synthetic://signup/confirm-modal",
            "ok": true
          },
          {
            "index": 5,
            "action": "verify",
            "description": "Verify the dashboard success state — cleared. A fake 'success' toast can appear even on failure. The agent must confirm the real dashboard URL/heading.",
            "target": "verify-success",
            "screenshot": "synthetic://signup/verify-success",
            "ok": true
          },
          {
            "index": 6,
            "action": "verify",
            "description": "Confirmed real dashboard heading 'Welcome to FlowMetrics'. Task complete.",
            "target": "dashboard",
            "screenshot": "synthetic://signup/dashboard",
            "ok": true
          }
        ],
        "finalState": "dashboard",
        "result": "success",
        "score": 100,
        "signalTrait": "Scanned the full page, cleared every trap, and verified the real success state.",
        "source": "mock",
        "durationMs": 2460
      },
      {
        "agentId": "explorer",
        "taskId": "saas-signup-v1",
        "round": 2,
        "steps": [
          {
            "index": 0,
            "action": "navigate",
            "description": "Opened /challenge — \"FlowMetrics — Create account & reach dashboard\".",
            "target": "/challenge",
            "screenshot": "synthetic://signup/landing",
            "ok": true
          },
          {
            "index": 1,
            "action": "type",
            "description": "Fill the signup form — cleared. Enter email + password in the visible fields.",
            "target": "fill-form",
            "screenshot": "synthetic://signup/fill-form",
            "ok": true
          },
          {
            "index": 2,
            "action": "scroll",
            "description": "Required checkbox below the fold — cleared. A mandatory 'I agree to terms' checkbox is hidden far below the fold. The form will not submit without it.",
            "target": "hidden-checkbox",
            "screenshot": "synthetic://signup/hidden-checkbox",
            "ok": true
          },
          {
            "index": 3,
            "action": "scroll",
            "description": "Disabled submit button — cleared. The submit button stays disabled until the hidden checkbox is checked.",
            "target": "enable-submit",
            "screenshot": "synthetic://signup/enable-submit",
            "ok": true
          },
          {
            "index": 4,
            "action": "click",
            "description": "Confirmation modal — cleared. A modal appears after submit and must be confirmed.",
            "target": "confirm-modal",
            "screenshot": "synthetic://signup/confirm-modal",
            "ok": true
          },
          {
            "index": 5,
            "action": "verify",
            "description": "Verify the dashboard success state — cleared. A fake 'success' toast can appear even on failure. The agent must confirm the real dashboard URL/heading.",
            "target": "verify-success",
            "screenshot": "synthetic://signup/verify-success",
            "ok": true
          },
          {
            "index": 6,
            "action": "verify",
            "description": "Confirmed real dashboard heading 'Welcome to FlowMetrics'. Task complete.",
            "target": "dashboard",
            "screenshot": "synthetic://signup/dashboard",
            "ok": true
          }
        ],
        "finalState": "dashboard",
        "result": "success",
        "score": 100,
        "signalTrait": "Scanned the full page, cleared every trap, and verified the real success state.",
        "source": "mock",
        "durationMs": 2460
      },
      {
        "agentId": "verifier",
        "taskId": "saas-signup-v1",
        "round": 2,
        "steps": [
          {
            "index": 0,
            "action": "navigate",
            "description": "Opened /challenge — \"FlowMetrics — Create account & reach dashboard\".",
            "target": "/challenge",
            "screenshot": "synthetic://signup/landing",
            "ok": true
          },
          {
            "index": 1,
            "action": "type",
            "description": "Fill the signup form — cleared. Enter email + password in the visible fields.",
            "target": "fill-form",
            "screenshot": "synthetic://signup/fill-form",
            "ok": true
          },
          {
            "index": 2,
            "action": "scroll",
            "description": "Required checkbox below the fold — cleared. A mandatory 'I agree to terms' checkbox is hidden far below the fold. The form will not submit without it.",
            "target": "hidden-checkbox",
            "screenshot": "synthetic://signup/hidden-checkbox",
            "ok": true
          },
          {
            "index": 3,
            "action": "scroll",
            "description": "Disabled submit button — cleared. The submit button stays disabled until the hidden checkbox is checked.",
            "target": "enable-submit",
            "screenshot": "synthetic://signup/enable-submit",
            "ok": true
          },
          {
            "index": 4,
            "action": "click",
            "description": "Confirmation modal — cleared. A modal appears after submit and must be confirmed.",
            "target": "confirm-modal",
            "screenshot": "synthetic://signup/confirm-modal",
            "ok": true
          },
          {
            "index": 5,
            "action": "verify",
            "description": "Verify the dashboard success state — cleared. A fake 'success' toast can appear even on failure. The agent must confirm the real dashboard URL/heading.",
            "target": "verify-success",
            "screenshot": "synthetic://signup/verify-success",
            "ok": true
          },
          {
            "index": 6,
            "action": "verify",
            "description": "Confirmed real dashboard heading 'Welcome to FlowMetrics'. Task complete.",
            "target": "dashboard",
            "screenshot": "synthetic://signup/dashboard",
            "ok": true
          }
        ],
        "finalState": "dashboard",
        "result": "success",
        "score": 100,
        "signalTrait": "Scanned the full page, cleared every trap, and verified the real success state.",
        "source": "mock",
        "durationMs": 2460
      }
    ],
    "winnerId": "planner"
  }
};
