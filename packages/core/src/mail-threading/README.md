# mail-threading

Pure functions for e-mail threading and record linking (ADR 0009, Topic 4: threading option C, exact-address linking). No I/O, no persistence, no imports from `mail/`.

## Contract
- `normalizeAddress(raw)` → lowercase `local@domain` or `null` (not exactly one address). Strips display name (quoted names may contain commas), angle brackets and comments.
- `parseReferences(value)` → ordered, de-duplicated message ids without angle brackets (ids stay case-sensitive).
- `normalizeSubject(subject)` → repeated `Re:`/`Fwd:`/`Fw:`/`AW:`/`WG:` prefixes and leading `[list]` tags removed, whitespace collapsed.
- `resolveThread(message, knownThreads)` → `{ threadKey, source }`. Order: provider thread id; `In-Reply-To`, then `References` last to first; subject fallback only when the normalized subject matches, participants overlap and the candidate is within 30 days; otherwise a new key from the own `Message-ID` (`mid:<id>`) or a stable hash (`hash:<fnv1a>`).
- `matchRecordLinks(participants, recordEmails)` → every exact match; `ambiguous` is true when one address matches more than one record. Domain matching is not implemented.

This folder is wired into `mail/` and exported from `packages/core` in a later issue.
