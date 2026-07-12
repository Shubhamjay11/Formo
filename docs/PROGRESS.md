# Progress (AI-maintained — update at the end of every working session)

## Current state (updated: 12-07-2026)
- Working on: 001-auth T3 — code + Vitest shipped; checkbox open pending live Resend delivery
- Last completed: 001-auth T2 — personal workspace on signup, getSession()/requireSession()
- Known issues:
  - manual Resend delivery blocked: no API key (`RESEND_API_KEY` empty in `.env`)
  - middleware is a passthrough stub until 001-auth T5
  - BA `user.create.after` runs post-commit; personal workspace uses compensating user DELETE (not one SQL TX for user+org+membership)
  - If workspace provision fails and compensating user DELETE also fails, orphan user without workspace can remain (`ORPHAN_USER_NO_WORKSPACE`)
  - With `requireEmailVerification: true`, BA may return generic success on duplicate signup (enumeration protection) instead of EMAIL_EXISTS — confirm in T4
- Next up: finish T3 manual Resend smoke (set real `RESEND_API_KEY`), then 001-auth T4 auth pages

## Feature status
| Spec | Phase | Status |
|---|---|---|
| 001-auth | A | T1–T2 done; T3 code/Vitest done, checkbox open (no live Resend); T4–T6 pending |
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
