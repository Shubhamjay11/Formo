# Architecture (3 pages max)

## Stack
| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 15 App Router, React 19, TS strict | Server-first |
| Styling | Tailwind v4 + shadcn/ui | Tokens in app/globals.css |
| Database | PostgreSQL (Neon) + Drizzle ORM | Migrations via drizzle-kit |
| Auth | Better Auth | Email+password, Google OAuth, sessions |
| Billing | Stripe | Checkout + customer portal + webhooks |
| Email | Resend + react-email | Templates in emails/ |
| Testing | Vitest + Playwright | CI-gated |
| Hosting | Vercel | Preview deploy per PR |
| Observability | Sentry + PostHog | From day one |

## Folder map (feature-module structure)
- `src/app` — routes only, thin composers: `(marketing)` public · `(auth)` login/signup · `(app)` product · `api` webhooks/auth handlers
- `src/modules/<feature>` — EVERYTHING for one feature: components/, actions.ts,
  service.ts, queries.ts, schemas.ts (pattern: src/modules/_example/README.md)
- `src/components/ui` — shared shadcn primitives only (no feature logic)
- `src/server` — cross-cutting server utils (session, org context, rate limit)
- `src/db` — schema, client, withOrg(), shared queries/ · `drizzle/` migrations
- `src/lib` — pure utilities, env, logger · `src/hooks` · `src/types`
- `src/emails` — shared email layout/templates (feature emails live in modules)
- `src/config/brand.ts` — ALL brand/business config (white-label heart)
- `tests/` factories + unit setup · `e2e/` Playwright · `scripts/` one-offs
- `docs/` — the workflow system (product, architecture, specs, progress)

## Module boundaries
Module → may import: src/lib, src/db, src/components/ui, src/config, src/server.
Module → may NOT import another module's internals; cross-module calls go through
the other module's service.ts. Pages import modules, never db.

## Request flow
Page (RSC) → reads via service → renders
Form → server action → Zod parse → auth/org check → service → db → revalidate

## Multi-tenancy
Organization = tenant. users ↔ memberships(role) ↔ organizations.
Every tenant table carries org_id. Access rule: session → active org →
membership role → withOrg(orgId) scopes every query. No cross-org reads, ever.

## Boundary rules
- src/components/** and src/app/** never import src/db directly
- actions.ts stays thin: auth check → zod parse → service call, nothing more
- brand values never appear outside src/config/brand.ts + globals.css tokens
