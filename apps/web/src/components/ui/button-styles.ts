export const buttonStyles = {
  primary:
    "bg-primary bg-linear-to-b from-(--color-primary-gradient-start) to-(--color-primary-gradient-end) text-primary-text data-hovered:bg-none data-hovered:bg-primary-hover data-pressed:bg-none data-pressed:bg-primary-pressed",
  secondary:
    "bg-surface bg-linear-to-b from-(--color-button-gradient-start) to-(--color-button-gradient-end) text-text border border-(--color-button-border) shadow-sm data-hovered:bg-none data-hovered:bg-surface-hover data-pressed:bg-none data-pressed:bg-surface-pressed",
  ghost: "bg-transparent text-text data-hovered:bg-surface-hover data-pressed:bg-surface-pressed",
  danger: "bg-danger text-danger-text data-hovered:bg-danger-hover data-pressed:bg-danger-pressed",
};

export const buttonSizes = {
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
