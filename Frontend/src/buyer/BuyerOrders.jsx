import { useState, useEffect } from "react";
import { Search, ShoppingCart, Wallet, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { localizeProduct, formatLocaleDate, localizeUnit } from "../i18n/dataLocale";
import { listMyOrders } from "../handlers/order";

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

// Payment status (due/partially_paid/paid/refunded) — computed
// server-side from `payments`, never a stored column. Reuses the
// existing buyer.orders.filters.* keys for paid/due/refunded since
// those already exist; "partially_paid" has no translation key yet,
// hardcoded and flagged below.
const PAYMENT_STATUS_STYLE = {
  paid: { bg: "#eaf1e4", text: COLORS.leaf },
  due: { bg: "#fdf1dc", text: "#a3721b" },
  partially_paid: { bg: "#fdf1dc", text: "#a3721b" },
  refunded: { bg: "#faeaea", text: "#b5544a" },
};

const PAYMENT_STATUS_LABEL_KEY = {
  paid: "buyer.orders.filters.paid",
  due: "buyer.orders.filters.due",
  refunded: "buyer.orders.filters.refunded",
};

// Fulfillment status (orders.status: pending/confirmed/completed/cancelled)
// — a SEPARATE concept from payment status above. No translation keys
// exist for these yet, hardcoded plain English, flagged.
const FULFILLMENT_STYLE = {
  pending: { bg: "#eef0e9", text: COLORS.sub },
  confirmed: { bg: "#eaf1e4", text: COLORS.leaf },
  completed: { bg: "#eaf1e4", text: COLORS.forest },
  cancelled: { bg: "#faeaea", text: "#b5544a" },
};
const FULFILLMENT_LABEL = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

const PAYMENT_TERM_LABEL_KEY = {
  cash: "buyer.common.cash",
  credit: "buyer.common.credit",
};

// filter buttons — "partially_paid" added since it's a real possible
// value now; hardcoded label, no translation key exists for it
const FILTERS = [
  { value: "All", labelKey: "buyer.orders.filters.all" },
  { value: "paid", labelKey: "buyer.orders.filters.paid" },
  { value: "due", labelKey: "buyer.orders.filters.due" },
  { value: "partially_paid", label: "Partially paid" },
  { value: "refunded", labelKey: "buyer.orders.filters.refunded" },
];

export default function BuyerOrders() {
  const { language, t } = useLanguage();
  const isUr = language === "ur";
  const product = (name) => localizeProduct(name, language);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const currency = t("buyer.common.currency");

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      const { data, error } = await listMyOrders();
      if (cancelled) return;

      if (error) {
        setLoadError(error);
      } else {
        setOrders(data);
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (o.product_name || "").toLowerCase().includes(q) ||
      product(o.product_name).toLowerCase().includes(q) ||
      String(o.order_id).includes(q);
    const matchesFilter = filter === "All" || o.payment_status === filter;
    return matchesSearch && matchesFilter;
  });

  // Outstanding per order: for a fully-"due" order that's the whole
  // total; for "partially_paid" it's only what's left after
  // amount_paid. Refunded/paid orders owe nothing.
  const outstanding = (o) =>
    o.payment_status === "due" || o.payment_status === "partially_paid"
      ? Number(o.total_amount) - Number(o.amount_paid || 0)
      : 0;

  const totalSpent = orders
    .filter((o) => o.payment_status !== "refunded")
    .reduce((s, o) => s + Number(o.total_amount), 0);
  const totalDue = orders.reduce((s, o) => s + outstanding(o), 0);
  const dueOrders = orders.filter((o) => o.payment_status === "due" || o.payment_status === "partially_paid");
  const dueCount = dueOrders.length;

  const STATS = [
    { label: t("buyer.orders.stats.totalOrders"), value: orders.length, icon: ShoppingCart, tint: COLORS.forest },
    { label: t("buyer.orders.stats.totalSpent"), value: `${currency} ${totalSpent.toLocaleString()}`, icon: Wallet, tint: COLORS.leaf },
    { label: t("buyer.orders.stats.amountDue"), value: `${currency} ${totalDue.toLocaleString()}`, icon: AlertTriangle, tint: COLORS.goldDark },
    { label: t("buyer.orders.stats.ordersSettled"), value: orders.length - dueCount, icon: CheckCircle2, tint: COLORS.leaf },
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
          {/* Inert — no dedicated payment-initiation screen exists yet
              (BuyerPayments.jsx not built), and a lump "pay now" doesn't
              make sense across potentially several different agents/
              orders anyway. Wire this once that flow exists. */}
          <button
            disabled
            className="px-4 py-2 rounded-lg text-sm font-medium shrink-0 opacity-60 cursor-not-allowed"
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
        <div className="flex gap-2 flex-wrap">
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
              {f.labelKey ? t(f.labelKey) : f.label}
            </button>
          ))}
        </div>
      </div>

      {/* loading / error states */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={22} className="animate-spin" color={COLORS.forest} />
        </div>
      )}

      {!loading && loadError && (
        <div
          className="text-sm rounded-lg px-4 py-3 mb-6"
          style={{ backgroundColor: "#faeaea", color: "#b5544a" }}
        >
          {loadError}
        </div>
      )}

      {/* orders table */}
      {!loading && !loadError && (
        <div
          className="rounded-xl border overflow-x-auto"
          style={{ backgroundColor: "white", borderColor: COLORS.greige }}
        >
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr style={{ color: COLORS.sub }}>
                <th className="text-left font-medium px-5 py-3">{t("buyer.orders.table.order")}</th>
                <th className="text-left font-medium px-5 py-3">{t("buyer.orders.table.consignment")}</th>
                <th className="text-left font-medium px-5 py-3">{t("buyer.orders.table.product")}</th>
                <th className="text-left font-medium px-5 py-3">{t("buyer.orders.table.qty")}</th>
                <th className="text-left font-medium px-5 py-3">{t("buyer.orders.table.amount")}</th>
                <th className="text-left font-medium px-5 py-3">{t("buyer.orders.table.payment")}</th>
                <th className="text-left font-medium px-5 py-3">{t("buyer.orders.table.date")}</th>
                {/* Fulfillment status — separate column, separate concept
                    from payment status. No translation key yet. */}
                <th className="text-left font-medium px-5 py-3">Order status</th>
                <th className="text-left font-medium px-5 py-3">{t("buyer.orders.table.status")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.order_id} className="border-t" style={{ borderColor: COLORS.greige }}>
                  <td className="px-5 py-3 font-medium" style={{ color: COLORS.ink }}>
                    {o.order_id}
                  </td>
                  <td className="px-5 py-3" style={{ color: COLORS.sub }}>
                    {o.consigned_id}
                  </td>
                  <td className="px-5 py-3" style={{ color: COLORS.ink }}>
                    {product(o.product_name)}
                  </td>
                  <td className="px-5 py-3" style={{ color: COLORS.sub }}>
                    {o.quantity_ordered} {localizeUnit(o.unit, language)}
                  </td>
                  <td className="px-5 py-3" style={{ color: COLORS.ink }}>
                    {currency} {Number(o.total_amount).toLocaleString()}
                  </td>
                  <td className="px-5 py-3" style={{ color: COLORS.sub }}>
                    {t(PAYMENT_TERM_LABEL_KEY[o.payment_term])}
                  </td>
                  <td className="px-5 py-3" style={{ color: COLORS.sub }}>
                    {formatLocaleDate(o.order_date?.split("T")[0], language)}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{
                        backgroundColor: FULFILLMENT_STYLE[o.status]?.bg,
                        color: FULFILLMENT_STYLE[o.status]?.text,
                      }}
                    >
                      {FULFILLMENT_LABEL[o.status] || o.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{
                        backgroundColor: PAYMENT_STATUS_STYLE[o.payment_status]?.bg,
                        color: PAYMENT_STATUS_STYLE[o.payment_status]?.text,
                      }}
                    >
                      {PAYMENT_STATUS_LABEL_KEY[o.payment_status]
                        ? t(PAYMENT_STATUS_LABEL_KEY[o.payment_status])
                        : "Partially paid"}
                    </span>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center" style={{ color: COLORS.sub }}>
                    {t("buyer.orders.noResults")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}