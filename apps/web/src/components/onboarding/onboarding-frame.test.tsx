import { cleanup, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { OnboardingFrame } from "@/components/onboarding/onboarding-frame";
import { render } from "@/test/render";

afterEach(cleanup);

test("renders title heading and main landmark role", () => {
  render(
    <OnboardingFrame title="Create your organization">
      <p>Setup form</p>
    </OnboardingFrame>,
  );

  const main = screen.getByRole("main");
  expect(main).toBeTruthy();

  const heading = screen.getByRole("heading", {
    level: 1,
    name: "Create your organization",
  });
  expect(heading).toBeTruthy();
  expect(main.contains(heading)).toBe(true);
});

test("renders children inside the onboarding frame", () => {
  render(
    <OnboardingFrame title="Welcome aboard">
      <button type="button">Get Started</button>
    </OnboardingFrame>,
  );

  const button = screen.getByRole("button", { name: "Get Started" });
  expect(button).toBeTruthy();
  expect(screen.getByRole("main").contains(button)).toBe(true);
});
