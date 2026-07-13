# Design System

## Tokens (source of truth: app/globals.css — mirror any change here)
- Color roles: background / foreground / card / muted / accent / primary /
  destructive / border / ring (light + dark)
- Radius scale: sm 6px · md 8px · lg 10px · xl 14px
- Type: --font-sans (UI + marketing), --font-mono (code/numbers)
- Spacing rhythm: 4px base; app sections space-y-6; marketing sections py-24/32

## Component inventory
- Installed shadcn/ui: button, input, label, card, alert, dialog, select
- Feature components (src/modules/*/components): auth — login-form, signup-form,
  forgot-password-form, reset-password-form, verify-email-notice; workspaces —
  members-settings, members-table, pending-invites, invite-member-dialog,
  accept-invite

## Voice & microcopy
- Buttons: verb-first ("Create project", not "New"). Destructive actions name
  the object ("Delete workspace").
- Empty states: one sentence of value + one CTA. Errors: what happened + what
  to do next. Never blame the user.

## Marketing direction (fill per product)
- References: [links/screenshots — e.g., Linear density, Stripe whitespace]
- Direction: [dark/light, gradient policy, illustration policy]
- Hero type scale: clamp(2.5rem, 6vw, 4.5rem), tracking-tight, text-balance
