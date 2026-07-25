import { useMemo, useState } from "react";
import {
  Search,
  Boxes,
  PackageCheck,
  TrendingDown,
  AlertTriangle,
  ChevronDown,
  Leaf,
} from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import LanguageSelector from "../i18n/LanguageSelector";
import { localizeTrader, localizeProduct } from "./agentLocale";

/**
 * AgentInventory.jsx
 * Commission Agent — consigned inventory (qty received / sold / remaining per consignment).
 * Fully localized via LanguageContext (English / Urdu), including product
 * and supplier names.
 *
 * Data below is illustrative — swap MOCK_INVENTORY for a call to lib/api.js
 * (e.g. getAgentInventory()) once the endpoint is wired up.
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

const MOCK_INVENTORY = [
  { id: "CN-1042", product: "Tomatoes", supplier: "Ahmed Farms", received: 1200, sold: 980 },
  { id: "CN-1041", product: "Basmati Rice", supplier: "Noor Agro", received: 2400, sold: 1150 },
  { id: "CN-1039", product: "Red Onions", supplier: "Green Basket Growers", received: 900, sold: 900 },
  { id: "CN-1037", product: "Potatoes", supplier: "Ahmed Farms", received: 1500, sold: 640 },
  { id: "CN-1036", product: "Green Chillies", supplier: "Bilal Supplies", received: 320, sold: 90 },
  { id: "CN-1033", product: "Wheat", supplier: "Noor Agro", received: 3000, sold: 3000 },
  { id: "CN-1030", product: "Mangoes (Sindhri)", supplier: "Green Basket Growers", received: 760, sold: 210 },
];

function statusFor(received, sold) {
  const remaining = received - sold;
  if (remaining <= 0) return "sold-out";
  if (remaining / received <= 0.15) return "low-stock";
  return "in-stock";
}

function StatusBadge({ meta }) {
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

export default function AgentInventory() {
  const { language, t } = useLanguage();
  const isUr = language === "ur";
  const unit = isUr ? "کلوگرام" : "kg";
  const trader = (name) => localizeTrader(name, language);
  const product = (name) => localizeProduct(name, language);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const STATUS_META = {
    "in-stock": { label: t("agent.common.status.inStock"), dot: "#4c8b3c", text: "#4b6b3f", bg: "#dde8d0" },
    "low-stock": { label: t("agent.common.status.lowStock"), dot: "#f0b84c", text: "#8a6413", bg: "#f5e6c5" },
    "sold-out": { label: t("agent.common.status.soldOut"), dot: "#b15a41", text: "#b15a41", bg: "#f4d9d0" },
  };

  const rows = useMemo(
    () =>
      MOCK_INVENTORY.map((r) => ({
        ...r,
        remaining: r.received - r.sold,
        status: statusFor(r.received, r.sold),
      })),
    []
  );

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const q = query.toLowerCase();
      const matchesQuery =
        r.product.toLowerCase().includes(q) ||
        product(r.product).includes(query) ||
        r.supplier.toLowerCase().includes(q) ||
        trader(r.supplier).includes(query) ||
        r.id.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [rows, query, statusFilter, language]);

  const totals = useMemo(() => {
    const received = rows.reduce((s, r) => s + r.received, 0);
    const sold = rows.reduce((s, r) => s + r.sold, 0);
    const lowStockCount = rows.filter((r) => r.status === "low-stock" || r.status === "sold-out").length;
    return { received, sold, remaining: received - sold, lowStockCount };
  }, [rows]);

  const lowStockItems = rows.filter((r) => r.status === "low-stock").slice(0, 4);

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
              {t("agent.inventory.title")}
            </h1>
            <p style={{ marginTop: 6, color: COLORS.bodyText, fontSize: 14 }}>
              {t("agent.inventory.subtitle")}
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
          <StatCard icon={Boxes} label={t("agent.inventory.stats.totalReceived")} value={`${totals.received.toLocaleString()} ${unit}`} iconBg="#dde8d0" iconColor={COLORS.sage} />
          <StatCard icon={PackageCheck} label={t("agent.inventory.stats.quantitySold")} value={`${totals.sold.toLocaleString()} ${unit}`} iconBg="#f6ddab" iconColor="#c9922c" />
          <StatCard icon={Leaf} label={t("agent.inventory.stats.remainingOnHand")} value={`${totals.remaining.toLocaleString()} ${unit}`} iconBg="#dde8d0" iconColor={COLORS.sage} />
          <StatCard icon={TrendingDown} label={t("agent.inventory.stats.lowStockCount")} value={totals.lowStockCount} iconBg="#e8cdc2" iconColor="#b15a41" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
          {/* Inventory table */}
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
                {t("agent.inventory.consignmentsOnHand")}
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
                    placeholder={t("agent.common.searchProductSupplier")}
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
                    <option value="in-stock">{t("agent.common.status.inStock")}</option>
                    <option value="low-stock">{t("agent.common.status.lowStock")}</option>
                    <option value="sold-out">{t("agent.common.status.soldOut")}</option>
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
                    <th style={thStyle}>{t("agent.common.table.consignment")}</th>
                    <th style={thStyle}>{t("agent.common.table.product")}</th>
                    <th style={thStyle}>{t("agent.common.table.supplier")}</th>
                    <th style={thStyle}>{t("agent.common.table.received")}</th>
                    <th style={thStyle}>{t("agent.common.table.sold")}</th>
                    <th style={thStyle}>{t("agent.common.table.remaining")}</th>
                    <th style={thStyle}>{t("agent.common.table.status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                      <td style={{ ...tdStyle, fontWeight: 600, color: COLORS.heading }}>{r.id}</td>
                      <td style={tdStyle}>{product(r.product)}</td>
                      <td style={{ ...tdStyle, color: COLORS.mutedText }}>{trader(r.supplier)}</td>
                      <td style={tdStyle}>{r.received.toLocaleString()} {unit}</td>
                      <td style={tdStyle}>{r.sold.toLocaleString()} {unit}</td>
                      <td style={tdStyle}>{r.remaining.toLocaleString()} {unit}</td>
                      <td style={tdStyle}>
                        <StatusBadge meta={STATUS_META[r.status]} />
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: "40px 20px", textAlign: "center", color: COLORS.mutedText }}>
                        {t("agent.inventory.noResults")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Side column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Low stock — dark forest panel, mirrors "Owed to suppliers" block */}
            <div style={{ borderRadius: 16, background: COLORS.forest, padding: 24, color: "#fff" }}>
              <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <AlertTriangle size={20} color={COLORS.gold} />
                <h3 style={{ fontFamily: isUr ? "'Noto Nastaliq Urdu', serif" : "Georgia, serif", fontSize: 18, margin: 0 }}>{t("agent.inventory.runningLow")}</h3>
              </div>
              {lowStockItems.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {lowStockItems.map((r) => (
                    <div key={r.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                      <span style={{ color: "rgba(255,255,255,0.9)" }}>{product(r.product)}</span>
                      <span style={{ fontWeight: 600 }}>{r.remaining.toLocaleString()} {unit} {t("agent.common.left")}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>{t("agent.inventory.nothingLow")}</p>
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
                {t("agent.inventory.requestRestock")}
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
                  <span style={{ color: COLORS.mutedText }}>{t("agent.inventory.thisMonth.consignmentsReceived")}</span>
                  <span style={{ fontWeight: 600, color: COLORS.heading }}>{rows.length}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: COLORS.mutedText }}>{t("agent.inventory.thisMonth.quantitySold")}</span>
                  <span style={{ fontWeight: 600, color: COLORS.heading }}>{totals.sold.toLocaleString()} {unit}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: COLORS.mutedText }}>{t("agent.inventory.thisMonth.sellThroughRate")}</span>
                  <span style={{ fontWeight: 600, color: COLORS.heading }}>
                    {totals.received ? Math.round((totals.sold / totals.received) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
