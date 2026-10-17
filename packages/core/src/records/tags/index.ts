import type { OrgContext } from "../../tenancy/types";
import type { ModuleApiName, RecordId } from "../contract";

export interface Tag {
  id: string;
  module: ModuleApiName;
  name: string;
  color: string | null;
  createdBy: string;
  createdAt: string;
  modifiedBy: string;
  modifiedAt: string;
}
export interface TagService {
  listTags(module: ModuleApiName): Promise<readonly Tag[]>;
  createTag(module: ModuleApiName, input: { name: string; color?: string | null }): Promise<Tag>;
  renameTag(module: ModuleApiName, tagId: string, name: string): Promise<Tag>;
  recolorTag(module: ModuleApiName, tagId: string, color: string | null): Promise<Tag>;
  deleteTag(module: ModuleApiName, tagId: string): Promise<void>;
  addTags(module: ModuleApiName, recordId: RecordId, tagIds: readonly string[]): Promise<void>;
  removeTags(module: ModuleApiName, recordId: RecordId, tagIds: readonly string[]): Promise<void>;
  listRecordTags(module: ModuleApiName, recordId: RecordId): Promise<readonly Tag[]>;
}
export type TagServiceFactory = (ctx: OrgContext) => TagService;
