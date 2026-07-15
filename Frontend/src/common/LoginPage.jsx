import { useState } from "react";
import { Leaf, Mail, Lock, Eye, EyeOff, ArrowRight, Wheat } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ROLES = [
  { key: "supplier", label: "Supplier" },
  { key: "agent", label: "Commission Agent" },
  { key: "buyer", label: "Buyer" },
];

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
  const [role, setRole] = useState("supplier");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Login attempt:", { role, email, password });

    // Temporary navigation
    navigate("/buyer/marketplace");
  };

  return (
    <div className="min-h-screen w-full flex" style={{ backgroundColor: COLORS.cream }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Fraunces', serif; }
        .font-body { font-family: 'Inter', sans-serif; }
      `}</style>

      {/* LEFT — hero / brand panel */}
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

          <h1 className="font-display text-white text-3xl text-center leading-snug mb-3">
            From farm gate to market crate
          </h1>
          <p className="text-center max-w-sm" style={{ color: "#c9d9c2" }}>
            One connected ledger for suppliers, commission agents, and buyers —
            built for the way wholesale markets actually work.
          </p>
        </div>

        <div className="relative z-10 px-12 pb-12 flex items-center gap-10">
          <div>
            <p className="font-display text-2xl text-white">1,200+</p>
            <p className="text-xs" style={{ color: "#a9c19f" }}>Consignments tracked</p>
          </div>
          <div className="w-px h-8" style={{ backgroundColor: "#3a5c3a" }} />
          <div>
            <p className="font-display text-2xl text-white">98%</p>
            <p className="text-xs" style={{ color: "#a9c19f" }}>Payment traceability</p>
          </div>
        </div>
      </div>

      {/* RIGHT — form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 sm:px-12 py-12 font-body">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-10 justify-center">
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

          <h2 className="font-display text-3xl mb-1" style={{ color: COLORS.ink }}>
            Welcome back
          </h2>
          <p className="text-sm mb-8" style={{ color: "#6b7568" }}>
            Sign in to manage your market operations.
          </p>

          {/* role selector */}
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
                {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "#4a5240" }}>
                Email address
              </label>
              <div className="relative">
                <Mail
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  color="#909685"
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@marketname.com"
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border text-sm outline-none transition-colors focus:ring-2"
                  style={{ borderColor: "#d9ddce", backgroundColor: "white" }}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "#4a5240" }}>
                Password
              </label>
              <div className="relative">
                <Lock
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  color="#909685"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border text-sm outline-none transition-colors"
                  style={{ borderColor: "#d9ddce", backgroundColor: "white" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
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
                Remember me
              </label>
              <a href="#" className="text-xs font-medium" style={{ color: COLORS.leaf }}>
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium text-sm mt-2 transition-transform active:scale-[0.99]"
              style={{ backgroundColor: COLORS.gold, color: COLORS.forestDark }}
            >
              Sign in as {ROLES.find((r) => r.key === role)?.label}
              <ArrowRight size={16} />
            </button>
          </form>

          <p className="text-center text-sm mt-8" style={{ color: "#6b7568" }}>
            New to AISAMMS?{" "}
            <a href="#" className="font-medium" style={{ color: COLORS.forest }}>
              Contact your market administrator
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}