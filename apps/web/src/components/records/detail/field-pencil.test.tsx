import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/render";
import { FieldPencil } from "./field-pencil";

afterEach(cleanup);

describe("FieldPencil", () => {
  it("is a button named by its label and calls back on click", async () => {
    const onClick = vi.fn();
    render(<FieldPencil label="Edit Email" onClick={onClick} />);
    const button = screen.getByRole("button", { name: "Edit Email" });
    expect(button.getAttribute("type")).toBe("button");
    await userEvent.setup().click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
