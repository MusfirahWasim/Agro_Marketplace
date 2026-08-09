import { Leaf, Menu } from "lucide-react";

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
 */
export default function Topbar({ showMenuButton = false, onMenuClick, rightContent }) {
  return (
    <header
      dir="ltr"
      className="flex items-center justify-between px-6 py-4 border-b shrink-0"
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

      <div className="flex items-center gap-4">{rightContent}</div>
    </header>
  );
}