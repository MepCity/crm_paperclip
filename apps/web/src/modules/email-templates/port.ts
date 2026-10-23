/**
 * Data port for Email Templates screen.
 * Follows the pattern established in Documents and other settings modules.
 */

export interface EmailTemplateFolder {
  id: string;
  name: string;
}

export interface EmailTemplateModifier {
  name: string;
  id?: string;
}

export interface EmailTemplateItem {
  id: string;
  name: string;
  description?: string;
  module: string;
  modifiedBy: EmailTemplateModifier;
  modifiedAt: string;
  lastUsedAt: string | null;
  isFavorite?: boolean;
  folderIds: readonly string[];
}

export interface EmailTemplatesPort {
  listFolders(): Promise<readonly EmailTemplateFolder[]>;
  listModules(): Promise<readonly string[]>;
  listTemplates(): Promise<readonly EmailTemplateItem[]>;
}
