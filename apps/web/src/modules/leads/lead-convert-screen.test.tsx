import { createFixtureRecordService } from "@crm/core/records/fixture";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClientRecordService } from "@/lib/api/client/client-record-service";
import type { ClientRecordService } from "@/lib/api/client/http-record-service";
import { ApiProvider } from "@/lib/api/client/provider";
import { LeadConvertScreen } from "./lead-convert-screen";

const navigation = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navigation }));

const ctx = {
  orgId: "lead-convert-org",
  orgSlug: "lead-convert-org",
  orgName: "Lead Convert Org",
  userId: "lead-convert-user",
  role: "admin" as const,
};

let service: ClientRecordService;
let leadId: string;

async function renderScreen() {
  render(
    <ApiProvider orgSlug={ctx.orgSlug} service={service}>
      <LeadConvertScreen orgSlug={ctx.orgSlug} recordId={leadId} />
    </ApiProvider>,
  );
  await screen.findByRole("heading", { name: "Convert Lead" });
}

beforeEach(async () => {
  navigation.push.mockClear();
  service = createClientRecordService(createFixtureRecordService(ctx), {
    listUsers: async () => [{ userId: ctx.userId, name: "Convert User", email: "c@example.test" }],
  });
  leadId = (await service.create("Leads", { Last_Name: "Dialog", Company: "Dialog Co" })).id;
});
afterEach(cleanup);

describe("LeadConvertScreen", () => {
  it("shows the lead identity, hides the deal fields and prefills the owner", async () => {
    await renderScreen();
    expect(
      screen.getByRole("heading", { name: "Convert Lead" }).parentElement?.textContent,
    ).toContain("Dialog Co");
    expect(screen.queryByLabelText(/Closing Date/)).toBeNull();
    expect(screen.queryByRole("radio")).toBeNull();
    await waitFor(() =>
      expect((screen.getByLabelText("Owner of the New Records") as HTMLInputElement).value).toBe(
        "Convert User",
      ),
    );
  });

  it("expands the deal fields with the company as deal name and validates required ones", async () => {
    const user = userEvent.setup();
    await renderScreen();
    await user.click(screen.getByRole("checkbox", { name: /Create a new Deal/ }));
    expect((screen.getByLabelText(/Deal Name/) as HTMLInputElement).value).toBe("Dialog Co");
    await user.click(screen.getByRole("button", { name: "Convert" }));
    expect(await screen.findByText("Closing Date is required.")).toBeTruthy();
    expect(navigation.push).not.toHaveBeenCalled();
    expect((await service.get("Leads", leadId)).fields.Converted__s).not.toBe(true);
  });

  it("requires a chosen record in existing mode", async () => {
    const user = userEvent.setup();
    await renderScreen();
    await user.click(screen.getByRole("button", { name: "Create New Account: Dialog Co" }));
    await user.click(screen.getAllByRole("radio", { name: "Choose existing" })[0] as HTMLElement);
    await user.click(screen.getByRole("button", { name: "Convert" }));
    expect(await screen.findByText("Choose an account to convert into.")).toBeTruthy();
  });

  it("converts and opens the new contact", async () => {
    const user = userEvent.setup();
    await renderScreen();
    await user.click(screen.getByRole("button", { name: "Convert" }));
    await waitFor(() => expect(navigation.push).toHaveBeenCalled());
    expect(navigation.push.mock.calls[0]?.[0]).toMatch(/\/tab\/Contacts\/\w+$/);
    expect((await service.get("Leads", leadId)).fields.Converted__s).toBe(true);
  });

  it("cancels back to the lead", async () => {
    const user = userEvent.setup();
    await renderScreen();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(navigation.push).toHaveBeenCalledWith(`/crm/${ctx.orgSlug}/tab/Leads/${leadId}`);
  });

  it("shows the server error and stays put when conversion fails", async () => {
    const user = userEvent.setup();
    vi.spyOn(service, "convertLead").mockRejectedValueOnce(new Error("Boom"));
    await renderScreen();
    await user.click(screen.getByRole("button", { name: "Convert" }));
    expect((await screen.findAllByText("Boom")).length).toBeGreaterThan(0);
    expect(navigation.push).not.toHaveBeenCalled();
  });
});
