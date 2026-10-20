import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { render } from "@/test/render";
import {
  RecordFormClientScriptTab,
  RecordFormEditPageLayoutLink,
  RecordFormInventoryFooter,
} from "./record-form-inventory-chrome";

describe("record form inventory chrome", () => {
  it("renders the Client Script tab as a button", () => {
    render(<RecordFormClientScriptTab />);
    expect(screen.getByRole("button", { name: "Client Script" })).toBeTruthy();
  });

  it("renders the footer label and both view buttons", () => {
    render(<RecordFormInventoryFooter />);
    expect(screen.getByText("Create Form Views :")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Standard View" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Create a custom form page" })).toBeTruthy();
  });

  it("renders the Edit Page Layout button", () => {
    render(<RecordFormEditPageLayoutLink />);
    expect(screen.getByRole("button", { name: "Edit Page Layout" })).toBeTruthy();
  });
});
