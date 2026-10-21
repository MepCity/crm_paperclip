// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { DocumentsScreen } from "./documents-screen";

afterEach(cleanup);

function rowNames() {
  return within(screen.getByRole("list", { name: "Documents" }))
    .getAllByRole("listitem")
    .map((li) => li.textContent ?? "");
}

describe("DocumentsScreen", () => {
  it("lists My Folders contents newest first", async () => {
    render(<DocumentsScreen />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Workspace Files" }));
    await screen.findByText("Contracts");
    const rows = rowNames();
    expect(rows[0]).toContain("Contracts");
    expect(rows[2]).toContain("Proposals");
    expect(screen.getByText("Last Modified")).toBeTruthy();
  });

  it("switches to a team folder and shows its lock", async () => {
    const user = userEvent.setup();
    render(<DocumentsScreen />);
    await user.click(await screen.findByRole("button", { name: /Sales Team/ }));
    await screen.findByText("Quarterly targets.xlsx");
    expect(screen.getByLabelText("Locked")).toBeTruthy();
    expect(screen.queryByText("Contracts")).toBeNull();
  });

  it("enters a folder and updates the breadcrumb", async () => {
    const user = userEvent.setup();
    render(<DocumentsScreen />);
    await user.click(await screen.findByRole("button", { name: "Workspace Files" }));
    await user.click(await screen.findByRole("button", { name: "Proposals" }));
    await screen.findByText("Draft proposal.docx");
    const crumb = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(crumb.textContent).toContain("Proposals");
    await user.click(within(crumb).getByRole("button", { name: "My Folders" }));
    await within(screen.getByRole("list", { name: "Documents" })).findByText("Workspace Files");
  });

  it("shows the empty state in an empty folder and returns through the breadcrumb", async () => {
    const user = userEvent.setup();
    render(<DocumentsScreen />);
    await user.click(await screen.findByRole("button", { name: "Workspace Files" }));
    await user.click(await screen.findByRole("button", { name: "Proposals" }));
    await user.click(await screen.findByRole("button", { name: "Archive" }));
    await screen.findByText("No items available.");
    expect(screen.queryByText("Last Modified")).toBeNull();
    expect(screen.queryByRole("button", { name: "Select all" })).toBeNull();
    const crumb = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(crumb.textContent).toContain("Archive");
    await user.click(within(crumb).getByRole("button", { name: "Proposals" }));
    await screen.findByText("Draft proposal.docx");
    expect(screen.queryByText("No items available.")).toBeNull();
  });

  it("shows disabled select-all and row actions, and a sub-folder menu", async () => {
    const user = userEvent.setup();
    render(<DocumentsScreen />);
    await user.click(await screen.findByRole("button", { name: "Workspace Files" }));
    await screen.findByText("Contracts");
    expect((screen.getByRole("button", { name: "Select all" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect(screen.getAllByRole("button", { name: "More actions" }).length).toBe(3);
    await user.click(screen.getByRole("button", { name: "Sub folders" }));
    const menu = screen.getByRole("menu", { name: "Sub folders" });
    await user.click(within(menu).getByRole("menuitem", { name: "Contracts" }));
    await screen.findByText("Signed agreement.pdf");
    expect(screen.queryByRole("menu")).toBeNull();
  });
});
