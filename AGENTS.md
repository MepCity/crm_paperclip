# MepCity CRM — reference CRM-like CRM experiment

Goal: test whether an agent team can rebuild a working CRM with feature parity to the reference CRM setup we use, for our own internal use.

## Language
- Comments to the board (the user) in Paperclip: Turkish.
- Code, commit messages, specs and ADRs: English.

## Repository layout
- `~/Desktop/mepcity-research/metadata/` — official reference CRM API metadata export (modules, fields, layouts, views, related lists, roles, profiles, workflows). **Source of truth for the data model.** Produced by `~/Desktop/mepcity-research/tools/metadata-oauth/export.mjs`.
- `research/specs/` — module/screen specs written by the CRM Analyst (one file per module/screen). No customer data.
- `docs/adr/` — architecture decision records (CTO).
- `tools/` — research tooling. Do not modify without CTO approval.
- Application code layout is decided by the CTO and documented in `docs/adr/0001-*.md`.

## Raw ref-captures (outside the repo)
- Raw captures live in `~/Desktop/mepcity-research/captures/<slug>/` (screenshot.png, page.txt, aria.yml, network.json, meta.json).
- They come from our live reference CRM account and may show real customer names. **Never copy screenshots, raw page text or record values into the repo, issues or comments.** Refer to captures by path and describe structure only.

## reference CRM access rules (CRM Analyst and CTO)
- Our live CRM: <reference-crm-url> (data center: `com`).
- The capture browser is logged in with the **board's own reference CRM account, which has full permissions** (there is no separate read-only user). Treat every action as if it could change real customer data.
- Access reference CRM only through `node <repo-root>/node ~/Desktop/mepcity-research/tools/capture/capture.mjs` (it blocks write requests and dangerous clicks). Never use any other browser, API client or the user's own Chrome for reference CRM.
- Read-only: never create, edit, delete, convert, merge, import/export records, never send emails or messages, never run mass actions, never change settings.
- Stay on reference CRM domains. If the login page appears, stop and ask the board to log in again (`capture.mjs login`).
- Capture what a screen does and what data it needs (layout, fields, actions, filters, flows, request shapes) — not its exact visual assets. Our UI uses our own design system and branding.

## Engineering workflow
- One Paperclip issue = one isolated git worktree/branch. Keep changes small and focused.
- Every change ships with tests. OpenCode QA verifies before an issue is marked done.
- Codex Reviewer reviews at milestones (end of each phase, auth/data-model/migration changes).
- Never commit secrets. `.env*` files are git-ignored.
