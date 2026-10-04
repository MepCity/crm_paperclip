import { act, cleanup, configure, getConfig, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { describedBy, submittedValues } from "@/test/dom";
import { render } from "@/test/render";
import { ComboBox, ComboBoxItem } from "./combo-box";
import { Form } from "./form";
import { UiProvider } from "./ui-provider";

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

const asyncWrapper = getConfig().asyncWrapper;

// Keep the debounce clock independent of typing speed and machine load.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  // RTL's default wrapper drains a zero-delay timer only with Jest, not Vitest.
  configure({
    asyncWrapper: async <T,>(callback: () => Promise<T>) => {
      let result!: T;
      await act(async () => {
        result = await callback();
      });
      return result;
    },
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  configure({ asyncWrapper });
});

function setupUser() {
  return userEvent.setup({
    advanceTimers: (milliseconds) => {
      vi.advanceTimersByTime(milliseconds);
    },
  });
}

async function advanceTime(milliseconds = 300) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(milliseconds);
  });
}

const input = () => screen.getByRole("combobox", { name: "Account" }) as HTMLInputElement;

test("ComboBox filters as the user types and selects with the keyboard", async () => {
  const user = setupUser();
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
  const user = setupUser();
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
  const user = setupUser();
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
  const user = setupUser();
  const loadOptions = vi.fn(async (_query: string): Promise<Account[]> => []);
  render(
    <ComboBox name="account" label="Account" loadOptions={loadOptions}>
      {accountItem}
    </ComboBox>,
  );

  await user.type(input(), "co");
  await advanceTime(299);
  expect(loadOptions).not.toHaveBeenCalled();
  await user.type(input(), "nt");
  await advanceTime(299);
  expect(loadOptions).not.toHaveBeenCalled();

  await advanceTime(1);
  expect(loadOptions).toHaveBeenCalledTimes(1);
  expect(loadOptions).toHaveBeenCalledWith("cont");
});

test("ComboBox shows a loading state while the search runs", async () => {
  const user = setupUser();
  const pending = deferred();
  render(
    <ComboBox name="account" label="Account" loadOptions={() => pending.promise}>
      {accountItem}
    </ComboBox>,
  );

  await user.type(input(), "cont");
  await advanceTime();
  expect(screen.getByRole("status").textContent).toBe("Loading");

  await act(async () => {
    pending.resolve([accounts[1] as Account]);
  });

  expect(screen.queryByRole("status")).toBeNull();
  expect(screen.getByRole("option", { name: "Contoso Ltd" })).toBeTruthy();
});

test("ComboBox shows when a search found nothing", async () => {
  const user = setupUser();
  const loadOptions = vi.fn(async (_query: string): Promise<Account[]> => []);
  render(
    <ComboBox name="account" label="Account" loadOptions={loadOptions}>
      {accountItem}
    </ComboBox>,
  );

  await user.type(input(), "zzz");

  await advanceTime();
  expect(screen.getByRole("status").textContent).toBe("No results");
  expect(screen.queryAllByRole("option")).toHaveLength(0);
});

test("ComboBox keeps the newest answer when an older search lands late", async () => {
  const user = setupUser();
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
  await advanceTime();
  expect(loadOptions).toHaveBeenCalledTimes(1);

  await user.clear(input());
  await user.type(input(), "fab");
  await advanceTime();
  expect(loadOptions).toHaveBeenCalledTimes(2);

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
  const user = setupUser();
  const loadOptions = vi.fn(async (_query: string): Promise<Account[]> => [accounts[2] as Account]);
  render(
    <form>
      <ComboBox name="account" label="Account" loadOptions={loadOptions}>
        {accountItem}
      </ComboBox>
    </form>,
  );

  await user.type(input(), "fab");
  await advanceTime();
  expect(screen.getAllByRole("option")).toHaveLength(1);

  await user.keyboard("{ArrowDown}");
  await user.keyboard("{Enter}");

  expect(submittedValues()).toEqual(["account=account-3"]);
});

const savedAccount = { id: "account-3", label: "Fabrikam Inc" };

function expectLookup(label: string, id: string) {
  expect(input().value).toBe(label);
  expect(submittedValues()).toEqual([`account=${id}`]);
}

async function selectLookup(user: ReturnType<typeof userEvent.setup>, query = "cont") {
  await user.type(input(), query);
  await advanceTime();
  expect(screen.getByRole("option", { name: "Contoso Ltd" })).toBeTruthy();
  await user.keyboard("{ArrowDown}{Enter}");
  expectLookup("Contoso Ltd", "account-2");
}

test("lookup displays a saved item without searching and preserves it on focus and blur", async () => {
  const user = setupUser();
  const loadOptions = vi.fn(async (): Promise<Account[]> => []);
  render(
    <form>
      <ComboBox
        label="Account"
        name="account"
        loadOptions={loadOptions}
        defaultSelectedItem={savedAccount}
      >
        {accountItem}
      </ComboBox>
    </form>,
  );
  expectLookup("Fabrikam Inc", "account-3");
  await user.click(input());
  await user.tab();
  expectLookup("Fabrikam Inc", "account-3");
  await advanceTime();
  expect(loadOptions).not.toHaveBeenCalled();
});

test("lookup restores the selected label after an uncommitted search replaces the results", async () => {
  const user = setupUser();
  const loadOptions = vi.fn(async (query: string) =>
    query === "cont" ? [accounts[1] as Account] : [accounts[2] as Account],
  );
  render(
    <form>
      <ComboBox label="Account" name="account" loadOptions={loadOptions}>
        {accountItem}
      </ComboBox>
    </form>,
  );
  await selectLookup(user);
  await user.click(input());
  await user.keyboard("{Control>}a{/Control}fab");
  await advanceTime();
  expect(screen.getByRole("option", { name: "Fabrikam Inc" })).toBeTruthy();
  expectLookup("fab", "account-2");
  await user.tab();
  expectLookup("Contoso Ltd", "account-2");
});

test("lookup clears the selected id when all input text is deleted", async () => {
  const user = setupUser();
  const onChange = vi.fn();
  const onSelectionChange = vi.fn();
  const onInputChange = vi.fn();
  render(
    <form>
      <ComboBox
        label="Account"
        name="account"
        loadOptions={async () => []}
        defaultSelectedItem={savedAccount}
        onChange={onChange}
        onSelectionChange={onSelectionChange}
        onInputChange={onInputChange}
      >
        {accountItem}
      </ComboBox>
    </form>,
  );
  await user.clear(input());
  expectLookup("", "");
  await user.tab();
  expectLookup("", "");
  expect(onChange.mock.calls).toEqual([[null]]);
  expect(onSelectionChange.mock.calls).toEqual([[null]]);
  expect(onInputChange.mock.calls).toEqual([[""]]);
});

test("lookup selection does not search again for its label", async () => {
  const user = setupUser();
  const loadOptions = vi.fn(async () => [accounts[1] as Account]);
  render(
    <form>
      <ComboBox label="Account" name="account" loadOptions={loadOptions}>
        {accountItem}
      </ComboBox>
    </form>,
  );
  await selectLookup(user);
  await advanceTime();
  expectLookup("Contoso Ltd", "account-2");
  expect(loadOptions.mock.calls).toEqual([["cont"]]);
});

test.each(["empty", "error"])(
  "lookup preserves selection when the next search returns %s",
  async (outcome) => {
    const user = setupUser();
    const loadOptions = vi.fn(async (query: string) => {
      if (query === "cont") return [accounts[1] as Account];
      if (outcome === "error") throw new Error("Search unavailable");
      return [];
    });
    render(
      <form>
        <ComboBox label="Account" name="account" loadOptions={loadOptions}>
          {accountItem}
        </ComboBox>
      </form>,
    );
    await selectLookup(user);
    await user.click(input());
    await user.keyboard("{Control>}a{/Control}zzz");
    await advanceTime();
    expect(screen.getByRole("status").textContent).toBe("No results");
    expect(screen.queryAllByRole("option")).toHaveLength(0);
    expectLookup("zzz", "account-2");
    await user.tab();
    expectLookup("Contoso Ltd", "account-2");
  },
);

test.each(["button", "arrow"])(
  "lookup searches empty input on %s opening and displays loading and empty states",
  async (trigger) => {
    const user = setupUser();
    const pending = deferred();
    const loadOptions = vi.fn(() => pending.promise);
    render(
      <form>
        <ComboBox label="Account" name="account" loadOptions={loadOptions}>
          {accountItem}
        </ComboBox>
      </form>,
    );
    if (trigger === "button") await user.click(screen.getByRole("button"));
    else {
      await user.click(input());
      await user.keyboard("{ArrowDown}");
    }
    expect(screen.getByRole("status").textContent).toBe("Loading");
    expectLookup("", "");
    await advanceTime();
    expect(loadOptions).toHaveBeenCalledWith("");
    await act(async () => pending.resolve([]));
    expect(screen.getByRole("status").textContent).toBe("No results");
    expectLookup("", "");
  },
);

test.each(["defaultSelectedKey", "defaultValue"] as const)(
  "lookup ignores %s without a label on mount and focus and blur",
  async (defaultProp) => {
    const user = setupUser();
    const loadOptions = vi.fn(async (): Promise<Account[]> => []);
    render(
      <form>
        <ComboBox
          label="Account"
          name="account"
          loadOptions={loadOptions}
          {...{ [defaultProp]: "account-3" }}
        >
          {accountItem}
        </ComboBox>
      </form>,
    );
    expectLookup("", "");
    await user.click(input());
    await user.tab();
    expectLookup("", "");
    expect(loadOptions).not.toHaveBeenCalled();
  },
);

test.each(["defaultSelectedKey", "defaultValue"] as const)(
  "fixed-list ComboBox resolves the label for %s on mount and focus and blur",
  async (defaultProp) => {
    const user = setupUser();
    render(
      <form>
        <ComboBox
          label="Account"
          name="account"
          items={accounts}
          {...{ [defaultProp]: "account-3" }}
        >
          {accountItem}
        </ComboBox>
      </form>,
    );
    expectLookup("Fabrikam Inc", "account-3");
    await user.click(input());
    await user.tab();
    expectLookup("Fabrikam Inc", "account-3");
  },
);

test("lookup preserves a saved key and explicit default label on focus and blur", async () => {
  const user = setupUser();
  const loadOptions = vi.fn(async (): Promise<Account[]> => []);
  render(
    <form>
      <ComboBox
        label="Account"
        name="account"
        loadOptions={loadOptions}
        defaultSelectedKey="account-3"
        defaultInputValue="Fabrikam Inc"
      >
        {accountItem}
      </ComboBox>
    </form>,
  );
  expectLookup("Fabrikam Inc", "account-3");
  await user.click(input());
  await user.tab();
  expectLookup("Fabrikam Inc", "account-3");
  expect(loadOptions).not.toHaveBeenCalled();
});

test("lookup reports a new selection once to each supplied callback", async () => {
  const user = setupUser();
  const onChange = vi.fn();
  const onSelectionChange = vi.fn();
  render(
    <form>
      <ComboBox
        label="Account"
        name="account"
        loadOptions={async () => [accounts[1] as Account]}
        onChange={onChange}
        onSelectionChange={onSelectionChange}
      >
        {accountItem}
      </ComboBox>
    </form>,
  );
  await selectLookup(user);
  expect(onChange.mock.calls).toEqual([["account-2"]]);
  expect(onSelectionChange.mock.calls).toEqual([["account-2"]]);
});

test("saved lookup emits no callbacks when focus and blur leave its values unchanged", async () => {
  const user = setupUser();
  const onChange = vi.fn();
  const onSelectionChange = vi.fn();
  const onInputChange = vi.fn();
  render(
    <form>
      <ComboBox
        label="Account"
        name="account"
        loadOptions={async () => []}
        defaultSelectedItem={savedAccount}
        onChange={onChange}
        onSelectionChange={onSelectionChange}
        onInputChange={onInputChange}
      >
        {accountItem}
      </ComboBox>
    </form>,
  );
  for (let visit = 0; visit < 2; visit++) {
    await user.click(input());
    await user.tab();
    expectLookup("Fabrikam Inc", "account-3");
  }
  expect(onChange.mock.calls).toEqual([]);
  expect(onSelectionChange.mock.calls).toEqual([]);
  expect(onInputChange.mock.calls).toEqual([]);
});

test("empty lookup reports text edits without emitting selection changes", async () => {
  const user = setupUser();
  const onChange = vi.fn();
  const onSelectionChange = vi.fn();
  const onInputChange = vi.fn();
  render(
    <form>
      <ComboBox
        label="Account"
        name="account"
        loadOptions={async () => []}
        onChange={onChange}
        onSelectionChange={onSelectionChange}
        onInputChange={onInputChange}
      >
        {accountItem}
      </ComboBox>
    </form>,
  );
  await user.type(input(), "c");
  expectLookup("c", "");
  await user.clear(input());
  await user.tab();
  expectLookup("", "");
  expect(onChange.mock.calls).toEqual([]);
  expect(onSelectionChange.mock.calls).toEqual([]);
  expect(onInputChange.mock.calls).toEqual([["c"], [""]]);
});

test("lookup reverts an uncommitted search without reporting a new selection", async () => {
  const user = setupUser();
  const onChange = vi.fn();
  const onSelectionChange = vi.fn();
  const onInputChange = vi.fn();
  render(
    <form>
      <ComboBox
        label="Account"
        name="account"
        loadOptions={async () => [accounts[1] as Account]}
        onChange={onChange}
        onSelectionChange={onSelectionChange}
        onInputChange={onInputChange}
      >
        {accountItem}
      </ComboBox>
    </form>,
  );
  await selectLookup(user);
  onInputChange.mockClear();
  await user.click(input());
  await user.keyboard("{Control>}a{/Control}fab");
  await advanceTime();
  expectLookup("fab", "account-2");
  await user.tab();
  expectLookup("Contoso Ltd", "account-2");
  expect(onChange.mock.calls).toEqual([["account-2"]]);
  expect(onSelectionChange.mock.calls).toEqual([["account-2"]]);
  expect(onInputChange.mock.calls).toEqual([["f"], ["fa"], ["fab"], ["Contoso Ltd"]]);
});

test("keeps characters typed before hydration", async () => {
  const html = renderToString(
    <UiProvider>
      <ComboBox label="Account" items={accounts}>
        {accountItem}
      </ComboBox>
    </UiProvider>,
  );
  const container = document.createElement("div");
  document.body.append(container);
  container.innerHTML = html;
  const serverInput = container.querySelector("input");
  expect(serverInput).toBeTruthy();
  if (!serverInput) return;
  serverInput.value = "cont";

  const root = hydrateRoot(
    container,
    <UiProvider>
      <ComboBox label="Account" items={accounts}>
        {accountItem}
      </ComboBox>
    </UiProvider>,
  );
  await act(async () => {});

  expect(container.querySelector("input")?.value).toBe("cont");
  root.unmount();
  container.remove();
});

test("hydration does not search for a label that was already saved", async () => {
  const loadOptions = vi.fn(async () => [] as Account[]);
  const field = (
    <UiProvider>
      <ComboBox
        label="Account"
        loadOptions={loadOptions}
        defaultSelectedItem={{ id: "account-3", label: "Fabrikam Inc" }}
      >
        {accountItem}
      </ComboBox>
    </UiProvider>
  );
  const container = document.createElement("div");
  document.body.append(container);
  container.innerHTML = renderToString(field);
  const root = hydrateRoot(
    container,
    <UiProvider>
      <ComboBox
        label="Account"
        loadOptions={loadOptions}
        defaultSelectedItem={{ id: "account-3", label: "Fabrikam Inc" }}
      >
        {accountItem}
      </ComboBox>
    </UiProvider>,
  );
  await act(async () => {});

  expect(container.querySelector("input")?.value).toBe("Fabrikam Inc");
  expect(loadOptions).not.toHaveBeenCalled();
  root.unmount();
  container.remove();
});
