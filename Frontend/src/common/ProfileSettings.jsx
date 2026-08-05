import { useState, useEffect } from "react";
import { Camera, Save, Lock, Loader2 } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { getMyProfile, updateMyProfile, changeMyPassword } from "../handlers/party";

const COLORS = {
  forest: "#1e4620",
  forestDark: "#122b15",
  leaf: "#4d8b3d",
  gold: "#f0b84c",
  cream: "#faf8f2",
  greige: "#eef0e9",
  ink: "#17231a",
  sub: "#6b7568",
  border: "#d9ddce",
};

// party_type code (as returned by the API) -> the key used in
// common.roles.* for display. There's no "admin" self-service profile
// route today, but mapped anyway so this never silently breaks if one
// gets added later.
const PARTY_TYPE_TO_ROLE_KEY = {
  S: "common.roles.supplier",
  CA: "common.roles.agent",
  B: "common.roles.buyer",
  A: "common.roles.admin",
};

export default function ProfileSettings({ role }) {
  const { t } = useLanguage();

  // `role` prop (from the route, e.g. <ProfileSettings role="supplier" />)
  // is only used as a loading-state hint before real data arrives.
  // Once the real profile loads, everything displayed uses the ACTUAL
  // party_type from the API — not this prop — same reasoning as the
  // LoginPage fix: trust the backend's answer, not a value that could
  // be stale or mismatched (nothing currently guards these routes by
  // real role, since ProtectedRoute was deferred).

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    billing_address: "",
    shipping_address: "",
  });

  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      const { data, error } = await getMyProfile();
      if (cancelled) return;

      if (error) {
        setLoadError(error);
      } else {
        setProfile(data);
        setForm({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          billing_address: data.billing_address || "",
          shipping_address: data.shipping_address || "",
        });
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);
    setSaving(true);

    const { data, error } = await updateMyProfile(form);
    setSaving(false);

    if (error) {
      setSaveError(error);
      return;
    }

    setProfile(data);
    setSaveSuccess(true);
  }

  async function handlePasswordSave(e) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (passwords.next.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (passwords.next !== passwords.confirm) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    setChangingPassword(true);
    const { error } = await changeMyPassword({
      current_password: passwords.current,
      new_password: passwords.next,
    });
    setChangingPassword(false);

    if (error) {
      setPasswordError(error);
      return;
    }

    setPasswords({ current: "", next: "", confirm: "" });
    setPasswordSuccess(true);
  }

  const initials = (form.name || "")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("");

  const roleLabel = profile ? t(PARTY_TYPE_TO_ROLE_KEY[profile.party_type] || "") : "";

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
      })
    : "—";

  if (loading) {
    return (
      <div className="font-body flex items-center justify-center py-24" style={{ backgroundColor: COLORS.cream }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap');
          .font-display { font-family: 'Fraunces', serif; }
          .font-body { font-family: 'Inter', sans-serif; }
        `}</style>
        <Loader2 size={22} className="animate-spin" color={COLORS.forest} />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="font-body py-12 text-center" style={{ backgroundColor: COLORS.cream }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap');
          .font-display { font-family: 'Fraunces', serif; }
          .font-body { font-family: 'Inter', sans-serif; }
        `}</style>
        <p className="text-sm" style={{ color: "#b5544a" }}>
          {loadError}
        </p>
      </div>
    );
  }

  return (
    <div className="font-body" style={{ backgroundColor: COLORS.cream }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Fraunces', serif; }
        .font-body { font-family: 'Inter', sans-serif; }
      `}</style>

      {/* header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl sm:text-3xl" style={{ color: COLORS.ink }}>
          {t("profile.title")}
        </h1>
        <p className="text-sm mt-1" style={{ color: COLORS.sub }}>
          {t("profile.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* main form */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <form
            onSubmit={handleSave}
            className="rounded-xl border p-6"
            style={{ backgroundColor: "white", borderColor: COLORS.greige }}
          >
            {/* avatar */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b" style={{ borderColor: COLORS.greige }}>
              <div
                className="relative w-16 h-16 rounded-full flex items-center justify-center text-lg font-medium shrink-0"
                style={{ backgroundColor: COLORS.greige, color: COLORS.forest }}
              >
                {initials}
                <button
                  type="button"
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white"
                  style={{ backgroundColor: COLORS.gold }}
                >
                  <Camera size={12} color={COLORS.forestDark} />
                </button>
              </div>
              <div>
                <p className="font-display text-lg" style={{ color: COLORS.ink }}>
                  {form.name}
                </p>
                <p className="text-xs" style={{ color: COLORS.sub }}>
                  {roleLabel}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-medium mb-1.5 block" style={{ color: "#4a5240" }}>
                  {t("profile.fullNameLabel")}
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  maxLength={50}
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                  style={{ borderColor: COLORS.border }}
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: "#4a5240" }}>
                  {t("profile.emailLabel")}
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  maxLength={50}
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                  style={{ borderColor: COLORS.border }}
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: "#4a5240" }}>
                  {t("profile.phoneLabel")}
                </label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  maxLength={13}
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                  style={{ borderColor: COLORS.border }}
                />
              </div>

              {/* Split into billing/shipping to match parties.billing_address
                  and parties.shipping_address — two separate columns, not
                  one. Labels are hardcoded plain text, not run through t(),
                  since no translation keys exist yet for this split
                  (translations.js changes are off-limits right now). */}
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: "#4a5240" }}>
                  Billing address
                </label>
                <input
                  value={form.billing_address}
                  onChange={(e) => setForm({ ...form, billing_address: e.target.value })}
                  maxLength={150}
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                  style={{ borderColor: COLORS.border }}
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: "#4a5240" }}>
                  Shipping address
                </label>
                <input
                  value={form.shipping_address}
                  onChange={(e) => setForm({ ...form, shipping_address: e.target.value })}
                  maxLength={150}
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                  style={{ borderColor: COLORS.border }}
                />
              </div>

              {/* NOTE: the old per-role "extra field" (farm/business name,
                  commission rate, preferred payment method) has been
                  removed entirely — none of the three had a real backend
                  column to save to. See the message accompanying this
                  change for the full breakdown per role. */}
            </div>

            {saveError && (
              <div className="text-sm rounded-lg px-3 py-2 mt-4" style={{ backgroundColor: "#faeaea", color: "#b5544a" }}>
                {saveError}
              </div>
            )}
            {saveSuccess && (
              <div className="text-sm rounded-lg px-3 py-2 mt-4" style={{ backgroundColor: "#eaf1e4", color: COLORS.leaf }}>
                Profile updated successfully.
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium mt-6 disabled:opacity-70"
              style={{ backgroundColor: COLORS.gold, color: COLORS.forestDark }}
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {t("profile.saveChanges")}
            </button>
          </form>

          {/* password */}
          <form
            onSubmit={handlePasswordSave}
            className="rounded-xl border p-6"
            style={{ backgroundColor: "white", borderColor: COLORS.greige }}
          >
            <div className="flex items-center gap-2 mb-5">
              <Lock size={16} color={COLORS.forest} />
              <h2 className="font-display text-lg" style={{ color: COLORS.ink }}>
                {t("profile.changePassword")}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: "#4a5240" }}>
                  {t("profile.currentPassword")}
                </label>
                <input
                  type="password"
                  value={passwords.current}
                  onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                  style={{ borderColor: COLORS.border }}
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: "#4a5240" }}>
                  {t("profile.newPassword")}
                </label>
                <input
                  type="password"
                  value={passwords.next}
                  onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                  style={{ borderColor: COLORS.border }}
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: "#4a5240" }}>
                  {t("profile.confirmNewPassword")}
                </label>
                <input
                  type="password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                  style={{ borderColor: COLORS.border }}
                />
              </div>
            </div>

            {passwordError && (
              <div className="text-sm rounded-lg px-3 py-2 mt-4" style={{ backgroundColor: "#faeaea", color: "#b5544a" }}>
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="text-sm rounded-lg px-3 py-2 mt-4" style={{ backgroundColor: "#eaf1e4", color: COLORS.leaf }}>
                Password updated successfully.
              </div>
            )}

            <button
              type="submit"
              disabled={changingPassword}
              className="px-4 py-2.5 rounded-lg text-sm font-medium mt-6 disabled:opacity-70 flex items-center gap-2"
              style={{ backgroundColor: COLORS.forest, color: "white" }}
            >
              {changingPassword && <Loader2 size={16} className="animate-spin" />}
              {t("profile.updatePassword")}
            </button>
          </form>
        </div>

        {/* side info card */}
        <div
          className="rounded-xl p-6 border h-fit"
          style={{ backgroundColor: COLORS.forest, borderColor: COLORS.forest }}
        >
          <h3 className="font-display text-base text-white mb-4">{t("profile.accountOverview")}</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span style={{ color: "#c9d9c2" }}>{t("profile.role")}</span>
              <span className="text-white font-medium">{roleLabel}</span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: "#c9d9c2" }}>{t("profile.accountStatus")}</span>
              <span className="text-white font-medium">
                {profile?.active_status ? t("profile.active") : "Inactive"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: "#c9d9c2" }}>{t("profile.memberSince")}</span>
              <span className="text-white font-medium">{memberSince}</span>
            </div>
            {/* credit_limit is a real field on Party, previously not shown
                anywhere on this page — added here, read-only. It's
                admin-managed (PartyAdminUpdate), not something the party
                can edit about themselves, hence no input for it. */}
            <div className="flex items-center justify-between">
              <span style={{ color: "#c9d9c2" }}>Credit limit</span>
              <span className="text-white font-medium">
                Rs {Number(profile?.credit_limit || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
