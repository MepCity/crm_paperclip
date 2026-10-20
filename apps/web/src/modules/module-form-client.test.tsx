import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { writeRecordCreatePrefill } from "@/lib/records/record-create-prefill";
import { dealsScreenDefinition } from "./deals/definition";
import { ModuleFormClient } from "./module-form-client";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/api/client/hooks", () => ({
  useHomeCurrency: () => ({ data: { symbol: "$" } }),
}));

vi.mock("@/components/records/form/record-form-screen", () => ({
  RecordFormScreen: (props: { config: { createPrefill?: Record<string, unknown> } }) => (
    <div data-testid="record-form-screen">
      <span data-testid="prefill-account">
        {(props.config.createPrefill?.Account_Name as { name?: string })?.name ?? "none"}
      </span>
    </div>
  ),
}));

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

test("consumes session prefill and passes it to RecordFormScreen", () => {
  writeRecordCreatePrefill("test-org", {
    module: "Deals",
    fields: {
      Account_Name: { module: "Accounts", id: "500000000000000000", name: "Account 001" },
    },
  });

  render(
    <ModuleFormClient
      orgSlug="test-org"
      definition={dealsScreenDefinition}
      currentUserId="user-1"
    />,
  );

  expect(screen.getByTestId("prefill-account").textContent).toBe("Account 001");
});
