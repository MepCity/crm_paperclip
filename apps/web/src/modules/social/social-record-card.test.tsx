// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SocialRecordCardBody } from "./social-record-card";

afterEach(cleanup);

describe("SocialRecordCardBody", () => {
  it("shows both associate links and explains locally without a request", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<SocialRecordCardBody />);
    expect(
      screen.getByText(
        "You cannot search a profile in Facebook. This has to be associated from the Social Tab",
      ),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Associate Twitter" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Associate Facebook" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Associate Twitter" }));
    fireEvent.click(screen.getByRole("button", { name: "Associate Facebook" }));
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
