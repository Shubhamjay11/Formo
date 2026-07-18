# Progress (AI-maintained — update at the end of every working session)

## Current state (updated: 18-07-2026)
- Working on: 003a-form-schema T2
- Last completed: 003a-form-schema T1 (`forms` schema + migration + org relations)
- Known issues:
  - T4 EMAIL_EXISTS: BA synthetic success on duplicate signup; T4 checkbox open (DECISIONS 2026-07-13)
  - BA `user.create.after` post-commit; compensating user DELETE if workspace provision fails; orphan risk `ORPHAN_USER_NO_WORKSPACE`
  - Resend sandbox: can only send to jaybhayeshubham813@gmail.com until domain verified — verify/invite/reset email loops blocked for other addresses
  - FEEL: `/` has no auth CTA; dashboard stub shows no org/role; builder still sees Members nav → Access denied; expired verify → `/?error=TOKEN_EXPIRED` with no on-page message
- Next up: 003a-form-schema T2 (Zod field + form input schemas)

## Feature status
| Spec | Phase | Status |
|---|---|---|
| 001-auth | A | T1–T3, T5–T6 done; T4 pages shipped, checkbox open (EMAIL_EXISTS Known issue) |
| 002-workspaces | A | T1–T6 done |
| 003a-form-schema | A | T1 done |
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
