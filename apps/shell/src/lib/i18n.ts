import { cookies } from "next/headers";
import { t, type Locale } from "@moa/shared/i18n";

export function getLocale(): Locale {
  const locale = cookies().get("moa_locale")?.value;
  return locale === "am" ? "am" : "en";
}

export { t };
