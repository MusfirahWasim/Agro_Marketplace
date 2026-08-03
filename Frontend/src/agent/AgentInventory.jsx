import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Boxes,
  PackageCheck,
  TrendingDown,
  AlertTriangle,
  ChevronDown,
  Leaf,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { localizeTrader, formatAgentDate } from "./agentLocale";
import { listMyConsignments } from "../handlers/consignment";
import { listOrdersAgainstMyConsignments } from "../handlers/order";

/**
 * AgentInventory.jsx
 * Commission Agent — consigned inventory (received / sold / remaining per
 * consignment), with two SEPARATE badges: lifecycle status (from the
 * consignment record) and stock level (computed here, not stored anywhere).
 *
 * "Sold" isn't a field on the consignment — it's derived by summing
 * quantity_ordered from listOrdersAgainstMyConsignments() per consigned_id,
 * excluding cancelled orders. Stock-level badge (in-stock/low-stock/
 * sold-out) is only meaningful once a consignment is confirmed/completed —
 * a pending consignment hasn't actually received stock yet, so it shows "—".
 *
 * One of the 5 files flagged for a full restyle — converted from inline
 * styles/Georgia to the LoginPage token system (same COLORS + font-display/
 * font-body/font-urdu convention used in the other agent files so far).
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

function normalizeConsignment(raw) {
  return {
    id: raw.id,
    itemName: raw.item_name ?? raw.supply?.item_name ?? null,
    supplierName: raw.supplier?.name ?? raw.supplier_name ?? null,
    supplierId: raw.supplier_id ?? raw.supply?.supplier_id ?? null,
    unit: raw.unit ?? raw.supply?.unit ?? "kg",
    received: raw.quantity_consigned ?? 0,
    status: raw.status, // "pending" | "confirmed" | "completed" | "cancelled"
    date: raw.created_at ?? null,
  };
}

function stockStatusFor(received, sold) {
  const remaining = received - sold;
  if (remaining <= 0) return "sold-out";
  if (received > 0 && remaining / received <= 0.15) return "low-stock";
  return "in-stock";
}

function StatusBadge({ meta }) {
  if (!meta) return <span style={{ color: COLORS.muted }}>—</span>;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: meta.bg, color: meta.text }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.dot }} />
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

export default function AgentInventory() {
  const { language, t } = useLanguage();
  const isUr = language === "ur";
  const trader = (name) => (name ? localizeTrader(name, language) : "");
  const headingClass = isUr ? "font-urdu" : "font-display";
  const navigate = useNavigate();

  const [consignments, setConsignments] = useState([]);
  const [soldByConsignment, setSoldByConsignment] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const LIFECYCLE_META = {
    confirmed: { label: t("agent.common.status.confirmed"), dot: COLORS.leaf, text: "#3f6b32", bg: "#e2ecd9" },
    completed: { label: t("agent.common.status.completed"), dot: COLORS.forest, text: COLORS.forest, bg: COLORS.greige },
    pending: { label: t("agent.common.status.awaitingConfirmation"), dot: COLORS.gold, text: "#8a6413", bg: "#f5e6c5" },
    cancelled: { label: t("agent.common.status.cancelled"), dot: COLORS.errorText, text: COLORS.errorText, bg: COLORS.errorBg },
  };
  const STOCK_META = {
    "in-stock": { label: t("agent.common.status.inStock"), dot: COLORS.leaf, text: "#3f6b32", bg: "#e2ecd9" },
    "low-stock": { label: t("agent.common.status.lowStock"), dot: COLORS.gold, text: "#8a6413", bg: "#f5e6c5" },
    "sold-out": { label: t("agent.common.status.soldOut"), dot: COLORS.errorText, text: COLORS.errorText, bg: COLORS.errorBg },
  };

  async function fetchInventory() {
    setLoading(true);
    setLoadError(null);
    const [consignmentsRes, ordersRes] = await Promise.all([
      listMyConsignments(),
      listOrdersAgainstMyConsignments(),
    ]);
    const firstError = consignmentsRes.error || ordersRes.error;
    if (firstError) {
      setLoadError(firstError);
      setConsignments([]);
      setSoldByConsignment({});
      setLoading(false);
      return;
    }

    setConsignments((consignmentsRes.data ?? []).map(normalizeConsignment));

    const sold = {};
    (ordersRes.data ?? []).forEach((o) => {
      if (o.status === "cancelled") return;
      const key = o.consigned_id;
      sold[key] = (sold[key] ?? 0) + (o.quantity_ordered ?? 0);
    });
    setSoldByConsignment(sold);
    setLoading(false);
  }

  useEffect(() => {
    fetchInventory();
  }, []);

  const rows = useMemo(
    () =>
      consignments.map((c) => {
        const sold = soldByConsignment[c.id] ?? 0;
        const remaining = c.received - sold;
        const isStockTracked = c.status === "confirmed" || c.status === "completed";
        return {
          ...c,
          sold,
          remaining,
          stockStatus: isStockTracked ? stockStatusFor(c.received, sold) : null,
        };
      }),
    [consignments, soldByConsignment]
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return rows.filter((r) => {
      const matchesQuery =
        !q ||
        (r.itemName ?? "").toLowerCase().includes(q) ||
        trader(r.supplierName).toLowerCase().includes(q) ||
        String(r.id).includes(q);
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [rows, query, statusFilter, language]);

  const totals = useMemo(() => {
    const active = rows.filter((r) => r.status === "confirmed" || r.status === "completed");
    const received = active.reduce((s, r) => s + r.received, 0);
    const sold = active.reduce((s, r) => s + r.sold, 0);
    const lowStockCount = active.filter((r) => r.stockStatus === "low-stock" || r.stockStatus === "sold-out").length;
    return { received, sold, remaining: received - sold, lowStockCount };
  }, [rows]);

  const lowStockItems = rows.filter((r) => r.stockStatus === "low-stock").slice(0, 4);

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
            <h1 className={`text-3xl ${headingClass}`} style={{ color: COLORS.ink }}>{t("agent.inventory.title")}</h1>
            <p className="mt-1.5 text-sm" style={{ color: COLORS.muted }}>{t("agent.inventory.subtitle")}</p>
          </div>
        </div>

        {loadError && (
          <div className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: COLORS.errorBg, color: COLORS.errorText }}>
            <div className="flex items-center gap-2">
              <AlertCircle size={16} />
              {(t("agent.inventory.loadError") || "Couldn't load inventory")}: {loadError}
            </div>
            <button onClick={fetchInventory} className="rounded-lg border px-3 py-1 text-xs font-medium" style={{ borderColor: COLORS.errorText }}>
              {t("agent.commissions.retry") || "Retry"}
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border bg-white py-16 text-sm" style={{ borderColor: COLORS.border, color: COLORS.muted }}>
            <Loader2 size={18} className="animate-spin" />
            {t("agent.inventory.loading") || "Loading inventory…"}
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              <StatCard isUr={isUr} icon={Boxes} label={t("agent.inventory.stats.totalReceived")} value={totals.received.toLocaleString()} iconBg="#e2ecd9" iconColor={COLORS.leaf} />
              <StatCard isUr={isUr} icon={PackageCheck} label={t("agent.inventory.stats.quantitySold")} value={totals.sold.toLocaleString()} iconBg="#f5e6c5" iconColor={COLORS.goldDark} />
              <StatCard isUr={isUr} icon={Leaf} label={t("agent.inventory.stats.remainingOnHand")} value={totals.remaining.toLocaleString()} iconBg="#e2ecd9" iconColor={COLORS.leaf} />
              <StatCard isUr={isUr} icon={TrendingDown} label={t("agent.inventory.stats.lowStockCount")} value={totals.lowStockCount} iconBg={COLORS.errorBg} iconColor={COLORS.errorText} />
            </div>

            <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 340px" }}>
              {/* Inventory table */}
              <div className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: COLORS.border }}>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5" style={{ borderColor: COLORS.border }}>
                  <h2 className={`text-lg ${headingClass}`} style={{ color: COLORS.ink }}>{t("agent.inventory.consignmentsOnHand")}</h2>
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center gap-2 rounded-lg border px-3 py-2" style={{ borderColor: COLORS.border }}>
                      <Search size={16} color={COLORS.iconMuted} />
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t("agent.common.searchProductSupplier")}
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
                        <option value="confirmed">{t("agent.common.status.confirmed")}</option>
                        <option value="completed">{t("agent.common.status.completed")}</option>
                        <option value="pending">{t("agent.common.status.awaitingConfirmation")}</option>
                        <option value="cancelled">{t("agent.common.status.cancelled")}</option>
                      </select>
                      <ChevronDown size={16} color={COLORS.iconMuted} className="pointer-events-none absolute right-2.5 top-2.5" />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-medium" style={{ color: COLORS.muted }}>{t("agent.common.table.consignment")}</th>
                        <th className="px-5 py-3 text-left text-xs font-medium" style={{ color: COLORS.muted }}>{t("agent.common.table.product")}</th>
                        <th className="px-5 py-3 text-left text-xs font-medium" style={{ color: COLORS.muted }}>{t("agent.common.table.supplier")}</th>
                        <th className="px-5 py-3 text-left text-xs font-medium" style={{ color: COLORS.muted }}>{t("agent.common.table.received")}</th>
                        <th className="px-5 py-3 text-left text-xs font-medium" style={{ color: COLORS.muted }}>{t("agent.common.table.sold")}</th>
                        <th className="px-5 py-3 text-left text-xs font-medium" style={{ color: COLORS.muted }}>{t("agent.common.table.remaining")}</th>
                        <th className="px-5 py-3 text-left text-xs font-medium" style={{ color: COLORS.muted }}>{t("agent.common.table.status")}</th>
                        <th className="px-5 py-3 text-left text-xs font-medium" style={{ color: COLORS.muted }}>{t("agent.inventory.table.stock") || "Stock"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r) => (
                        <tr key={r.id} className="border-t" style={{ borderColor: COLORS.border }}>
                          <td className="px-5 py-4 text-sm font-semibold" style={{ color: COLORS.ink }}>#{r.id}</td>
                          <td className="px-5 py-4 text-sm">{r.itemName ?? "—"}</td>
                          <td className="px-5 py-4 text-sm" style={{ color: COLORS.muted }}>{r.supplierName ? trader(r.supplierName) : (r.supplierId ? `#${r.supplierId}` : "—")}</td>
                          <td className="px-5 py-4 text-sm">{r.received.toLocaleString()} {r.unit}</td>
                          <td className="px-5 py-4 text-sm">{r.sold.toLocaleString()} {r.unit}</td>
                          <td className="px-5 py-4 text-sm">{r.remaining.toLocaleString()} {r.unit}</td>
                          <td className="px-5 py-4 text-sm">
                            <StatusBadge meta={LIFECYCLE_META[r.status]} />
                          </td>
                          <td className="px-5 py-4 text-sm">
                            <StatusBadge meta={r.stockStatus ? STOCK_META[r.stockStatus] : null} />
                          </td>
                        </tr>
                      ))}
                      {filtered.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-5 py-10 text-center text-sm" style={{ color: COLORS.muted }}>
                            {t("agent.inventory.noResults")}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Side column */}
              <div className="flex flex-col gap-6">
                {/* Low stock — dark forest panel */}
                <div className="rounded-2xl p-6 text-white" style={{ backgroundColor: COLORS.forest }}>
                  <div className="mb-4 flex items-center gap-2">
                    <AlertTriangle size={20} color={COLORS.gold} />
                    <h3 className={`text-lg ${headingClass}`}>{t("agent.inventory.runningLow")}</h3>
                  </div>
                  {lowStockItems.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {lowStockItems.map((r) => (
                        <div key={r.id} className="flex justify-between text-sm">
                          <span style={{ color: "rgba(255,255,255,0.9)" }}>{r.itemName ?? `#${r.id}`}</span>
                          <span className="font-semibold">{r.remaining.toLocaleString()} {r.unit} {t("agent.common.left")}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>{t("agent.inventory.nothingLow")}</p>
                  )}
                  {/* No "request restock" endpoint exists anywhere in the
                      handler layer — repurposed to jump to the intake form,
                      the closest real action. Flag if this should point
                      somewhere else instead. */}
                  <button
                    onClick={() => navigate("/agent/consignment-intake")}
                    className="mt-5 w-full rounded-lg py-2.5 text-sm font-medium transition-transform active:scale-[0.99]"
                    style={{ backgroundColor: COLORS.gold, color: COLORS.forestDark }}
                  >
                    {t("agent.inventory.requestRestock")}
                  </button>
                </div>

                {/* This month summary */}
                <div className="rounded-2xl border bg-white p-6" style={{ borderColor: COLORS.border }}>
                  <h3 className={`text-lg ${headingClass}`} style={{ color: COLORS.ink }}>{t("agent.common.thisMonth")}</h3>
                  <div className="mt-4 flex flex-col gap-3 text-sm">
                    <div className="flex justify-between">
                      <span style={{ color: COLORS.muted }}>{t("agent.inventory.thisMonth.consignmentsReceived")}</span>
                      <span className="font-semibold" style={{ color: COLORS.ink }}>{rows.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: COLORS.muted }}>{t("agent.inventory.thisMonth.quantitySold")}</span>
                      <span className="font-semibold" style={{ color: COLORS.ink }}>{totals.sold.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: COLORS.muted }}>{t("agent.inventory.thisMonth.sellThroughRate")}</span>
                      <span className="font-semibold" style={{ color: COLORS.ink }}>
                        {totals.received ? Math.round((totals.sold / totals.received) * 100) : 0}%
                      </span>
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
