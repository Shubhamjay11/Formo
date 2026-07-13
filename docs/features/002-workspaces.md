# Feature: Workspaces, Roles & Invites
Status: Ready · Spec date: 11-07-2026 · Phase: A

## Goal
Multi-tenant workspaces with four roles and an invite flow matching the PRD's
edge-case contract. Establishes withOrg() scoping and requireRole() — the
security spine every later feature uses.

## User stories
- As an owner/admin, I can invite someone by email with a role; they get a link.
- As an invitee, I accept with a logged-in account whose email matches the invite.
- As an owner/admin, I can change members' roles and remove members.
- As any member, I see the workspace and my role; viewers cannot modify anything.

## Scope
- In: roles (owner/admin/builder/viewer), invites (create/view/accept/revoke),
  members list + role management, withOrg() + requireRole() helpers,
  active-workspace resolution (first membership), audit entries (org.created,
  invite.created, invite.accepted)
- Out: multi-workspace switcher UI, transferring ownership, SSO, email
  notifications beyond the invite email

## Data model changes
- organizations (from 001) · memberships: org_id, user_id, role enum, unique(org,user)
- invites: org_id, email, role, token (unique, random), expires_at (7d),
  accepted_at, created_by
- audit_logs: org_id, actor_id, action, target, metadata jsonb, created_at
Indexes: memberships(org_id), invites(token), audit_logs(org_id, created_at).

## API / server actions (src/modules/workspaces/)
- actions: createInvite, revokeInvite, acceptInvite, updateMemberRole, removeMember
- queries: getActiveOrg(userId), listMembers, listInvites, getInviteByToken
- Permission helper: requireRole(orgId, userId, minRole) with owner>admin>builder>viewer
- withOrg(orgId) query scoping in src/db — EVERY tenant query goes through it

## UI
- src/app/(app)/settings/members: members table (name, email, role selector,
  remove), pending invites (resend/revoke), invite dialog (email + role)
- src/app/invite/[token]: public-ish accept page — logged out → login/signup
  then return; logged in → accept or show mismatch error

## Edge cases (PRD contract — each becomes a test)
- Invalid/expired token → 404 INVITE_INVALID
- Session email ≠ invite email → 403 EMAIL_MISMATCH
- Accept twice → idempotent, single membership, friendly "already a member"
- Invitee already a member → invite creation blocked with clear message
- Last owner cannot demote self or be removed
- Viewer calling any mutating action → 403 (server-enforced, not just hidden UI)

## Acceptance criteria
- [ ] Full invite loop: create → email link → accept → member appears with role
- [ ] All six edge cases return the specified codes/behavior (tested)
- [ ] requireRole matrix enforced on every action in this module
- [ ] Audit rows written for org.created / invite.created / invite.accepted
- [ ] e2e: owner invites builder → builder accepts → builder sees workspace,
      cannot open members settings

## Tasks
- [x] T1: memberships/invites/audit schema + migration + withOrg()/requireRole()
      Files: src/db/schema/org.ts, src/db/index.ts, src/server/authz.ts
      Done when: helpers unit-tested incl. role ordering
- [x] T2: Invite service + actions (create/revoke/accept, idempotency, expiry)
      Done when: all edge cases pass unit tests; audit rows written
- [x] T3: Invite email (Resend template on brand tokens)
      Done when: email delivers with working link
- [x] T4: Members settings UI (table, role change, remove, invite dialog)
      Done when: functional with loading/empty/error states; viewer sees 403 path
- [ ] T5: Accept-invite page incl. logged-out → auth → return flow
      Done when: mismatch/expired/duplicate states render correctly
- [ ] T6: e2e/invites.spec.ts full loop + mismatch case
      Done when: green in CI
