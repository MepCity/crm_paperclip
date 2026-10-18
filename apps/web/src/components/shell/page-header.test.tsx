import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";
import { render } from "@/test/render";
import { PageHeader } from "./page-header";

describe("PageHeader", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders description when provided", () => {
    render(<PageHeader description="Manage settings for your team." />);

    expect(screen.getByText("Manage settings for your team.")).toBeTruthy();
  });

  it("renders node description such as heading elements", () => {
    render(<PageHeader description={<h1>Account Details</h1>} />);

    expect(screen.getByRole("heading", { level: 1, name: "Account Details" })).toBeTruthy();
  });

  it("renders actions and children buttons with accessible roles and names", () => {
    render(
      <PageHeader
        actions={
          <>
            <Button>Cancel</Button>
            <Button variant="primary">Save</Button>
          </>
        }
      />,
    );

    expect(screen.getByRole("button", { name: "Cancel" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Save" })).toBeTruthy();
  });

  it("renders both description and actions together", () => {
    render(
      <PageHeader description="All registered leads." actions={<Button>Create Lead</Button>} />,
    );

    expect(screen.getByText("All registered leads.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Create Lead" })).toBeTruthy();
  });

  it("renders nothing when neither description nor actions are provided", () => {
    const { container } = render(<PageHeader />);

    expect(container.firstChild).toBeNull();
  });
});
