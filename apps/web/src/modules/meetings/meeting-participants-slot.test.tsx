import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/render";

const state = vi.hoisted(() => ({ pending: false, fail: false }));

vi.mock("@/lib/api/client/hooks", () => ({
  useUpdateRecord: () => ({
    isPending: state.pending,
    mutate: (_vars: unknown, opts?: { onError?: (e: unknown) => void }) => {
      if (state.fail) opts?.onError?.(new Error("boom"));
    },
  }),
}));
vi.mock("@/components/records/form/select-record-dialog", () => ({
  SelectRecordDialog: ({ onDone }: { onDone: (r: unknown) => void }) => (
    <button type="button" onClick={() => onDone([{ module: "Contacts", id: "c1", name: "Ada" }])}>
      pick
    </button>
  ),
}));

import { MeetingParticipantsSlot } from "./meeting-participants-slot";

afterEach(cleanup);

const record = { id: "m1", fields: { Participants: [] } } as never;

describe("MeetingParticipantsSlot", () => {
  it("shows an alert when saving the participants fails", () => {
    state.pending = false;
    state.fail = true;
    render(<MeetingParticipantsSlot record={record} />);
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "pick" }));
    expect(screen.getByRole("alert")).toBeTruthy();
  });

  it("disables Add while the save is pending", () => {
    state.pending = true;
    state.fail = false;
    render(<MeetingParticipantsSlot record={record} />);
    expect((screen.getByRole("button", { name: "Add" }) as HTMLButtonElement).disabled).toBe(true);
  });
});
