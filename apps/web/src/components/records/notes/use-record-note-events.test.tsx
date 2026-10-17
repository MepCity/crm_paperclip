import type { ListQuery, RecordData } from "@crm/core/records";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import type { ClientRecordService } from "@/lib/api/client/http-record-service";
import { ApiProvider } from "@/lib/api/client/provider";
import { useRecordNoteEvents } from "./use-record-note-events";

describe("useRecordNoteEvents", () => {
  it("pages through notes until moreRecords is false and returns all 250 note events", async () => {
    const allNotes: RecordData[] = Array.from({ length: 250 }, (_, i) => ({
      id: `note-${i + 1}`,
      fields: {
        Note_Title: `Note ${i + 1}`,
        Note_Content: `<p>Content ${i + 1}</p>`,
        Parent_Id: { module: "Leads", id: "lead-1" },
        Created_By: { id: "u1", name: "Ada Lovelace" },
        Created_Time: new Date(Date.UTC(2026, 0, 1, 0, i)).toISOString(),
      },
    }));

    const listQueries: ListQuery[] = [];
    const mockService = {
      list: vi.fn(async (_module: string, query: ListQuery) => {
        listQueries.push(query);
        const page = query.page ?? 1;
        const perPage = query.perPage ?? 100;
        const start = (page - 1) * perPage;
        const records = allNotes.slice(start, start + perPage);
        return {
          records,
          moreRecords: start + perPage < allNotes.length,
        };
      }),
      listViewSummaries: vi.fn(async () => [
        { id: "v-notes-default", name: "All Notes", isDefault: true, systemDefined: true },
      ]),
      listUsers: vi.fn(async () => [{ userId: "u1", name: "Ada Lovelace" }]),
    } as unknown as ClientRecordService;

    const wrapper = ({ children }: { children: ReactNode }) => (
      <ApiProvider orgSlug="test-org" service={mockService}>
        {children}
      </ApiProvider>
    );

    const { result } = renderHook(() => useRecordNoteEvents("Leads", "lead-1"), { wrapper });

    await waitFor(() => {
      expect(result.current).toHaveLength(250);
    });

    // Fetched in chunks of 100 (3 pages total)
    expect(mockService.list).toHaveBeenCalledTimes(3);
    expect(listQueries.map((q) => q.page)).toEqual([1, 2, 3]);

    // First and last events
    expect(result.current[0]?.title).toBe("Note added: Note 1");
    expect(result.current[249]?.title).toBe("Note added: Note 250");
    expect(result.current[0]?.actorName).toBe("Ada Lovelace");
  });
});
