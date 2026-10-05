export interface ViewTabStripProps {
  viewName: string;
}

export function ViewTabStrip({ viewName }: ViewTabStripProps) {
  return (
    <div className="flex h-(--size-list-tab-height) items-center" data-view-tab-strip>
      <span
        className="inline-flex h-(--size-list-pill-height) min-w-(--size-list-pill-width) items-center justify-center rounded-md bg-(--color-surface-selected) px-2 text-sm font-bold text-text"
        data-view-pill
      >
        {viewName}
      </span>
    </div>
  );
}
