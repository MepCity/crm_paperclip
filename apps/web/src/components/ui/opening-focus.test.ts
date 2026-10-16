// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vitest";
import { claimOpeningFocus } from "./opening-focus";

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

test("null button does not throw or change active element", () => {
  const initial = document.activeElement;
  expect(() => claimOpeningFocus(null)).not.toThrow();
  expect(document.activeElement).toBe(initial);
});

test("button outside any dialog gets focus", () => {
  const button = document.createElement("button");
  document.body.appendChild(button);
  document.body.focus();

  claimOpeningFocus(button);
  expect(document.activeElement).toBe(button);
});

test("focus on body → button inside dialog gets focus", () => {
  const dialog = document.createElement("div");
  dialog.setAttribute("role", "dialog");
  const button = document.createElement("button");
  dialog.appendChild(button);
  document.body.appendChild(dialog);

  document.body.focus();
  expect(document.activeElement).toBe(document.body);

  claimOpeningFocus(button);
  expect(document.activeElement).toBe(button);
});

test("focus on dialog → button inside dialog gets focus", () => {
  const dialog = document.createElement("div");
  dialog.setAttribute("role", "dialog");
  dialog.tabIndex = -1;
  const button = document.createElement("button");
  dialog.appendChild(button);
  document.body.appendChild(dialog);

  dialog.focus();
  expect(document.activeElement).toBe(dialog);

  claimOpeningFocus(button);
  expect(document.activeElement).toBe(button);
});

test("focus inside dialog → button inside dialog gets focus", () => {
  const dialog = document.createElement("div");
  dialog.setAttribute("role", "dialog");
  const input = document.createElement("input");
  const button = document.createElement("button");
  dialog.appendChild(input);
  dialog.appendChild(button);
  document.body.appendChild(dialog);

  input.focus();
  expect(document.activeElement).toBe(input);

  claimOpeningFocus(button);
  expect(document.activeElement).toBe(button);
});

test("focus already moved outside the dialog → button does not get focus", () => {
  const dialog = document.createElement("div");
  dialog.setAttribute("role", "dialog");
  const button = document.createElement("button");
  dialog.appendChild(button);

  const outsideInput = document.createElement("input");
  document.body.appendChild(dialog);
  document.body.appendChild(outsideInput);

  outsideInput.focus();
  expect(document.activeElement).toBe(outsideInput);

  claimOpeningFocus(button);
  expect(document.activeElement).toBe(outsideInput);
  expect(document.activeElement).not.toBe(button);
});

test("disconnected button without dialog still gets focus call", () => {
  const button = document.createElement("button");
  const focusSpy = vi.spyOn(button, "focus");

  claimOpeningFocus(button);
  expect(focusSpy).toHaveBeenCalledOnce();
});

test("activeElement being null still allows button to claim focus", () => {
  const dialog = document.createElement("div");
  dialog.setAttribute("role", "dialog");
  const button = document.createElement("button");
  dialog.appendChild(button);
  document.body.appendChild(dialog);

  vi.spyOn(document, "activeElement", "get").mockReturnValue(null);
  const focusSpy = vi.spyOn(button, "focus");

  claimOpeningFocus(button);
  expect(focusSpy).toHaveBeenCalledOnce();
});
