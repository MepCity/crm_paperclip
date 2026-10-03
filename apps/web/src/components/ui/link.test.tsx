import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "vitest";
import { Link } from "./link";

afterEach(cleanup);

test("Link renders an anchor to its target for every variant", () => {
  render(
    <>
      <Link href="/text">Text link</Link>
      <Link href="/primary" variant="primary">
        Primary link
      </Link>
      <Link href="/secondary" variant="secondary">
        Secondary link
      </Link>
      <Link href="/ghost" variant="ghost">
        Ghost link
      </Link>
      <Link href="/danger" variant="danger">
        Danger link
      </Link>
    </>,
  );

  const targets: Record<string, string> = {
    "Text link": "/text",
    "Primary link": "/primary",
    "Secondary link": "/secondary",
    "Ghost link": "/ghost",
    "Danger link": "/danger",
  };
  for (const [name, href] of Object.entries(targets)) {
    expect(screen.getByRole("link", { name }).getAttribute("href")).toBe(href);
  }
});

test("Link takes keyboard focus and marks it as visible", async () => {
  const user = userEvent.setup();
  render(
    <>
      <Link href="/one">First</Link>
      <Link href="/two">Second</Link>
    </>,
  );

  await user.tab();
  const first = screen.getByRole("link", { name: "First" });
  expect(document.activeElement).toBe(first);
  expect(first.getAttribute("data-focus-visible")).toBe("true");
});

test("Link in the disabled state ignores presses", async () => {
  const user = userEvent.setup();
  let presses = 0;
  render(
    <Link href="/nowhere" isDisabled onPress={() => presses++}>
      Disabled link
    </Link>,
  );

  const link = screen.getByRole("link", { name: "Disabled link" });
  expect(link.getAttribute("aria-disabled")).toBe("true");
  expect(link.getAttribute("data-disabled")).toBe("true");

  await user.click(link);
  expect(presses).toBe(0);
});
