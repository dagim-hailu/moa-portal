export type SupportedLocales = 'en' | 'am';

export interface SupportedLanguage {
  label: string;
  shortLabel: string;
  icon: string;
  locale: SupportedLocales;
  currency: string;
  currencySymbol: string;
}
export const languages: SupportedLanguage[] = [
  {
    label: 'English',
    shortLabel: 'en',
    icon: 'twemoji:flag-united-kingdom',
    locale: 'en',
    currency: 'USD',
    currencySymbol: '$',
  },
  {
    label: 'Amharic',
    shortLabel: 'am',
    icon: 'twemoji:flag-ethiopia',
    locale: 'am',
    currency: 'ETB',
    currencySymbol: 'ብር',
  },
];
