import { useEffect, useMemo, useState } from "react";
import { Search, ShoppingCart, Percent, Wallet, Clock, Loader2, AlertCircle, Check, X, PackageCheck } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { localizeTrader, formatAgentCurrency } from "./agentLocale";
import { listOrdersAgainstMyConsignments, getOrder, updateOrderStatus } from "../handlers/order";
import { listMyCommissions } from "../handlers/commission";

/**
 * AgentOrders.jsx
 * Commission Agent — orders placed against this agent's consignments.
 *
 * THREE separate concepts the old mock conflated into one "status" column:
 *  1. order.status — real fulfillment lifecycle (pending/confirmed/
 *     completed/cancelled), with an action to actually drive it now.
 *  2. order.payment_term — set at order creation (cash/credit). This is
 *     what the old "Payment" column already showed, just source-corrected.
 *  3. payment_status — computed from actual payments, and per order.js
 *     ONLY getOrder(orderId) returns it, not the list endpoint. Since this
 *     is the full orders-management screen (not a dashboard preview),
 *     fetching detail per row is worth it here — flag if order volume
 *     grows large enough to need pagination instead of fetch-all.
 *
 * Commission amount is NOT on the order — it's a separate resource
 * (commission.js), cross-referenced here by order_id.
 *
 * GUESSED: payment_status's valid values aren't documented anywhere —
 * assumed "unpaid" | "partial" | "paid". Fix in normalizeOrder below if wrong.
 */

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
  errorBg: "#faeaea",
  errorText: "#b5544a",
};

function normalizeOrder(raw) {
  return {
    id: raw.id,
    consignedId: raw.consigned_id,
    buyerName: raw.buyer?.name ?? raw.buyer_name ?? null,
    itemName: raw.item_name ?? raw.supply?.item_name ?? null,
    quantity: raw.quantity_ordered,
    unit: raw.unit ?? raw.supply?.unit ?? "kg",
    amount: raw.total_amount,
    paymentTerm: raw.payment_term, // "cash" | "credit" (guessed enum, matches old mock's values)
    status: raw.status, // "pending" | "confirmed" | "completed" | "cancelled"
    date: raw.created_at ?? null,
  };
}

const FULFILLMENT_FILTERS = ["all", "pending", "confirmed", "completed", "cancelled"];

export default function AgentOrders() {
  const { language, t } = useLanguage();
  const isUr = language === "ur";
  const trader = (name) => (name ? localizeTrader(name, language) : "");
  const headingClass = isUr ? "font-urdu" : "font-display";

  const STATUS_META = {
    pending: { bg: "#f5e6c5", text: "#8a6413", label: t("agent.common.status.awaitingConfirmation") },
    confirmed: { bg: "#e2ecd9", text: "#3f6b32", label: t("agent.common.status.confirmed") },
    completed: { bg: COLORS.greige, text: COLORS.forest, label: t("agent.common.status.completed") },
    cancelled: { bg: COLORS.errorBg, text: COLORS.errorText, label: t("agent.common.status.cancelled") },
  };
  const PAYMENT_STATUS_META = {
    paid: { bg: "#e2ecd9", text: "#3f6b32", label: t("agent.common.paymentStatus.paid") || "Paid" },
    partial: { bg: "#f5e6c5", text: "#8a6413", label: t("agent.common.paymentStatus.partial") || "Partial" },
    unpaid: { bg: COLORS.errorBg, text: COLORS.errorText, label: t("agent.common.paymentStatus.unpaid") || "Unpaid" },
  };
  const PAYMENT_TERM_LABEL = {
    cash: t("agent.common.payment.cash"),
    credit: t("agent.common.payment.credit"),
  };
  const FILTER_LABEL = {
    all: t("agent.orders.filters.all"),
    pending: t("agent.common.status.awaitingConfirmation"),
    confirmed: t("agent.common.status.confirmed"),
    completed: t("agent.common.status.completed"),
    cancelled: t("agent.common.status.cancelled"),
  };

  const [orders, setOrders] = useState([]);
  const [commissionByOrder, setCommissionByOrder] = useState({});
  const [paymentByOrder, setPaymentByOrder] = useState({}); // order_id -> { paymentStatus, amountPaid }
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [transitioningId, setTransitioningId] = useState(null);
  const [actionError, setActionError] = useState(null);

  async function fetchOrders() {
    setLoading(true);
    setLoadError(null);

    const [listRes, commissionsRes] = await Promise.all([
      listOrdersAgainstMyConsignments(),
      listMyCommissions(),
    ]);
    if (listRes.error) {
      setLoadError(listRes.error);
      setOrders([]);
      setLoading(false);
      return;
    }

    const list = (listRes.data ?? []).map(normalizeOrder);
    setOrders(list);

    // commission_amount lives on the commission resource, not the order
    const commMap = {};
    (commissionsRes.data ?? []).forEach((c) => {
      if (c.order_id != null) commMap[c.order_id] = c.commission_amount;
    });
    setCommissionByOrder(commMap);

    // payment_status/amount_paid only come from the per-order detail call
    const details = await Promise.all(list.map((o) => getOrder(o.id)));
    const payMap = {};
    details.forEach((res, i) => {
      if (!res.error && res.data) {
        payMap[list[i].id] = {
          paymentStatus: res.data.payment_status,
          amountPaid: res.data.amount_paid,
        };
      }
    });
    setPaymentByOrder(payMap);

    setLoading(false);
  }

  useEffect(() => {
    fetchOrders();
  }, []);

  async function handleTransition(orderId, status) {
    setActionError(null);
    setTransitioningId(orderId);
    const { error } = await updateOrderStatus(orderId, status);
    if (error) {
      setActionError(error);
    } else {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    }
    setTransitioningId(null);
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return orders.filter((o) => {
      const matchesSearch =
        !q ||
        trader(o.buyerName).toLowerCase().includes(q) ||
        String(o.id).includes(q) ||
        String(o.consignedId).includes(q);
      const matchesFilter = filter === "all" || o.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [orders, search, filter, language]);

  const totalSales = orders.reduce((sum, o) => sum + (o.amount ?? 0), 0);
  const totalCommission = Object.values(commissionByOrder).reduce((sum, c) => sum + (c ?? 0), 0);
  const pendingCount = orders.filter((o) => o.status === "pending").length;

  const STATS = [
    { label: t("agent.orders.stats.totalOrders"), value: orders.length, icon: ShoppingCart, tint: COLORS.forest },
    { label: t("agent.orders.stats.totalSales"), value: formatAgentCurrency(totalSales, t), icon: Wallet, tint: COLORS.leaf },
    { label: t("agent.orders.stats.commissionEarned"), value: formatAgentCurrency(totalCommission, t), icon: Percent, tint: COLORS.gold },
    { label: t("agent.orders.stats.pendingCredit"), value: pendingCount, icon: Clock, tint: "#a35c2b" },
  ];

  return (
    <div className="font-body" style={{ backgroundColor: COLORS.cream }} dir={isUr ? "rtl" : "ltr"}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&family=Noto+Nastaliq+Urdu:wght@500;700&display=swap');
        .font-display { font-family: 'Fraunces', serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        .font-urdu { font-family: 'Noto Nastaliq Urdu', serif; }
      `}</style>

      {/* header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className={`text-2xl sm:text-3xl ${headingClass}`} style={{ color: COLORS.ink }}>
            {t("agent.orders.title")}
          </h1>
          <p className="text-sm mt-1" style={{ color: COLORS.sub }}>
            {t("agent.orders.subtitle")}
          </p>
        </div>
      </div>

      {loadError && (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: COLORS.errorBg, color: COLORS.errorText }}>
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            {(t("agent.orders.loadError") || "Couldn't load orders")}: {loadError}
          </div>
          <button onClick={fetchOrders} className="rounded-lg border px-3 py-1 text-xs font-medium" style={{ borderColor: COLORS.errorText }}>
            {t("agent.commissions.retry") || "Retry"}
          </button>
        </div>
      )}
      {actionError && (
        <div className="mb-6 flex items-center gap-2 rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: COLORS.errorBg, color: COLORS.errorText }}>
          <AlertCircle size={16} />
          {actionError}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border bg-white py-16 text-sm" style={{ borderColor: COLORS.greige, color: COLORS.sub }}>
          <Loader2 size={18} className="animate-spin" />
          {t("agent.orders.loading") || "Loading orders…"}
        </div>
      ) : (
        <>
          {/* stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-xl p-5 border" style={{ backgroundColor: "white", borderColor: COLORS.greige }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: `${s.tint}1a` }}>
                  <s.icon size={18} color={s.tint} />
                </div>
                <p className={`text-2xl ${headingClass}`} style={{ color: COLORS.ink }}>{s.value}</p>
                <p className="text-xs mt-1" style={{ color: COLORS.sub }}>{s.label}</p>
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
            <div className="flex flex-wrap gap-2">
              {FULFILLMENT_FILTERS.map((f) => (
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
          <div className="rounded-xl border overflow-x-auto" style={{ backgroundColor: "white", borderColor: COLORS.greige }}>
            <table className="w-full text-sm min-w-[980px]">
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
                  <th className="text-left font-medium px-5 py-3">{t("agent.common.table.paymentStatus") || "Payment status"}</th>
                  <th className="text-left font-medium px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => {
                  const commission = commissionByOrder[o.id];
                  const payment = paymentByOrder[o.id];
                  return (
                    <tr key={o.id} className="border-t" style={{ borderColor: COLORS.greige }}>
                      <td className="px-5 py-3 font-medium" style={{ color: COLORS.ink }}>#{o.id}</td>
                      <td className="px-5 py-3" style={{ color: COLORS.sub }}>#{o.consignedId}</td>
                      <td className="px-5 py-3" style={{ color: COLORS.ink }}>{o.buyerName ? trader(o.buyerName) : "—"}</td>
                      <td className="px-5 py-3" style={{ color: COLORS.sub }}>{o.itemName ?? "—"}</td>
                      <td className="px-5 py-3" style={{ color: COLORS.sub }}>{(o.quantity ?? 0).toLocaleString()} {o.unit}</td>
                      <td className="px-5 py-3" style={{ color: COLORS.ink }}>{formatAgentCurrency(o.amount, t)}</td>
                      <td className="px-5 py-3 font-medium" style={{ color: COLORS.leaf }}>
                        {commission != null ? formatAgentCurrency(commission, t) : "—"}
                      </td>
                      <td className="px-5 py-3" style={{ color: COLORS.sub }}>{PAYMENT_TERM_LABEL[o.paymentTerm] ?? o.paymentTerm ?? "—"}</td>
                      <td className="px-5 py-3">
                        <span
                          className="text-xs font-medium px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: STATUS_META[o.status]?.bg ?? COLORS.greige, color: STATUS_META[o.status]?.text ?? COLORS.sub }}
                        >
                          {STATUS_META[o.status]?.label ?? o.status}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {payment?.paymentStatus ? (
                          <span
                            className="text-xs font-medium px-2.5 py-1 rounded-full"
                            style={{ backgroundColor: PAYMENT_STATUS_META[payment.paymentStatus]?.bg ?? COLORS.greige, color: PAYMENT_STATUS_META[payment.paymentStatus]?.text ?? COLORS.sub }}
                          >
                            {PAYMENT_STATUS_META[payment.paymentStatus]?.label ?? payment.paymentStatus}
                          </span>
                        ) : (
                          <span style={{ color: COLORS.sub }}>—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1.5">
                          {o.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleTransition(o.id, "confirmed")}
                                disabled={transitioningId === o.id}
                                className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium disabled:opacity-50"
                                style={{ borderColor: COLORS.leaf, color: COLORS.leaf }}
                              >
                                {transitioningId === o.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                {t("agent.common.confirm") || "Confirm"}
                              </button>
                              <button
                                onClick={() => handleTransition(o.id, "cancelled")}
                                disabled={transitioningId === o.id}
                                className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium disabled:opacity-50"
                                style={{ borderColor: COLORS.errorText, color: COLORS.errorText }}
                              >
                                <X size={12} />
                                {t("agent.common.cancel") || "Cancel"}
                              </button>
                            </>
                          )}
                          {o.status === "confirmed" && (
                            <>
                              <button
                                onClick={() => handleTransition(o.id, "completed")}
                                disabled={transitioningId === o.id}
                                className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium disabled:opacity-50"
                                style={{ borderColor: COLORS.forest, color: COLORS.forest }}
                              >
                                {transitioningId === o.id ? <Loader2 size={12} className="animate-spin" /> : <PackageCheck size={12} />}
                                {t("agent.common.complete") || "Complete"}
                              </button>
                              <button
                                onClick={() => handleTransition(o.id, "cancelled")}
                                disabled={transitioningId === o.id}
                                className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium disabled:opacity-50"
                                style={{ borderColor: COLORS.errorText, color: COLORS.errorText }}
                              >
                                <X size={12} />
                                {t("agent.common.cancel") || "Cancel"}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-5 py-10 text-center" style={{ color: COLORS.sub }}>
                      {t("agent.orders.noResults")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
