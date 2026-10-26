import { createFixtureRecordService } from "@crm/core/records/fixture";
import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { LanguageProvider } from "@/i18n/client-provider";
import { createClientRecordService } from "@/lib/api/client/client-record-service";
import { ApiProvider } from "@/lib/api/client/provider";
import { render } from "@/test/render";
import { CallsCreateControl } from "./calls-create-control";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
afterEach(cleanup);
test("opens the Turkish entry menu before a schedule dialog and cancels without creating", async () => {
  const ctx = {
    orgId: "calls-test",
    orgSlug: "calls-test",
    orgName: "Calls Test",
    userId: "tester",
    role: "admin" as const,
  };
  const service = createClientRecordService(createFixtureRecordService(ctx), {
    listUsers: async () => [{ userId: "tester", name: "Test Owner", email: "owner@example.test" }],
  });
  const create = vi.spyOn(service, "create");
  const importRecords = vi.fn();
  render(
    <LanguageProvider language="tr">
      <ApiProvider orgSlug={ctx.orgSlug} service={service}>
        <CallsCreateControl
          orgSlug={ctx.orgSlug}
          currentUserId={ctx.userId}
          items={[{ id: "import", label: "İçe Aktar", onAction: importRecords }]}
        />
      </ApiProvider>
    </LanguageProvider>,
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Arama Oluştur" }));
  expect(screen.queryByRole("dialog", { name: "Çağrı zamanla" })).toBeNull();
  expect(screen.getByRole("menuitem", { name: "Günlüğe bir arama kaydet" })).toBeTruthy();
  await user.click(screen.getByRole("menuitem", { name: "Çağrı zamanla" }));
  expect(await screen.findByRole("dialog", { name: "Çağrı zamanla" })).toBeTruthy();
  await waitFor(() =>
    expect(screen.getByLabelText("Konu")).toHaveProperty(
      "value",
      "Arama Bilinmiyor ile zamanlandı",
    ),
  );
  expect(screen.getByRole("button", { name: "Arama Tipi" })).toHaveProperty("disabled", true);
  await user.click(screen.getByRole("button", { name: "İptal" }));
  expect(screen.queryByRole("dialog", { name: "Çağrı zamanla" })).toBeNull();
  expect(create).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Diğer" }));
  await user.click(screen.getByRole("menuitem", { name: "İçe Aktar" }));
  expect(importRecords).toHaveBeenCalledOnce();
});
