import { cleanup, fireEvent, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/render";
import { ActivityRelationPanel, type ActivityRelationPanelProps } from "./activity-relation-panel";

afterEach(cleanup);

function props(over: Partial<ActivityRelationPanelProps> = {}): ActivityRelationPanelProps {
  return {
    persons: [
      {
        id: "p1",
        name: "Ada Test",
        moduleLabel: "Contact",
        accountId: "a1",
        accountName: "Acme Test",
        email: "ada@example.test",
        phone: "555-0100",
        mobile: "555-0101",
      },
    ],
    selectedPersonId: "p1",
    onSelectPerson: vi.fn(),
    deals: [{ id: "d1", name: "Big Deal", summaryText: "$10 | Qualification | 2026-01-01" }],
    openActivities: {
      tasks: { count: 2, items: [{ id: "t1", label: "Call back", path: "/tasks/t1" }] },
      meetings: { count: 0 },
      calls: { count: 1 },
    },
    contactRecordPath: (id) => `/contacts/${id}`,
    accountRecordPath: (id) => `/accounts/${id}`,
    dealRecordPath: (id) => `/deals/${id}`,
    ...over,
  };
}

describe("ActivityRelationPanel", () => {
  it("renders sections in order with named controls", () => {
    const { container } = render(<ActivityRelationPanel {...props()} />);
    const labels = Array.from(container.querySelectorAll("section")).map((s) =>
      s.getAttribute("aria-label"),
    );
    expect(labels).toEqual(["Person summary", "Deal Summary", "Open Activities"]);
    expect(screen.getByRole("tab", { name: "Info" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Conversations" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Ada Test|Related person/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Ada Test" }).getAttribute("href")).toBe(
      "/contacts/p1",
    );
    expect(screen.getByText("Contact")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Acme Test" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "More Info" }).getAttribute("href")).toBe(
      "/contacts/p1",
    );
    expect(screen.getByRole("button", { name: "Call phone" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Call mobile" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Big Deal" }).getAttribute("href")).toBe("/deals/d1");
  });

  it("later-module controls do nothing", () => {
    render(<ActivityRelationPanel {...props()} />);
    for (const el of [
      screen.getByRole("tab", { name: "Conversations" }),
      screen.getByRole("button", { name: "Send Email" }),
      screen.getByText("ada@example.test"),
    ]) {
      fireEvent.click(el);
    }
    expect(screen.getByRole("tab", { name: "Info" }).getAttribute("aria-selected")).toBe("true");
    expect(
      screen.getByRole("tab", { name: "Conversations" }).getAttribute("data-later-module"),
    ).toBe("M10");
    expect(
      screen.getByRole("button", { name: "Send Email" }).getAttribute("data-later-module"),
    ).toBe("M10");
    expect(
      screen
        .getByText("ada@example.test")
        .closest("[data-later-module]")
        ?.getAttribute("data-later-module"),
    ).toBe("M10");
  });

  it("calls onCall and new handlers when given", () => {
    const onCall = vi.fn();
    const onNewDeal = vi.fn();
    const onNewActivity = vi.fn();
    render(<ActivityRelationPanel {...props({ onCall, onNewDeal, onNewActivity })} />);
    fireEvent.click(screen.getByRole("button", { name: "Call phone" }));
    expect(onCall).toHaveBeenCalledWith("555-0100");
    const news = screen.getAllByRole("button", { name: /New/ });
    fireEvent.click(news[0] as HTMLElement);
    fireEvent.click(news[1] as HTMLElement);
    expect(onNewDeal).toHaveBeenCalledTimes(1);
    expect(onNewActivity).toHaveBeenCalledTimes(1);
  });

  it("toggles open activity rows with count badges", () => {
    render(<ActivityRelationPanel {...props()} />);
    const section = screen.getByRole("region", { name: "Open Activities" });
    const row = within(section).getByRole("button", { name: /Tasks/ });
    expect(row.getAttribute("aria-expanded")).toBe("false");
    expect(row.textContent).toContain("2");
    expect(within(section).queryByRole("link", { name: "Call back" })).toBeNull();
    fireEvent.click(row);
    expect(row.getAttribute("aria-expanded")).toBe("true");
    expect(within(section).getByRole("link", { name: "Call back" })).toBeTruthy();
    fireEvent.click(row);
    expect(within(section).queryByRole("link", { name: "Call back" })).toBeNull();
    const meetings = within(section).getByRole("button", { name: /Meetings/ });
    const calls = within(section).getByRole("button", { name: /Calls/ });
    expect(meetings.getAttribute("aria-expanded")).toBe("false");
    expect(calls.getAttribute("aria-expanded")).toBe("false");
    expect(meetings.textContent).toContain("0");
    expect(calls.textContent).toContain("1");
  });

  it("shows empty deal text and omits empty-valued rows", () => {
    const p = props({ deals: [] });
    p.persons = [{ id: "p1", name: "Ada Test", moduleLabel: "Contact" }];
    render(<ActivityRelationPanel {...p} />);
    expect(screen.getByText("No records found")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Call phone" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Call mobile" })).toBeNull();
    expect(screen.queryByText("ada@example.test")).toBeNull();
  });

  it("without a person draws picker, tabs and open activities only", () => {
    const { container } = render(
      <ActivityRelationPanel {...props({ persons: [], selectedPersonId: null })} />,
    );
    const labels = Array.from(container.querySelectorAll("section")).map((s) =>
      s.getAttribute("aria-label"),
    );
    expect(labels).toEqual(["Open Activities"]);
    expect(screen.getByRole("tab", { name: "Info" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Ada Test|Related person/ })).toBeTruthy();
  });
});
