import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ValidationError } from "../errors";
import type { Criteria, FieldValue, RecordInput } from "./contract";
import { describeRecordServiceContract } from "./contract-suite";
import { createFixtureRecordService } from "./fixture";
import { generateFixtureLeads } from "./fixture/seed";
import { SYSTEM_VIEW_IDS_WITH_INTERIM_NULL_CRITERIA } from "./fixture/views";

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

describe("interim fixture policies (not reference parity)", () => {
  it("generates 250 repeatable synthetic records with a seeded generator", () => {
    const records = generateFixtureLeads(68);
    expect(records).toHaveLength(250);
    expect(generateFixtureLeads(68)).toEqual(records);
    expect(generateFixtureLeads(69)).not.toEqual(records);
    expect(new Set(records.map((record) => record.id)).size).toBe(250);
    for (const [index, record] of records.entries()) {
      const suffix = String(index + 1).padStart(3, "0");
      expect(record.fields).toMatchObject({
        Last_Name: `Lead ${suffix}`,
        Full_Name: `Lead ${suffix}`,
        Company: `Example Company ${suffix}`,
        Email: `lead-${suffix}@example.org`,
        Phone: `000-${suffix}`,
        Country: null,
        State: null,
        Unsubscribed_Mode: null,
        Unsubscribed_Time: null,
      });
      expect(JSON.parse(JSON.stringify(record))).toEqual(record);
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
  it("publishes all 14 views with exact names, columns, category expansion and null system predicates", async () => {
    const all = ["Full_Name", "Company", "Email", "Phone", "Lead_Source", "Owner"];
    const converted = ["Full_Name", "Company", "Phone", "Email"];
    const custom = ["Last_Name", "First_Name", "Company", "Email"];
    const rows: [string, string, readonly string[], readonly string[] | null][] = [
      ["all-leads", "All Leads", all, null],
      ["all-locked-leads", "All Locked Leads", all, null],
      ["converted-leads", "Converted Leads", converted, null],
      ["junk-leads", "Junk Leads", custom, ["Junk Lead"]],
      ["mailing-labels", "Mailing Labels", ["Salutation", "Full_Name", "Company"], null],
      ["my-converted-leads", "My Converted Leads", converted, null],
      ["my-leads", "My Leads", all.slice(0, -1), null],
      ["not-qualified-leads", "Not Qualified Leads", custom, ["Not Qualified"]],
      [
        "open-leads",
        "Open Leads",
        custom,
        [
          "Attempted to Contact",
          "Contact in Future",
          "Contacted",
          "Lost Lead",
          "Not Contacted",
          "Pre-Qualified",
        ],
      ],
      ["recently-created-leads", "Recently Created Leads", all, null],
      ["recently-modified-leads", "Recently Modified Leads", all, null],
      ["todays-leads", "Today's Leads", all, null],
      ["unread-leads", "Unread Leads", all, null],
      [
        "unsubscribed-leads",
        "Unsubscribed Leads",
        [
          "Full_Name",
          "Company",
          "Email",
          "Owner",
          "Created_Time",
          "Unsubscribed_Mode",
          "Unsubscribed_Time",
        ],
        null,
      ],
    ];
    const views = await make().listViews("Leads");
    expect(views).toEqual(
      rows.map(([id, name, columns, statuses]) => ({
        id,
        name,
        columns,
        systemDefined: statuses === null,
        isDefault: id === "all-leads",
        sort: null,
        criteria: statuses ? { field: "Lead_Status", comparator: "is", value: statuses } : null,
      })),
    );
    expect(SYSTEM_VIEW_IDS_WITH_INTERIM_NULL_CRITERIA).toEqual(
      rows.filter((row) => row[3] === null).map((row) => row[0]),
    );
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
  it("recomputes Full_Name on create/update without salutation", async () => {
    const service = make();
    const record = await service.create(
      "Leads",
      input({ First_Name: "Example", Last_Name: "Lead", Salutation: "Dr." }),
    );
    expect(record.fields.Full_Name).toBe("Example Lead");
    expect(
      (await service.update("Leads", record.id, { Last_Name: "Updated" })).fields.Full_Name,
    ).toBe("Example Updated");
    expect((await service.update("Leads", record.id, { First_Name: null })).fields.Full_Name).toBe(
      "Updated",
    );
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
      records.slice(0, 4).map((record) => record.id),
    );
    const restricted = {
      ...query,
      viewId: "junk-leads",
      filters: { field: "Phone", comparator: "is" as const, value: marker },
    };
    expect(await service.count("Leads", restricted)).toBe(1);
    expect((await service.list("Leads", restricted)).records.map((record) => record.id)).toEqual([
      records[3]?.id,
    ]);
    expect(await service.count("Leads", { ...query, search: "  " })).toBe(257);
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
          group: [{ field: "Company", comparator: "is", value: marker }, filters],
        },
      });
    expect(
      (await query({ field: "First_Name", comparator: "is", value: "Alpha" })).records.map(
        (row) => row.id,
      ),
    ).toEqual([a.id]);
    expect(
      (await query({ field: "First_Name", comparator: "is", value: null })).records.map(
        (row) => row.id,
      ),
    ).toEqual([b.id]);
    expect(
      (
        await query({
          groupOperator: "or",
          group: [
            { field: "First_Name", comparator: "is", value: ["Alpha", "alpha"] },
            { field: "First_Name", comparator: "is", value: null },
          ],
        })
      ).records.map((row) => row.id),
    ).toEqual([a.id, b.id, c.id]);
  });
  it("keeps insertion order, stable ties and empty values last in both directions", async () => {
    const service = make();
    const marker = randomUUID().slice(0, 20);
    const ids = [];
    for (const value of [null, "beta", "ALPHA", "alpha", ""])
      ids.push((await service.create("Leads", input({ Company: marker, First_Name: value }))).id);
    const query = { viewId: "all-leads", page: 1, perPage: 10, search: marker };
    expect((await service.list("Leads", query)).records.map((record) => record.id)).toEqual(ids);
    expect(
      (
        await service.list("Leads", { ...query, sort: { field: "First_Name", order: "asc" } })
      ).records.map((record) => record.id),
    ).toEqual([ids[2], ids[3], ids[1], ids[0], ids[4]]);
    expect(
      (
        await service.list("Leads", { ...query, sort: { field: "First_Name", order: "desc" } })
      ).records.map((record) => record.id),
    ).toEqual([ids[1], ids[2], ids[3], ids[0], ids[4]]);
    const seedOrder = (await service.list("Leads", { viewId: "all-leads", page: 1, perPage: 100 }))
      .records;
    expect(seedOrder).toEqual(generateFixtureLeads().slice(0, 100));
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
      group: [{ field: "Unknown", comparator: "is", value: null }],
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
      "Owner",
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
});
