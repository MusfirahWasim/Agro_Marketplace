import { useMemo, useState } from "react";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Target,
  ChevronDown,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";

/**
 * AgentPriceRecommendations.jsx
 * Commission Agent — AI-suggested pricing per product based on recent
 * demand and market movement, to help the agent price consigned stock
 * competitively while protecting margin.
 *
 * Styling note: this file uses plain inline styles (same approach as the
 * other agent pages — AgentInventory.jsx, AgentCommissions.jsx,
 * AgentSettlements.jsx, AgentConsignmentIntake.jsx) instead of Tailwind
 * classes, so the theme renders correctly even if Tailwind isn't set
 * up/scanning this file yet.
 *
 * Palette (sampled from the dashboard reference screenshot):
 *  - Page background   #faf8f2
 *  - Card background    #ffffff
 *  - Card border         #ece8de
 *  - Deep forest green   #1e4620
 *  - Sage/leaf green     #4c8b3c
 *  - Honey gold          #f0b84c
 *  - Heading text        #16211a
 *
 * Data below is illustrative — swap MOCK_RECOMMENDATIONS for a call to
 * lib/api.js (e.g. getAgentPriceRecommendations()) once the AI insights
 * endpoint is wired up.
 */

const COLORS = {
  pageBg: "#faf8f2",
  card: "#ffffff",
  border: "#ece8de",
  forest: "#1e4620",
  sage: "#4c8b3c",
  gold: "#f0b84c",
  goldHover: "#e5aa38",
  heading: "#16211a",
  bodyText: "#5b6660",
  mutedText: "#8b948d",
};

const MOCK_RECOMMENDATIONS = [
  { id: "REC-01", product: "Tomatoes", currentPrice: 85, recommendedPrice: 96, trend: "up", confidence: "high", reason: "Local supply tightening, demand steady" },
  { id: "REC-02", product: "Basmati Rice", currentPrice: 210, recommendedPrice: 208, trend: "flat", confidence: "medium", reason: "Price stable across nearby markets" },
  { id: "REC-03", product: "Red Onions", currentPrice: 60, recommendedPrice: 52, trend: "down", confidence: "high", reason: "New harvest arriving, prices softening" },
  { id: "REC-04", product: "Potatoes", currentPrice: 45, recommendedPrice: 49, trend: "up", confidence: "medium", reason: "Buyer orders trending up this week" },
  { id: "REC-05", product: "Green Chillies", currentPrice: 140, recommendedPrice: 158, trend: "up", confidence: "high", reason: "Low stock across consignments citywide" },
  { id: "REC-06", product: "Wheat", currentPrice: 98, recommendedPrice: 98, trend: "flat", confidence: "low", reason: "Insufficient recent sales data" },
  { id: "REC-07", product: "Mangoes (Sindhri)", currentPrice: 165, recommendedPrice: 149, trend: "down", confidence: "medium", reason: "Season peak — supply increasing fast" },
];

const TREND_META = {
  up: { label: "Rising", icon: ArrowUpRight, color: "#4b6b3f", bg: "#dde8d0" },
  down: { label: "Falling", icon: ArrowDownRight, color: "#b15a41", bg: "#f4d9d0" },
  flat: { label: "Stable", icon: Minus, color: "#8a6413", bg: "#f5e6c5" },
};

const CONFIDENCE_META = {
  high: { label: "High confidence", text: "#4b6b3f", bg: "#dde8d0" },
  medium: { label: "Medium confidence", text: "#8a6413", bg: "#f5e6c5" },
  low: { label: "Low confidence", text: "#8b948d", bg: "#f1efe9" },
};

function TrendBadge({ trend }) {
  const meta = TREND_META[trend];
  const Icon = meta.icon;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        borderRadius: 999,
        padding: "4px 10px",
        fontSize: 12,
        fontWeight: 500,
        background: meta.bg,
        color: meta.color,
      }}
    >
      <Icon size={13} />
      {meta.label}
    </span>
  );
}

function ConfidenceBadge({ confidence }) {
  const meta = CONFIDENCE_META[confidence];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 999,
        padding: "4px 10px",
        fontSize: 12,
        fontWeight: 500,
        background: meta.bg,
        color: meta.text,
      }}
    >
      {meta.label}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, iconBg, iconColor }) {
  return (
    <div
      style={{
        borderRadius: 16,
        border: `1px solid ${COLORS.border}`,
        background: COLORS.card,
        padding: 20,
        boxShadow: "0 1px 2px rgba(20,20,10,0.04)",
      }}
    >
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          height: 40,
          width: 40,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          background: iconBg,
        }}
      >
        <Icon size={20} color={iconColor} strokeWidth={2} />
      </div>
      <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 24, color: COLORS.heading }}>
        {value}
      </div>
      <div style={{ marginTop: 4, fontSize: 14, color: COLORS.mutedText }}>{label}</div>
    </div>
  );
}

export default function AgentPriceRecommendations() {
  const [query, setQuery] = useState("");
  const [trendFilter, setTrendFilter] = useState("all");

  const rows = useMemo(
    () =>
      MOCK_RECOMMENDATIONS.map((r) => ({
        ...r,
        delta: r.recommendedPrice - r.currentPrice,
        deltaPct: Math.round(((r.recommendedPrice - r.currentPrice) / r.currentPrice) * 100),
      })),
    []
  );

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const q = query.toLowerCase();
      const matchesQuery = r.product.toLowerCase().includes(q);
      const matchesTrend = trendFilter === "all" || r.trend === trendFilter;
      return matchesQuery && matchesTrend;
    });
  }, [rows, query, trendFilter]);

  const totals = useMemo(() => {
    const risingCount = rows.filter((r) => r.trend === "up").length;
    const fallingCount = rows.filter((r) => r.trend === "down").length;
    const highConfidence = rows.filter((r) => r.confidence === "high").length;
    const avgUplift =
      rows.length
        ? Math.round(rows.reduce((s, r) => s + r.deltaPct, 0) / rows.length)
        : 0;
    return { risingCount, fallingCount, highConfidence, avgUplift };
  }, [rows]);

  const topOpportunities = rows
    .filter((r) => r.trend === "up")
    .sort((a, b) => b.deltaPct - a.deltaPct)
    .slice(0, 4);

  const thStyle = { padding: "12px 20px", fontWeight: 500, fontSize: 13, color: COLORS.mutedText, textAlign: "left" };
  const tdStyle = { padding: "16px 20px", fontSize: 14, color: "#33403a" };

  return (
    <div style={{ background: COLORS.pageBg, padding: 24, fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Page header */}
        <div>
          <h1
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: 30,
              color: COLORS.heading,
              margin: 0,
            }}
          >
            Price recommendations
          </h1>
          <p style={{ marginTop: 6, color: COLORS.bodyText, fontSize: 14 }}>
            AI-suggested pricing based on recent demand and market movement across your consignments.
          </p>
        </div>

        {/* Stat cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 20,
          }}
        >
          <StatCard icon={TrendingUp} label="Products trending up" value={totals.risingCount} iconBg="#dde8d0" iconColor={COLORS.sage} />
          <StatCard icon={TrendingDown} label="Products trending down" value={totals.fallingCount} iconBg="#e8cdc2" iconColor="#b15a41" />
          <StatCard icon={Target} label="High-confidence calls" value={totals.highConfidence} iconBg="#f6ddab" iconColor="#c9922c" />
          <StatCard icon={Sparkles} label="Avg. suggested change" value={`${totals.avgUplift > 0 ? "+" : ""}${totals.avgUplift}%`} iconBg="#dde8d0" iconColor={COLORS.sage} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
          {/* Recommendations table */}
          <div
            style={{
              borderRadius: 16,
              border: `1px solid ${COLORS.border}`,
              background: COLORS.card,
              boxShadow: "0 1px 2px rgba(20,20,10,0.04)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                borderBottom: `1px solid ${COLORS.border}`,
                padding: 20,
                flexWrap: "wrap",
              }}
            >
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 18, color: COLORS.heading, margin: 0 }}>
                Suggested pricing
              </h2>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 8,
                    padding: "8px 12px",
                  }}
                >
                  <Search size={16} color={COLORS.mutedText} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search product"
                    style={{
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      fontSize: 14,
                      width: 180,
                      color: "#33403a",
                    }}
                  />
                </div>
                <div style={{ position: "relative" }}>
                  <select
                    value={trendFilter}
                    onChange={(e) => setTrendFilter(e.target.value)}
                    style={{
                      appearance: "none",
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: 8,
                      padding: "8px 32px 8px 12px",
                      fontSize: 14,
                      color: "#33403a",
                      background: "#fff",
                    }}
                  >
                    <option value="all">All trends</option>
                    <option value="up">Rising</option>
                    <option value="down">Falling</option>
                    <option value="flat">Stable</option>
                  </select>
                  <ChevronDown
                    size={16}
                    color={COLORS.mutedText}
                    style={{ position: "absolute", right: 10, top: 10, pointerEvents: "none" }}
                  />
                </div>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Product</th>
                    <th style={thStyle}>Current price</th>
                    <th style={thStyle}>Recommended</th>
                    <th style={thStyle}>Change</th>
                    <th style={thStyle}>Trend</th>
                    <th style={thStyle}>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                      <td style={{ ...tdStyle, fontWeight: 600, color: COLORS.heading }}>
                        {r.product}
                        <div style={{ marginTop: 2, fontSize: 12, fontWeight: 400, color: COLORS.mutedText }}>
                          {r.reason}
                        </div>
                      </td>
                      <td style={tdStyle}>Rs {r.currentPrice}</td>
                      <td style={{ ...tdStyle, fontWeight: 600, color: COLORS.heading }}>Rs {r.recommendedPrice}</td>
                      <td style={{ ...tdStyle, color: r.delta > 0 ? "#4b6b3f" : r.delta < 0 ? "#b15a41" : COLORS.mutedText }}>
                        {r.delta > 0 ? "+" : ""}{r.delta} ({r.deltaPct > 0 ? "+" : ""}{r.deltaPct}%)
                      </td>
                      <td style={tdStyle}>
                        <TrendBadge trend={r.trend} />
                      </td>
                      <td style={tdStyle}>
                        <ConfidenceBadge confidence={r.confidence} />
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: "40px 20px", textAlign: "center", color: COLORS.mutedText }}>
                        No products match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Side column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Top opportunities — dark forest panel */}
            <div style={{ borderRadius: 16, background: COLORS.forest, padding: 24, color: "#fff" }}>
              <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <Sparkles size={20} color={COLORS.gold} />
                <h3 style={{ fontFamily: "Georgia, serif", fontSize: 18, margin: 0 }}>Top opportunities</h3>
              </div>
              {topOpportunities.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {topOpportunities.map((r) => (
                    <div key={r.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                      <span style={{ color: "rgba(255,255,255,0.9)" }}>{r.product}</span>
                      <span style={{ fontWeight: 600 }}>+{r.deltaPct}%</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>No upward opportunities right now.</p>
              )}
              <button
                style={{
                  marginTop: 20,
                  width: "100%",
                  borderRadius: 8,
                  border: "none",
                  background: COLORS.gold,
                  padding: "10px 0",
                  fontSize: 14,
                  fontWeight: 600,
                  color: COLORS.heading,
                  cursor: "pointer",
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = COLORS.goldHover)}
                onMouseOut={(e) => (e.currentTarget.style.background = COLORS.gold)}
              >
                Apply suggested prices
              </button>
            </div>

            {/* Insight summary */}
            <div
              style={{
                borderRadius: 16,
                border: `1px solid ${COLORS.border}`,
                background: COLORS.card,
                padding: 24,
                boxShadow: "0 1px 2px rgba(20,20,10,0.04)",
              }}
            >
              <h3 style={{ fontFamily: "Georgia, serif", fontSize: 18, color: COLORS.heading, margin: 0 }}>
                How this works
              </h3>
              <p style={{ marginTop: 12, fontSize: 13, color: COLORS.bodyText, lineHeight: 1.6 }}>
                Recommendations are based on recent sale velocity, nearby market prices, and
                current stock levels across your consignments. Higher confidence means more
                recent sales data was available for that product.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
