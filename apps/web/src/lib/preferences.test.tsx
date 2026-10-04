import { act, cleanup, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, expectTypeOf, test, vi } from "vitest";
import { PreferenceProvider, resetPreferenceStoreForTests, usePreference } from "./preferences";

const DEFAULT_PAGE_SIZE = 25;

function Probe({ preferenceKey, defaultValue }: { preferenceKey: string; defaultValue: number }) {
  const [value, setValue] = usePreference(preferenceKey, defaultValue);
  return (
    <div>
      <span data-testid="value">{value}</span>
      <button type="button" onClick={() => setValue(42)}>
        set
      </button>
    </div>
  );
}

beforeEach(() => {
  resetPreferenceStoreForTests();
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

test("hydrates from storage without console errors", async () => {
  const hydrationErrors: string[] = [];
  const errorSpy = vi.spyOn(console, "error").mockImplementation((message) => {
    hydrationErrors.push(String(message));
  });

  localStorage.setItem("crm:pref:acme:user-1:list.pageSize", "99");

  function HydrationProbe() {
    const [value] = usePreference("list.pageSize", DEFAULT_PAGE_SIZE);
    return <span data-testid="hydrated-value">{value}</span>;
  }

  const tree = (
    <PreferenceProvider orgSlug="acme" userId="user-1">
      <HydrationProbe />
    </PreferenceProvider>
  );

  const { renderToString } = await import("react-dom/server");
  const { hydrateRoot } = await import("react-dom/client");

  const html = renderToString(tree);
  expect(html).toContain("25");

  const container = document.createElement("div");
  document.body.append(container);
  container.innerHTML = html;

  const root = hydrateRoot(container, tree);
  await act(async () => {});

  expect(hydrationErrors.some((line) => /hydrat/i.test(line))).toBe(false);
  expect(screen.getByTestId("hydrated-value").textContent).toBe("99");

  root.unmount();
  container.remove();
  errorSpy.mockRestore();
});

test("writes and reads back from localStorage after hydration", async () => {
  const { result } = renderHook(() => usePreference("list.pageSize", DEFAULT_PAGE_SIZE), {
    wrapper: ({ children }) => (
      <PreferenceProvider orgSlug="acme" userId="user-1">
        {children}
      </PreferenceProvider>
    ),
  });

  await act(async () => {
    result.current[1](30);
  });

  expect(localStorage.getItem("crm:pref:acme:user-1:list.pageSize")).toBe("30");

  resetPreferenceStoreForTests();
  const { result: remounted } = renderHook(
    () => usePreference("list.pageSize", DEFAULT_PAGE_SIZE),
    {
      wrapper: ({ children }) => (
        <PreferenceProvider orgSlug="acme" userId="user-1">
          {children}
        </PreferenceProvider>
      ),
    },
  );

  expect(remounted.current[0]).toBe(30);
});

test("isolates values by organization and user", async () => {
  const orgA = renderHook(() => usePreference("detail.railHidden", false), {
    wrapper: ({ children }) => (
      <PreferenceProvider orgSlug="org-a" userId="u1">
        {children}
      </PreferenceProvider>
    ),
  });
  const orgB = renderHook(() => usePreference("detail.railHidden", false), {
    wrapper: ({ children }) => (
      <PreferenceProvider orgSlug="org-b" userId="u1">
        {children}
      </PreferenceProvider>
    ),
  });

  await act(async () => {
    orgA.result.current[1](true);
  });

  expect(orgA.result.current[0]).toBe(true);
  expect(orgB.result.current[0]).toBe(false);
  expect(localStorage.getItem("crm:pref:org-a:u1:detail.railHidden")).toBe("true");
  expect(localStorage.getItem("crm:pref:org-b:u1:detail.railHidden")).toBeNull();
});

test("ignores corrupt or type-mismatched stored values", async () => {
  localStorage.setItem("crm:pref:acme:user-1:list.pageSize", "not-json");
  const corrupt = renderHook(() => usePreference("list.pageSize", DEFAULT_PAGE_SIZE), {
    wrapper: ({ children }) => (
      <PreferenceProvider orgSlug="acme" userId="user-1">
        {children}
      </PreferenceProvider>
    ),
  });
  expect(corrupt.result.current[0]).toBe(DEFAULT_PAGE_SIZE);

  localStorage.setItem("crm:pref:acme:user-1:list.pageSize", JSON.stringify("25"));
  resetPreferenceStoreForTests();
  const mismatch = renderHook(() => usePreference("list.pageSize", DEFAULT_PAGE_SIZE), {
    wrapper: ({ children }) => (
      <PreferenceProvider orgSlug="acme" userId="user-1">
        {children}
      </PreferenceProvider>
    ),
  });
  expect(mismatch.result.current[0]).toBe(DEFAULT_PAGE_SIZE);
});

test("retains in-memory value across remount when localStorage throws", async () => {
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("quota");
  });
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("denied");
  });

  const { result, unmount } = renderHook(() => usePreference("list.pageSize", DEFAULT_PAGE_SIZE), {
    wrapper: ({ children }) => (
      <PreferenceProvider orgSlug="acme" userId="user-1">
        {children}
      </PreferenceProvider>
    ),
  });

  await act(async () => {
    result.current[1](40);
  });
  unmount();

  const { result: remounted } = renderHook(
    () => usePreference("list.pageSize", DEFAULT_PAGE_SIZE),
    {
      wrapper: ({ children }) => (
        <PreferenceProvider orgSlug="acme" userId="user-1">
          {children}
        </PreferenceProvider>
      ),
    },
  );

  expect(remounted.current[0]).toBe(40);
});

test("syncs consumers when localStorage write fails", async () => {
  localStorage.setItem("crm:pref:acme:user-1:list.pageSize", "30");
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("quota");
  });

  function ConsumerA() {
    const [value, setValue] = usePreference("list.pageSize", DEFAULT_PAGE_SIZE);
    return (
      <>
        <span data-testid="a">{value}</span>
        <button type="button" onClick={() => setValue(40)}>
          a-set
        </button>
      </>
    );
  }

  function ConsumerB() {
    const [value] = usePreference("list.pageSize", DEFAULT_PAGE_SIZE);
    return <span data-testid="b">{value}</span>;
  }

  function App({ showB }: { showB: boolean }) {
    return (
      <>
        <ConsumerA />
        {showB ? <ConsumerB /> : null}
      </>
    );
  }

  const { rerender } = render(
    <PreferenceProvider orgSlug="acme" userId="user-1">
      <App showB={false} />
    </PreferenceProvider>,
  );

  expect(screen.getByTestId("a").textContent).toBe("30");

  rerender(
    <PreferenceProvider orgSlug="acme" userId="user-1">
      <App showB={true} />
    </PreferenceProvider>,
  );

  expect(screen.getByTestId("b").textContent).toBe("30");

  await act(async () => {
    screen.getByRole("button", { name: "a-set" }).click();
  });

  expect(screen.getByTestId("a").textContent).toBe("40");
  expect(screen.getByTestId("b").textContent).toBe("40");
});

test("late-mounting consumer reads stored value on first render", async () => {
  localStorage.setItem("crm:pref:acme:user-1:list.pageSize", "40");
  const lateSeen: number[] = [];

  function LateProbe() {
    const [value] = usePreference("list.pageSize", DEFAULT_PAGE_SIZE);
    lateSeen.push(value);
    return null;
  }

  function Host({ showLate }: { showLate: boolean }) {
    usePreference("list.pageSize", DEFAULT_PAGE_SIZE);
    return showLate ? <LateProbe /> : null;
  }

  const { rerender } = render(
    <PreferenceProvider orgSlug="acme" userId="user-1">
      <Host showLate={false} />
    </PreferenceProvider>,
  );

  await act(async () => {});

  rerender(
    <PreferenceProvider orgSlug="acme" userId="user-1">
      <Host showLate={true} />
    </PreferenceProvider>,
  );

  expect(lateSeen).toEqual([40]);
});

test("syncs two consumers that share the same key in one tab", async () => {
  render(
    <PreferenceProvider orgSlug="acme" userId="user-1">
      <Probe preferenceKey="list.pageSize" defaultValue={25} />
      <Probe preferenceKey="list.pageSize" defaultValue={25} />
    </PreferenceProvider>,
  );

  const values = screen.getAllByTestId("value");
  expect(values).toHaveLength(2);
  expect(values[0]?.textContent).toBe("25");
  expect(values[1]?.textContent).toBe("25");

  const buttons = screen.getAllByRole("button", { name: "set" });
  expect(buttons[0]).toBeDefined();
  await act(async () => {
    buttons[0]?.click();
  });

  const updatedValues = screen.getAllByTestId("value");
  expect(updatedValues[0]?.textContent).toBe("42");
  expect(updatedValues[1]?.textContent).toBe("42");
});

test("without a provider, values stay in memory only", async () => {
  const { result } = renderHook(() => usePreference("list.pageSize", DEFAULT_PAGE_SIZE));

  await act(async () => {
    result.current[1](50);
  });

  expect(result.current[0]).toBe(50);
  expect(localStorage.length).toBe(0);
});

test("server render returns the default value", async () => {
  const { renderToString } = await import("react-dom/server");
  localStorage.setItem("crm:pref:acme:user-1:list.pageSize", "99");

  function ServerProbe() {
    const [value] = usePreference("list.pageSize", DEFAULT_PAGE_SIZE);
    return <span>{value}</span>;
  }

  const html = renderToString(
    <PreferenceProvider orgSlug="acme" userId="user-1">
      <ServerProbe />
    </PreferenceProvider>,
  );

  expect(html).toContain("25");
});

test("infers boolean and number types without an explicit type argument", () => {
  function InferenceProbe() {
    const [, setBool] = usePreference("detail.railHidden", false);
    setBool(true);

    const [, setNum] = usePreference("list.pageSize", 25);
    setNum(50);

    const [, setUnion] = usePreference<10 | 20 | 50>("list.pageSize", 20);
    setUnion(50);

    return null;
  }

  expectTypeOf(usePreference).toBeFunction();
  render(<InferenceProbe />);
});
