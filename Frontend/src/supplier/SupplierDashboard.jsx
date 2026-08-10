import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sprout,
  PackageCheck,
  Wallet,
  Hourglass,
  Plus,
  ArrowUpRight,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { localizeTrader } from "../i18n/dataLocale";
import { listMyConsignmentHistory } from "../handlers/consignment";
import { listMySupplies } from "../handlers/supply";
import { getMyLedger } from "../handlers/account";

const COLORS = {
  forest: "#1e4620",
  forestDark: "#122b15",
  leaf: "#4d8b3d",
  gold: "#f0b84c",
  cream: "#faf8f2",
  greige: "#eef0e9",
  ink: "#17231a",
  sub: "#6b7568",
};

// Real ConsignmentStatus enum (consignment.py) — replaces the old
// fabricated inMarket/sold/settled labels, which didn't correspond to
// anything the backend actually returns.
const STATUS_STYLE = {
  pending: { bg: "#fdf1dc", text: "#a3721b" },
  confirmed: { bg: "#eaf1e4", text: COLORS.leaf },
  completed: { bg: "#e6ede6", text: COLORS.forest },
  cancelled: { bg: "#f5e6e6", text: "#a34c3c" },
};

// ASSUMPTION — no backend-defined low-stock threshold exists yet.
// Picked 50 as a placeholder; move this server-side once there's a
// real per-supply or platform-level threshold to key off of.
const LOW_STOCK_THRESHOLD = 50;

function inCurrentMonth(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

export default function SupplierDashboard() {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const isUr = language === "ur";
  const trader = (name) => localizeTrader(name, language);

  const [supplies, setSupplies] = useState([]);
  const [consignments, setConsignments] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const [suppliesRes, consignmentsRes, ledgerRes] = await Promise.all([
        listMySupplies(),
        listMyConsignmentHistory(),
        getMyLedger(),
      ]);

      if (cancelled) return;

      const firstError = suppliesRes.error || consignmentsRes.error || ledgerRes.error;
      if (firstError) {
        setError(firstError);
      } else {
        setSupplies(suppliesRes.data || []);
        setConsignments(consignmentsRes.data || []);
        setLedger(ledgerRes.data || []);
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---- derived stats -------------------------------------------------

  const stockStats = useMemo(() => {
    const stockAvailable = supplies.reduce((sum, s) => sum + (s.current_stock || 0), 0);
    // Supplies can carry different units (kg, dozen, litre...). Only
    // label the total with a unit when every supply actually shares one;
    // otherwise fall back to a generic count so we're not mislabeling.
    const commonUnit =
      supplies.length > 0 && supplies.every((s) => s.unit === supplies[0].unit)
        ? supplies[0].unit
        : null;
    return { stockAvailable, commonUnit };
  }, [supplies]);

  const consignmentStats = useMemo(() => {
    const activeConsignments = consignments.filter(
      (c) => c.status === "pending" || c.status === "confirmed"
    ).length;
    // Replaces the old fabricated "awaitingPickup" stat — there's no
    // backend concept of a pickup stage, only pending -> confirmed. This
    // is the real equivalent: consignments the agent hasn't confirmed yet.
    const pendingConfirmation = consignments.filter((c) => c.status === "pending").length;
    return { activeConsignments, pendingConfirmation };
  }, [consignments]);

  const ledgerStats = useMemo(() => {
    // ASSUMPTION: no accounts.py/schema was provided for ledger entries.
    // Guessing a shape of { amount, status: "pending" | "settled",
    // created_at }. Verify this against the real /api/accounts/me
    // response and adjust the field names below if they differ.
    const pendingSettlements = ledger
      .filter((entry) => entry.status === "pending")
      .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

    const settlementsReceivedThisMonth = ledger
      .filter((entry) => entry.status === "settled" && inCurrentMonth(entry.created_at))
      .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

    return { pendingSettlements, settlementsReceivedThisMonth };
  }, [ledger]);

  const monthConsignmentStats = useMemo(() => {
    const thisMonth = consignments.filter((c) => inCurrentMonth(c.consigned_at));
    const totalConsigned = thisMonth.reduce((sum, c) => sum + (c.quantity_consigned || 0), 0);
    const totalSold = thisMonth.reduce((sum, c) => sum + (c.quantity_sold || 0), 0);
    return { totalConsigned, totalSold };
  }, [consignments]);

  const recentConsignments = useMemo(() => {
    return [...consignments]
      .sort((a, b) => new Date(b.consigned_at) - new Date(a.consigned_at))
      .slice(0, 5);
  }, [consignments]);

  const lowStockItems = useMemo(() => {
    return [...supplies]
      .filter((s) => (s.current_stock ?? 0) <= LOW_STOCK_THRESHOLD)
      .sort((a, b) => (a.current_stock ?? 0) - (b.current_stock ?? 0))
      .slice(0, 5);
  }, [supplies]);

  const STATS = [
    {
      key: "stockAvailable",
      label: t("supplier.dashboard.stats.stockAvailable"),
      value: stockStats.commonUnit
        ? `${stockStats.stockAvailable.toLocaleString()} ${stockStats.commonUnit}`
        : stockStats.stockAvailable.toLocaleString(),
      icon: Sprout,
      tint: COLORS.leaf,
    },
    {
      key: "activeConsignments",
      label: t("supplier.dashboard.stats.activeConsignments"),
      value: consignmentStats.activeConsignments.toLocaleString(),
      icon: PackageCheck,
      tint: COLORS.forest,
    },
    {
      key: "pendingSettlements",
      label: t("supplier.dashboard.stats.pendingSettlements"),
      value: `${t("supplier.common.currency")} ${ledgerStats.pendingSettlements.toLocaleString()}`,
      icon: Wallet,
      tint: COLORS.gold,
    },
    {
      // Renamed from "awaitingPickup" — see consignmentStats comment above.
      // New i18n key needed: supplier.dashboard.stats.pendingConfirmation
      key: "pendingConfirmation",
      label: t("supplier.dashboard.stats.pendingConfirmation"),
      value: consignmentStats.pendingConfirmation.toLocaleString(),
      icon: Hourglass,
      tint: "#a35c2b",
    },
  ];

  if (loading) {
    return (
      <div
        className="font-body flex items-center justify-center gap-2 py-24"
        style={{ backgroundColor: COLORS.cream, color: COLORS.sub }}
        dir={isUr ? "rtl" : "ltr"}
      >
        <Loader2 size={18} className="animate-spin" />
        {/* new i18n key needed: supplier.dashboard.loading */}
        <span className="text-sm">{t("supplier.dashboard.loading")}</span>
      </div>
    );
  }

  return (
    <div className="font-body" style={{ backgroundColor: COLORS.cream }} dir={isUr ? "rtl" : "ltr"}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&family=Noto+Nastaliq+Urdu:wght@500;700&display=swap');
        .font-display { font-family: ${isUr ? "'Noto Nastaliq Urdu', serif" : "'Fraunces', serif"}; }
        .font-body { font-family: ${isUr ? "'Noto Nastaliq Urdu', serif" : "'Inter', sans-serif"}; }
      `}</style>

      {error && (
        <div
          className="flex items-center gap-2 text-sm rounded-lg px-3 py-2 mb-6"
          style={{ backgroundColor: "#faeaea", color: "#b5544a" }}
        >
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl" style={{ color: COLORS.ink }}>
            {t("supplier.dashboard.welcome", { name: trader("") })}
          </h1>
          <p className="text-sm mt-1" style={{ color: COLORS.sub }}>
            {t("supplier.dashboard.subtitle")}
          </p>
        </div>
        <button
          onClick={() => navigate("/supplier/supplies")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium self-start"
          style={{ backgroundColor: COLORS.gold, color: COLORS.forestDark }}
        >
          <Plus size={16} />
          {t("supplier.dashboard.addNewSupply")}
        </button>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STATS.map((s) => (
          <div
            key={s.key}
            className="rounded-xl p-5 border"
            style={{ backgroundColor: "white", borderColor: COLORS.greige }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: `${s.tint}1a` }}
            >
              <s.icon size={18} color={s.tint} />
            </div>
            <p className="font-display text-2xl" style={{ color: COLORS.ink }}>
              {s.value}
            </p>
            <p className="text-xs mt-1" style={{ color: COLORS.sub }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* recent consignments */}
        <div
          className="lg:col-span-2 rounded-xl border overflow-hidden"
          style={{ backgroundColor: "white", borderColor: COLORS.greige }}
        >
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: COLORS.greige }}
          >
            <h2 className="font-display text-lg" style={{ color: COLORS.ink }}>
              {t("supplier.dashboard.recentConsignments")}
            </h2>
            <button
              onClick={() => navigate("/supplier/consignments")}
              className="flex items-center gap-1 text-xs font-medium"
              style={{ color: COLORS.leaf }}
            >
              {t("supplier.dashboard.viewAll")} <ArrowUpRight size={14} />
            </button>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: COLORS.sub }}>
                <th className="text-left font-medium px-5 py-3">{t("supplier.dashboard.table.consignment")}</th>
                <th className="text-left font-medium px-5 py-3">{t("supplier.dashboard.table.agent")}</th>
                <th className="text-left font-medium px-5 py-3">{t("supplier.dashboard.table.product")}</th>
                <th className="text-left font-medium px-5 py-3">{t("supplier.dashboard.table.qty")}</th>
                <th className="text-left font-medium px-5 py-3">{t("supplier.dashboard.table.status")}</th>
              </tr>
            </thead>
            <tbody>
              {recentConsignments.length === 0 && (
                <tr>
                  <td className="px-5 py-6 text-center" style={{ color: COLORS.sub }} colSpan={5}>
                    {t("supplier.dashboard.noConsignments")}
                  </td>
                </tr>
              )}
              {recentConsignments.map((c) => (
                <tr key={c.consigned_id} className="border-t" style={{ borderColor: COLORS.greige }}>
                  {/* Display-only ID prefix — schema's real key is the
                      plain integer consigned_id. Kept "CN-" here purely
                      as a cosmetic convention; not stored anywhere. */}
                  <td className="px-5 py-3 font-medium" style={{ color: COLORS.ink }}>
                    CN-{c.consigned_id}
                  </td>
                  <td className="px-5 py-3" style={{ color: COLORS.sub }}>
                    {trader(c.agent_name)}
                  </td>
                  {/* item_name/category are free-text from the supplier's
                      own supply record, not fixed translation keys — so
                      they're rendered as-is rather than run through t(). */}
                  <td className="px-5 py-3" style={{ color: COLORS.ink }}>
                    {c.item_name}
                  </td>
                  <td className="px-5 py-3" style={{ color: COLORS.sub }}>
                    {c.quantity_consigned?.toLocaleString()} {c.unit}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{
                        backgroundColor: STATUS_STYLE[c.status]?.bg,
                        color: STATUS_STYLE[c.status]?.text,
                      }}
                    >
                      {/* new i18n keys needed:
                          supplier.dashboard.consignmentStatus.{pending,confirmed,completed,cancelled} */}
                      {t(`supplier.dashboard.consignmentStatus.${c.status}`)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* alerts / side panel */}
        <div className="flex flex-col gap-6">
          <div
            className="rounded-xl p-5 border"
            style={{ backgroundColor: COLORS.forest, borderColor: COLORS.forest }}
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={16} color={COLORS.gold} />
              <h3 className="font-display text-base text-white">{t("supplier.dashboard.lowStockAlerts")}</h3>
            </div>
            {lowStockItems.length === 0 ? (
              <p className="text-sm" style={{ color: "#c9d9c2" }}>
                {t("supplier.dashboard.noLowStock")}
              </p>
            ) : (
              <ul className="space-y-2.5 text-sm">
                {lowStockItems.map((item) => (
                  <li key={item.supply_id} className="flex items-center justify-between">
                    <span style={{ color: "#c9d9c2" }}>{item.item_name}</span>
                    <span className="text-white font-medium">
                      {t("supplier.common.kgLeft", { qty: item.current_stock, unit: item.unit })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div
            className="rounded-xl p-5 border"
            style={{ backgroundColor: "white", borderColor: COLORS.greige }}
          >
            <h3 className="font-display text-base mb-4" style={{ color: COLORS.ink }}>
              {t("supplier.dashboard.thisMonth")}
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span style={{ color: COLORS.sub }}>{t("supplier.dashboard.totalConsigned")}</span>
                <span className="font-medium" style={{ color: COLORS.ink }}>
                  {monthConsignmentStats.totalConsigned.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: COLORS.sub }}>{t("supplier.dashboard.totalSold")}</span>
                <span className="font-medium" style={{ color: COLORS.ink }}>
                  {monthConsignmentStats.totalSold.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: COLORS.sub }}>{t("supplier.dashboard.settlementsReceived")}</span>
                <span className="font-medium" style={{ color: COLORS.leaf }}>
                  {t("supplier.common.currency")} {ledgerStats.settlementsReceivedThisMonth.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
