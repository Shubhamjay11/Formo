# Feature: Form Model, Versioned Schema & CRUD
Status: Ready · Spec date: 2026-07-18 · Phase: A

## Goal
Org-scoped form records with versioned JSONB field definitions, draft/publish,
and slug uniqueness. Establishes `src/modules/forms/` CRUD + authz so 003b–003d
can build UI, public submit, and submissions without reworking the data model.

## User stories
- As a builder+, I can create, edit, publish, and delete forms in my workspace.
- As a builder+, I can save a draft with validated field definitions and publish
  when ready (empty forms cannot publish).
- As a viewer+, I can list and open forms in my workspace (read-only).
- As the platform, every form query is org-scoped; cross-org ids do not leak
  existence.

## Scope
- In: `forms` table (tenant-owned), unique slug per org with collision retry,
  Zod schemas for all 10 PRD field types (validate before every save),
  module CRUD (create/update/publish/delete/list/get), `requireRole` matrix
  (builder+ mutate, viewer+ read), `withOrg()` on every query, hard delete,
  thin list + create/edit shell UI, audit `form.published` on draft→published,
  `schema_version` Strategy A (below)
- Out: 003b palette / field editing UX / preview; 003c public page, embed,
  submit validation, submit-to-draft 404; 003d submissions table, CSV,
  stamping `schema_version` on submission rows; file upload storage; billing /
  plan limits; workspace switcher; SSO; no unpublish action

## Data model changes
- `forms` (new, tenant-owned):
  - `id` uuid PK (default `gen_random_uuid()`)
  - `org_id` uuid NOT NULL → `organizations.id` ON DELETE CASCADE
  - `title` text NOT NULL
  - `slug` text NOT NULL
  - `status` pgEnum `form_status` (`draft` | `published`) NOT NULL, default `draft`
  - `fields` jsonb NOT NULL, default `[]` — array of field definitions
  - `schema_version` integer NOT NULL, default `1`
  - `created_at`, `updated_at` timestamps NOT NULL (UTC)
- Indexes:
  - `forms_org_id_idx` on `org_id` (FK + list-by-org)
  - unique `forms_org_id_slug_idx` on `(org_id, slug)`
  - `forms_org_id_updated_at_idx` on `(org_id, updated_at)` — list order newest-first
- Relations: `organizations.forms` → `many(forms)`; form → one organization
- Schema file: `src/db/schema/forms.ts`; export from `src/db/schema.ts`; drizzle
  migration generated and reviewed

### schema_version + fields (Strategy A — mandatory)

| Event | Behavior |
|-------|----------|
| **create** | `schema_version = 1`, `status = draft`, `fields = []` |
| **update while `status = draft`** | May change `title` / `slug` / `fields`. Never changes `schema_version` or `status`. |
| **update while `status = published`** | May change `title` / `slug` / `fields`. If `fields` actually change (stable compare of field definitions), increment `schema_version` by 1 in the **same transaction**. Do **not** auto-unpublish (`status` stays `published`). Title/slug-only changes do not bump version. Live field updates that bump version do **not** write audit. |
| **publish** | Gate only: if `fields` is empty → `400 EMPTY_FORM`. Else if `status = draft` → set `status = published` (first draft→published leaves `schema_version` at `1`). If already `published` → no-op for version and status (idempotent confirm). Version bumps happen on **live field update**, not on publish. |

**Audit:** write `audit_logs` with `action: "form.published"` **only** on successful publish that transitions `draft` → `published`. Already-published re-publish → no audit row. Module-local `writeAudit` (same shape as workspaces 002 — do **not** import workspaces internals).

## API / server actions (src/modules/forms/)

Active org: resolve via workspaces `getActiveOrg` through that module’s **service /
queries public API only** (no internals).

Actions (thin: session → active org → `requireRole` → Zod parse → service):

| Action | Min role | Behavior |
|--------|----------|----------|
| `createForm` | builder | title → slugify; create draft; slug collision → append `-{timestamp}`, retry up to 5 times then error |
| `updateForm` | builder | Zod-validate fields; Strategy A version rules; withOrg scoped |
| `publishForm` | builder | EMPTY_FORM or draft→published + audit (see Strategy A) |
| `deleteForm` | builder | Hard delete; withOrg scoped |
| `listForms` | viewer | Org-scoped list, newest `updated_at` first |
| `getForm` | viewer | By id + org; missing / other-org → not found (no distinct forbidden) |

Queries (RSC): `listForms(orgId)`, `getForm(orgId, formId)` — always `withOrg`.

### Field Zod shape (`schemas.ts`)
Discriminated union on `type` with shared `id` (uuid string), `label` (non-empty
string), `required` (boolean). Type-specific:

| `type` | Extras / notes |
|--------|----------------|
| `text` / `textarea` | shared only |
| `email` | shared only (submit-time RFC validation is 003c) |
| `number` | optional `min` / `max` (number) |
| `select` / `radio` | `options`: non-empty array of `{ value, label }` |
| `multi_select` | same `options` shape |
| `date` | shared only (submit-time ISO is 003c) |
| `checkbox` | shared only |
| `file` | definition only; submit value = string reference later (upload deferred) |

`fields` on save = `z.array(fieldDefinitionSchema)`. Invalid payload → `400` with
Zod issues. Validate field definitions before every create/update save (DECISIONS).

Typed service errors (actions map to `{ error }`): `EMPTY_FORM`, `FORBIDDEN`,
`NOT_FOUND`, `VALIDATION_ERROR`, `SLUG_EXHAUSTED` (after bound retries).

## UI
- `src/app/(app)/forms/page.tsx` — list forms (title, status, updated); CTA create
- `src/app/(app)/forms/loading.tsx` — loading state
- `src/app/(app)/forms/[formId]/page.tsx` — create/edit shell: title, status,
  publish/delete, minimal fields JSON/text enough to exercise CRUD (NOT palette,
  drag-drop, or preview — that is 003b)
- Module components under `src/modules/forms/components/`
- Required states: loading / empty (“No forms yet”) / error (incl. not found,
  FORBIDDEN for viewer mutate paths)

## Edge cases (each → acceptance + test in T6)
- Publish with zero fields → `400 EMPTY_FORM`
- Slug collision → append `-{timestamp}`, retry (bound: 5); then fail clearly
- Viewer or unauthenticated calling mutate actions → `403 FORBIDDEN`
- Invalid field definition payload → `400` with Zod issues
- Cross-org or unknown form id → not found (do not leak existence via distinct forbidden)
- Published form: field-definition change → `schema_version` increments in same txn;
  status stays `published`; no `form.published` audit

**Not claimed done in 003a:** submit to draft/unpublished → 404 (003c); invalid
submission field-level errors (003c); CSV / pagination (003d).

## Acceptance criteria
- [ ] Builder+ can create, update, publish, delete forms; all rows scoped to active org
- [ ] Viewer+ can list/get; viewer mutate → 403; unauthenticated mutate → 403
- [ ] Draft/publish works; publish with empty fields → `EMPTY_FORM`
- [ ] Slug unique per org; collision appends `-{timestamp}` within retry bound
- [ ] Zod rejects invalid field definitions on save with clear 400
- [ ] Strategy A: create starts at version 1 / draft / `[]`; draft updates never bump
      version; published field changes bump version; publish is draft→published gate
      + EMPTY_FORM only
- [ ] Successful draft→published writes one `audit_logs` row `form.published`; live
      version bumps do not
- [ ] Cross-org / unknown id → not found; every tenant query uses `withOrg(orgId)`
- [ ] Thin UI: list + edit shell with loading / empty / error states
- [ ] Unit tests cover the edge cases above (T6)

## Tasks
- [x] T1: `forms` schema + migration + indexes + schema export + org relations
      Files: `src/db/schema/forms.ts`, `src/db/schema.ts`, `src/db/schema/org.ts`
      (forms relation), `drizzle/` migration
      Done when: migration applies; `forms` table matches data model; unique
      `(org_id, slug)` and list index exist
- [ ] T2: Zod field + form input schemas (all 10 types)
      Files: `src/modules/forms/schemas.ts`
      Done when: discriminated union covers text, textarea, email, number, select,
      radio, multi_select, date, checkbox, file; create/update input schemas infer
      types; invalid fixtures fail with clear Zod issues
- [ ] T3: Service CRUD, slug collision retry, publish/EMPTY_FORM, Strategy A,
      withOrg, `form.published` audit
      Files: `src/modules/forms/service.ts`, `src/modules/forms/queries.ts`
      Done when: create/update/publish/delete/list/get work org-scoped; slug
      retries bound at 5; Strategy A version + audit rules enforced; module-local
      `writeAudit` (no workspaces internal imports); active org via workspaces
      public API only
- [ ] T4: Actions + `requireRole` matrix
      Files: `src/modules/forms/actions.ts`
      Done when: each action is session → org → role → Zod → service; mutate
      requires builder+; list/get require viewer+; errors return `{ error }` unions
- [ ] T5: Thin list + create/edit shell UI
      Files: `src/app/(app)/forms/page.tsx`, `loading.tsx`, `[formId]/page.tsx`,
      `src/modules/forms/components/*`
      Done when: list/create/edit/publish/delete exercisable; loading / empty /
      error states present; no palette/preview
- [ ] T6: Unit tests for edge cases + Strategy A bump
      Files: `src/modules/forms/**/*.test.ts` (or `tests/` colocated pattern)
      Done when: EMPTY_FORM, slug suffix, viewer mutate 403, Zod 400, cross-org
      not found, schema_version bump on live field update — all green
