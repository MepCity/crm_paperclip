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
    await user.click(await screen.findByRole("button", { name: "Proposals" }));
    await screen.findByText("Draft proposal.docx");
    const crumb = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(crumb.textContent).toContain("Proposals");
    await user.click(within(crumb).getByRole("button", { name: "My Folders" }));
    await screen.findByText("Contracts");
  });
});
