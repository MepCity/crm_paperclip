# W3 Workflow WHEN Next: Candidate Exception Specification

**Issue**: MEP-1374  
**Parent Task**: MEP-1345 (Plan Revision `689b731a-8bc7-4747-91ef-540f8b1a2104`)  
**Author**: Gemini Engineer 2  
**Audience**: Grok QA, Platform Lead, CTO, Board  
**Status**: Isolated Offline Candidate Proposal (Preparation Only — Not Installed, Not Activated)  
**Window Cut-Off**: Monday 2026-10-26 07:00 Istanbul (04:00 UTC)  

---

## 1. Executive Summary & Purpose

Under the board-approved write-observation window protocol for Module 11 (Automation), live capture sequence MEP-1345 established a reliable SPA navigation route to Workflow Rules via Setup navigation (`/settings/assignment-rules` -> `[data-zcqa="automate_workflow"]`), populated the Workflow Rules list, and opened the unsaved Date/Time trigger builder on `Leads`. Throughout eight live captures, zero unauthorized writes occurred (cumulative `allowedWrites = 1`, stemming from an earlier cleaned Assignment create; open items contain zero Workflow objects or dirty settings).

However, in capture `w3-workflow-date-next-boundary`, the enabled WHEN card **Next** button (`#step3Btn`, `data-zcqa="triggerSubmit"`, visible text `"Sonraki"`) was skipped because its attributes match the existing `DANGEROUS_TEXT` attribute filter:
```
dangerous attribute: step3Btn triggerSubmit primary lyte-button => check(event) ;
```
The token `triggerSubmit` contains substring `submit`, triggering the fail-closed attribute guard. The complete server-side effects and potential draft persistence of clicking Next remain unverified.

Per the board-accepted W3 continuation plan (revision `689b731a-8bc7-4747-91ef-540f8b1a2104`), this specification defines **ONE bounded, reviewable candidate exception** and an **isolated patch**.

> [!IMPORTANT]
> **Strict Preparation Boundary**: This specification and its accompanying patch do **NOT** install code into the production capture tool, do **NOT** modify active guards or policies, and do **NOT** authorize live write execution. Installation and execution require independent review by Grok QA, lead approval by Platform Lead, and final authorization by the CTO and Board.

---

## 2. Scope Boundaries & Explicit Exclusions

| Domain | In Scope? | Boundary Justification |
| :--- | :---: | :--- |
| **Workflow WHEN Next Control** | **YES** | Strictly targets `#step3Btn[data-zcqa="triggerSubmit"]` on the visible Workflow builder. |
| **Fail-Closed Write Semantics** | **YES** | Next is **NOT** classified as non-persistent; **NO** write lock is granted; stale locks are invalidated. |
| **Layouts Module** | **NO (EXCLUDED)** | PageLayout POST payload structure remains unobserved and cannot be guessed; no endpoint exception is proposed. |
| **Assignment Rules** | **NO (EXCLUDED)** | Retains existing verified cleanup state; no modifications to Assignment rules. |
| **Save / Activate / Create / Delete** | **NO (UNCHANGED)** | All other controls retain existing strict guards, registered record verification, and durable journaling. |
| **Live Production Tools** | **NO (UNCHANGED)** | `~/Desktop/mepcity-research/tools/capture/` remains strictly unmodified in this deliverable. |

---

## 3. Fail-Closed Unknown Write Semantics & Stale Lock Invalidation

The core safety dilemma of the Workflow builder WHEN Next control is that **server persistence and wire effects are unknown**:
- In Assignment Rules, the wizard's first "Next" triggered an unexpected server create request.
- In Workflow Rules step 1 (Rule creation modal), the first "Next" was observed to be a pure client-side transition to the full-page builder without server mutation (W3-WF6).
- For WHEN card Next (`#step3Btn`), it is unknown whether the frontend performs an in-memory wizard progression or dispatches an asynchronous rule draft POST/PUT.

### Candidate Architectural Decisions:
1. **Never Assume Non-Persistence**: Next is **not** treated as an open-allowed read or generic navigation step. It is subject to full write-window governance.
2. **Never Grant Unverified Write Lock**: Unlike the Assignment rule exception which granted a click lock (`this.#lock()`), this candidate **strictly does NOT call `this.#lock()`**.
3. **Explicit Stale Lock Invalidation (`this.#state.click = null`)**:
   - In a session where an earlier control (such as Assignment rule wizard "Sonraki" or a Save button) acquired a temporary write lock, clicking WHEN Next **explicitly clears the lock** (`this.#state.click = null`).
   - This ensures that a lingering lock from a prior action can never leak write authorization into subsequent workflow mutations.
4. **Fail-Closed Network Guard**:
   - If the Next click is purely a client-side transition, the DOM advances to the Criteria/Actions stage without dispatching network writes.
   - If the Next click attempts any network mutation (POST, PUT, PATCH, DELETE), `ObserveWindow.evaluate()` detects that `state.click` is `null` (no lock granted) and immediately blocks the mutation with reason `"click-lock"`. The blocked attempt is recorded in `blockedRequests` and durable journal, preventing any dirty or unrestorable writes from hitting the reference CRM.

---

## 4. Activation Criteria & Predicate Rules

For the candidate exception to permit a click, all of the following conditions must simultaneously evaluate to `true`:

1. **Active Window Status**:
   - Current time must satisfy: `now >= notBefore` and `now < 2026-10-26T04:00:00Z` (07:00 Istanbul time).
   - Window must not be expired or faulted (`!this.#state.expired`).
2. **Active Registered Test Identifier**:
   - `this.#state.zzName` must be present, must start with `ZZTEST-`, and must be an active registered test name (e.g. `ZZTEST-W3-Workflow`).
3. **Page Visibility Verification**:
   - `this.#nameVisible(page, st.zzName)` must return `true`, verifying that the registered test name is physically visible within the document or input values of the active page frames.
4. **Strict URL Object & Host Scope**:
   - The page URL is parsed via `new URL(rawUrl)`.
   - Host check: `parsedUrl.host === st.policy.host`. Rejects non-policy hosts (even with matching pathnames) with `click-page-scope`.
   - Pathname check: `parsedUrl.pathname` must match `/^(\/crm\/[^/]+)?\/settings\/workflow-rules(\/.*)?$/i`.
   - Rejects other modules, query string embedding tricks (e.g. `/settings/layouts?returnTo=/settings/workflow-rules`), and unparseable URLs with `click-page-scope`.
5. **Exact Control Selector**:
   - The selector must strictly equal one of:
     - `#step3Btn`
     - `#step3Btn[data-zcqa="triggerSubmit"]`
     - `[data-zcqa="triggerSubmit"]#step3Btn`
   - Positional selectors (e.g., `>> nth=0`), tag aliases (`button.next`), or generic queries are strictly rejected.
6. **Exact Control Attributes**:
   - Element attributes must contain both `\bstep3Btn\b` and `\btriggerSubmit\b`.
   - Controls missing either attribute are rejected.
7. **Exact Control Label**:
   - Control text must match `/^(Next|Sonraki)$/i`.
   - Any labels with appended or foreign text (e.g., `Sonraki Kaydet`, `Sonraki Delete`) are rejected.
8. **Dangerous Keyword Filter**:
   - Must not contain any keyword matching `DANGEROUS_CLICK` (e.g., `delete`, `mass`, `export`, etc.).

---

## 5. Candidate Code Implementation

The exact diff to be added to `tools/capture/write-window-observe.mjs` inside `ObserveWindow.click`:

```javascript
    // W3 Candidate (MEP-1374): Workflow WHEN Next control (#step3Btn, data-zcqa="triggerSubmit").
    // Scoped strictly to the visible Workflow builder showing our registered ZZTEST- name, during active W3 window.
    // Unknown write semantics remain fail-closed: Next is not assumed to be non-persistent, but NO write lock is granted.
    // Any prior click lock is explicitly invalidated (state.click = null) so subsequent mutations fail closed with "click-lock".
    const isWfNextSelector = selector === "#step3Btn" || selector === '#step3Btn[data-zcqa="triggerSubmit"]' || selector === '[data-zcqa="triggerSubmit"]#step3Btn';
    if (/^(Next|Sonraki)$/i.test(text.trim()) && isWfNextSelector && /\bstep3Btn\b/.test(attrs) && /\btriggerSubmit\b/.test(attrs)) {
      if (!page || !(await this.#nameVisible(page, st.zzName))) return this.#deny("click-name-not-visible");
      const rawUrl = typeof page.url === "function" ? page.url() : (typeof page.url === "string" ? page.url : "");
      let parsedUrl;
      try {
        parsedUrl = new URL(rawUrl);
      } catch {
        return this.#deny("click-page-scope");
      }
      if (parsedUrl.host !== st.policy.host) return this.#deny("click-page-scope");
      if (!/^(\/crm\/[^/]+)?\/settings\/workflow-rules(\/.*)?$/i.test(parsedUrl.pathname)) return this.#deny("click-page-scope");
      this.#state.click = null;
      return true;
    }
```

---

## 6. Deliverable Artifacts

The following isolated deliverable files are provided in the repository worktree under `candidates/w3-workflow-when-next/`:

1. `w3-workflow-when-next-exception-spec.md`: This comprehensive specification.
2. `w3-workflow-when-next.patch`: Clean unified diff targeting `tools/capture/write-window-observe.mjs`.
3. `candidate.test.mjs`: Standalone synthetic test suite exercising 18 targeted unit test cases covering positive paths, stale lock invalidation, strict host and query string rejection, attribute validation, and reverse patch verification.
4. `test-results.txt`: Verifiable execution output proving 18/18 passing tests in ~39 ms.
5. `removal-procedure.md`: Step-by-step expiry timeline and patch rollback / reverse-patch removal instructions tailored for non-git research workspace.

---

## 7. Review & Approval Protocol

In accordance with Paperclip governance and MEP-1374 execution policy:
1. **Independent QA (Grok QA)**: Evaluates the updated candidate specification, patch, and test suite. Verifies that all requested changes (stale lock invalidation, URL object scoping, non-git removal procedure) are satisfied.
2. **Platform Lead**: Reviews the API/backend contract and security invariants (fail-closed click lock, URL bounds, ZZTEST name scoping).
3. **CTO Approval**: Evaluates cross-domain implications and alignment with the board-approved W3 plan (`689b731a-8bc7-4747-91ef-540f8b1a2104`).
4. **Activation Gate**: No deployment or live execution takes place without an explicit, separate board/lead activation decision.
