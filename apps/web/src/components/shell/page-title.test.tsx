import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { APP_NAME } from "@/app-info";
import { render } from "@/test/render";
import { PageTitle, PageTitleContext } from "./page-title";

describe("PageTitle", () => {
  const originalTitle = document.title;

  beforeEach(() => {
    document.title = originalTitle;
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    document.title = originalTitle;
  });

  it("passes page title value through PageTitleContext and updates document title", () => {
    const setTitle = vi.fn();

    const { container } = render(
      <PageTitleContext.Provider value={setTitle}>
        <PageTitle title="Deals" />
      </PageTitleContext.Provider>,
    );

    expect(setTitle).toHaveBeenCalledWith("Deals");
    expect(document.title).toBe(`Deals | ${APP_NAME}`);
    expect(container.firstChild).toBeNull();
  });

  it("updates PageTitleContext and document title when title prop changes", () => {
    const setTitle = vi.fn();

    const view = render(
      <PageTitleContext.Provider value={setTitle}>
        <PageTitle title="Contacts" />
      </PageTitleContext.Provider>,
    );

    expect(setTitle).toHaveBeenCalledWith("Contacts");
    expect(document.title).toBe(`Contacts | ${APP_NAME}`);

    view.rerender(
      <PageTitleContext.Provider value={setTitle}>
        <PageTitle title="Accounts" />
      </PageTitleContext.Provider>,
    );

    expect(setTitle).toHaveBeenCalledWith("Accounts");
    expect(document.title).toBe(`Accounts | ${APP_NAME}`);
  });

  it("throws an error when rendered outside PageTitleContext", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<PageTitle title="Orphan Title" />)).toThrow(
      "PageTitle must be rendered inside AppShell.",
    );

    consoleError.mockRestore();
  });
});
