import { listMembers } from "@crm/core";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { apiRoute } from "@/lib/api/server";
import {
  binQuery,
  binRow,
  collection,
  exactKeys,
  ids,
  invalid,
  objectBody,
  paging,
  requiredString,
  success,
  tagRow,
} from "@/lib/api/wire/tags-bin";

export type TagsBinOperation =
  | "tags"
  | "create"
  | "update"
  | "delete"
  | "add"
  | "remove"
  | "bin"
  | "restore"
  | "purge"
  | "empty";

/** Bind codecs to the same tenant-bound fixture state and authorization as records. */
export function tagsBinRoute(operation: TagsBinOperation) {
  return apiRoute<Record<string, string>>(async ({ ctx, request, params, query }) => {
    const { tags, recycleBin } = createFixtureRecordService(ctx, {
      listMemberIds: async () => (await listMembers(ctx)).map((member) => member.userId),
    });
    if (operation === "bin") {
      const input = binQuery(query);
      const { entries, total } = await recycleBin.list(input);
      const { page, perPage } = paging(query);
      return collection("data", entries.map(binRow), page, perPage, page * perPage < total);
    }
    if (operation === "empty") {
      const body = await objectBody(request);
      exactKeys(body, ["scope", "confirm"]);
      if (body.scope !== "organization" || body.confirm !== true)
        invalid("confirm", "Confirm the organization-wide empty operation.");
      // A filter must never silently turn a scoped deletion into an organization-wide one.
      for (const key of [
        "module",
        "name",
        "deleted_by",
        "deleted_by_contains",
        "deleted_date",
        "deleted_time",
        "criteria",
        "filters",
        "search",
        "operator",
      ])
        if (query[key] !== undefined) invalid(key, "Empty does not accept search criteria.");
      await recycleBin.empty();
      return {
        data: [{ code: "SUCCESS", details: {}, message: "recycle bin emptied", status: "success" }],
      };
    }
    if (operation === "restore" || operation === "purge") {
      const body = await objectBody(request);
      exactKeys(body, ["ids"]);
      const selected = ids(body.ids);
      if (operation === "restore") await recycleBin.restore(selected);
      else await recycleBin.purge(selected);
      return success(
        selected,
        operation === "restore" ? "record restored" : "record permanently deleted",
      );
    }
    const module = requiredString(params.module ?? query.module, "module");
    if (operation === "tags") {
      const { page, perPage } = paging(query);
      const all = await tags.listTags(module);
      const name = query.name?.toLowerCase();
      const matching =
        name === undefined ? all : all.filter((tag) => tag.name.toLowerCase().includes(name));
      const start = (page - 1) * perPage;
      return collection(
        "tags",
        matching.slice(start, start + perPage).map(tagRow),
        page,
        perPage,
        start + perPage < matching.length,
      );
    }
    if (operation === "delete") {
      const id = requiredString(params.tagId, "tagId");
      await tags.deleteTag(module, id);
      return success([id], "tag deleted");
    }
    const body = await objectBody(request);
    if (operation === "add" || operation === "remove") {
      exactKeys(body, ["ids"]);
      const selected = ids(body.ids);
      const record = requiredString(params.recordId, "recordId");
      if (operation === "add") await tags.addTags(module, record, selected);
      else await tags.removeTags(module, record, selected);
      return success([record], operation === "add" ? "tags added" : "tags removed");
    }
    exactKeys(body, ["name", "color"]);
    if (body.name !== undefined && typeof body.name !== "string") invalid("name");
    if (body.color !== undefined && body.color !== null && typeof body.color !== "string")
      invalid("color");
    if (operation === "create") {
      const tag = await tags.createTag(module, {
        name: requiredString(body.name, "name"),
        color: body.color as string | null | undefined,
      });
      return { tags: [tagRow(tag)] };
    }
    if (Object.keys(body).length !== 1) invalid("body", "Send exactly one tag field.");
    const id = requiredString(params.tagId, "tagId");
    const tag =
      body.name !== undefined
        ? await tags.renameTag(module, id, body.name as string)
        : await tags.recolorTag(module, id, body.color as string | null);
    return { tags: [tagRow(tag)] };
  });
}
