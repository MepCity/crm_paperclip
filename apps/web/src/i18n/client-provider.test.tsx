import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider, useUiTranslations } from "./client-provider";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
afterEach(() => {
  cleanup();
  refresh.mockClear();
});
function Draft() {
  const t = useUiTranslations();
  const [draft, setDraft] = useState("");
  return (
    <>
      <label>
        {t("settings.language")}
        <input value={draft} onChange={(event) => setDraft(event.target.value)} />
      </label>
      <button type="button">{t("common.actions.save")}</button>
    </>
  );
}
describe("language provider", () => {
  it("renders the same language on the server without consulting navigator", () => {
    expect(
      renderToString(
        <LanguageProvider language="tr">
          <Draft />
        </LanguageProvider>,
      ),
    ).toContain("Kaydet");
    expect(
      renderToString(
        <LanguageProvider language="en">
          <Draft />
        </LanguageProvider>,
      ),
    ).toContain("Save");
  });
  it("updates text and document language in place without losing a draft", () => {
    const result = render(
      <LanguageProvider language="en">
        <Draft />
      </LanguageProvider>,
    );
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Unsaved draft" } });
    result.rerender(
      <LanguageProvider language="tr">
        <Draft />
      </LanguageProvider>,
    );
    expect(screen.getByRole("button").textContent).toBe("Kaydet");
    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("Unsaved draft");
    expect(document.documentElement.lang).toBe("tr");
    fireEvent.focus(window);
    expect(refresh).toHaveBeenCalledOnce();
  });
});
