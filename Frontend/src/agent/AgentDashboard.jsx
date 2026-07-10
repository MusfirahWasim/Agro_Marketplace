import {
  Boxes,
  ShoppingCart,
  Percent,
  HandCoins,
  ArrowUpRight,
  AlertTriangle,
} from "lucide-react";

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
};

const STATS = [
  { label: "Consigned inventory", value: "6,180 kg", icon: Boxes, tint: COLORS.leaf },
  { label: "Orders fulfilled (month)", value: "84", icon: ShoppingCart, tint: COLORS.forest },
  { label: "Commission earned", value: "Rs 96,200", icon: Percent, tint: COLORS.gold },
  { label: "Owed to suppliers", value: "Rs 341,000", icon: HandCoins, tint: "#a35c2b" },
];

const ORDERS = [
  { id: "ORD-2211", consignId: "CN-1042", buyer: "Green Valley Store", product: "Tomato (Grade A)", amount: "Rs 25,500", status: "Paid" },
  { id: "ORD-2210", consignId: "CN-1041", buyer: "Sana Wholesale", product: "Onion", amount: "Rs 41,000", status: "Credit" },
  { id: "ORD-2208", consignId: "CN-1039", buyer: "Karachi Mart", product: "Potato", amount: "Rs 18,900", status: "Paid" },
  { id: "ORD-2205", consignId: "CN-1036", buyer: "Bilal Supplies", product: "Tomato (Grade B)", amount: "Rs 12,300", status: "Refunded" },
];

const STATUS_STYLE = {
  Paid: { bg: "#eaf1e4", text: COLORS.leaf },
  Credit: { bg: "#fdf1dc", text: "#a3721b" },
  Refunded: { bg: "#faeaea", text: "#b5544a" },
};

const SUPPLIERS_OWED = [
  { name: "Ahmed Farms", amount: "Rs 142,000" },
  { name: "Green Basket Growers", amount: "Rs 99,500" },
  { name: "Noor Agro", amount: "Rs 99,500" },
];

export default function AgentDashboard() {
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
          Welcome back, Rafiq Traders
        </h1>
        <p className="text-sm mt-1" style={{ color: COLORS.sub }}>
          Here's an overview of your consigned inventory and settlements.
        </p>
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
        {/* recent orders */}
        <div
          className="lg:col-span-2 rounded-xl border overflow-hidden"
          style={{ backgroundColor: "white", borderColor: COLORS.greige }}
        >
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: COLORS.greige }}
          >
            <h2 className="font-display text-lg" style={{ color: COLORS.ink }}>
              Recent orders
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
                <th className="text-left font-medium px-5 py-3">Order</th>
                <th className="text-left font-medium px-5 py-3">Consignment</th>
                <th className="text-left font-medium px-5 py-3">Buyer</th>
                <th className="text-left font-medium px-5 py-3">Amount</th>
                <th className="text-left font-medium px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {ORDERS.map((o) => (
                <tr key={o.id} className="border-t" style={{ borderColor: COLORS.greige }}>
                  <td className="px-5 py-3 font-medium" style={{ color: COLORS.ink }}>
                    {o.id}
                  </td>
                  <td className="px-5 py-3" style={{ color: COLORS.sub }}>
                    {o.consignId}
                  </td>
                  <td className="px-5 py-3" style={{ color: COLORS.ink }}>
                    {o.buyer}
                  </td>
                  <td className="px-5 py-3" style={{ color: COLORS.ink }}>
                    {o.amount}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{
                        backgroundColor: STATUS_STYLE[o.status].bg,
                        color: STATUS_STYLE[o.status].text,
                      }}
                    >
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* side panel */}
        <div className="flex flex-col gap-6">
          <div
            className="rounded-xl p-5 border"
            style={{ backgroundColor: COLORS.forest, borderColor: COLORS.forest }}
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={16} color={COLORS.gold} />
              <h3 className="font-display text-base text-white">Owed to suppliers</h3>
            </div>
            <ul className="space-y-2.5 text-sm">
              {SUPPLIERS_OWED.map((s) => (
                <li key={s.name} className="flex items-center justify-between">
                  <span style={{ color: "#c9d9c2" }}>{s.name}</span>
                  <span className="text-white font-medium">{s.amount}</span>
                </li>
              ))}
            </ul>
            <button
              className="w-full mt-4 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: COLORS.gold, color: COLORS.forestDark }}
            >
              Settle now
            </button>
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
                <span style={{ color: COLORS.sub }}>Consignments received</span>
                <span className="font-medium" style={{ color: COLORS.ink }}>28</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: COLORS.sub }}>Quantity sold</span>
                <span className="font-medium" style={{ color: COLORS.ink }}>5,240 kg</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: COLORS.sub }}>Commission rate avg.</span>
                <span className="font-medium" style={{ color: COLORS.leaf }}>6.5%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}