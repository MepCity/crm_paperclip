import { act, cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { describedBy, submittedValues } from "@/test/dom";
import { render } from "@/test/render";
import { ComboBox, ComboBoxItem } from "./combo-box";
import { Form } from "./form";

interface Account {
  id: string;
  name: string;
}

const accounts: Account[] = [
  { id: "account-1", name: "Northwind Traders" },
  { id: "account-2", name: "Contoso Ltd" },
  { id: "account-3", name: "Fabrikam Inc" },
];

function accountItem(item: Account) {
  return (
    <ComboBoxItem id={item.id} textValue={item.name}>
      {item.name}
    </ComboBoxItem>
  );
}

/** A promise the test resolves by hand, so the order of the answers can be turned around. */
function deferred() {
  let resolve!: (value: Account[]) => void;
  const promise = new Promise<Account[]>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

afterEach(cleanup);

const input = () => screen.getByRole("combobox", { name: "Account" }) as HTMLInputElement;

test("ComboBox filters as the user types and selects with the keyboard", async () => {
  const user = userEvent.setup();
  render(
    <form>
      <ComboBox name="account" label="Account" items={accounts}>
        {accountItem}
      </ComboBox>
    </form>,
  );

  await user.type(input(), "cont");
  expect(screen.getAllByRole("option")).toHaveLength(1);
  expect(screen.getByRole("option", { name: "Contoso Ltd" })).toBeTruthy();

  await user.keyboard("{ArrowDown}");
  await user.keyboard("{Enter}");

  expect(screen.queryByRole("listbox")).toBeNull();
  expect(input().value).toBe("Contoso Ltd");
  expect(submittedValues()).toEqual(["account=account-2"]);
});

test("ComboBox closes with Escape", async () => {
  const user = userEvent.setup();
  render(
    <ComboBox name="account" label="Account" items={accounts}>
      {accountItem}
    </ComboBox>,
  );

  await user.type(input(), "cont");
  expect(screen.queryByRole("listbox")).toBeTruthy();

  await user.keyboard("{Escape}");
  expect(screen.queryByRole("listbox")).toBeNull();
});

test("ComboBox shows its description to assistive technology", () => {
  render(
    <ComboBox name="account" label="Account" items={accounts} description="Start typing to search">
      {accountItem}
    </ComboBox>,
  );

  expect(describedBy(input())).toBe("Start typing to search");
});

test("ComboBox ties its error message to the field", () => {
  render(
    <ComboBox name="account" label="Account" items={accounts} isInvalid errorMessage="Pick one">
      {accountItem}
    </ComboBox>,
  );

  expect(input().getAttribute("aria-invalid")).toBe("true");
  expect(describedBy(input())).toBe("Pick one");
});

test("ComboBox shows the field error a form action returned", () => {
  render(
    <Form
      validationBehavior="aria"
      actionState={{
        status: "error",
        message: "Fix the fields below",
        fieldErrors: { account: ["Pick an account"] },
      }}
    >
      <ComboBox name="account" label="Account" items={accounts}>
        {accountItem}
      </ComboBox>
    </Form>,
  );

  expect(input().getAttribute("aria-invalid")).toBe("true");
  expect(describedBy(input())).toBe("Pick an account");
});

test("ComboBox in the disabled state cannot be opened", async () => {
  const user = userEvent.setup();
  render(
    <ComboBox name="account" label="Account" items={accounts} isDisabled>
      {accountItem}
    </ComboBox>,
  );

  expect(input().disabled).toBe(true);
  await user.click(input());
  expect(screen.queryByRole("listbox")).toBeNull();
});

test("ComboBox marks itself required", () => {
  render(
    <ComboBox name="account" label="Account" items={accounts} isRequired>
      {accountItem}
    </ComboBox>,
  );

  expect(input().required).toBe(true);
});

test("ComboBox sends one search per typing pause", async () => {
  const user = userEvent.setup();
  const loadOptions = vi.fn(async (_query: string): Promise<Account[]> => []);
  render(
    <ComboBox name="account" label="Account" loadOptions={loadOptions}>
      {accountItem}
    </ComboBox>,
  );

  await user.type(input(), "cont");
  expect(loadOptions).not.toHaveBeenCalled();

  await waitFor(() => expect(loadOptions).toHaveBeenCalledTimes(1));
  expect(loadOptions).toHaveBeenCalledWith("cont");
});

test("ComboBox shows a loading state while the search runs", async () => {
  const user = userEvent.setup();
  const pending = deferred();
  render(
    <ComboBox name="account" label="Account" loadOptions={() => pending.promise}>
      {accountItem}
    </ComboBox>,
  );

  await user.type(input(), "cont");
  await waitFor(() => expect(screen.getByRole("status").textContent).toBe("Loading"));

  await act(async () => {
    pending.resolve([accounts[1] as Account]);
  });

  await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
  expect(screen.getByRole("option", { name: "Contoso Ltd" })).toBeTruthy();
});

test("ComboBox shows when a search found nothing", async () => {
  const user = userEvent.setup();
  const loadOptions = vi.fn(async (_query: string): Promise<Account[]> => []);
  render(
    <ComboBox name="account" label="Account" loadOptions={loadOptions}>
      {accountItem}
    </ComboBox>,
  );

  await user.type(input(), "zzz");

  await waitFor(() => expect(screen.getByRole("status").textContent).toBe("No results"));
  expect(screen.queryAllByRole("option")).toHaveLength(0);
});

test("ComboBox keeps the newest answer when an older search lands late", async () => {
  const user = userEvent.setup();
  const first = deferred();
  const second = deferred();
  const loadOptions = vi.fn(async (query: string) =>
    query === "cont" ? first.promise : second.promise,
  );
  render(
    <ComboBox name="account" label="Account" loadOptions={loadOptions}>
      {accountItem}
    </ComboBox>,
  );

  await user.type(input(), "cont");
  await waitFor(() => expect(loadOptions).toHaveBeenCalledTimes(1));

  await user.clear(input());
  await user.type(input(), "fab");
  await waitFor(() => expect(loadOptions).toHaveBeenCalledTimes(2));

  // The newer search answers first; the older answer arrives afterwards and is dropped.
  await act(async () => {
    second.resolve([accounts[2] as Account]);
  });
  await act(async () => {
    first.resolve([accounts[1] as Account]);
  });

  expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
    "Fabrikam Inc",
  ]);
});

test("ComboBox submits the id of the option a search returned", async () => {
  const user = userEvent.setup();
  const loadOptions = vi.fn(async (_query: string): Promise<Account[]> => [accounts[2] as Account]);
  render(
    <form>
      <ComboBox name="account" label="Account" loadOptions={loadOptions}>
        {accountItem}
      </ComboBox>
    </form>,
  );

  await user.type(input(), "fab");
  await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(1));

  await user.keyboard("{ArrowDown}");
  await user.keyboard("{Enter}");

  expect(submittedValues()).toEqual(["account=account-3"]);
});
