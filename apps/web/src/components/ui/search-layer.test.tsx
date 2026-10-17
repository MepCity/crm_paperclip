import { fireEvent, screen, waitFor } from "@testing-library/react";
import { Button, DialogTrigger } from "react-aria-components";
import { describe, expect, it } from "vitest";
import { render } from "@/test/render";
import { SearchLayer } from "./search-layer";

describe("SearchLayer", () => {
  it("renders nothing until its trigger opens it", () => {
    render(
      <DialogTrigger>
        <Button>Open search</Button>
        <SearchLayer>
          <p>Layer content</p>
        </SearchLayer>
      </DialogTrigger>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows its children in a labelled dialog and closes on Escape", async () => {
    render(
      <DialogTrigger>
        <Button>Open search</Button>
        <SearchLayer>
          <p>Layer content</p>
        </SearchLayer>
      </DialogTrigger>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Open search" }));
    const dialog = await screen.findByRole("dialog", { name: "Search records" });
    expect(dialog.textContent).toContain("Layer content");
    fireEvent.keyDown(dialog, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
});
