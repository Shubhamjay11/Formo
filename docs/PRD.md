# Formo — Product Requirements Document (v1, phased)

| Field | Value |
|-------|-------|
| **Product** | Formo |
| **Version** | 1.1 (re-sequenced for phased delivery) |
| **Status** | Phase A in development |
| **Last updated** | 11-07-2026 |
| **Placement** | `docs/PRD.md` — loaded only in feature-spec planning chats |

---

## 1. Summary

Formo is an **organization-first operational forms platform** for mission-driven teams (NGOs, HR, operations) — and equally usable by individuals through personal workspaces. It combines multi-tenant workspaces, a form builder, and (in later phases) post-submit workflows, a unified records layer, and signed outbound webhooks.

**Positioning:** Everything Google Forms does, plus what organizations actually need after submit — roles, approvals, workflows, records, integrations.

**Wedge:** the market is crowded on *collecting* responses; it is underserved on *what happens next*. Formo competes only on the latter.

---

## 2. Core design decision — "Everyone is an org"

Signup auto-creates a **personal workspace** (an organization with one member, the owner).

- Individuals never see organization language; the UI says "workspace".
- Inviting a member converts the experience into a team workspace — no migration, no mode switch.
- Every query in the system is org-scoped via `withOrg()`. There is no "personal mode" code path.

This single decision serves both individual and organizational users with one architecture. (Recorded in `docs/DECISIONS.md`.)

---

## 3. Phasing — the delivery contract

**Rule: a phase does not begin until the previous phase is deployed and used by at least 2–3 real teams.** Their feedback re-orders what follows.

| Phase | Scope | Gate to next phase |
|-------|-------|--------------------|
| **A — MVP (v1.0)** | Auth · workspaces/invites/roles · form builder (10 field types, draft/publish) · public link + embed · submissions table + CSV export | Deployed; 2–3 pilot teams active; time-to-first-publish measured |
| **B — Activation (v1.1)** | 3 starter templates · onboarding wizard · empty states | Median time-to-first-publish < 15 min |
| **C — Operations (v1.2)** | Linear workflow engine (notify, approval) · unified records layer (search, filter, export) | ≥ 85% workflow completion in pilot |
| **D — Platform (v1.3)** | Signed outbound webhooks (HMAC, retry, delivery log) · admin (audit log, metrics, rate limits) · billing/plans | Security review passed before production webhooks |

Phase A alone = "Google Forms for organizations" and is independently shippable.

### Deferred beyond v1 (all phases)
SAML/SCIM/SSO · multi-workspace switcher UI (API supports multiple memberships; UI uses active workspace) · branching/conditional workflows · real file upload pipeline (file field stores a string reference) · production SMTP (notify is audit-backed) · native mobile apps · public template marketplace.

---

## 4. Users and roles

| Persona | Needs |
|---------|-------|
| **Individual creator** | Personal workspace, build/publish forms, view submissions — zero team ceremony |
| **Org owner / admin** | Workspace setup, invites, roles; later: webhooks, approvals, audit |
| **Builder** | Create/edit/publish forms; later: configure form workflows |
| **Viewer** | Read-only access to forms and submissions |
| **Respondent** | Open public URL, submit validated answers, no account |

### Permission matrix (enforced on every org-scoped request)

| Action | Owner | Admin | Builder | Viewer |
|--------|:-:|:-:|:-:|:-:|
| View workspace | ✓ | ✓ | ✓ | ✓ |
| Invite members / manage roles | ✓ | ✓ | — | — |
| Create/edit forms | ✓ | ✓ | ✓ | — |
| Publish forms | ✓ | ✓ | ✓ | — |
| View submissions / records | ✓ | ✓ | ✓ | ✓ |
| Configure workflows (form-scoped, Phase C) | ✓ | ✓ | ✓ | — |
| Org webhooks / admin / metrics (Phase C/D) | ✓ | ✓ | — | — |

---

# PHASE A — MVP (build now)

## A1. Tenancy & identity

**Journey:** register → personal workspace auto-created (user = owner) → optionally invite member (email + role) → invite link → member accepts (session email must match) → membership created → role enforced everywhere.

**Edge cases (spec acceptance criteria):**

| Case | Behavior |
|------|----------|
| Invite expired / invalid | 404 `INVITE_INVALID` |
| Invite email ≠ session email | 403 `EMAIL_MISMATCH` |
| Duplicate accept | Idempotent — no duplicate membership |
| Register with existing email | 409 `EMAIL_EXISTS` |
| Session expired | 401 → redirect to login |

**Surface:** register, login, logout, me; create invite, view invite, accept invite. Session = HTTP-only cookies.

## A2. Form builder

**Journey:** builder creates form → adds fields from palette → preview → save draft → publish → copy public link / embed code → respondent submits validated response → builder views submissions table → exports CSV.

**Field types (all 10 in builder, preview, and public form):**

| Type | Validation |
|------|-----------|
| text / textarea | string |
| email | simplified RFC 5322 |
| number | optional min/max |
| select / radio | option whitelist (single) |
| multi_select | array of whitelisted options |
| date | ISO date string |
| checkbox | boolean |
| file | string reference only (upload deferred) |

**Form schema:** stored as versioned JSONB; `schema_version` recorded on each submission (this is what makes Phase C records possible without rework).

**Edge cases:** publish with zero fields → 400 `EMPTY_FORM` · slug collision → timestamp suffix · submit to draft/unpublished → 404 · invalid submission → 400 with field-level errors.

## A3. Submissions

Submissions table per form (newest first, paginated) · CSV export matching current schema field order · empty states that point to "create a form" (and to templates once Phase B lands).

## Phase A acceptance (definition of done)

- [ ] Signup → personal workspace → publish a form → receive a submission → export CSV, end-to-end on production
- [ ] All permission-matrix rows enforced; no unscoped tenant query in the codebase
- [ ] All edge cases above covered by tests (e2e: register→invite→accept; publish→submit→export)
- [ ] Deployed on Vercel + Neon; Sentry live
- [ ] 2–3 pilot teams onboarded; instrumentation for time-to-first-publish and invite completion

---

# PHASE B — Activation

Templates: **NGO program intake · HR onboarding · Ops checklist**. Template gallery + apply-to-workspace. Onboarding wizard (skippable; completion persisted). Empty states route to gallery.
**Metric gate:** median time-to-first-publish < 15 min.

# PHASE C — Operations

**Workflow engine:** on submit → linear steps (no branching): `notify` (audit-backed record; SMTP later) and `approval` (run pauses; admin approves to continue). Runs list, pending-approvals view, step latency logged.
**Records layer:** every submission → normalized record; keys = field labels + `_raw` original field IDs; `schema_version` respected on export; cross-form search, filter, CSV.
**Metrics:** ≥ 85% workflow completion (excl. pending approvals); 100% submission→record.

# PHASE D — Platform

**Signed webhooks:** HMAC-SHA256 (`X-Formo-Timestamp`, `X-Formo-Signature: sha256=<hex>`), secret shown once, retries at 1s/5s/15s, delivery log with status + response code, test-fire endpoint. **Security review gate before production.**
**Admin:** audit log (`org.created`, `invite.*`, `form.published`, …), role management UI, basic metrics, rate limits (in-memory dev → Redis for multi-instance).
**Billing:** plans and gating (limits: forms, submissions/month, members) — priced after pilot learning.

---

## 5. Success metrics

| Metric | Target | Phase |
|--------|--------|-------|
| Pilot teams live on MVP | 2–3 | A |
| Invite completion | ≥ 70% | A |
| Auth error rate | < 0.1% of requests | A |
| Median time-to-first-publish | < 15 min | B |
| Workflow completion (excl. pending) | ≥ 85% | C |
| Submission → record | 100% | C |
| Webhook signing + retry verified by receiver | Pass | D |

---

## 6. Technical context

Stack per boilerplate: **Next.js 15 full-stack** (App Router; public form pages server-rendered), TypeScript strict, Tailwind v4 + shadcn/ui, Drizzle + Neon Postgres, Better Auth (HTTP-only sessions), Vitest + Playwright, Vercel.

**Deviation from original draft (logged in DECISIONS.md):** single Next.js app replaces Vite SPA + Fastify — one deployable, SSR for public forms, `/api/v1` REST routes exposed from Next when external integrations need them (Phase D).

---

## 7. Risks

| Risk | Mitigation |
|------|------------|
| Crowded forms market | Compete only on post-submit ops (phases C/D); pilot with NGO/HR teams, not the general public |
| Builder UI complexity blows up Phase A | Split spec: schema/CRUD → builder UI → public form → submissions; ship public form early and dogfood |
| Notify without SMTP confuses users | Label clearly as activity log in UI; SMTP fast-follow |
| Rate limiting in-memory | Acceptable single-node; Redis before multi-instance |
| Webhook security | CTO/security gate before Phase D production |

---

## 8. Feature-spec map (docs/features/)

| Spec | Contents | Phase |
|------|----------|-------|
| 001-auth | Register/login/session, personal workspace on signup | A |
| 002-workspaces | Orgs, 4 roles, invites + edge cases, withOrg() scoping | A |
| 003a-form-schema | Form model, versioned JSONB fields, CRUD, draft/publish, slugs | A |
| 003b-builder-ui | Palette, field editing, preview | A |
| 003c-public-form | Public page, validation, submit, embed | A |
| 003d-submissions | Table, pagination, CSV export | A |
| 004-templates | Gallery, apply, 3 starters | B |
| 005-onboarding | Wizard, empty states | B |
| 006-workflows | Engine, notify, approval, runs | C |
| 007-records | Normalized records, search, export | C |
| 008-webhooks | Signing, retry, deliveries, test | D |
| 009-admin | Audit, roles UI, metrics, rate limits | D |
| 010-billing | Plans, gating | D |

This document is the consolidated contract. Feature specs are authoritative for implementation detail and task breakdowns.