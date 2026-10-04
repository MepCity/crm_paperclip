import { act, cleanup, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
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

test("returns the default value on the first render, then hydrates from storage", async () => {
  localStorage.setItem("crm:pref:acme:user-1:list.pageSize", "99");
  const seen: number[] = [];

  function HydrationProbe() {
    const [value] = usePreference<number>("list.pageSize", DEFAULT_PAGE_SIZE);
    seen.push(value);
    return null;
  }

  render(
    <PreferenceProvider orgSlug="acme" userId="user-1">
      <HydrationProbe />
    </PreferenceProvider>,
  );

  expect(seen[0]).toBe(DEFAULT_PAGE_SIZE);
  await act(async () => {});
  expect(seen.at(-1)).toBe(99);
});

test("writes and reads back from localStorage after hydration", async () => {
  const { result } = renderHook(() => usePreference<number>("list.pageSize", DEFAULT_PAGE_SIZE), {
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
    () => usePreference<number>("list.pageSize", DEFAULT_PAGE_SIZE),
    {
      wrapper: ({ children }) => (
        <PreferenceProvider orgSlug="acme" userId="user-1">
          {children}
        </PreferenceProvider>
      ),
    },
  );

  await act(async () => {});
  expect(remounted.current[0]).toBe(30);
});

test("isolates values by organization and user", async () => {
  const orgA = renderHook(() => usePreference<boolean>("detail.railHidden", false), {
    wrapper: ({ children }) => (
      <PreferenceProvider orgSlug="org-a" userId="u1">
        {children}
      </PreferenceProvider>
    ),
  });
  const orgB = renderHook(() => usePreference<boolean>("detail.railHidden", false), {
    wrapper: ({ children }) => (
      <PreferenceProvider orgSlug="org-b" userId="u1">
        {children}
      </PreferenceProvider>
    ),
  });

  await act(async () => {
    orgA.result.current[1](true);
  });

  await act(async () => {});
  expect(orgA.result.current[0]).toBe(true);
  expect(orgB.result.current[0]).toBe(false);
  expect(localStorage.getItem("crm:pref:org-a:u1:detail.railHidden")).toBe("true");
  expect(localStorage.getItem("crm:pref:org-b:u1:detail.railHidden")).toBeNull();
});

test("ignores corrupt or type-mismatched stored values", async () => {
  localStorage.setItem("crm:pref:acme:user-1:list.pageSize", "not-json");
  const corrupt = renderHook(() => usePreference<number>("list.pageSize", DEFAULT_PAGE_SIZE), {
    wrapper: ({ children }) => (
      <PreferenceProvider orgSlug="acme" userId="user-1">
        {children}
      </PreferenceProvider>
    ),
  });
  await act(async () => {});
  expect(corrupt.result.current[0]).toBe(DEFAULT_PAGE_SIZE);

  localStorage.setItem("crm:pref:acme:user-1:list.pageSize", JSON.stringify("25"));
  resetPreferenceStoreForTests();
  const mismatch = renderHook(() => usePreference<number>("list.pageSize", DEFAULT_PAGE_SIZE), {
    wrapper: ({ children }) => (
      <PreferenceProvider orgSlug="acme" userId="user-1">
        {children}
      </PreferenceProvider>
    ),
  });
  await act(async () => {});
  expect(mismatch.result.current[0]).toBe(DEFAULT_PAGE_SIZE);
});

test("keeps working in memory when localStorage throws", async () => {
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("quota");
  });
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("denied");
  });

  const { result } = renderHook(() => usePreference<number>("list.pageSize", DEFAULT_PAGE_SIZE), {
    wrapper: ({ children }) => (
      <PreferenceProvider orgSlug="acme" userId="user-1">
        {children}
      </PreferenceProvider>
    ),
  });

  await act(async () => {
    result.current[1](40);
  });
  await act(async () => {});
  expect(result.current[0]).toBe(40);
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
  const { result } = renderHook(() => usePreference<number>("list.pageSize", DEFAULT_PAGE_SIZE));

  await act(async () => {
    result.current[1](50);
  });
  await act(async () => {});

  expect(result.current[0]).toBe(50);
  expect(localStorage.length).toBe(0);
});

test("server render returns the default value", async () => {
  const { renderToString } = await import("react-dom/server");
  localStorage.setItem("crm:pref:acme:user-1:list.pageSize", "99");

  function ServerProbe() {
    const [value] = usePreference<number>("list.pageSize", DEFAULT_PAGE_SIZE);
    return <span>{value}</span>;
  }

  const html = renderToString(
    <PreferenceProvider orgSlug="acme" userId="user-1">
      <ServerProbe />
    </PreferenceProvider>,
  );

  expect(html).toContain("25");
});
