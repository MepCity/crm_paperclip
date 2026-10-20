"use client";

import type { Criteria, FieldValue, ModuleApiName, RecordData } from "@crm/core/records";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RelatedRecordsListError } from "@/components/records/detail/related-records-list-error";
import { Button } from "@/components/ui/button";
import {
  useCreateRecord,
  useDeleteRecords,
  useRecordList,
  useUpdateRecord,
  useUsers,
  useViews,
} from "@/lib/api/client/hooks";
import {
  NoteAttachmentList,
  useNoteAttachments,
  useUploadNoteAttachments,
} from "./note-attachments";
import { NoteColorPicker } from "./note-color-picker";
import { NoteComposer, type NoteDraft } from "./note-composer";
import { NoteContent } from "./note-content";
import { NoteFormatToolbar } from "./note-format-toolbar";
import { NoteLinkPopover } from "./note-link-popover";
import { NoteList, type NoteListItem } from "./note-list";
import type { NoteSortOrder } from "./note-sort";

const PAGE_SIZE = 100;
const NAME_FIELDS = [
  "Full_Name",
  "Account_Name",
  "Deal_Name",
  "Campaign_Name",
  "Subject",
  "Solution_Title",
  "Last_Name",
  "Company",
];

export interface NotesCardBodyProps {
  parentModule: ModuleApiName;
  parentRecord: RecordData;
  recordPath: (module: ModuleApiName, id: string) => string;
}

function text(value: FieldValue | undefined): string | null {
  return typeof value === "string" && value !== "" ? value : null;
}

function parentLabel(module: string, record: RecordData): string {
  for (const name of NAME_FIELDS) {
    const value = text(record.fields[name]);
    if (value) return `${module}: ${value}`;
  }
  return module;
}

function toolbar(exec: (command: string, value?: string, text?: string) => void) {
  return (
    <NoteFormatToolbar
      onCommand={exec}
      colorPicker={NoteColorPicker}
      linkPopover={NoteLinkPopover}
    />
  );
}

function EditComposerWithBudget({
  noteId,
  ...props
}: { noteId: string } & React.ComponentProps<typeof NoteComposer>) {
  const query = useNoteAttachments(noteId);
  const existing = query.data ?? [];
  return (
    <NoteComposer
      {...props}
      attachments={<NoteAttachmentList noteId={noteId} editable />}
      attachedCount={existing.length}
      attachedBytes={existing.reduce((sum, a) => sum + a.size, 0)}
    />
  );
}

interface PageResult {
  records: readonly RecordData[];
  moreRecords: boolean;
}

function NotesPageLoader({
  viewId,
  page,
  filters,
  onLoaded,
}: {
  viewId: string;
  page: number;
  filters: Criteria;
  onLoaded: (page: number, result: PageResult) => void;
}) {
  const query = useMemo(
    () => ({ viewId, page, perPage: PAGE_SIZE, filters }),
    [viewId, page, filters],
  );
  const list = useRecordList("Notes", query, { enabled: Boolean(viewId) });
  const lastKeyRef = useRef<string>("");

  useEffect(() => {
    if (list.data) {
      const records = (list.data.records ?? []) as readonly RecordData[];
      const moreRecords = Boolean(list.data.moreRecords);
      const key = JSON.stringify({ records, moreRecords });
      if (lastKeyRef.current !== key) {
        lastKeyRef.current = key;
        onLoaded(page, { records, moreRecords });
      }
    }
  }, [page, list.data, onLoaded]);

  return null;
}

export function NotesCardBody({ parentModule, parentRecord, recordPath }: NotesCardBodyProps) {
  const views = useViews("Notes");
  const users = useUsers();
  const viewId = useMemo(
    () => views.data?.find((view) => view.isDefault)?.id ?? views.data?.[0]?.id ?? null,
    [views.data],
  );
  const filters = useMemo(
    () =>
      ({
        field: "Parent_Id",
        comparator: "equal",
        value: { module: parentModule, id: parentRecord.id },
      }) as Criteria,
    [parentModule, parentRecord.id],
  );
  const query = useMemo(
    () => ({ viewId: viewId ?? "pending", page: 1, perPage: PAGE_SIZE, filters }),
    [viewId, filters],
  );
  const list = useRecordList("Notes", query, { enabled: viewId !== null });
  const create = useCreateRecord("Notes");
  const update = useUpdateRecord("Notes");
  const remove = useDeleteRecords("Notes");

  const [pageCount, setPageCount] = useState(1);
  const [extraPages, setExtraPages] = useState<Map<number, PageResult>>(new Map());

  const handlePageLoaded = useCallback((page: number, res: PageResult) => {
    setExtraPages((prev) => {
      const next = new Map(prev);
      next.set(page, res);
      return next;
    });
  }, []);

  useEffect(() => {
    if (parentRecord.id || viewId) {
      setPageCount(1);
      setExtraPages(new Map());
    }
  }, [parentRecord.id, viewId]);

  const [sort, setSort] = useState<NoteSortOrder>("recentLast");
  const [composing, setComposing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const upload = useUploadNoteAttachments();

  const page1Records = (list.data?.records ?? []) as readonly RecordData[];
  const page1MoreRecords = Boolean(list.data?.moreRecords);

  const records = useMemo(() => {
    const seen = new Set<string>();
    const combined: RecordData[] = [];
    for (const r of page1Records) {
      if (!seen.has(r.id)) {
        seen.add(r.id);
        combined.push(r);
      }
    }
    for (let p = 2; p <= pageCount; p++) {
      const pageData = extraPages.get(p);
      if (pageData) {
        for (const r of pageData.records) {
          if (!seen.has(r.id)) {
            seen.add(r.id);
            combined.push(r);
          }
        }
      }
    }
    return combined;
  }, [page1Records, pageCount, extraPages]);

  const hasMore =
    pageCount === 1 ? page1MoreRecords : Boolean(extraPages.get(pageCount)?.moreRecords);
  const items = useMemo<NoteListItem[]>(() => {
    const names = new Map((users.data ?? []).map((member) => [member.userId, member.name]));
    const label = parentLabel(parentModule, parentRecord);
    const href = recordPath(parentModule, parentRecord.id);
    return records.map((record) => {
      const by = record.fields.Created_By ?? record.fields.Owner;
      const id = by && typeof by === "object" && "id" in by ? String(by.id) : text(by);
      const name =
        by && typeof by === "object" && "name" in by && typeof by.name === "string"
          ? by.name
          : ((id && names.get(id)) ?? "");
      return {
        id: record.id,
        title: text(record.fields.Note_Title),
        body: <NoteContent html={text(record.fields.Note_Content) ?? ""} />,
        parentLabel: label,
        parentHref: href,
        createdAt: text(record.fields.Created_Time) ?? new Date(0).toISOString(),
        attachments: (
          <NoteAttachmentList noteId={record.id} uploadError={uploadErrors[record.id]} />
        ),
        authorName: name,
        canEdit: true,
        canDelete: true,
      };
    });
  }, [records, users.data, parentModule, parentRecord, recordPath, uploadErrors]);

  const fail = useCallback((e: unknown) => {
    setError(e instanceof Error && e.message ? e.message : "Unable to save the note.");
  }, []);

  const sendFiles = async (noteId: string, files: File[] | undefined) => {
    if (!files || files.length === 0) return;
    const failed = await upload(noteId, files);
    setUploadErrors((current) => {
      const { [noteId]: _drop, ...rest } = current;
      return failed.length === 0
        ? rest
        : { ...rest, [noteId]: `Unable to upload: ${failed.join(", ")}` };
    });
  };

  const saveNew = async (draft: NoteDraft) => {
    setError(null);
    try {
      const created = await create.mutateAsync({
        Parent_Id: { module: parentModule, id: parentRecord.id },
        Note_Title: draft.title === "" ? null : draft.title,
        Note_Content: draft.content,
      });
      if (created) await sendFiles(created.id, draft.files);
    } catch (e) {
      fail(e);
      throw e;
    }
    setComposing(false);
  };

  const saveEdit = (id: string) => async (draft: NoteDraft) => {
    setError(null);
    try {
      await update.mutateAsync({
        id,
        input: {
          Note_Title: draft.title === "" ? null : draft.title,
          Note_Content: draft.content,
        },
      });
      await sendFiles(id, draft.files);
    } catch (e) {
      fail(e);
      throw e;
    }
    setEditingId(null);
  };

  const onDelete = async (id: string) => {
    setError(null);
    try {
      await remove.mutateAsync([id]);
    } catch {
      setError("Unable to delete the note.");
    }
  };

  if (views.isLoading || (viewId !== null && list.isLoading)) {
    return (
      <div data-part="empty" className="py-8 text-center text-md text-text-empty">
        Loading...
      </div>
    );
  }
  if (views.isError || list.isError) return <RelatedRecordsListError />;

  const editing = editingId ? records.find((r) => r.id === editingId) : undefined;
  return (
    <div className="flex flex-col gap-3 py-4" data-testid="notes-card-body">
      <NoteComposer
        mode="create"
        expanded={composing}
        onExpand={() => {
          setError(null);
          setComposing(true);
        }}
        onCancel={() => {
          setError(null);
          setComposing(false);
        }}
        onSave={saveNew}
        saving={create.isPending}
        error={composing ? error : null}
        renderToolbar={toolbar}
      />
      {viewId !== null &&
        Array.from({ length: Math.max(0, pageCount - 1) }, (_, i) => i + 2).map((page) => (
          <NotesPageLoader
            key={page}
            viewId={viewId}
            filters={filters}
            page={page}
            onLoaded={handlePageLoaded}
          />
        ))}
      {items.length === 0 ? (
        <div data-part="empty" className="py-8 text-center text-md text-text-empty">
          No records found
        </div>
      ) : (
        <NoteList
          items={items}
          sort={sort}
          onSortChange={setSort}
          onEdit={(id) => {
            setError(null);
            setEditingId(id);
          }}
          onDelete={onDelete}
          editingId={editingId}
          footer={
            hasMore ? (
              <div className="flex justify-center pt-2">
                <Button variant="secondary" size="sm" onPress={() => setPageCount((p) => p + 1)}>
                  View more
                </Button>
              </div>
            ) : null
          }
          renderEditor={(id) => (
            <EditComposerWithBudget
              noteId={id}
              mode="edit"
              expanded
              initial={{
                title: text(editing?.fields.Note_Title) ?? "",
                content: text(editing?.fields.Note_Content) ?? "",
              }}
              onExpand={() => {}}
              onCancel={() => {
                setError(null);
                setEditingId(null);
              }}
              onSave={saveEdit(id)}
              saving={update.isPending}
              error={error}
              renderToolbar={toolbar}
            />
          )}
        />
      )}
      {error && !composing && !editingId ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
