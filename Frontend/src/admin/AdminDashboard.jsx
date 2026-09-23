import { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  ShoppingBasket,
  Truck,
  Wheat,
  Coins,
  Receipt,
  Wallet,
  AlertTriangle,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import Topbar from "./Topbar";
import { getDashboardStats, getPendingAgents } from "../handlers/admin";

/**
 * AdminDashboard.jsx
 *
 * Admin's landing page. Per the V2 spec, Admin is read-only / monitoring-only:
 * this page surfaces system-level numbers (agents, buyers, suppliers, sales,
 * commission, payments, outstanding balances) and — the one actionable item
 * Admin has — the count of commission agents waiting on approval.
 *
 * Visual system matches LoginPage.jsx: Fraunces for display type, Inter for
 * body, Noto Nastaliq Urdu when RTL is active, same forest/gold palette,
 * colors applied via inline style (not Tailwind arbitrary-value classes) so
 * it lines up with the rest of the app.
 *
 * Expects two handlers on ../handlers/admin.js:
 *   getDashboardStats()  -> { agents: {...}, buyers: {...}, suppliers: {...},
 *                             sales: {...}, commission: {...}, payments: {...},
 *                             outstanding: {...} }
 *   getPendingAgents()   -> array of pending commission_agent records
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

const currency = (value) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

const count = (value) => new Intl.NumberFormat("en-PK").format(value ?? 0);

const TONE = {
  neutral: { accent: COLORS.ink, tint: COLORS.greige },
  positive: { accent: COLORS.forest, tint: "#e8f0e4" },
  alert: { accent: COLORS.errorText, tint: COLORS.errorBg },
  gold: { accent: COLORS.goldDark, tint: "#fdf3de" },
  muted: { accent: COLORS.muted, tint: COLORS.greige },
};

function StatCard({ icon: Icon, label, value, tone = "neutral", sublabel, isRTL }) {
  const { accent, tint } = TONE[tone];
  return (
    <div
      className="flex flex-col gap-2 rounded-xl p-4 border"
      style={{ borderColor: COLORS.border, backgroundColor: "white" }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: tint }}
        >
          <Icon size={16} color={accent} />
        </div>
        <span className="text-xs font-medium" style={{ color: COLORS.muted }}>
          {label}
        </span>
      </div>
      <span
        className={`text-2xl leading-tight ${isRTL ? "font-urdu" : "font-display"}`}
        style={{ color: COLORS.ink }}
      >
        {value}
      </span>
      {sublabel ? (
        <span className="text-xs" style={{ color: COLORS.muted }}>
          {sublabel}
        </span>
      ) : null}
    </div>
  );
}

function StatSection({ title, children }) {
  return (
    <section className="mb-9">
      <h2
        className="font-display text-lg mb-3 pb-2 border-b"
        style={{ color: COLORS.ink, borderColor: COLORS.border }}
      >
        {title}
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{children}</div>
    </section>
  );
}

export default function AdminDashboard() {
  const { t, isRTL } = useLanguage();
  const [stats, setStats] = useState(null);
  const [pendingAgents, setPendingAgents] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("loading");
      try {
        const [statsRes, pendingRes] = await Promise.all([
          getDashboardStats(),
          getPendingAgents(),
        ]);
        if (cancelled) return;
        setStats(statsRes);
        setPendingAgents(pendingRes ?? []);
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load admin dashboard:", err);
        setStatus("error");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const pendingCount = pendingAgents.length;

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
        <header className="flex items-end justify-between gap-6 pb-5 mb-7 border-b" style={{ borderColor: COLORS.border }}>
          <div>
            <h1 className={`text-3xl mb-1 ${isRTL ? "font-urdu" : "font-display"}`} style={{ color: COLORS.ink }}>
              {t("admin.dashboard.title")}
            </h1>
            <p className="text-sm max-w-[46ch]" style={{ color: COLORS.muted }}>
              {t("admin.dashboard.subtitle")}
            </p>
          </div>
          {status === "ready" && (
            <span className="text-xs whitespace-nowrap pb-1" style={{ color: COLORS.muted }}>
              {t("admin.dashboard.updatedAt", {
                time: new Date().toLocaleTimeString(isRTL ? "ur-PK" : "en-PK", {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              })}
            </span>
          )}
        </header>

        {status === "loading" && (
          <div className="flex items-center justify-center gap-2 py-16 text-sm" style={{ color: COLORS.muted }}>
            <Loader2 size={16} className="animate-spin" />
            {t("admin.dashboard.loading")}
          </div>
        )}

        {status === "error" && (
          <div className="text-sm rounded-lg px-4 py-3 mb-6" style={{ backgroundColor: COLORS.errorBg, color: COLORS.errorText }}>
            {t("admin.dashboard.error")}
          </div>
        )}

        {status === "ready" && (
          <>
            {pendingCount > 0 ? (
              <Link
                to="/admin/agents"
                className="flex items-center gap-3 rounded-xl px-4 py-3.5 mb-8 no-underline transition-transform active:scale-[0.99]"
                style={{ backgroundColor: COLORS.errorBg }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "white" }}
                >
                  <Clock size={16} color={COLORS.errorText} />
                </div>
                <span className="text-sm" style={{ color: COLORS.ink }}>
                  <strong style={{ color: COLORS.errorText }}>{count(pendingCount)}</strong>{" "}
                  {pendingCount === 1
                    ? t("admin.dashboard.pendingBanner.singular")
                    : t("admin.dashboard.pendingBanner.plural")}
                </span>
                <span
                  className={`flex items-center gap-1 text-sm font-medium ${isRTL ? "mr-auto" : "ml-auto"}`}
                  style={{ color: COLORS.errorText }}
                >
                  {t("admin.dashboard.reviewPending")}
                  <ArrowRight size={14} className={isRTL ? "rotate-180" : ""} />
                </span>
              </Link>
            ) : (
              <div
                className="flex items-center gap-3 rounded-xl px-4 py-3.5 mb-8"
                style={{ backgroundColor: "#e8f0e4" }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "white" }}
                >
                  <UserCheck size={16} color={COLORS.forest} />
                </div>
                <span className="text-sm" style={{ color: COLORS.ink }}>
                  {t("admin.dashboard.noPending")}
                </span>
              </div>
            )}

            <StatSection title={t("admin.dashboard.sections.agents")}>
              <StatCard icon={Users} label={t("admin.dashboard.stats.totalAgents")} value={count(stats?.agents?.total)} isRTL={isRTL} />
              <StatCard icon={UserCheck} label={t("admin.dashboard.stats.active")} value={count(stats?.agents?.active)} tone="positive" isRTL={isRTL} />
              <StatCard
                icon={Clock}
                label={t("admin.dashboard.stats.pendingApproval")}
                value={count(pendingCount)}
                tone={pendingCount > 0 ? "alert" : "neutral"}
                isRTL={isRTL}
              />
              <StatCard icon={UserX} label={t("admin.dashboard.stats.inactive")} value={count(stats?.agents?.inactive)} tone="muted" isRTL={isRTL} />
            </StatSection>

            <StatSection title={t("admin.dashboard.sections.buyersSuppliers")}>
              <StatCard icon={ShoppingBasket} label={t("admin.dashboard.stats.registeredBuyers")} value={count(stats?.buyers?.total)} isRTL={isRTL} />
              <StatCard icon={ShoppingBasket} label={t("admin.dashboard.stats.activeBuyers")} value={count(stats?.buyers?.active)} tone="positive" isRTL={isRTL} />
              <StatCard icon={Truck} label={t("admin.dashboard.stats.registeredSuppliers")} value={count(stats?.suppliers?.total)} isRTL={isRTL} />
              <StatCard icon={Truck} label={t("admin.dashboard.stats.activeSuppliers")} value={count(stats?.suppliers?.active)} tone="positive" isRTL={isRTL} />
            </StatSection>

            <StatSection title={t("admin.dashboard.sections.tradingActivity")}>
              <StatCard
                icon={Wheat}
                label={t("admin.dashboard.stats.totalSales")}
                value={currency(stats?.sales?.total_amount)}
                sublabel={t("admin.dashboard.stats.salesRecorded", { count: count(stats?.sales?.total_count) })}
                isRTL={isRTL}
              />
              <StatCard
                icon={Coins}
                label={t("admin.dashboard.stats.commissionEarned")}
                value={currency(stats?.commission?.total_amount)}
                tone="gold"
                isRTL={isRTL}
              />
            </StatSection>

            <StatSection title={t("admin.dashboard.sections.paymentsBalances")}>
              <StatCard
                icon={Receipt}
                label={t("admin.dashboard.stats.receivedFromBuyers")}
                value={currency(stats?.payments?.received_from_buyers)}
                tone="positive"
                isRTL={isRTL}
              />
              <StatCard
                icon={Wallet}
                label={t("admin.dashboard.stats.paidToSuppliers")}
                value={currency(stats?.payments?.paid_to_suppliers)}
                isRTL={isRTL}
              />
              <StatCard
                icon={AlertTriangle}
                label={t("admin.dashboard.stats.outstandingBuyers")}
                value={currency(stats?.outstanding?.buyers)}
                tone="alert"
                isRTL={isRTL}
              />
              <StatCard
                icon={AlertTriangle}
                label={t("admin.dashboard.stats.outstandingSuppliers")}
                value={currency(stats?.outstanding?.suppliers)}
                tone="alert"
                isRTL={isRTL}
              />
            </StatSection>
          </>
        )}
      </div>
    </div>
  );
}