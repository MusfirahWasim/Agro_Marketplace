import { useState } from "react";
import { Camera, Save, Lock } from "lucide-react";

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

const ROLE_DEFAULTS = {
  supplier: {
    subtitle: "Supplier",
    name: "Ahmed Farms",
    email: "ahmed@ahmedfarms.pk",
    phone: "+92 300 1234567",
    address: "Plot 14, Super Highway, Karachi",
    extraLabel: "Farm / business name",
    extraValue: "Ahmed Farms",
  },
  agent: {
    subtitle: "Commission Agent",
    name: "Rafiq Traders",
    email: "rafiq@rafiqtraders.pk",
    phone: "+92 321 9988776",
    address: "Shop 22, Sabzi Mandi, Karachi",
    extraLabel: "Commission rate (%)",
    extraValue: "6.5",
  },
  buyer: {
    subtitle: "Buyer",
    name: "Green Valley Store",
    email: "orders@greenvalley.pk",
    phone: "+92 333 4455667",
    address: "Shop 8, DHA Phase 5, Karachi",
    extraLabel: "Preferred payment method",
    extraValue: "Credit",
  },
};

export default function ProfileSettings({ role }) {
  const defaults = ROLE_DEFAULTS[role] || ROLE_DEFAULTS.supplier;
  const [form, setForm] = useState({
    name: defaults.name,
    email: defaults.email,
    phone: defaults.phone,
    address: defaults.address,
    extraValue: defaults.extraValue,
  });
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });

  const handleSave = (e) => {
    e.preventDefault();
    console.log("Profile saved:", form);
  };

  const handlePasswordSave = (e) => {
    e.preventDefault();
    console.log("Password change requested:", passwords);
  };

  const initials = form.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");

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
          Profile settings
        </h1>
        <p className="text-sm mt-1" style={{ color: COLORS.sub }}>
          Manage your account information and security.
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
                  {defaults.subtitle}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-medium mb-1.5 block" style={{ color: "#4a5240" }}>
                  Full name / business name
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                  style={{ borderColor: COLORS.border }}
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: "#4a5240" }}>
                  Email address
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                  style={{ borderColor: COLORS.border }}
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: "#4a5240" }}>
                  Phone number
                </label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                  style={{ borderColor: COLORS.border }}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-medium mb-1.5 block" style={{ color: "#4a5240" }}>
                  Address
                </label>
                <input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                  style={{ borderColor: COLORS.border }}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-medium mb-1.5 block" style={{ color: "#4a5240" }}>
                  {defaults.extraLabel}
                </label>
                <input
                  value={form.extraValue}
                  onChange={(e) => setForm({ ...form, extraValue: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                  style={{ borderColor: COLORS.border }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium mt-6"
              style={{ backgroundColor: COLORS.gold, color: COLORS.forestDark }}
            >
              <Save size={16} />
              Save changes
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
                Change password
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: "#4a5240" }}>
                  Current password
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
                  New password
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
                  Confirm new password
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

            <button
              type="submit"
              className="px-4 py-2.5 rounded-lg text-sm font-medium mt-6"
              style={{ backgroundColor: COLORS.forest, color: "white" }}
            >
              Update password
            </button>
          </form>
        </div>

        {/* side info card */}
        <div
          className="rounded-xl p-6 border h-fit"
          style={{ backgroundColor: COLORS.forest, borderColor: COLORS.forest }}
        >
          <h3 className="font-display text-base text-white mb-4">Account overview</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span style={{ color: "#c9d9c2" }}>Role</span>
              <span className="text-white font-medium">{defaults.subtitle}</span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: "#c9d9c2" }}>Account status</span>
              <span className="text-white font-medium">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: "#c9d9c2" }}>Member since</span>
              <span className="text-white font-medium">Jan 2026</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}