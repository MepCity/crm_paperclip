/** What the form would submit, as `name=value` pairs, read the way a server action reads it. */
export function submittedValues(): string[] {
  const form = document.querySelector("form");
  if (!form) throw new Error("submittedValues() needs a <form> in the document");
  return [...new FormData(form).entries()].map(([name, value]) => `${name}=${String(value)}`);
}

/** The text of everything the element points at with `aria-describedby`, in that order. */
export function describedBy(element: Element): string {
  return (element.getAttribute("aria-describedby") ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .map((id) => document.getElementById(id)?.textContent ?? "")
    .join(" ");
}
