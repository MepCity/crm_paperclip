import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/render";
import { NotesCardBody } from "./notes-card-body";

const state = vi.hoisted(() => ({ records: [] as unknown[] }));

vi.mock("@/lib/api/client/hooks", () => {
  const mutation = () => ({ mutateAsync: () => Promise.resolve(), isPending: false });
  return {
    useViews: () => ({ data: [{ id: "v1", isDefault: true }], isLoading: false, isError: false }),
    useUsers: () => ({ data: [{ userId: "u1", name: "Alex Morgan" }] }),
    useRecordList: () => ({ data: { records: state.records }, isLoading: false, isError: false }),
    useCreateRecord: mutation,
    useUpdateRecord: mutation,
    useDeleteRecords: mutation,
  };
});

const parent = { id: "p1", fields: { Account_Name: "Acme" } };
const props = { parentModule: "Accounts" as const, parentRecord: parent, recordPath: () => "#" };

afterEach(() => {
  cleanup();
  state.records = [];
});

describe("NotesCardBody", () => {
  it("shows the empty state and the collapsed composer", () => {
    render(<NotesCardBody {...props} />);
    expect(screen.getByText("No records found")).toBeTruthy();
    expect(screen.getByTestId("note-composer-collapsed")).toBeTruthy();
  });

  it("renders stored notes through the safe content renderer", () => {
    state.records = [
      {
        id: "n1",
        fields: {
          Note_Title: "Call recap",
          Note_Content: "<p>Hello <script>x</script>world</p>",
          Created_By: "u1",
          Created_Time: "2026-01-15T12:00:00.000Z",
        },
      },
    ];
    render(<NotesCardBody {...props} />);
    expect(screen.getByText("Call recap")).toBeTruthy();
    expect(screen.getByText("Alex Morgan")).toBeTruthy();
    expect(document.querySelector("script")).toBeNull();
  });
});
