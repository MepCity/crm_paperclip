// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SocialRecordCardBody } from "./social-record-card";

afterEach(cleanup);

describe("SocialRecordCardBody", () => {
  it("shows both associate links and explains locally without a request", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<SocialRecordCardBody />);
    expect(screen.getByText(/No social profile is associated/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Associate Twitter" }));
    expect(screen.getByText(/linked from the Social tab/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Associate Facebook" })).toBeTruthy();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
