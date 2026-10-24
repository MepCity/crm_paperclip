// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { DocumentsScreen } from "./documents-screen";
import { fixtureDocumentsPort } from "./fixture-port";
import type { DocumentItem, DocumentsPort } from "./port";

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

  it("shows disabled select-all and row actions; breadcrumb arrow is inert", async () => {
    const user = userEvent.setup();
    render(<DocumentsScreen />);
    await user.click(await screen.findByRole("button", { name: "Workspace Files" }));
    await screen.findByText("Contracts");
    expect((screen.getByRole("button", { name: "Select all" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect(screen.getAllByRole("button", { name: "More actions" }).length).toBe(3);
    await user.click(screen.getByRole("button", { name: "Sub folders" }));
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("shows an error state when folders fail to load", async () => {
    const port = { ...fixtureDocumentsPort, listFolders: () => Promise.reject(new Error("x")) };
    render(<DocumentsScreen port={port} />);
    expect((await screen.findByRole("alert")).textContent).toContain("could not be loaded");
  });

  it("shows an error state and no rows when items fail to load", async () => {
    const port = { ...fixtureDocumentsPort, listItems: () => Promise.reject(new Error("x")) };
    render(<DocumentsScreen port={port} />);
    expect((await screen.findByRole("alert")).textContent).toContain("could not be loaded");
    expect(
      within(screen.getByRole("list", { name: "Documents" })).queryAllByRole("listitem"),
    ).toHaveLength(0);
  });

  it("ignores a late response of a previous folder", async () => {
    let releaseA: (rows: readonly DocumentItem[]) => void = () => {};
    const port: DocumentsPort = {
      ...fixtureDocumentsPort,
      listItems: (id, sort) =>
        id === "my"
          ? new Promise((resolve) => {
              releaseA = resolve;
            })
          : fixtureDocumentsPort.listItems(id, sort),
    };
    const user = userEvent.setup();
    render(<DocumentsScreen port={port} />);
    await user.click(await screen.findByRole("button", { name: /Sales Team/ }));
    await screen.findByText("Quarterly targets.xlsx");
    releaseA([
      {
        id: "late",
        name: "Late row",
        kind: "file",
        uploadedBy: "a",
        modifiedBy: "b",
        modifiedAt: "2026-01-01T00:00:00Z",
        parentId: "my",
      },
    ]);
    await Promise.resolve();
    expect(screen.queryByText("Late row")).toBeNull();
  });
});
