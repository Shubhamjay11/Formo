# SaaS Boilerplate — AI-Native, White-Label

Production-ready starting point for building white-label SaaS products with
Cursor. The repo ships with the **workflow system built in**: Cursor rules,
a docs/spec system, brand abstraction, and quality gates.

**How work happens here:** feature spec → 30–90 min tasks → one task per fresh
Cursor chat → review → test → commit → PROGRESS.md updated.
Read `docs/ARCHITECTURE.md` and `.cursor/rules/00-core.mdc` first.

## Structure (feature-module, src-based)
```
src/
├── app/                  # routes only — (marketing) · (auth) · (app) · api
├── modules/<feature>/    # components/ actions.ts service.ts queries.ts schemas.ts
├── components/ui/        # shared shadcn primitives
├── server/               # cross-cutting: session, org context, rate limit
├── db/                   # schema, client, withOrg(), queries/ · drizzle/ = migrations
├── lib/ · hooks/ · types/ · emails/ · config/brand.ts
tests/ · e2e/ · scripts/ · docs/ · .cursor/rules/
```
One feature spec ≈ one module ≈ one folder of context for the agent.
Pattern details: `src/modules/_example/README.md`.

## What's already decided
Next.js 15 · TypeScript strict · Tailwind v4 + shadcn/ui · Drizzle + Neon ·
Better Auth · Stripe · Resend · Vitest + Playwright · Biome · Vercel.
Rationale in `docs/DECISIONS.md`. Don't re-litigate; append new decisions.

## First-time setup
1. `pnpm install`
2. `cp .env.example .env` and fill values (Neon, Stripe test, Resend)
3. `npx shadcn@latest init` then add base components:
   `npx shadcn@latest add button input label card dialog dropdown-menu form table tabs sonner`
4. `pnpm db:generate && pnpm db:migrate`
5. `pnpm dev`

## Build order (each is a spec in docs/features/ — run the loop on each)
| # | Spec | Contents |
|---|------|----------|
| 000 | foundation | lib/env.ts validation, logger, error types, seed script |
| 001 | auth | Better Auth: signup/login/verify/reset (spec included — start here) |
| 002 | organizations | orgs, memberships, roles, invitations, withOrg() scoping |
| 003 | billing | Stripe checkout, portal, webhooks, requirePlan() gating |
| 004 | emails | react-email templates on brand tokens |
| 005 | app-shell | sidebar layout, settings (profile/org/members/billing) |
| 006 | admin | internal dashboard: users, orgs, revenue, impersonation |
| 007 | observability | Sentry, PostHog, rate limiting |
| 008 | marketing-site | landing system per 50-marketing.mdc, blog (MDX), legal |

001 is written as a worked example. Generate the rest with a spec chat:
attach `docs/PRD.md` + `docs/ARCHITECTURE.md` + `docs/features/_TEMPLATE.md`.

## Launching a new product from this boilerplate
1. Clone into a new repo
2. Edit `config/brand.ts` (name, copy, plans, feature flags)
3. Edit tokens in `app/globals.css`; replace `/public/brand` assets
4. Provision: Neon DB, Stripe products, Resend domain, Vercel project + domain
5. Fill `.env`; rewrite `docs/PRODUCT.md` + `docs/PRD.md` for the new product
6. Reset `docs/PROGRESS.md`; deploy the shell; start feature spec 001 (product-specific)

Rule that makes this work: **no brand value outside brand.ts + tokens, ever.**

## The working loop (memorize this)
1. Spec chat: PRD in context → write docs/features/NNN-x.md → decompose into tasks
2. Per task: fresh chat → `@spec` → "implement TN. Plan first." → approve →
   review diff → tests green → commit → AI updates PROGRESS.md
3. Correct the same mistake twice? It becomes a line in .cursor/rules the same day.
