import { useEffect, useMemo, useState } from "react";
import { Search, Calendar, Loader2, Wheat, Coins, Receipt } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import Topbar from "./Topbar";
import { getSales } from "../handlers/sale";

/**
 * AdminSalesOverview.jsx
 *
 * Admin's read-only view of every sale recorded by every commission agent.
 * Per the V2 spec, Admin doesn't conduct sales or manage transactions — this
 * is a monitoring screen: filter by date range / status / search, and see
 * per-sale detail plus running totals for whatever's currently filtered.
 *
 * Visual system matches the rest of the admin section: Fraunces for display
 * type, Inter for body, Noto Nastaliq Urdu when RTL, forest/gold palette
 * via inline style, useLanguage()/t() for copy. Table layout (rather than
 * the card grid used on AdminAgents/AdminBuyersSuppliers) since financial
 * ledger rows scan better dense than as cards.
 *
 * Expects:
 *   getSales({ startDate, endDate, status, query }) from ../handlers/sale.js
 *     -> resolves to an array shaped roughly like:
 *        { id, sale_date, agent_name, buyer_name, items_count,
 *          total_amount, commission_amount, status }
 * sale.js is listed in the spec as "reuse/rename order.js" with no exact
 * admin-filtering signature given, so the filter params above are assumed —
 * adjust to match whatever routers/sale.py actually accepts.
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
  muted: "#6b7568",
  border: "#d9ddce",
  errorBg: "#faeaea",
  errorText: "#b5544a",
};

const STATUS_FILTERS = [
  { key: "all", labelKey: "admin.salesOverview.filters.all" },
  { key: "completed", labelKey: "admin.salesOverview.filters.completed" },
  { key: "in_progress", labelKey: "admin.salesOverview.filters.inProgress" },
];

const STATUS_BADGE = {
  completed: { bg: "#e8f0e4", color: "#1e4620" },
  in_progress: { bg: "#fdf3de", color: "#d99e2f" },
  draft: { bg: "#eef0e9", color: "#6b7568" },
};

const currency = (value) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

const count = (value) => new Intl.NumberFormat("en-PK").format(value ?? 0);

function StatusBadge({ status, t }) {
  const style = STATUS_BADGE[status] ?? STATUS_BADGE.draft;
  return (
    <span
      className="text-xs font-medium px-2.5 py-1 rounded-full inline-block"
      style={{ backgroundColor: style.bg, color: style.color }}
    >
      {t(`admin.salesOverview.status.${status}`)}
    </span>
  );
}

function SummaryCard({ icon: Icon, label, value, tone = "neutral" }) {
  const tones = {
    neutral: { bg: COLORS.greige, color: COLORS.ink },
    positive: { bg: "#e8f0e4", color: COLORS.forest },
    gold: { bg: "#fdf3de", color: COLORS.goldDark },
  };
  const { bg, color } = tones[tone];
  return (
    <div className="flex items-center gap-3 rounded-xl border p-4 flex-1 min-w-[190px]" style={{ borderColor: COLORS.border, backgroundColor: "white" }}>
      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
        <Icon size={17} color={color} />
      </div>
      <div className="min-w-0">
        <p className="text-xs" style={{ color: COLORS.muted }}>{label}</p>
        <p className="font-display text-xl truncate" style={{ color: COLORS.ink }}>{value}</p>
      </div>
    </div>
  );
}

export default function AdminSalesOverview() {
  const { t, isRTL } = useLanguage();
  const [sales, setSales] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("loading");
      try {
        const res = await getSales({
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          query: query.trim() || undefined,
        });
        if (cancelled) return;
        setSales(res ?? []);
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load sales:", err);
        setStatus("error");
      }
    }

    const debounce = setTimeout(load, query ? 300 : 0);
    return () => {
      cancelled = true;
      clearTimeout(debounce);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, statusFilter, startDate, endDate]);

  const totals = useMemo(
    () =>
      sales.reduce(
        (acc, s) => ({
          amount: acc.amount + (s.total_amount ?? 0),
          commission: acc.commission + (s.commission_amount ?? 0),
          count: acc.count + 1,
        }),
        { amount: 0, commission: 0, count: 0 }
      ),
    [sales]
  );

  return (
    <div className="min-h-screen w-full flex flex-col" style={{ backgroundColor: COLORS.cream }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&family=Noto+Nastaliq+Urdu:wght@500;700&display=swap');
        .font-display { font-family: 'Fraunces', serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        .font-urdu { font-family: 'Noto Nastaliq Urdu', serif; }
      `}</style>

      <Topbar />

      <div dir={isRTL ? "rtl" : "ltr"} className="flex-1 w-full font-body px-6 sm:px-12 py-10">
        <header className="pb-5 mb-6 border-b" style={{ borderColor: COLORS.border }}>
          <h1 className={`text-3xl mb-1 ${isRTL ? "font-urdu" : "font-display"}`} style={{ color: COLORS.ink }}>
            {t("admin.salesOverview.title")}
          </h1>
          <p className="text-sm max-w-[52ch]" style={{ color: COLORS.muted }}>
            {t("admin.salesOverview.subtitle")}
          </p>
        </header>

        {status === "ready" && (
          <div className="flex flex-wrap gap-3 mb-6">
            <SummaryCard icon={Receipt} label={t("admin.salesOverview.summary.sales")} value={count(totals.count)} />
            <SummaryCard icon={Wheat} label={t("admin.salesOverview.summary.totalAmount")} value={currency(totals.amount)} tone="positive" />
            <SummaryCard icon={Coins} label={t("admin.salesOverview.summary.commission")} value={currency(totals.commission)} tone="gold" />
          </div>
        )}

        <div className="flex flex-wrap items-end gap-3 mb-5">
          <div className="relative flex-1 min-w-[220px]">
            <label className="text-xs font-medium mb-1.5 block" style={{ color: COLORS.muted }}>
              {t("admin.salesOverview.searchLabel")}
            </label>
            <Search
              size={15}
              className={`absolute top-[calc(50%+0.55rem)] -translate-y-1/2 ${isRTL ? "right-3" : "left-3"}`}
              color={COLORS.muted}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("admin.salesOverview.searchPlaceholder")}
              className={`w-full py-2 rounded-lg border text-sm outline-none focus:ring-2 ${
                isRTL ? "pr-9 pl-3" : "pl-9 pr-3"
              }`}
              style={{ borderColor: COLORS.border, backgroundColor: "white" }}
            />
          </div>

          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: COLORS.muted }}>
              {t("admin.salesOverview.fromLabel")}
            </label>
            <div className="relative">
              <Calendar size={14} className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "right-3" : "left-3"}`} color={COLORS.muted} />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`py-2 rounded-lg border text-sm outline-none focus:ring-2 ${isRTL ? "pr-9 pl-3" : "pl-9 pr-3"}`}
                style={{ borderColor: COLORS.border, backgroundColor: "white" }}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: COLORS.muted }}>
              {t("admin.salesOverview.toLabel")}
            </label>
            <div className="relative">
              <Calendar size={14} className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "right-3" : "left-3"}`} color={COLORS.muted} />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`py-2 rounded-lg border text-sm outline-none focus:ring-2 ${isRTL ? "pr-9 pl-3" : "pl-9 pr-3"}`}
                style={{ borderColor: COLORS.border, backgroundColor: "white" }}
              />
            </div>
          </div>
        </div>

        <div className="inline-flex gap-1 mb-5">
          {STATUS_FILTERS.map(({ key, labelKey }) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className="text-xs font-medium py-1.5 px-3 rounded-full border transition-colors"
              style={
                statusFilter === key
                  ? { backgroundColor: COLORS.ink, color: "white", borderColor: COLORS.ink }
                  : { color: COLORS.muted, borderColor: COLORS.border }
              }
            >
              {t(labelKey)}
            </button>
          ))}
        </div>

        {status === "loading" && (
          <div className="flex items-center justify-center gap-2 py-16 text-sm" style={{ color: COLORS.muted }}>
            <Loader2 size={16} className="animate-spin" />
            {t("admin.salesOverview.loading")}
          </div>
        )}

        {status === "error" && (
          <div className="text-sm rounded-lg px-4 py-3" style={{ backgroundColor: COLORS.errorBg, color: COLORS.errorText }}>
            {t("admin.salesOverview.loadError")}
          </div>
        )}

        {status === "ready" && sales.length === 0 && (
          <div
            className="text-sm rounded-xl px-4 py-10 text-center border"
            style={{ borderColor: COLORS.border, color: COLORS.muted }}
          >
            {t("admin.salesOverview.empty")}
          </div>
        )}

        {status === "ready" && sales.length > 0 && (
          <div className="rounded-xl border overflow-x-auto" style={{ borderColor: COLORS.border, backgroundColor: "white" }}>
            <table className="w-full text-sm" style={{ minWidth: 720 }}>
              <thead>
                <tr className="border-b" style={{ borderColor: COLORS.border }}>
                  {[
                    "saleId",
                    "date",
                    "agent",
                    "buyer",
                    "items",
                    "amount",
                    "commission",
                    "status",
                  ].map((col) => (
                    <th
                      key={col}
                      className={`px-4 py-3 font-medium ${isRTL ? "text-right" : "text-left"}`}
                      style={{ color: COLORS.muted }}
                    >
                      {t(`admin.salesOverview.columns.${col}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id} className="border-b last:border-b-0" style={{ borderColor: COLORS.border }}>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: COLORS.muted }}>
                      #{sale.id}
                    </td>
                    <td className="px-4 py-3" style={{ color: COLORS.ink }}>
                      {sale.sale_date
                        ? new Date(sale.sale_date).toLocaleDateString(isRTL ? "ur-PK" : "en-PK")
                        : "—"}
                    </td>
                    <td className="px-4 py-3" style={{ color: COLORS.ink }}>{sale.agent_name ?? "—"}</td>
                    <td className="px-4 py-3" style={{ color: COLORS.ink }}>{sale.buyer_name ?? "—"}</td>
                    <td className="px-4 py-3" style={{ color: COLORS.muted }}>{count(sale.items_count)}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: COLORS.ink }}>
                      {currency(sale.total_amount)}
                    </td>
                    <td className="px-4 py-3" style={{ color: COLORS.goldDark }}>
                      {currency(sale.commission_amount)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={sale.status ?? "draft"} t={t} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}