import { useEffect, useMemo, useState } from "react";
import {
  Boxes,
  ShoppingCart,
  Percent,
  HandCoins,
  ArrowUpRight,
  AlertTriangle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { localizeTrader, formatAgentCurrency } from "./agentLocale";
import { listOrdersAgainstMyConsignments } from "../handlers/order";
import { listMyCommissions } from "../handlers/commission";
import { listMyConsignments } from "../handlers/consignment";
import { getMyLedger } from "../handlers/account";
import { getMyProfile } from "../handlers/party";

/**
 * AgentDashboard.jsx
 * Not one of the 5 files needing a full restyle — already used real
 * Tailwind classes and the LoginPage token set, so structure/markup is
 * left alone. This pass: real data, status split, one font-switching fix.
 *
 * FONT FIX: this file used to redefine .font-body itself to swap to Noto
 * Nastaliq Urdu when isUr — meaning ALL body text switched fonts in Urdu
 * mode. LoginPage's actual convention keeps .font-body permanently Inter
 * and only ever swaps headings (font-display <-> font-urdu). Matched that.
 *
 * STATUS: recent orders now show real order.status (fulfillment) only.
 * order.js is explicit that computed payment_status only comes back from
 * getOrder(orderId), the single-order detail call — not the list endpoint
 * this widget uses. Fetching that per-row for a 5-row preview isn't worth
 * the extra calls; full payment breakdown belongs on AgentOrders.jsx.
 *
 * LEDGER SHAPE IS UNCONFIRMED: account.js only says getMyLedger() returns
 * "their own party's ledger" — no field names given. normalizeLedgerEntry()
 * below is a best-effort guess (counterparty_name, amount, a sign/direction
 * to identify money owed to suppliers). Treat the "Owed to Suppliers" widget
 * as unverified until the real response shape is confirmed.
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
  errorBg: "#faeaea",
  errorText: "#b5544a",
};

function normalizeOrder(raw) {
  return {
    id: raw.id,
    consignedId: raw.consigned_id,
    buyerName: raw.buyer?.name ?? raw.buyer_name ?? null,
    amount: raw.total_amount,
    quantity: raw.quantity_ordered,
    status: raw.status, // fulfillment only — see file header
    date: raw.created_at ?? null,
  };
}

function normalizeCommission(raw) {
  return {
    id: raw.id,
    commissionAmount: raw.commission_amount,
    rate: raw.commission_rate,
    date: raw.created_at ?? null,
  };
}

function normalizeConsignment(raw) {
  return {
    id: raw.id,
    quantity: raw.quantity_consigned,
    status: raw.status,
    date: raw.created_at ?? null,
  };
}

// Guessed shape — see header note. Adjust field names once confirmed.
function normalizeLedgerEntry(raw) {
  return {
    id: raw.id,
    counterpartyName: raw.counterparty_name ?? raw.party_name ?? null,
    amount: raw.amount ?? 0,
    direction: raw.direction ?? (raw.amount < 0 ? "payable" : "receivable"),
  };
}

export default function AgentDashboard() {
  const { language, t } = useLanguage();
  const isUr = language === "ur";
  const trader = (name) => (name ? localizeTrader(name, language) : "");
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [consignments, setConsignments] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [profileName, setProfileName] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchDashboard() {
    setLoading(true);
    setError(null);
    const [ordersRes, commissionsRes, consignmentsRes, ledgerRes, profileRes] = await Promise.all([
      listOrdersAgainstMyConsignments(),
      listMyCommissions(),
      listMyConsignments(),
      getMyLedger(),
      getMyProfile(),
    ]);
    const firstError = [ordersRes, commissionsRes, consignmentsRes, ledgerRes, profileRes].find((r) => r.error)?.error;
    if (firstError) setError(firstError);

    setOrders((ordersRes.data ?? []).map(normalizeOrder));
    setCommissions((commissionsRes.data ?? []).map(normalizeCommission));
    setConsignments((consignmentsRes.data ?? []).map(normalizeConsignment));
    setLedger((ledgerRes.data ?? []).map(normalizeLedgerEntry));
    setProfileName(profileRes.data?.name ?? null);
    setLoading(false);
  }

  useEffect(() => {
    fetchDashboard();
  }, []);

  const STATUS_STYLE = {
    pending: { bg: "#f5e6c5", text: "#8a6413", label: t("agent.common.status.pending") },
    confirmed: { bg: "#e2ecd9", text: "#3f6b32", label: t("agent.common.status.confirmed") },
    completed: { bg: COLORS.greige, text: COLORS.forest, label: t("agent.common.status.completed") },
    cancelled: { bg: COLORS.errorBg, text: COLORS.errorText, label: t("agent.common.status.cancelled") },
  };

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort((a, b) => new Date(b.date ?? 0) - new Date(a.date ?? 0))
        .slice(0, 5),
    [orders]
  );

  const now = new Date();
  const isThisMonth = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };

  const stats = useMemo(() => {
    const consignedInventory = consignments
      .filter((c) => c.status === "confirmed")
      .reduce((s, c) => s + (c.quantity ?? 0), 0); // approximate — doesn't net out quantity already sold, that data isn't in this response
    const ordersFulfilled = orders.filter((o) => o.status === "completed").length;
    const commissionEarned = commissions.reduce((s, c) => s + (c.commissionAmount ?? 0), 0);
    const owedToSuppliers = ledger
      .filter((l) => l.direction === "payable")
      .reduce((s, l) => s + Math.abs(l.amount ?? 0), 0);
    return { consignedInventory, ordersFulfilled, commissionEarned, owedToSuppliers };
  }, [consignments, orders, commissions, ledger]);

  const thisMonth = useMemo(() => {
    const consignmentsReceived = consignments.filter((c) => isThisMonth(c.date)).length;
    const quantitySold = orders
      .filter((o) => isThisMonth(o.date))
      .reduce((s, o) => s + (o.quantity ?? 0), 0);
    const avgRate = commissions.length
      ? commissions.reduce((s, c) => s + (c.rate ?? 0), 0) / commissions.length
      : 0;
    return { consignmentsReceived, quantitySold, avgRate };
  }, [consignments, orders, commissions]);

  const suppliersOwed = useMemo(() => {
    const byName = new Map();
    ledger
      .filter((l) => l.direction === "payable" && l.counterpartyName)
      .forEach((l) => {
        byName.set(l.counterpartyName, (byName.get(l.counterpartyName) ?? 0) + Math.abs(l.amount ?? 0));
      });
    return [...byName.entries()]
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
  }, [ledger]);

  const STATS = [
    { label: t("agent.dashboard.stats.consignedInventory"), value: stats.consignedInventory.toLocaleString(), icon: Boxes, tint: COLORS.leaf },
    { label: t("agent.dashboard.stats.ordersFulfilled"), value: String(stats.ordersFulfilled), icon: ShoppingCart, tint: COLORS.forest },
    { label: t("agent.dashboard.stats.commissionEarned"), value: formatAgentCurrency(stats.commissionEarned, t), icon: Percent, tint: COLORS.gold },
    { label: t("agent.dashboard.stats.owedToSuppliers"), value: formatAgentCurrency(stats.owedToSuppliers, t), icon: HandCoins, tint: "#a35c2b" },
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
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className={`text-2xl sm:text-3xl ${isUr ? "font-urdu" : "font-display"}`} style={{ color: COLORS.ink }}>
            {t("agent.dashboard.welcomeBack", { name: profileName ?? "" })}
          </h1>
          <p className="text-sm mt-1" style={{ color: COLORS.sub }}>
            {t("agent.dashboard.subtitle")}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: COLORS.errorBg, color: COLORS.errorText }}>
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            {(t("agent.dashboard.loadError") || "Some dashboard data couldn't load")}: {error}
          </div>
          <button onClick={fetchDashboard} className="rounded-lg border px-3 py-1 text-xs font-medium" style={{ borderColor: COLORS.errorText }}>
            {t("agent.commissions.retry") || "Retry"}
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border bg-white py-16 text-sm" style={{ borderColor: COLORS.greige, color: COLORS.sub }}>
          <Loader2 size={18} className="animate-spin" />
          {t("agent.dashboard.loading") || "Loading dashboard…"}
        </div>
      ) : (
        <>
          {/* stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-xl p-5 border" style={{ backgroundColor: "white", borderColor: COLORS.greige }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: `${s.tint}1a` }}>
                  <s.icon size={18} color={s.tint} />
                </div>
                <p className={`text-2xl ${isUr ? "font-urdu" : "font-display"}`} style={{ color: COLORS.ink }}>
                  {s.value}
                </p>
                <p className="text-xs mt-1" style={{ color: COLORS.sub }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* main content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* recent orders */}
            <div className="lg:col-span-2 rounded-xl border overflow-hidden" style={{ backgroundColor: "white", borderColor: COLORS.greige }}>
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: COLORS.greige }}>
                <h2 className={`text-lg ${isUr ? "font-urdu" : "font-display"}`} style={{ color: COLORS.ink }}>
                  {t("agent.dashboard.recentOrders")}
                </h2>
                <button
                  onClick={() => navigate("/agent/orders")}
                  className="flex items-center gap-1 text-xs font-medium"
                  style={{ color: COLORS.leaf }}
                >
                  {t("agent.dashboard.viewAll")} <ArrowUpRight size={14} />
                </button>
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr style={{ color: COLORS.sub }}>
                    <th className="text-left font-medium px-5 py-3">{t("agent.common.table.order")}</th>
                    <th className="text-left font-medium px-5 py-3">{t("agent.common.table.consignment")}</th>
                    <th className="text-left font-medium px-5 py-3">{t("agent.common.table.buyer")}</th>
                    <th className="text-left font-medium px-5 py-3">{t("agent.common.table.amount")}</th>
                    <th className="text-left font-medium px-5 py-3">{t("agent.common.table.status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="border-t" style={{ borderColor: COLORS.greige }}>
                      <td className="px-5 py-3 font-medium" style={{ color: COLORS.ink }}>#{o.id}</td>
                      <td className="px-5 py-3" style={{ color: COLORS.sub }}>#{o.consignedId}</td>
                      <td className="px-5 py-3" style={{ color: COLORS.ink }}>{o.buyerName ? trader(o.buyerName) : "—"}</td>
                      <td className="px-5 py-3" style={{ color: COLORS.ink }}>{formatAgentCurrency(o.amount, t)}</td>
                      <td className="px-5 py-3">
                        <span
                          className="text-xs font-medium px-2.5 py-1 rounded-full"
                          style={{
                            backgroundColor: STATUS_STYLE[o.status]?.bg ?? COLORS.greige,
                            color: STATUS_STYLE[o.status]?.text ?? COLORS.sub,
                          }}
                        >
                          {STATUS_STYLE[o.status]?.label ?? o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {recentOrders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-sm" style={{ color: COLORS.sub }}>
                        {t("agent.dashboard.noOrders") || "No orders yet"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* side panel */}
            <div className="flex flex-col gap-6">
              <div className="rounded-xl p-5 border" style={{ backgroundColor: COLORS.forest, borderColor: COLORS.forest }}>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={16} color={COLORS.gold} />
                  <h3 className={`text-base text-white ${isUr ? "font-urdu" : "font-display"}`}>{t("agent.dashboard.owedToSuppliers")}</h3>
                </div>
                {suppliersOwed.length > 0 ? (
                  <ul className="space-y-2.5 text-sm">
                    {suppliersOwed.map((s) => (
                      <li key={s.name} className="flex items-center justify-between">
                        <span style={{ color: "#c9d9c2" }}>{trader(s.name)}</span>
                        <span className="text-white font-medium">{formatAgentCurrency(s.amount, t)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm" style={{ color: "#c9d9c2" }}>{t("agent.dashboard.nothingOwed") || "Nothing outstanding"}</p>
                )}
                <button
                  onClick={() => navigate("/agent/settlements")}
                  className="w-full mt-4 py-2 rounded-lg text-sm font-medium transition-transform active:scale-[0.99]"
                  style={{ backgroundColor: COLORS.gold, color: COLORS.forestDark }}
                >
                  {t("agent.dashboard.settleNow")}
                </button>
              </div>

              <div className="rounded-xl p-5 border" style={{ backgroundColor: "white", borderColor: COLORS.greige }}>
                <h3 className={`text-base mb-4 ${isUr ? "font-urdu" : "font-display"}`} style={{ color: COLORS.ink }}>
                  {t("agent.common.thisMonth")}
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span style={{ color: COLORS.sub }}>{t("agent.dashboard.thisMonth.consignmentsReceived")}</span>
                    <span className="font-medium" style={{ color: COLORS.ink }}>{thisMonth.consignmentsReceived}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: COLORS.sub }}>{t("agent.dashboard.thisMonth.quantitySold")}</span>
                    <span className="font-medium" style={{ color: COLORS.ink }}>{thisMonth.quantitySold.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: COLORS.sub }}>{t("agent.dashboard.thisMonth.commissionRateAvg")}</span>
                    <span className="font-medium" style={{ color: COLORS.leaf }}>{thisMonth.avgRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
