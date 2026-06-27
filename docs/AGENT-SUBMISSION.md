# Agent Submission API (proposed)

The frontend has an **"Enter your own agent"** form (Agents page) that lets a user
add a competitor to the arena. The UI, validation, and states are built and wired;
it needs one small engine endpoint to go live.

## Endpoint

```
POST /api/arena/agents
Content-Type: application/json
```

### Request body

```jsonc
{
  "name": "Sentinel",                 // required, display name
  "strategy": "Reproduce, then act.", // optional, free text (shown on the card)
  "behaviors": [                      // required, ≥1 of the engine's skill grants
    "fill-basic-form",
    "scroll-full-page",
    "verify-final-state"
  ]
}
```

`behaviors` is a subset of the existing behavior vocabulary already used by
`seedAgents()` skill `grants`:

| tag                  | what it grants                                  |
| -------------------- | ----------------------------------------------- |
| `fill-basic-form`    | set up the task (log in, add to cart, fill)     |
| `scroll-full-page`   | reproduce & inspect thoroughly before acting    |
| `handle-modal`       | handle dialogs / intermediate steps             |
| `verify-final-state` | verify the real success state before finishing  |

The agent's weaknesses emerge from the tags it *lacks* — exactly how the seed
roster already works, so the new agent scores and patches with zero special-casing.

### Response

```jsonc
{ "state": TournamentState }   // roster now includes the new agent
```

Return the updated `TournamentState` (same shape as `GET /api/arena`) so the
frontend can re-render immediately.

## Suggested engine implementation (small)

1. Build an `Agent` from the body: one `Skill` per behavior with `origin: "innate"`
   and `grants: [tag]`; `scoreHistory: []`; `id` = slugified name.
2. Append it to the in-memory roster in `store` (a `customAgents` list merged into
   `seedAgents()` output), so it survives `reset` and is included by `runRound`.
3. Optional: `DELETE /api/arena/agents/:id` to remove a custom agent.

## Notes / open questions for the engine owner

- Should custom agents persist across `reset`, or only for the current session?
  (Frontend assumes they persist until removed.)
- For the **saucedemo (real)** challenge, runs come from captured trajectories, so
  a brand-new agent has no trajectory. Options: run custom agents only on the
  synthetic challenge, or fall back to the mock runner for agents without a
  trajectory. The frontend can show a "synthetic run" note either way.

Until this endpoint exists, the form posts to it and shows a clear
"endpoint pending" state — nothing fake is rendered.
