"use client";

import type { RecordData } from "@crm/core/records";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useId, useMemo, useRef } from "react";
import { Dialog as AriaDialog, Heading, Modal, ModalOverlay } from "react-aria-components";
import { RelatedRecordsListError } from "@/components/records/detail/related-records-list-error";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { useUiTranslations } from "@/i18n/client-provider";
import { useRecord, useViews } from "@/lib/api/client/hooks";
import { useClientRecordService } from "@/lib/api/client/provider";
import { moduleRecordPath } from "@/lib/crm-paths";
import {
  buildAccountContactTree,
  buildNoAccountContactTree,
  getContactAccountRef,
  getContactFullName,
  getContactReportingToId,
  type HierarchyContactNode,
  type HierarchyTree,
} from "./contact-hierarchy-tree";
import "./contact-hierarchy-modal.css";

const MAX_PAGES = 5;
const PAGE_SIZE = 100;
const HIERARCHY_FIELDS = ["Full_Name", "Reporting_To", "Account_Name"] as const;

export interface ContactHierarchyModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgSlug: string;
  account?: {
    id: string;
    name?: string;
  } | null;
  contact?: {
    id: string;
    name?: string;
    record?: RecordData | null;
  } | null;
  triggerElement?: HTMLElement | null;
}

function HierarchyContactItem({
  node,
  orgSlug,
  onClose,
  isRootLevel,
}: {
  node: HierarchyContactNode;
  orgSlug: string;
  onClose: () => void;
  isRootLevel?: boolean;
}) {
  const href = moduleRecordPath(orgSlug, "Contacts", node.id);

  return (
    // biome-ignore lint/a11y/useFocusableInteractive: treeitem wraps focusable Link child
    <div
      role="treeitem"
      aria-label={node.name}
      className={isRootLevel ? "contact-hierarchy-root-item" : "contact-hierarchy-item"}
    >
      <div className="contact-hierarchy-item-content">
        <Link href={href} variant="text" className="contact-hierarchy-link" onPress={onClose}>
          {node.name}
        </Link>
      </div>
      {node.children.length > 0 && (
        // biome-ignore lint/a11y/useSemanticElements: ARIA tree pattern requires role="group" for nested children
        <div role="group" className="contact-hierarchy-children">
          {node.children.map((child) => (
            <HierarchyContactItem
              key={child.id}
              node={child}
              orgSlug={orgSlug}
              onClose={onClose}
              isRootLevel={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ContactHierarchyModal({
  isOpen,
  onClose,
  orgSlug,
  account,
  contact,
  triggerElement,
}: ContactHierarchyModalProps) {
  const t = useUiTranslations();
  const titleId = useId();
  const service = useClientRecordService();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // If opened from a contact without full record loaded, fetch the contact
  const contactQuery = useRecord("Contacts", contact?.id ?? "");
  const contactRecord = contact?.record ?? (contact?.id ? contactQuery.data : null);

  // If opened from an account without name loaded, fetch the account
  const accountQuery = useRecord("Accounts", account?.id ?? "");
  const accountRecord = account?.id ? accountQuery.data : null;

  // Contact's account lookup
  const contactAccountRef = useMemo(() => {
    if (!contactRecord) return null;
    return getContactAccountRef(contactRecord.fields.Account_Name);
  }, [contactRecord]);

  // Determine effective target account (Mode 1 or Mode 2 with account)
  const effectiveAccountId = account?.id ?? contactAccountRef?.id ?? null;
  const effectiveAccountName =
    account?.name ??
    (accountRecord?.fields.Account_Name as string | undefined) ??
    contactAccountRef?.name ??
    effectiveAccountId ??
    "";

  // Views for Contacts to get default viewId
  const viewsQuery = useViews("Contacts", { enabled: isOpen });
  const defaultViewId = useMemo(
    () => viewsQuery.data?.find((v) => v.isDefault)?.id ?? "all-contacts",
    [viewsQuery.data],
  );

  // Determine query parameters
  const isAccountMode = Boolean(effectiveAccountId);

  // Focus restoration on close or unmount
  useEffect(() => {
    if (!isOpen && triggerElement) {
      triggerElement.focus();
    }
    return () => {
      triggerElement?.focus();
    };
  }, [isOpen, triggerElement]);

  // Query contacts up to 500 in pages of 100
  const contactsQuery = useQuery({
    queryKey: [
      "contact-hierarchy",
      orgSlug,
      isAccountMode ? "account" : "contact-reports",
      isAccountMode ? effectiveAccountId : contact?.id,
      defaultViewId,
    ],
    queryFn: async () => {
      const all: RecordData[] = [];
      const filters = isAccountMode
        ? { field: "Account_Name", comparator: "equal" as const, value: effectiveAccountId ?? "" }
        : { field: "Reporting_To", comparator: "equal" as const, value: contact?.id ?? "" };

      for (let page = 1; page <= MAX_PAGES; page++) {
        const res = await service.list("Contacts", {
          viewId: defaultViewId,
          page,
          perPage: PAGE_SIZE,
          fields: HIERARCHY_FIELDS,
          filters,
        });
        all.push(...res.records);
        if (
          !res.moreRecords ||
          res.records.length < PAGE_SIZE ||
          all.length >= MAX_PAGES * PAGE_SIZE
        ) {
          break;
        }
      }
      return all.slice(0, MAX_PAGES * PAGE_SIZE);
    },
    enabled:
      isOpen &&
      Boolean(
        defaultViewId && (effectiveAccountId || (contact?.id && contactRecord !== undefined)),
      ),
  });

  const isLoading =
    (isAccountMode && !account?.name && accountQuery.isLoading) ||
    (contact?.id && !contact?.record && contactQuery.isLoading) ||
    viewsQuery.isLoading ||
    contactsQuery.isLoading;

  const isError =
    (isAccountMode && !account?.name && accountQuery.isError) ||
    (contact?.id && !contact?.record && contactQuery.isError) ||
    viewsQuery.isError ||
    contactsQuery.isError;

  // Build the hierarchy tree
  const tree: HierarchyTree | null = useMemo(() => {
    if (!isOpen || isLoading || isError) return null;

    if (isAccountMode && effectiveAccountId) {
      return buildAccountContactTree(
        { id: effectiveAccountId, name: effectiveAccountName },
        contactsQuery.data ?? [],
      );
    }

    if (contactRecord) {
      const currentContact = {
        id: contactRecord.id,
        name: contact?.name || getContactFullName(contactRecord),
      };

      let manager: { id: string; name: string } | null = null;
      const reportingToId = getContactReportingToId(contactRecord);
      if (reportingToId) {
        const rawRef = contactRecord.fields.Reporting_To;
        const managerName =
          typeof rawRef === "object" &&
          rawRef !== null &&
          "name" in rawRef &&
          typeof rawRef.name === "string"
            ? rawRef.name
            : reportingToId;
        manager = { id: reportingToId, name: managerName };
      }

      return buildNoAccountContactTree(currentContact, manager, contactsQuery.data ?? []);
    }

    return null;
  }, [
    isOpen,
    isLoading,
    isError,
    isAccountMode,
    effectiveAccountId,
    effectiveAccountName,
    contactsQuery.data,
    contactRecord,
    contact?.name,
  ]);

  return (
    <ModalOverlay
      isOpen={isOpen}
      isDismissable
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      className="contact-hierarchy-overlay fixed inset-0 z-50 outline-none"
    >
      <Modal className="contact-hierarchy-panel outline-none">
        <AriaDialog aria-labelledby={titleId} className="outline-none">
          <div className="flex items-center justify-between pb-3">
            <Heading slot="title" id={titleId} className="text-lg font-bold text-text-strong">
              {t("records.chrome.contactHierarchy")}
            </Heading>
            <Button
              ref={closeButtonRef}
              variant="icon"
              size="compact"
              aria-label="Close Modal"
              onPress={onClose}
              className="text-text-muted hover:text-text"
            >
              <Icons.close aria-hidden className="size-4" />
            </Button>
          </div>

          {isLoading ? (
            <div data-part="empty" className="py-8 text-center text-md text-text-empty">
              Loading...
            </div>
          ) : isError ? (
            <RelatedRecordsListError />
          ) : tree ? (
            <div
              role="tree"
              aria-label={t("records.chrome.contactHierarchy")}
              className="contact-hierarchy-tree"
            >
              {tree.rootAccount ? (
                // biome-ignore lint/a11y/useFocusableInteractive: root account is non-interactive display node
                <div
                  role="treeitem"
                  aria-label={tree.rootAccount.name}
                  data-part="account-root"
                  className="contact-hierarchy-account-row"
                >
                  <Icons.building aria-hidden className="size-4 shrink-0 text-text-muted" />
                  <span>{tree.rootAccount.name}</span>
                </div>
              ) : null}

              {tree.children.length > 0 ? (
                // biome-ignore lint/a11y/useSemanticElements: ARIA tree pattern requires role="group" for nested children
                <div role="group" className={tree.rootAccount ? "contact-hierarchy-children" : ""}>
                  {tree.children.map((child) => (
                    <HierarchyContactItem
                      key={child.id}
                      node={child}
                      orgSlug={orgSlug}
                      onClose={onClose}
                      isRootLevel={!tree.rootAccount}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
}
