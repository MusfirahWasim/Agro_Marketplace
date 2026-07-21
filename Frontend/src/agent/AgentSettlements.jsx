import { useMemo, useState } from "react";
import {
  Landmark,
  CircleCheck,
  Clock,
  AlertTriangle,
  ChevronDown,
  Search,
} from "lucide-react";

/**
 * AgentSettlements.jsx
 * Commission Agent — agent-to-supplier settlements (payments the agent owes
 * suppliers once consigned stock has sold).
 *
 * Styling note: this file uses plain inline styles (same approach as
 * AgentInventory.jsx / AgentCommissions.jsx) instead of Tailwind classes,
 * so the theme renders correctly even if Tailwind isn't set up/scanning
 * this file yet.
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
 * Data below is illustrative — swap MOCK_SETTLEMENTS for a call to
 * lib/api.js (e.g. getAgentSettlements()) once the endpoint is wired up.
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

const MOCK_SETTLEMENTS = [
  { id: "STL-3081", supplier: "Ahmed Farms", consignment: "CN-1037", amount: 142000, dueDate: "2026-07-25", status: "due" },
  { id: "STL-3079", supplier: "Green Basket Growers", consignment: "CN-1030", amount: 99500, dueDate: "2026-07-22", status: "overdue" },
  { id: "STL-3077", supplier: "Noor Agro", consignment: "CN-1041", amount: 99500, dueDate: "2026-07-28", status: "due" },
  { id: "STL-3072", supplier: "Ahmed Farms", consignment: "CN-1042", amount: 87500, dueDate: "2026-07-14", status: "settled" },
  { id: "STL-3068", supplier: "Bilal Supplies", consignment: "CN-1036", amount: 31200, dueDate: "2026-07-10", status: "settled" },
  { id: "STL-3061", supplier: "Noor Agro", consignment: "CN-1033", amount: 214000, dueDate: "2026-07-03", status: "settled" },
  { id: "STL-3055", supplier: "Green Basket Growers", consignment: "CN-1039", amount: 54000, dueDate: "2026-06-29", status: "settled" },
];

const STATUS_META = {
  settled: { label: "Settled", dot: "#4c8b3c", text: "#4b6b3f", bg: "#dde8d0" },
  due: { label: "Due", dot: "#f0b84c", text: "#8a6413", bg: "#f5e6c5" },
  overdue: { label: "Overdue", dot: "#b15a41", text: "#b15a41", bg: "#f4d9d0" },
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

export default function AgentSettlements() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const rows = MOCK_SETTLEMENTS;

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const q = query.toLowerCase();
      const matchesQuery =
        r.supplier.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.consignment.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [rows, query, statusFilter]);

  const totals = useMemo(() => {
    const settled = rows.filter((r) => r.status === "settled").reduce((s, r) => s + r.amount, 0);
    const due = rows.filter((r) => r.status === "due").reduce((s, r) => s + r.amount, 0);
    const overdue = rows.filter((r) => r.status === "overdue").reduce((s, r) => s + r.amount, 0);
    const owed = due + overdue;
    return { settled, due, overdue, owed };
  }, [rows]);

  const owedItems = rows
    .filter((r) => r.status === "due" || r.status === "overdue")
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
            Supplier settlements
          </h1>
          <p style={{ marginTop: 6, color: COLORS.bodyText, fontSize: 14 }}>
            What you owe suppliers for sold consignments, and what's already been settled.
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
          <StatCard icon={Landmark} label="Owed to suppliers" value={`Rs ${totals.owed.toLocaleString()}`} iconBg="#e8cdc2" iconColor="#b15a41" />
          <StatCard icon={Clock} label="Due this month" value={`Rs ${totals.due.toLocaleString()}`} iconBg="#f6ddab" iconColor="#c9922c" />
          <StatCard icon={AlertTriangle} label="Overdue" value={`Rs ${totals.overdue.toLocaleString()}`} iconBg="#e8cdc2" iconColor="#b15a41" />
          <StatCard icon={CircleCheck} label="Settled this month" value={`Rs ${totals.settled.toLocaleString()}`} iconBg="#dde8d0" iconColor={COLORS.sage} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
          {/* Settlements table */}
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
                Settlement history
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
                    placeholder="Search supplier or ID"
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
                    <option value="settled">Settled</option>
                    <option value="due">Due</option>
                    <option value="overdue">Overdue</option>
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
                    <th style={thStyle}>Settlement</th>
                    <th style={thStyle}>Supplier</th>
                    <th style={thStyle}>Consignment</th>
                    <th style={thStyle}>Amount</th>
                    <th style={thStyle}>Due date</th>
                    <th style={thStyle}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                      <td style={{ ...tdStyle, fontWeight: 600, color: COLORS.heading }}>{r.id}</td>
                      <td style={tdStyle}>{r.supplier}</td>
                      <td style={{ ...tdStyle, color: COLORS.mutedText }}>{r.consignment}</td>
                      <td style={{ ...tdStyle, fontWeight: 600, color: COLORS.heading }}>
                        Rs {r.amount.toLocaleString()}
                      </td>
                      <td style={tdStyle}>{r.dueDate}</td>
                      <td style={tdStyle}>
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: "40px 20px", textAlign: "center", color: COLORS.mutedText }}>
                        No settlements match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Side column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Owed to suppliers — dark forest panel, mirrors dashboard block */}
            <div style={{ borderRadius: 16, background: COLORS.forest, padding: 24, color: "#fff" }}>
              <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <AlertTriangle size={20} color={COLORS.gold} />
                <h3 style={{ fontFamily: "Georgia, serif", fontSize: 18, margin: 0 }}>Owed to suppliers</h3>
              </div>
              {owedItems.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {owedItems.map((r) => (
                    <div key={r.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                      <span style={{ color: "rgba(255,255,255,0.9)" }}>{r.supplier}</span>
                      <span style={{ fontWeight: 600 }}>Rs {r.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>Nothing owed right now.</p>
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
                Settle now
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
                  <span style={{ color: COLORS.mutedText }}>Settlements recorded</span>
                  <span style={{ fontWeight: 600, color: COLORS.heading }}>{rows.length}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: COLORS.mutedText }}>Total settled</span>
                  <span style={{ fontWeight: 600, color: COLORS.heading }}>Rs {totals.settled.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: COLORS.mutedText }}>Still outstanding</span>
                  <span style={{ fontWeight: 600, color: COLORS.heading }}>Rs {totals.owed.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
