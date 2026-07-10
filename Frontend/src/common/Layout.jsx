import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  Leaf,
  LayoutDashboard,
  Sprout,
  ShoppingCart,
  Store,
  ClipboardList,
  User,
  LogOut,
  Bell,
  Menu,
  X,
} from "lucide-react";

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

const NAV_CONFIG = {
  supplier: {
    name: "Ahmed Farms",
    subtitle: "Supplier",
    links: [
      { to: "/supplier/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/supplier/supplies", label: "My supplies", icon: Sprout },
      { to: "/supplier/profile", label: "Profile", icon: User },
    ],
  },
  agent: {
    name: "Rafiq Traders",
    subtitle: "Commission Agent",
    links: [
      { to: "/agent/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/agent/orders", label: "Orders", icon: ClipboardList },
      { to: "/agent/profile", label: "Profile", icon: User },
    ],
  },
  buyer: {
    name: "Green Valley Store",
    subtitle: "Buyer",
    links: [
      { to: "/buyer/marketplace", label: "Marketplace", icon: Store },
      { to: "/buyer/orders", label: "My orders", icon: ShoppingCart },
      { to: "/buyer/profile", label: "Profile", icon: User },
    ],
  },
};

export default function Layout({ role }) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const config = NAV_CONFIG[role] || NAV_CONFIG.supplier;

  const handleLogout = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex font-body" style={{ backgroundColor: COLORS.cream }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Fraunces', serif; }
        .font-body { font-family: 'Inter', sans-serif; }
      `}</style>

      {/* backdrop — dims content behind the overlapping sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40"
          style={{ backgroundColor: "rgba(23,35,26,0.45)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* sidebar — fixed overlay, slides over content, does not resize the main column */}
      <aside
        className={`w-64 shrink-0 flex flex-col justify-between py-6 fixed inset-y-0 left-0 z-50 transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ backgroundColor: COLORS.forest }}
      >
        <div>
          <div className="flex items-center justify-between px-6 mb-10">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: COLORS.gold }}
              >
                <Leaf size={16} color={COLORS.forestDark} />
              </div>
              <span className="font-display text-white text-lg">AISAMMS</span>
            </div>
            <button onClick={() => setSidebarOpen(false)}>
              <X size={20} color="#c9d9c2" />
            </button>
          </div>

          <nav className="flex flex-col gap-1 px-3">
            {config.links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
                style={({ isActive }) =>
                  isActive
                    ? { backgroundColor: COLORS.gold, color: COLORS.forestDark, fontWeight: 500 }
                    : { color: "#c9d9c2" }
                }
              >
                <link.icon size={17} />
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="px-3">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full"
            style={{ color: "#c9d9c2" }}
          >
            <LogOut size={17} />
            Log out
          </button>
        </div>
      </aside>

      {/* main column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* topbar */}
        <header
          className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style={{ backgroundColor: "white", borderColor: COLORS.greige }}
        >
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen((v) => !v)}>
              <Menu size={22} color={COLORS.forest} />
            </button>
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
            <button className="relative">
              <Bell size={19} color={COLORS.sub} />
              <span
                className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                style={{ backgroundColor: COLORS.gold }}
              />
            </button>
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
                style={{ backgroundColor: COLORS.greige, color: COLORS.forest }}
              >
                {config.name
                  .split(" ")
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div className="hidden sm:block leading-tight">
                <p className="text-sm font-medium" style={{ color: COLORS.ink }}>
                  {config.name}
                </p>
                <p className="text-xs" style={{ color: COLORS.sub }}>
                  {config.subtitle}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* page content */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}