import { cleanup, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/render";
import { DateTimeInput } from "./datetime-input";

afterEach(cleanup);

describe("DateTimeInput", () => {
  it("shows the date and time parts of the value", () => {
    const local = new Date(2026, 4, 12, 9, 30);
    render(<DateTimeInput id="from" label="From" value={local.toISOString()} onChange={vi.fn()} />);
    expect(screen.getByLabelText("From date")).toHaveProperty("value", "12.05.2026");
    expect(screen.getByLabelText("From time")).toHaveProperty("value", "09:30");
  });

  it("is empty for a null value", () => {
    render(<DateTimeInput id="from" label="From" value={null} onChange={vi.fn()} />);
    expect(screen.getByLabelText("From date")).toHaveProperty("value", "");
    expect(screen.getByLabelText("From time")).toHaveProperty("value", "");
  });

  it("reports the combined ISO value once both parts are filled", () => {
    const onChange = vi.fn();
    render(<DateTimeInput id="from" label="From" value={null} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("From date"), { target: { value: "12.05.2026" } });
    expect(onChange).toHaveBeenLastCalledWith(null);
    fireEvent.change(screen.getByLabelText("From time"), { target: { value: "09:30" } });
    expect(onChange).toHaveBeenLastCalledWith(new Date(2026, 4, 12, 9, 30).toISOString());
  });

  it("reports null for an invalid day", () => {
    const onChange = vi.fn();
    render(<DateTimeInput id="from" label="From" value={null} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("From time"), { target: { value: "09:30" } });
    fireEvent.change(screen.getByLabelText("From date"), { target: { value: "31.02.2026" } });
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("hides the time and stores the UTC day when dateOnly", () => {
    const onChange = vi.fn();
    render(<DateTimeInput id="from" label="From" value={null} dateOnly onChange={onChange} />);
    expect(screen.queryByLabelText("From time")).toBeNull();
    fireEvent.change(screen.getByLabelText("From date"), { target: { value: "12.05.2026" } });
    expect(onChange).toHaveBeenLastCalledWith("2026-05-12T00:00:00.000Z");
  });
});

for (const dateOnly of [false, true]) {
  it(`selects a calendar day and preserves ${dateOnly ? "all-day UTC storage" : "the local time"}`, async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <DateTimeInput
        id="from"
        label="From"
        dateOnly={dateOnly}
        value={dateOnly ? "2026-11-10T00:00:00.000Z" : new Date(2026, 10, 10, 9, 30).toISOString()}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByLabelText("From date"));
    await user.click(screen.getByRole("button", { name: /November 15, 2026/ }));
    expect(screen.getByLabelText("From date")).toHaveProperty("value", "15.11.2026");
    expect(onChange).toHaveBeenLastCalledWith(
      dateOnly ? "2026-11-15T00:00:00.000Z" : new Date(2026, 10, 15, 9, 30).toISOString(),
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    if (!dateOnly) expect(screen.getByLabelText("From time")).toHaveProperty("value", "09:30");
  });
}
