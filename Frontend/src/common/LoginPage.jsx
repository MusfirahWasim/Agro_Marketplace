import { useState } from "react";
import { Leaf, Mail, Lock, Eye, EyeOff, ArrowRight, Wheat, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import LanguageSelector from "../i18n/LanguageSelector";
import { login, logout } from "../handlers/auth";

const ROLES = [
  { key: "supplier", labelKey: "common.roles.supplier" },
  { key: "agent", labelKey: "common.roles.agent" },
  { key: "buyer", labelKey: "common.roles.buyer" },
];

// Maps the REAL party_type returned by the backend to a route.
const ROLE_ROUTES = {
  S: "/supplier/dashboard",
  CA: "/agent/dashboard",
  B: "/buyer/marketplace",
  A: "/admin/dashboard",
};

// The reverse — what party_type the selected tile REQUIRES. Login is
// now rejected if the account's real role doesn't match the tile
// clicked, even though the credentials are correct — a deliberate
// product decision (not the more forgiving "auto-route to their real
// dashboard regardless of tile" behavior this used to have).
const ROLE_TO_PARTY_TYPE = {
  supplier: "S",
  agent: "CA",
  buyer: "B",
};

// Basic client-side format check — not exhaustive RFC 5322 validation,
// just enough to catch obviously malformed input before a round trip.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const COLORS = {
  forest: "#1e4620",
  forestDark: "#122b15",
  leaf: "#4d8b3d",
  gold: "#f0b84c",
  goldDark: "#d99e2f",
  cream: "#faf8f2",
  greige: "#eef0e9",
  ink: "#17231a",
};

export default function LoginPage() {
  const { t, isRTL } = useLanguage();
  const [role, setRole] = useState("supplier");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!EMAIL_REGEX.test(email)) {
      // Hardcoded, not run through t() — translations.js changes are
      // off-limits right now, same known limitation as backend error
      // messages below.
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    const { data, error: loginError } = await login({ email, password });

    setLoading(false);

    if (loginError) {
      // Raw message from the backend (e.g. "Invalid email or password") —
      // not run through t(), since API error text isn't localized yet.
      setError(loginError);
      return;
    }

    if (data.party_type !== ROLE_TO_PARTY_TYPE[role]) {
      // Credentials were correct — this IS a real account — but it's
      // not the role selected on the tile. login() already stored
      // tokens for this account as a side effect of the successful
      // API call; clear them since we're refusing this login attempt.
      logout();
      const selectedRoleLabel = t(ROLES.find((r) => r.key === role)?.labelKey);
      setError(`This account is not registered as a ${selectedRoleLabel}. Please select the correct role and try again.`);
      return;
    }

    navigate(ROLE_ROUTES[data.party_type] || "/login");
  };

  const activeRoleLabel = t(ROLES.find((r) => r.key === role)?.labelKey);

  return (
    // dir="ltr" is forced here so the two-column layout never reverses —
    // even though <html> gets dir="rtl" globally when Urdu is active,
    // this local override keeps the branding panel pinned left always.
    <div
      dir="ltr"
      className="min-h-screen w-full flex"
      style={{ backgroundColor: COLORS.cream }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&family=Noto+Nastaliq+Urdu:wght@500;700&display=swap');
        .font-display { font-family: 'Fraunces', serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        .font-urdu { font-family: 'Noto Nastaliq Urdu', serif; }
      `}</style>

      {/* LEFT — hero / brand panel. Position, layout, image, and stats
          never change. Only the text content swaps language. */}
      <div
        className="hidden lg:flex lg:w-1/2 relative flex-col justify-between overflow-hidden font-body"
        style={{ backgroundColor: COLORS.forest }}
      >
        {/* subtle organic texture backdrop */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, white 0, transparent 40%), radial-gradient(circle at 80% 70%, white 0, transparent 35%)",
          }}
        />

        <div className="relative z-10 px-12 pt-12 flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: COLORS.gold }}
          >
            <Leaf size={18} color={COLORS.forestDark} />
          </div>
          <span className="font-display text-white text-xl tracking-wide">AISAMMS</span>
        </div>

        <div className="relative z-10 px-12 flex flex-col items-center">
          {/* circular framed image with overlapping leaf badge */}
          <div className="relative w-72 h-72 mb-10">
            <div
              className="w-full h-full rounded-full overflow-hidden border-4"
              style={{ borderColor: COLORS.gold }}
            >
              <img
                src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&q=80"
                alt="Terraced agricultural fields"
                className="w-full h-full object-cover"
              />
            </div>
            <div
              className="absolute -bottom-3 -right-3 w-20 h-20 rounded-full flex flex-col items-center justify-center border-4 shadow-lg"
              style={{ backgroundColor: COLORS.leaf, borderColor: COLORS.forest }}
            >
              <Wheat size={22} color="white" />
              <span className="text-white text-[9px] font-medium mt-0.5">Est. Fresh</span>
            </div>
          </div>

          <h1
            className={`text-white text-3xl text-center leading-snug mb-3 ${isRTL ? "font-urdu" : "font-display"}`}
          >
            {t("login.hero.title")}
          </h1>
          <p className="text-center max-w-sm" style={{ color: "#c9d9c2" }}>
            {t("login.hero.subtitle")}
          </p>
        </div>

        <div className="relative z-10 px-12 pb-12 flex items-center gap-10">
          <div>
            <p className="font-display text-2xl text-white">1,200+</p>
            <p className="text-xs" style={{ color: "#a9c19f" }}>
              {t("common.stats.consignmentsTracked")}
            </p>
          </div>
          <div className="w-px h-8" style={{ backgroundColor: "#3a5c3a" }} />
          <div>
            <p className="font-display text-2xl text-white">98%</p>
            <p className="text-xs" style={{ color: "#a9c19f" }}>
              {t("common.stats.paymentTraceability")}
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT — form panel. This is the ONLY part that flips to RTL
          when Urdu is selected; the outer layout above stays untouched. */}
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className="w-full lg:w-1/2 flex items-center justify-center px-6 sm:px-12 py-12 font-body"
      >
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-between mb-6 lg:mb-10">
            <div className="lg:hidden flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: COLORS.forest }}
              >
                <Leaf size={16} color={COLORS.gold} />
              </div>
              <span className="font-display text-xl" style={{ color: COLORS.forest }}>
                AISAMMS
              </span>
            </div>
            <div className={isRTL ? "mr-auto" : "ml-auto"}>
              <LanguageSelector />
            </div>
          </div>

          <h2
            className={`text-3xl mb-1 ${isRTL ? "font-urdu" : "font-display"}`}
            style={{ color: COLORS.ink }}
          >
            {t("login.welcomeBack")}
          </h2>
          <p className="text-sm mb-8" style={{ color: "#6b7568" }}>
            {t("login.subtitle")}
          </p>

          {/* role selector — cosmetic only now: it sets the button label,
              but actual navigation after login is driven entirely by the
              real party_type the backend returns, not this selection */}
          <div
            className="grid grid-cols-3 gap-2 p-1 rounded-xl mb-7"
            style={{ backgroundColor: COLORS.greige }}
          >
            {ROLES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setRole(r.key)}
                className="text-xs sm:text-sm py-2 px-1 rounded-lg transition-colors font-medium"
                style={
                  role === r.key
                    ? { backgroundColor: COLORS.forest, color: "white" }
                    : { color: "#5b6154" }
                }
              >
                {t(r.labelKey)}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "#4a5240" }}>
                {t("login.emailLabel")}
              </label>
              <div className="relative">
                <Mail
                  size={17}
                  className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "right-3" : "left-3"}`}
                  color="#909685"
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("login.emailPlaceholder")}
                  className={`w-full py-2.5 rounded-lg border text-sm outline-none transition-colors focus:ring-2 ${
                    isRTL ? "pr-10 pl-3" : "pl-10 pr-3"
                  }`}
                  style={{ borderColor: "#d9ddce", backgroundColor: "white" }}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "#4a5240" }}>
                {t("login.passwordLabel")}
              </label>
              <div className="relative">
                <Lock
                  size={17}
                  className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "right-3" : "left-3"}`}
                  color="#909685"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full py-2.5 rounded-lg border text-sm outline-none transition-colors ${
                    isRTL ? "pr-10 pl-10" : "pl-10 pr-10"
                  }`}
                  style={{ borderColor: "#d9ddce", backgroundColor: "white" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "left-3" : "right-3"}`}
                >
                  {showPassword ? (
                    <EyeOff size={17} color="#909685" />
                  ) : (
                    <Eye size={17} color="#909685" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs" style={{ color: "#5b6154" }}>
                <input type="checkbox" className="rounded" />
                {t("login.rememberMe")}
              </label>
              {/* Forgot-password link intentionally inert — no email
                  service exists yet to deliver the OTP, so wiring this
                  to /forgot-password would lead to a dead end anyway. */}
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="text-xs font-medium"
                style={{ color: COLORS.leaf }}
              >
                {t("login.forgotPassword")}
              </a>
            </div>

            {error && (
              <div
                className="text-sm rounded-lg px-3 py-2"
                style={{ backgroundColor: "#faeaea", color: "#b5544a" }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium text-sm mt-2 transition-transform active:scale-[0.99] disabled:opacity-70"
              style={{ backgroundColor: COLORS.gold, color: COLORS.forestDark }}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  {t("login.signInAs", { role: activeRoleLabel })}
                  <ArrowRight size={16} className={isRTL ? "rotate-180" : ""} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm mt-8" style={{ color: "#6b7568" }}>
            {t("login.newToAisamms")}{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate("/signup");
              }}
              className="font-medium"
              style={{ color: COLORS.forest }}
            >
              {t("login.contactAdmin")}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}