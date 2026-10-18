import { cleanup, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { CenteredCardFrame } from "@/components/centered-card-frame";
import { render } from "@/test/render";

afterEach(cleanup);

test("renders title heading and main landmark role", () => {
  render(
    <CenteredCardFrame title="Sign in">
      <p>Content</p>
    </CenteredCardFrame>,
  );

  const main = screen.getByRole("main");
  expect(main).toBeTruthy();

  const heading = screen.getByRole("heading", { level: 1, name: "Sign in" });
  expect(heading).toBeTruthy();
  expect(main.contains(heading)).toBe(true);
});

test("renders children inside the card frame", () => {
  render(
    <CenteredCardFrame title="Welcome">
      <button type="button">Continue</button>
    </CenteredCardFrame>,
  );

  const button = screen.getByRole("button", { name: "Continue" });
  expect(button).toBeTruthy();
  expect(screen.getByRole("main").contains(button)).toBe(true);
});
