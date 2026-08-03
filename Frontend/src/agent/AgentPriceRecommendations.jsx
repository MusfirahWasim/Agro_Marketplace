import { useMemo, useState } from "react";
import {
  Sparkles,
  Target,
  ChevronDown,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  AlertCircle,
} from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { localizeProduct, localizeReason, formatAgentCurrency } from "./agentLocale";

/**
 * AgentPriceRecommendations.jsx
 *
 * *** NOT WIRED TO A REAL API — SEE NOTE BELOW ***
 * This screen needs AI-generated pricing suggestions based on demand/market
 * trends. There is no such endpoint anywhere in the handler layer (account,
 * admin, auth, commission, consignment, order, party, payment, supply) —
 * nothing resembling a pricing-insight or ML service. Rather than fabricate
 * a fake API call to something that doesn't exist, this still runs on
 * PLACEHOLDER_RECOMMENDATIONS below, with a visible in-UI banner so it's
 * never mistaken for live data. Restyled to the token system in the
 * meantime since it's one of the 5 flagged files. Needs a decision: build
 * a real AI endpoint, build a simpler non-AI heuristic from real order/
 * consignment price history, or deprioritize this screen.
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
  border: "#d9ddce",
  muted: "#6b7568",
  iconMuted: "#909685",
  errorBg: "#faeaea",
  errorText: "#b5544a",
};

const PLACEHOLDER_RECOMMENDATIONS = [
  { id: 1, product: "Tomatoes", currentPrice: 85, recommendedPrice: 96, trend: "up", confidence: "high", reason: "Local supply tightening, demand steady" },
  { id: 2, product: "Basmati Rice", currentPrice: 210, recommendedPrice: 208, trend: "flat", confidence: "medium", reason: "Price stable across nearby markets" },
  { id: 3, product: "Red Onions", currentPrice: 60, recommendedPrice: 52, trend: "down", confidence: "high", reason: "New harvest arriving, prices softening" },
  { id: 4, product: "Potatoes", currentPrice: 45, recommendedPrice: 49, trend: "up", confidence: "medium", reason: "Buyer orders trending up this week" },
  { id: 5, product: "Green Chillies", currentPrice: 140, recommendedPrice: 158, trend: "up", confidence: "high", reason: "Low stock across consignments citywide" },
  { id: 6, product: "Wheat", currentPrice: 98, recommendedPrice: 98, trend: "flat", confidence: "low", reason: "Insufficient recent sales data" },
  { id: 7, product: "Mangoes (Sindhri)", currentPrice: 165, recommendedPrice: 149, trend: "down", confidence: "medium", reason: "Season peak — supply increasing fast" },
];

function TrendBadge({ meta }) {
  const Icon = meta.icon;
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: meta.bg, color: meta.color }}>
      <Icon size={13} />
      {meta.label}
    </span>
  );
}

function ConfidenceBadge({ meta }) {
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: meta.bg, color: meta.text }}>
      {meta.label}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, iconBg, iconColor, isUr }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: COLORS.border }}>
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full" style={{ background: iconBg }}>
        <Icon size={20} color={iconColor} strokeWidth={2} />
      </div>
      <div className={`text-2xl ${isUr ? "font-urdu" : "font-display"}`} style={{ color: COLORS.ink }}>{value}</div>
      <div className="mt-1 text-sm" style={{ color: COLORS.muted }}>{label}</div>
    </div>
  );
}

export default function AgentPriceRecommendations() {
  const { language, t } = useLanguage();
  const isUr = language === "ur";
  const headingClass = isUr ? "font-urdu" : "font-display";
  const product = (name) => localizeProduct(name, language);
  const reason = (text) => localizeReason(text, language);
  const [query, setQuery] = useState("");
  const [trendFilter, setTrendFilter] = useState("all");

  const TREND_META = {
    up: { label: t("agent.priceRecommendations.trend.up"), icon: ArrowUpRight, color: "#3f6b32", bg: "#e2ecd9" },
    down: { label: t("agent.priceRecommendations.trend.down"), icon: ArrowDownRight, color: COLORS.errorText, bg: COLORS.errorBg },
    flat: { label: t("agent.priceRecommendations.trend.flat"), icon: Minus, color: "#8a6413", bg: "#f5e6c5" },
  };

  const CONFIDENCE_META = {
    high: { label: t("agent.priceRecommendations.confidenceLabel.high"), text: "#3f6b32", bg: "#e2ecd9" },
    medium: { label: t("agent.priceRecommendations.confidenceLabel.medium"), text: "#8a6413", bg: "#f5e6c5" },
    low: { label: t("agent.priceRecommendations.confidenceLabel.low"), text: COLORS.muted, bg: COLORS.greige },
  };

  const rows = useMemo(
    () =>
      PLACEHOLDER_RECOMMENDATIONS.map((r) => ({
        ...r,
        delta: r.recommendedPrice - r.currentPrice,
        deltaPct: Math.round(((r.recommendedPrice - r.currentPrice) / r.currentPrice) * 100),
      })),
    []
  );

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const q = query.toLowerCase();
      const matchesQuery = r.product.toLowerCase().includes(q) || product(r.product).includes(query);
      const matchesTrend = trendFilter === "all" || r.trend === trendFilter;
      return matchesQuery && matchesTrend;
    });
  }, [rows, query, trendFilter, language]);

  const totals = useMemo(() => {
    const risingCount = rows.filter((r) => r.trend === "up").length;
    const fallingCount = rows.filter((r) => r.trend === "down").length;
    const highConfidence = rows.filter((r) => r.confidence === "high").length;
    const avgUplift = rows.length ? Math.round(rows.reduce((s, r) => s + r.deltaPct, 0) / rows.length) : 0;
    return { risingCount, fallingCount, highConfidence, avgUplift };
  }, [rows]);

  const topOpportunities = rows
    .filter((r) => r.trend === "up")
    .sort((a, b) => b.deltaPct - a.deltaPct)
    .slice(0, 4);

  return (
    <div dir={isUr ? "rtl" : "ltr"} className="min-h-screen p-6 font-body" style={{ backgroundColor: COLORS.cream }}>
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
            <h1 className={`text-3xl ${headingClass}`} style={{ color: COLORS.ink }}>{t("agent.priceRecommendations.title")}</h1>
            <p className="mt-1.5 text-sm" style={{ color: COLORS.muted }}>{t("agent.priceRecommendations.subtitle")}</p>
          </div>
        </div>

        {/* Not-wired banner — remove once a real endpoint exists */}
        <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: "#f5e6c5", color: "#8a6413" }}>
          <AlertCircle size={16} />
          {t("agent.priceRecommendations.previewNotice") || "Preview data — not yet connected to a live pricing endpoint."}
        </div>

        {/* Stat cards */}
        <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <StatCard isUr={isUr} icon={ArrowUpRight} label={t("agent.priceRecommendations.stats.trendingUp")} value={totals.risingCount} iconBg="#e2ecd9" iconColor={COLORS.leaf} />
          <StatCard isUr={isUr} icon={ArrowDownRight} label={t("agent.priceRecommendations.stats.trendingDown")} value={totals.fallingCount} iconBg={COLORS.errorBg} iconColor={COLORS.errorText} />
          <StatCard isUr={isUr} icon={Target} label={t("agent.priceRecommendations.stats.highConfidence")} value={totals.highConfidence} iconBg="#f5e6c5" iconColor={COLORS.goldDark} />
          <StatCard isUr={isUr} icon={Sparkles} label={t("agent.priceRecommendations.stats.avgSuggestedChange")} value={`${totals.avgUplift > 0 ? "+" : ""}${totals.avgUplift}%`} iconBg={COLORS.greige} iconColor={COLORS.forest} />
        </div>

        <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 340px" }}>
          {/* Recommendations table */}
          <div className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: COLORS.border }}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5" style={{ borderColor: COLORS.border }}>
              <h2 className={`text-lg ${headingClass}`} style={{ color: COLORS.ink }}>{t("agent.priceRecommendations.suggestedPricing")}</h2>
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-2 rounded-lg border px-3 py-2" style={{ borderColor: COLORS.border }}>
                  <Search size={16} color={COLORS.iconMuted} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("agent.common.searchProduct")}
                    className="w-44 border-none bg-transparent text-sm outline-none"
                    style={{ color: COLORS.ink }}
                  />
                </div>
                <div className="relative">
                  <select
                    value={trendFilter}
                    onChange={(e) => setTrendFilter(e.target.value)}
                    className="appearance-none rounded-lg border bg-white py-2 pl-3 pr-8 text-sm"
                    style={{ borderColor: COLORS.border, color: COLORS.ink }}
                  >
                    <option value="all">{t("agent.common.allTrends")}</option>
                    <option value="up">{t("agent.priceRecommendations.trend.up")}</option>
                    <option value="down">{t("agent.priceRecommendations.trend.down")}</option>
                    <option value="flat">{t("agent.priceRecommendations.trend.flat")}</option>
                  </select>
                  <ChevronDown size={16} color={COLORS.iconMuted} className="pointer-events-none absolute right-2.5 top-2.5" />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium" style={{ color: COLORS.muted }}>{t("agent.common.table.product")}</th>
                    <th className="px-5 py-3 text-left text-xs font-medium" style={{ color: COLORS.muted }}>{t("agent.common.table.currentPrice")}</th>
                    <th className="px-5 py-3 text-left text-xs font-medium" style={{ color: COLORS.muted }}>{t("agent.common.table.recommended")}</th>
                    <th className="px-5 py-3 text-left text-xs font-medium" style={{ color: COLORS.muted }}>{t("agent.common.table.change")}</th>
                    <th className="px-5 py-3 text-left text-xs font-medium" style={{ color: COLORS.muted }}>{t("agent.common.table.trend")}</th>
                    <th className="px-5 py-3 text-left text-xs font-medium" style={{ color: COLORS.muted }}>{t("agent.common.table.confidence")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-t" style={{ borderColor: COLORS.border }}>
                      <td className="px-5 py-4 text-sm font-semibold" style={{ color: COLORS.ink }}>
                        {product(r.product)}
                        <div className="mt-0.5 text-xs font-normal" style={{ color: COLORS.muted }}>{reason(r.reason)}</div>
                      </td>
                      <td className="px-5 py-4 text-sm">{formatAgentCurrency(r.currentPrice, t)}</td>
                      <td className="px-5 py-4 text-sm font-semibold" style={{ color: COLORS.ink }}>{formatAgentCurrency(r.recommendedPrice, t)}</td>
                      <td className="px-5 py-4 text-sm" style={{ color: r.delta > 0 ? "#3f6b32" : r.delta < 0 ? COLORS.errorText : COLORS.muted }}>
                        {r.delta > 0 ? "+" : ""}{r.delta} ({r.deltaPct > 0 ? "+" : ""}{r.deltaPct}%)
                      </td>
                      <td className="px-5 py-4 text-sm">
                        <TrendBadge meta={TREND_META[r.trend]} />
                      </td>
                      <td className="px-5 py-4 text-sm">
                        <ConfidenceBadge meta={CONFIDENCE_META[r.confidence]} />
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-sm" style={{ color: COLORS.muted }}>
                        {t("agent.priceRecommendations.noResults")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Side column */}
          <div className="flex flex-col gap-6">
            {/* Top opportunities — dark forest panel */}
            <div className="rounded-2xl p-6 text-white" style={{ backgroundColor: COLORS.forest }}>
              <div className="mb-4 flex items-center gap-2">
                <Sparkles size={20} color={COLORS.gold} />
                <h3 className={`text-lg ${headingClass}`}>{t("agent.priceRecommendations.topOpportunities")}</h3>
              </div>
              {topOpportunities.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {topOpportunities.map((r) => (
                    <div key={r.id} className="flex justify-between text-sm">
                      <span style={{ color: "rgba(255,255,255,0.9)" }}>{product(r.product)}</span>
                      <span className="font-semibold">+{r.deltaPct}%</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>{t("agent.priceRecommendations.noUpward")}</p>
              )}
              {/* Not wired — "applying" a suggested price would mean
                  calling updateSupply()/creating a consignment with that
                  selling_price_per_unit, but there's no real recommendation
                  behind this data yet, so no action is attached until
                  there is. */}
              <button
                disabled
                className="mt-5 w-full cursor-not-allowed rounded-lg py-2.5 text-sm font-medium opacity-60"
                style={{ backgroundColor: COLORS.gold, color: COLORS.forestDark }}
                title={t("agent.priceRecommendations.notYetConnected") || "Not yet connected to a live endpoint"}
              >
                {t("agent.priceRecommendations.applySuggestedPrices")}
              </button>
            </div>

            {/* Insight summary */}
            <div className="rounded-2xl border bg-white p-6" style={{ borderColor: COLORS.border }}>
              <h3 className={`text-lg ${headingClass}`} style={{ color: COLORS.ink }}>{t("agent.priceRecommendations.howThisWorks")}</h3>
              <p className="mt-3 text-xs leading-relaxed" style={{ color: COLORS.muted }}>{t("agent.priceRecommendations.howThisWorksBody")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
