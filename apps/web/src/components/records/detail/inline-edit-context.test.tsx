import type { FieldDefinition } from "@crm/core/records";
import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { InlineEditProvider, useInlineEdit } from "./inline-edit-context";

afterEach(cleanup);

test("useInlineEdit returns null when called outside InlineEditProvider", () => {
  function Consumer() {
    const ctx = useInlineEdit();
    return <div>{ctx === null ? "no-context" : "has-context"}</div>;
  }

  render(<Consumer />);
  expect(screen.getByText("no-context")).toBeTruthy();
});

test("InlineEditProvider supplies activeId and allows activate/deactivate updates", async () => {
  const user = userEvent.setup();
  const eligible = vi.fn().mockReturnValue(true);
  const save = vi.fn().mockResolvedValue(undefined);

  function Consumer() {
    const ctx = useInlineEdit();
    if (!ctx) return null;
    return (
      <div>
        <span data-testid="active-id">{ctx.activeId ?? "none"}</span>
        <button type="button" onClick={() => ctx.activate("email")}>
          Activate Email
        </button>
        <button type="button" onClick={() => ctx.activate(null)}>
          Deactivate
        </button>
      </div>
    );
  }

  const { getByTestId } = render(
    <InlineEditProvider eligible={eligible} save={save}>
      <Consumer />
    </InlineEditProvider>,
  );

  expect(getByTestId("active-id").textContent).toBe("none");

  await user.click(screen.getByRole("button", { name: "Activate Email" }));
  expect(getByTestId("active-id").textContent).toBe("email");

  await user.click(screen.getByRole("button", { name: "Deactivate" }));
  expect(getByTestId("active-id").textContent).toBe("none");
});

test("InlineEditProvider passes through eligible, save, and recordPath callbacks", async () => {
  const user = userEvent.setup();
  const eligible = vi.fn().mockReturnValue(true);
  const save = vi.fn().mockResolvedValue(undefined);
  const recordPath = vi.fn((module: string, id: string) => `/${module}/${id}`);

  const sampleField: FieldDefinition = {
    apiName: "Title",
    label: "Title",
    dataType: "text",
    required: false,
    readOnly: false,
    unique: false,
    massUpdate: false,
    views: { view: true, edit: true, create: true, quickCreate: true },
  };

  function Consumer() {
    const ctx = useInlineEdit();
    if (!ctx) return null;
    return (
      <div>
        <button
          type="button"
          onClick={() => {
            ctx.eligible(sampleField);
            void ctx.save({ values: { Title: "Director" } });
            if (ctx.recordPath) {
              const path = ctx.recordPath("leads", "rec-123");
              ctx.activate(path);
            }
          }}
        >
          Execute Callbacks
        </button>
        <span data-testid="path-id">{ctx.activeId ?? ""}</span>
      </div>
    );
  }

  const { getByTestId } = render(
    <InlineEditProvider eligible={eligible} save={save} recordPath={recordPath}>
      <Consumer />
    </InlineEditProvider>,
  );

  await user.click(screen.getByRole("button", { name: "Execute Callbacks" }));

  expect(eligible).toHaveBeenCalledWith(sampleField);
  expect(save).toHaveBeenCalledWith({ values: { Title: "Director" } });
  expect(recordPath).toHaveBeenCalledWith("leads", "rec-123");
  expect(getByTestId("path-id").textContent).toBe("/leads/rec-123");
});

test("auto-derives ownerNames from users when ownerNames is omitted", () => {
  const users = [
    { id: "usr-1", name: "Alice Engineer", email: "alice@example.com" },
    { id: "usr-2", name: "Bob Manager", email: "bob@example.com" },
  ] as const;

  function Consumer() {
    const ctx = useInlineEdit();
    if (!ctx) return null;
    return (
      <div>
        <span data-testid="users-count">{ctx.users?.length ?? 0}</span>
        <span data-testid="usr-1-name">{ctx.ownerNames?.["usr-1"] ?? "none"}</span>
        <span data-testid="usr-2-name">{ctx.ownerNames?.["usr-2"] ?? "none"}</span>
      </div>
    );
  }

  const { getByTestId } = render(
    <InlineEditProvider
      eligible={() => true}
      save={vi.fn().mockResolvedValue(undefined)}
      users={users}
    >
      <Consumer />
    </InlineEditProvider>,
  );

  expect(getByTestId("users-count").textContent).toBe("2");
  expect(getByTestId("usr-1-name").textContent).toBe("Alice Engineer");
  expect(getByTestId("usr-2-name").textContent).toBe("Bob Manager");
});

test("uses explicit ownerNames when provided instead of auto-deriving", () => {
  const users = [{ id: "usr-1", name: "Alice", email: "alice@example.com" }] as const;
  const ownerNames = { "usr-custom": "Custom Name" };

  function Consumer() {
    const ctx = useInlineEdit();
    if (!ctx) return null;
    return (
      <div>
        <span data-testid="custom-name">{ctx.ownerNames?.["usr-custom"] ?? "none"}</span>
        <span data-testid="alice-name">{ctx.ownerNames?.["usr-1"] ?? "none"}</span>
      </div>
    );
  }

  const { getByTestId } = render(
    <InlineEditProvider
      eligible={() => true}
      save={vi.fn().mockResolvedValue(undefined)}
      users={users}
      ownerNames={ownerNames}
    >
      <Consumer />
    </InlineEditProvider>,
  );

  expect(getByTestId("custom-name").textContent).toBe("Custom Name");
  expect(getByTestId("alice-name").textContent).toBe("none");
});

test("leaves ownerNames undefined when neither users nor ownerNames is provided", () => {
  function Consumer() {
    const ctx = useInlineEdit();
    if (!ctx) return null;
    return (
      <span data-testid="owner-names">
        {ctx.ownerNames === undefined ? "undefined" : "defined"}
      </span>
    );
  }

  const { getByTestId } = render(
    <InlineEditProvider eligible={() => true} save={vi.fn().mockResolvedValue(undefined)}>
      <Consumer />
    </InlineEditProvider>,
  );

  expect(getByTestId("owner-names").textContent).toBe("undefined");
});
