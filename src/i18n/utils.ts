import { ui } from './ui.ts';

export const locales = ['es', 'en'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale = 'es';

export const useTranslations = (lang: keyof typeof ui) => {
  const localizedUI: Record<string, string> = ui[lang];
  return function t(key: keyof (typeof ui)[typeof defaultLocale]) {
    return key in localizedUI ? localizedUI[key] : ui[defaultLocale][key];
  };
};

export const getCurrentLocale = (locale: string | undefined): Locale => (locale ?? defaultLocale) as Locale;

export const interpolate = (template: string, values: Record<string, string>): string =>
  template.replace(/{{(\w+)}}/g, (_, key: string) => values[key] ?? `{{${key}}}`);
