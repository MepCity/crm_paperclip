import { ValidationError } from "@crm/core/errors";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { AddToCampaignsDialog } from "./add-to-campaigns-dialog";

afterEach(cleanup);

async function setup(module: "Leads" | "Contacts" = "Leads", single = false) {
  const service = createFixtureRecordService({
    orgId: crypto.randomUUID(),
    orgSlug: "membership-test",
    orgName: "Test",
    userId: "test-user",
    role: "admin",
  });
  const campaigns = await Promise.all(
    ["Membership Alpha", "Membership Beta"].map((Campaign_Name) =>
      service.create("Campaigns", { Campaign_Name }),
    ),
  );
  const members = await Promise.all(
    ["First", "Second"].map((Last_Name) =>
      service.create(module, {
        Last_Name,
        ...(module === "Leads" ? { Company: "Synthetic" } : {}),
      }),
    ),
  );
  const onDone = vi.fn();
  const onCancel = vi.fn();
  const user = userEvent.setup();
  render(
    <AddToCampaignsDialog
      module={module}
      recordIds={single ? (members[0]?.id ?? "missing") : members.map((r) => r.id)}
      recordService={service}
      onDone={onDone}
      onCancel={onCancel}
    />,
  );
  await user.type(screen.getByRole("textbox", { name: "Search" }), "Membership");
  await screen.findByRole("checkbox", { name: "Membership Alpha" });
  return { service, campaigns, members, onDone, onCancel, user };
}

test("Add starts disabled and sends the selected Member Status for every campaign/member pair", async () => {
  const { user, service, onDone } = await setup();
  const create = vi.spyOn(service, "create");
  const add = screen.getByRole("button", { name: "Add" }) as HTMLButtonElement;
  expect(add.disabled).toBe(true);
  await user.click(screen.getByRole("button", { name: /Member Status/ }));
  await user.click(await screen.findByRole("option", { name: "Sent" }));
  await user.click(screen.getByRole("checkbox", { name: "Membership Alpha" }));
  await user.click(screen.getByRole("checkbox", { name: "Membership Beta" }));
  expect(add.disabled).toBe(false);
  await user.click(add);
  await waitFor(() => expect(onDone).toHaveBeenCalledWith(4));
  expect(create).toHaveBeenCalledTimes(4);
  for (const [module, input] of create.mock.calls) {
    expect(module).toBe("Campaign_Members");
    expect(input.Member_Status).toBe("Sent");
    expect(input.Lead).toBeTruthy();
    expect(input.Contact).toBeUndefined();
  }
});

test("Contact input skips an existing pair and uses null for an empty status", async () => {
  const { user, service, campaigns, members, onDone } = await setup("Contacts");
  await service.create("Campaign_Members", {
    Campaign: { module: "Campaigns", id: campaigns[0]?.id ?? "missing" },
    Contact: { module: "Contacts", id: members[0]?.id ?? "missing" },
    Member_Status: "Opened",
  });
  const create = vi.spyOn(service, "create");
  await user.click(screen.getByRole("checkbox", { name: "Membership Alpha" }));
  await user.click(screen.getByRole("button", { name: "Add" }));
  await waitFor(() => expect(onDone).toHaveBeenCalledWith(1));
  expect(create).toHaveBeenCalledExactlyOnceWith("Campaign_Members", {
    Campaign: { module: "Campaigns", id: campaigns[0]?.id ?? "missing" },
    Contact: { module: "Contacts", id: members[1]?.id ?? "missing" },
    Member_Status: null,
  });
});

test("a partial server failure keeps the dialog open, shows the first error and retries without duplicates", async () => {
  const { user, service, onDone } = await setup();
  const original = service.create.bind(service);
  const create = vi
    .spyOn(service, "create")
    .mockImplementationOnce(original)
    .mockRejectedValueOnce(
      new ValidationError({ Lead: ["First server error", "Second server error"] }),
    );
  await user.click(screen.getByRole("checkbox", { name: "Membership Alpha" }));
  await user.click(screen.getByRole("button", { name: "Add" }));
  expect((await screen.findByRole("alert")).textContent).toBe("First server error");
  expect(onDone).not.toHaveBeenCalled();
  expect(screen.getByRole("dialog", { name: "Add to Campaigns" })).toBeTruthy();
  create.mockImplementation(original);
  await user.click(screen.getByRole("button", { name: "Add" }));
  await waitFor(() => expect(onDone).toHaveBeenCalledWith(2));
  expect(create).toHaveBeenCalledTimes(3);
});

test("Cancel dismisses without creating membership", async () => {
  const { user, service, onCancel, onDone } = await setup();
  const create = vi.spyOn(service, "create");
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(onCancel).toHaveBeenCalledOnce();
  expect(onDone).not.toHaveBeenCalled();
  expect(create).not.toHaveBeenCalled();
});

test("a scalar record id creates one membership per selected campaign", async () => {
  const { user, service, onDone } = await setup("Leads", true);
  const create = vi.spyOn(service, "create");
  await user.click(screen.getByRole("checkbox", { name: "Membership Alpha" }));
  await user.click(screen.getByRole("checkbox", { name: "Membership Beta" }));
  await user.click(screen.getByRole("button", { name: "Add" }));
  await waitFor(() => expect(onDone).toHaveBeenCalledWith(2));
  expect(create).toHaveBeenCalledTimes(2);
});
