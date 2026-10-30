import { describe, expect, it } from "vitest";
// @ts-expect-error The CLI is a JavaScript module used directly by CI.
import { compareBaseline, filterUnauthorizedExemptions, scanSource } from "./check-ui-messages.mjs";

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
  it("allows shifted lines and visits/social additions while rejecting new hashes and increased counts elsewhere", () => {
    const main = [
      { file: "apps/web/src/components/shell/nav.ts", line: 10, column: 5, hash: "abc" },
      { file: "apps/web/src/modules/leads/leads.tsx", line: 20, column: 5, hash: "def" },
    ];
    const addedVsMain = [
      // Shifted line in shell: same file and hash, count does not increase -> allowed
      { file: "apps/web/src/components/shell/nav.ts", line: 11, column: 5, hash: "abc" },
      // Increased count in shell: second copy of existing hash -> rejected
      { file: "apps/web/src/components/shell/nav.ts", line: 25, column: 5, hash: "abc" },
      // Brand new literal in shell -> rejected
      { file: "apps/web/src/components/shell/nav.ts", line: 15, column: 5, hash: "new_shell" },
      // Brand new literal in leads -> rejected
      { file: "apps/web/src/modules/leads/leads.tsx", line: 30, column: 5, hash: "new_leads" },
      // Brand new literal in components/ui -> rejected
      { file: "apps/web/src/components/ui/button.tsx", line: 10, column: 5, hash: "new_btn" },
      // Brand new literal in visits -> allowed
      { file: "apps/web/src/modules/visits/visits.tsx", line: 5, column: 5, hash: "new_visits" },
    ];
    const unauthorized = filterUnauthorizedExemptions(addedVsMain, main);
    expect(unauthorized).toEqual([
      { file: "apps/web/src/components/shell/nav.ts", line: 25, column: 5, hash: "abc" },
      { file: "apps/web/src/components/shell/nav.ts", line: 15, column: 5, hash: "new_shell" },
      { file: "apps/web/src/modules/leads/leads.tsx", line: 30, column: 5, hash: "new_leads" },
      { file: "apps/web/src/components/ui/button.tsx", line: 10, column: 5, hash: "new_btn" },
    ]);
  });
});
