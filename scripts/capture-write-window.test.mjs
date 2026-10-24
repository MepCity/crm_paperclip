import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";

// Implementations stay in the local research workspace; this suite uses fake
// Paperclip responses and fake transports, never a browser or a remote service.
assert(process.env.CAPTURE_TOOL_DIR, "Set CAPTURE_TOOL_DIR to the capture tool directory");
const root = process.env.CAPTURE_TOOL_DIR;
const load = (name) => import(pathToFileURL(path.join(root, name)));
const {
  validatePolicy,
  verifyActivation,
  evaluate,
  evaluateClick,
  evaluateInput,
  durableStore,
  WriteWindow,
  parseWriteWindow,
  EXPIRES_AT,
} = await load("write-window.mjs");
const { installWindowGuards, initializeWindow } = await load("write-window-adapter.mjs");
const { parseSteps, requestBlockReason } = await load("guards.mjs");
const before = Date.parse(EXPIRES_AT) - 1000;
const clone = (v) => JSON.parse(JSON.stringify(v));
function policy() {
  const context = { selector: "#save-test", kind: "new", nameSelector: "#test-name" };
  const success = { path: "status", value: "success" };
  return {
    version: 1,
    windowIssueId: "window-test",
    notBefore: "2026-10-24T00:00:00Z",
    expiresAt: EXPIRES_AT,
    boardRecipient: "board@example.invalid",
    host: "crm.example.invalid",
    objectPrefix: "ZZTEST-",
    endpoints: [
      {
        key: "create-document",
        module: "Documents",
        method: "POST",
        path: "/crm/v1/Documents",
        operation: "create",
        body: { name: "$name" },
        responseId: "id",
        restoreKey: "delete-document",
        context,
        inputs: { "#test-name": "$name" },
        success,
      },
      {
        key: "update-document",
        module: "Documents",
        method: "PUT",
        path: "/crm/v1/Documents/:id",
        operation: "update",
        body: { name: "$name" },
        context: { selector: "#update-test", kind: "record", titleSelector: "#test-title" },
        success,
      },
      {
        key: "delete-document",
        module: "Documents",
        method: "DELETE",
        path: "/crm/v1/Documents/:id",
        operation: "delete",
        body: null,
        verify: { path: "/crm/v1/Documents/:id", status: 404 },
        context: { selector: "#delete-test", kind: "record", titleSelector: "#test-title" },
        success,
      },
      {
        key: "recycle-document",
        module: "Documents",
        method: "DELETE",
        path: "/crm/v1/recycle_bin/:id",
        operation: "recycle",
        body: null,
        verify: { path: "/crm/v1/recycle_bin/:id", status: 404 },
        context: { selector: "#purge-test", kind: "record", titleSelector: "#test-title" },
        success,
      },
      {
        key: "send-email",
        module: "Email",
        method: "POST",
        path: "/crm/v1/Email/:id/send",
        operation: "send",
        body: { to: ["$recipient"], cc: [], bcc: [], subject: "$name" },
        context: { selector: "#send-test", kind: "record", titleSelector: "#test-title" },
        success,
      },
      {
        key: "setting-test",
        module: "Customization",
        method: "PUT",
        path: "/crm/v1/settings/test",
        operation: "setting",
        body: { value: "$value" },
        read: { path: "/crm/v1/settings/test", value: "value" },
        context: { selector: "#setting-test", kind: "setting" },
        success,
      },
    ],
  };
}
function state() {
  return {
    verified: true,
    policy: validatePolicy(policy()),
    records: [
      { id: "test-id", name: "ZZTEST-one", module: "Documents", value: { name: "ZZTEST-one" } },
      { id: "mail-id", name: "ZZTEST-mail", module: "Email" },
    ],
    previous: [],
    click: { key: "create-document", id: "", expiresAt: before + 15000 },
  };
}
const create = () => ({
  method: "POST",
  url: "https://crm.example.invalid/crm/v1/Documents",
  contentType: "application/json",
  body: JSON.stringify({ name: "ZZTEST-one" }),
});
const success = () => ({ status: 200, body: { status: "success", id: "created-test" } });
function memoryStore() {
  let value;
  return {
    writes: [],
    read() {
      if (!value) throw Object.assign(new Error("missing"), { code: "ENOENT" });
      return clone(value);
    },
    write(v) {
      value = clone(v);
      this.writes.push(clone(v));
    },
  };
}
function instance(options = {}) {
  const store = options.store ?? memoryStore();
  const window = new WriteWindow(
    {
      policy: validatePolicy(policy()),
      policyHash: "test-hash",
      issueId: "window-test",
      agentId: "analyst-test",
    },
    store,
    { now: () => before, ...options },
  );
  return { window, store };
}
const scope = {
  locator: () => ({
    count: async () => 1,
    inputValue: async () => "ZZTEST-one",
    innerText: async () => "ZZTEST-one",
    fill: async () => {},
  }),
};
const click = (window) => window.click({ selector: "#save-test", text: "Save", attrs: "", scope });

test("boundary: T-1s allowed; T and later blocked; time is read for every request", () => {
  const s = state();
  assert.equal(evaluate(create(), s, before).allow, true);
  assert.equal(evaluate(create(), s, Date.parse(EXPIRES_AT)).reason, "window-expired");
  assert.equal(evaluate(create(), s, Date.parse(EXPIRES_AT) + 1).allow, false);
  assert.equal(evaluate(create(), s, before).allow, true);
  assert.equal(
    evaluate(create(), s, Date.parse(policy().notBefore) - 1).reason,
    "window-not-started",
  );
});
test("default mode and flags preserve original read-only guards", () => {
  assert.equal(parseWriteWindow(["--click", "#view"]).flags, null);
  assert.equal(evaluate(create(), null, before).reason, "read-only");
  assert(requestBlockReason("PUT", create().url));
  assert.equal(requestBlockReason("POST", "https://crm.example.invalid/crm/v1/coql"), null);
  assert.throws(() => parseSteps(["--fill", "#name", "ZZTEST-one"]));
  assert.throws(() => parseWriteWindow(["--write-window", "window-test"]));
  assert.throws(() => parseWriteWindow(["--write-window-restore"]));
  assert.throws(() =>
    parseWriteWindow([
      "--write-window",
      "window-test",
      "--agent",
      "engineer",
      "--write-window-policy",
      "policy.json",
    ]),
  );
  assert.equal(
    parseSteps(["--fill", "#name", "ZZTEST-one"], { writeWindow: true }).steps[0].type,
    "fill",
  );
});
test("GET/HEAD/OPTIONS stay readable; telemetry is blocked for every method", () => {
  for (const method of ["GET", "HEAD", "OPTIONS"])
    assert.equal(evaluate({ method, url: create().url }, null, before).allow, true);
  for (const method of ["GET", "POST", "PUT", "DELETE"])
    for (const route of ["/murphy/event", "/__internal/client_tracking", "/telemetry"])
      assert.equal(
        evaluate({ method, url: `https://crm.example.invalid${route}` }, state(), before).reason,
        "telemetry",
      );
});
test("unknown method, host, port, protocol, credentials, query, encoded path and endpoint fail closed", () => {
  const s = state();
  for (const url of [
    "http://crm.example.invalid/crm/v1/Documents",
    "https://other.example.invalid/crm/v1/Documents",
    "https://crm.example.invalid:444/crm/v1/Documents",
    "https://user@crm.example.invalid/crm/v1/Documents",
    `${create().url}?ids=test-id,foreign`,
    `${create().url}/%74est`,
    `${create().url}/missing`,
  ])
    assert.equal(evaluate({ ...create(), url }, s, before).allow, false, url);
  assert.equal(evaluate({ ...create(), method: "TRACE" }, s, before).reason, "method");
  assert.equal(evaluate({ ...create(), body: "broken" }, s, before).reason, "body-json");
  assert.equal(
    evaluate({ ...create(), contentType: "text/plain" }, s, before).reason,
    "content-type",
  );
});
test("body must be one exact supported shape with a test name and no bulk ids", () => {
  for (const body of [
    { name: "Existing" },
    { name: "ZZTEST-one", ids: ["test-id", "other"] },
    { name: "ZZTEST-one", extra: true },
    { name: ["ZZTEST-one"] },
    [{ name: "ZZTEST-one" }, { name: "ZZTEST-two" }],
  ])
    assert.equal(
      evaluate({ ...create(), body: JSON.stringify(body) }, state(), before).allow,
      false,
    );
});
test("update/delete/recycle target only the correct registry module", () => {
  const s = state();
  s.click = { key: "delete-document", id: "test-id", expiresAt: before + 1000 };
  const req = { method: "DELETE", url: `${create().url}/test-id` };
  assert.equal(evaluate(req, s, before).allow, true);
  assert.equal(
    evaluate({ ...req, url: `${create().url}/foreign` }, s, before).reason,
    "unregistered-id",
  );
  assert.equal(
    evaluate({ ...req, url: `${create().url}/mail-id` }, s, before).reason,
    "unregistered-id",
  );
  s.records[0].purged = true;
  assert.equal(evaluate(req, s, before).reason, "deleted-record");
});
test("exact board recipient only, including nested to/cc/bcc and extra attendees", () => {
  const s = state();
  s.click = { key: "send-email", id: "mail-id", expiresAt: before + 1000 };
  const req = {
    ...create(),
    url: "https://crm.example.invalid/crm/v1/Email/mail-id/send",
    body: JSON.stringify({
      to: ["board@example.invalid"],
      cc: [],
      bcc: [],
      subject: "ZZTEST-message",
    }),
  };
  assert.equal(evaluate(req, s, before).allow, true);
  for (const body of [
    { to: ["other@example.invalid"], cc: [], bcc: [], subject: "ZZTEST-message" },
    {
      to: ["board@example.invalid", "other@example.invalid"],
      cc: [],
      bcc: [],
      subject: "ZZTEST-message",
    },
    {
      to: ["board@example.invalid"],
      cc: ["other@example.invalid"],
      bcc: [],
      subject: "ZZTEST-message",
    },
    { to: ["board@example.invalid"], cc: [], bcc: [], subject: "ZZTEST-other@example.invalid" },
  ])
    assert.equal(evaluate({ ...req, body: JSON.stringify(body) }, s, before).allow, false);
});
test("settings require a captured previous value and an independent capability", () => {
  const s = state();
  s.click = { key: "setting-test", id: "", expiresAt: before + 1000 };
  const req = {
    ...create(),
    method: "PUT",
    url: "https://crm.example.invalid/crm/v1/settings/test",
    body: '{"value":true}',
  };
  assert.equal(evaluate(req, s, before).reason, "previous-value-missing");
  s.previous.push({ key: "setting-test", value: false });
  assert.equal(evaluate(req, s, before).allow, true);
  s.click = null;
  assert.equal(evaluate(req, s, before).reason, "click-lock");
});
test("policy is immutable and rejects malformed or dangerous allowlists", () => {
  const p = validatePolicy(policy());
  assert(Object.isFrozen(p.endpoints[0].body));
  assert.throws(() => {
    p.endpoints[0].path = "/other";
  });
  for (const mutate of [
    (p) => {
      p.expiresAt = "2026-10-27T04:00:00Z";
    },
    (p) => {
      p.endpoints[0].path = "/crm/v1/users";
    },
    (p) => {
      p.endpoints[0].path = "/crm/v1/Documents/mass_delete";
    },
    (p) => {
      p.endpoints[0].body = { ids: ["$id", "$id"] };
    },
    (p) => {
      p.endpoints[0].context.selector = ":nth-child(1)";
    },
    (p) => {
      p.endpoints[0].module = "Leads";
    },
    (p) => {
      p.endpoints = [];
    },
    (p) => {
      delete p.endpoints[0].restoreKey;
    },
    (p) => {
      p.endpoints[0].body.extra = "$arbitrary";
    },
  ]) {
    const value = policy();
    mutate(value);
    assert.throws(() => validatePolicy(value));
  }
});
function fakeApi(overrides = {}) {
  const p = policy();
  const me = {
    id: "analyst-test",
    companyId: "test-company",
    name: "CRM Analyst",
    role: "researcher",
    urlKey: "crm-analyst",
  };
  const issue = {
    id: "window-test",
    companyId: "test-company",
    status: "in_progress",
    assigneeAgentId: me.id,
    executionAgentNameKey: "crm analyst",
    executionRunId: "run-test",
    title: "Write window test",
    createdByUserId: "board-test",
    description: `\`\`\`capture-write-window-policy\n${JSON.stringify(p)}\n\`\`\``,
  };
  const comments = [{ authorUserId: "board-test", body: "BoardRecipient: board@example.invalid" }];
  return async (url) => {
    if (overrides.fail) throw new Error("offline");
    if (url === "/api/agents/me") return { ...me, ...overrides.me };
    if (url.includes("/comments")) return overrides.comments ?? comments;
    return { ...issue, ...overrides.issue };
  };
}
test("activation verifies API agent, running issue, issuer, published policy and board recipient", async () => {
  const options = {
    issueId: "window-test",
    agentFlag: "crm-analyst",
    rawPolicy: JSON.stringify(policy()),
    api: fakeApi(),
    now: before,
  };
  assert.equal((await verifyActivation(options)).agentId, "analyst-test");
  for (const api of [
    fakeApi({ fail: true }),
    fakeApi({ me: { urlKey: "engineer" } }),
    fakeApi({ issue: { assigneeAgentId: "other" } }),
    fakeApi({ issue: { status: "done" } }),
    fakeApi({ issue: { executionRunId: null } }),
    fakeApi({ issue: { createdByUserId: null } }),
    fakeApi({ issue: { title: "Ordinary issue" } }),
    fakeApi({ issue: { description: "" } }),
    fakeApi({
      comments: [{ authorAgentId: "impostor", body: "BoardRecipient: board@example.invalid" }],
    }),
    fakeApi({
      comments: [{ authorUserId: "board-test", body: "BoardRecipient: other@example.invalid" }],
    }),
  ])
    await assert.rejects(verifyActivation({ ...options, api }));
  await assert.rejects(verifyActivation({ ...options, issueId: "wrong-issue" }));
  await assert.rejects(verifyActivation({ ...options, rawPolicy: "{" }));
  await assert.rejects(verifyActivation({ ...options, now: Date.parse(EXPIRES_AT) }));
});
test("double lock: safe click does not authorize an unknown request and network permission requires click", () => {
  const s = state();
  s.click = null;
  const c = {
    selector: "#save-test",
    text: "Save",
    attrs: "",
    ruleKey: "create-document",
    name: "ZZTEST-one",
  };
  const decision = evaluateClick(c, s, before);
  assert.equal(decision.allow, true);
  assert.equal(evaluate(create(), s, before).reason, "click-lock");
  s.click = decision.capability;
  assert.equal(evaluate(create(), s, before).allow, true);
  assert.equal(evaluate({ ...create(), url: `${create().url}/import` }, s, before).allow, false);
  for (const text of ["Send to all", "Import", "Logout", "Save and publish"])
    assert.equal(evaluateClick({ ...c, text }, s, before).allow, false);
  assert.equal(evaluateClick({ ...c, name: "Existing" }, s, before).allow, false);
  assert.equal(evaluateClick(c, s, Date.parse(EXPIRES_AT)).allow, false);
});
test("form input is bounded to allowlisted selectors, test names and board recipient", () => {
  assert.equal(evaluateInput("#test-name", "ZZTEST-new", state(), before).allow, true);
  for (const [selector, value] of [
    ["#test-name", "Existing"],
    ["#other", "ZZTEST-new"],
    ["#test-name", "ZZTEST-other@example.invalid"],
  ])
    assert.equal(evaluateInput(selector, value, state(), before).allow, false);
});
test("write-ahead row is fsynced before send and updated after success; capability consumed once", async () => {
  const { window, store } = instance();
  assert.equal(await click(window), true);
  const result = await window.dispatch(create(), async () => {
    assert.equal(store.writes.at(-1).rows.at(-1).status, "prepared");
    return success();
  });
  assert.equal(result.allow, true);
  assert.equal(store.writes.at(-1).rows.at(-1).status, "succeeded");
  assert.equal(store.writes.at(-1).records[0].id, "created-test");
  assert.equal(window.metadata().allowedWrites, 1);
  assert.equal((await window.dispatch(create(), success)).reason, "click-lock");
});
test("journal and fsync failures prevent sending", async () => {
  const store = memoryStore();
  const { window } = instance({ store });
  await click(window);
  store.write = () => {
    throw new Error("disk");
  };
  let sent = false;
  assert.equal(
    (
      await window.dispatch(create(), async () => {
        sent = true;
        return success();
      })
    ).reason,
    "journal-unavailable",
  );
  assert.equal(sent, false);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "capture-wal-test-"));
  try {
    const file = path.join(dir, "changes.md");
    const io = {
      ...fs,
      fsyncSync() {
        throw new Error("fsync-failed");
      },
    };
    assert.throws(() => durableStore(file, io).write({ example: true }), /fsync-failed/);
    assert.equal(fs.existsSync(file), false);
    durableStore(file).write({ example: true });
    assert.deepEqual(durableStore(file).read(), { example: true });
  } finally {
    fs.rmSync(dir, { recursive: true });
  }
});
test("clock is checked again after journal sync and expiration is durable", async () => {
  let time = before;
  const store = memoryStore();
  const original = store.write.bind(store);
  const { window } = instance({ store, now: () => time });
  await click(window);
  store.write = (value) => {
    original(value);
    if (value.rows.some((r) => r.status === "prepared")) time = Date.parse(EXPIRES_AT);
  };
  let sent = false;
  assert.equal(
    (
      await window.dispatch(create(), async () => {
        sent = true;
        return success();
      })
    ).reason,
    "window-expired",
  );
  assert.equal(sent, false);
  assert.equal((await window.dispatch(create(), success)).reason, "window-expired");
  assert(store.writes.at(-1).rows.some((r) => r.action === "window-expired"));
});
test("unknown outcomes stop writes and reject restart; error responses never register ids", async () => {
  const { window, store } = instance();
  await click(window);
  await assert.rejects(
    window.dispatch(create(), async () => ({ status: 200, body: { status: "error" } })),
    /write-outcome-unknown/,
  );
  assert.equal(window.metadata().allowedWrites, 1);
  assert.equal(store.writes.at(-1).records.length, 0);
  assert.equal((await window.dispatch(create(), success)).reason, "journal-unavailable");
  assert.throws(() => instance({ store }), /journal-unresolved-write/);
});
test("HTTP failure is journaled without registering an object", async () => {
  const { window, store } = instance();
  await click(window);
  await window.dispatch(create(), async () => ({ status: 400, body: {} }));
  assert.equal(store.writes.at(-1).rows.at(-1).status, "failed");
  assert.equal(store.writes.at(-1).records.length, 0);
});
test("restore deletes and purges only registered objects, verifies each, then has no remaining actions", async () => {
  const { window, store } = instance();
  await click(window);
  await window.dispatch(create(), async () => success());
  const requests = [];
  await window.restore(
    async (request) => {
      requests.push(request);
      return success();
    },
    async () => true,
  );
  assert.deepEqual(
    requests.map((r) => r.key),
    ["delete-document", "recycle-document"],
  );
  assert(requests.every((r) => r.id === "created-test"));
  assert.equal(window.restorePlan().length, 0);
  assert.equal(store.writes.at(-1).records[0].purged, true);
  assert(store.writes.at(-1).rows.every((r) => r.restored));
});
test("restore verification failure stops and preserves an unresolved write for escalation", async () => {
  const { window, store } = instance();
  await click(window);
  await window.dispatch(create(), async () => success());
  await assert.rejects(
    window.restore(
      async () => success(),
      async () => false,
    ),
    /restore-verification-failed/,
  );
  assert.equal(store.writes.at(-1).records[0].deleted, false);
  assert.equal(store.writes.at(-1).rows.at(-1).status, "unknown");
});
test("restore is closed at the cutoff and does not emit a write", async () => {
  let time = before;
  const { window } = instance({ now: () => time });
  await click(window);
  await window.dispatch(create(), async () => success());
  time = Date.parse(EXPIRES_AT);
  let sent = false;
  await assert.rejects(
    window.restore(
      async () => {
        sent = true;
        return success();
      },
      async () => true,
    ),
    /window-expired/,
  );
  assert.equal(sent, false);
});
test("setting reads and syncs previous value, writes, then restores in the same session", async () => {
  const { window, store } = instance();
  const values = [];
  await window.setting(
    "setting-test",
    true,
    async () => ({ status: 200, body: { value: false } }),
    async (request) => {
      assert.equal(store.writes.at(-1).previous[0].value, false);
      values.push(JSON.parse(request.body).value);
      return success();
    },
    async (request) => request.expectedValue === false,
  );
  assert.deepEqual(values, [true, false]);
  assert.equal(window.restorePlan().length, 0);
  assert(store.writes.at(-1).rows.every((r) => r.restored));
});
test("missing previous setting value never sends a mutation", async () => {
  const { window } = instance();
  let sent = false;
  await assert.rejects(
    window.setting(
      "setting-test",
      true,
      async () => ({ status: 200, body: {} }),
      async () => {
        sent = true;
        return success();
      },
      async () => true,
    ),
    /previous-value-missing/,
  );
  assert.equal(sent, false);
});
test("adapter routes writes through policy, leaves default mode uninitialized, and refuses service workers", async () => {
  assert.equal((await initializeWindow(["--click", "#safe"])).window, null);
  const { window } = instance();
  let handler;
  let sockets;
  const page = {
    context: () => ({ serviceWorkers: () => [] }),
    addInitScript: async () => {},
    routeWebSocket: async (_, callback) => {
      sockets = callback;
    },
    route: async (_, callback) => {
      handler = callback;
    },
  };
  const blocked = [];
  await installWindowGuards(page, window, { blocked, fallback: async () => {} });
  let socketClosed = false;
  sockets({
    close: () => {
      socketClosed = true;
    },
  });
  assert(socketClosed);
  let aborted = false,
    fetched = false,
    fulfilled = false;
  const req = create();
  const route = {
    request: () => ({
      method: () => req.method,
      url: () => req.url,
      postData: () => req.body,
      headers: () => ({ "content-type": req.contentType }),
    }),
    abort: async () => {
      aborted = true;
    },
    fetch: async (options) => {
      assert.equal(options.maxRedirects, 0);
      fetched = true;
      return { status: () => 200, json: async () => success().body };
    },
    fulfill: async () => {
      fulfilled = true;
    },
  };
  await handler(route);
  assert(aborted);
  assert.equal(fetched, false);
  await click(window);
  aborted = false;
  await handler(route);
  assert(fetched && fulfilled && !aborted);
  await assert.rejects(
    installWindowGuards({ ...page, context: () => ({ serviceWorkers: () => [{}] }) }, window, {
      blocked,
    }),
    /service-worker/,
  );
});
test("allowedWrites survives success, partial error and signal metadata", async () => {
  const { buildPartialMeta } = await load("partial-meta.mjs");
  const { createCaptureRuntime } = await load("capture-runtime.mjs");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "capture-meta-test-"));
  try {
    const runtime = createCaptureRuntime({
      events: new EventEmitter(),
      exit: () => {},
      write: () => {},
    });
    runtime.output(dir, {});
    const { window } = instance({ onMeta: (meta) => runtime.update(meta) });
    await click(window);
    await window.dispatch(create(), async () => success());
    assert.equal(window.metadata().allowedWrites, 1);
    assert.equal(
      buildPartialMeta(window.metadata(), new Error("test"), (value) => value).allowedWrites,
      1,
    );
    await runtime.abort("SIGTERM");
    assert.equal(JSON.parse(fs.readFileSync(path.join(dir, "meta.json"))).allowedWrites, 1);
  } finally {
    fs.rmSync(dir, { recursive: true });
  }
});

test("capture target must match the immutable API host", () => {
  const { window } = instance();
  window.checkTarget("https://crm.example.invalid/crm/test");
  assert.throws(() => window.checkTarget("https://other.example.invalid/crm/test"));
  assert.throws(() => window.checkTarget("http://crm.example.invalid/crm/test"));
});
test("NaN clock never opens a click or input capability", () => {
  assert.equal(
    evaluateClick(
      { selector: "#save-test", text: "Save", ruleKey: "create-document", name: "ZZTEST-one" },
      state(),
      NaN,
    ).allow,
    false,
  );
  assert.equal(evaluateInput("#test-name", "ZZTEST-one", state(), NaN).allow, false);
});
test("immutable snapshot ignores later caller policy edits", () => {
  const raw = policy();
  const frozen = validatePolicy(raw);
  raw.host = "other.example.invalid";
  raw.endpoints[0].body.name = "$text";
  assert.equal(frozen.host, "crm.example.invalid");
  assert.equal(frozen.endpoints[0].body.name, "$name");
});
test("CTO issuer is verified by API identity and company", async () => {
  const base = fakeApi({ issue: { createdByUserId: null, createdByAgentId: "cto-test" } });
  const options = {
    issueId: "window-test",
    agentFlag: "crm-analyst",
    rawPolicy: JSON.stringify(policy()),
    now: before,
  };
  const api = async (url) =>
    url === "/api/agents/cto-test"
      ? { role: "cto", urlKey: "cto", companyId: "test-company" }
      : base(url);
  assert.equal((await verifyActivation({ ...options, api })).issueId, "window-test");
  await assert.rejects(
    verifyActivation({
      ...options,
      api: async (url) =>
        url === "/api/agents/cto-test"
          ? { role: "engineer", urlKey: "cto", companyId: "test-company" }
          : base(url),
    }),
  );
});
test("published local-policy mismatch and wrong company refuse activation", async () => {
  const options = {
    issueId: "window-test",
    agentFlag: "crm-analyst",
    rawPolicy: JSON.stringify(policy()),
    now: before,
  };
  await assert.rejects(
    verifyActivation({ ...options, api: fakeApi({ issue: { companyId: "other-company" } }) }),
  );
  const other = policy();
  other.host = "other.example.invalid";
  await assert.rejects(
    verifyActivation({ ...options, rawPolicy: JSON.stringify(other), api: fakeApi() }),
  );
});
test("bulk identity fields, foreign owner and active automation are invalid policies", () => {
  for (const body of [
    { name: "$name", target_id: "$text" },
    { name: "$name", owner: "$text" },
    { name: "$name", ids: ["$id"] },
  ]) {
    const p = policy();
    p.endpoints[0].body = body;
    assert.throws(() => validatePolicy(p));
  }
  const p = policy();
  p.endpoints[0].module = "Automation";
  p.endpoints[0].path = "/crm/v1/Automation";
  assert.throws(() => validatePolicy(p));
});
test("restarting with another hash or corrupt journal is refused", async () => {
  const store = memoryStore();
  instance({ store });
  assert.throws(
    () =>
      new WriteWindow(
        {
          policy: validatePolicy(policy()),
          policyHash: "other-hash",
          issueId: "window-test",
          agentId: "analyst-test",
        },
        store,
        { now: () => before },
      ),
    /journal-identity/,
  );
  assert.throws(
    () =>
      instance({
        store: {
          read() {
            throw new Error("corrupt");
          },
          write() {},
        },
      }),
    /corrupt/,
  );
});
test("transport failure retains counted attempt, unresolved WAL and partial metadata", async () => {
  const { window, store } = instance();
  await click(window);
  await assert.rejects(
    window.dispatch(create(), async () => {
      throw new Error("network");
    }),
    /write-outcome-unknown/,
  );
  assert.equal(window.metadata().allowedWrites, 1);
  assert.equal(store.writes.at(-1).rows.at(-1).status, "unknown");
});
test("read requests never increment allowedWrites or require a click", async () => {
  const { window } = instance();
  const result = await window.dispatch({ method: "GET", url: create().url }, async () => ({
    status: 200,
  }));
  assert(result.allow && result.read);
  assert.equal(window.metadata().allowedWrites, 0);
});
test("expired adapter request cannot reach its network transport", async () => {
  let now = before;
  const { window } = instance({ now: () => now });
  await click(window);
  now = Date.parse(EXPIRES_AT);
  let sent = false;
  const result = await window.dispatch(create(), async () => {
    sent = true;
    return success();
  });
  assert.equal(result.reason, "window-expired");
  assert.equal(sent, false);
});
test("guarded inputs call fill only for one supported test field", async () => {
  const { window } = instance();
  let filled = "";
  const inputScope = {
    locator: () => ({
      count: async () => 1,
      fill: async (value) => {
        filled = value;
      },
    }),
  };
  assert.equal(
    await window.input({ selector: "#test-name", value: "Existing", scope: inputScope }),
    false,
  );
  assert.equal(filled, "");
  assert.equal(
    await window.input({ selector: "#test-name", value: "ZZTEST-one", scope: inputScope }),
    true,
  );
  assert.equal(filled, "ZZTEST-one");
});

test("existing empty observation scaffold is preserved and external journal edits stop writes", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "capture-scaffold-test-"));
  try {
    const file = path.join(dir, "changes.md");
    const preamble =
      "# Write-observation window change log (synthetic)\n\n| time | screen | action | record/setting | previous value | new value | restored |\n|---|---|---|---|---|---|---|\n";
    fs.writeFileSync(file, preamble);
    const store = durableStore(file);
    const { window } = instance({ store });
    assert(fs.readFileSync(file, "utf8").startsWith(preamble));
    assert.equal(store.read().policyHash, "test-hash");
    fs.appendFileSync(file, "\nexternal edit");
    assert.throws(() => store.write({ changed: true }), /journal-changed-externally/);
    assert.equal(window.metadata().allowedWrites, 0);
    fs.writeFileSync(
      file,
      `${preamble}| time | synthetic | create | ZZTEST-unknown | none | unknown | no |\n`,
    );
    assert.throws(() => instance({ store: durableStore(file) }), /journal-unmanaged-entries/);
  } finally {
    fs.rmSync(dir, { recursive: true });
  }
});

test("setting restoration preserves other registered test objects and logs the actual changed value", async () => {
  const { window, store } = instance();
  await click(window);
  await window.dispatch(create(), async () => success());
  const requests = [];
  await window.setting(
    "setting-test",
    true,
    async () => ({ status: 200, body: { value: false } }),
    async (request) => {
      requests.push(request);
      return success();
    },
    async () => true,
  );
  assert(requests.every((request) => request.url.endsWith("/settings/test")));
  assert.equal(window.restorePlan()[0].key, "delete-document");
  assert.equal(store.writes.at(-1).rows.at(-1).previous, true);
});
test("owned record rename retains the prefix and updates the registry for subsequent clicks", async () => {
  const { window, store } = instance();
  await click(window);
  await window.dispatch(create(), async () => success());
  assert.equal(
    await window.click({ selector: "#update-test", text: "Save", attrs: "", scope }),
    true,
  );
  const request = {
    ...create(),
    method: "PUT",
    url: `${create().url}/created-test`,
    body: '{"name":"ZZTEST-renamed"}',
  };
  await window.dispatch(request, async () => success());
  assert.equal(store.writes.at(-1).records[0].name, "ZZTEST-renamed");
  assert.equal(store.writes.at(-1).rows.at(-1).previous.name, "ZZTEST-one");
  const p = policy();
  p.endpoints[1].body.name = "$text";
  assert.throws(() => validatePolicy(p), /endpoint-target-fields/);
});
test("restore transport uses only exact registered requests, bounded redirects and in-memory session headers", async () => {
  const { restoreTransport } = await load("write-window-adapter.mjs");
  const { window } = instance();
  await click(window);
  await window.dispatch(create(), async () => success());
  const requests = [];
  const context = {
    cookies: async () => [{ name: "crmcsr", value: "synthetic-csrf" }],
    request: {
      fetch: async (url, options) => {
        requests.push({ url, options });
        assert.equal(options.maxRedirects, 0);
        assert.equal(options.maxRetries, 0);
        assert.equal(options.headers["X-ZCSRF-TOKEN"], "crmcsrfparam=synthetic-csrf");
        return {
          status: () => (options.method === "GET" ? 404 : 200),
          json: async () => ({ status: "success" }),
        };
      },
    },
  };
  const page = {
    url: () => `https://crm.example.invalid/crm/org${String(0)}/tab/Documents`,
    context: () => context,
  };
  await restoreTransport(page, window);
  assert.equal(requests.length, 4);
  assert(requests.every((r) => r.url.endsWith("/created-test")));
  assert.equal(window.restorePlan().length, 0);
});

test("malformed or symlinked policy files stop activation before browser acquisition", async () => {
  const { activateFromFiles } = await load("write-window.mjs");
  const dir = fs.mkdtempSync(
    path.join(process.env.PAPERCLIP_RUN_SCRATCH_DIR || os.tmpdir(), "capture-policy-test-"),
  );
  try {
    const policyFile = path.join(dir, "policy.json");
    fs.writeFileSync(policyFile, "{");
    const flags = { issueId: "window-test", agentFlag: "crm-analyst", policyFile };
    await assert.rejects(
      activateFromFiles(flags, {
        api: fakeApi(),
        journalFile: path.join(dir, "changes.md"),
        now: before,
      }),
    );
    const link = path.join(dir, "policy-link.json");
    fs.symlinkSync(policyFile, link);
    await assert.rejects(
      activateFromFiles(
        { ...flags, policyFile: link },
        { api: fakeApi(), journalFile: path.join(dir, "changes.md"), now: before },
      ),
    );
    assert.equal(fs.existsSync(path.join(dir, "changes.md")), false);
  } finally {
    fs.rmSync(dir, { recursive: true });
  }
});
test("directory fsync failure after WAL rename also prevents transmission", async () => {
  const dir = fs.mkdtempSync(
    path.join(process.env.PAPERCLIP_RUN_SCRATCH_DIR || os.tmpdir(), "capture-directory-sync-test-"),
  );
  try {
    let syncs = 0;
    const io = {
      ...fs,
      fsyncSync(fd) {
        syncs += 1;
        if (syncs === 4) throw new Error("directory-sync-failed");
        fs.fsyncSync(fd);
      },
    };
    const { window } = instance({ store: durableStore(path.join(dir, "changes.md"), io) });
    await click(window);
    let sent = false;
    assert.equal(
      (
        await window.dispatch(create(), async () => {
          sent = true;
          return success();
        })
      ).reason,
      "journal-unavailable",
    );
    assert.equal(sent, false);
  } finally {
    fs.rmSync(dir, { recursive: true });
  }
});
