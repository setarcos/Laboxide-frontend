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
