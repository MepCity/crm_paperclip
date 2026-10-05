"use client";

import { useState } from "react";
import { RecordHeader, type RecordHeaderProps } from "./record-header";
import { RecordPageFrame } from "./record-page-frame";

const headerProps: RecordHeaderProps = {
  title: "Example Record",
  subtitle: "Example Company",
  back: { label: "Back", href: "/dev/ui" },
  moreLabel: "More Options",
  previousLabel: "Previous Record",
  nextLabel: "Next Record",
};

export default function RecordDetailDemo() {
  const [tab, setTab] = useState("overview");
  const [related, setRelated] = useState("section-a");
  const [action, setAction] = useState("Ready");
  const commands: RecordHeaderProps["commands"] = [
    {
      id: "primary",
      label: "Primary action",
      variant: "primary",
      onPress: () => setAction("Primary action"),
    },
    { id: "edit", label: "Edit", onPress: () => setAction("Edit") },
  ];
  const groups = [
    {
      id: "first",
      items: ["Example One", "Example Two", "Example Three"].map((label) => ({
        id: label,
        label,
        onAction: () => setAction(label),
      })),
    },
    {
      id: "second",
      items: [
        { id: "another", label: "Another action", onAction: () => setAction("Another action") },
      ],
    },
  ];
  const sections = ["section-a", "section-b", "section-c"];
  return (
    <div className="space-y-6">
      <div data-record-demo="frame" className="h-(--size-record-demo-height)">
        <RecordPageFrame
          header={
            <RecordHeader
              {...headerProps}
              commands={commands}
              menuGroups={groups}
              nextHref="/dev/ui?record=next"
            />
          }
          relatedListLabel="Related List"
          relatedEntries={sections.map((id, index) => ({
            id,
            label: `Example Section ${index + 1}`,
            targetId: id,
          }))}
          selectedRelatedId={related}
          onRelatedSelectionChange={setRelated}
          tabsLabel="Record views"
          selectedTabId={tab}
          onTabChange={setTab}
          scrollTopLabel="Scroll To Top"
          tabs={[
            {
              id: "overview",
              label: "Overview",
              content: sections.map((id, index) => (
                <article id={id} key={id} className="shrink-0 bg-surface rounded-lg p-6">
                  <h3>Example Section {index + 1}</h3>
                  {["alpha", "beta", "gamma", "delta", "epsilon", "zeta", "eta", "theta"].map(
                    (row) => (
                      <p key={`${id}-${row}`} className="py-3">
                        Synthetic content row {row}
                      </p>
                    ),
                  )}
                </article>
              )),
            },
            {
              id: "timeline",
              label: "Timeline",
              content: <p className="bg-surface rounded-lg p-6">Synthetic alternate panel</p>,
            },
          ]}
        />
      </div>
      <p role="status">{action}</p>
      {["neither", "previous", "next", "both"].map((state) => (
        <div key={state} data-record-demo={state}>
          <RecordHeader
            {...headerProps}
            title={`Navigation: ${state}`}
            subtitle={undefined}
            commands={
              state === "both"
                ? [{ id: "edit-link", label: "Edit", href: "/dev/ui?edit=true" }]
                : undefined
            }
            previousHref={
              state === "previous" || state === "both" ? "/dev/ui?record=previous" : undefined
            }
            nextHref={state === "next" || state === "both" ? "/dev/ui?record=next" : undefined}
          />
        </div>
      ))}
      <div data-record-demo="empty-rail" className="h-(--size-record-demo-height)">
        <RecordPageFrame
          header={<RecordHeader {...headerProps} />}
          relatedListLabel="Empty Related List"
          tabsLabel="Empty record views"
          tabs={[
            { id: "overview", label: "Overview", content: <p>No related entries supplied.</p> },
            { id: "timeline", label: "Timeline", content: <p>Alternate panel.</p> },
          ]}
          selectedTabId={tab}
          onTabChange={setTab}
          scrollTopLabel="Scroll To Top"
        />
      </div>
    </div>
  );
}
