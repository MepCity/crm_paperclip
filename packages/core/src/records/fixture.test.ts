import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { NotFoundError, ValidationError } from "../errors";
import type {
  Criteria,
  CriteriaToken,
  CriteriaValue,
  FieldValue,
  RecordData,
  RecordInput,
} from "./contract";
import { describeRecordServiceContract } from "./contract-suite";
import { createFixtureRecordService } from "./fixture";
import { sortRecords } from "./fixture/query";
import { generateFixtureLeads } from "./fixture/seed";

const make = () =>
  createFixtureRecordService({
    orgId: randomUUID(),
    orgSlug: "fixture-test",
    orgName: "Fixture Organization",
    userId: "fixture-test-user",
    role: "admin",
  });
const input = (extra: RecordInput = {}): RecordInput => ({
  Last_Name: "Example Lead",
  Company: "Example Company",
  ...extra,
});
describeRecordServiceContract("fixture", createFixtureRecordService);

describe("Leads surface metadata", () => {
  it("publishes the exact surface counts and observed layout columns", async () => {
    const metadata = await make().getModule("Leads");
    expect(metadata.fields).toHaveLength(56);
    for (const [surface, count] of Object.entries({
      view: 44,
      create: 34,
      edit: 33,
      quickCreate: 5,
    }))
      expect(
        metadata.fields.filter((field) => field.views[surface as keyof typeof field.views]),
      ).toHaveLength(count);
    expect(metadata.businessCardFields).toEqual([
      "Owner",
      "Email",
      "Phone",
      "Mobile",
      "Lead_Status",
    ]);
    expect(metadata.layout.map((section) => section.columns)).toEqual([
      [["Record_Image"]],
      [
        [
          "Owner",
          "First_Name",
          "Designation",
          "Phone",
          "Mobile",
          "Lead_Source",
          "Industry",
          "Annual_Revenue",
          "Email_Opt_Out",
          "Modified_By",
        ],
        [
          "Company",
          "Last_Name",
          "Full_Name",
          "Email",
          "Fax",
          "Website",
          "Lead_Status",
          "No_of_Employees",
          "Rating",
          "Created_By",
          "Skype_ID",
          "Secondary_Email",
          "Twitter",
        ],
      ],
      [
        [
          "Address",
          "Country",
          "Flat_House_No_Building_Apartment_Name",
          "Street",
          "City",
          "State",
          "Zip_Code",
          "Latitude",
          "Longitude",
        ],
        [],
      ],
      [["Description"]],
    ]);
    expect(
      metadata.fields.filter((field) => field.views.quickCreate).map((field) => field.apiName),
    ).toEqual(["Company", "First_Name", "Last_Name", "Email", "Phone"]);
  });
});

describe("interim fixture policies (not reference parity)", () => {
  it("generates 250 repeatable synthetic records with a seeded generator", async () => {
    const records = generateFixtureLeads(68);
    const module = await make().getModule("Leads");
    const sources = module.fields
      .find((field) => field.apiName === "Lead_Source")
      ?.picklist?.map((option) => option.storedValue)
      .filter((value) => value !== "-None-");
    expect(records).toHaveLength(250);
    expect(generateFixtureLeads(68)).toEqual(records);
    expect(generateFixtureLeads(69)).not.toEqual(records);
    expect(new Set(records.map((record) => record.id)).size).toBe(250);
    expect(records.some((record) => record.fields.Lead_Source !== null)).toBe(true);
    expect(records.some((record) => record.fields.Lead_Source === null)).toBe(true);
    expect(records.some((record) => record.fields.First_Name !== null)).toBe(true);
    expect(records.some((record) => record.fields.First_Name === null)).toBe(true);
    for (const [index, record] of records.entries()) {
      const suffix = String(index + 1).padStart(3, "0");
      expect(record.fields).toMatchObject({
        Last_Name: `Lead ${suffix}`,
        Company: `Example Company ${suffix}`,
        Email: `lead-${suffix}@example.org`,
        Phone: `000-${suffix}`,
        Country: null,
        State: null,
        Unsubscribed_Mode: null,
        Unsubscribed_Time: null,
      });
      expect([...(sources ?? []), null]).toContain(record.fields.Lead_Source);
      expect([`Sample ${suffix}`, null]).toContain(record.fields.First_Name);
      expect(record.fields.Full_Name).toBe(
        record.fields.First_Name ? `Sample ${suffix} Lead ${suffix}` : `Lead ${suffix}`,
      );
      expect(record.fields).toMatchObject({ Owner: null, Created_By: null, Modified_By: null });
      expect(JSON.parse(JSON.stringify(record))).toEqual(record);
    }
  });
  it("stores empty strings as null on create/update and finds them with is null", async () => {
    const service = make();
    const marker = randomUUID();
    const fields = ["First_Name", "Email", "Phone", "Description", "Lead_Source", "Country"];
    const empty = Object.fromEntries(fields.map((field) => [field, ""]));
    const created = await service.create("Leads", input({ Company: marker, ...empty }));
    const populated = await service.create(
      "Leads",
      input({
        Company: marker,
        First_Name: "Sample",
        Email: "synthetic@example.org",
        Phone: "000-001",
        Description: "Synthetic description",
        Lead_Source: "OnlineStore",
        Country: "Synthetic Option",
      }),
    );
    for (const field of fields) {
      expect((await service.get("Leads", created.id)).fields[field]).toBeNull();
      expect(populated.fields[field]).not.toBeNull();
    }
    const updated = await service.update("Leads", populated.id, empty);
    for (const field of fields) {
      expect((await service.get("Leads", updated.id)).fields[field]).toBeNull();
      const query = {
        viewId: "all-leads",
        page: 1,
        perPage: 10,
        filters: {
          groupOperator: "and" as const,
          group: [
            { field: "Company", comparator: "equal" as const, value: marker },
            { field, comparator: "equal" as const, value: null },
          ],
        },
      };
      expect((await service.list("Leads", query)).records.map((record) => record.id)).toEqual([
        updated.id,
        created.id,
      ]);
      expect(await service.count("Leads", query)).toBe(2);
    }
    expect(created.fields.Full_Name).toBe("Example Lead");
    expect(updated.fields.Full_Name).toBe("Example Lead");
    expect(empty.First_Name).toBe("");
    for (const field of ["No_of_Employees", "Annual_Revenue", "Email_Opt_Out", "Connected_To__s"]) {
      await expect(service.create("Leads", input({ [field]: "" }))).rejects.toMatchObject({
        fieldErrors: { [field]: expect.any(Array) },
      });
      await expect(service.update("Leads", created.id, { [field]: "" })).rejects.toMatchObject({
        fieldErrors: { [field]: expect.any(Array) },
      });
    }
    for (const value of ["  ", " Sample "]) {
      const record = await service.create("Leads", input({ First_Name: value }));
      expect(record.fields.First_Name).toBe(value);
      expect(
        (await service.update("Leads", record.id, { First_Name: value })).fields.First_Name,
      ).toBe(value);
    }
    for (const value of ["", "  "]) {
      await expect(service.create("Leads", input({ Last_Name: value }))).rejects.toMatchObject({
        fieldErrors: { Last_Name: expect.any(Array) },
      });
      await expect(service.update("Leads", created.id, { Last_Name: value })).rejects.toMatchObject(
        {
          fieldErrors: { Last_Name: expect.any(Array) },
        },
      );
      expect(await service.get("Leads", created.id)).toEqual(created);
    }
  });
  it("preserves organization state and ID allocation after module re-evaluation", async () => {
    const ctx = {
      orgId: randomUUID(),
      orgSlug: "synthetic",
      orgName: "Example Organization",
      userId: "first-user",
      role: "admin" as const,
    };
    const service = createFixtureRecordService(ctx);
    const created = await service.create("Leads", input());
    vi.resetModules();
    const { createFixtureRecordService: reloaded } = await import("./fixture");
    const sameOrg = reloaded({ ...ctx, userId: "second-user" });
    expect(await sameOrg.get("Leads", created.id)).toEqual(created);
    expect(await sameOrg.count("Leads", { viewId: "all-leads" })).toBe(
      generateFixtureLeads().filter((record) => record.fields.Converted__s === false).length + 1,
    );
    const next = await sameOrg.create("Leads", input());
    expect(next.id).not.toBe(created.id);
    expect(await service.get("Leads", next.id)).toEqual(next);
    const otherOrg = reloaded({ ...ctx, orgId: randomUUID() });
    await expect(otherOrg.get("Leads", created.id)).rejects.toMatchObject({ code: "not_found" });
    expect(await otherOrg.count("Leads", { viewId: "all-leads" })).toBe(
      generateFixtureLeads().filter((record) => record.fields.Converted__s === false).length,
    );
  });
  it("assigns all seeded user fields once to each organization's first bound user", async () => {
    for (const userId of ["synthetic-first-user", "synthetic-other-user"]) {
      const ctx = {
        orgId: randomUUID(),
        orgSlug: "synthetic",
        orgName: "Example Organization",
        userId,
        role: "admin" as const,
      };
      const service = createFixtureRecordService(ctx);
      const records = [];
      for (const seeded of generateFixtureLeads())
        records.push(await service.get("Leads", seeded.id));
      expect(records).toHaveLength(250);
      const secondUser = createFixtureRecordService({ ...ctx, userId: "synthetic-later-user" });
      for (const record of records) {
        expect(record.fields).toMatchObject({
          Owner: userId,
          Created_By: userId,
          Modified_By: userId,
        });
        expect(await secondUser.get("Leads", record.id)).toEqual(record);
      }
    }
  });
  it("transcribes all field constraints and layout membership from the permitted spec", async () => {
    const spec = readFileSync(
      new URL("../../../../research/specs/leads-fields-and-layout.md", import.meta.url),
      "utf8",
    );
    const rows = spec
      .split("\n")
      .map((line) =>
        line
          .split("|")
          .slice(1, -1)
          .map((cell) => cell.trim()),
      )
      .filter(
        (cells) => cells.length === 10 && cells[1]?.startsWith("`") && cells[3]?.match(/^\d/),
      );
    const module = await make().getModule("Leads");
    expect(rows).toHaveLength(56);
    expect(
      module.fields.map((field) => ({
        apiName: field.apiName,
        label: field.label,
        dataType: field.dataType,
        maxLength: field.maxLength,
        required: field.required,
        readOnly: field.readOnly,
        unique: field.unique,
      })),
    ).toEqual(
      rows.map((cells) => ({
        apiName: cells[1]?.replaceAll("`", ""),
        label: cells[0],
        dataType: cells[2]?.replaceAll("`", ""),
        maxLength: Number(cells[3]?.split(",")[0]),
        required: cells[4] !== "-",
        readOnly: cells[5] === "yes",
        unique: false,
      })),
    );
    expect(
      module.layout.map((section) => [section.label, section.columnCount, section.fields.length]),
    ).toEqual([
      ["Lead Image", 1, 1],
      ["Lead Information", 2, 38],
      ["Address Information", 2, 10],
      ["Description Information", 1, 1],
    ]);
    expect(
      module.layout.find((section) => section.label === "Address Information")?.fields,
    ).toEqual([
      "Address",
      "Country",
      "Flat_House_No_Building_Apartment_Name",
      "Street",
      "City",
      "State",
      "Zip_Code",
      "Latitude",
      "Longitude",
      "Coordinates",
    ]);
    expect(
      module.fields
        .filter((field) => field.lookup)
        .map((field) => [field.apiName, field.lookup?.module]),
    ).toEqual([
      ["Converted_Account", "Accounts"],
      ["Converted_Contact", "Contacts"],
      ["Converted_Deal", "Deals"],
    ]);
  });
  it("publishes exact ordered picklists and deferred Country/State metadata", async () => {
    const module = await make().getModule("Leads");
    const values: Record<string, readonly (string | readonly [string, string])[]> = {
      Lead_Source: [
        "-None-",
        "Advertisement",
        "Cold Call",
        "Employee Referral",
        "External Referral",
        ["Online Store", "OnlineStore"],
        ["X (Twitter)", "Twitter"],
        "Facebook",
        "Partner",
        "Public Relations",
        ["Sales Email Alias", "Sales Mail Alias"],
        "Seminar Partner",
        ["Internal Seminar", "Seminar-Internal"],
        "Trade Show",
        "Web Download",
        "Web Research",
        "Chat",
      ],
      Lead_Status: [
        "-None-",
        "Attempted to Contact",
        "Contact in Future",
        "Contacted",
        "Junk Lead",
        "Lost Lead",
        "Not Contacted",
        "Pre-Qualified",
        "Not Qualified",
      ],
      Industry: [
        "-None-",
        "ASP (Application Service Provider)",
        "Data/Telecom OEM",
        "ERP (Enterprise Resource Planning)",
        "Government/Military",
        "Large Enterprise",
        "ManagementISV",
        "MSP (Management Service Provider)",
        ["Network Equipment Enterprise", "Network Equipment (Enterprise)"],
        "Non-management ISV",
        "Optical Networking",
        "Service Provider",
        "Small/Medium Enterprise",
        "Storage Equipment",
        "Storage Service Provider",
        "Systems Integrator",
        "Wireless Industry",
        "ERP",
        "Management ISV",
      ],
      Rating: [
        "-None-",
        "Acquired",
        "Active",
        "Market Failed",
        "Project Cancelled",
        ["Shut Down", "ShutDown"],
      ],
      Salutation: ["-None-", "Mr.", "Mrs.", "Ms.", "Dr.", "Prof."],
      Enrich_Status__s: ["Available", "Enriched", "Data not found"],
      Unsubscribed_Mode: ["Consent form", "Manual", "Unsubscribe link"],
    };
    for (const [name, options] of Object.entries(values))
      expect(module.fields.find((field) => field.apiName === name)?.picklist).toEqual(
        options.map((option) =>
          typeof option === "string"
            ? { displayValue: option, storedValue: option }
            : { displayValue: option[0], storedValue: option[1] },
        ),
      );
    for (const name of ["Country", "State"]) {
      const field = module.fields.find((field) => field.apiName === name);
      expect(field).toMatchObject({ dataType: "picklist", maxLength: 120 });
      expect(field).not.toHaveProperty("picklist");
    }
  });
  it("publishes all 14 views with the saved criteria trees, columns and flags", async () => {
    const all = ["Full_Name", "Company", "Email", "Phone", "Lead_Source", "Owner"];
    const convertedColumns = ["Full_Name", "Company", "Phone", "Email"];
    const custom = ["Last_Name", "First_Name", "Company", "Email"];
    const user = { token: "CURRENTUSER" } as const;
    const today = { token: "TODAY" } as const;
    const age31 = { token: "AGEINDAYS", offset: 31 } as const;
    const category = (name: string): CriteriaToken => ({ token: "CATEGORY", name });
    const equal = (field: string, value: CriteriaValue): Criteria => ({
      field,
      comparator: "equal",
      value,
    });
    const notConverted = equal("Converted__s", false);
    const and = (...group: Criteria[]): Criteria => ({ groupOperator: "and", group });
    const views = await make().listViews("Leads");
    expect(views).toEqual([
      {
        id: "all-leads",
        name: "All Leads",
        systemDefined: true,
        isDefault: true,
        columns: all,
        sort: null,
        criteria: notConverted,
      },
      {
        id: "all-locked-leads",
        name: "All Locked Leads",
        systemDefined: true,
        isDefault: false,
        columns: all,
        sort: null,
        criteria: and(equal("Locked__s", true), notConverted),
      },
      {
        id: "converted-leads",
        name: "Converted Leads",
        systemDefined: true,
        isDefault: false,
        columns: convertedColumns,
        sort: null,
        criteria: equal("Converted__s", true),
      },
      {
        id: "junk-leads",
        name: "Junk Leads",
        systemDefined: false,
        isDefault: false,
        columns: custom,
        sort: null,
        criteria: equal("Lead_Status", category("Junk")),
      },
      {
        id: "mailing-labels",
        name: "Mailing Labels",
        systemDefined: true,
        isDefault: false,
        columns: ["Salutation", "Full_Name", "Company"],
        sort: null,
        criteria: notConverted,
      },
      {
        id: "my-converted-leads",
        name: "My Converted Leads",
        systemDefined: true,
        isDefault: false,
        columns: convertedColumns,
        sort: null,
        criteria: and(equal("Converted__s", true), equal("Owner", user)),
      },
      {
        id: "my-leads",
        name: "My Leads",
        systemDefined: true,
        isDefault: false,
        columns: all.slice(0, -1),
        sort: null,
        criteria: and(equal("Owner", user), notConverted),
      },
      {
        id: "not-qualified-leads",
        name: "Not Qualified Leads",
        systemDefined: false,
        isDefault: false,
        columns: custom,
        sort: null,
        criteria: equal("Lead_Status", category("Not Qualified")),
      },
      {
        id: "open-leads",
        name: "Open Leads",
        systemDefined: false,
        isDefault: false,
        columns: custom,
        sort: null,
        criteria: equal("Lead_Status", category("Open")),
      },
      {
        id: "recently-created-leads",
        name: "Recently Created Leads",
        systemDefined: true,
        isDefault: false,
        columns: all,
        sort: null,
        criteria: and(
          and({ field: "Common_Status", comparator: "contains", value: "c" }, notConverted),
          { field: "Created_Time", comparator: "less_equal", value: age31 },
        ),
      },
      {
        id: "recently-modified-leads",
        name: "Recently Modified Leads",
        systemDefined: true,
        isDefault: false,
        columns: all,
        sort: null,
        criteria: and(
          and({ field: "Common_Status", comparator: "contains", value: "m" }, notConverted),
          { field: "Modified_Time", comparator: "less_equal", value: age31 },
        ),
      },
      {
        id: "todays-leads",
        name: "Today's Leads",
        systemDefined: true,
        isDefault: false,
        columns: all,
        sort: null,
        criteria: and(equal("Created_Time", today), notConverted),
      },
      {
        id: "unread-leads",
        name: "Unread Leads",
        systemDefined: true,
        isDefault: false,
        columns: all,
        sort: null,
        criteria: and(notConverted, {
          field: "Common_Status",
          comparator: "not_contains",
          value: "v",
        }),
      },
      {
        id: "unsubscribed-leads",
        name: "Unsubscribed Leads",
        systemDefined: true,
        isDefault: false,
        columns: [
          "Full_Name",
          "Company",
          "Email",
          "Owner",
          "Created_Time",
          "Unsubscribed_Mode",
          "Unsubscribed_Time",
        ],
        sort: null,
        criteria: and(notConverted, equal("Email_Opt_Out", true)),
      },
    ]);
    expect(views.map((view) => view.criteria)).not.toContain(null);
  });
  it("validates deferred picklist type and length but permits arbitrary text and null", async () => {
    const service = make();
    for (const name of ["Country", "State"]) {
      expect(
        (await service.create("Leads", input({ [name]: "Synthetic Option" }))).fields[name],
      ).toBe("Synthetic Option");
      expect((await service.create("Leads", input({ [name]: null }))).fields[name]).toBeNull();
      for (const value of [3, "x".repeat(121)])
        await expect(service.create("Leads", input({ [name]: value }))).rejects.toMatchObject({
          fieldErrors: { [name]: expect.any(Array) },
        });
    }
  });
  it("recomputes Full_Name in salutation, first name, last name order", async () => {
    const service = make();
    const record = await service.create(
      "Leads",
      input({ First_Name: "Example", Last_Name: "Lead", Salutation: "Dr." }),
    );
    expect(record.fields.Full_Name).toBe("Dr. Example Lead");
    expect(
      (await service.update("Leads", record.id, { Last_Name: "Updated" })).fields.Full_Name,
    ).toBe("Dr. Example Updated");
    expect((await service.update("Leads", record.id, { First_Name: null })).fields.Full_Name).toBe(
      "Dr. Updated",
    );
  });
  it("composes names without salutation and with only a last name", async () => {
    const service = make();
    const created = await service.create(
      "Leads",
      input({ First_Name: "Example", Last_Name: "Lead" }),
    );
    expect(created.fields.Full_Name).toBe("Example Lead");
    expect((await service.update("Leads", created.id, { First_Name: null })).fields.Full_Name).toBe(
      "Lead",
    );
    expect(
      (await service.update("Leads", created.id, { Salutation: "Dr." })).fields.Full_Name,
    ).toBe("Dr. Lead");
    expect(
      (await service.update("Leads", created.id, { Salutation: "", First_Name: "" })).fields
        .Full_Name,
    ).toBe("Lead");
  });
  it("validates Owner against the live membership source on every write", async () => {
    const ctx = {
      orgId: randomUUID(),
      orgSlug: "owners",
      orgName: "Owner Test",
      userId: "actor",
      role: "admin" as const,
    };
    let members = ["actor", "other-member"];
    const service = createFixtureRecordService(ctx, { listMemberIds: async () => members });
    const created = await service.create("Leads", input({ Owner: "other-member" }));
    expect(created.fields.Owner).toBe("other-member");
    expect(created.fields.Created_By).toBe("actor");
    members = ["actor"];
    await expect(service.create("Leads", input({ Owner: "other-member" }))).rejects.toMatchObject({
      fieldErrors: { Owner: expect.any(Array) },
    });
    await expect(
      service.update("Leads", created.id, { Owner: "other-member", Company: "Changed" }),
    ).rejects.toMatchObject({ fieldErrors: { Owner: expect.any(Array) } });
    expect(await service.get("Leads", created.id)).toEqual(created);
    expect((await service.update("Leads", created.id, { Owner: "actor" })).fields.Owner).toBe(
      "actor",
    );
  });
  it("preserves intervening updates and does not resurrect deletes during Owner validation", async () => {
    const ctx = {
      orgId: randomUUID(),
      orgSlug: "owner-race",
      orgName: "Owner Test",
      userId: "actor",
      role: "admin" as const,
    };
    let resolveMembers: (members: readonly string[]) => void = () => {};
    const service = createFixtureRecordService(ctx, {
      listMemberIds: () =>
        new Promise((resolve) => {
          resolveMembers = resolve;
        }),
    });
    const created = await service.create("Leads", input());
    const ownerWrite = service.update("Leads", created.id, { Owner: "other-member" });
    await service.update("Leads", created.id, { Company: "Intervening Company" });
    resolveMembers(["actor", "other-member"]);
    expect((await ownerWrite).fields).toMatchObject({
      Owner: "other-member",
      Company: "Intervening Company",
    });
    const pendingWrite = service.update("Leads", created.id, { Owner: "actor" });
    await service.delete("Leads", [created.id]);
    resolveMembers(["actor", "other-member"]);
    await expect(pendingWrite).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.get("Leads", created.id)).rejects.toBeInstanceOf(NotFoundError);
  });
  it("searches only Full_Name, Company, Email and Phone, trims search and combines restrictions", async () => {
    const service = make();
    const marker = randomUUID().slice(0, 20);
    const records = [];
    for (const field of [
      "Last_Name",
      "Company",
      "Email",
      "Phone",
      "Description",
      "Mobile",
      "Secondary_Email",
    ])
      records.push(
        await service.create("Leads", input({ [field]: marker, Lead_Status: "Junk Lead" })),
      );
    const query = {
      viewId: "all-leads",
      page: 1,
      perPage: 100,
      search: `  ${marker.toUpperCase()}  `,
    };
    expect((await service.list("Leads", query)).records.map((record) => record.id)).toEqual(
      records
        .slice(0, 4)
        .map((record) => record.id)
        .reverse(),
    );
    const restricted = {
      ...query,
      viewId: "junk-leads",
      filters: { field: "Phone", comparator: "equal" as const, value: marker },
    };
    expect(await service.count("Leads", restricted)).toBe(1);
    expect((await service.list("Leads", restricted)).records.map((record) => record.id)).toEqual([
      records[3]?.id,
    ]);
    expect(await service.count("Leads", { ...query, search: "  " })).toBe(
      generateFixtureLeads().filter((record) => record.fields.Converted__s === false).length +
        records.length,
    );
  });
  it("implements case-sensitive exact is, null, any-of arrays and nested and/or groups", async () => {
    const service = make();
    const marker = randomUUID().slice(0, 20);
    const a = await service.create("Leads", input({ Company: marker, First_Name: "Alpha" }));
    const b = await service.create("Leads", input({ Company: marker, First_Name: null }));
    const c = await service.create("Leads", input({ Company: marker, First_Name: "alpha" }));
    const query = (filters: Criteria) =>
      service.list("Leads", {
        viewId: "all-leads",
        page: 1,
        perPage: 10,
        filters: {
          groupOperator: "and",
          group: [{ field: "Company", comparator: "equal", value: marker }, filters],
        },
      });
    expect(
      (await query({ field: "First_Name", comparator: "equal", value: "Alpha" })).records.map(
        (row) => row.id,
      ),
    ).toEqual([a.id]);
    expect(
      (await query({ field: "First_Name", comparator: "equal", value: null })).records.map(
        (row) => row.id,
      ),
    ).toEqual([b.id]);
    expect(
      (
        await query({
          groupOperator: "or",
          group: [
            { field: "First_Name", comparator: "equal", value: ["Alpha", "alpha"] },
            { field: "First_Name", comparator: "equal", value: null },
          ],
        })
      ).records.map((row) => row.id),
    ).toEqual([c.id, b.id, a.id]);
  });
  it("keeps id-descending order, stable ties and empty values last in both directions", async () => {
    const service = make();
    const marker = randomUUID().slice(0, 20);
    const ids = [];
    for (const value of [null, "beta", "ALPHA", "alpha", ""])
      ids.push((await service.create("Leads", input({ Company: marker, First_Name: value }))).id);
    const query = { viewId: "all-leads", page: 1, perPage: 10, search: marker };
    const unordered = await service.list("Leads", query);
    expect(unordered.sort).toEqual({ field: "id", order: "desc" });
    expect(unordered.records.map((record) => record.id)).toEqual([...ids].reverse());
    expect(
      (
        await service.list("Leads", { ...query, sort: { field: "First_Name", order: "asc" } })
      ).records.map((record) => record.id),
    ).toEqual([ids[3], ids[2], ids[1], ids[4], ids[0]]);
    expect(
      (
        await service.list("Leads", { ...query, sort: { field: "First_Name", order: "desc" } })
      ).records.map((record) => record.id),
    ).toEqual([ids[1], ids[3], ids[2], ids[4], ids[0]]);
  });
  it("compares record identifiers as decimal numbers", () => {
    const records = ["100", "99", "1000"].map((id) => ({ id, fields: { id } })) as RecordData[];
    expect(sortRecords(records, { field: "id", order: "asc" }).map((record) => record.id)).toEqual([
      "99",
      "100",
      "1000",
    ]);
  });
  it("sorts booleans, numbers and module references by value and leaves empty values last", async () => {
    const service = make();
    const marker = randomUUID().slice(0, 20);
    const a = await service.create(
      "Leads",
      input({
        Company: marker,
        Email_Opt_Out: true,
        Connected_To__s: { module: "Contacts", id: "b" },
        Annual_Revenue: 12,
      }),
    );
    const b = await service.create(
      "Leads",
      input({
        Company: marker,
        Email_Opt_Out: false,
        Connected_To__s: { module: "Contacts", id: "a" },
        Annual_Revenue: 2,
      }),
    );
    const c = await service.create("Leads", input({ Company: marker }));
    for (const field of ["Email_Opt_Out", "Connected_To__s", "Annual_Revenue"]) {
      for (const order of ["asc", "desc"] as const)
        expect(
          (
            await service.list("Leads", {
              viewId: "all-leads",
              page: 1,
              perPage: 10,
              search: marker,
              sort: { field, order },
            })
          ).records.map((record) => record.id),
        ).toEqual(order === "asc" ? [b.id, a.id, c.id] : [a.id, b.id, c.id]);
    }
    const dateRows = await service.list("Leads", {
      viewId: "all-leads",
      page: 1,
      perPage: 100,
      sort: { field: "Created_Time", order: "desc" },
    });
    const dates = dateRows.records.map((record) => Date.parse(String(record.fields.Created_Time)));
    expect(dates).toEqual([...dates].sort((a, b) => b - a));
  });
  it("rejects unknown query fields and invalid page values with query error keys", async () => {
    const service = make();
    const query = { viewId: "all-leads", page: 1, perPage: 10 };
    for (const page of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])
      await expect(service.list("Leads", { ...query, page })).rejects.toMatchObject({
        fieldErrors: { page: expect.any(Array) },
      });
    for (const perPage of [0, 11, 100.5, 1000])
      await expect(service.list("Leads", { ...query, perPage })).rejects.toMatchObject({
        fieldErrors: { perPage: expect.any(Array) },
      });
    await expect(
      service.list("Leads", { ...query, sort: { field: "Unknown", order: "asc" } }),
    ).rejects.toMatchObject({ fieldErrors: { sort: expect.any(Array) } });
    const filters: Criteria = {
      groupOperator: "and",
      group: [{ field: "Unknown", comparator: "equal", value: null }],
    };
    await expect(service.list("Leads", { ...query, filters })).rejects.toMatchObject({
      fieldErrors: { filters: expect.any(Array) },
    });
    await expect(service.count("Leads", { viewId: query.viewId, filters })).rejects.toMatchObject({
      fieldErrors: { filters: expect.any(Array) },
    });
  });
  it("rejects invalid writes atomically, protects system fields and validates all value shapes", async () => {
    const service = make();
    const record = await service.create("Leads", input());
    for (const field of [
      "Created_By",
      "Modified_By",
      "Created_Time",
      "Modified_Time",
      "Full_Name",
      "Unsubscribed_Mode",
    ])
      await expect(
        service.create("Leads", input({ [field]: "caller-value" })),
      ).rejects.toBeInstanceOf(ValidationError);
    const invalid: Record<string, FieldValue> = {
      No_of_Employees: Number.POSITIVE_INFINITY,
      Annual_Revenue: Number.NaN,
      Email_Opt_Out: 1,
      Connected_To__s: { module: "Contacts", id: 3 } as unknown as FieldValue,
      Unknown: "value",
      Email: "x".repeat(101),
    };
    for (const [field, value] of Object.entries(invalid)) {
      await expect(service.update("Leads", record.id, { [field]: value })).rejects.toMatchObject({
        fieldErrors: { [field]: expect.any(Array) },
      });
      expect(await service.get("Leads", record.id)).toEqual(record);
    }
    await expect(service.delete("Leads", [record.id, "missing"])).rejects.toThrow();
    expect(await service.get("Leads", record.id)).toEqual(record);
    for (const [field, value] of [
      ["No_of_Employees", 1_000_000_000],
      ["Annual_Revenue", 1e16],
      ["Latitude", 1e50],
    ] as const) {
      await expect(service.create("Leads", input({ [field]: value }))).rejects.toMatchObject({
        fieldErrors: { [field]: expect.any(Array) },
      });
    }
    const boundary = await service.create(
      "Leads",
      input({ No_of_Employees: 999_999_999, Annual_Revenue: 123.45 }),
    );
    expect(boundary.fields.No_of_Employees).toBe(999_999_999);
    const before = await service.count("Leads", { viewId: "all-leads" });
    await expect(
      service.create("Leads", input({ Lead_Source: "Online Store" })),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(await service.count("Leads", { viewId: "all-leads" })).toBe(before);
    expect(
      (await service.create("Leads", input({ Lead_Source: "OnlineStore", Rating: "ShutDown" })))
        .fields,
    ).toMatchObject({ Lead_Source: "OnlineStore", Rating: "ShutDown" });
  });
  it("stamps writes with the adapter clock and leaves new leads unconverted", async () => {
    let now = new Date("2026-04-01T00:00:00.000Z");
    const service = createFixtureRecordService(
      {
        orgId: randomUUID(),
        orgSlug: "fixture-clock",
        orgName: "Fixture Organization",
        userId: "fixture-clock-user",
        role: "admin",
      },
      { now: () => now },
    );
    const created = await service.create("Leads", input());
    expect(created.fields).toMatchObject({
      Created_Time: "2026-04-01T00:00:00.000Z",
      Modified_Time: "2026-04-01T00:00:00.000Z",
      Converted__s: false,
      Locked__s: false,
    });
    now = new Date("2026-04-02T03:04:05.000Z");
    const updated = await service.update("Leads", created.id, { Company: "Renamed Example" });
    expect(updated.fields.Created_Time).toBe("2026-04-01T00:00:00.000Z");
    expect(updated.fields.Modified_Time).toBe("2026-04-02T03:04:05.000Z");
  });
  it("lists and counts each view from an independent predicate, including interim boundaries", async () => {
    const clock = new Date("2026-06-15T12:00:00.000Z");
    const userId = "fixture-view-user";
    const service = createFixtureRecordService(
      {
        orgId: randomUUID(),
        orgSlug: "fixture-views",
        orgName: "Fixture Organization",
        userId,
        role: "admin",
      },
      { now: () => clock },
    );
    const day = 86_400_000;
    const names = new Set((await service.getModule("Leads")).fields.map((field) => field.apiName));
    const categories: Record<string, readonly string[]> = {
      Open: [
        "Attempted to Contact",
        "Contact in Future",
        "Contacted",
        "Lost Lead",
        "Not Contacted",
        "Pre-Qualified",
      ],
      Junk: ["Junk Lead"],
      "Not Qualified": ["Not Qualified"],
    };
    const utcDay = (value: string | Date) => {
      const parsed = value instanceof Date ? value.getTime() : Date.parse(value);
      return Number.isFinite(parsed) ? new Date(parsed).toISOString().slice(0, 10) : null;
    };
    const token = (value: unknown): value is CriteriaToken =>
      typeof value === "object" && value !== null && !Array.isArray(value) && "token" in value;
    const same = (left: FieldValue, right: FieldValue) => {
      if (typeof left === "object" && left && typeof right === "object" && right)
        return left.id === right.id && left.module === right.module;
      return left === right;
    };
    const leafMatches = (record: RecordData, criteria: Criteria): boolean => {
      if ("group" in criteria) {
        return criteria.groupOperator === "and"
          ? criteria.group.every((child) => leafMatches(record, child))
          : criteria.group.some((child) => leafMatches(record, child));
      }
      if (!names.has(criteria.field)) return true;
      const value = record.fields[criteria.field] ?? null;
      if (criteria.comparator === "equal") {
        if (Array.isArray(criteria.value)) return criteria.value.some((item) => same(value, item));
        if (token(criteria.value)) {
          if (criteria.value.token === "CURRENTUSER") return value === userId;
          if (criteria.value.token === "TODAY")
            return typeof value === "string" && utcDay(value) === utcDay(clock);
          if (criteria.value.token === "CATEGORY")
            return (categories[criteria.value.name] ?? []).includes(String(value));
          return false;
        }
        return same(value, criteria.value as FieldValue);
      }
      if (criteria.comparator === "contains" || criteria.comparator === "not_contains") {
        const hit =
          typeof value === "string" &&
          typeof criteria.value === "string" &&
          value.toLowerCase().includes(criteria.value.toLowerCase());
        return criteria.comparator === "contains" ? hit : !hit;
      }
      if (
        criteria.comparator === "less_equal" &&
        token(criteria.value) &&
        criteria.value.token === "AGEINDAYS" &&
        typeof value === "string"
      ) {
        const parsed = Date.parse(value);
        if (!Number.isFinite(parsed)) return false;
        return Math.floor((clock.getTime() - parsed) / day) <= criteria.value.offset;
      }
      return false;
    };
    const stored: RecordData[] = generateFixtureLeads(68, clock).map((record) => ({
      ...record,
      fields: {
        ...record.fields,
        Owner: userId,
        Created_By: userId,
        Modified_By: userId,
      },
    }));
    const byId = (ids: readonly string[]) =>
      [...ids].sort((left, right) => (BigInt(left) < BigInt(right) ? -1 : left === right ? 0 : 1));
    const listed = async (viewId: string) => {
      const ids: string[] = [];
      for (let page = 1; page <= 5; page++) {
        const result = await service.list("Leads", { viewId, page, perPage: 100 });
        expect(result.sort).toEqual({ field: "id", order: "desc" });
        ids.push(...result.records.map((record) => record.id));
        if (!result.moreRecords) break;
      }
      expect(await service.count("Leads", { viewId })).toBe(ids.length);
      return ids;
    };
    const views = await service.listViews("Leads");
    expect(views).toHaveLength(14);
    const members = new Map<string, string[]>();
    for (const view of views) {
      expect(view.criteria).not.toBeNull();
      if (!view.criteria) throw new Error("Expected criteria.");
      const actual = await listed(view.id);
      const expected = stored.filter((record) => leafMatches(record, view.criteria as Criteria));
      expect(actual.length).toBeGreaterThan(0);
      expect(byId(actual)).toEqual(byId(expected.map((record) => record.id)));
      members.set(view.id, actual);
    }
    const midnight = Date.UTC(clock.getUTCFullYear(), clock.getUTCMonth(), clock.getUTCDate());
    const at = (ms: number) => new Date(ms).toISOString();
    const findCreated = (ms: number) =>
      stored.find((record) => record.fields.Created_Time === at(ms));
    const justAfter = findCreated(midnight + 1000);
    const justBefore = findCreated(midnight - 1000);
    const within31 = findCreated(clock.getTime() - 31 * day);
    const beyond31 = findCreated(clock.getTime() - 32 * day);
    const missingTime = stored.find((record) => record.fields.Created_Time === null);
    const modifiedInside = stored.find(
      (record) =>
        record.fields.Modified_Time === at(clock.getTime() - 31 * day) &&
        record.fields.Created_Time === at(clock.getTime() - 40 * day),
    );
    for (const record of [justAfter, justBefore, within31, beyond31, missingTime, modifiedInside]) {
      expect(record).toBeDefined();
      expect(record?.fields.Converted__s).toBe(false);
    }
    const today = members.get("todays-leads") ?? [];
    const created = members.get("recently-created-leads") ?? [];
    const modified = members.get("recently-modified-leads") ?? [];
    const everyone = members.get("all-leads") ?? [];
    expect(today).toContain(justAfter?.id);
    expect(today).not.toContain(justBefore?.id);
    expect(today).not.toContain(missingTime?.id);
    expect(created).toContain(within31?.id);
    expect(created).toContain(justBefore?.id);
    expect(created).not.toContain(beyond31?.id);
    expect(created).not.toContain(missingTime?.id);
    expect(created).not.toContain(modifiedInside?.id);
    expect(modified).toContain(modifiedInside?.id);
    expect(modified).not.toContain(beyond31?.id);
    expect(modified).not.toContain(missingTime?.id);
    expect(everyone).toContain(missingTime?.id);
    expect(byId(members.get("unread-leads") ?? [])).toEqual(byId(everyone));
    expect(created.length).toBeGreaterThan(0);
    expect(byId(members.get("converted-leads") ?? [])).not.toEqual(byId(everyone));
  });
});
