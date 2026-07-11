# Feature: Authentication
Status: Draft · Spec date: 2026-07-11

## Goal
Users can sign up, log in, verify email, and reset passwords using Better Auth.
Sessions gate everything under app/(app). This is boilerplate spec #1 — every
product inherits it unchanged.

## User stories
- As a visitor, I can sign up with email+password or Google.
- As a user, I must verify my email before accessing the app.
- As a user, I can log in, log out, and reset a forgotten password.

## Scope
- In: email+password, Google OAuth, email verification, password reset,
  session middleware for (app) routes, auth pages (login/signup/forgot/reset)
- Out: SSO/SAML (flagged off), 2FA, magic links, org logic (spec 002)

## Data model changes
Better Auth managed tables via Drizzle adapter: users, sessions, accounts,
verifications. Add to db/schema.ts through the adapter's schema generator.

## API / server actions
Better Auth route handler at app/api/auth/[...all]. Client helpers in
src/lib/auth-client.ts; server session helper getSession() in src/server/session.ts.

## UI
- src/app/(auth)/login, /signup, /forgot-password, /reset-password — card layout,
  react-hook-form + zod, loading + inline error states
- src/app/(app)/layout.tsx: no session → redirect /login

## Edge cases
Unverified login attempt → resend-verification prompt · expired reset token →
clear error + restart · OAuth email collision → link account per Better Auth config.

## Acceptance criteria
- [ ] Signup → verification email (Resend) → verified user reaches /dashboard
- [ ] Google OAuth roundtrip works locally
- [ ] Password reset end-to-end works
- [ ] Unauthenticated /dashboard request redirects to /login
- [ ] e2e: signup→verify→login happy path green

## Tasks
- [ ] T1: Install/configure Better Auth + Drizzle adapter + schema + migration
      Files: src/modules/auth/ (service, schemas), src/db/schema.ts, src/app/api/auth/[...all]/route.ts, src/lib/auth.ts
      Done when: signup/login works via API, tables migrated
- [ ] T2: Email verification + password reset flows wired to Resend templates
      Done when: both emails deliver locally; tokens validated
- [ ] T3: Auth pages (login/signup/forgot/reset) with forms + states
      Done when: all four pages functional per DESIGN.md voice rules
- [ ] T4: (app) layout session guard + logout + getSession() helper
      Done when: guard redirects; logout clears session
- [ ] T5: e2e/auth.spec.ts happy path
      Done when: green in CI
