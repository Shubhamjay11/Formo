# Product Context — Formo

## What it is
Formo is an operational forms platform: everything Google Forms does, built
organization-first. Teams (NGOs, HR, ops) collect submissions and — in later
phases — run approvals, workflows, and integrations on top of them. Individuals
use it too: signup auto-creates a personal workspace. Revenue: subscription
plans gated by forms, submissions/month, and members (Phase D).

## Who it's for
- Primary: ops/HR/program admins at mission-driven teams (5–200 people)
- Also: individual creators who want forms without team ceremony
- Core job-to-be-done: publish a form and act on what comes in — with roles,
  visibility, and (later) approvals

## Core design decision — "everyone is an org"
Signup auto-creates a personal workspace (an org with one member, the owner).
UI says "workspace". Inviting a member makes it a team — no mode switch, no
separate code path. Every query is org-scoped via withOrg().

## Current scope — Phase A (MVP)
1. Auth: register/login/session, email verification, personal workspace on signup
2. Workspaces: 4 roles (owner/admin/builder/viewer), invites with strict edge cases
3. Form builder: 10 field types, versioned JSONB schema, draft/publish, slug
4. Public form: server-rendered page + embed, validated submit, no account needed
5. Submissions: table per form, CSV export

## Explicit non-goals (do NOT build toward these)
- No SSO/SAML/SCIM · no multi-workspace switcher UI (active workspace only)
- No branching workflows (Phase C is linear-only; nothing in Phase A)
- No real file uploads (file field = string reference) · no SMTP sending
- No mobile apps · no template marketplace · no billing until Phase D

## Business model (Phase D)
Free (1 workspace, 3 forms, 100 subs/mo) → Pro → Team. Details after pilot.