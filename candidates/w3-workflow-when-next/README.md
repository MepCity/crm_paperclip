# MEP-1374: W3 Workflow WHEN Next Candidate Exception & Patch

## Overview

This directory contains the complete offline preparation deliverable for **MEP-1374**, pursuant to the board-accepted W3 continuation proposal (MEP-1345, revision `689b731a-8bc7-4747-91ef-540f8b1a2104`).

This candidate proposal is prepared in offline mode. **No production capture tools, policies, or journals have been modified.** Live installation and observation require independent review and approval by Grok QA, Platform Lead, and CTO, followed by an explicit board activation decision.

---

## Deliverables Index

1. **[Candidate Exception Specification](w3-workflow-when-next-exception-spec.md)**:
   Comprehensive specification detailing the targeted control (`#step3Btn[data-zcqa="triggerSubmit"]`), scope boundaries, fail-closed unknown write semantics, stale lock invalidation (`state.click = null`), activation predicates, and review chain.
2. **[Unified Diff Patch](w3-workflow-when-next.patch)**:
   Isolated unified diff against `tools/capture/write-window-observe.mjs`.
3. **[Synthetic Test Suite](candidate.test.mjs)**:
   Node.js test suite exercising 18 targeted unit test cases against the patched module in an isolated sandbox, including stale lock invalidation, parsed URL object host/pathname guards, query trick rejection, and reverse patch verification.
4. **[Test Results](test-results.txt)**:
   Execution log showing 18/18 passing unit tests in ~39 ms.
5. **[Expiry & Removal Procedure](removal-procedure.md)**:
   Timeline (hard expiration at Monday 2026-10-26 07:00 Istanbul / 04:00 UTC) and step-by-step patch rollback and reverse-patch verification procedure for non-git capture workspaces.

---

## Key Safety Invariants

- **Exact Control Match**: Targets only `#step3Btn` with attribute `data-zcqa="triggerSubmit"` and text `Next` / `Sonraki`.
- **Context Lock**: Requires active W3 window, visible registered test name (`ZZTEST-W3-Workflow`), and strict URL matching `policy.host` and pathname `/^(\/crm\/[^/]+)?\/settings\/workflow-rules(\/.*)?$/i`.
- **Fail-Closed Write Semantics & Stale Lock Invalidation**: Next is **NOT** classified as non-persistent, and **NO write lock is granted**. Any prior click lock is explicitly invalidated (`state.click = null`). Any attempt to send a POST, PUT, PATCH, or DELETE mutation fails closed with `"click-lock"`.
- **Clean Non-Git Removal**: Verified 100% reversible via `patch -p1 -R` back to baseline byte-for-byte.
- **Zero Scope Creep**: Layouts (PageLayout), Assignment rules, other modules, and existing records remain strictly excluded.
