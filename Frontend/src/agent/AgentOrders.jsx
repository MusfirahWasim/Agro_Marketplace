import { useState } from "react";
import { Search, ShoppingCart, Percent, Wallet, Clock } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import LanguageSelector from "../i18n/LanguageSelector";
import { localizeTrader, localizeProduct, formatAgentCurrency } from "./agentLocale";

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
  { id: "ORD-2211", consignId: "CN-1042", buyer: "Green Valley Store", product: "Tomato (Grade A)", qty: 300, amount: 25500, commission: 1657, payment: "cash", status: "paid" },
  { id: "ORD-2210", consignId: "CN-1041", buyer: "Sana Wholesale", product: "Onion", qty: 680, amount: 41000, commission: 2665, payment: "credit", status: "credit" },
  { id: "ORD-2208", consignId: "CN-1039", buyer: "Karachi Mart", product: "Potato", qty: 420, amount: 18900, commission: 1228, payment: "cash", status: "paid" },
  { id: "ORD-2205", consignId: "CN-1036", buyer: "Bilal Supplies", product: "Tomato (Grade B)", qty: 150, amount: 12300, commission: 799, payment: "cash", status: "refunded" },
  { id: "ORD-2201", consignId: "CN-1042", buyer: "Fresh Mart", product: "Tomato (Grade A)", qty: 220, amount: 18700, commission: 1215, payment: "credit", status: "credit" },
  { id: "ORD-2198", consignId: "CN-1039", buyer: "Karachi Mart", product: "Potato", qty: 310, amount: 13950, commission: 907, payment: "cash", status: "paid" },
];

const FILTERS = ["all", "paid", "credit", "refunded"];

export default function AgentOrders() {
  const { language, t } = useLanguage();
  const isUr = language === "ur";
  const trader = (name) => localizeTrader(name, language);
  const product = (name) => localizeProduct(name, language);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const STATUS_STYLE = {
    paid: { bg: "#eaf1e4", text: COLORS.leaf, label: t("agent.common.status.paid") },
    credit: { bg: "#fdf1dc", text: "#a3721b", label: t("agent.common.status.credit") },
    refunded: { bg: "#faeaea", text: "#b5544a", label: t("agent.common.status.refunded") },
  };

  const PAYMENT_LABEL = {
    cash: t("agent.common.payment.cash"),
    credit: t("agent.common.payment.credit"),
  };

  const FILTER_LABEL = {
    all: t("agent.orders.filters.all"),
    paid: t("agent.common.status.paid"),
    credit: t("agent.common.status.credit"),
    refunded: t("agent.common.status.refunded"),
  };

  const filtered = ORDERS.filter((o) => {
    const q = search.toLowerCase();
    const matchesSearch =
      o.buyer.toLowerCase().includes(q) ||
      trader(o.buyer).includes(search) ||
      o.id.toLowerCase().includes(q) ||
      o.consignId.toLowerCase().includes(q);
    const matchesFilter = filter === "all" || o.status === filter;
    return matchesSearch && matchesFilter;
  });

  const totalSales = ORDERS.reduce((sum, o) => sum + o.amount, 0);
  const totalCommission = ORDERS.reduce((sum, o) => sum + o.commission, 0);
  const pendingCount = ORDERS.filter((o) => o.status === "credit").length;

  const STATS = [
    { label: t("agent.orders.stats.totalOrders"), value: ORDERS.length, icon: ShoppingCart, tint: COLORS.forest },
    { label: t("agent.orders.stats.totalSales"), value: formatAgentCurrency(totalSales, t), icon: Wallet, tint: COLORS.leaf },
    { label: t("agent.orders.stats.commissionEarned"), value: formatAgentCurrency(totalCommission, t), icon: Percent, tint: COLORS.gold },
    { label: t("agent.orders.stats.pendingCredit"), value: pendingCount, icon: Clock, tint: "#a35c2b" },
  ];

  return (
    <div className="font-body" style={{ backgroundColor: COLORS.cream }} dir={isUr ? "rtl" : "ltr"}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&family=Noto+Nastaliq+Urdu:wght@500;700&display=swap');
        .font-display { font-family: ${isUr ? "'Noto Nastaliq Urdu', serif" : "'Fraunces', serif"}; }
        .font-body { font-family: ${isUr ? "'Noto Nastaliq Urdu', serif" : "'Inter', sans-serif"}; }
      `}</style>

      {/* header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl" style={{ color: COLORS.ink }}>
            {t("agent.orders.title")}
          </h1>
          <p className="text-sm mt-1" style={{ color: COLORS.sub }}>
            {t("agent.orders.subtitle")}
          </p>
        </div>
        <LanguageSelector />
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
            placeholder={t("agent.orders.searchPlaceholder")}
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
              {FILTER_LABEL[f]}
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
              <th className="text-left font-medium px-5 py-3">{t("agent.common.table.order")}</th>
              <th className="text-left font-medium px-5 py-3">{t("agent.common.table.consignment")}</th>
              <th className="text-left font-medium px-5 py-3">{t("agent.common.table.buyer")}</th>
              <th className="text-left font-medium px-5 py-3">{t("agent.common.table.product")}</th>
              <th className="text-left font-medium px-5 py-3">{t("agent.common.table.qty")}</th>
              <th className="text-left font-medium px-5 py-3">{t("agent.common.table.amount")}</th>
              <th className="text-left font-medium px-5 py-3">{t("agent.common.table.commission")}</th>
              <th className="text-left font-medium px-5 py-3">{t("agent.common.table.payment")}</th>
              <th className="text-left font-medium px-5 py-3">{t("agent.common.table.status")}</th>
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
                  {trader(o.buyer)}
                </td>
                <td className="px-5 py-3" style={{ color: COLORS.sub }}>
                  {product(o.product)}
                </td>
                <td className="px-5 py-3" style={{ color: COLORS.sub }}>
                  {o.qty.toLocaleString()} {isUr ? "کلوگرام" : "kg"}
                </td>
                <td className="px-5 py-3" style={{ color: COLORS.ink }}>
                  {formatAgentCurrency(o.amount, t)}
                </td>
                <td className="px-5 py-3 font-medium" style={{ color: COLORS.leaf }}>
                  {formatAgentCurrency(o.commission, t)}
                </td>
                <td className="px-5 py-3" style={{ color: COLORS.sub }}>
                  {PAYMENT_LABEL[o.payment]}
                </td>
                <td className="px-5 py-3">
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{
                      backgroundColor: STATUS_STYLE[o.status].bg,
                      color: STATUS_STYLE[o.status].text,
                    }}
                  >
                    {STATUS_STYLE[o.status].label}
                  </span>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-5 py-10 text-center" style={{ color: COLORS.sub }}>
                  {t("agent.orders.noResults")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
