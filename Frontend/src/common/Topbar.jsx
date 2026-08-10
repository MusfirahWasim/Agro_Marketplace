import { useState, useRef } from "react";
import { Leaf, Menu, Keyboard } from "lucide-react";
import UrduKeyboard from "../i18n/UrduKeyboard";

const COLORS = {
  forest: "#1e4620",
  forestDark: "#122b15",
  leaf: "#4d8b3d",
  gold: "#f0b84c",
  cream: "#faf8f2",
  greige: "#eef0e9",
  ink: "#17231a",
  sub: "#6b7568",
};

/**
 * Shared topbar — used by Layout.jsx (authenticated pages, with the
 * sidebar toggle + notification bell + profile chip) AND by
 * LoginPage.jsx / SignupPage.jsx (public pages, no sidebar to toggle,
 * a Sign up / Log in button + language selector instead of the
 * profile chip).
 *
 * The AISAMMS logo only shows on mobile (md:hidden) — on desktop,
 * Layout's sidebar already shows it, and Login/Signup's left hero
 * panel already shows it, so a third copy would be redundant there.
 *
 * NOTE: intentionally pinned to dir="ltr". Login/Signup's form panels
 * flip correctly for RTL, but this topbar (menu icon, logo, and the
 * rightContent controls like the language toggle) stays in a fixed
 * left-to-right order regardless of the active language, so buttons
 * don't jump position when switching to Urdu.
 *
 * Also renders a click-to-type Urdu keyboard toggle (always available,
 * independent of rightContent) so anyone without a physical Urdu
 * layout can still type Urdu into any focused text field on the page.
 */
export default function Topbar({ showMenuButton = false, onMenuClick, rightContent }) {
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [kbPosition, setKbPosition] = useState(null);
  const kbButtonRef = useRef(null);

  function toggleKeyboard() {
    if (!keyboardOpen && kbButtonRef.current) {
      const rect = kbButtonRef.current.getBoundingClientRect();
      setKbPosition({
        x: Math.max(8, rect.right - 360),
        y: rect.bottom + 8,
      });
    }
    setKeyboardOpen((v) => !v);
  }

  return (
    <header
      dir="ltr"
      className="relative flex items-center justify-between px-6 py-4 border-b shrink-0"
      style={{ backgroundColor: "white", borderColor: COLORS.greige }}
    >
      <div className="flex items-center gap-3">
        {showMenuButton && (
          <button onClick={onMenuClick}>
            <Menu size={22} color={COLORS.forest} />
          </button>
        )}
        <div className="md:hidden flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ backgroundColor: COLORS.forest }}
          >
            <Leaf size={14} color={COLORS.gold} />
          </div>
          <span className="font-display text-base" style={{ color: COLORS.forest }}>
            AISAMMS
          </span>
        </div>
      </div>

      <div className="hidden md:block" />

      <div className="flex items-center gap-4">
        <button
          ref={kbButtonRef}
          type="button"
          onClick={toggleKeyboard}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
          style={{
            borderColor: "#d9ddce",
            color: keyboardOpen ? COLORS.forestDark : COLORS.forest,
            backgroundColor: keyboardOpen ? COLORS.gold : "white",
          }}
          aria-label="Toggle Urdu keyboard"
          title="اردو کی بورڈ"
        >
          <Keyboard size={14} />
          <span className="hidden sm:inline">اردو</span>
        </button>

        {keyboardOpen && (
          <UrduKeyboard onClose={() => setKeyboardOpen(false)} initialPosition={kbPosition} />
        )}

        {rightContent}
      </div>
    </header>
  );
}