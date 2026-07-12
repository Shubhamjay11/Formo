# Decision Log (append-only — the AI must not re-litigate these)

- 2026-07-11 — Drizzle over Prisma: SQL transparency, lighter runtime, edge support.
- 2026-07-11 — Better Auth over Clerk: self-hosted control, no per-MAU cost,
  white-label friendly.
- 2026-07-11 — Server actions over tRPC: fewer layers; revisit only if a public
  API product need emerges (Phase D exposes REST /api/v1 for integrations).
- 2026-07-11 — Biome over ESLint+Prettier: single fast tool, instant agent feedback.
- 2026-07-11 — Money as integer cents; UTC timestamps in DB.
- 2026-07-11 — FORMO: "Everyone is an org." Signup auto-creates a personal
  workspace (org with one owner-member). No personal-mode code path; all
  queries org-scoped via withOrg(). UI language: "workspace".
- 2026-07-11 — FORMO: Single Next.js 15 full-stack app replaces the original
  draft's Vite SPA + Fastify. One deployable; SSR for public form pages;
  /api/v1 REST routes exposed from Next in Phase D for integrations.
- 2026-07-11 — FORMO: Form fields stored as versioned JSONB on the form;
  schema_version stamped on every submission (enables Phase C records with
  no rework). Field definitions validated by zod before save.