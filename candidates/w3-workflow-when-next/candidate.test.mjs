// Focused synthetic test suite for W3 Candidate (MEP-1374)
// Tests Workflow WHEN Next control (#step3Btn, data-zcqa="triggerSubmit")
// Verifies exact matching, fail-closed unknown write semantics, stale lock invalidation,
// strict URL/host scope guards, timing, and clean rollback reversibility.

import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const patchPath = path.resolve(__dirname, "w3-workflow-when-next.patch");

// Prepare isolated sandbox to run tests against the patched code without touching production tools
const scratchDir = fs.mkdtempSync(
  path.join(process.env.PAPERCLIP_SCRATCH_DIR || os.tmpdir(), "w3-test-"),
);
const toolsCaptureDir = path.join(scratchDir, "tools", "capture");
fs.mkdirSync(toolsCaptureDir, { recursive: true });

const originalToolsDir = path.join(process.env.HOME, "Desktop/mepcity-research/tools/capture");

fs.copyFileSync(
  path.join(originalToolsDir, "write-window.mjs"),
  path.join(toolsCaptureDir, "write-window.mjs"),
);
fs.copyFileSync(
  path.join(originalToolsDir, "write-window-observe.mjs"),
  path.join(toolsCaptureDir, "write-window-observe.mjs"),
);

// Baseline copy for reversibility verification
const baselineObserveCode = fs.readFileSync(
  path.join(toolsCaptureDir, "write-window-observe.mjs"),
  "utf8",
);

// Apply candidate patch to write-window-observe.mjs in scratch
execSync(`patch -p1 --batch -d "${scratchDir}" < "${patchPath}"`, { stdio: "pipe" });

// Dynamically import patched module
const patchedModuleUrl = pathToFileURL(path.join(toolsCaptureDir, "write-window-observe.mjs")).href;
const { ObserveWindow, validateObservePolicy } = await import(patchedModuleUrl);

// Test fixtures and policy
const policy = validateObservePolicy({
  version: 2,
  windowIssueId: "30aa52e6-35bd-498a-8d6b-fa9b58842b51",
  notBefore: "2026-10-25T00:00:00Z",
  expiresAt: "2026-10-26T04:00:00Z",
  boardRecipient: "board@example.com",
  host: "crm.example.com",
  objectPrefix: "ZZTEST-",
  modules: ["Automation", "Customization"],
});

const now = Date.parse("2026-10-25T14:00:00Z");
const mem = () => {
  let v;
  return {
    read: () => {
      throw Object.assign(new Error("x"), { code: "ENOENT" });
    },
    write: (x) => {
      v = x;
    },
    get: () => v,
  };
};

const mk = (opts = {}) => {
  const store = mem();
  return new ObserveWindow(
    {
      policy,
      policyHash: "test-hash",
      issueId: "30aa52e6-35bd-498a-8d6b-fa9b58842b51",
      agentId: "crm-analyst",
    },
    store,
    { now: () => opts.now ?? now, zzName: "zzName" in opts ? opts.zzName : "ZZTEST-W3-Workflow" },
  );
};

const makePage = (opts = {}) => ({
  url: () =>
    opts.url !== undefined
      ? opts.url
      : "https://crm.example.com/crm/org1/settings/workflow-rules/create?module=Leads",
  frames: () => [
    {
      evaluate: async () => (opts.nameVisible !== undefined ? opts.nameVisible : true),
    },
  ],
});

const req = (method, p, body, contentType = "application/json") => ({
  method,
  url: `https://crm.example.com${p}`,
  body,
  bodyBuffer: body ? Buffer.from(body) : null,
  contentType,
});

const defaultAttrs = "step3Btn triggerSubmit primary lyte-button => check(event) ;";
const defaultSelector = "#step3Btn";
const defaultText = "Sonraki";

test("W3 Candidate: exact #step3Btn control in visible Workflow builder with visible ZZTEST name is allowed", async () => {
  const w = mk();
  const res = await w.click({
    selector: defaultSelector,
    text: defaultText,
    attrs: defaultAttrs,
    scope: {},
    page: makePage(),
  });
  assert.equal(res, true, "Workflow WHEN Next click must be allowed for exact control");
});

test("W3 Candidate: supported selector variations (#step3Btn[data-zcqa='triggerSubmit'] and English 'Next')", async () => {
  const w1 = mk();
  assert.equal(
    await w1.click({
      selector: '#step3Btn[data-zcqa="triggerSubmit"]',
      text: "Sonraki",
      attrs: defaultAttrs,
      scope: {},
      page: makePage(),
    }),
    true,
  );

  const w2 = mk();
  assert.equal(
    await w2.click({
      selector: '[data-zcqa="triggerSubmit"]#step3Btn',
      text: "Next",
      attrs: defaultAttrs,
      scope: {},
      page: makePage(),
    }),
    true,
  );
});

test("W3 Candidate: unknown write semantics remain fail-closed (NO write lock is granted on fresh window)", async () => {
  const w = mk();
  const clicked = await w.click({
    selector: defaultSelector,
    text: defaultText,
    attrs: defaultAttrs,
    scope: {},
    page: makePage(),
  });
  assert.equal(clicked, true);

  // An outgoing POST request dispatched after the click must be blocked with "click-lock"
  const postReq = req("POST", "/crm/v4/Automation/Workflows", '{"name":"ZZTEST-W3-Workflow"}');
  const postDecision = await w.dispatch(postReq, async () => ({ status: 200 }));
  assert.equal(postDecision.allow, false, "Unknown write must be blocked");
  assert.equal(postDecision.reason, "click-lock", "Blocked reason must be click-lock");

  // Subsequent PUT, PATCH, and DELETE mutations must also fail closed
  const putReq = req("PUT", "/crm/v4/Automation/Workflows/123", '{"name":"ZZTEST-W3-Workflow"}');
  const putDecision = await w.dispatch(putReq, async () => ({ status: 200 }));
  assert.equal(putDecision.allow, false);
  assert.equal(putDecision.reason, "click-lock");

  const patchReq = req(
    "PATCH",
    "/crm/v4/Automation/Workflows/123",
    '{"name":"ZZTEST-W3-Workflow"}',
  );
  const patchDecision = await w.dispatch(patchReq, async () => ({ status: 200 }));
  assert.equal(patchDecision.allow, false);
  assert.equal(patchDecision.reason, "click-lock");

  const deleteReq = req("DELETE", "/crm/v4/Automation/Workflows/123", null);
  const deleteDecision = await w.dispatch(deleteReq, async () => ({ status: 200 }));
  assert.equal(deleteDecision.allow, false);
  assert.equal(deleteDecision.reason, "click-lock");

  // Safe read requests (GET) continue to pass
  const getReq = req("GET", "/crm/v4/Automation/Workflows", null);
  const getDecision = await w.dispatch(getReq, async () => ({ status: 200, body: [] }));
  assert.equal(getDecision.allow, true);
  assert.equal(getDecision.read, true);
});

test("W3 Candidate: QA Finding 1 — prior lock invalidation: locking click followed by WHEN Next clears lock and fails subsequent mutations closed with click-lock", async () => {
  const w = mk();
  const assignmentAttrs = "SaveRule primary lyte-button => check(event) ; crm-create-as";

  // 1. Perform an Assignment rule "Sonraki" click, which acquires a 60-second write lock (#lock())
  const assignClicked = await w.click({
    selector: '[data-zcqa="SaveRule"]',
    text: "Sonraki",
    attrs: assignmentAttrs,
    scope: {},
    page: makePage(),
  });
  assert.equal(assignClicked, true, "Assignment Sonraki should succeed and acquire lock");

  // 2. Perform Workflow WHEN Next click in the same window
  const whenClicked = await w.click({
    selector: defaultSelector,
    text: defaultText,
    attrs: defaultAttrs,
    scope: {},
    page: makePage(),
  });
  assert.equal(whenClicked, true, "Workflow WHEN Next should be allowed");

  // 3. Verify that the previous lock was completely invalidated (state.click = null).
  // All subsequent mutations (POST, PUT, PATCH, DELETE) must fail closed with "click-lock"!
  const postReq = req("POST", "/crm/v4/Automation/Workflows", '{"name":"ZZTEST-W3-Workflow"}');
  const postRes = await w.dispatch(postReq, async () => ({ status: 200 }));
  assert.equal(postRes.allow, false, "POST must be blocked after WHEN Next");
  assert.equal(postRes.reason, "click-lock", "POST must fail closed with click-lock");

  const putReq = req("PUT", "/crm/v4/Automation/Workflows/123", '{"name":"ZZTEST-W3-Workflow"}');
  const putRes = await w.dispatch(putReq, async () => ({ status: 200 }));
  assert.equal(putRes.allow, false, "PUT must be blocked after WHEN Next");
  assert.equal(putRes.reason, "click-lock", "PUT must fail closed with click-lock");

  const patchReq = req(
    "PATCH",
    "/crm/v4/Automation/Workflows/123",
    '{"name":"ZZTEST-W3-Workflow"}',
  );
  const patchRes = await w.dispatch(patchReq, async () => ({ status: 200 }));
  assert.equal(patchRes.allow, false, "PATCH must be blocked after WHEN Next");
  assert.equal(patchRes.reason, "click-lock", "PATCH must fail closed with click-lock");

  const deleteReq = req("DELETE", "/crm/v4/Automation/Workflows/123", null);
  const deleteRes = await w.dispatch(deleteReq, async () => ({ status: 200 }));
  assert.equal(deleteRes.allow, false, "DELETE must be blocked after WHEN Next");
  assert.equal(deleteRes.reason, "click-lock", "DELETE must fail closed with click-lock");
});

test("W3 Candidate: rejects when registered ZZTEST name is not visible on page", async () => {
  const w = mk();
  const res = await w.click({
    selector: defaultSelector,
    text: defaultText,
    attrs: defaultAttrs,
    scope: {},
    page: makePage({ nameVisible: false }),
  });
  assert.equal(res, false, "Click must be rejected when ZZTEST name is not visible on page");
});

test("W3 Candidate: rejects when no ZZTEST name is registered", async () => {
  const w = mk({ zzName: undefined });
  const res = await w.click({
    selector: defaultSelector,
    text: defaultText,
    attrs: defaultAttrs,
    scope: {},
    page: makePage(),
  });
  assert.equal(res, false, "Click must be rejected without active registered ZZTEST name");
});

test("W3 Candidate: QA Finding 2a — page scope rejects non-policy host even with workflow-rules path", async () => {
  const foreignHosts = [
    "https://evil.com/crm/org1/settings/workflow-rules",
    "https://other-crm.example.com/settings/workflow-rules/create",
    "https://crm.example.org/crm/org1/settings/workflow-rules",
  ];

  for (const url of foreignHosts) {
    const w = mk();
    const res = await w.click({
      selector: defaultSelector,
      text: defaultText,
      attrs: defaultAttrs,
      scope: {},
      page: makePage({ url }),
    });
    assert.equal(
      res,
      false,
      `Click on non-policy host '${url}' must be rejected with click-page-scope`,
    );
  }
});

test("W3 Candidate: QA Finding 2b — page scope rejects query string trick (/settings/layouts?returnTo=/settings/workflow-rules)", async () => {
  const queryTrickUrls = [
    "https://crm.example.com/crm/org1/settings/layouts?returnTo=/settings/workflow-rules",
    "https://crm.example.com/crm/org1/settings/assignment-rules?next=/settings/workflow-rules",
    "https://crm.example.com/leads?module=settings/workflow-rules",
  ];

  for (const url of queryTrickUrls) {
    const w = mk();
    const res = await w.click({
      selector: defaultSelector,
      text: defaultText,
      attrs: defaultAttrs,
      scope: {},
      page: makePage({ url }),
    });
    assert.equal(
      res,
      false,
      `Click on query-trick URL '${url}' must be rejected with click-page-scope`,
    );
  }
});

test("W3 Candidate: rejects invalid or unparseable URLs", async () => {
  const invalidUrls = ["://invalid-url", "not-a-url", ""];

  for (const url of invalidUrls) {
    const w = mk();
    const res = await w.click({
      selector: defaultSelector,
      text: defaultText,
      attrs: defaultAttrs,
      scope: {},
      page: makePage({ url }),
    });
    assert.equal(res, false, `Click on invalid URL '${url}' must be rejected`);
  }
});

test("W3 Candidate: rejects foreign or non-workflow routes", async () => {
  const nonWorkflowUrls = [
    "https://crm.example.com/crm/org1/settings/assignment-rules",
    "https://crm.example.com/crm/org1/settings/layouts",
    "https://crm.example.com/crm/org1/leads",
    "https://crm.example.com/crm/org1/settings/customization",
    "https://crm.example.com/crm/org1/settings/workflow-rules-foreign",
    "https://crm.example.com/crm/org1/evil/settings/workflow-rules",
  ];

  for (const url of nonWorkflowUrls) {
    const w = mk();
    const res = await w.click({
      selector: defaultSelector,
      text: defaultText,
      attrs: defaultAttrs,
      scope: {},
      page: makePage({ url }),
    });
    assert.equal(res, false, `Click on page '${url}' must be rejected with click-page-scope`);
  }
});

test("W3 Candidate: allows valid workflow-rules routes across formats", async () => {
  const validWorkflowUrls = [
    "https://crm.example.com/crm/org1/settings/workflow-rules/create?module=Leads",
    "https://crm.example.com/crm/org1/settings/workflow-rules",
    "https://crm.example.com/crm/12345678/settings/workflow-rules/create",
    "https://crm.example.com/settings/workflow-rules",
    "https://crm.example.com/settings/workflow-rules/create",
  ];

  for (const url of validWorkflowUrls) {
    const w = mk();
    const res = await w.click({
      selector: defaultSelector,
      text: defaultText,
      attrs: defaultAttrs,
      scope: {},
      page: makePage({ url }),
    });
    assert.equal(res, true, `Valid workflow route '${url}' must be allowed`);
  }
});

test("W3 Candidate: rejects foreign controls with same name or selector alias", async () => {
  const invalidSelectors = [
    "#otherBtn",
    "button:has-text('Sonraki')",
    "#step3Btn >> nth=0",
    "button#step3Btn",
    "[data-zcqa='triggerSubmit']",
  ];

  for (const selector of invalidSelectors) {
    const w = mk();
    const res = await w.click({
      selector,
      text: defaultText,
      attrs: defaultAttrs,
      scope: {},
      page: makePage(),
    });
    assert.equal(res, false, `Selector '${selector}' must be rejected`);
  }
});

test("W3 Candidate: rejects wrong attributes (missing step3Btn or triggerSubmit)", async () => {
  const invalidAttrs = [
    "step3Btn primary lyte-button", // missing triggerSubmit
    "triggerSubmit primary lyte-button", // missing step3Btn
    "primary lyte-button",
  ];

  for (const attrs of invalidAttrs) {
    const w = mk();
    const res = await w.click({
      selector: defaultSelector,
      text: defaultText,
      attrs,
      scope: {},
      page: makePage(),
    });
    assert.equal(res, false, `Attrs '${attrs}' must be rejected`);
  }
});

test("W3 Candidate: rejects text containing dangerous actions or non-Next labels", async () => {
  const invalidTexts = [
    "Sonraki Delete", // dangerous click keyword
    "Sonraki Kaydet",
    "Previous",
    "Cancel",
    "İptal",
  ];

  for (const text of invalidTexts) {
    const w = mk();
    const res = await w.click({
      selector: defaultSelector,
      text,
      attrs: defaultAttrs,
      scope: {},
      page: makePage(),
    });
    assert.equal(res, false, `Text '${text}' must be rejected`);
  }
});

test("W3 Candidate: rejects when observation window has expired", async () => {
  // EXPIRES_AT is 2026-10-26T04:00:00Z
  const expiredTime = Date.parse("2026-10-26T04:00:01Z");
  const w = mk({ now: expiredTime });
  const res = await w.click({
    selector: defaultSelector,
    text: defaultText,
    attrs: defaultAttrs,
    scope: {},
    page: makePage(),
  });
  assert.equal(res, false, "Click after window expiration must be rejected");
});

test("W3 Candidate: rejects when observation window has not started", async () => {
  // notBefore is 2026-10-25T00:00:00Z
  const beforeTime = Date.parse("2026-10-24T23:59:59Z");
  const w = mk({ now: beforeTime });
  const res = await w.click({
    selector: defaultSelector,
    text: defaultText,
    attrs: defaultAttrs,
    scope: {},
    page: makePage(),
  });
  assert.equal(res, false, "Click before window start must be rejected");
});

test("W3 Candidate: Assignment rule Sonraki and Save controls retain existing behavior", async () => {
  const w = mk();
  const yes = makePage();
  const assignmentAttrs = "SaveRule primary lyte-button => check(event) ; crm-create-as";

  // Assignment wizard Sonraki still takes lock as before
  assert.equal(
    await w.click({
      selector: '[data-zcqa="SaveRule"]',
      text: "Sonraki",
      attrs: assignmentAttrs,
      scope: {},
      page: yes,
    }),
    true,
  );

  // Save control with visible registered name still takes lock as before
  const scopeMock = {
    locator: () => ({ count: async () => 1, first: () => ({ evaluate: async () => true }) }),
  };
  assert.equal(
    await w.click({
      selector: "#saveBtn",
      text: "Save",
      attrs: "primary",
      scope: scopeMock,
      page: yes,
    }),
    true,
  );
});

test("W3 Candidate: QA Finding 3 — reversibility: reverse patch (-R) restores clean baseline byte-for-byte", () => {
  const testSandbox = fs.mkdtempSync(
    path.join(process.env.PAPERCLIP_SCRATCH_DIR || os.tmpdir(), "w3-revert-test-"),
  );
  try {
    const sandboxToolsDir = path.join(testSandbox, "tools", "capture");
    fs.mkdirSync(sandboxToolsDir, { recursive: true });
    fs.writeFileSync(
      path.join(sandboxToolsDir, "write-window-observe.mjs"),
      baselineObserveCode,
      "utf8",
    );

    // 1. Forward patch
    execSync(`patch -p1 --batch -d "${testSandbox}" < "${patchPath}"`, { stdio: "pipe" });
    const patchedCode = fs.readFileSync(
      path.join(sandboxToolsDir, "write-window-observe.mjs"),
      "utf8",
    );
    assert(
      patchedCode.includes("W3 Candidate (MEP-1374)"),
      "Candidate marker must be present after forward patch",
    );

    // 2. Reverse patch (-R)
    execSync(`patch -p1 -R --batch -d "${testSandbox}" < "${patchPath}"`, { stdio: "pipe" });
    const revertedCode = fs.readFileSync(
      path.join(sandboxToolsDir, "write-window-observe.mjs"),
      "utf8",
    );

    // 3. Assert zero candidate trace and byte-for-byte identity
    assert(
      !revertedCode.includes("W3 Candidate (MEP-1374)"),
      "Candidate marker must be completely gone after reverse patch",
    );
    assert.equal(
      revertedCode,
      baselineObserveCode,
      "Reverted code must match clean baseline byte-for-byte",
    );
  } finally {
    fs.rmSync(testSandbox, { recursive: true, force: true });
  }
});
