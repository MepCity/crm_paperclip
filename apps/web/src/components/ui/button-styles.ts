export const buttonStyles = {
  rail: "rounded-md bg-transparent text-rail-text font-semibold data-hovered:bg-rail-surface-raised data-pressed:bg-rail-item-active",
  icon: "rounded-md bg-transparent text-text-muted data-hovered:bg-surface-hover data-pressed:bg-surface-pressed",
  railIcon:
    "rounded-md bg-transparent text-rail-text data-hovered:bg-rail-surface-raised data-pressed:bg-rail-item-active",
  avatar: "rounded-full bg-avatar text-text font-semibold data-hovered:bg-surface-hover",
  primary:
    "font-medium rounded-md bg-primary bg-linear-to-b from-(--color-primary-gradient-start) to-(--color-primary-gradient-end) text-primary-text data-hovered:bg-none data-hovered:bg-primary-hover data-pressed:bg-none data-pressed:bg-primary-pressed data-disabled:bg-none! data-disabled:bg-(--color-primary-disabled)! data-disabled:opacity-100!",
  secondary:
    "font-medium rounded-md bg-surface bg-linear-to-b from-(--color-button-gradient-start) to-(--color-button-gradient-end) text-text border border-(--color-button-border) shadow-sm data-hovered:bg-none data-hovered:bg-surface-hover data-pressed:bg-none data-pressed:bg-surface-pressed",
  ghost:
    "font-medium rounded-md bg-transparent text-text data-hovered:bg-surface-hover data-pressed:bg-surface-pressed",
  danger:
    "font-medium rounded-md bg-danger text-danger-text data-hovered:bg-danger-hover data-pressed:bg-danger-pressed",
};

export const buttonSizes = {
  compact: "p-0 text-md",
  selector: "p-0 text-base",
  avatar: "p-0 text-xs",
  listFilter:
    "h-(--size-list-filter-button-height) w-(--size-list-filter-button-width) text-sm p-0",
  listIcon: "h-(--size-list-view-icon) w-(--size-list-view-icon) text-sm p-0",
  toolbar: "h-(--size-button-split-height) text-sm px-3 py-0",
  splitPrimary:
    "h-(--size-button-split-height) min-w-(--size-button-split-primary) text-sm px-2 py-0",
  splitArrow: "h-(--size-button-split-height) w-(--size-button-split-arrow) text-sm p-0",
  actions: "h-(--size-button-ellipsis-height) w-(--size-button-ellipsis-width) text-sm p-0",
  sm: "text-sm px-3 py-1.5",
  md: "text-base px-4 py-2",
};
