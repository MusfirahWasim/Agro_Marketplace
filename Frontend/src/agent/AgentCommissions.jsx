import { useMemo, useState } from "react";
import {
  Percent,
  Wallet,
  TrendingUp,
  Clock,
  ChevronDown,
  Search,
} from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import LanguageSelector from "../i18n/LanguageSelector";
import { localizeTrader, formatAgentCurrency } from "./agentLocale";

/**
 * AgentCommissions.jsx
 * Commission Agent — commission earnings on orders fulfilled through their consignments.
 * Fully localized: renders in English or Urdu (including trader names, dates,
 * currency, and status labels) via LanguageContext.
 *
 * Data below is illustrative — swap MOCK_COMMISSIONS for a call to
 * lib/api.js (e.g. getAgentCommissions()) once the endpoint is wired up.
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

const MOCK_COMMISSIONS = [
  { id: "ORD-2211", consignment: "CN-1042", buyer: "Green Valley Store", saleAmount: 25500, rate: 6.5, date: "2026-07-18", status: "paid" },
  { id: "ORD-2210", consignment: "CN-1041", buyer: "Sana Wholesale", saleAmount: 41000, rate: 6.0, date: "2026-07-17", status: "pending" },
  { id: "ORD-2208", consignment: "CN-1039", buyer: "Karachi Mart", saleAmount: 18900, rate: 7.0, date: "2026-07-15", status: "paid" },
  { id: "ORD-2205", consignment: "CN-1036", buyer: "Bilal Supplies", saleAmount: 12300, rate: 6.5, date: "2026-07-12", status: "reversed" },
  { id: "ORD-2201", consignment: "CN-1037", buyer: "Green Valley Store", saleAmount: 33200, rate: 6.0, date: "2026-07-10", status: "paid" },
  { id: "ORD-2198", consignment: "CN-1033", buyer: "Sana Wholesale", saleAmount: 58000, rate: 5.5, date: "2026-07-06", status: "pending" },
  { id: "ORD-2194", consignment: "CN-1030", buyer: "Karachi Mart", saleAmount: 21400, rate: 7.5, date: "2026-07-02", status: "paid" },
];

function StatusBadge({ status, meta }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        borderRadius: 999,
        padding: "4px 10px",
        fontSize: 12,
        fontWeight: 500,
        background: meta.bg,
        color: meta.text,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: meta.dot }} />
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

export default function AgentCommissions() {
  const { language, t } = useLanguage();
  const isUr = language === "ur";
  const trader = (name) => localizeTrader(name, language);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const STATUS_META = {
    paid: { label: t("agent.common.status.paid"), dot: "#4c8b3c", text: "#4b6b3f", bg: "#dde8d0" },
    pending: { label: t("agent.common.status.pending"), dot: "#f0b84c", text: "#8a6413", bg: "#f5e6c5" },
    reversed: { label: t("agent.common.status.reversed"), dot: "#b15a41", text: "#b15a41", bg: "#f4d9d0" },
  };

  const rows = useMemo(
    () =>
      MOCK_COMMISSIONS.map((r) => ({
        ...r,
        commission: Math.round(r.saleAmount * (r.rate / 100)),
      })),
    []
  );

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const q = query.toLowerCase();
      const matchesQuery =
        r.buyer.toLowerCase().includes(q) ||
        trader(r.buyer).includes(query) ||
        r.id.toLowerCase().includes(q) ||
        r.consignment.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [rows, query, statusFilter, language]);

  const totals = useMemo(() => {
    const earned = rows.reduce((s, r) => s + r.commission, 0);
    const paid = rows.filter((r) => r.status === "paid").reduce((s, r) => s + r.commission, 0);
    const pending = rows.filter((r) => r.status === "pending").reduce((s, r) => s + r.commission, 0);
    const avgRate = rows.length ? rows.reduce((s, r) => s + r.rate, 0) / rows.length : 0;
    return { earned, paid, pending, avgRate };
  }, [rows]);

  const pendingItems = rows.filter((r) => r.status === "pending").slice(0, 4);

  const thStyle = { padding: "12px 20px", fontWeight: 500, fontSize: 13, color: COLORS.mutedText, textAlign: "left" };
  const tdStyle = { padding: "16px 20px", fontSize: 14, color: "#33403a" };

  return (
    <div style={{ background: COLORS.pageBg, padding: 24, fontFamily: isUr ? "'Noto Nastaliq Urdu', serif" : "system-ui, -apple-system, sans-serif" }} dir={isUr ? "rtl" : "ltr"}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@500;700&display=swap');`}</style>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Page header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1
              style={{
                fontFamily: isUr ? "'Noto Nastaliq Urdu', serif" : "Georgia, 'Times New Roman', serif",
                fontSize: 30,
                color: COLORS.heading,
                margin: 0,
              }}
            >
              {t("agent.commissions.title")}
            </h1>
            <p style={{ marginTop: 6, color: COLORS.bodyText, fontSize: 14 }}>
              {t("agent.commissions.subtitle")}
            </p>
          </div>
          <LanguageSelector />
        </div>

        {/* Stat cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 20,
          }}
        >
          <StatCard icon={Wallet} label={t("agent.commissions.stats.totalEarned")} value={formatAgentCurrency(totals.earned, t)} iconBg="#dde8d0" iconColor={COLORS.sage} />
          <StatCard icon={TrendingUp} label={t("agent.commissions.stats.paidOut")} value={formatAgentCurrency(totals.paid, t)} iconBg="#dde8d0" iconColor={COLORS.sage} />
          <StatCard icon={Clock} label={t("agent.commissions.stats.pendingPayout")} value={formatAgentCurrency(totals.pending, t)} iconBg="#f6ddab" iconColor="#c9922c" />
          <StatCard icon={Percent} label={t("agent.commissions.stats.avgRate")} value={`${totals.avgRate.toFixed(1)}%`} iconBg="#e8cdc2" iconColor="#b15a41" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
          {/* Commissions table */}
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
              <h2 style={{ fontFamily: isUr ? "'Noto Nastaliq Urdu', serif" : "Georgia, serif", fontSize: 18, color: COLORS.heading, margin: 0 }}>
                {t("agent.commissions.commissionHistory")}
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
                    placeholder={t("agent.common.searchOrderBuyer")}
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
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
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
                    <option value="all">{t("agent.common.allStatuses")}</option>
                    <option value="paid">{t("agent.common.status.paid")}</option>
                    <option value="pending">{t("agent.common.status.pending")}</option>
                    <option value="reversed">{t("agent.common.status.reversed")}</option>
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
                    <th style={thStyle}>{t("agent.common.table.order")}</th>
                    <th style={thStyle}>{t("agent.common.table.consignment")}</th>
                    <th style={thStyle}>{t("agent.common.table.buyer")}</th>
                    <th style={thStyle}>{t("agent.common.table.saleAmount")}</th>
                    <th style={thStyle}>{t("agent.common.table.rate")}</th>
                    <th style={thStyle}>{t("agent.common.table.commission")}</th>
                    <th style={thStyle}>{t("agent.common.table.status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                      <td style={{ ...tdStyle, fontWeight: 600, color: COLORS.heading }}>{r.id}</td>
                      <td style={{ ...tdStyle, color: COLORS.mutedText }}>{r.consignment}</td>
                      <td style={tdStyle}>{trader(r.buyer)}</td>
                      <td style={tdStyle}>{formatAgentCurrency(r.saleAmount, t)}</td>
                      <td style={tdStyle}>{r.rate}%</td>
                      <td style={{ ...tdStyle, fontWeight: 600, color: COLORS.heading }}>
                        {formatAgentCurrency(r.commission, t)}
                      </td>
                      <td style={tdStyle}>
                        <StatusBadge status={r.status} meta={STATUS_META[r.status]} />
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: "40px 20px", textAlign: "center", color: COLORS.mutedText }}>
                        {t("agent.commissions.noResults")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Side column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Pending payout — dark forest panel, mirrors "Owed to suppliers" block */}
            <div style={{ borderRadius: 16, background: COLORS.forest, padding: 24, color: "#fff" }}>
              <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <Clock size={20} color={COLORS.gold} />
                <h3 style={{ fontFamily: isUr ? "'Noto Nastaliq Urdu', serif" : "Georgia, serif", fontSize: 18, margin: 0 }}>{t("agent.commissions.pendingPayout")}</h3>
              </div>
              {pendingItems.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {pendingItems.map((r) => (
                    <div key={r.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                      <span style={{ color: "rgba(255,255,255,0.9)" }}>{trader(r.buyer)}</span>
                      <span style={{ fontWeight: 600 }}>{formatAgentCurrency(r.commission, t)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>{t("agent.commissions.nothingPending")}</p>
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
                {t("agent.commissions.requestPayout")}
              </button>
            </div>

            {/* This month summary */}
            <div
              style={{
                borderRadius: 16,
                border: `1px solid ${COLORS.border}`,
                background: COLORS.card,
                padding: 24,
                boxShadow: "0 1px 2px rgba(20,20,10,0.04)",
              }}
            >
              <h3 style={{ fontFamily: isUr ? "'Noto Nastaliq Urdu', serif" : "Georgia, serif", fontSize: 18, color: COLORS.heading, margin: 0 }}>
                {t("agent.common.thisMonth")}
              </h3>
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12, fontSize: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: COLORS.mutedText }}>{t("agent.commissions.thisMonth.ordersCommissioned")}</span>
                  <span style={{ fontWeight: 600, color: COLORS.heading }}>{rows.length}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: COLORS.mutedText }}>{t("agent.commissions.thisMonth.totalCommission")}</span>
                  <span style={{ fontWeight: 600, color: COLORS.heading }}>{formatAgentCurrency(totals.earned, t)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: COLORS.mutedText }}>{t("agent.commissions.thisMonth.avgRate")}</span>
                  <span style={{ fontWeight: 600, color: COLORS.heading }}>{totals.avgRate.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
