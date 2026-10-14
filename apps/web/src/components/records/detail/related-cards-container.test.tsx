import type { RecordData } from "@crm/core/records";
import { cleanup, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { RelatedListDefinition } from "@/modules/types";
import { render } from "@/test/render";
import { RelatedCardsContainer } from "./related-cards-container";

afterEach(cleanup);

it("calls an arbitrary definition builder with the owning record, module and paths", () => {
  const record: RecordData = { id: "record-1", fields: { Subject: "Example" } };
  const recordPath = vi.fn(() => "#record-1");
  const renderBody = vi.fn(({ record: owner }) => <p>Body for {owner?.id}</p>);
  const definition: RelatedListDefinition = {
    id: "custom-card",
    title: "Custom",
    moduleKey: "M5",
    order: 1,
    targetId: "custom-card-target",
    renderBody,
    emptyStateText: "Empty",
  };
  const context = { record, module: "Tasks", orgSlug: "example", recordPath };
  const { rerender } = render(
    <RelatedCardsContainer relatedLists={[definition]} context={context} />,
  );
  expect(renderBody).toHaveBeenCalledWith({ ...context, definition });
  expect(screen.getByText("Body for record-1")).toBeTruthy();
  expect(screen.queryByText("Empty")).toBeNull();
  const nextRecord = { ...record, id: "record-2" };
  rerender(
    <RelatedCardsContainer
      relatedLists={[definition]}
      context={{ ...context, record: nextRecord }}
    />,
  );
  expect(renderBody).toHaveBeenLastCalledWith({ ...context, record: nextRecord, definition });
  expect(screen.getByText("Body for record-2")).toBeTruthy();
});

it("keeps the generic empty state and later-module controls when no body is available", () => {
  const definition: RelatedListDefinition = {
    id: "custom-card",
    title: "Custom",
    moduleKey: "M6",
    order: 1,
    targetId: "custom-card-target",
    emptyStateText: "Empty",
    upperControls: [{ id: "add", label: "Add", type: "button", moduleKey: "M6" }],
  };
  const { rerender } = render(<RelatedCardsContainer relatedLists={[definition]} />);
  expect(screen.getByText("Empty")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Add" }).getAttribute("data-later-module")).toBe("M6");
  rerender(
    <RelatedCardsContainer relatedLists={[{ ...definition, renderBody: () => undefined }]} />,
  );
  expect(screen.getByText("Empty")).toBeTruthy();
});
