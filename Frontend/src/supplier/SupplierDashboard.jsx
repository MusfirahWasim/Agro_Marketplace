import {
  Sprout,
  PackageCheck,
  Wallet,
  Clock,
  Plus,
  ArrowUpRight,
  AlertTriangle,
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

const STATS = [
  { label: "Stock available", value: "3,240 kg", icon: Sprout, tint: COLORS.leaf },
  { label: "Active consignments", value: "12", icon: PackageCheck, tint: COLORS.forest },
  { label: "Pending settlements", value: "Rs 84,500", icon: Wallet, tint: COLORS.gold },
  { label: "Awaiting pickup", value: "3 lots", icon: Clock, tint: "#a35c2b" },
];

const CONSIGNMENTS = [
  { id: "CN-1042", agent: "Rafiq Traders", product: "Tomato (Grade A)", qty: "600 kg", status: "In market" },
  { id: "CN-1041", agent: "Bilal & Co.", product: "Onion", qty: "1,200 kg", status: "Sold" },
  { id: "CN-1039", agent: "Rafiq Traders", product: "Potato", qty: "900 kg", status: "In market" },
  { id: "CN-1036", agent: "Karachi Fresh Agents", product: "Tomato (Grade B)", qty: "450 kg", status: "Settled" },
];

const STATUS_STYLE = {
  "In market": { bg: "#eaf1e4", text: COLORS.leaf },
  Sold: { bg: "#fdf1dc", text: "#a3721b" },
  Settled: { bg: "#e6ede6", text: COLORS.forest },
};

export default function SupplierDashboard() {
  return (
    <div className="font-body" style={{ backgroundColor: COLORS.cream }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Fraunces', serif; }
        .font-body { font-family: 'Inter', sans-serif; }
      `}</style>

      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl" style={{ color: COLORS.ink }}>
            Welcome back, Ahmed
          </h1>
          <p className="text-sm mt-1" style={{ color: COLORS.sub }}>
            Here's what's happening with your inventory today.
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium self-start"
          style={{ backgroundColor: COLORS.gold, color: COLORS.forestDark }}
        >
          <Plus size={16} />
          Add new supply
        </button>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-5 border"
            style={{ backgroundColor: "white", borderColor: COLORS.greige }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: `${s.tint}1a` }}
            >
              <s.icon size={18} color={s.tint} />
            </div>
            <p className="font-display text-2xl" style={{ color: COLORS.ink }}>
              {s.value}
            </p>
            <p className="text-xs mt-1" style={{ color: COLORS.sub }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* recent consignments */}
        <div
          className="lg:col-span-2 rounded-xl border overflow-hidden"
          style={{ backgroundColor: "white", borderColor: COLORS.greige }}
        >
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: COLORS.greige }}
          >
            <h2 className="font-display text-lg" style={{ color: COLORS.ink }}>
              Recent consignments
            </h2>
            <button
              className="flex items-center gap-1 text-xs font-medium"
              style={{ color: COLORS.leaf }}
            >
              View all <ArrowUpRight size={14} />
            </button>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: COLORS.sub }}>
                <th className="text-left font-medium px-5 py-3">Consignment</th>
                <th className="text-left font-medium px-5 py-3">Agent</th>
                <th className="text-left font-medium px-5 py-3">Product</th>
                <th className="text-left font-medium px-5 py-3">Qty</th>
                <th className="text-left font-medium px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {CONSIGNMENTS.map((c) => (
                <tr key={c.id} className="border-t" style={{ borderColor: COLORS.greige }}>
                  <td className="px-5 py-3 font-medium" style={{ color: COLORS.ink }}>
                    {c.id}
                  </td>
                  <td className="px-5 py-3" style={{ color: COLORS.sub }}>
                    {c.agent}
                  </td>
                  <td className="px-5 py-3" style={{ color: COLORS.ink }}>
                    {c.product}
                  </td>
                  <td className="px-5 py-3" style={{ color: COLORS.sub }}>
                    {c.qty}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{
                        backgroundColor: STATUS_STYLE[c.status].bg,
                        color: STATUS_STYLE[c.status].text,
                      }}
                    >
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* alerts / side panel */}
        <div className="flex flex-col gap-6">
          <div
            className="rounded-xl p-5 border"
            style={{ backgroundColor: COLORS.forest, borderColor: COLORS.forest }}
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={16} color={COLORS.gold} />
              <h3 className="font-display text-base text-white">Low stock alerts</h3>
            </div>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center justify-between">
                <span style={{ color: "#c9d9c2" }}>Tomato (Grade A)</span>
                <span className="text-white font-medium">40 kg left</span>
              </li>
              <li className="flex items-center justify-between">
                <span style={{ color: "#c9d9c2" }}>Green chili</span>
                <span className="text-white font-medium">15 kg left</span>
              </li>
              <li className="flex items-center justify-between">
                <span style={{ color: "#c9d9c2" }}>Spinach</span>
                <span className="text-white font-medium">22 kg left</span>
              </li>
            </ul>
          </div>

          <div
            className="rounded-xl p-5 border"
            style={{ backgroundColor: "white", borderColor: COLORS.greige }}
          >
            <h3 className="font-display text-base mb-4" style={{ color: COLORS.ink }}>
              This month
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span style={{ color: COLORS.sub }}>Total consigned</span>
                <span className="font-medium" style={{ color: COLORS.ink }}>4,850 kg</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: COLORS.sub }}>Total sold</span>
                <span className="font-medium" style={{ color: COLORS.ink }}>3,920 kg</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: COLORS.sub }}>Settlements received</span>
                <span className="font-medium" style={{ color: COLORS.leaf }}>Rs 612,000</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}