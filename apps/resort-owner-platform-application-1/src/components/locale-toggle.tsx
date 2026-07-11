"use client";

import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@resort/shadcn-ui";
import { SUPPORTED_LANGS, type SupportedLang } from "@/i18n";

const LANG_LABELS: Record<SupportedLang, string> = {
  en: "English",
  bn: "বাংলা",
};

export function LocaleToggle() {
  const { i18n } = useTranslation();

  const current = (i18n.resolvedLanguage ?? i18n.language ?? "en") as SupportedLang;

  const handleChange = async (code: string) => {
    localStorage.setItem("app.lang", code);
    await i18n.changeLanguage(code);
  };

  return (
    <Select value={current} onValueChange={handleChange}>
      <SelectTrigger className="h-8 w-auto border-0 bg-transparent px-2 shadow-none focus:ring-0 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {SUPPORTED_LANGS.map((code) => (
          <SelectItem key={code} value={code}>
            {LANG_LABELS[code]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
