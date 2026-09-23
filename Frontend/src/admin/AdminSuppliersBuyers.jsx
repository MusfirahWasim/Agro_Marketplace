import { useEffect, useMemo, useState } from "react";
import {
  ShoppingBasket,
  Truck,
  Search,
  Phone,
  MapPin,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import Topbar from "./Topbar";
import { getBuyers } from "../handlers/buyer";
import { getSuppliers } from "../handlers/supplier";

/**
 * AdminBuyersSuppliers.jsx
 *
 * Admin's monitoring view of buyers and suppliers. Per the V2 spec, Admin
 * does not register or manage buyers/suppliers — the Commission Agent does
 * that. Admin only watches counts, active/inactive status, and outstanding
 * balances, so this page is read-only: no create/edit/deactivate actions.
 *
 * Visual system matches LoginPage.jsx / AdminDashboard.jsx / AdminAgents.jsx:
 * Fraunces for display type, Inter for body, Noto Nastaliq Urdu when RTL,
 * forest/gold palette via inline style, useLanguage()/t() for copy.
 *
 * Expects:
 *   getBuyers()     from ../handlers/buyer.js
 *   getSuppliers()  from ../handlers/supplier.js
 * Each should resolve to an array of records shaped roughly like:
 *   { id, name, phone, city, is_active, outstanding_balance }
 * Neither is named explicitly for Admin use in the V2 spec — buyer.js and
 * supplier.js are listed as new agent-facing handlers — so this assumes
 * they (or an admin-scoped equivalent) can also be called read-only here.
 * Swap in a dedicated admin handler if the real API separates the two.
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
  { key: "buyers", icon: ShoppingBasket, labelKey: "admin.buyersSuppliers.tabs.buyers" },
  { key: "suppliers", icon: Truck, labelKey: "admin.buyersSuppliers.tabs.suppliers" },
];

const STATUS_FILTERS = [
  { key: "all", labelKey: "admin.buyersSuppliers.filters.all" },
  { key: "active", labelKey: "admin.buyersSuppliers.filters.active" },
  { key: "inactive", labelKey: "admin.buyersSuppliers.filters.inactive" },
];

const currency = (value) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

function initials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function StatusPill({ active, t }) {
  return (
    <span
      className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0"
      style={
        active
          ? { backgroundColor: "#e8f0e4", color: COLORS.forest }
          : { backgroundColor: COLORS.greige, color: COLORS.muted }
      }
    >
      {active ? t("admin.buyersSuppliers.badge.active") : t("admin.buyersSuppliers.badge.inactive")}
    </span>
  );
}

function PartyCard({ record, t, isRTL }) {
  const hasOutstanding = (record.outstanding_balance ?? 0) > 0;

  return (
    <div className="rounded-xl border p-4" style={{ borderColor: COLORS.border, backgroundColor: "white" }}>
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-medium"
          style={{ backgroundColor: COLORS.greige, color: COLORS.ink }}
        >
          {initials(record.name)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3
              className={`text-base truncate ${isRTL ? "font-urdu" : "font-display"}`}
              style={{ color: COLORS.ink }}
            >
              {record.name}
            </h3>
            <StatusPill active={record.is_active} t={t} />
          </div>

          <div className="mt-1.5 flex flex-col gap-1 text-xs" style={{ color: COLORS.muted }}>
            {record.phone && (
              <span className="flex items-center gap-1.5">
                <Phone size={12} /> {record.phone}
              </span>
            )}
            {record.city && (
              <span className="flex items-center gap-1.5">
                <MapPin size={12} /> {record.city}
              </span>
            )}
          </div>
        </div>
      </div>

      <div
        className="mt-3 pt-3 border-t flex items-center justify-between"
        style={{ borderColor: COLORS.border }}
      >
        <span className="text-xs" style={{ color: COLORS.muted }}>
          {t("admin.buyersSuppliers.outstandingLabel")}
        </span>
        <span
          className="text-sm font-medium flex items-center gap-1"
          style={{ color: hasOutstanding ? COLORS.errorText : COLORS.ink }}
        >
          {hasOutstanding && <AlertTriangle size={12} />}
          {currency(record.outstanding_balance)}
        </span>
      </div>
    </div>
  );
}

export default function AdminBuyersSuppliers() {
  const { t, isRTL } = useLanguage();
  const [tab, setTab] = useState("buyers");
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [buyers, setBuyers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("loading");
      try {
        const [buyersRes, suppliersRes] = await Promise.all([getBuyers(), getSuppliers()]);
        if (cancelled) return;
        setBuyers(buyersRes ?? []);
        setSuppliers(suppliersRes ?? []);
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load buyers/suppliers:", err);
        setStatus("error");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const records = tab === "buyers" ? buyers : suppliers;

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (statusFilter === "active" && !r.is_active) return false;
      if (statusFilter === "inactive" && r.is_active) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const haystack = `${r.name ?? ""} ${r.phone ?? ""} ${r.city ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [records, statusFilter, query]);

  const totalOutstanding = useMemo(
    () => records.reduce((sum, r) => sum + (r.outstanding_balance ?? 0), 0),
    [records]
  );
  const activeCount = useMemo(() => records.filter((r) => r.is_active).length, [records]);

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
            {t("admin.buyersSuppliers.title")}
          </h1>
          <p className="text-sm max-w-[52ch]" style={{ color: COLORS.muted }}>
            {t("admin.buyersSuppliers.subtitle")}
          </p>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
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
              placeholder={t("admin.buyersSuppliers.searchPlaceholder")}
              className={`w-full py-2 rounded-lg border text-sm outline-none focus:ring-2 ${
                isRTL ? "pr-9 pl-3" : "pl-9 pr-3"
              }`}
              style={{ borderColor: COLORS.border, backgroundColor: "white" }}
            />
          </div>
        </div>

        {status === "ready" && (
          <div className="flex flex-wrap gap-3 mb-5">
            <div className="rounded-lg px-3 py-2 text-xs" style={{ backgroundColor: COLORS.greige, color: COLORS.muted }}>
              {t("admin.buyersSuppliers.summary.total", { count: records.length })}
            </div>
            <div className="rounded-lg px-3 py-2 text-xs" style={{ backgroundColor: "#e8f0e4", color: COLORS.forest }}>
              {t("admin.buyersSuppliers.summary.active", { count: activeCount })}
            </div>
            {totalOutstanding > 0 && (
              <div className="rounded-lg px-3 py-2 text-xs" style={{ backgroundColor: COLORS.errorBg, color: COLORS.errorText }}>
                {t("admin.buyersSuppliers.summary.outstanding", { amount: currency(totalOutstanding) })}
              </div>
            )}
          </div>
        )}

        <div className="inline-flex gap-1 mb-5">
          {STATUS_FILTERS.map(({ key, labelKey }) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className="text-xs font-medium py-1.5 px-3 rounded-full border transition-colors"
              style={
                statusFilter === key
                  ? { backgroundColor: COLORS.ink, color: "white", borderColor: COLORS.ink }
                  : { color: COLORS.muted, borderColor: COLORS.border }
              }
            >
              {t(labelKey)}
            </button>
          ))}
        </div>

        {status === "loading" && (
          <div className="flex items-center justify-center gap-2 py-16 text-sm" style={{ color: COLORS.muted }}>
            <Loader2 size={16} className="animate-spin" />
            {t("admin.buyersSuppliers.loading")}
          </div>
        )}

        {status === "error" && (
          <div className="text-sm rounded-lg px-4 py-3" style={{ backgroundColor: COLORS.errorBg, color: COLORS.errorText }}>
            {t("admin.buyersSuppliers.loadError")}
          </div>
        )}

        {status === "ready" && filtered.length === 0 && (
          <div
            className="text-sm rounded-xl px-4 py-10 text-center border"
            style={{ borderColor: COLORS.border, color: COLORS.muted }}
          >
            {query.trim()
              ? t("admin.buyersSuppliers.noResults")
              : t(`admin.buyersSuppliers.empty.${tab}`)}
          </div>
        )}

        {status === "ready" && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((record) => (
              <PartyCard key={record.id} record={record} t={t} isRTL={isRTL} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}