import { useEffect, useMemo, useState } from "react";
import { Landmark, CircleCheck, Clock, AlertTriangle, ChevronDown, Search, Loader2, AlertCircle, Check, X } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { localizeTrader, formatAgentCurrency, formatAgentDate } from "./agentLocale";
import { listMyPayments, createPayment } from "../handlers/payment";
import { getMyLedger } from "../handlers/account";

/**
 * AgentSettlements.jsx
 * Commission Agent — payments the agent owes/has paid to suppliers.
 *
 * SETTLED rows are real: listMyPayments(), filtered to payee_type === "S"
 * (agent paying a supplier). Solid fields straight from payment.js's own
 * payload spec (amount_paid, payment_method, transaction_reference,
 * payment_date).
 *
 * DUE/OVERDUE rows are still on shaky ground: getMyLedger()'s response
 * shape is undocumented anywhere (same gap as AgentDashboard's "Owed to
 * Suppliers" widget — same guessed field names, see normalizeLedgerEntry).
 * There's also no due_date field documented on a ledger entry, so
 * due-vs-overdue can't be reliably computed — everything outstanding is
 * bucketed as "due" until a due-date field is confirmed to exist.
 *
 * REAL ACTION: createPayment() actually exists, so the "Settle" button here
 * is wired for real — it opens an inline form and creates a real payment.
 * Note createPayment's payload has no consignment-reference field at all
 * (only an optional order_id) — a settlement here is agent-to-supplier
 * money movement, not tied to one specific consignment.
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

function normalizePayment(raw) {
  return {
    kind: "payment",
    id: raw.id,
    supplierName: raw.payee?.name ?? raw.payee_name ?? null,
    supplierId: raw.payee_id,
    payeeType: raw.payee_type,
    orderId: raw.order_id ?? null,
    amount: raw.amount_paid ?? 0,
    method: raw.payment_method,
    reference: raw.transaction_reference ?? null,
    date: raw.payment_date ?? raw.created_at ?? null,
    status: "settled",
  };
}

// Guessed shape — see file header note.
function normalizeLedgerEntry(raw) {
  const amount = Math.abs(raw.amount ?? 0);
  const direction = raw.direction ?? (raw.amount < 0 ? "payable" : "receivable");
  return {
    kind: "ledger",
    id: raw.id,
    supplierName: raw.counterparty_name ?? raw.party_name ?? null,
    supplierId: raw.counterparty_id ?? raw.party_id ?? null,
    orderId: raw.order_id ?? null,
    amount,
    direction,
    dueDate: raw.due_date ?? null, // unconfirmed field — see header note
    date: raw.created_at ?? null,
    status: raw.due_date && new Date(raw.due_date) < new Date() ? "overdue" : "due",
  };
}

function StatusBadge({ meta }) {
  if (!meta) return null;
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

export default function AgentSettlements() {
  const { language, t } = useLanguage();
  const isUr = language === "ur";
  const trader = (name) => (name ? localizeTrader(name, language) : "");
  const headingClass = isUr ? "font-urdu" : "font-display";

  const STATUS_META = {
    settled: { label: t("agent.common.status.settled"), dot: COLORS.leaf, text: "#3f6b32", bg: "#e2ecd9" },
    due: { label: t("agent.common.status.due"), dot: COLORS.gold, text: "#8a6413", bg: "#f5e6c5" },
    overdue: { label: t("agent.common.status.overdue"), dot: COLORS.errorText, text: COLORS.errorText, bg: COLORS.errorBg },
  };

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // settle form state
  const [settlingId, setSettlingId] = useState(null);
  const [settleForm, setSettleForm] = useState({ method: "cash", amount: "", reference: "" });
  const [settleSubmitting, setSettleSubmitting] = useState(false);
  const [settleError, setSettleError] = useState(null);

  async function fetchSettlements() {
    setLoading(true);
    setLoadError(null);
    const [paymentsRes, ledgerRes] = await Promise.all([listMyPayments(), getMyLedger()]);
    const firstError = paymentsRes.error || ledgerRes.error;
    if (firstError) {
      setLoadError(firstError);
      setRows([]);
      setLoading(false);
      return;
    }

    const settled = (paymentsRes.data ?? [])
      .map(normalizePayment)
      .filter((p) => p.payeeType === "S");

    const outstanding = (ledgerRes.data ?? [])
      .map(normalizeLedgerEntry)
      .filter((l) => l.direction === "payable");

    setRows([...settled, ...outstanding]);
    setLoading(false);
  }

  useEffect(() => {
    fetchSettlements();
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return rows.filter((r) => {
      const matchesQuery =
        !q ||
        trader(r.supplierName).toLowerCase().includes(q) ||
        String(r.id).includes(q) ||
        String(r.orderId ?? "").includes(q);
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [rows, query, statusFilter, language]);

  const totals = useMemo(() => {
    const settled = rows.filter((r) => r.status === "settled").reduce((s, r) => s + r.amount, 0);
    const due = rows.filter((r) => r.status === "due").reduce((s, r) => s + r.amount, 0);
    const overdue = rows.filter((r) => r.status === "overdue").reduce((s, r) => s + r.amount, 0);
    return { settled, due, overdue, owed: due + overdue };
  }, [rows]);

  const outstandingSorted = useMemo(
    () => rows.filter((r) => r.status === "due" || r.status === "overdue").sort((a, b) => b.amount - a.amount),
    [rows]
  );
  const owedItems = outstandingSorted.slice(0, 4);

  function openSettleForm(row) {
    setSettleError(null);
    setSettlingId(row.id);
    setSettleForm({ method: "cash", amount: String(row.amount), reference: "" });
  }

  async function handleConfirmSettle(row) {
    setSettleError(null);
    setSettleSubmitting(true);
    const payload = {
      payee_id: row.supplierId,
      payee_type: "S",
      payment_method: settleForm.method,
      amount_paid: Number(settleForm.amount),
      ...(row.orderId ? { order_id: row.orderId } : {}),
      ...(settleForm.reference ? { transaction_reference: settleForm.reference } : {}),
      payment_date: new Date().toISOString().slice(0, 10),
    };
    const { error } = await createPayment(payload);
    setSettleSubmitting(false);
    if (error) {
      setSettleError(error);
      return;
    }
    setSettlingId(null);
    fetchSettlements();
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
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className={`text-3xl ${headingClass}`} style={{ color: COLORS.ink }}>{t("agent.settlements.title")}</h1>
            <p className="mt-1.5 text-sm" style={{ color: COLORS.muted }}>{t("agent.settlements.subtitle")}</p>
          </div>
        </div>

        {loadError && (
          <div className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: COLORS.errorBg, color: COLORS.errorText }}>
            <div className="flex items-center gap-2">
              <AlertCircle size={16} />
              {(t("agent.settlements.loadError") || "Couldn't load settlements")}: {loadError}
            </div>
            <button onClick={fetchSettlements} className="rounded-lg border px-3 py-1 text-xs font-medium" style={{ borderColor: COLORS.errorText }}>
              {t("agent.commissions.retry") || "Retry"}
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border bg-white py-16 text-sm" style={{ borderColor: COLORS.border, color: COLORS.muted }}>
            <Loader2 size={18} className="animate-spin" />
            {t("agent.settlements.loading") || "Loading settlements…"}
          </div>
        ) : (
          <>
            <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              <StatCard isUr={isUr} icon={Landmark} label={t("agent.settlements.stats.owedToSuppliers")} value={formatAgentCurrency(totals.owed, t)} iconBg={COLORS.errorBg} iconColor={COLORS.errorText} />
              <StatCard isUr={isUr} icon={Clock} label={t("agent.settlements.stats.dueThisMonth")} value={formatAgentCurrency(totals.due, t)} iconBg="#f5e6c5" iconColor={COLORS.goldDark} />
              <StatCard isUr={isUr} icon={AlertTriangle} label={t("agent.settlements.stats.overdue")} value={formatAgentCurrency(totals.overdue, t)} iconBg={COLORS.errorBg} iconColor={COLORS.errorText} />
              <StatCard isUr={isUr} icon={CircleCheck} label={t("agent.settlements.stats.settledThisMonth")} value={formatAgentCurrency(totals.settled, t)} iconBg="#e2ecd9" iconColor={COLORS.leaf} />
            </div>

            <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 340px" }}>
              <div className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: COLORS.border }}>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5" style={{ borderColor: COLORS.border }}>
                  <h2 className={`text-lg ${headingClass}`} style={{ color: COLORS.ink }}>{t("agent.settlements.settlementHistory")}</h2>
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center gap-2 rounded-lg border px-3 py-2" style={{ borderColor: COLORS.border }}>
                      <Search size={16} color={COLORS.iconMuted} />
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t("agent.common.searchSupplierOrId")}
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
                        <option value="settled">{t("agent.common.status.settled")}</option>
                        <option value="due">{t("agent.common.status.due")}</option>
                        <option value="overdue">{t("agent.common.status.overdue")}</option>
                      </select>
                      <ChevronDown size={16} color={COLORS.iconMuted} className="pointer-events-none absolute right-2.5 top-2.5" />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-medium" style={{ color: COLORS.muted }}>{t("agent.common.table.settlement")}</th>
                        <th className="px-5 py-3 text-left text-xs font-medium" style={{ color: COLORS.muted }}>{t("agent.common.table.supplier")}</th>
                        <th className="px-5 py-3 text-left text-xs font-medium" style={{ color: COLORS.muted }}>{t("agent.common.table.order") || "Order"}</th>
                        <th className="px-5 py-3 text-left text-xs font-medium" style={{ color: COLORS.muted }}>{t("agent.common.table.amount")}</th>
                        <th className="px-5 py-3 text-left text-xs font-medium" style={{ color: COLORS.muted }}>{t("agent.common.table.dueDate")}</th>
                        <th className="px-5 py-3 text-left text-xs font-medium" style={{ color: COLORS.muted }}>{t("agent.common.table.status")}</th>
                        <th className="px-5 py-3 text-left text-xs font-medium" style={{ color: COLORS.muted }} />
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r) => (
                        <>
                          <tr key={`${r.kind}-${r.id}`} className="border-t" style={{ borderColor: COLORS.border }}>
                            <td className="px-5 py-4 text-sm font-semibold" style={{ color: COLORS.ink }}>#{r.id}</td>
                            <td className="px-5 py-4 text-sm">{r.supplierName ? trader(r.supplierName) : (r.supplierId ? `#${r.supplierId}` : "—")}</td>
                            <td className="px-5 py-4 text-sm" style={{ color: COLORS.muted }}>{r.orderId ? `#${r.orderId}` : "—"}</td>
                            <td className="px-5 py-4 text-sm font-semibold" style={{ color: COLORS.ink }}>{formatAgentCurrency(r.amount, t)}</td>
                            <td className="px-5 py-4 text-sm">{r.dueDate ? formatAgentDate(r.dueDate, language) : (r.date ? formatAgentDate(r.date, language) : "—")}</td>
                            <td className="px-5 py-4 text-sm">
                              <StatusBadge meta={STATUS_META[r.status]} />
                            </td>
                            <td className="px-5 py-4 text-sm">
                              {r.kind === "ledger" && settlingId !== r.id && (
                                <button
                                  onClick={() => openSettleForm(r)}
                                  className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium"
                                  style={{ borderColor: COLORS.leaf, color: COLORS.leaf }}
                                >
                                  {t("agent.settlements.settle") || "Settle"}
                                </button>
                              )}
                            </td>
                          </tr>
                          {settlingId === r.id && (
                            <tr style={{ backgroundColor: COLORS.greige }}>
                              <td colSpan={7} className="px-5 py-4">
                                <div className="flex flex-wrap items-end gap-3">
                                  <div>
                                    <label className="mb-1 block text-xs font-medium" style={{ color: COLORS.muted }}>
                                      {t("agent.settlements.form.method") || "Payment method"}
                                    </label>
                                    <select
                                      value={settleForm.method}
                                      onChange={(e) => setSettleForm((f) => ({ ...f, method: e.target.value }))}
                                      className="rounded-lg border px-3 py-2 text-sm"
                                      style={{ borderColor: COLORS.border, background: "#fff" }}
                                    >
                                      <option value="cash">{t("agent.common.payment.cash")}</option>
                                      <option value="card">{t("agent.common.payment.card") || "Card"}</option>
                                      <option value="other">{t("agent.common.payment.other") || "Other"}</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-xs font-medium" style={{ color: COLORS.muted }}>
                                      {t("agent.settlements.form.amount") || "Amount"}
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={settleForm.amount}
                                      onChange={(e) => setSettleForm((f) => ({ ...f, amount: e.target.value }))}
                                      className="w-32 rounded-lg border px-3 py-2 text-sm"
                                      style={{ borderColor: COLORS.border, background: "#fff" }}
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-xs font-medium" style={{ color: COLORS.muted }}>
                                      {t("agent.settlements.form.reference") || "Reference (optional)"}
                                    </label>
                                    <input
                                      value={settleForm.reference}
                                      onChange={(e) => setSettleForm((f) => ({ ...f, reference: e.target.value }))}
                                      className="w-40 rounded-lg border px-3 py-2 text-sm"
                                      style={{ borderColor: COLORS.border, background: "#fff" }}
                                    />
                                  </div>
                                  <button
                                    onClick={() => handleConfirmSettle(r)}
                                    disabled={settleSubmitting || !settleForm.amount}
                                    className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50"
                                    style={{ backgroundColor: COLORS.leaf, color: "#fff" }}
                                  >
                                    {settleSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                    {t("agent.settlements.form.confirm") || "Confirm payment"}
                                  </button>
                                  <button
                                    onClick={() => setSettlingId(null)}
                                    className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium"
                                    style={{ borderColor: COLORS.border, color: COLORS.muted }}
                                  >
                                    <X size={14} />
                                    {t("agent.common.cancel") || "Cancel"}
                                  </button>
                                </div>
                                {settleError && (
                                  <p className="mt-2 text-xs" style={{ color: COLORS.errorText }}>{settleError}</p>
                                )}
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                      {filtered.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-5 py-10 text-center text-sm" style={{ color: COLORS.muted }}>
                            {t("agent.settlements.noResults")}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="rounded-2xl p-6 text-white" style={{ backgroundColor: COLORS.forest }}>
                  <div className="mb-4 flex items-center gap-2">
                    <AlertTriangle size={20} color={COLORS.gold} />
                    <h3 className={`text-lg ${headingClass}`}>{t("agent.settlements.owedToSuppliers")}</h3>
                  </div>
                  {owedItems.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {owedItems.map((r) => (
                        <div key={r.id} className="flex justify-between text-sm">
                          <span style={{ color: "rgba(255,255,255,0.9)" }}>{r.supplierName ? trader(r.supplierName) : `#${r.supplierId}`}</span>
                          <span className="font-semibold">{formatAgentCurrency(r.amount, t)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>{t("agent.settlements.nothingOwed")}</p>
                  )}
                  <button
                    onClick={() => outstandingSorted[0] && openSettleForm(outstandingSorted[0])}
                    disabled={outstandingSorted.length === 0}
                    className="mt-5 w-full rounded-lg py-2.5 text-sm font-medium transition-transform active:scale-[0.99] disabled:opacity-50"
                    style={{ backgroundColor: COLORS.gold, color: COLORS.forestDark }}
                  >
                    {t("agent.settlements.settleNow")}
                  </button>
                </div>

                <div className="rounded-2xl border bg-white p-6" style={{ borderColor: COLORS.border }}>
                  <h3 className={`text-lg ${headingClass}`} style={{ color: COLORS.ink }}>{t("agent.common.thisMonth")}</h3>
                  <div className="mt-4 flex flex-col gap-3 text-sm">
                    <div className="flex justify-between">
                      <span style={{ color: COLORS.muted }}>{t("agent.settlements.thisMonth.settlementsRecorded")}</span>
                      <span className="font-semibold" style={{ color: COLORS.ink }}>{rows.filter((r) => r.status === "settled").length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: COLORS.muted }}>{t("agent.settlements.thisMonth.totalSettled")}</span>
                      <span className="font-semibold" style={{ color: COLORS.ink }}>{formatAgentCurrency(totals.settled, t)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: COLORS.muted }}>{t("agent.settlements.thisMonth.stillOutstanding")}</span>
                      <span className="font-semibold" style={{ color: COLORS.ink }}>{formatAgentCurrency(totals.owed, t)}</span>
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
