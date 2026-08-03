import { useEffect, useMemo, useState } from "react";
import {
  Percent,
  Wallet,
  TrendingUp,
  Clock,
  ChevronDown,
  Search,
  Loader2,
  AlertCircle,
  Check,
} from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { localizeTrader, formatAgentCurrency } from "./agentLocale";
import { listMyCommissions, markCommissionPaid } from "../handlers/commission";

/**
 * AgentCommissions.jsx
 * Commission Agent — commission earnings on orders fulfilled through their consignments.
 * Fully localized: renders in English or Urdu (including trader names, dates,
 * currency, and status labels) via LanguageContext.
 *
 * Data comes from GET /api/commissions/me (see handlers/commission.js).
 *
 * NOTE ON FIELD NAMES: there's no formal schema for the commission object yet
 * (same gap admin.js flags for the dashboard endpoint). commission.js only
 * confirms `payout_status` is derived server-side. Everything else below is
 * an educated guess at the response shape — see normalizeCommission() below,
 * which is the single place to fix field names if the real response differs.
 *
 * STYLING: matches LoginPage.jsx's actual tokens — same COLORS object and
 * the same .font-display / .font-body / .font-urdu class convention (only
 * headings switch to Urdu font; body text, inputs, and labels stay Inter).
 * Status-badge tints have no precedent in LoginPage (it has no badges), so
 * those three are new but derived from the same palette family.
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
  border: "#d9ddce", // LoginPage's input border — reused for cards too; no separate card-border token exists yet
  muted: "#6b7568", // LoginPage's subtitle/help text
  iconMuted: "#909685", // LoginPage's icon/placeholder color
  label: "#4a5240",
  errorBg: "#faeaea",
  errorText: "#b5544a",
};

// Single place to adjust if the real /api/commissions/me response uses
// different field names than assumed here.
function normalizeCommission(raw) {
  return {
    id: raw.id,
    orderId: raw.order_id,
    consignedId: raw.consigned_id,
    buyerName: raw.buyer?.name ?? raw.buyer_name ?? null,
    saleAmount: raw.sale_amount,
    rate: raw.commission_rate,
    commissionAmount: raw.commission_amount,
    payoutStatus: raw.payout_status, // "pending" | "paid" | "reversed"
    date: raw.created_at ?? raw.date ?? null,
  };
}

function StatusBadge({ meta }) {
  if (!meta) return null;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ background: meta.bg, color: meta.text }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.dot }} />
      {meta.label}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, iconBg, iconColor, isUr }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: COLORS.border }}>
      <div
        className="mb-4 flex h-10 w-10 items-center justify-center rounded-full"
        style={{ background: iconBg }}
      >
        <Icon size={20} color={iconColor} strokeWidth={2} />
      </div>
      <div className={`text-2xl ${isUr ? "font-urdu" : "font-display"}`} style={{ color: COLORS.ink }}>
        {value}
      </div>
      <div className="mt-1 text-sm" style={{ color: COLORS.muted }}>
        {label}
      </div>
    </div>
  );
}

export default function AgentCommissions() {
  const { language, t } = useLanguage();
  const isUr = language === "ur";
  const trader = (name) => localizeTrader(name, language);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // per-row mark-paid state
  const [markingId, setMarkingId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [actionError, setActionError] = useState(null);

  async function fetchCommissions() {
    setLoading(true);
    setLoadError(null);
    const { data, error } = await listMyCommissions();
    if (error) {
      setLoadError(error);
      setCommissions([]);
    } else {
      setCommissions((data ?? []).map(normalizeCommission));
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchCommissions();
  }, []);

  const STATUS_META = {
    paid: { label: t("agent.common.status.paid"), dot: COLORS.leaf, text: "#3f6b32", bg: "#e2ecd9" },
    pending: { label: t("agent.common.status.pending"), dot: COLORS.gold, text: "#8a6413", bg: "#f5e6c5" },
    reversed: { label: t("agent.common.status.reversed"), dot: COLORS.errorText, text: COLORS.errorText, bg: COLORS.errorBg },
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return commissions.filter((r) => {
      const buyerLabel = r.buyerName ? trader(r.buyerName) : "";
      const matchesQuery =
        !q ||
        buyerLabel.toLowerCase().includes(q) ||
        String(r.orderId).includes(q) ||
        String(r.consignedId).includes(q);
      const matchesStatus = statusFilter === "all" || r.payoutStatus === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [commissions, query, statusFilter, language]);

  const totals = useMemo(() => {
    const earned = commissions.reduce((s, r) => s + (r.commissionAmount ?? 0), 0);
    const paid = commissions
      .filter((r) => r.payoutStatus === "paid")
      .reduce((s, r) => s + (r.commissionAmount ?? 0), 0);
    const pending = commissions
      .filter((r) => r.payoutStatus === "pending")
      .reduce((s, r) => s + (r.commissionAmount ?? 0), 0);
    const avgRate = commissions.length
      ? commissions.reduce((s, r) => s + (r.rate ?? 0), 0) / commissions.length
      : 0;
    return { earned, paid, pending, avgRate };
  }, [commissions]);

  const pendingItems = commissions.filter((r) => r.payoutStatus === "pending");
  const pendingPreview = pendingItems.slice(0, 4);

  async function handleMarkPaid(commissionId) {
    setActionError(null);
    setMarkingId(commissionId);
    const { error } = await markCommissionPaid(commissionId);
    if (error) {
      setActionError(error);
    } else {
      setCommissions((prev) =>
        prev.map((r) => (r.id === commissionId ? { ...r, payoutStatus: "paid" } : r))
      );
    }
    setMarkingId(null);
  }

  // There's no bulk "request payout" endpoint on the backend — only
  // POST /api/commissions/:id/mark-paid, called by the owning agent
  // or an admin. This loops it across every currently-pending row.
  // Worth confirming agents should be able to self-mark paid at all,
  // vs. this being admin-only in practice.
  async function handleMarkAllPending() {
    if (pendingItems.length === 0) return;
    setActionError(null);
    setMarkingAll(true);
    const results = await Promise.all(
      pendingItems.map((r) => markCommissionPaid(r.id).then((res) => ({ id: r.id, ...res })))
    );
    const failed = results.filter((r) => r.error);
    const succeededIds = new Set(results.filter((r) => !r.error).map((r) => r.id));
    setCommissions((prev) =>
      prev.map((r) => (succeededIds.has(r.id) ? { ...r, payoutStatus: "paid" } : r))
    );
    if (failed.length > 0) {
      setActionError(
        `${failed.length} of ${pendingItems.length} could not be marked paid: ${failed[0].error}`
      );
    }
    setMarkingAll(false);
  }

  const thStyle = { color: COLORS.muted };
  const headingClass = `${isUr ? "font-urdu" : "font-display"}`;

  return (
    <div
      dir={isUr ? "rtl" : "ltr"}
      className="min-h-screen p-6 font-body"
      style={{ backgroundColor: COLORS.cream }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&family=Noto+Nastaliq+Urdu:wght@500;700&display=swap');
        .font-display { font-family: 'Fraunces', serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        .font-urdu { font-family: 'Noto Nastaliq Urdu', serif; }
      `}</style>

      <div className="flex flex-col gap-6">
        {/* Page header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className={`text-3xl ${headingClass}`} style={{ color: COLORS.ink }}>
              {t("agent.commissions.title")}
            </h1>
            <p className="mt-1.5 text-sm" style={{ color: COLORS.muted }}>
              {t("agent.commissions.subtitle")}
            </p>
          </div>
        </div>

        {/* Load error */}
        {loadError && (
          <div className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: COLORS.errorBg, color: COLORS.errorText }}>
            <div className="flex items-center gap-2">
              <AlertCircle size={16} />
              {(t("agent.commissions.loadError") || "Couldn't load commissions")}: {loadError}
            </div>
            <button
              onClick={fetchCommissions}
              className="rounded-lg border px-3 py-1 text-xs font-medium"
              style={{ borderColor: COLORS.errorText }}
            >
              {t("agent.commissions.retry") || "Retry"}
            </button>
          </div>
        )}

        {actionError && (
          <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: COLORS.errorBg, color: COLORS.errorText }}>
            <AlertCircle size={16} />
            {actionError}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border bg-white py-16 text-sm" style={{ borderColor: COLORS.border, color: COLORS.muted }}>
            <Loader2 size={18} className="animate-spin" />
            {t("agent.commissions.loading") || "Loading commissions…"}
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              <StatCard isUr={isUr} icon={Wallet} label={t("agent.commissions.stats.totalEarned")} value={formatAgentCurrency(totals.earned, t)} iconBg="#e2ecd9" iconColor={COLORS.leaf} />
              <StatCard isUr={isUr} icon={TrendingUp} label={t("agent.commissions.stats.paidOut")} value={formatAgentCurrency(totals.paid, t)} iconBg={COLORS.greige} iconColor={COLORS.forest} />
              <StatCard isUr={isUr} icon={Clock} label={t("agent.commissions.stats.pendingPayout")} value={formatAgentCurrency(totals.pending, t)} iconBg="#f5e6c5" iconColor={COLORS.goldDark} />
              <StatCard isUr={isUr} icon={Percent} label={t("agent.commissions.stats.avgRate")} value={`${totals.avgRate.toFixed(1)}%`} iconBg={COLORS.greige} iconColor={COLORS.muted} />
            </div>

            <div className="grid gap-6" style={{ gridTemplateColumns: "2fr 1fr" }}>
              {/* Commission table */}
              <div className="rounded-2xl border bg-white" style={{ borderColor: COLORS.border }}>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5" style={{ borderColor: COLORS.border }}>
                  <h2 className={`text-lg ${headingClass}`} style={{ color: COLORS.ink }}>
                    {t("agent.commissions.commissionHistory")}
                  </h2>
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center gap-2 rounded-lg border px-3 py-2" style={{ borderColor: COLORS.border }}>
                      <Search size={16} color={COLORS.iconMuted} />
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t("agent.common.searchOrderBuyer")}
                        className="w-44 border-none bg-transparent text-sm outline-none"
                        style={{ color: COLORS.ink }}
                      />
                    </div>
                    <div className="relative">
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="appearance-none rounded-lg border bg-white py-2 pl-3 pr-8 text-sm"
                        style={{ borderColor: COLORS.border, color: COLORS.ink }}
                      >
                        <option value="all">{t("agent.common.allStatuses")}</option>
                        <option value="paid">{t("agent.common.status.paid")}</option>
                        <option value="pending">{t("agent.common.status.pending")}</option>
                        <option value="reversed">{t("agent.common.status.reversed")}</option>
                      </select>
                      <ChevronDown size={16} color={COLORS.iconMuted} className="pointer-events-none absolute right-2.5 top-2.5" />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-medium" style={thStyle}>{t("agent.common.table.order")}</th>
                        <th className="px-5 py-3 text-left text-xs font-medium" style={thStyle}>{t("agent.common.table.consignment")}</th>
                        <th className="px-5 py-3 text-left text-xs font-medium" style={thStyle}>{t("agent.common.table.buyer")}</th>
                        <th className="px-5 py-3 text-left text-xs font-medium" style={thStyle}>{t("agent.common.table.saleAmount")}</th>
                        <th className="px-5 py-3 text-left text-xs font-medium" style={thStyle}>{t("agent.common.table.rate")}</th>
                        <th className="px-5 py-3 text-left text-xs font-medium" style={thStyle}>{t("agent.common.table.commission")}</th>
                        <th className="px-5 py-3 text-left text-xs font-medium" style={thStyle}>{t("agent.common.table.status")}</th>
                        <th className="px-5 py-3 text-left text-xs font-medium" style={thStyle} />
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r) => (
                        <tr key={r.id} className="border-t" style={{ borderColor: COLORS.border }}>
                          <td className="px-5 py-4 text-sm font-semibold" style={{ color: COLORS.ink }}>#{r.orderId}</td>
                          <td className="px-5 py-4 text-sm" style={{ color: COLORS.muted }}>#{r.consignedId}</td>
                          <td className="px-5 py-4 text-sm">{r.buyerName ? trader(r.buyerName) : "—"}</td>
                          <td className="px-5 py-4 text-sm">{formatAgentCurrency(r.saleAmount, t)}</td>
                          <td className="px-5 py-4 text-sm">{r.rate}%</td>
                          <td className="px-5 py-4 text-sm font-semibold" style={{ color: COLORS.ink }}>
                            {formatAgentCurrency(r.commissionAmount, t)}
                          </td>
                          <td className="px-5 py-4 text-sm">
                            <StatusBadge meta={STATUS_META[r.payoutStatus]} />
                          </td>
                          <td className="px-5 py-4 text-sm">
                            {r.payoutStatus === "pending" && (
                              <button
                                onClick={() => handleMarkPaid(r.id)}
                                disabled={markingId === r.id || markingAll}
                                className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-transform active:scale-[0.99] disabled:opacity-50"
                                style={{ borderColor: COLORS.leaf, color: COLORS.leaf }}
                              >
                                {markingId === r.id ? (
                                  <Loader2 size={13} className="animate-spin" />
                                ) : (
                                  <Check size={13} />
                                )}
                                {t("agent.commissions.markPaid") || "Mark Paid"}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {filtered.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-5 py-10 text-center text-sm" style={{ color: COLORS.muted }}>
                            {t("agent.commissions.noResults")}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Side column */}
              <div className="flex flex-col gap-6">
                {/* Pending payout — dark forest panel */}
                <div className="rounded-2xl p-6 text-white" style={{ backgroundColor: COLORS.forest }}>
                  <div className="mb-4 flex items-center gap-2">
                    <Clock size={20} color={COLORS.gold} />
                    <h3 className={`text-lg ${headingClass}`}>
                      {t("agent.commissions.pendingPayout")}
                    </h3>
                  </div>
                  {pendingPreview.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {pendingPreview.map((r) => (
                        <div key={r.id} className="flex justify-between text-sm">
                          <span style={{ color: "rgba(255,255,255,0.9)" }}>{r.buyerName ? trader(r.buyerName) : `#${r.orderId}`}</span>
                          <span className="font-semibold">{formatAgentCurrency(r.commissionAmount, t)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                      {t("agent.commissions.nothingPending")}
                    </p>
                  )}
                  <button
                    onClick={handleMarkAllPending}
                    disabled={pendingItems.length === 0 || markingAll}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-transform active:scale-[0.99] disabled:opacity-70"
                    style={{ backgroundColor: COLORS.gold, color: COLORS.forestDark }}
                  >
                    {markingAll && <Loader2 size={14} className="animate-spin" />}
                    {t("agent.commissions.markAllPending") || "Mark all pending as paid"}
                  </button>
                </div>

                {/* This month summary */}
                <div className="rounded-2xl border bg-white p-6" style={{ borderColor: COLORS.border }}>
                  <h3 className={`text-lg ${headingClass}`} style={{ color: COLORS.ink }}>
                    {t("agent.common.thisMonth")}
                  </h3>
                  <div className="mt-4 flex flex-col gap-3 text-sm">
                    <div className="flex justify-between">
                      <span style={{ color: COLORS.muted }}>{t("agent.commissions.thisMonth.ordersCommissioned")}</span>
                      <span className="font-semibold" style={{ color: COLORS.ink }}>{commissions.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: COLORS.muted }}>{t("agent.commissions.thisMonth.totalCommission")}</span>
                      <span className="font-semibold" style={{ color: COLORS.ink }}>{formatAgentCurrency(totals.earned, t)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: COLORS.muted }}>{t("agent.commissions.thisMonth.avgRate")}</span>
                      <span className="font-semibold" style={{ color: COLORS.ink }}>{totals.avgRate.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
