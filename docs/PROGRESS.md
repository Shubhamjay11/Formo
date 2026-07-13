# Progress (AI-maintained — update at the end of every working session)

## Current state (updated: 14-07-2026)
- Working on: —
- Last completed: 002-workspaces T6 — invites e2e + activeOrgId product fix
- Known issues:
  - T4 EMAIL_EXISTS: user chose leave BA config as-is (2026-07-13). With `requireEmailVerification: true`, BA returns synthetic success on duplicate signup (no `USER_ALREADY_EXISTS`). Signup form maps that code when present; Done when unmet — T4 stays unchecked. See DECISIONS.md 2026-07-13 (enumeration protection by design); T6 asserts synthetic success + no second user row
  - BA `user.create.after` runs post-commit; personal workspace uses compensating user DELETE (not one SQL TX for user+org+membership)
  - If workspace provision fails and compensating user DELETE also fails, orphan user without workspace can remain (`ORPHAN_USER_NO_WORKSPACE`)
- Next up: 003a-form-schema (002-workspaces complete)

## Feature status
| Spec | Phase | Status |
|---|---|---|
| 001-auth | A | T1–T3, T5–T6 done; T4 pages shipped, checkbox open (EMAIL_EXISTS Known issue) |
| 002-workspaces | A | T1–T6 done |
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
