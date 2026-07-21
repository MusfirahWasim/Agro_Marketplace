import { useMemo, useState } from "react";
import {
  Truck,
  PackagePlus,
  ClipboardCheck,
  Users,
  ChevronDown,
  Search,
} from "lucide-react";

/**
 * AgentConsignmentIntake.jsx
 * Commission Agent — recording stock received from suppliers (new consignments
 * coming into the agent's inventory).
 *
 * Styling note: this file uses plain inline styles (same approach as
 * AgentInventory.jsx / AgentCommissions.jsx / AgentSettlements.jsx) instead
 * of Tailwind classes, so the theme renders correctly even if Tailwind
 * isn't set up/scanning this file yet.
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
  { id: "CN-1042", supplier: "Ahmed Farms", product: "Tomatoes", quantity: 1200, unit: "kg", unitPrice: 85, date: "2026-07-14", status: "confirmed" },
  { id: "CN-1041", supplier: "Noor Agro", product: "Basmati Rice", quantity: 2400, unit: "kg", unitPrice: 210, date: "2026-07-12", status: "confirmed" },
  { id: "CN-1039", supplier: "Green Basket Growers", product: "Red Onions", quantity: 900, unit: "kg", unitPrice: 60, date: "2026-07-10", status: "confirmed" },
  { id: "CN-1044", supplier: "Bilal Supplies", product: "Green Chillies", quantity: 400, unit: "kg", unitPrice: 145, date: "2026-07-19", status: "pending" },
  { id: "CN-1045", supplier: "Ahmed Farms", product: "Potatoes", quantity: 1100, unit: "kg", unitPrice: 46, date: "2026-07-20", status: "pending" },
  { id: "CN-1033", supplier: "Noor Agro", product: "Wheat", quantity: 3000, unit: "kg", unitPrice: 98, date: "2026-07-02", status: "confirmed" },
];

const STATUS_META = {
  confirmed: { label: "Confirmed", dot: "#4c8b3c", text: "#4b6b3f", bg: "#dde8d0" },
  pending: { label: "Awaiting confirmation", dot: "#f0b84c", text: "#8a6413", bg: "#f5e6c5" },
  rejected: { label: "Rejected", dot: "#b15a41", text: "#b15a41", bg: "#f4d9d0" },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status];
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
  const [intakes, setIntakes] = useState(MOCK_INTAKES);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState({ supplier: SUPPLIERS[0], product: "", quantity: "", unit: "kg", unitPrice: "" });
  const [submitted, setSubmitted] = useState(false);

  const filtered = useMemo(() => {
    return intakes.filter((r) => {
      const q = query.toLowerCase();
      const matchesQuery =
        r.product.toLowerCase().includes(q) ||
        r.supplier.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [intakes, query, statusFilter]);

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
      unit: form.unit,
      unitPrice: Number(form.unitPrice),
      date: new Date().toISOString().slice(0, 10),
      status: "pending",
    };
    setIntakes((prev) => [newIntake, ...prev]);
    setForm({ supplier: SUPPLIERS[0], product: "", quantity: "", unit: "kg", unitPrice: "" });
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2500);
  }

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
            Consignment intake
          </h1>
          <p style={{ marginTop: 6, color: COLORS.bodyText, fontSize: 14 }}>
            Record new stock as it arrives from suppliers, and track what's still awaiting confirmation.
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
          <StatCard icon={Truck} label="Received this month" value={totals.thisMonth} iconBg="#dde8d0" iconColor={COLORS.sage} />
          <StatCard icon={PackagePlus} label="Total quantity intake" value={`${totals.totalQty.toLocaleString()} kg`} iconBg="#dde8d0" iconColor={COLORS.sage} />
          <StatCard icon={ClipboardCheck} label="Awaiting confirmation" value={totals.pendingCount} iconBg="#f6ddab" iconColor="#c9922c" />
          <StatCard icon={Users} label="Active suppliers" value={totals.activeSuppliers} iconBg="#e8cdc2" iconColor="#b15a41" />
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
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 18, color: COLORS.heading, margin: 0, marginBottom: 20 }}>
                Record new intake
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
                    <label style={fieldLabelStyle}>Supplier</label>
                    <select
                      value={form.supplier}
                      onChange={(e) => handleChange("supplier", e.target.value)}
                      style={{ ...inputStyle, appearance: "none" }}
                    >
                      {SUPPLIERS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={fieldLabelStyle}>Product</label>
                    <input
                      value={form.product}
                      onChange={(e) => handleChange("product", e.target.value)}
                      placeholder="e.g. Tomatoes"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={fieldLabelStyle}>Quantity (kg)</label>
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
                    <label style={fieldLabelStyle}>Unit price (Rs)</label>
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
                    Record intake
                  </button>
                  {submitted && (
                    <span style={{ fontSize: 13, color: COLORS.sage, fontWeight: 500 }}>
                      Intake recorded — awaiting supplier confirmation.
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
                <h2 style={{ fontFamily: "Georgia, serif", fontSize: 18, color: COLORS.heading, margin: 0 }}>
                  Recent intakes
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
                      placeholder="Search product or supplier"
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
                      <option value="all">All statuses</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="pending">Awaiting confirmation</option>
                      <option value="rejected">Rejected</option>
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
                      <th style={thStyle}>Consignment</th>
                      <th style={thStyle}>Supplier</th>
                      <th style={thStyle}>Product</th>
                      <th style={thStyle}>Quantity</th>
                      <th style={thStyle}>Unit price</th>
                      <th style={thStyle}>Date</th>
                      <th style={thStyle}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => (
                      <tr key={r.id} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                        <td style={{ ...tdStyle, fontWeight: 600, color: COLORS.heading }}>{r.id}</td>
                        <td style={tdStyle}>{r.supplier}</td>
                        <td style={tdStyle}>{r.product}</td>
                        <td style={tdStyle}>{r.quantity.toLocaleString()} {r.unit}</td>
                        <td style={tdStyle}>Rs {r.unitPrice}</td>
                        <td style={{ ...tdStyle, color: COLORS.mutedText }}>{r.date}</td>
                        <td style={tdStyle}>
                          <StatusBadge status={r.status} />
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ padding: "40px 20px", textAlign: "center", color: COLORS.mutedText }}>
                          No intakes match your search.
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
                <h3 style={{ fontFamily: "Georgia, serif", fontSize: 18, margin: 0 }}>Awaiting confirmation</h3>
              </div>
              {pendingItems.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {pendingItems.map((r) => (
                    <div key={r.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                      <span style={{ color: "rgba(255,255,255,0.9)" }}>{r.product} · {r.supplier}</span>
                      <span style={{ fontWeight: 600 }}>{r.quantity.toLocaleString()} {r.unit}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>Nothing awaiting confirmation.</p>
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
                Review all
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
              <h3 style={{ fontFamily: "Georgia, serif", fontSize: 18, color: COLORS.heading, margin: 0 }}>
                This month
              </h3>
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12, fontSize: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: COLORS.mutedText }}>Consignments received</span>
                  <span style={{ fontWeight: 600, color: COLORS.heading }}>{totals.thisMonth}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: COLORS.mutedText }}>Total quantity</span>
                  <span style={{ fontWeight: 600, color: COLORS.heading }}>{totals.totalQty.toLocaleString()} kg</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: COLORS.mutedText }}>Active suppliers</span>
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
