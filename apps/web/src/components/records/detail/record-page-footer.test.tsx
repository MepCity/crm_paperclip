import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { render } from "@/test/render";
import { RecordPageFooter } from "./record-page-footer";

afterEach(cleanup);

describe("RecordPageFooter", () => {
  it("is a labelled contentinfo landmark", () => {
    render(<RecordPageFooter />);
    expect(screen.getByRole("contentinfo", { name: "Record Management Section" })).toBeTruthy();
  });

  it("shows the record page actions and the current view", () => {
    render(<RecordPageFooter />);
    expect(screen.getByText("Record detail page views :")).toBeTruthy();
    for (const name of ["Add Related List", "Standard View", "Create a custom record page"]) {
      expect(screen.getByRole("button", { name })).toBeTruthy();
    }
  });
});
