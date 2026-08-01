import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Phone,
  Lock,
  User,
  Eye,
  EyeOff,
  Building2,
  ArrowRight,
  Check,
  Leaf,
  Wheat,
  Loader2,
} from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import LanguageSelector from "../i18n/LanguageSelector";
import { signup } from "../handlers/auth";

/**
 * SignupPage
 * Matches the Modern Organic & Eco-Friendly theme established on LoginPage —
 * now using the full COLORS token system throughout (not just the left
 * panel), and the same input markup pattern (absolute-positioned icons).
 *
 * Roles: Supplier / Commission Agent / Buyer
 * (Admins are provisioned separately — see "Sign up to AISAMMS" on Login,
 * which is actually this page's own reverse link back to /login)
 *
 * RTL handling: the outer wrapper is forced dir="ltr" so the two columns
 * never swap position. Only the right form panel gets dir={isRTL ? "rtl" : "ltr"}.
 */

const ROLES = [
  { key: "supplier", labelKey: "common.roles.supplier" },
  { key: "agent", labelKey: "common.roles.agent" },
  { key: "buyer", labelKey: "common.roles.buyer" },
];

// orgLabelKey/orgPlaceholderKey point into signup.orgLabel / signup.orgPlaceholder
const ROLE_ORG_FIELD = {
  supplier: { name: "orgName", labelKey: "signup.orgLabel.supplier", placeholderKey: "signup.orgPlaceholder.supplier" },
  agent: { name: "orgName", labelKey: "signup.orgLabel.agent", placeholderKey: "signup.orgPlaceholder.agent" },
  buyer: null,
};

// Maps the UI role key to the backend's party_type code. Admin is
// deliberately absent — self-signup only covers these 3, same
// restriction already enforced server-side by SignupRequest.
const ROLE_TO_PARTY_TYPE = {
  supplier: "S",
  agent: "CA",
  buyer: "B",
};

const COLORS = {
  forest: "#1e4620",
  forestDark: "#122b15",
  leaf: "#4d8b3d",
  gold: "#f0b84c",
  goldDark: "#d99e2f",
  cream: "#faf8f2",
  greige: "#eef0e9",
  ink: "#17231a",
  sub: "#6b7568",
  border: "#d9ddce",
};

export default function SignupPage() {
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();
  const [role, setRole] = useState("buyer");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    orgName: "",
    password: "",
    confirmPassword: "",
  });

  const orgField = ROLE_ORG_FIELD[role];

  function updateField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.fullName || !form.email || !form.phone || !form.password) {
      setError(t("signup.errors.requiredFields"));
      return;
    }
    if (orgField && !form.orgName) {
      setError(t("signup.errors.orgRequired", { field: t(orgField.labelKey).toLowerCase() }));
      return;
    }
    if (form.password.length < 8) {
      setError(t("signup.errors.passwordLength"));
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError(t("signup.errors.passwordMismatch"));
      return;
    }
    if (!agreed) {
      setError(t("signup.errors.termsRequired"));
      return;
    }

    setSubmitting(true);

    // NOTE: parties.name is a single column — there's nowhere to store
    // BOTH fullName and orgName. For Supplier/Agent we send orgName as
    // `name` (that's what shows up everywhere — "Ahmed Farms", "Rafiq
    // Traders"); fullName is NOT transmitted for those two roles. This
    // needs a real decision (new schema column, or drop the fullName
    // field from the form) — flagged, not silently resolved.
    const payload = {
      name: orgField ? form.orgName : form.fullName,
      party_type: ROLE_TO_PARTY_TYPE[role],
      phone: form.phone,
      email: form.email,
      password: form.password,
    };

    const { error: signupError } = await signup(payload);
    setSubmitting(false);

    if (signupError) {
      // Raw backend message (e.g. "Email already registered") — not
      // run through t(), same known limitation as LoginPage.jsx.
      setError(signupError);
      return;
    }

    // /api/auth/signup returns the created party, not a token pair —
    // there's no auto-login on signup, so routing to /login is correct
    // as-is, not a placeholder.
    navigate("/login", { replace: true });
  }

  const activeRoleLabel = t(ROLES.find((r) => r.key === role).labelKey);

  return (
    <div dir="ltr" className="min-h-screen w-full flex" style={{ backgroundColor: COLORS.cream }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&family=Noto+Nastaliq+Urdu:wght@500;700&display=swap');
        .font-display { font-family: 'Fraunces', serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        .font-urdu { font-family: 'Noto Nastaliq Urdu', serif; }
      `}</style>

      {/* LEFT — hero / brand panel. Matches LoginPage.jsx exactly —
          only the title/subtitle text differs (signup's own copy). */}
      <div
        className="hidden lg:flex lg:w-1/2 relative flex-col justify-between overflow-hidden font-body"
        style={{ backgroundColor: COLORS.forest }}
      >
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
            {t("signup.hero.title1")}
            <br /> {t("signup.hero.title2")}
          </h1>
          <p className="text-center max-w-sm" style={{ color: "#c9d9c2" }}>
            {t("signup.hero.subtitle")}
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

      {/* RIGHT — signup form panel. Only this flips to RTL for Urdu. */}
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className="flex-1 flex items-center justify-center px-6 py-10 sm:px-10 font-body"
      >
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2
                className={`text-3xl mb-1 ${isRTL ? "font-urdu" : "font-display"}`}
                style={{ color: COLORS.ink }}
              >
                {t("signup.createAccount")}
              </h2>
              <p className="text-sm" style={{ color: COLORS.sub }}>
                {t("signup.subtitle")}
              </p>
            </div>
            <LanguageSelector />
          </div>

          {/* Role tabs — same pattern as LoginPage.jsx */}
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
                    : { color: COLORS.sub }
                }
              >
                {t(r.labelKey)}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Field label={t("signup.fullNameLabel")} required>
              <IconInput
                icon={<User size={17} />}
                type="text"
                placeholder={t("signup.fullNamePlaceholder")}
                value={form.fullName}
                onChange={(v) => updateField("fullName", v)}
                autoComplete="name"
                maxLength={50}
                isRTL={isRTL}
              />
            </Field>

            {/* Org / farm / agency name — only for supplier & agent.
                This is the value actually sent as `name` to the backend
                for these two roles — see the payload comment above. */}
            {orgField && (
              <Field label={t(orgField.labelKey)} required>
                <IconInput
                  icon={<Building2 size={17} />}
                  type="text"
                  placeholder={t(orgField.placeholderKey)}
                  value={form.orgName}
                  onChange={(v) => updateField("orgName", v)}
                  autoComplete="organization"
                  maxLength={50}
                  isRTL={isRTL}
                />
              </Field>
            )}

            <Field label={t("signup.emailLabel")} required>
              <IconInput
                icon={<Mail size={17} />}
                type="email"
                placeholder={t("signup.emailPlaceholder")}
                value={form.email}
                onChange={(v) => updateField("email", v)}
                autoComplete="email"
                maxLength={50}
                isRTL={isRTL}
              />
            </Field>

            <Field label={t("signup.phoneLabel")} required>
              <IconInput
                icon={<Phone size={17} />}
                type="tel"
                placeholder={t("signup.phonePlaceholder")}
                value={form.phone}
                onChange={(v) => updateField("phone", v)}
                autoComplete="tel"
                maxLength={13}
                isRTL={isRTL}
              />
            </Field>

            <Field label={t("signup.passwordLabel")} required>
              <IconInput
                icon={<Lock size={17} />}
                type={showPassword ? "text" : "password"}
                placeholder={t("signup.passwordPlaceholder")}
                value={form.password}
                onChange={(v) => updateField("password", v)}
                autoComplete="new-password"
                isRTL={isRTL}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={17} color="#909685" /> : <Eye size={17} color="#909685" />}
                  </button>
                }
              />
            </Field>

            <Field label={t("signup.confirmPasswordLabel")} required>
              <IconInput
                icon={<Lock size={17} />}
                type={showConfirm ? "text" : "password"}
                placeholder={t("signup.confirmPasswordPlaceholder")}
                value={form.confirmPassword}
                onChange={(v) => updateField("confirmPassword", v)}
                autoComplete="new-password"
                isRTL={isRTL}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowConfirm((s) => !s)}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? <EyeOff size={17} color="#909685" /> : <Eye size={17} color="#909685" />}
                  </button>
                }
              />
            </Field>

            <label className="flex items-start gap-2.5 text-sm cursor-pointer" style={{ color: COLORS.sub }}>
              <span
                onClick={() => setAgreed((a) => !a)}
                className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors"
                style={
                  agreed
                    ? { backgroundColor: COLORS.forest, borderColor: COLORS.forest }
                    : { borderColor: COLORS.border, backgroundColor: "white" }
                }
              >
                {agreed && <Check size={12} color="white" />}
              </span>
              <span>
                {t("signup.agreeText")}{" "}
                <span className="font-medium" style={{ color: COLORS.forest }}>
                  {t("signup.termsOfService")}
                </span>{" "}
                {t("signup.and")}{" "}
                <span className="font-medium" style={{ color: COLORS.forest }}>
                  {t("signup.privacyPolicy")}
                </span>
                .
              </span>
            </label>

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
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium text-sm mt-2 transition-transform active:scale-[0.99] disabled:opacity-70"
              style={{ backgroundColor: COLORS.gold, color: COLORS.forestDark }}
            >
              {submitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  {t("signup.signUpAs", { role: activeRoleLabel })}
                  <ArrowRight size={16} className={isRTL ? "rotate-180" : ""} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm mt-8" style={{ color: COLORS.sub }}>
            {t("signup.alreadyHaveAccount")}{" "}
            <Link to="/login" className="font-medium" style={{ color: COLORS.forest }}>
              {t("signup.logIn")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="text-xs font-medium mb-1.5 block" style={{ color: "#4a5240" }}>
        {label} {required && <span style={{ color: COLORS.gold }}>*</span>}
      </label>
      {children}
    </div>
  );
}

// Matches LoginPage.jsx's input pattern exactly — relative wrapper,
// absolute-positioned icon (flips side for RTL), optional trailing
// element (used for the password show/hide toggle).
function IconInput({ icon, trailing, value, onChange, isRTL, ...props }) {
  return (
    <div className="relative">
      <span className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "right-3" : "left-3"}`} style={{ color: "#909685" }}>
        {icon}
      </span>
      <input
        {...props}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full py-2.5 rounded-lg border text-sm outline-none transition-colors focus:ring-2 ${
          isRTL ? "pr-10 pl-3" : "pl-10 pr-3"
        } ${trailing ? (isRTL ? "!pl-10" : "!pr-10") : ""}`}
        style={{ borderColor: COLORS.border, backgroundColor: "white" }}
      />
      {trailing && (
        <div className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "left-3" : "right-3"}`}>{trailing}</div>
      )}
    </div>
  );
}