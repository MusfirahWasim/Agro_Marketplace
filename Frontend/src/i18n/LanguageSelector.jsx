import { Languages } from "lucide-react";
import { useLanguage } from "./LanguageContext";

// Drop this in anywhere (topbar, sidebar, settings page) — no props required.
export default function LanguageSelector({ className = "", style = {} }) {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${className}`}
      style={{ borderColor: "#d9ddce", color: "#1e4620", backgroundColor: "white", ...style }}
      aria-label="Toggle language"
      title={language === "en" ? "اردو میں دیکھیں" : "View in English"}
    >
      <Languages size={14} />
      {language === "en" ? "اردو" : "English"}
    </button>
  );
}
