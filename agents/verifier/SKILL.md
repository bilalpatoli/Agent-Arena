# SKILL.md — Verifier

Each skill grants behavior tags the arena checks against the challenge traps.

## Innate
- **fill-form** `[fill-basic-form]`
  Fill the email and password fields accurately.
- **full-scan** `[scroll-full-page]`
  Before submitting, scroll the entire page top-to-bottom to find hidden
  required fields below the fold.
- **handle-modal** `[handle-modal]`
  Read and confirm confirmation modals correctly.
- **verify-state** `[verify-final-state]`
  After submitting, verify the expected success state (real dashboard
  URL/heading) is reached before declaring success. Ignore misleading toasts
  and fake CTAs.

## Learned (patched by the arena)
_(none — Verifier wins; it teaches rather than learns)_
