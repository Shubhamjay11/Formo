# Feature: Authentication + Personal Workspace
Status: Ready · Spec date: 11-07-2026 · Phase: A

## Goal
Users register and log in with email+password (Better Auth, HTTP-only session
cookies). Signup atomically creates a personal workspace (org) with the user as
owner. Email verification required before app access.

## User stories
- As a visitor, I can register with email+password and land in my own workspace.
- As a user, I must verify my email before using the app.
- As a user, I can log in, log out, and reset a forgotten password.

## Scope
- In: register, login, logout, session, email verification, password reset,
  personal-workspace-on-signup, (app) route guard
- Out: Google OAuth (fast-follow), SSO/SAML, 2FA, org invites (spec 002),
  workspace switcher

## Data model changes
Better Auth tables via Drizzle adapter: users, sessions, accounts, verifications.
Plus (owned by spec 002 but stubbed here): organizations, memberships — created
inside the signup transaction. schema files: src/db/schema/auth.ts, org.ts.

## API / server actions
- Better Auth handler: src/app/api/auth/[...all]/route.ts
- Signup hook (Better Auth databaseHooks or callback): db.transaction →
  create organization (name: "<firstName>'s workspace", slug from user id) →
  create membership (role: owner)
- getSession() helper in src/server/session.ts; requireSession() redirect helper

## UI
src/app/(auth)/: login, signup, forgot-password, reset-password, verify-email
notice. Card layout, react-hook-form + zod, loading + inline error states.
src/app/(app)/layout.tsx: no session → redirect /login; unverified → /verify-email.

## Edge cases
- Register with existing email → 409 EMAIL_EXISTS (friendly inline message)
- Session expired mid-use → 401 → redirect /login (middleware)
- Unverified user hitting (app) → verify-email page with resend button
- Reset token expired/used → clear error + restart flow
- Signup transaction fails after user insert → whole transaction rolls back
  (user + org + membership are all-or-nothing)

## Acceptance criteria
- [ ] Register → verification email (Resend) → verify → /dashboard shows
      "<name>'s workspace"
- [ ] users, organizations, memberships rows created atomically on signup
- [ ] Login/logout/reset all work; 409 on duplicate email
- [ ] Unauthenticated /dashboard → /login; unverified → /verify-email
- [ ] e2e: register→verify→login→dashboard green

## Tasks
- [x] T1: Better Auth — email+password, sessions (OAuth fast-follow); auth + org schema; migration
      Files: src/lib/auth.ts, src/db/schema/{auth,org}.ts, src/app/api/auth/[...all]/route.ts
      Done when: register/login work via API; tables migrated
- [ ] T2: Personal-workspace-on-signup transaction + getSession()/requireSession()
      Files: src/lib/auth.ts (hook), src/modules/workspaces/service.ts, src/server/session.ts
      Done when: signup creates user+org+membership atomically (test proves rollback)
- [ ] T3: Email verification + password reset wired to Resend templates
      Files: src/emails/, src/lib/auth.ts
      Done when: both emails deliver locally; tokens validated; expired → error
- [ ] T4: Auth pages (login/signup/forgot/reset/verify) with forms + states
      Files: src/app/(auth)/**, src/modules/auth/components/
      Done when: all pages functional; inline errors incl. EMAIL_EXISTS
- [ ] T5: (app) layout guard + middleware + logout
      Done when: guards redirect correctly; logout clears session
- [ ] T6: e2e/auth.spec.ts happy path + duplicate-email case
      Done when: green in CI
