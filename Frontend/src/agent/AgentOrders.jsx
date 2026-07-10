import { useState } from "react";
import { Search, ShoppingCart, Percent, Wallet, Clock } from "lucide-react";

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

const ORDERS = [
  { id: "ORD-2211", consignId: "CN-1042", buyer: "Green Valley Store", product: "Tomato (Grade A)", qty: "300 kg", amount: 25500, commission: 1657, payment: "Cash", status: "Paid" },
  { id: "ORD-2210", consignId: "CN-1041", buyer: "Sana Wholesale", product: "Onion", qty: "680 kg", amount: 41000, commission: 2665, payment: "Credit", status: "Credit" },
  { id: "ORD-2208", consignId: "CN-1039", buyer: "Karachi Mart", product: "Potato", qty: "420 kg", amount: 18900, commission: 1228, payment: "Cash", status: "Paid" },
  { id: "ORD-2205", consignId: "CN-1036", buyer: "Bilal Supplies", product: "Tomato (Grade B)", qty: "150 kg", amount: 12300, commission: 799, payment: "Cash", status: "Refunded" },
  { id: "ORD-2201", consignId: "CN-1042", buyer: "Fresh Mart", product: "Tomato (Grade A)", qty: "220 kg", amount: 18700, commission: 1215, payment: "Credit", status: "Credit" },
  { id: "ORD-2198", consignId: "CN-1039", buyer: "Karachi Mart", product: "Potato", qty: "310 kg", amount: 13950, commission: 907, payment: "Cash", status: "Paid" },
];

const STATUS_STYLE = {
  Paid: { bg: "#eaf1e4", text: COLORS.leaf },
  Credit: { bg: "#fdf1dc", text: "#a3721b" },
  Refunded: { bg: "#faeaea", text: "#b5544a" },
};

const FILTERS = ["All", "Paid", "Credit", "Refunded"];

export default function AgentOrders() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const filtered = ORDERS.filter((o) => {
    const matchesSearch =
      o.buyer.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.consignId.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "All" || o.status === filter;
    return matchesSearch && matchesFilter;
  });

  const totalSales = ORDERS.reduce((sum, o) => sum + o.amount, 0);
  const totalCommission = ORDERS.reduce((sum, o) => sum + o.commission, 0);
  const pendingCount = ORDERS.filter((o) => o.status === "Credit").length;

  const STATS = [
    { label: "Total orders", value: ORDERS.length, icon: ShoppingCart, tint: COLORS.forest },
    { label: "Total sales", value: `Rs ${totalSales.toLocaleString()}`, icon: Wallet, tint: COLORS.leaf },
    { label: "Commission earned", value: `Rs ${totalCommission.toLocaleString()}`, icon: Percent, tint: COLORS.gold },
    { label: "Pending (credit)", value: pendingCount, icon: Clock, tint: "#a35c2b" },
  ];

  return (
    <div className="font-body" style={{ backgroundColor: COLORS.cream }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Fraunces', serif; }
        .font-body { font-family: 'Inter', sans-serif; }
      `}</style>

      {/* header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl" style={{ color: COLORS.ink }}>
          Orders
        </h1>
        <p className="text-sm mt-1" style={{ color: COLORS.sub }}>
          Every order placed against your consigned inventory.
        </p>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

      {/* search + filter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" color="#909685" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order, consignment, or buyer..."
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm outline-none"
            style={{ borderColor: COLORS.border, backgroundColor: "white" }}
          />
        </div>
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="text-xs font-medium px-3 py-2 rounded-lg border"
              style={
                filter === f
                  ? { backgroundColor: COLORS.forest, color: "white", borderColor: COLORS.forest }
                  : { color: COLORS.sub, borderColor: COLORS.border }
              }
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* orders table */}
      <div
        className="rounded-xl border overflow-x-auto"
        style={{ backgroundColor: "white", borderColor: COLORS.greige }}
      >
        <table className="w-full text-sm min-w-[820px]">
          <thead>
            <tr style={{ color: COLORS.sub }}>
              <th className="text-left font-medium px-5 py-3">Order</th>
              <th className="text-left font-medium px-5 py-3">Consignment</th>
              <th className="text-left font-medium px-5 py-3">Buyer</th>
              <th className="text-left font-medium px-5 py-3">Product</th>
              <th className="text-left font-medium px-5 py-3">Qty</th>
              <th className="text-left font-medium px-5 py-3">Amount</th>
              <th className="text-left font-medium px-5 py-3">Commission</th>
              <th className="text-left font-medium px-5 py-3">Payment</th>
              <th className="text-left font-medium px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
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
                <td className="px-5 py-3" style={{ color: COLORS.sub }}>
                  {o.product}
                </td>
                <td className="px-5 py-3" style={{ color: COLORS.sub }}>
                  {o.qty}
                </td>
                <td className="px-5 py-3" style={{ color: COLORS.ink }}>
                  Rs {o.amount.toLocaleString()}
                </td>
                <td className="px-5 py-3 font-medium" style={{ color: COLORS.leaf }}>
                  Rs {o.commission.toLocaleString()}
                </td>
                <td className="px-5 py-3" style={{ color: COLORS.sub }}>
                  {o.payment}
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

            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-5 py-10 text-center" style={{ color: COLORS.sub }}>
                  No orders match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}