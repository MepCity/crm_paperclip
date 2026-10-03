<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Repository rules apply here

This directory is governed by the repository root [`AGENTS.md`](../../AGENTS.md). Read it before working here. In particular:

- **reference CRM is read-only.** Never change anything in reference CRM; inspect it only through `node ~/Desktop/mepcity-research/tools/capture/capture.mjs`.
- Commit standard: `<type>(<scope>): <summary>` (English, at most 72 characters), with `Refs: MEP-<n>` in the body. Do not write the signature trailers yourself.
