"use client";

import { ArrowUpDown, FileText, HelpCircle, Search, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fixtureEmailTemplatesPort } from "./fixture-port";
import type { EmailTemplateFolder, EmailTemplateItem, EmailTemplatesPort } from "./port";

export interface EmailTemplatesScreenProps {
  port?: EmailTemplatesPort;
  initialType?: string;
  orgSlug?: string;
}

export function EmailTemplatesScreen({
  port = fixtureEmailTemplatesPort,
  initialType = "email",
}: EmailTemplatesScreenProps) {
  const [folders, setFolders] = useState<readonly EmailTemplateFolder[]>([]);
  const [modules, setModules] = useState<readonly string[]>([]);
  const [templates, setTemplates] = useState<readonly EmailTemplateItem[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const [selectedModule, setSelectedModule] = useState<string>("All Modules");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    let live = true;
    Promise.all([port.listFolders(), port.listModules(), port.listTemplates()]).then(
      ([f, m, t]) => {
        if (!live) return;
        setFolders(f);
        setModules(m);
        setTemplates(t);
      },
    );
    return () => {
      live = false;
    };
  }, [port]);

  const filteredTemplates = useMemo(() => {
    return templates.filter((item) => {
      // Folder filter
      if (selectedFolder !== "all") {
        if (selectedFolder === "favorites") {
          if (!item.isFavorite && !item.folderIds.includes("favorites")) {
            return false;
          }
        } else if (!item.folderIds.includes(selectedFolder)) {
          return false;
        }
      }

      // Module filter
      if (selectedModule && selectedModule !== "All Modules") {
        if (item.module.toLowerCase() !== selectedModule.toLowerCase()) {
          return false;
        }
      }

      // Client-side template name search filter
      if (searchQuery.trim() !== "") {
        const query = searchQuery.trim().toLowerCase();
        if (!item.name.toLowerCase().includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [templates, selectedFolder, selectedModule, searchQuery]);

  return (
    <div
      className="flex flex-col rounded-lg border border-border bg-surface shadow-xs"
      data-email-templates
    >
      {/* Templates Header */}
      <div className="flex flex-col gap-4 border-b border-border p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-6">
          <h1 className="text-xl font-bold text-text">Templates</h1>
          {/* Type Tabs Strip */}
          <nav aria-label="Template Types" className="flex items-center gap-4 text-sm">
            <a
              href="?type=email"
              role="tab"
              aria-selected={initialType === "email"}
              aria-current={initialType === "email" ? "page" : undefined}
              className={`pb-1 font-semibold transition-colors ${
                initialType === "email"
                  ? "border-b-2 border-primary text-text"
                  : "text-text-muted hover:text-text"
              }`}
            >
              Email
            </a>
            <button
              type="button"
              role="tab"
              aria-selected={false}
              aria-disabled="true"
              data-later-module="P2"
              onClick={(e) => e.preventDefault()}
              className="cursor-default pb-1 text-text-muted transition-colors hover:text-text"
            >
              Inventory
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={false}
              aria-disabled="true"
              data-later-module="M10"
              onClick={(e) => e.preventDefault()}
              className="cursor-default pb-1 text-text-muted transition-colors hover:text-text"
            >
              Mail Merge
            </button>
          </nav>
        </div>

        {/* Right Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Module Selector */}
          <div className="flex items-center">
            <select
              aria-label="All Modules"
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text focus:border-primary focus:outline-hidden"
            >
              {modules.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Search Template Input */}
          <div className="relative flex items-center">
            <Search
              className="pointer-events-none absolute left-2.5 size-4 text-text-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label="Search Template"
              placeholder="Search Template"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 rounded-md border border-border bg-surface py-1.5 pl-8 pr-3 text-sm text-text placeholder:text-text-placeholder focus:border-primary focus:outline-hidden md:w-56"
            />
          </div>

          {/* Context Help Triangle / Icon */}
          <button
            type="button"
            aria-label="Help"
            aria-disabled="true"
            data-later-module="M10"
            onClick={(e) => e.preventDefault()}
            className="inline-flex size-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-hover hover:text-text"
          >
            <HelpCircle className="size-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Main Content: Folder Pane + Templates Table */}
      <div className="flex min-h-[500px] flex-col md:flex-row">
        {/* Template Folders Left Pane */}
        <aside
          aria-label="Template folders"
          className="flex w-full shrink-0 flex-col justify-between border-b border-border p-4 md:w-60 md:border-b-0 md:border-r lg:w-64"
        >
          <div className="flex flex-col gap-3">
            {/* New Template Button */}
            <button
              type="button"
              aria-label="New Template"
              aria-disabled="true"
              data-later-module="M10"
              onClick={(e) => e.preventDefault()}
              className="inline-flex w-full items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-text transition-colors hover:bg-primary-hover"
            >
              New Template
            </button>

            {/* Folder Links */}
            <ul className="flex flex-col gap-1">
              {folders.map((folder) => {
                const isSelected = selectedFolder === folder.id;
                return (
                  <li key={folder.id}>
                    <button
                      type="button"
                      aria-current={isSelected ? "page" : undefined}
                      onClick={() => setSelectedFolder(folder.id)}
                      className={`block w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                        isSelected
                          ? "bg-surface-hover font-semibold text-text"
                          : "text-text-muted hover:bg-surface-hover hover:text-text"
                      }`}
                    >
                      {folder.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Folder Reorder Icon */}
          <div className="mt-4 flex items-center justify-end border-t border-border pt-2 text-text-muted">
            <button
              type="button"
              aria-label="Reorder folders"
              aria-disabled="true"
              data-later-module="M10"
              onClick={(e) => e.preventDefault()}
              className="inline-flex size-7 items-center justify-center rounded-md text-text-muted hover:bg-surface-hover hover:text-text"
            >
              <ArrowUpDown className="size-4" strokeWidth={1.5} />
            </button>
          </div>
        </aside>

        {/* Templates Table Area */}
        <div className="min-w-0 flex-1 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <span className="sr-only">Actions and selection</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      aria-label="Select all"
                      disabled
                      aria-disabled="true"
                      data-later-module="M10"
                      className="size-4 rounded border-border"
                    />
                  </div>
                </TableHead>
                <TableHead>Template Name</TableHead>
                <TableHead>Modified By</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Stats</TableHead>
                <TableHead>
                  <span className="sr-only">Row actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody columnCount={6} emptyMessage="No records to display.">
              {filteredTemplates.map((item) => (
                <TableRow key={item.id}>
                  {/* Select + Favorite */}
                  <TableCell>
                    <div className="flex w-8 items-center gap-2">
                      <button
                        type="button"
                        aria-label="Favorite"
                        aria-disabled="true"
                        data-later-module="M10"
                        onClick={(e) => e.preventDefault()}
                        className="inline-flex size-6 items-center justify-center rounded text-text-muted hover:text-text"
                      >
                        <Star
                          className="size-4"
                          strokeWidth={1.5}
                          fill={item.isFavorite ? "currentColor" : "none"}
                        />
                      </button>
                    </div>
                  </TableCell>

                  {/* Template Name + Module Secondary Text */}
                  <TableCell>
                    <div className="flex flex-col">
                      <button
                        type="button"
                        aria-disabled="true"
                        data-later-module="M10"
                        onClick={(e) => e.preventDefault()}
                        className="text-left font-semibold text-text hover:underline"
                      >
                        {item.name}
                      </button>
                      <span className="text-xs text-text-muted">
                        {item.module}
                        {item.description ? ` · ${item.description}` : ""}
                      </span>
                    </div>
                  </TableCell>

                  {/* Modifier + Date */}
                  <TableCell>
                    <div className="flex flex-col">
                      <button
                        type="button"
                        aria-disabled="true"
                        data-later-module="M10"
                        onClick={(e) => e.preventDefault()}
                        className="text-left text-sm text-text hover:underline"
                      >
                        {item.modifiedBy.name}
                      </button>
                      <span className="text-xs text-text-muted">{item.modifiedAt}</span>
                    </div>
                  </TableCell>

                  {/* Last Used */}
                  <TableCell>
                    <span className="text-sm text-text">{item.lastUsedAt ?? "-"}</span>
                  </TableCell>

                  {/* Stats */}
                  <TableCell>
                    <span className="text-sm text-text">-</span>
                  </TableCell>

                  {/* Unnamed Document Action */}
                  <TableCell>
                    <div className="flex w-8 justify-end">
                      <button
                        type="button"
                        aria-label="Document action"
                        aria-disabled="true"
                        data-later-module="M10"
                        onClick={(e) => e.preventDefault()}
                        className="inline-flex size-6 items-center justify-center rounded text-text-muted hover:text-text"
                      >
                        <FileText className="size-4" strokeWidth={1.5} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
