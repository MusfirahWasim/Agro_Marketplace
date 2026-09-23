import { useEffect, useMemo, useState } from "react";
import { Search, Calendar, Loader2, Coins, Receipt, TrendingUp } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import Topbar from "./Topbar";
import { getCommissions } from "../handlers/commission";

/**
 * AdminCommissionsOverview.jsx
 *
 * Admin's read-only view of commission earned across all agents. Shows a
 * per-agent breakdown (who's earning what share of total commission) above
 * a detailed, filterable ledger of individual commission entries — one row
 * per sale_item, per the spec's "commission trigger fires per sale_item".
 *
 * Visual system matches the rest of the admin section: Fraunces for display
 * type, Inter for body, Noto Nastaliq Urdu when RTL, forest/gold palette
 * via inline style, useLanguage()/t() for copy. Table layout for the ledger,
 * same as AdminSalesOverview, since these are dense financial rows.
 *
 * Expects:
 *   getCommissions({ startDate, endDate, query }) from ../handlers/commission.js
 *     -> resolves to an array shaped roughly like:
 *        { id, created_at, agent_id, agent_name, sale_id, buyer_name,
 *          sale_amount, rate, commission_amount }
 * The per-agent breakdown is computed client-side from this same array
 * rather than calling a separate endpoint — simplest option given the spec
 * doesn't name an aggregate-by-agent handler. Swap to a server-aggregated
 * call if the commission volume ever makes client-side summing too slow.
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

const currency = (value) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

const count = (value) => new Intl.NumberFormat("en-PK").format(value ?? 0);

const percent = (value) =>
  new Intl.NumberFormat("en-PK", { style: "percent", maximumFractionDigits: 1 }).format(value ?? 0);

function initials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function SummaryCard({ icon: Icon, label, value, tone = "neutral" }) {
  const tones = {
    neutral: { bg: COLORS.greige, color: COLORS.ink },
    positive: { bg: "#e8f0e4", color: COLORS.forest },
    gold: { bg: "#fdf3de", color: COLORS.goldDark },
  };
  const { bg, color } = tones[tone];
  return (
    <div
      className="flex items-center gap-3 rounded-xl border p-4 flex-1 min-w-[190px]"
      style={{ borderColor: COLORS.border, backgroundColor: "white" }}
    >
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

function AgentBreakdownRow({ agent, maxAmount, t, isRTL }) {
  const widthPct = maxAmount > 0 ? Math.max(4, (agent.total / maxAmount) * 100) : 0;
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-medium"
        style={{ backgroundColor: COLORS.greige, color: COLORS.ink }}
      >
        {initials(agent.name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-sm truncate" style={{ color: COLORS.ink }}>{agent.name}</span>
          <span className="text-sm font-medium whitespace-nowrap" style={{ color: COLORS.goldDark }}>
            {currency(agent.total)}
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: COLORS.greige }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${widthPct}%`,
              backgroundColor: COLORS.gold,
              [isRTL ? "marginRight" : "marginLeft"]: isRTL ? "auto" : 0,
            }}
          />
        </div>
      </div>
      <span className="text-xs whitespace-nowrap w-16 text-right shrink-0" style={{ color: COLORS.muted }}>
        {t("admin.commissionsOverview.breakdown.salesCount", { count: agent.count })}
      </span>
    </div>
  );
}

export default function AdminCommissionsOverview() {
  const { t, isRTL } = useLanguage();
  const [commissions, setCommissions] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [query, setQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("loading");
      try {
        const res = await getCommissions({
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          query: query.trim() || undefined,
        });
        if (cancelled) return;
        setCommissions(res ?? []);
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load commissions:", err);
        setStatus("error");
      }
    }

    const debounce = setTimeout(load, query ? 300 : 0);
    return () => {
      cancelled = true;
      clearTimeout(debounce);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, startDate, endDate]);

  const totals = useMemo(
    () =>
      commissions.reduce(
        (acc, c) => ({
          amount: acc.amount + (c.commission_amount ?? 0),
          salesAmount: acc.salesAmount + (c.sale_amount ?? 0),
          count: acc.count + 1,
        }),
        { amount: 0, salesAmount: 0, count: 0 }
      ),
    [commissions]
  );

  const avgRate = totals.salesAmount > 0 ? totals.amount / totals.salesAmount : 0;

  const byAgent = useMemo(() => {
    const map = new Map();
    for (const c of commissions) {
      const key = c.agent_id ?? c.agent_name ?? "unknown";
      const entry = map.get(key) ?? { name: c.agent_name ?? "—", total: 0, count: 0 };
      entry.total += c.commission_amount ?? 0;
      entry.count += 1;
      map.set(key, entry);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [commissions]);

  const maxAgentTotal = byAgent[0]?.total ?? 0;

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
            {t("admin.commissionsOverview.title")}
          </h1>
          <p className="text-sm max-w-[52ch]" style={{ color: COLORS.muted }}>
            {t("admin.commissionsOverview.subtitle")}
          </p>
        </header>

        {status === "ready" && (
          <div className="flex flex-wrap gap-3 mb-6">
            <SummaryCard icon={Coins} label={t("admin.commissionsOverview.summary.totalCommission")} value={currency(totals.amount)} tone="gold" />
            <SummaryCard icon={Receipt} label={t("admin.commissionsOverview.summary.entries")} value={count(totals.count)} />
            <SummaryCard icon={TrendingUp} label={t("admin.commissionsOverview.summary.avgRate")} value={percent(avgRate)} tone="positive" />
          </div>
        )}

        {status === "ready" && byAgent.length > 0 && (
          <div className="rounded-xl border p-4 mb-6" style={{ borderColor: COLORS.border, backgroundColor: "white" }}>
            <h2 className="font-display text-lg mb-1" style={{ color: COLORS.ink }}>
              {t("admin.commissionsOverview.breakdown.title")}
            </h2>
            <p className="text-xs mb-2" style={{ color: COLORS.muted }}>
              {t("admin.commissionsOverview.breakdown.subtitle")}
            </p>
            <div className="divide-y" style={{ borderColor: COLORS.border }}>
              {byAgent.map((agent) => (
                <AgentBreakdownRow key={agent.name} agent={agent} maxAmount={maxAgentTotal} t={t} isRTL={isRTL} />
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-end gap-3 mb-5">
          <div className="relative flex-1 min-w-[220px]">
            <label className="text-xs font-medium mb-1.5 block" style={{ color: COLORS.muted }}>
              {t("admin.commissionsOverview.searchLabel")}
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
              placeholder={t("admin.commissionsOverview.searchPlaceholder")}
              className={`w-full py-2 rounded-lg border text-sm outline-none focus:ring-2 ${
                isRTL ? "pr-9 pl-3" : "pl-9 pr-3"
              }`}
              style={{ borderColor: COLORS.border, backgroundColor: "white" }}
            />
          </div>

          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: COLORS.muted }}>
              {t("admin.commissionsOverview.fromLabel")}
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
              {t("admin.commissionsOverview.toLabel")}
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

        {status === "loading" && (
          <div className="flex items-center justify-center gap-2 py-16 text-sm" style={{ color: COLORS.muted }}>
            <Loader2 size={16} className="animate-spin" />
            {t("admin.commissionsOverview.loading")}
          </div>
        )}

        {status === "error" && (
          <div className="text-sm rounded-lg px-4 py-3" style={{ backgroundColor: COLORS.errorBg, color: COLORS.errorText }}>
            {t("admin.commissionsOverview.loadError")}
          </div>
        )}

        {status === "ready" && commissions.length === 0 && (
          <div
            className="text-sm rounded-xl px-4 py-10 text-center border"
            style={{ borderColor: COLORS.border, color: COLORS.muted }}
          >
            {t("admin.commissionsOverview.empty")}
          </div>
        )}

        {status === "ready" && commissions.length > 0 && (
          <div className="rounded-xl border overflow-x-auto" style={{ borderColor: COLORS.border, backgroundColor: "white" }}>
            <table className="w-full text-sm" style={{ minWidth: 760 }}>
              <thead>
                <tr className="border-b" style={{ borderColor: COLORS.border }}>
                  {["date", "agent", "saleId", "buyer", "saleAmount", "rate", "commission"].map((col) => (
                    <th
                      key={col}
                      className={`px-4 py-3 font-medium ${isRTL ? "text-right" : "text-left"}`}
                      style={{ color: COLORS.muted }}
                    >
                      {t(`admin.commissionsOverview.columns.${col}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {commissions.map((c) => (
                  <tr key={c.id} className="border-b last:border-b-0" style={{ borderColor: COLORS.border }}>
                    <td className="px-4 py-3" style={{ color: COLORS.ink }}>
                      {c.created_at
                        ? new Date(c.created_at).toLocaleDateString(isRTL ? "ur-PK" : "en-PK")
                        : "—"}
                    </td>
                    <td className="px-4 py-3" style={{ color: COLORS.ink }}>{c.agent_name ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: COLORS.muted }}>
                      #{c.sale_id ?? "—"}
                    </td>
                    <td className="px-4 py-3" style={{ color: COLORS.ink }}>{c.buyer_name ?? "—"}</td>
                    <td className="px-4 py-3" style={{ color: COLORS.muted }}>{currency(c.sale_amount)}</td>
                    <td className="px-4 py-3" style={{ color: COLORS.muted }}>{percent(c.rate)}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: COLORS.goldDark }}>
                      {currency(c.commission_amount)}
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