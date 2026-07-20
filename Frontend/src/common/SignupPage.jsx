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
} from "lucide-react";

/**
 * SignupPage
 * Matches the Modern Organic & Eco-Friendly theme established on LoginPage:
 * - Left: deep forest-green panel, circular framed hero image, leaf badge, stats
 * - Right: off-white panel with role tabs + form
 *
 * Roles: Supplier / Commission Agent / Buyer
 * (Admins are provisioned separately — see "Contact your market administrator" on Login)
 */

const ROLES = [
  { key: "supplier", label: "Supplier" },
  { key: "agent", label: "Commission Agent" },
  { key: "buyer", label: "Buyer" },
];

const ROLE_ORG_FIELD = {
  supplier: { name: "orgName", label: "Farm / Business name", placeholder: "e.g. Rehman Farms" },
  agent: { name: "orgName", label: "Agency name", placeholder: "e.g. Al-Barakah Commission House" },
  buyer: null,
};

export default function SignupPage() {
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
      setError("Please fill in all required fields.");
      return;
    }
    if (orgField && !form.orgName) {
      setError(`Please enter your ${orgField.label.toLowerCase()}.`);
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!agreed) {
      setError("Please accept the Terms of Service to continue.");
      return;
    }

    setSubmitting(true);
    try {
      // TODO: wire up to real signup endpoint, e.g.:
      // await api.post("/auth/signup", { role, ...form });
      await new Promise((res) => setTimeout(res, 700));
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-[#faf9f5]">
      {/* LEFT — brand / imagery panel */}
      <div className="hidden lg:flex lg:w-[46%] relative bg-[#1e4620] text-white flex-col justify-between px-14 py-12 overflow-hidden">
        {/* subtle organic texture */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, white 0, transparent 40%), radial-gradient(circle at 80% 60%, white 0, transparent 35%)",
          }}
        />

        <div className="relative flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-[#f0b84c] flex items-center justify-center text-[#1e4620] font-bold text-lg">
            A
          </div>
          <span className="font-serif text-2xl tracking-wide">AISAMMS</span>
        </div>

        <div className="relative flex flex-col items-center">
          <div className="relative w-[280px] h-[280px] rounded-full border-4 border-[#f0b84c] overflow-hidden bg-white shadow-xl">
            <img
              src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=800&auto=format&fit=crop"
              alt="Terraced farmland at golden hour"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-2 right-8 h-16 w-16 rounded-full bg-[#3f8f43] border-4 border-[#1e4620] flex flex-col items-center justify-center text-[11px] font-semibold leading-tight text-center shadow-lg">
            <span aria-hidden>🌾</span>
            <span>New Grower</span>
          </div>
        </div>

        <div className="relative">
          <h1 className="font-serif text-4xl leading-tight mb-4">
            Join the harvest,
            <br /> row by row.
          </h1>
          <p className="text-white/80 text-base leading-relaxed max-w-md mb-8">
            Create your account to track supplies, consignments, and payments
            in one connected ledger — built for the way wholesale markets
            actually work.
          </p>
          <div className="flex items-center gap-10">
            <div>
              <div className="text-3xl font-bold">1,200+</div>
              <div className="text-white/70 text-sm">Consignments tracked</div>
            </div>
            <div className="h-10 w-px bg-white/25" />
            <div>
              <div className="text-3xl font-bold">98%</div>
              <div className="text-white/70 text-sm">Payment traceability</div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT — signup form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="font-serif text-4xl text-[#1e4620] mb-2">
              Create your account
            </h2>
            <p className="text-gray-500">
              Set up access to manage your market operations.
            </p>
          </div>

          {/* Role tabs */}
          <div className="grid grid-cols-3 gap-1 bg-gray-100 rounded-xl p-1 mb-6">
            {ROLES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setRole(r.key)}
                className={`rounded-lg py-2.5 text-sm font-medium transition-colors ${
                  role === r.key
                    ? "bg-[#1e4620] text-white shadow-sm"
                    : "text-gray-600 hover:text-[#1e4620]"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Full name */}
            <Field label="Full name" required>
              <IconInput
                icon={<User className="h-4 w-4" />}
                type="text"
                placeholder="Your full name"
                value={form.fullName}
                onChange={(v) => updateField("fullName", v)}
                autoComplete="name"
              />
            </Field>

            {/* Org / farm / agency name — only for supplier & agent */}
            {orgField && (
              <Field label={orgField.label} required>
                <IconInput
                  icon={<Building2 className="h-4 w-4" />}
                  type="text"
                  placeholder={orgField.placeholder}
                  value={form.orgName}
                  onChange={(v) => updateField("orgName", v)}
                  autoComplete="organization"
                />
              </Field>
            )}

            {/* Email */}
            <Field label="Email address" required>
              <IconInput
                icon={<Mail className="h-4 w-4" />}
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(v) => updateField("email", v)}
                autoComplete="email"
              />
            </Field>

            {/* Phone */}
            <Field label="Phone number" required>
              <IconInput
                icon={<Phone className="h-4 w-4" />}
                type="tel"
                placeholder="03XX XXXXXXX"
                value={form.phone}
                onChange={(v) => updateField("phone", v)}
                autoComplete="tel"
              />
            </Field>

            {/* Password */}
            <Field label="Password" required>
              <IconInput
                icon={<Lock className="h-4 w-4" />}
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                value={form.password}
                onChange={(v) => updateField("password", v)}
                autoComplete="new-password"
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                }
              />
            </Field>

            {/* Confirm password */}
            <Field label="Confirm password" required>
              <IconInput
                icon={<Lock className="h-4 w-4" />}
                type={showConfirm ? "text" : "password"}
                placeholder="Re-enter your password"
                value={form.confirmPassword}
                onChange={(v) => updateField("confirmPassword", v)}
                autoComplete="new-password"
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowConfirm((s) => !s)}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                }
              />
            </Field>

            {/* Terms */}
            <label className="flex items-start gap-2.5 text-sm text-gray-600 cursor-pointer">
              <span
                onClick={() => setAgreed((a) => !a)}
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                  agreed
                    ? "bg-[#1e4620] border-[#1e4620]"
                    : "border-gray-300 bg-white"
                }`}
              >
                {agreed && <Check className="h-3 w-3 text-white" />}
              </span>
              <span>
                I agree to the{" "}
                <span className="text-[#1e4620] font-medium">Terms of Service</span>{" "}
                and{" "}
                <span className="text-[#1e4620] font-medium">Privacy Policy</span>.
              </span>
            </label>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#f0b84c] hover:bg-[#e8ab30] disabled:opacity-60 disabled:cursor-not-allowed text-[#1e4620] font-semibold rounded-xl py-3.5 flex items-center justify-center gap-2 transition-colors"
            >
              {submitting ? "Creating account…" : `Sign up as ${ROLES.find((r) => r.key === role).label}`}
              {!submitting && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-[#1e4620] font-semibold hover:underline">
              Log in
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
      <label className="block text-sm text-gray-700 mb-1.5">
        {label} {required && <span className="text-[#f0b84c]">*</span>}
      </label>
      {children}
    </div>
  );
}

function IconInput({ icon, trailing, value, onChange, ...props }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3.5 py-3 focus-within:border-[#1e4620] focus-within:ring-2 focus-within:ring-[#1e4620]/10 transition-shadow">
      <span className="text-gray-400">{icon}</span>
      <input
        {...props}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 outline-none text-sm text-gray-800 placeholder:text-gray-400 bg-transparent"
      />
      {trailing}
    </div>
  );
}