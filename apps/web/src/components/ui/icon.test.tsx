import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { Icons } from "./icon";

afterEach(cleanup);

const expectedIcons = [
  "recordUser",
  "avatarPerson",
  "recordPortraitSilhouette",
  "recordFormCaret",
  "recordChevron",
  "recordCheck",
  "recordInfo",
  "recordPortrait",
  "thumbDown",
  "statusCheck",
  "filterChevronDown",
  "filterChevronRight",
  "filterSearch",
  "createRecordPlus",
  "building",
  "check",
  "chevronUp",
  "folder",
  "home",
  "signOut",
  "hideMenu",
  "showMenu",
  "plus",
  "settings",
  "users",
  "spinner",
  "error",
  "fieldEdit",
  "success",
  "info",
  "warning",
  "calendar",
  "chevronDown",
  "chevronLeft",
  "chevronRight",
  "close",
  "filter",
  "sort",
  "list",
  "refresh",
  "ellipsis",
  "timelineGeneric",
  "timelinePencil",
] as const;

test("Icons exposes every icon the primitives need", () => {
  expect(Object.keys(Icons).sort()).toEqual([...expectedIcons].sort());
});

test.each(expectedIcons)("Icons.%s is reachable as a labelled image", (name) => {
  const Icon = Icons[name];
  render(<Icon role="img" aria-label={name} />);

  const icon = screen.getByRole("img", { name });
  expect(icon.getAttribute("aria-label")).toBe(name);
});

test("Icons stays decorative when a primitive hides it", () => {
  const Icon = Icons.info;
  render(<Icon aria-hidden="true" />);

  expect(screen.queryByRole("img")).toBeNull();
});

test("filter icons expose img role only with aria-label", () => {
  render(<Icons.filterSearch aria-label="Search filters" />);
  expect(screen.getByRole("img", { name: "Search filters" }).getAttribute("aria-label")).toBe(
    "Search filters",
  );

  render(<Icons.filterChevronDown aria-label="Expand" />);
  expect(screen.getByRole("img", { name: "Expand" }).getAttribute("aria-label")).toBe("Expand");

  const { container: rightContainer } = render(<Icons.filterChevronRight />);
  expect(rightContainer.querySelector("svg")?.getAttribute("role")).toBeNull();
});

test("filter icons omit img role when decorative", () => {
  render(<Icons.filterSearch aria-hidden />);
  expect(screen.queryByRole("img")).toBeNull();
  const { container } = render(<Icons.filterChevronDown />);
  expect(container.querySelector("svg")?.getAttribute("role")).toBeNull();
});

test("Icons aria-hidden removes a labelled icon from the accessibility tree", () => {
  const Icon = Icons.warning;
  render(
    <>
      <Icon role="img" aria-label="visible" />
      <Icon role="img" aria-label="hidden" aria-hidden="true" />
    </>,
  );

  expect(screen.getByRole("img", { name: "visible" }).getAttribute("aria-label")).toBe("visible");
  expect(screen.queryByRole("img", { name: "hidden" })).toBeNull();
  expect(screen.getAllByRole("img")).toHaveLength(1);
});
