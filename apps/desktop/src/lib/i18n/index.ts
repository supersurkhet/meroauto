import { writable, derived } from "svelte/store";
import en from "./en";
import ne from "./ne";

export type Locale = "en" | "ne";

const translations: Record<Locale, Record<string, unknown>> = { en, ne };

export const locale = writable<Locale>("en");

export const t = derived(locale, ($locale) => {
  const dict = translations[$locale];
  return (key: string): string => {
    const keys = key.split(".");
    let value: unknown = dict;
    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return key;
      }
    }
    return typeof value === "string" ? value : key;
  };
});
