import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Loader2,
  ShoppingBasket,
  Truck,
  ArrowDownCircle,
  ArrowUpCircle,
  Scale,
} from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import Topbar from "./Topbar";
import { getOutstandingBalances } from "../handlers/account";

/**
 * AdminOutstandingBalances.jsx
 *
 * Admin's read-only view of money still owed on both sides of the ledger:
 * what buyers still owe the agent (receivable) and what the agent still
 * owes suppliers (payable). Sorted highest-outstanding-first by default so
 * the biggest exposures surface immediately — this is a monitoring screen,
 * no payment recording happens here (that's AgentPayments.jsx, on the
 * agent side).
 *
 * Visual system matches the rest of the admin section: Fraunces for display
 * type, Inter for body, Noto Nastaliq Urdu when RTL, forest/gold palette
 * via inline style, useLanguage()/t() for copy. Table layout, consistent
 * with AdminSalesOverview / AdminCommissionsOverview.
 *
 * Expects:
 *   getOutstandingBalances(partyType) from ../handlers/account.js
 *     partyType: "buyer" | "supplier"
 *     -> resolves to an array shaped roughly like:
 *        { id, name, phone, city, outstanding_balance, last_activity_at }
 * account.js is listed in the spec as a straight reuse, but no exact
 * admin-facing signature is given for "outstanding only, by party type" —
 * this assumes that shape. Adjust to match routers/account.py once it's
 * built, or swap to filtering a general getAccounts() call client-side.
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
  muted: "#6b7568",
  border: "#d9ddce",
  errorBg: "#faeaea",
  errorText: "#b5544a",
};

const TABS = [
  { key: "buyer", icon: ShoppingBasket, labelKey: "admin.outstandingBalances.tabs.buyers" },
  { key: "supplier", icon: Truck, labelKey: "admin.outstandingBalances.tabs.suppliers" },
];

const currency = (value) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

const count = (value) => new Intl.NumberFormat("en-PK").format(value ?? 0);

function daysAgo(dateStr, t) {
  if (!dateStr) return t("admin.outstandingBalances.noActivity");
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return t("admin.outstandingBalances.today");
  if (diff === 1) return t("admin.outstandingBalances.yesterday");
  return t("admin.outstandingBalances.daysAgo", { count: diff });
}

function agingTone(dateStr) {
  if (!dateStr) return COLORS.muted;
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  if (diff > 30) return COLORS.errorText;
  if (diff > 14) return COLORS.goldDark;
  return COLORS.muted;
}

function SummaryCard({ icon: Icon, label, value, tone = "neutral" }) {
  const tones = {
    neutral: { bg: COLORS.greige, color: COLORS.ink },
    receivable: { bg: "#e8f0e4", color: COLORS.forest },
    payable: { bg: COLORS.errorBg, color: COLORS.errorText },
    gold: { bg: "#fdf3de", color: COLORS.goldDark },
  };
  const { bg, color } = tones[tone];
  return (
    <div
      className="flex items-center gap-3 rounded-xl border p-4 flex-1 min-w-[190px]"
      style={{ borderColor: COLORS.border, backgroundColor: "white" }}
    >
      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
        <Icon size={17} color={color} />
      </div>
      <div className="min-w-0">
        <p className="text-xs" style={{ color: COLORS.muted }}>{label}</p>
        <p className="font-display text-xl truncate" style={{ color: COLORS.ink }}>{value}</p>
      </div>
    </div>
  );
}

export default function AdminOutstandingBalances() {
  const { t, isRTL } = useLanguage();
  const [tab, setTab] = useState("buyer");
  const [buyerBalances, setBuyerBalances] = useState([]);
  const [supplierBalances, setSupplierBalances] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("loading");
      try {
        const [buyersRes, suppliersRes] = await Promise.all([
          getOutstandingBalances("buyer"),
          getOutstandingBalances("supplier"),
        ]);
        if (cancelled) return;
        setBuyerBalances(buyersRes ?? []);
        setSupplierBalances(suppliersRes ?? []);
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load outstanding balances:", err);
        setStatus("error");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalReceivable = useMemo(
    () => buyerBalances.reduce((sum, b) => sum + (b.outstanding_balance ?? 0), 0),
    [buyerBalances]
  );
  const totalPayable = useMemo(
    () => supplierBalances.reduce((sum, s) => sum + (s.outstanding_balance ?? 0), 0),
    [supplierBalances]
  );
  const netPosition = totalReceivable - totalPayable;

  const activeList = tab === "buyer" ? buyerBalances : supplierBalances;

  const filtered = useMemo(() => {
    const list = activeList.filter((r) => (r.outstanding_balance ?? 0) > 0);
    const q = query.trim().toLowerCase();
    const searched = q
      ? list.filter((r) => `${r.name ?? ""} ${r.phone ?? ""} ${r.city ?? ""}`.toLowerCase().includes(q))
      : list;
    return [...searched].sort((a, b) => (b.outstanding_balance ?? 0) - (a.outstanding_balance ?? 0));
  }, [activeList, query]);

  return (
    <div className="min-h-screen w-full flex flex-col" style={{ backgroundColor: COLORS.cream }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&family=Noto+Nastaliq+Urdu:wght@500;700&display=swap');
        .font-display { font-family: 'Fraunces', serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        .font-urdu { font-family: 'Noto Nastaliq Urdu', serif; }
      `}</style>

      <Topbar />

      <div dir={isRTL ? "rtl" : "ltr"} className="flex-1 w-full font-body px-6 sm:px-12 py-10">
        <header className="pb-5 mb-6 border-b" style={{ borderColor: COLORS.border }}>
          <h1 className={`text-3xl mb-1 ${isRTL ? "font-urdu" : "font-display"}`} style={{ color: COLORS.ink }}>
            {t("admin.outstandingBalances.title")}
          </h1>
          <p className="text-sm max-w-[52ch]" style={{ color: COLORS.muted }}>
            {t("admin.outstandingBalances.subtitle")}
          </p>
        </header>

        {status === "ready" && (
          <div className="flex flex-wrap gap-3 mb-6">
            <SummaryCard
              icon={ArrowDownCircle}
              label={t("admin.outstandingBalances.summary.receivable")}
              value={currency(totalReceivable)}
              tone="receivable"
            />
            <SummaryCard
              icon={ArrowUpCircle}
              label={t("admin.outstandingBalances.summary.payable")}
              value={currency(totalPayable)}
              tone="payable"
            />
            <SummaryCard
              icon={Scale}
              label={t("admin.outstandingBalances.summary.net")}
              value={currency(netPosition)}
              tone={netPosition >= 0 ? "receivable" : "payable"}
            />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="inline-flex gap-1 p-1 rounded-xl" style={{ backgroundColor: COLORS.greige }}>
            {TABS.map(({ key, icon: Icon, labelKey }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className="flex items-center gap-1.5 text-sm font-medium py-2 px-3.5 rounded-lg transition-colors"
                style={
                  tab === key
                    ? { backgroundColor: COLORS.forest, color: "white" }
                    : { color: COLORS.muted }
                }
              >
                <Icon size={14} />
                {t(labelKey)}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search
              size={15}
              className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "right-3" : "left-3"}`}
              color={COLORS.muted}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("admin.outstandingBalances.searchPlaceholder")}
              className={`w-full py-2 rounded-lg border text-sm outline-none focus:ring-2 ${
                isRTL ? "pr-9 pl-3" : "pl-9 pr-3"
              }`}
              style={{ borderColor: COLORS.border, backgroundColor: "white" }}
            />
          </div>
        </div>

        {status === "loading" && (
          <div className="flex items-center justify-center gap-2 py-16 text-sm" style={{ color: COLORS.muted }}>
            <Loader2 size={16} className="animate-spin" />
            {t("admin.outstandingBalances.loading")}
          </div>
        )}

        {status === "error" && (
          <div className="text-sm rounded-lg px-4 py-3" style={{ backgroundColor: COLORS.errorBg, color: COLORS.errorText }}>
            {t("admin.outstandingBalances.loadError")}
          </div>
        )}

        {status === "ready" && filtered.length === 0 && (
          <div
            className="text-sm rounded-xl px-4 py-10 text-center border"
            style={{ borderColor: COLORS.border, color: COLORS.muted }}
          >
            {query.trim()
              ? t("admin.outstandingBalances.noResults")
              : t(`admin.outstandingBalances.empty.${tab}`)}
          </div>
        )}

        {status === "ready" && filtered.length > 0 && (
          <div className="rounded-xl border overflow-x-auto" style={{ borderColor: COLORS.border, backgroundColor: "white" }}>
            <table className="w-full text-sm" style={{ minWidth: 640 }}>
              <thead>
                <tr className="border-b" style={{ borderColor: COLORS.border }}>
                  {["name", "contact", "lastActivity", "outstanding"].map((col) => (
                    <th
                      key={col}
                      className={`px-4 py-3 font-medium ${isRTL ? "text-right" : "text-left"}`}
                      style={{ color: COLORS.muted }}
                    >
                      {t(`admin.outstandingBalances.columns.${col}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-b last:border-b-0" style={{ borderColor: COLORS.border }}>
                    <td className="px-4 py-3" style={{ color: COLORS.ink }}>{row.name}</td>
                    <td className="px-4 py-3" style={{ color: COLORS.muted }}>
                      {[row.phone, row.city].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td className="px-4 py-3" style={{ color: agingTone(row.last_activity_at) }}>
                      {daysAgo(row.last_activity_at, t)}
                    </td>
                    <td
                      className="px-4 py-3 font-medium"
                      style={{ color: tab === "buyer" ? COLORS.forest : COLORS.errorText }}
                    >
                      {currency(row.outstanding_balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}