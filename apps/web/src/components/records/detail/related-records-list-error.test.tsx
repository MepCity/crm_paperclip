import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { render } from "@/test/render";
import { RelatedRecordsListError } from "./related-records-list-error";

describe("RelatedRecordsListError", () => {
  it("shows the load-failure message", () => {
    render(<RelatedRecordsListError />);
    expect(screen.getByText("Unable to load records.")).toBeTruthy();
  });
});
