import { createFixtureRecordService } from "@crm/core/records/fixture";
import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { RecordFormScreen } from "@/components/records/form/record-form-screen";
import { createClientRecordService } from "@/lib/api/client/client-record-service";
import { ApiProvider } from "@/lib/api/client/provider";
import { render } from "@/test/render";
import { callsScreenDefinition } from "./definition";

let counter = 0;
function harness(recordId?: string) {
  const ctx = {
    orgId: `call-form-${++counter}`,
    orgSlug: "call-form",
    orgName: "Call Form",
    userId: "form-author",
    role: "admin" as const,
  };
  const service = createClientRecordService(createFixtureRecordService(ctx), {
    listUsers: async () => [
      { userId: ctx.userId, name: "Form Author", email: "author@example.test" },
    ],
  });
  const navigate = vi.fn();
  render(
    <ApiProvider orgSlug={ctx.orgSlug} service={service}>
      <RecordFormScreen
        currentUserId={ctx.userId}
        recordId={recordId}
        config={{
          module: "Calls",
          variant: callsScreenDefinition.form.variant,
          inventoryChrome: true,
          rules: callsScreenDefinition.form.rules,
          sectionColumnOverrides: callsScreenDefinition.form.fallbackColumns,
          paths: { detail: (id) => `detail:${id}`, create: "create", cancel: "origin" },
          navigate,
        }}
      />
    </ApiProvider>,
  );
  return { service, navigate };
}
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

test("Create Call paints the scheduling fields with Outbound and Scheduled", async () => {
  harness();
  await screen.findByRole("heading", { name: "Create Call" });
  expect(screen.getByRole("button", { name: "Call Type" }).textContent).toContain("Outbound");
  expect(screen.getByRole("button", { name: "Outgoing Call Status" }).textContent).toContain(
    "Scheduled",
  );
  expect(screen.getByRole("button", { name: "Reminder" })).toBeTruthy();
  expect(screen.getAllByText("Call From/To")[0]).toBeTruthy();
  expect(screen.queryByText("Call Duration")).toBeNull();
  expect(screen.queryByText("Call Result")).toBeNull();
});

test("Inbound switches the form to record mode", async () => {
  harness();
  await screen.findByRole("heading", { name: "Create Call" });
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Call Type" }));
  await user.click(screen.getByRole("option", { name: "Inbound" }));
  await waitFor(() => expect(screen.queryByRole("button", { name: "Reminder" })).toBeNull());
  expect(screen.getAllByText("Call Duration")[0]).toBeTruthy();
  expect(screen.getAllByText("Call Result")[0]).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(await screen.findByText(/Call From\/To cannot be empty/)).toBeTruthy();
  expect(screen.getByText(/Call Duration cannot be empty/)).toBeTruthy();
});
