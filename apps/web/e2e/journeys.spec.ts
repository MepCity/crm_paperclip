import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { signUpNewUser } from "./support/auth";
import { moduleListDefaultPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

test("journeys: empty list → create dialog → canvas editor with states & transition → publish → active in list", async ({
  page,
}) => {
  const evidenceDir = process.env.MEP_EVIDENCE_DIR || "/tmp/journeys-evidence";
  mkdirSync(evidenceDir, { recursive: true });

  await page.setViewportSize({ width: 1180, height: 703 });
  await signUpNewUser(page);
  const org = await createOrganization(page);

  // 1. Navigate to Settings -> Process Management -> CommandCenter: Journey Builder
  await page.goto(`/crm/${org.slug}/settings/commandcenter/journey-builder`);
  await expect(page.getByTestId("journey-empty-state")).toBeVisible();

  // Screenshot 1: empty list
  await page.screenshot({ path: join(evidenceDir, "journeys-empty.png") });

  // 2. Open Create Journey dialog
  const createBtn = page.getByTestId("create-journey-button");
  await expect(createBtn).toBeVisible();
  await createBtn.click();

  const createDialog = page.getByTestId("create-journey-dialog");
  await expect(createDialog).toBeVisible();

  // Screenshot 2: create dialog
  await page.screenshot({ path: join(evidenceDir, "journeys-create-dialog.png") });

  // Fill Name and Module
  await page.getByTestId("journey-name-input").fill("Inbound Lead Journey");
  await page.getByTestId("journey-module-select").selectOption("Leads");
  await page
    .getByTestId("journey-description-input")
    .fill("Automated qualification sequence for inbound leads.");

  // Click Next -> Navigates to canvas editor
  await page.getByTestId("journey-next-button").click();
  await expect(page.getByTestId("journey-editor-name")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("journey-editor-name")).toHaveText("Inbound Lead Journey");
  await expect(page.getByTestId("journey-status-badge")).toHaveText(/draft/i);

  // 3. Add second state and transition
  await page.getByTestId("add-state-button").click();
  await expect(page.getByText("State 2")).toBeVisible();

  await page.getByTestId("add-transition-button").click();

  // Select start state to view state property panel
  await page.getByTestId("journey-state-card-state_start").click();
  await expect(page.getByTestId("journey-property-panel")).toBeVisible();
  await expect(page.getByTestId("state-name-input")).toHaveValue("Start");

  // Screenshot 3: canvas editor with property panel
  await page.screenshot({ path: join(evidenceDir, "journeys-editor-property-panel.png") });

  // 4. Click Publish
  await page.getByTestId("journey-publish-button").click();
  await expect(page.getByTestId("journey-status-badge")).toHaveText(/active/i, { timeout: 10_000 });

  // 5. Return to list
  await page.getByTestId("journey-editor-back").click();
  await expect(page.getByText("Inbound Lead Journey")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Active")).toBeVisible();

  // Screenshot 4: list with active row
  await page.screenshot({ path: join(evidenceDir, "journeys-list-active.png") });
});

test("journeys execution: published journey + new Lead → instance in start state → record edit fires transition → task created and log shows the path", async ({
  page,
}) => {
  const evidenceDir = process.env.MEP_EVIDENCE_DIR || "/tmp/journeys-evidence";
  mkdirSync(evidenceDir, { recursive: true });

  await page.setViewportSize({ width: 1180, height: 703 });
  await signUpNewUser(page);
  const org = await createOrganization(page);

  const headers = { "X-CRM-ORG": org.slug, Origin: new URL(page.url()).origin };

  // 1. Create a Journey for Leads via settings API
  const createRes = await page.request.post("/crm/v2.1/settings/journeys", {
    headers,
    data: {
      name: "Auto Qualification Journey",
      module: "Leads",
      description: "Automated qualification path",
    },
  });
  expect(createRes.status()).toBe(200);
  const { journey } = await createRes.json();

  // 2. Update Draft with Start State, Target State, Transition on record_updated with task action
  const states = [
    {
      id: "state_start",
      name: "Start State",
      isStart: true,
      actions: [],
      deadline: null,
    },
    {
      id: "state_qualified",
      name: "Qualified State",
      isStart: false,
      actions: [],
      deadline: null,
    },
  ];

  const transitions = [
    {
      id: "trans_qualify",
      from: "state_start",
      to: "state_qualified",
      trigger: "record_updated",
      criteria: null,
      actions: [
        {
          id: "act_create_task",
          kind: "task",
          timing: "immediate",
          subject: "Urgent Journey Follow-up Task",
          priority: "High",
          dueOffsetDays: 1,
        },
      ],
    },
  ];

  const updateDraftRes = await page.request.put(`/crm/v2.1/settings/journeys/${journey.id}`, {
    headers,
    data: { states, transitions },
  });
  expect(updateDraftRes.status()).toBe(200);

  // 3. Publish Journey
  const publishRes = await page.request.post(
    `/crm/v2.1/settings/journeys/${journey.id}/actions/publish`,
    { headers },
  );
  expect(publishRes.status()).toBe(200);

  // 4. Create new Lead via Records API -> triggers entry into active journey's start state
  const leadRes = await page.request.post("/crm/v2.2/Leads", {
    headers,
    data: {
      data: [
        {
          First_Name: "E2E",
          Last_Name: "Candidate",
          Company: "Journey Automation Corp",
        },
      ],
    },
  });
  expect(leadRes.status()).toBe(200);
  const leadData = await leadRes.json();
  const leadId = leadData.data[0].details.id;
  expect(leadId).toBeDefined();

  // 5. Verify instance in Start State via instances endpoint
  const instRes1 = await page.request.get(`/crm/v2.1/settings/journeys/${journey.id}/instances`, {
    headers,
  });
  expect(instRes1.status()).toBe(200);
  const { instances: list1 } = await instRes1.json();
  expect(list1).toHaveLength(1);
  const inst = list1[0];
  expect(inst.recordId).toBe(leadId);
  expect(inst.currentStateId).toBe("state_start");
  expect(inst.status).toBe("active");

  // 6. Edit Lead -> triggers record_updated transition to state_qualified and executes task action
  const editLeadRes = await page.request.put(`/crm/v2.2/Leads/${leadId}`, {
    headers,
    data: {
      data: [
        {
          Company: "Journey Automation Corp Updated",
        },
      ],
    },
  });
  expect(editLeadRes.status()).toBe(200);

  // 7. Verify instance moved to target state (state_qualified)
  const instRes2 = await page.request.get(`/crm/v2.1/settings/journeys/${journey.id}/instances`, {
    headers,
  });
  expect(instRes2.status()).toBe(200);
  const { instances: list2 } = await instRes2.json();
  expect(list2).toHaveLength(1);
  expect(list2[0].currentStateId).toBe("state_qualified");

  // 8. Verify transition log shows the path
  const logRes = await page.request.get(
    `/crm/v2.1/settings/journeys/${journey.id}/instances/${inst.id}/log`,
    { headers },
  );
  expect(logRes.status()).toBe(200);
  const { log } = await logRes.json();
  expect(log).toHaveLength(1);
  expect(log[0].transitionId).toBe("trans_qualify");
  expect(log[0].result).toBe("success");

  // 9. Navigate to Tasks page in UI to verify created Task is visible
  await page.goto(moduleListDefaultPath(org.slug, "Tasks"));
  await expect(page.getByRole("link", { name: "Urgent Journey Follow-up Task" })).toBeVisible({
    timeout: 15_000,
  });

  // Screenshot: Tasks page showing task created by journey transition action
  await page.screenshot({ path: join(evidenceDir, "journeys-transition-task-created.png") });
});

test("journeys C: record in journey appears in record Journeys related list, editor participating records tab, and report metrics", async ({
  page,
}) => {
  const evidenceDir = process.env.MEP_EVIDENCE_DIR || "/tmp/journeys-evidence";
  mkdirSync(evidenceDir, { recursive: true });

  await page.setViewportSize({ width: 1180, height: 703 });
  await signUpNewUser(page);
  const org = await createOrganization(page);

  const headers = { "X-CRM-ORG": org.slug, Origin: new URL(page.url()).origin };

  // 1. Create a Journey for Leads via settings API
  const createRes = await page.request.post("/crm/v2.1/settings/journeys", {
    headers,
    data: {
      name: "Enterprise Customer Journey",
      module: "Leads",
      description: "Lead nurturing sequence",
    },
  });
  expect(createRes.status()).toBe(200);
  const { journey } = await createRes.json();

  // 2. Configure States & Transition
  const states = [
    {
      id: "state_new",
      name: "New Lead",
      isStart: true,
      actions: [],
      deadline: null,
    },
    {
      id: "state_contacted",
      name: "Contacted",
      isStart: false,
      actions: [],
      deadline: null,
    },
  ];

  const transitions = [
    {
      id: "trans_contact",
      from: "state_new",
      to: "state_contacted",
      trigger: "record_updated",
      criteria: null,
      actions: [],
    },
  ];

  const updateRes = await page.request.put(`/crm/v2.1/settings/journeys/${journey.id}`, {
    headers,
    data: { states, transitions },
  });
  expect(updateRes.status()).toBe(200);

  // 3. Publish Journey
  const pubRes = await page.request.post(
    `/crm/v2.1/settings/journeys/${journey.id}/actions/publish`,
    { headers },
  );
  expect(pubRes.status()).toBe(200);

  // 4. Create Lead Record -> Enters Journey
  const leadRes = await page.request.post("/crm/v2.2/Leads", {
    headers,
    data: {
      data: [
        {
          First_Name: "Ayşe",
          Last_Name: "Yılmaz",
          Company: "Yılmaz Lojistik",
        },
      ],
    },
  });
  expect(leadRes.status()).toBe(200);
  const leadData = await leadRes.json();
  const leadId = leadData.data[0].details.id;
  expect(leadId).toBeDefined();

  // 5. Navigate to Lead Record Detail -> Verify Journeys Related List Card
  await page.goto(`/crm/${org.slug}/tab/Leads/${leadId}`);
  await page.locator('[data-related-card="journeys"]').scrollIntoViewIfNeeded();
  await expect(page.getByTestId("journeys-related-table")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Enterprise Customer Journey")).toBeVisible();
  await expect(page.getByText("New Lead")).toBeVisible();
  await expect(page.getByText("active")).toBeVisible();

  // Screenshot 1: Lead detail with Journeys related list card at 1180x703
  await page.screenshot({ path: join(evidenceDir, "journeys-lead-detail-related-list.png") });

  // 6. Navigate to Journey Builder Canvas Editor -> Check Participating Records Tab
  await page.goto(`/crm/${org.slug}/settings/commandcenter/journey-builder/${journey.id}`);
  await expect(page.getByTestId("journey-editor-name")).toBeVisible({ timeout: 15_000 });

  // Screenshot 2: Canvas editor screen at 1180x703
  await page.screenshot({ path: join(evidenceDir, "journeys-canvas-editor.png") });

  // Switch to Participating Records Tab
  await page.getByTestId("tab-participating-records").click();
  const participantsTable = page.getByTestId("participants-table");
  await expect(participantsTable).toBeVisible({ timeout: 15_000 });
  await expect(participantsTable.getByText("Ayşe Yılmaz")).toBeVisible();
  await expect(participantsTable.getByText("New Lead")).toBeVisible();

  // Screenshot 3: Participating records tab at 1180x703
  await page.screenshot({ path: join(evidenceDir, "journeys-editor-participants.png") });

  // 7. Navigate to Journey Reports Screen
  await page.getByTestId("journey-reports-button").click();
  await expect(page.getByTestId("report-journey-title")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("kpi-total")).toHaveText("1");
  await expect(page.getByTestId("kpi-active")).toHaveText("1");
  await expect(page.getByTestId("state-metric-state_new")).toBeVisible();

  // Screenshot 4: Journey Reports page at 1180x703
  await page.screenshot({ path: join(evidenceDir, "journeys-reports-page.png") });

  // 8. Navigate to Journey Builder List Screen
  await page.goto(`/crm/${org.slug}/settings/commandcenter/journey-builder`);
  await expect(page.getByText("Enterprise Customer Journey")).toBeVisible({ timeout: 15_000 });

  // Screenshot 5: Journey Builder List screen at 1180x703
  await page.screenshot({ path: join(evidenceDir, "journeys-list-side-by-side.png") });
});
