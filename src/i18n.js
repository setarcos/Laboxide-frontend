// src/i18n.js
import { createI18n } from "vue-i18n";

import en from "./locales/en.json";
import zh from "./locales/zh.json";

const savedLocale = localStorage.getItem("user-lang");
const browserLocale = navigator.language.split("-")[0];
const defaultLocale =
  savedLocale || (["en", "zh"].includes(browserLocale) ? browserLocale : "en");

const i18n = createI18n({
  legacy: false,
  locale: defaultLocale,
  fallbackLocale: "en",
  datetimeFormats: {
    en: {
      short: { month: "short", day: "numeric" },
      long: { month: "short", day: "numeric", year: "numeric" },
    },
    zh: {
      short: { month: "numeric", day: "numeric" },
      long: { year: "numeric", month: "numeric", day: "numeric" },
    },
  },
  messages: { en, zh },
});

async function loadLocale(locale) {
  if (i18n.global.availableLocales.includes(locale)) {
    return;
  }

  try {
    const messages = await import(`./locales/${locale}.json`);
    i18n.global.setLocaleMessage(locale, messages.default);
  } catch (e) {
    console.error(`Failed to load ${locale} locale:`, e);
  }
}

export { loadLocale };
export default i18n;
