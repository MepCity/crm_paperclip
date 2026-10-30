"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useUiLanguage, useUiTranslations } from "@/i18n/client-provider";
import { supportedLanguage, type UiLanguage } from "@/i18n/resolve-language";

/** Only Language is writable; neighboring formatting preferences remain independent. */
export function LanguageEditor({ onClose }: { onClose: () => void }) {
  const t = useUiTranslations();
  const current = useUiLanguage();
  const [language, setLanguage] = useState<UiLanguage>(current);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const router = useRouter();
  async function save() {
    setPending(true);
    setError(false);
    try {
      const response = await fetch("/api/personal-settings/language", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language }),
      });
      if (!response.ok) throw new Error("SaveFailed");
      router.refresh();
      onClose();
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="flex flex-col items-start gap-3">
      <label htmlFor="ui-language">{t("settings.language")}</label>
      <select
        id="ui-language"
        value={language}
        disabled={pending}
        onChange={(event) => setLanguage(supportedLanguage(event.target.value) ?? current)}
      >
        <option value="en">English</option>
        <option value="tr">Türkçe</option>
      </select>
      {error && <p role="alert">{t("settings.saveError")}</p>}
      <div className="flex gap-2">
        <Button onPress={() => void save()} isPending={pending}>
          {t("common.actions.save")}
        </Button>
        <Button variant="secondary" isDisabled={pending} onPress={onClose}>
          {t("common.actions.cancel")}
        </Button>
      </div>
    </div>
  );
}
