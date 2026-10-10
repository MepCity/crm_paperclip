import { NotFoundError } from "@crm/core/errors";
import type { CurrencyDefinition, RecordData } from "@crm/core/records";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { UiProvider } from "@/components/ui/ui-provider";
import { createClientRecordService } from "@/lib/api/client/client-record-service";
import { ApiProvider } from "@/lib/api/client/provider";
import { LeadsFormClient } from "./leads-form-client";

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
}));

let counter = 0;

function harness(
  options: {
    currency?: Partial<CurrencyDefinition>;
    currencyError?: boolean;
    locale?: string;
    recordId?: string;
  } = {},
) {
  const ctx = {
    orgId: `form-currency-${++counter}`,
    orgSlug: "form-currency",
    orgName: "Form Currency",
    userId: "form-currency-author",
    role: "admin" as const,
  };
  const fixture = createFixtureRecordService(ctx, {
    listMemberIds: async () => [ctx.userId, "other-user"],
  });
  const service = createClientRecordService(fixture, {
    listUsers: async () => [
      { userId: ctx.userId, name: "Form Author", email: "author@example.test" },
      { userId: "other-user", name: "Other User", email: "other@example.test" },
    ],
  });
  const currency: CurrencyDefinition = {
    isoCode: "TRY",
    symbol: "TL",
    name: "Turkish Lira - TRY",
    prefixSymbol: true,
    ...options.currency,
  };
  if (options.currencyError)
    vi.spyOn(service, "getHomeCurrency").mockRejectedValue(new NotFoundError());
  else vi.spyOn(service, "getHomeCurrency").mockResolvedValue(currency);
  if (options.recordId)
    vi.spyOn(service, "get").mockResolvedValue({
      id: options.recordId,
      fields: { Company: "Saved Company", Last_Name: "Saved Lead" },
    } satisfies RecordData);
  const view = render(
    <UiProvider locale={options.locale}>
      <ApiProvider orgSlug={ctx.orgSlug} service={service}>
        <LeadsFormClient
          orgSlug={ctx.orgSlug}
          currentUserId={ctx.userId}
          recordId={options.recordId}
        />
      </ApiProvider>
    </UiProvider>,
  );
  return { view, service };
}

function prefixText(container: HTMLElement) {
  const prefix = container.querySelector(
    "[data-form-field=Annual_Revenue] .record-currency-prefix",
  );
  return prefix ? `${prefix.textContent}` : null;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  navigation.push.mockReset();
});

test("create draws the organization currency symbol as the Annual Revenue prefix", async () => {
  const { view } = harness();
  await screen.findByRole("heading", { name: "Create Lead" });
  await waitFor(() => expect(prefixText(view.container)).toBe("TL"));
});

test("edit draws the same organization currency symbol", async () => {
  const { view } = harness({ recordId: "saved-record" });
  await screen.findByRole("heading", { name: "Edit Lead" });
  await waitFor(() => expect(prefixText(view.container)).toBe("TL"));
});

test("the prefix is the symbol the service reports, not a fixed one", async () => {
  const { view } = harness({ currency: { isoCode: "EUR", symbol: "€", name: "Euro" } });
  await screen.findByRole("heading", { name: "Create Lead" });
  await waitFor(() => expect(prefixText(view.container)).toBe("€"));
});

test("a currency reported without a leading symbol still prefixes the amount", async () => {
  const { view } = harness({ currency: { prefixSymbol: false } });
  await screen.findByRole("heading", { name: "Create Lead" });
  await waitFor(() => expect(prefixText(view.container)).toBe("TL"));
});

test("the prefix does not change with the locale the primitives format with", async () => {
  const { view } = harness({ locale: "de-DE" });
  await screen.findByRole("heading", { name: "Create Lead" });
  await waitFor(() => expect(prefixText(view.container)).toBe("TL"));
});

test("a rejected currency request leaves the prefix out and the form still saves", async () => {
  const { view, service } = harness({ currencyError: true });
  await screen.findByRole("heading", { name: "Create Lead" });
  const user = userEvent.setup();
  await user.click(screen.getByRole("textbox", { name: "Company" }));
  await user.paste("Currency Company");
  await user.click(screen.getByRole("textbox", { name: "Last Name" }));
  await user.paste("Currency Lead");
  const create = vi.spyOn(service, "create");
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
  expect(create.mock.calls[0]?.[1]).toMatchObject({
    Company: "Currency Company",
    Last_Name: "Currency Lead",
  });
  expect(prefixText(view.container)).toBeNull();
});
