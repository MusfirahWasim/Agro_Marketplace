import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { translations } from "./translations";

const LanguageContext = createContext(undefined);
const STORAGE_KEY = "aisamms_language";

function getInitialLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "ur") return saved;
  } catch {
    // localStorage unavailable (SSR / privacy mode) — fall back silently
  }
  return "en";
}

// Resolves a dot-path like "agent.orders.title" against a translations object.
function resolvePath(obj, path) {
  return path.split(".").reduce((acc, part) => {
    return acc && Object.prototype.hasOwnProperty.call(acc, part) ? acc[part] : undefined;
  }, obj);
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(getInitialLanguage);

  useEffect(() => {
    document.documentElement.dir = language === "ur" ? "rtl" : "ltr";
    document.documentElement.lang = language;
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // ignore
    }
  }, [language]);

  const setLanguage = useCallback((lang) => {
    if (lang === "en" || lang === "ur") setLanguageState(lang);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => (prev === "en" ? "ur" : "en"));
  }, []);

  // formatDate("YYYY-MM-DD") -> localized "14 Jul 2026" / "14 جولائی 2026"
  const formatDate = useCallback(
    (dateStr) => {
      if (!dateStr) return dateStr;
      const d = new Date(`${dateStr}T00:00:00`);
      if (Number.isNaN(d.getTime())) return dateStr;
      try {
        return d.toLocaleDateString(language === "ur" ? "ur-PK" : "en-PK", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      } catch {
        return dateStr;
      }
    },
    [language]
  );

  // t("namespace.key.path", { var: "value" })
  // Falls back: current language -> English -> the raw key itself (never blank, never crashes).
  const t = useCallback(
    (key, vars) => {
      let value = resolvePath(translations[language], key);
      if (value === undefined) value = resolvePath(translations.en, key);
      if (value === undefined) return key;

      if (vars && typeof value === "string") {
        Object.keys(vars).forEach((varKey) => {
          value = value.replace(new RegExp(`{{${varKey}}}`, "g"), vars[varKey]);
        });
      }
      return value;
    },
    [language]
  );

  const value = {
    language,
    setLanguage,
    toggleLanguage,
    t,
    formatDate,
    isRTL: language === "ur",
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage() must be used inside a <LanguageProvider>");
  }
  return ctx;
}
