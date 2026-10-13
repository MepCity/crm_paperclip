import type { FieldValue, RecordData } from "@crm/core/records";

export interface HierarchyContactNode {
  id: string;
  name: string;
  children: HierarchyContactNode[];
}

export interface HierarchyTree {
  rootAccount?: {
    id: string;
    name: string;
  };
  children: HierarchyContactNode[];
}

/** Extracts the display name for a contact record, falling back to id. */
export function getContactFullName(contact: RecordData): string {
  const name = contact.fields.Full_Name;
  if (typeof name === "string" && name.trim().length > 0) return name.trim();
  const first =
    typeof contact.fields.First_Name === "string" ? contact.fields.First_Name.trim() : "";
  const last = typeof contact.fields.Last_Name === "string" ? contact.fields.Last_Name.trim() : "";
  const combined = [first, last].filter(Boolean).join(" ");
  return combined || contact.id;
}

/** Extracts the Reporting_To lookup ID if present. */
export function getContactReportingToId(contact: RecordData): string | null {
  const ref = contact.fields.Reporting_To;
  if (!ref) return null;
  if (typeof ref === "object" && "id" in ref && typeof ref.id === "string" && ref.id.length > 0) {
    return ref.id;
  }
  if (typeof ref === "string" && ref.length > 0) {
    return ref;
  }
  return null;
}

/** Extracts the Account_Name lookup info if present. */
export function getContactAccountRef(
  fieldValue: FieldValue | undefined,
): { id: string; name?: string } | null {
  if (!fieldValue) return null;
  if (typeof fieldValue === "object" && "id" in fieldValue && typeof fieldValue.id === "string") {
    const name =
      "name" in fieldValue && typeof fieldValue.name === "string" ? fieldValue.name : undefined;
    return { id: fieldValue.id, name };
  }
  if (typeof fieldValue === "string" && fieldValue.length > 0) {
    return { id: fieldValue, name: fieldValue };
  }
  return null;
}

/**
 * Builds a contact hierarchy tree for an Account (Interim rules 1-4).
 * - Root = account
 * - Contacts where Reporting_To is another contact in the set are placed under that contact
 * - Others fall directly under root
 * - Cycles are detected: contacts in cycles fall back under root
 * - Sibling order: Full_Name ascending
 * - Empty state: only rootAccount, empty children
 */
export function buildAccountContactTree(
  account: { id: string; name: string },
  contacts: readonly RecordData[],
): HierarchyTree {
  const contactMap = new Map<string, RecordData>();
  for (const contact of contacts) {
    if (!contactMap.has(contact.id)) {
      contactMap.set(contact.id, contact);
    }
  }

  // Detect nodes involved in cycles
  const cycleNodes = new Set<string>();
  for (const id of contactMap.keys()) {
    const visitedInPath = new Map<string, number>();
    const path: string[] = [];
    let curr: string | null = id;
    while (curr && contactMap.has(curr)) {
      const cycleStartIndex = visitedInPath.get(curr);
      if (cycleStartIndex !== undefined) {
        for (let i = cycleStartIndex; i < path.length; i++) {
          const cycleNodeId = path[i];
          if (cycleNodeId) cycleNodes.add(cycleNodeId);
        }
        break;
      }
      visitedInPath.set(curr, path.length);
      path.push(curr);
      const nextContact = contactMap.get(curr);
      curr = nextContact ? getContactReportingToId(nextContact) : null;
    }
  }

  // Map each contact to its effective parent
  // If parent is not in contactMap, or contact is in a cycle, parent is null (under root)
  const childrenByParent = new Map<string | null, string[]>();
  childrenByParent.set(null, []);

  for (const [id, contact] of contactMap.entries()) {
    let parentId: string | null = null;
    if (!cycleNodes.has(id)) {
      const reportingTo = getContactReportingToId(contact);
      if (reportingTo && contactMap.has(reportingTo) && !cycleNodes.has(reportingTo)) {
        parentId = reportingTo;
      }
    }

    const existingList = childrenByParent.get(parentId);
    if (existingList) {
      existingList.push(id);
    } else {
      childrenByParent.set(parentId, [id]);
    }
  }

  function assembleNodes(parentId: string | null): HierarchyContactNode[] {
    const childIds = childrenByParent.get(parentId) ?? [];
    const nodes: HierarchyContactNode[] = [];
    for (const id of childIds) {
      const contact = contactMap.get(id);
      if (!contact) continue;
      nodes.push({
        id,
        name: getContactFullName(contact),
        children: assembleNodes(id),
      });
    }
    // Sibling order: Full_Name ascending (Rule 3)
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    return nodes;
  }

  return {
    rootAccount: account,
    children: assembleNodes(null),
  };
}

/**
 * Builds a contact hierarchy tree for a Contact with NO Account (Interim rule 5).
 * - No account row
 * - Contact's Reporting_To manager (if any) at top
 * - Contact under manager
 * - Those reporting to contact under contact
 * - Sibling order: Full_Name ascending
 */
export function buildNoAccountContactTree(
  currentContact: { id: string; name: string },
  manager: { id: string; name: string } | null,
  directReports: readonly RecordData[],
): HierarchyTree {
  const directReportNodes: HierarchyContactNode[] = directReports.map((report) => ({
    id: report.id,
    name: getContactFullName(report),
    children: [],
  }));
  directReportNodes.sort((a, b) => a.name.localeCompare(b.name));

  const contactNode: HierarchyContactNode = {
    id: currentContact.id,
    name: currentContact.name,
    children: directReportNodes,
  };

  if (manager) {
    const managerNode: HierarchyContactNode = {
      id: manager.id,
      name: manager.name,
      children: [contactNode],
    };
    return {
      rootAccount: undefined,
      children: [managerNode],
    };
  }

  return {
    rootAccount: undefined,
    children: [contactNode],
  };
}
