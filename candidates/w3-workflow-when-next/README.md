# MEP-1374: W3 Workflow WHEN Next Candidate Exception & Patch

## Overview

This directory contains the complete offline preparation deliverable for **MEP-1374**, pursuant to the board-accepted W3 continuation proposal (MEP-1345, revision `689b731a-8bc7-4747-91ef-540f8b1a2104`).

This candidate proposal is prepared in offline mode. **No production capture tools, policies, or journals have been modified.** Live installation and observation require independent review and approval by Grok QA, Platform Lead, and CTO, followed by an explicit board activation decision.

---

## Deliverables Index

1. **[Candidate Exception Specification](w3-workflow-when-next-exception-spec.md)**:
   Comprehensive specification detailing the targeted control (`#step3Btn[data-zcqa="triggerSubmit"]`), scope boundaries, fail-closed unknown write semantics, activation predicates, and review chain.
2. **[Unified Diff Patch](w3-workflow-when-next.patch)**:
   Isolated unified diff against `tools/capture/write-window-observe.mjs`.
3. **[Synthetic Test Suite](candidate.test.mjs)**:
   Node.js test suite exercising 12 targeted unit test cases against the patched module in an isolated sandbox.
4. **[Test Results](test-results.txt)**:
   Execution log showing 12/12 passing unit tests in 8.7 ms.
5. **[Expiry & Removal Procedure](removal-procedure.md)**:
   Timeline (hard expiration at Monday 2026-10-26 07:00 Istanbul / 04:00 UTC) and step-by-step patch rollback and verification procedure.

---

## Key Safety Invariants

- **Exact Control Match**: Targets only `#step3Btn` with attribute `data-zcqa="triggerSubmit"` and text `Next` / `Sonraki`.
- **Context Lock**: Requires active W3 window, visible registered test name (`ZZTEST-W3-Workflow`), and strict URL matching `/\/settings\/workflow-rules(\/|\?|#|$)/i`.
- **Fail-Closed Write Semantics**: Next is **NOT** classified as non-persistent, and **NO write lock is granted**. Any attempt to send a POST, PUT, PATCH, or DELETE mutation fails closed with `"click-lock"`.
- **Zero Scope Creep**: Layouts (PageLayout), Assignment rules, other modules, and existing records remain strictly excluded.
