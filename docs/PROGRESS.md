# Progress (AI-maintained — update at the end of every working session)

## Current state (updated: 13-07-2026)
- Working on: 001-auth T6 — e2e happy path + duplicate-email case
- Last completed: 001-auth T5 — (app) layout guard + middleware cookie check + logout
- Known issues:
  - T4 EMAIL_EXISTS: user chose leave BA config as-is (2026-07-13). With `requireEmailVerification: true`, BA returns synthetic success on duplicate signup (no `USER_ALREADY_EXISTS`). Signup form maps that code when present; Done when unmet — T4 stays unchecked
  - BA `user.create.after` runs post-commit; personal workspace uses compensating user DELETE (not one SQL TX for user+org+membership)
  - If workspace provision fails and compensating user DELETE also fails, orphan user without workspace can remain (`ORPHAN_USER_NO_WORKSPACE`)
- Next up: 001-auth T6 — e2e/auth.spec.ts happy path + duplicate-email case

## Feature status
| Spec | Phase | Status |
|---|---|---|
| 001-auth | A | T1–T3, T5 done; T4 pages shipped, checkbox open (EMAIL_EXISTS accepted as Known issue); T6 pending |
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
