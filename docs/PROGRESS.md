# Progress (AI-maintained — update at the end of every working session)

## Current state (updated: 12-07-2026)
- Working on: 001-auth (docs/features/001-auth.md T3 next)
- Last completed: 001-auth T2 — personal workspace on signup (auth hook + workspaces service), getSession()/requireSession(), Vitest rollback proofs against formo_test
- Known issues:
  - middleware is a passthrough stub until 001-auth T5 (was empty export; broke all routes)
  - BA `user.create.after` runs post-commit; personal workspace uses compensating user DELETE (not one SQL TX for user+org+membership). Documented deviation from 001-auth edge-case wording.
  - If workspace provision fails and compensating user DELETE also fails, an orphan user without workspace can remain (logged as `ORPHAN_USER_NO_WORKSPACE`); signup still errors to the client.
- Next up: 001-auth T3 — email verification + password reset wired to Resend templates

## Feature status
| Spec | Phase | Status |
|---|---|---|
| 001-auth | A | T1–T2 done; T3–T6 pending |
| 002-workspaces | A | Spec draft ready |
| 003a-form-schema | A | Not started |
| 003b-builder-ui | A | Not started |
| 003c-public-form | A | Not started |
| 003d-submissions | A | Not started |
| 004-templates | B | Not started |
| 005-onboarding | B | Not started |
| 006-workflows | C | Not started |
| 007-records | C | Not started |
| 008-webhooks | D | Not started |
| 009-admin | D | Not started |
| 010-billing | D | Not started |
