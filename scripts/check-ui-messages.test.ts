import { describe, expect, it } from "vitest";
// @ts-expect-error The CLI is a JavaScript module used directly by CI.
import { compareBaseline, scanSource } from "./check-ui-messages.mjs";

describe("UI message AST guard", () => {
  it("catches JSX, accessible names, label arrays and feedback strings", () => {
    const hits = scanSource(
      `const rows = [{label: 'Owner'}]; const x = <><p>Hello</p><input aria-label="Email" placeholder={'Search'} /></>; toast('Saved'); setError('Failed');`,
    );
    expect(hits).toHaveLength(6);
  });
  it("ignores identifiers, API values and translated expressions", () => {
    expect(
      scanSource(
        `const wire = {apiName: 'Leads', status: 'Open'}; const x = <input aria-label={t('email')} data-module="Leads" />;`,
      ),
    ).toEqual([]);
  });
  it("rejects new and stale exemptions including moving a literal", () => {
    const before = scanSource(`const x = <p>Hello</p>`);
    const after = scanSource(`\nconst x = <p>Hello</p>`);
    expect(compareBaseline(after, before)).toMatchObject({ added: after, stale: before });
  });
});
