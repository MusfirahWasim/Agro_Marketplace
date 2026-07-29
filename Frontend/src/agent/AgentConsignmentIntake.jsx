import { useMemo, useState } from "react";
import {
  Truck,
  PackagePlus,
  ClipboardCheck,
  Users,
  ChevronDown,
  Search,
} from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import LanguageSelector from "../i18n/LanguageSelector";
import { localizeTrader, localizeProduct, formatAgentDate } from "./agentLocale";

/**
 * AgentConsignmentIntake.jsx
 * Commission Agent — recording stock received from suppliers (new consignments
 * coming into the agent's inventory). Fully localized (English / Urdu),
 * including supplier and product names and dates.
 *
 * Data below is illustrative — wire the form's onSubmit to lib/api.js
 * (e.g. createConsignmentIntake()) and swap MOCK_INTAKES for
 * getAgentConsignmentIntakes() once the endpoints are ready.
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

const SUPPLIERS = ["Ahmed Farms", "Noor Agro", "Green Basket Growers", "Bilal Supplies"];

const MOCK_INTAKES = [
  { id: "CN-1042", supplier: "Ahmed Farms", product: "Tomatoes", quantity: 1200, unitPrice: 85, date: "2026-07-14", status: "confirmed" },
  { id: "CN-1041", supplier: "Noor Agro", product: "Basmati Rice", quantity: 2400, unitPrice: 210, date: "2026-07-12", status: "confirmed" },
  { id: "CN-1039", supplier: "Green Basket Growers", product: "Red Onions", quantity: 900, unitPrice: 60, date: "2026-07-10", status: "confirmed" },
  { id: "CN-1044", supplier: "Bilal Supplies", product: "Green Chillies", quantity: 400, unitPrice: 145, date: "2026-07-19", status: "pending" },
  { id: "CN-1045", supplier: "Ahmed Farms", product: "Potatoes", quantity: 1100, unitPrice: 46, date: "2026-07-20", status: "pending" },
  { id: "CN-1033", supplier: "Noor Agro", product: "Wheat", quantity: 3000, unitPrice: 98, date: "2026-07-02", status: "confirmed" },
];

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

const fieldLabelStyle = { display: "block", marginBottom: 6, fontSize: 13, fontWeight: 500, color: COLORS.bodyText };
const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: `1px solid ${COLORS.border}`,
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 14,
  color: "#33403a",
  background: "#fff",
  outline: "none",
};

export default function AgentConsignmentIntake() {
  const { language, t } = useLanguage();
  const isUr = language === "ur";
  const unit = isUr ? "کلوگرام" : "kg";
  const trader = (name) => localizeTrader(name, language);
  const product = (name) => localizeProduct(name, language);

  const STATUS_META = {
    confirmed: { label: t("agent.common.status.confirmed"), dot: "#4c8b3c", text: "#4b6b3f", bg: "#dde8d0" },
    pending: { label: t("agent.common.status.awaitingConfirmation"), dot: "#f0b84c", text: "#8a6413", bg: "#f5e6c5" },
    rejected: { label: t("agent.common.status.rejected"), dot: "#b15a41", text: "#b15a41", bg: "#f4d9d0" },
  };

  const [intakes, setIntakes] = useState(MOCK_INTAKES);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState({ supplier: SUPPLIERS[0], product: "", quantity: "", unitPrice: "" });
  const [submitted, setSubmitted] = useState(false);

  const filtered = useMemo(() => {
    return intakes.filter((r) => {
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
  }, [intakes, query, statusFilter, language]);

  const totals = useMemo(() => {
    const totalQty = intakes.reduce((s, r) => s + r.quantity, 0);
    const pendingCount = intakes.filter((r) => r.status === "pending").length;
    const activeSuppliers = new Set(intakes.map((r) => r.supplier)).size;
    return { totalQty, pendingCount, activeSuppliers, thisMonth: intakes.length };
  }, [intakes]);

  const pendingItems = intakes.filter((r) => r.status === "pending").slice(0, 4);

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.product || !form.quantity || !form.unitPrice) return;

    const nextId = `CN-${1046 + intakes.filter((r) => r.id.startsWith("CN-")).length}`;
    const newIntake = {
      id: nextId,
      supplier: form.supplier,
      product: form.product,
      quantity: Number(form.quantity),
      unitPrice: Number(form.unitPrice),
      date: new Date().toISOString().slice(0, 10),
      status: "pending",
    };
    setIntakes((prev) => [newIntake, ...prev]);
    setForm({ supplier: SUPPLIERS[0], product: "", quantity: "", unitPrice: "" });
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2500);
  }

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
              {t("agent.consignmentIntake.title")}
            </h1>
            <p style={{ marginTop: 6, color: COLORS.bodyText, fontSize: 14 }}>
              {t("agent.consignmentIntake.subtitle")}
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
          <StatCard icon={Truck} label={t("agent.consignmentIntake.stats.receivedThisMonth")} value={totals.thisMonth} iconBg="#dde8d0" iconColor={COLORS.sage} />
          <StatCard icon={PackagePlus} label={t("agent.consignmentIntake.stats.totalQuantityIntake")} value={`${totals.totalQty.toLocaleString()} ${unit}`} iconBg="#dde8d0" iconColor={COLORS.sage} />
          <StatCard icon={ClipboardCheck} label={t("agent.consignmentIntake.stats.awaitingConfirmation")} value={totals.pendingCount} iconBg="#f6ddab" iconColor="#c9922c" />
          <StatCard icon={Users} label={t("agent.consignmentIntake.stats.activeSuppliers")} value={totals.activeSuppliers} iconBg="#e8cdc2" iconColor="#b15a41" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
          {/* Left column: intake form + recent intakes table */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Intake form */}
            <div
              style={{
                borderRadius: 16,
                border: `1px solid ${COLORS.border}`,
                background: COLORS.card,
                boxShadow: "0 1px 2px rgba(20,20,10,0.04)",
                padding: 24,
              }}
            >
              <h2 style={{ fontFamily: isUr ? "'Noto Nastaliq Urdu', serif" : "Georgia, serif", fontSize: 18, color: COLORS.heading, margin: 0, marginBottom: 20 }}>
                {t("agent.consignmentIntake.recordNewIntake")}
              </h2>
              <form onSubmit={handleSubmit}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: 16,
                    marginBottom: 20,
                  }}
                >
                  <div>
                    <label style={fieldLabelStyle}>{t("agent.consignmentIntake.form.supplier")}</label>
                    <select
                      value={form.supplier}
                      onChange={(e) => handleChange("supplier", e.target.value)}
                      style={{ ...inputStyle, appearance: "none" }}
                    >
                      {SUPPLIERS.map((s) => (
                        <option key={s} value={s}>{trader(s)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={fieldLabelStyle}>{t("agent.consignmentIntake.form.product")}</label>
                    <input
                      value={form.product}
                      onChange={(e) => handleChange("product", e.target.value)}
                      placeholder={t("agent.consignmentIntake.form.productPlaceholder")}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={fieldLabelStyle}>{t("agent.consignmentIntake.form.quantityKg")}</label>
                    <input
                      type="number"
                      min="0"
                      value={form.quantity}
                      onChange={(e) => handleChange("quantity", e.target.value)}
                      placeholder="0"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={fieldLabelStyle}>{t("agent.consignmentIntake.form.unitPriceRs")}</label>
                    <input
                      type="number"
                      min="0"
                      value={form.unitPrice}
                      onChange={(e) => handleChange("unitPrice", e.target.value)}
                      placeholder="0"
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <button
                    type="submit"
                    style={{
                      borderRadius: 8,
                      border: "none",
                      background: COLORS.gold,
                      padding: "10px 24px",
                      fontSize: 14,
                      fontWeight: 600,
                      color: COLORS.heading,
                      cursor: "pointer",
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = COLORS.goldHover)}
                    onMouseOut={(e) => (e.currentTarget.style.background = COLORS.gold)}
                  >
                    {t("agent.consignmentIntake.recordIntake")}
                  </button>
                  {submitted && (
                    <span style={{ fontSize: 13, color: COLORS.sage, fontWeight: 500 }}>
                      {t("agent.consignmentIntake.submittedMsg")}
                    </span>
                  )}
                </div>
              </form>
            </div>

            {/* Recent intakes table */}
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
                  {t("agent.consignmentIntake.recentIntakes")}
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
                      <option value="confirmed">{t("agent.common.status.confirmed")}</option>
                      <option value="pending">{t("agent.common.status.awaitingConfirmation")}</option>
                      <option value="rejected">{t("agent.common.status.rejected")}</option>
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
                      <th style={thStyle}>{t("agent.common.table.supplier")}</th>
                      <th style={thStyle}>{t("agent.common.table.product")}</th>
                      <th style={thStyle}>{t("agent.common.table.quantity")}</th>
                      <th style={thStyle}>{t("agent.common.table.unitPrice")}</th>
                      <th style={thStyle}>{t("agent.common.table.date")}</th>
                      <th style={thStyle}>{t("agent.common.table.status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => (
                      <tr key={r.id} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                        <td style={{ ...tdStyle, fontWeight: 600, color: COLORS.heading }}>{r.id}</td>
                        <td style={tdStyle}>{trader(r.supplier)}</td>
                        <td style={tdStyle}>{product(r.product)}</td>
                        <td style={tdStyle}>{r.quantity.toLocaleString()} {unit}</td>
                        <td style={tdStyle}>{t("buyer.common.currency")} {r.unitPrice}</td>
                        <td style={{ ...tdStyle, color: COLORS.mutedText }}>{formatAgentDate(r.date, language)}</td>
                        <td style={tdStyle}>
                          <StatusBadge meta={STATUS_META[r.status]} />
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ padding: "40px 20px", textAlign: "center", color: COLORS.mutedText }}>
                          {t("agent.consignmentIntake.noResults")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Side column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Awaiting confirmation — dark forest panel */}
            <div style={{ borderRadius: 16, background: COLORS.forest, padding: 24, color: "#fff" }}>
              <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <ClipboardCheck size={20} color={COLORS.gold} />
                <h3 style={{ fontFamily: isUr ? "'Noto Nastaliq Urdu', serif" : "Georgia, serif", fontSize: 18, margin: 0 }}>{t("agent.consignmentIntake.awaitingConfirmation")}</h3>
              </div>
              {pendingItems.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {pendingItems.map((r) => (
                    <div key={r.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                      <span style={{ color: "rgba(255,255,255,0.9)" }}>{product(r.product)} · {trader(r.supplier)}</span>
                      <span style={{ fontWeight: 600 }}>{r.quantity.toLocaleString()} {unit}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>{t("agent.consignmentIntake.nothingAwaiting")}</p>
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
                {t("agent.consignmentIntake.reviewAll")}
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
                  <span style={{ color: COLORS.mutedText }}>{t("agent.consignmentIntake.thisMonth.consignmentsReceived")}</span>
                  <span style={{ fontWeight: 600, color: COLORS.heading }}>{totals.thisMonth}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: COLORS.mutedText }}>{t("agent.consignmentIntake.thisMonth.totalQuantity")}</span>
                  <span style={{ fontWeight: 600, color: COLORS.heading }}>{totals.totalQty.toLocaleString()} {unit}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: COLORS.mutedText }}>{t("agent.consignmentIntake.thisMonth.activeSuppliers")}</span>
                  <span style={{ fontWeight: 600, color: COLORS.heading }}>{totals.activeSuppliers}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
