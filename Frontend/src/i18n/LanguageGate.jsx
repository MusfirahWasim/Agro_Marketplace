import { useState } from "react";
import { Leaf, ArrowRight } from "lucide-react";
import { useLanguage } from "./LanguageContext";

const CHOSEN_KEY = "aisamms_language_chosen";

/**
 * Shown once, before anything else in the app, so the user picks
 * English or Urdu up front. After that first choice it gets out of
 * the way permanently — people can still switch anytime afterward
 * using the LanguageSelector button in the topbar / login / signup.
 *
 * Wrap it around <App /> in main.jsx, inside <LanguageProvider>.
 */
export default function LanguageGate({ children }) {
  const { setLanguage } = useLanguage();
  const [chosen, setChosen] = useState(() => {
    try {
      return localStorage.getItem(CHOSEN_KEY) === "true";
    } catch {
      return false;
    }
  });

  function choose(lang) {
    setLanguage(lang);
    try {
      localStorage.setItem(CHOSEN_KEY, "true");
    } catch {
      // ignore
    }
    setChosen(true);
  }

  if (chosen) return children;

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-6 font-sans"
      style={{ backgroundColor: "#1e4620" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&family=Noto+Nastaliq+Urdu:wght@500;700&display=swap');
      `}</style>

      <div className="max-w-md w-full text-center">
        <div
          className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
          style={{ backgroundColor: "#f0b84c" }}
        >
          <Leaf size={28} color="#122b15" />
        </div>

        <h1
          className="text-white text-2xl mb-2"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          AISAMMS
        </h1>

        <p className="mb-10" style={{ color: "#c9d9c2" }}>
          Please select your preferred language
          <br />
          <span style={{ fontFamily: "'Noto Nastaliq Urdu', serif" }}>
            براہ کرم اپنی پسندیدہ زبان منتخب کریں
          </span>
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => choose("en")}
            className="group flex flex-col items-center gap-1 rounded-2xl border-2 py-6 px-4 transition-colors"
            style={{ borderColor: "#3a5c3a", backgroundColor: "#122b15" }}
          >
            <span className="text-white text-lg font-semibold">English</span>
            <span className="text-xs flex items-center gap-1" style={{ color: "#a9c19f" }}>
              Continue in English <ArrowRight size={12} />
            </span>
          </button>

          <button
            type="button"
            onClick={() => choose("ur")}
            className="group flex flex-col items-center gap-1 rounded-2xl border-2 py-6 px-4 transition-colors"
            style={{ borderColor: "#3a5c3a", backgroundColor: "#122b15" }}
          >
            <span
              className="text-white text-xl font-semibold"
              style={{ fontFamily: "'Noto Nastaliq Urdu', serif" }}
            >
              اردو
            </span>
            <span className="text-xs" style={{ color: "#a9c19f", fontFamily: "'Noto Nastaliq Urdu', serif" }}>
              اردو میں جاری رکھیں
            </span>
          </button>
        </div>

        <p className="text-xs mt-8" style={{ color: "#7a9271" }}>
          You can change this anytime from the language button in the app.
        </p>
      </div>
    </div>
  );
}
