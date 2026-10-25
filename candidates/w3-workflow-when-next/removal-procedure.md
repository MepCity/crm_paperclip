# W3 Workflow WHEN Next: Expiry & Removal Procedure

**Candidate Identifier**: MEP-1374 / W3 Candidate  
**Target File**: `tools/capture/write-window-observe.mjs`  
**Hard Expiry Timestamp**: `2026-10-26T04:00:00Z` (Monday, 26 October 2026, 07:00 Istanbul Time)  

---

## 1. Automatic Expiration (Fail-Closed)

The candidate code relies directly on `ObserveWindow.#open()`:
```javascript
#open() {
  return this.#now() >= Date.parse(this.#state.policy.notBefore) && this.#now() < Date.parse(EXPIRES_AT) && !this.#state.expired;
}
```
At `2026-10-26T04:00:00Z`:
1. `EXPIRES_AT` is reached.
2. `ObserveWindow.click()` immediately evaluates `if (!this.#open()) return this.#deny("click-window-closed");`.
3. All write-window operations automatically lock down fail-closed. No further clicks, writes, or uploads can pass under any circumstances.

---

## 2. Manual Removal & Rollback Procedure

If the candidate patch was applied to `write-window-observe.mjs` during an approved observation session, it must be removed upon completion of the observation or when the window closes.

### Step 2.1: Reverse Patch Application
From the repository root (or worktree):
```bash
# Using patch in reverse mode (-R)
patch -p1 -R -d "$HOME/Desktop/mepcity-research" < candidates/w3-workflow-when-next/w3-workflow-when-next.patch
```

Alternatively, from the capture tools directory:
```bash
cd "$HOME/Desktop/mepcity-research/tools/capture"
# Revert write-window-observe.mjs to clean baseline
git checkout -- write-window-observe.mjs
```

### Step 2.2: Verify Clean Baseline
Confirm that no diff remains in the research capture workspace:
```bash
cd "$HOME/Desktop/mepcity-research/tools/capture"
git status --porcelain write-window-observe.mjs
# Output must be empty.
```

### Step 2.3: Execute Full Baseline Test Suite
Run the standard capture tools unit tests to ensure baseline integrity:
```bash
node "$HOME/Desktop/mepcity-research/tools/capture/write-window-observe.test.mjs"
# All 22 baseline tests must pass.
```

### Step 2.4: Journal & State Cleanup Audit
1. Inspect `write-window/changes.md` and ensure all `ZZTEST-` entries created during observation have been restored / cleaned up.
2. Verify that `ObserveWindow.openItems()` reports empty `records` and `settings`:
```bash
node -e '
import { readFileSync } from "node:fs";
const journal = JSON.parse(readFileSync(process.env.HOME + "/Desktop/mepcity-research/write-window/journal.json", "utf8"));
console.assert(journal.records.filter(r => !r.cleaned).length === 0, "Uncleaned records exist!");
console.assert(journal.settings.filter(s => !s.restored).length === 0, "Unrestored settings exist!");
console.log("Journal cleanup audit passed.");
'
```

---

## 3. Summary of Safety Invariants

- **No lingering code**: Once reverted, the production capture tool contains zero trace of the candidate exception.
- **Fail-closed default**: If manual removal is delayed, automatic time-based lockout prevents any live execution past 04:00 UTC / 07:00 Istanbul.
