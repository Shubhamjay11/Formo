# Progress (AI-maintained — update at the end of every working session)

## Current state (updated: 12-07-2026)
- Working on: 001-auth T4 — pages/forms shipped; Done when blocked on EMAIL_EXISTS
- Last completed: 001-auth T3 — Resend verify + reset templates; Vitest token proofs; live smoke delivered
- Known issues:
  - T4 EMAIL_EXISTS blocked: with `emailAndPassword.requireEmailVerification: true`, Better Auth returns synthetic success on duplicate signup (enumeration protection) instead of `USER_ALREADY_EXISTS` — cannot meet T4 Done when without BA config change (ask before changing)
  - middleware is a passthrough stub until 001-auth T5
  - BA `user.create.after` runs post-commit; personal workspace uses compensating user DELETE (not one SQL TX for user+org+membership)
  - If workspace provision fails and compensating user DELETE also fails, orphan user without workspace can remain (`ORPHAN_USER_NO_WORKSPACE`)
- Next up: unblock T4 EMAIL_EXISTS (BA config decision), then T5 guards/middleware/logout

## Feature status
| Spec | Phase | Status |
|---|---|---|
| 001-auth | A | T1–T3 done; T4 pages shipped, checkbox open (EMAIL_EXISTS blocked); T5–T6 pending |
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
