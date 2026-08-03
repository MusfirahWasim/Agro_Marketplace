import { useEffect, useState } from "react";
import { Camera, Save, Lock, Loader2, AlertCircle, Check } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { getMyProfile, updateMyProfile, changeMyPassword } from "../handlers/party";

/**
 * ProfileSettings.jsx
 *
 * Previously 100% hardcoded per role (ROLE_DEFAULTS) and both submit
 * handlers just console.log'd — that's why Save/Update Password did
 * nothing and why the agent view always showed "Rafiq Traders" regardless
 * of who was actually logged in.
 *
 * Confirmed real `parties` table shape from an earlier backend log:
 * party_id, party_type, name, phone, cnic, email, password_hash,
 * active_status, credit_limit, billing_address, shipping_address,
 * is_registered, created_at.
 *
 * That confirms: no commission_rate column exists anywhere on parties, no
 * separate "business name" column beyond `name` itself, and no payment
 * preference column — so all three of the old per-role "extra" fields
 * (agent's commission rate, supplier's separate business name, buyer's
 * preferred payment method) are removed entirely; none had schema backing.
 * billing_address / shipping_address are real separate columns, so the
 * single "Address" field is split accordingly (same fix as BuyerCheckout).
 * "Member since" now uses the real created_at instead of a hardcoded date;
 * "Account status" uses the real active_status instead of a hardcoded
 * "Active". No avatar-upload endpoint exists anywhere in the handler
 * layer, so the camera button is disabled rather than silently doing
 * nothing.
 */

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
  errorBg: "#faeaea",
  errorText: "#b5544a",
};

const ROLE_LABEL_KEY = {
  S: "common.roles.supplier",
  CA: "common.roles.agent",
  B: "common.roles.buyer",
  A: "common.roles.admin",
};

function formatMemberSince(dateStr) {
  if (!dateStr) return "—";
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  const d = new Date(isDateOnly ? `${dateStr}T00:00:00` : dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-PK", { month: "short", year: "numeric" });
}

export default function ProfileSettings() {
  const { t } = useLanguage();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [form, setForm] = useState({ name: "", email: "", phone: "", billingAddress: "", shippingAddress: "" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  async function fetchProfile() {
    setLoading(true);
    setLoadError(null);
    const { data, error } = await getMyProfile();
    if (error) {
      setLoadError(error);
      setLoading(false);
      return;
    }
    setProfile(data);
    setForm({
      name: data.name ?? "",
      email: data.email ?? "",
      phone: data.phone ?? "",
      billingAddress: data.billing_address ?? "",
      shippingAddress: data.shipping_address ?? "",
    });
    setLoading(false);
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);
    setSaving(true);
    const { data, error } = await updateMyProfile({
      name: form.name,
      email: form.email,
      phone: form.phone,
      billing_address: form.billingAddress,
      shipping_address: form.shippingAddress,
    });
    setSaving(false);
    if (error) {
      setSaveError(error);
      return;
    }
    setProfile((p) => ({ ...p, ...(data ?? {}) }));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  }

  async function handlePasswordSave(e) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);
    if (passwords.next !== passwords.confirm) {
      setPasswordError(t("profile.passwordMismatch"));
      return;
    }
    setPasswordSaving(true);
    const { error } = await changeMyPassword({
      current_password: passwords.current,
      new_password: passwords.next,
    });
    setPasswordSaving(false);
    if (error) {
      setPasswordError(error);
      return;
    }
    setPasswords({ current: "", next: "", confirm: "" });
    setPasswordSuccess(true);
    setTimeout(() => setPasswordSuccess(false), 2500);
  }

  const initials = (form.name || "?")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const roleLabelKey = profile ? ROLE_LABEL_KEY[profile.party_type] ?? "common.roles.supplier" : null;

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

      {loadError && (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: COLORS.errorBg, color: COLORS.errorText }}>
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            {t("profile.loadError")}: {loadError}
          </div>
          <button onClick={fetchProfile} className="rounded-lg border px-3 py-1 text-xs font-medium" style={{ borderColor: COLORS.errorText }}>
            {t("profile.retry")}
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border bg-white py-16 text-sm" style={{ borderColor: COLORS.greige, color: COLORS.sub }}>
          <Loader2 size={18} className="animate-spin" />
          {t("profile.loading")}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* main form */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <form onSubmit={handleSave} className="rounded-xl border p-6" style={{ backgroundColor: "white", borderColor: COLORS.greige }}>
              {/* avatar */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b" style={{ borderColor: COLORS.greige }}>
                <div className="relative w-16 h-16 rounded-full flex items-center justify-center text-lg font-medium shrink-0" style={{ backgroundColor: COLORS.greige, color: COLORS.forest }}>
                  {initials}
                  <button
                    type="button"
                    disabled
                    title={t("profile.photoNotSupported")}
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white cursor-not-allowed opacity-70"
                    style={{ backgroundColor: COLORS.gold }}
                  >
                    <Camera size={12} color={COLORS.forestDark} />
                  </button>
                </div>
                <div>
                  <p className="font-display text-lg" style={{ color: COLORS.ink }}>{form.name}</p>
                  <p className="text-xs" style={{ color: COLORS.sub }}>{roleLabelKey ? t(roleLabelKey) : ""}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: "#4a5240" }}>{t("profile.fullNameLabel")}</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                    style={{ borderColor: COLORS.border }}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: "#4a5240" }}>{t("profile.emailLabel")}</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                    style={{ borderColor: COLORS.border }}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: "#4a5240" }}>{t("profile.phoneLabel")}</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                    style={{ borderColor: COLORS.border }}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: "#4a5240" }}>{t("profile.billingAddressLabel")}</label>
                  <input
                    value={form.billingAddress}
                    onChange={(e) => setForm({ ...form, billingAddress: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                    style={{ borderColor: COLORS.border }}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: "#4a5240" }}>{t("profile.shippingAddressLabel")}</label>
                  <input
                    value={form.shippingAddress}
                    onChange={(e) => setForm({ ...form, shippingAddress: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                    style={{ borderColor: COLORS.border }}
                  />
                </div>
              </div>

              {saveError && (
                <div className="mt-4 rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: COLORS.errorBg, color: COLORS.errorText }}>
                  {t("profile.saveError")}: {saveError}
                </div>
              )}

              <div className="flex items-center gap-3 mt-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-70"
                  style={{ backgroundColor: COLORS.gold, color: COLORS.forestDark }}
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? t("profile.saving") : t("profile.saveChanges")}
                </button>
                {saveSuccess && (
                  <span className="flex items-center gap-1 text-xs font-medium" style={{ color: COLORS.leaf }}>
                    <Check size={14} /> {t("profile.saveSuccess")}
                  </span>
                )}
              </div>
            </form>

            {/* password */}
            <form onSubmit={handlePasswordSave} className="rounded-xl border p-6" style={{ backgroundColor: "white", borderColor: COLORS.greige }}>
              <div className="flex items-center gap-2 mb-5">
                <Lock size={16} color={COLORS.forest} />
                <h2 className="font-display text-lg" style={{ color: COLORS.ink }}>{t("profile.changePassword")}</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: "#4a5240" }}>{t("profile.currentPassword")}</label>
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
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: "#4a5240" }}>{t("profile.newPassword")}</label>
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
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: "#4a5240" }}>{t("profile.confirmNewPassword")}</label>
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
                <div className="mt-4 rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: COLORS.errorBg, color: COLORS.errorText }}>
                  {passwordError}
                </div>
              )}

              <div className="flex items-center gap-3 mt-6">
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-70"
                  style={{ backgroundColor: COLORS.forest, color: "white" }}
                >
                  {passwordSaving ? t("profile.updatingPassword") : t("profile.updatePassword")}
                </button>
                {passwordSuccess && (
                  <span className="flex items-center gap-1 text-xs font-medium" style={{ color: COLORS.leaf }}>
                    <Check size={14} /> {t("profile.passwordSuccess")}
                  </span>
                )}
              </div>
            </form>
          </div>

          {/* side info card */}
          <div className="rounded-xl p-6 border h-fit" style={{ backgroundColor: COLORS.forest, borderColor: COLORS.forest }}>
            <h3 className="font-display text-base text-white mb-4">{t("profile.accountOverview")}</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span style={{ color: "#c9d9c2" }}>{t("profile.role")}</span>
                <span className="text-white font-medium">{roleLabelKey ? t(roleLabelKey) : "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: "#c9d9c2" }}>{t("profile.accountStatus")}</span>
                <span className="text-white font-medium">{profile?.active_status ? t("profile.active") : t("profile.inactive")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: "#c9d9c2" }}>{t("profile.memberSince")}</span>
                <span className="text-white font-medium">{formatMemberSince(profile?.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}