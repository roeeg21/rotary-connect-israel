import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

import en from "../../locales/en.json";
import he from "../../locales/he.json";

const STORAGE_KEY = "rc-lang";

export type Language = "he" | "en";

// Get device language, default to Hebrew
const getDeviceLanguage = (): Language => {
  const deviceLang = Localization.getLocales()[0]?.languageCode;
  return deviceLang === "en" ? "en" : "he";
};

// Initialize i18n
i18n.use(initReactI18next).init({
  compatibilityJSON: "v4",
  resources: {
    en: { translation: en },
    he: { translation: he },
  },
  lng: "he", // Default to Hebrew
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

// Load saved language preference
export async function loadSavedLanguage(): Promise<Language> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "he") {
      await i18n.changeLanguage(saved);
      return saved;
    }
    // Use device language if no saved preference
    const deviceLang = getDeviceLanguage();
    await i18n.changeLanguage(deviceLang);
    return deviceLang;
  } catch {
    return "he";
  }
}

// Save language preference
export async function setLanguage(lang: Language): Promise<void> {
  await i18n.changeLanguage(lang);
  await AsyncStorage.setItem(STORAGE_KEY, lang);
}

// Toggle language
export async function toggleLanguage(): Promise<Language> {
  const current = i18n.language as Language;
  const next: Language = current === "he" ? "en" : "he";
  await setLanguage(next);
  return next;
}

// Get current language
export function getCurrentLanguage(): Language {
  return (i18n.language as Language) || "he";
}

// Check if RTL
export function isRTL(): boolean {
  return getCurrentLanguage() === "he";
}

// Get text direction
export function getDirection(): "rtl" | "ltr" {
  return isRTL() ? "rtl" : "ltr";
}

export { i18n };
export default i18n;
