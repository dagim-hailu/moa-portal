import am from "./am.json";
import en from "./en.json";

export type Locale = "en" | "am";

const messages = { en, am } as const;

export function t(locale: Locale, key: keyof typeof en): string {
  return messages[locale]?.[key] ?? messages.en[key] ?? key;
}
