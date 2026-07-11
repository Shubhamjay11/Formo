# Feature module pattern (delete this folder once real modules exist)

One folder per feature. Everything the feature needs lives here:

modules/<feature>/
├── components/        # feature-specific UI (shared primitives stay in src/components/ui)
├── actions.ts         # server actions: auth check → zod parse → service call
├── service.ts         # business logic; the only file that touches db
├── queries.ts         # read helpers used by RSC pages (via withOrg scoping)
├── schemas.ts         # zod schemas (types inferred from these)
└── emails.tsx         # feature-owned email templates (optional)

Rules:
- Modules may import from src/lib, src/db, src/components/ui, src/config —
  and NOT from other modules' internals. Cross-module needs go through the
  other module's service.ts (its public API).
- Pages in src/app are thin: they import from the module and compose.
- One feature spec (docs/features/NNN) ≈ one module. One task ≈ files inside it.
