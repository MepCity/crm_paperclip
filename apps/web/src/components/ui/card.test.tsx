import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { Card, CardContent, CardHeader, CardTitle } from "./card";

afterEach(cleanup);

test("Card exposes its title as a heading and keeps the content inside the card", () => {
  const { container } = render(
    <Card>
      <CardHeader>
        <CardTitle>Acme Corp</CardTitle>
      </CardHeader>
      <CardContent>12 open deals</CardContent>
    </Card>,
  );

  const card = container.firstElementChild as HTMLElement;
  const title = screen.getByRole("heading", { name: "Acme Corp" });

  expect(title.tagName).toBe("H3");
  expect(title.textContent).toBe("Acme Corp");
  expect(card.contains(title)).toBe(true);
  expect(within(card).getByText("12 open deals").textContent).toBe("12 open deals");
});

test("Card renders without a header when only content is given", () => {
  const { container } = render(<Card>Just a body</Card>);

  const card = container.firstElementChild as HTMLElement;

  expect(within(card).getByText("Just a body").textContent).toBe("Just a body");
  expect(within(card).queryByRole("heading")).toBeNull();
});

test("Each Card keeps its own title and content", () => {
  const { container } = render(
    <>
      <Card>
        <CardHeader>
          <CardTitle>Leads</CardTitle>
        </CardHeader>
        <CardContent>48 open</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
        </CardHeader>
        <CardContent>12 open</CardContent>
      </Card>
    </>,
  );

  const [leads, accounts] = Array.from(container.children) as [HTMLElement, HTMLElement];

  expect(within(leads).getByRole("heading", { name: "Leads" }).textContent).toBe("Leads");
  expect(within(leads).queryByRole("heading", { name: "Accounts" })).toBeNull();
  expect(within(leads).getByText("48 open").textContent).toBe("48 open");
  expect(within(accounts).getByRole("heading", { name: "Accounts" }).textContent).toBe("Accounts");
  expect(within(accounts).getByText("12 open").textContent).toBe("12 open");
  expect(within(accounts).queryByText("48 open")).toBeNull();
});
