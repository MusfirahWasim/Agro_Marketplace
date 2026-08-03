import { useEffect, useMemo, useState } from "react";
import {
  Truck,
  PackagePlus,
  ClipboardCheck,
  Users,
  ChevronDown,
  Search,
  Loader2,
  AlertCircle,
  Check,
  X,
} from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { localizeTrader, formatAgentDate } from "./agentLocale";
import { listAvailableSupplies } from "../handlers/supply";
import { createConsignment, listMyConsignments, updateConsignmentStatus } from "../handlers/consignment";

/**
 * AgentConsignmentIntake.jsx
 * Commission Agent — creating a new consignment agreement against an
 * existing supply record, and reviewing/confirming recent intakes.
 *
 * IMPORTANT SHAPE CHANGE FROM THE OLD MOCK: this is NOT free-text "log a
 * delivery." createConsignment() requires a real supply_id — the supplier
 * already created that supply record (with their own cost_per_unit) via
 * supply.js. The agent only sets: quantity_consigned, selling_price_per_unit
 * (what THEY will resell at — separate from the supplier's cost), an
 * optional commission_rate (falls back to platform default if omitted),
 * and payment_term.
 *
 * KNOWN GAP: there is no handler anywhere in src/handlers/ that lets a
 * non-admin list suppliers. listAvailableSupplies(supplierId) needs a
 * supplierId, but nothing provides one. Until a real supplier-directory
 * endpoint exists, this screen takes a manual numeric Supplier ID input —
 * functional against the real API, but bad UX. Swap in a real picker once
 * that endpoint exists.
 *
 * KNOWN GAP: payment_term's valid values aren't documented in any handler
 * file — left as free text rather than guessing an enum.
 *
 * STATUS MODEL: consignment.js documents 4 real states with specific valid
 * transitions — pending -> confirmed/cancelled, confirmed -> completed/
 * cancelled. The old mock only had 3 (confirmed/pending/rejected). Fixed
 * to the real 4-state model below. Only a confirmed consignment with stock
 * left becomes visible to buyers in the marketplace (per consignment.js).
 *
 * Confirm/cancel actions on pending rows are wired here since this is
 * where an agent would naturally act on an intake they just created —
 * flag if that action actually belongs on a different screen instead.
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
  label: "#4a5240",
  errorBg: "#faeaea",
  errorText: "#b5544a",
};

// Single place to fix field names if the real consignment response differs.
function normalizeConsignment(raw) {
  return {
    id: raw.id,
    supplyId: raw.supply_id,
    itemName: raw.item_name ?? raw.supply?.item_name ?? null,
    supplierId: raw.supplier_id ?? raw.supply?.supplier_id ?? null,
    supplierName: raw.supplier?.name ?? raw.supplier_name ?? null,
    unit: raw.unit ?? raw.supply?.unit ?? "kg",
    quantity: raw.quantity_consigned,
    sellingPrice: raw.selling_price_per_unit,
    commissionRate: raw.commission_rate,
    paymentTerm: raw.payment_term,
    status: raw.status, // "pending" | "confirmed" | "completed" | "cancelled"
    date: raw.created_at ?? raw.date ?? null,
  };
}

function StatusBadge({ meta }) {
  if (!meta) return null;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ background: meta.bg, color: meta.text }}
    >
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
      <div className={`text-2xl ${isUr ? "font-urdu" : "font-display"}`} style={{ color: COLORS.ink }}>
        {value}
      </div>
      <div className="mt-1 text-sm" style={{ color: COLORS.muted }}>{label}</div>
    </div>
  );
}

const fieldLabelClass = "mb-1.5 block text-xs font-medium";
const inputClass = "w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:ring-2";

export default function AgentConsignmentIntake() {
  const { language, t } = useLanguage();
  const isUr = language === "ur";
  const trader = (name) => (name ? localizeTrader(name, language) : "");
  const headingClass = isUr ? "font-urdu" : "font-display";

  const STATUS_META = {
    confirmed: { label: t("agent.common.status.confirmed"), dot: COLORS.leaf, text: "#3f6b32", bg: "#e2ecd9" },
    completed: { label: t("agent.common.status.completed"), dot: COLORS.forest, text: COLORS.forest, bg: COLORS.greige },
    pending: { label: t("agent.common.status.awaitingConfirmation"), dot: COLORS.gold, text: "#8a6413", bg: "#f5e6c5" },
    cancelled: { label: t("agent.common.status.cancelled"), dot: COLORS.errorText, text: COLORS.errorText, bg: COLORS.errorBg },
  };

  // --- recent intakes list ---
  const [intakes, setIntakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [transitioningId, setTransitioningId] = useState(null);
  const [actionError, setActionError] = useState(null);

  async function fetchIntakes() {
    setLoading(true);
    setLoadError(null);
    const { data, error } = await listMyConsignments();
    if (error) {
      setLoadError(error);
      setIntakes([]);
    } else {
      setIntakes((data ?? []).map(normalizeConsignment));
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchIntakes();
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return intakes.filter((r) => {
      const matchesQuery =
        !q ||
        (r.itemName ?? "").toLowerCase().includes(q) ||
        trader(r.supplierName).toLowerCase().includes(q) ||
        String(r.id).includes(q);
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [intakes, query, statusFilter, language]);

  const totals = useMemo(() => {
    const now = new Date();
    const thisMonthItems = intakes.filter((r) => {
      if (!r.date) return false;
      const d = new Date(r.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const totalQty = intakes.reduce((s, r) => s + (r.quantity ?? 0), 0);
    const pendingCount = intakes.filter((r) => r.status === "pending").length;
    const activeSuppliers = new Set(intakes.map((r) => r.supplierId ?? r.supplierName).filter(Boolean)).size;
    return { totalQty, pendingCount, activeSuppliers, thisMonth: thisMonthItems.length };
  }, [intakes]);

  const pendingItems = intakes.filter((r) => r.status === "pending").slice(0, 4);

  async function handleTransition(consignmentId, status) {
    setActionError(null);
    setTransitioningId(consignmentId);
    const { error } = await updateConsignmentStatus(consignmentId, status);
    if (error) {
      setActionError(error);
    } else {
      setIntakes((prev) => prev.map((r) => (r.id === consignmentId ? { ...r, status } : r)));
    }
    setTransitioningId(null);
  }

  // --- intake form ---
  const [supplierIdInput, setSupplierIdInput] = useState("");
  const [supplies, setSupplies] = useState([]);
  const [suppliesLoading, setSuppliesLoading] = useState(false);
  const [suppliesError, setSuppliesError] = useState(null);

  const [form, setForm] = useState({
    supplyId: "",
    quantity: "",
    sellingPrice: "",
    commissionRate: "",
    paymentTerm: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleFindSupplies(e) {
    e.preventDefault();
    if (!supplierIdInput) return;
    setSuppliesLoading(true);
    setSuppliesError(null);
    setSupplies([]);
    setForm((f) => ({ ...f, supplyId: "" }));
    const { data, error } = await listAvailableSupplies(supplierIdInput);
    if (error) {
      setSuppliesError(error);
    } else {
      setSupplies(data ?? []);
    }
    setSuppliesLoading(false);
  }

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  const selectedSupply = supplies.find((s) => String(s.id) === String(form.supplyId));

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError(null);
    if (!form.supplyId || !form.quantity || !form.sellingPrice || !form.paymentTerm) return;

    setSubmitting(true);
    const payload = {
      supply_id: Number(form.supplyId),
      quantity_consigned: Number(form.quantity),
      selling_price_per_unit: Number(form.sellingPrice),
      payment_term: form.paymentTerm,
      ...(form.commissionRate ? { commission_rate: Number(form.commissionRate) } : {}),
    };
    const { data, error } = await createConsignment(payload);
    setSubmitting(false);

    if (error) {
      setSubmitError(error);
      return;
    }
    if (data) {
      setIntakes((prev) => [normalizeConsignment(data), ...prev]);
    } else {
      fetchIntakes();
    }
    setForm({ supplyId: "", quantity: "", sellingPrice: "", commissionRate: "", paymentTerm: "" });
    setSupplies([]);
    setSupplierIdInput("");
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2500);
  }

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
            <h1 className={`text-3xl ${headingClass}`} style={{ color: COLORS.ink }}>
              {t("agent.consignmentIntake.title")}
            </h1>
            <p className="mt-1.5 text-sm" style={{ color: COLORS.muted }}>
              {t("agent.consignmentIntake.subtitle")}
            </p>
          </div>
        </div>

        {loadError && (
          <div className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: COLORS.errorBg, color: COLORS.errorText }}>
            <div className="flex items-center gap-2">
              <AlertCircle size={16} />
              {(t("agent.consignmentIntake.loadError") || "Couldn't load intakes")}: {loadError}
            </div>
            <button onClick={fetchIntakes} className="rounded-lg border px-3 py-1 text-xs font-medium" style={{ borderColor: COLORS.errorText }}>
              {t("agent.commissions.retry") || "Retry"}
            </button>
          </div>
        )}
        {actionError && (
          <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: COLORS.errorBg, color: COLORS.errorText }}>
            <AlertCircle size={16} />
            {actionError}
          </div>
        )}

        {/* Stat cards */}
        <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <StatCard isUr={isUr} icon={Truck} label={t("agent.consignmentIntake.stats.receivedThisMonth")} value={totals.thisMonth} iconBg="#e2ecd9" iconColor={COLORS.leaf} />
          <StatCard isUr={isUr} icon={PackagePlus} label={t("agent.consignmentIntake.stats.totalQuantityIntake")} value={totals.totalQty.toLocaleString()} iconBg="#e2ecd9" iconColor={COLORS.leaf} />
          <StatCard isUr={isUr} icon={ClipboardCheck} label={t("agent.consignmentIntake.stats.awaitingConfirmation")} value={totals.pendingCount} iconBg="#f5e6c5" iconColor={COLORS.goldDark} />
          <StatCard isUr={isUr} icon={Users} label={t("agent.consignmentIntake.stats.activeSuppliers")} value={totals.activeSuppliers} iconBg={COLORS.errorBg} iconColor={COLORS.errorText} />
        </div>

        <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 340px" }}>
          {/* Left column: intake form + recent intakes table */}
          <div className="flex flex-col gap-6">
            {/* Intake form */}
            <div className="rounded-2xl border bg-white p-6" style={{ borderColor: COLORS.border }}>
              <h2 className={`mb-5 text-lg ${headingClass}`} style={{ color: COLORS.ink }}>
                {t("agent.consignmentIntake.recordNewIntake")}
              </h2>

              {/* Step 1: supplier + supply lookup — see file header note on the
                  missing supplier-directory endpoint */}
              <div className="mb-5 flex flex-wrap items-end gap-3 rounded-lg p-3" style={{ backgroundColor: COLORS.greige }}>
                <div className="min-w-[160px] flex-1">
                  <label className={fieldLabelClass} style={{ color: COLORS.label }}>
                    {t("agent.consignmentIntake.form.supplierId") || "Supplier ID"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={supplierIdInput}
                    onChange={(e) => setSupplierIdInput(e.target.value)}
                    placeholder={t("agent.consignmentIntake.form.supplierIdPlaceholder") || "e.g. 14"}
                    className={inputClass}
                    style={{ borderColor: COLORS.border, color: COLORS.ink, background: "#fff" }}
                  />
                </div>
                <button
                  onClick={handleFindSupplies}
                  disabled={!supplierIdInput || suppliesLoading}
                  className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-transform active:scale-[0.99] disabled:opacity-50"
                  style={{ backgroundColor: COLORS.forest, color: "#fff" }}
                >
                  {suppliesLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                  {t("agent.consignmentIntake.form.findSupplies") || "Find supplies"}
                </button>
              </div>
              {suppliesError && (
                <p className="mb-4 text-xs" style={{ color: COLORS.errorText }}>{suppliesError}</p>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-5 grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                  <div>
                    <label className={fieldLabelClass} style={{ color: COLORS.label }}>
                      {t("agent.consignmentIntake.form.supply") || "Supply"}
                    </label>
                    <select
                      value={form.supplyId}
                      onChange={(e) => handleChange("supplyId", e.target.value)}
                      disabled={supplies.length === 0}
                      className={`${inputClass} appearance-none disabled:opacity-50`}
                      style={{ borderColor: COLORS.border, color: COLORS.ink, background: "#fff" }}
                    >
                      <option value="">
                        {supplies.length === 0
                          ? (t("agent.consignmentIntake.form.noSuppliesYet") || "Look up a supplier first")
                          : (t("agent.consignmentIntake.form.selectSupply") || "Select a supply")}
                      </option>
                      {supplies.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.item_name} — {s.current_stock} {s.unit} @ {t("buyer.common.currency")} {s.cost_per_unit}
                        </option>
                      ))}
                    </select>
                    {selectedSupply && (
                      <p className="mt-1.5 text-xs" style={{ color: COLORS.muted }}>
                        {t("agent.consignmentIntake.form.stockAvailable") || "In stock"}: {selectedSupply.current_stock} {selectedSupply.unit}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className={fieldLabelClass} style={{ color: COLORS.label }}>
                      {t("agent.consignmentIntake.form.quantityKg")}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={selectedSupply?.current_stock}
                      value={form.quantity}
                      onChange={(e) => handleChange("quantity", e.target.value)}
                      placeholder="0"
                      className={inputClass}
                      style={{ borderColor: COLORS.border, color: COLORS.ink, background: "#fff" }}
                    />
                  </div>
                  <div>
                    <label className={fieldLabelClass} style={{ color: COLORS.label }}>
                      {t("agent.consignmentIntake.form.sellingPricePerUnit") || "Selling price / unit (Rs)"}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.sellingPrice}
                      onChange={(e) => handleChange("sellingPrice", e.target.value)}
                      placeholder="0"
                      className={inputClass}
                      style={{ borderColor: COLORS.border, color: COLORS.ink, background: "#fff" }}
                    />
                  </div>
                  <div>
                    <label className={fieldLabelClass} style={{ color: COLORS.label }}>
                      {t("agent.consignmentIntake.form.commissionRate") || "Commission rate % (optional)"}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={form.commissionRate}
                      onChange={(e) => handleChange("commissionRate", e.target.value)}
                      placeholder={t("agent.consignmentIntake.form.commissionRatePlaceholder") || "Platform default"}
                      className={inputClass}
                      style={{ borderColor: COLORS.border, color: COLORS.ink, background: "#fff" }}
                    />
                  </div>
                  <div>
                    {/* payment_term's valid values aren't documented anywhere
                        in the handler files — free text until confirmed */}
                    <label className={fieldLabelClass} style={{ color: COLORS.label }}>
                      {t("agent.consignmentIntake.form.paymentTerm") || "Payment term"}
                    </label>
                    <input
                      value={form.paymentTerm}
                      onChange={(e) => handleChange("paymentTerm", e.target.value)}
                      placeholder={t("agent.consignmentIntake.form.paymentTermPlaceholder") || "e.g. net_30"}
                      className={inputClass}
                      style={{ borderColor: COLORS.border, color: COLORS.ink, background: "#fff" }}
                    />
                  </div>
                </div>

                {submitError && (
                  <div className="mb-4 rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: COLORS.errorBg, color: COLORS.errorText }}>
                    {submitError}
                  </div>
                )}

                <div className="flex items-center gap-3.5">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-transform active:scale-[0.99] disabled:opacity-70"
                    style={{ backgroundColor: COLORS.gold, color: COLORS.forestDark }}
                  >
                    {submitting && <Loader2 size={14} className="animate-spin" />}
                    {t("agent.consignmentIntake.recordIntake")}
                  </button>
                  {submitted && (
                    <span className="text-xs font-medium" style={{ color: COLORS.leaf }}>
                      {t("agent.consignmentIntake.submittedMsg")}
                    </span>
                  )}
                </div>
              </form>
            </div>

            {/* Recent intakes table */}
            <div className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: COLORS.border }}>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5" style={{ borderColor: COLORS.border }}>
                <h2 className={`text-lg ${headingClass}`} style={{ color: COLORS.ink }}>
                  {t("agent.consignmentIntake.recentIntakes")}
                </h2>
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

              {loading ? (
                <div className="flex items-center justify-center gap-2 py-14 text-sm" style={{ color: COLORS.muted }}>
                  <Loader2 size={18} className="animate-spin" />
                  {t("agent.consignmentIntake.loading") || "Loading intakes…"}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-medium" style={{ color: COLORS.muted }}>{t("agent.common.table.consignment")}</th>
                        <th className="px-5 py-3 text-left text-xs font-medium" style={{ color: COLORS.muted }}>{t("agent.common.table.supplier")}</th>
                        <th className="px-5 py-3 text-left text-xs font-medium" style={{ color: COLORS.muted }}>{t("agent.common.table.product")}</th>
                        <th className="px-5 py-3 text-left text-xs font-medium" style={{ color: COLORS.muted }}>{t("agent.common.table.quantity")}</th>
                        <th className="px-5 py-3 text-left text-xs font-medium" style={{ color: COLORS.muted }}>{t("agent.common.table.unitPrice")}</th>
                        <th className="px-5 py-3 text-left text-xs font-medium" style={{ color: COLORS.muted }}>{t("agent.common.table.date")}</th>
                        <th className="px-5 py-3 text-left text-xs font-medium" style={{ color: COLORS.muted }}>{t("agent.common.table.status")}</th>
                        <th className="px-5 py-3 text-left text-xs font-medium" style={{ color: COLORS.muted }} />
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r) => (
                        <tr key={r.id} className="border-t" style={{ borderColor: COLORS.border }}>
                          <td className="px-5 py-4 text-sm font-semibold" style={{ color: COLORS.ink }}>#{r.id}</td>
                          <td className="px-5 py-4 text-sm">{r.supplierName ? trader(r.supplierName) : (r.supplierId ? `#${r.supplierId}` : "—")}</td>
                          <td className="px-5 py-4 text-sm">{r.itemName ?? "—"}</td>
                          <td className="px-5 py-4 text-sm">{(r.quantity ?? 0).toLocaleString()} {r.unit}</td>
                          <td className="px-5 py-4 text-sm">{t("buyer.common.currency")} {r.sellingPrice}</td>
                          <td className="px-5 py-4 text-sm" style={{ color: COLORS.muted }}>{r.date ? formatAgentDate(r.date, language) : "—"}</td>
                          <td className="px-5 py-4 text-sm">
                            <StatusBadge meta={STATUS_META[r.status]} />
                          </td>
                          <td className="px-5 py-4 text-sm">
                            {r.status === "pending" && (
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => handleTransition(r.id, "confirmed")}
                                  disabled={transitioningId === r.id}
                                  className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium disabled:opacity-50"
                                  style={{ borderColor: COLORS.leaf, color: COLORS.leaf }}
                                >
                                  {transitioningId === r.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                  {t("agent.common.confirm") || "Confirm"}
                                </button>
                                <button
                                  onClick={() => handleTransition(r.id, "cancelled")}
                                  disabled={transitioningId === r.id}
                                  className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium disabled:opacity-50"
                                  style={{ borderColor: COLORS.errorText, color: COLORS.errorText }}
                                >
                                  <X size={12} />
                                  {t("agent.common.cancel") || "Cancel"}
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                      {filtered.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-5 py-10 text-center text-sm" style={{ color: COLORS.muted }}>
                            {t("agent.consignmentIntake.noResults")}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Side column */}
          <div className="flex flex-col gap-6">
            {/* Awaiting confirmation — dark forest panel */}
            <div className="rounded-2xl p-6 text-white" style={{ backgroundColor: COLORS.forest }}>
              <div className="mb-4 flex items-center gap-2">
                <ClipboardCheck size={20} color={COLORS.gold} />
                <h3 className={`text-lg ${headingClass}`}>{t("agent.consignmentIntake.awaitingConfirmation")}</h3>
              </div>
              {pendingItems.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {pendingItems.map((r) => (
                    <div key={r.id} className="flex justify-between text-sm">
                      <span style={{ color: "rgba(255,255,255,0.9)" }}>{r.itemName ?? `#${r.id}`} · {trader(r.supplierName)}</span>
                      <span className="font-semibold">{(r.quantity ?? 0).toLocaleString()} {r.unit}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>{t("agent.consignmentIntake.nothingAwaiting")}</p>
              )}
            </div>

            {/* This month summary */}
            <div className="rounded-2xl border bg-white p-6" style={{ borderColor: COLORS.border }}>
              <h3 className={`text-lg ${headingClass}`} style={{ color: COLORS.ink }}>
                {t("agent.common.thisMonth")}
              </h3>
              <div className="mt-4 flex flex-col gap-3 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: COLORS.muted }}>{t("agent.consignmentIntake.thisMonth.consignmentsReceived")}</span>
                  <span className="font-semibold" style={{ color: COLORS.ink }}>{totals.thisMonth}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: COLORS.muted }}>{t("agent.consignmentIntake.thisMonth.totalQuantity")}</span>
                  <span className="font-semibold" style={{ color: COLORS.ink }}>{totals.totalQty.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: COLORS.muted }}>{t("agent.consignmentIntake.thisMonth.activeSuppliers")}</span>
                  <span className="font-semibold" style={{ color: COLORS.ink }}>{totals.activeSuppliers}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
