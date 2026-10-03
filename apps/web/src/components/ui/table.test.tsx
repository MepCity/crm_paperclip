import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";

afterEach(cleanup);

function renderLeadTable() {
  return render(
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Ada Lovelace</TableCell>
          <TableCell>New</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Grace Hopper</TableCell>
          <TableCell>Qualified</TableCell>
        </TableRow>
      </TableBody>
    </Table>,
  );
}

test("Table exposes the grid, its column headers and its cells", () => {
  renderLeadTable();

  expect(screen.getByRole("table").tagName).toBe("TABLE");

  expect(screen.getByRole("columnheader", { name: "Name" }).textContent).toBe("Name");
  expect(screen.getByRole("columnheader", { name: "Status" }).textContent).toBe("Status");
  expect(screen.getAllByRole("columnheader")).toHaveLength(2);

  expect(screen.getByRole("cell", { name: "Ada Lovelace" }).textContent).toBe("Ada Lovelace");
  expect(screen.getByRole("cell", { name: "Qualified" }).textContent).toBe("Qualified");
  expect(screen.getAllByRole("cell")).toHaveLength(4);
});

test("Table renders one row per header and body record", () => {
  renderLeadTable();

  // One header row plus two body rows.
  expect(screen.getAllByRole("row")).toHaveLength(3);
});

test("TableHead marks the header cell as a column scope", () => {
  renderLeadTable();

  const name = screen.getByRole("columnheader", { name: "Name" });
  expect(name.tagName).toBe("TH");
  expect(name.getAttribute("scope")).toBe("col");
});

test("TableBody renders rows instead of the empty message when it has children", () => {
  renderLeadTable();

  expect(screen.queryByRole("cell", { name: "No records to display." })).toBeNull();
});

test("Empty TableBody shows the default empty message spanning every column", () => {
  render(
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody columnCount={2} />
    </Table>,
  );

  const cells = screen.getAllByRole("cell");
  expect(cells).toHaveLength(1);

  const emptyCell = cells[0] as HTMLElement;
  expect(emptyCell.textContent).toBe("No records to display.");
  expect(emptyCell.getAttribute("colspan")).toBe("2");

  // Header row plus the single empty-state row.
  expect(screen.getAllByRole("row")).toHaveLength(2);
});

test("Empty TableBody shows a custom empty message", () => {
  render(
    <Table>
      <TableBody columnCount={3} emptyMessage="No leads match this filter." />
    </Table>,
  );

  const emptyCell = screen.getByRole("cell", { name: "No leads match this filter." });
  expect(emptyCell.textContent).toBe("No leads match this filter.");
  expect(emptyCell.getAttribute("colspan")).toBe("3");
  expect(screen.queryByRole("cell", { name: "No records to display." })).toBeNull();
});
