import { useState } from "react";
import { Search, ShoppingCart, Wallet, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { localizeProduct, formatLocaleDate, localizeUnit } from "../i18n/dataLocale";

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

// Order records — product names, dates, and quantity units are localized at
// render time via dataLocale.js. status/payment stay as English keys so
// lookups (STATUS_STYLE, filtering) stay stable; only their *displayed*
// label is translated via STATUS_LABEL_KEY / PAYMENT_LABEL_KEY below.
const ORDERS = [
  { id: "ORD-3311", consignId: "CN-1042", product: "Tomato (Grade A)", qty: 150, unit: "kg", amount: 13500, payment: "Cash", status: "Paid", date: "2026-07-10" },
  { id: "ORD-3308", consignId: "CN-1041", product: "Onion", qty: 300, unit: "kg", amount: 18600, payment: "Credit", status: "Due", date: "2026-07-09" },
  { id: "ORD-3301", consignId: "CN-1039", product: "Potato", qty: 80, unit: "kg", amount: 3840, payment: "Cash", status: "Paid", date: "2026-07-07" },
  { id: "ORD-3295", consignId: "CN-1033", product: "Spinach", qty: 40, unit: "kg", amount: 2320, payment: "Credit", status: "Due", date: "2026-07-05" },
  { id: "ORD-3288", consignId: "CN-1024", product: "Mango (Sindhri)", qty: 60, unit: "kg", amount: 13200, payment: "Cash", status: "Refunded", date: "2026-07-02" },
  { id: "ORD-3280", consignId: "CN-1027", product: "Banana", qty: 100, unit: "kg", amount: 11000, payment: "Cash", status: "Paid", date: "2026-06-29" },
];

const STATUS_STYLE = {
  Paid: { bg: "#eaf1e4", text: COLORS.leaf },
  Due: { bg: "#fdf1dc", text: "#a3721b" },
  Refunded: { bg: "#faeaea", text: "#b5544a" },
};

const STATUS_LABEL_KEY = {
  Paid: "buyer.orders.filters.paid",
  Due: "buyer.orders.filters.due",
  Refunded: "buyer.orders.filters.refunded",
};

const PAYMENT_LABEL_KEY = {
  Cash: "buyer.common.cash",
  Credit: "buyer.common.credit",
};

// filter buttons keep an English `value` (matches o.status) alongside a labelKey
const FILTERS = [
  { value: "All", labelKey: "buyer.orders.filters.all" },
  { value: "Paid", labelKey: "buyer.orders.filters.paid" },
  { value: "Due", labelKey: "buyer.orders.filters.due" },
  { value: "Refunded", labelKey: "buyer.orders.filters.refunded" },
];

export default function BuyerOrders() {
  const { language, t } = useLanguage();
  const isUr = language === "ur";
  const product = (name) => localizeProduct(name, language);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const currency = t("buyer.common.currency");

  const filtered = ORDERS.filter((o) => {
    const q = search.toLowerCase();
    const matchesSearch =
      o.product.toLowerCase().includes(q) ||
      product(o.product).includes(search) ||
      o.id.toLowerCase().includes(q);
    const matchesFilter = filter === "All" || o.status === filter;
    return matchesSearch && matchesFilter;
  });

  const totalSpent = ORDERS.filter((o) => o.status !== "Refunded").reduce((s, o) => s + o.amount, 0);
  const totalDue = ORDERS.filter((o) => o.status === "Due").reduce((s, o) => s + o.amount, 0);
  const dueCount = ORDERS.filter((o) => o.status === "Due").length;

  const STATS = [
    { label: t("buyer.orders.stats.totalOrders"), value: ORDERS.length, icon: ShoppingCart, tint: COLORS.forest },
    { label: t("buyer.orders.stats.totalSpent"), value: `${currency} ${totalSpent.toLocaleString()}`, icon: Wallet, tint: COLORS.leaf },
    { label: t("buyer.orders.stats.amountDue"), value: `${currency} ${totalDue.toLocaleString()}`, icon: AlertTriangle, tint: COLORS.goldDark },
    { label: t("buyer.orders.stats.ordersSettled"), value: ORDERS.length - dueCount, icon: CheckCircle2, tint: COLORS.leaf },
  ];

  const dueAmountDisplay = `${currency} ${totalDue.toLocaleString()}`;
  const dueBannerText =
    dueCount > 1
      ? t("buyer.orders.dueBannerMany", { amount: dueAmountDisplay, count: dueCount })
      : t("buyer.orders.dueBannerOne", { amount: dueAmountDisplay, count: dueCount });

  return (
    <div className="font-body" style={{ backgroundColor: COLORS.cream }} dir={isUr ? "rtl" : "ltr"}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&family=Noto+Nastaliq+Urdu:wght@500;700&display=swap');
        .font-display { font-family: ${isUr ? "'Noto Nastaliq Urdu', serif" : "'Fraunces', serif"}; }
        .font-body { font-family: ${isUr ? "'Noto Nastaliq Urdu', serif" : "'Inter', sans-serif"}; }
      `}</style>

      {/* header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl" style={{ color: COLORS.ink }}>
          {t("buyer.orders.title")}
        </h1>
        <p className="text-sm mt-1" style={{ color: COLORS.sub }}>
          {t("buyer.orders.subtitle")}
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

      {/* due amount banner */}
      {totalDue > 0 && (
        <div
          className="flex items-center justify-between rounded-xl p-4 mb-6"
          style={{ backgroundColor: COLORS.forest }}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle size={18} color={COLORS.gold} />
            <p className="text-sm text-white">{dueBannerText}</p>
          </div>
          <button
            className="px-4 py-2 rounded-lg text-sm font-medium shrink-0"
            style={{ backgroundColor: COLORS.gold, color: COLORS.forestDark }}
          >
            {t("buyer.orders.payNow")}
          </button>
        </div>
      )}

      {/* search + filter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" color="#909685" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("buyer.orders.searchPlaceholder")}
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm outline-none"
            style={{ borderColor: COLORS.border, backgroundColor: "white" }}
          />
        </div>
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className="text-xs font-medium px-3 py-2 rounded-lg border"
              style={
                filter === f.value
                  ? { backgroundColor: COLORS.forest, color: "white", borderColor: COLORS.forest }
                  : { color: COLORS.sub, borderColor: COLORS.border }
              }
            >
              {t(f.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* orders table */}
      <div
        className="rounded-xl border overflow-x-auto"
        style={{ backgroundColor: "white", borderColor: COLORS.greige }}
      >
        <table className="w-full text-sm min-w-[760px]">
          <thead>
            <tr style={{ color: COLORS.sub }}>
              <th className="text-left font-medium px-5 py-3">{t("buyer.orders.table.order")}</th>
              <th className="text-left font-medium px-5 py-3">{t("buyer.orders.table.consignment")}</th>
              <th className="text-left font-medium px-5 py-3">{t("buyer.orders.table.product")}</th>
              <th className="text-left font-medium px-5 py-3">{t("buyer.orders.table.qty")}</th>
              <th className="text-left font-medium px-5 py-3">{t("buyer.orders.table.amount")}</th>
              <th className="text-left font-medium px-5 py-3">{t("buyer.orders.table.payment")}</th>
              <th className="text-left font-medium px-5 py-3">{t("buyer.orders.table.date")}</th>
              <th className="text-left font-medium px-5 py-3">{t("buyer.orders.table.status")}</th>
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
                  {product(o.product)}
                </td>
                <td className="px-5 py-3" style={{ color: COLORS.sub }}>
                  {o.qty} {localizeUnit(o.unit, language)}
                </td>
                <td className="px-5 py-3" style={{ color: COLORS.ink }}>
                  {currency} {o.amount.toLocaleString()}
                </td>
                <td className="px-5 py-3" style={{ color: COLORS.sub }}>
                  {t(PAYMENT_LABEL_KEY[o.payment])}
                </td>
                <td className="px-5 py-3" style={{ color: COLORS.sub }}>
                  {formatLocaleDate(o.date, language)}
                </td>
                <td className="px-5 py-3">
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{
                      backgroundColor: STATUS_STYLE[o.status].bg,
                      color: STATUS_STYLE[o.status].text,
                    }}
                  >
                    {t(STATUS_LABEL_KEY[o.status])}
                  </span>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center" style={{ color: COLORS.sub }}>
                  {t("buyer.orders.noResults")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
