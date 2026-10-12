import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { NotFoundMessage } from "./not-found-message";

afterEach(() => {
  cleanup();
});

test("NotFoundMessage is the single not-found body sentence", () => {
  const { container } = render(<NotFoundMessage />);
  expect(screen.getByText("The requested page could not be found.")).toBeTruthy();
  expect(container.innerHTML).toBe('<p class="text-md">The requested page could not be found.</p>');
});
