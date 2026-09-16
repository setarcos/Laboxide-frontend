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

export default i18n;
